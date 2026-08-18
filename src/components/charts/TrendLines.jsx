import { useMemo, useState } from "react";
import { useMeasure } from "../../lib/useMeasure";
import { formatCurrencyCompact, niceTicks } from "../../lib/format";
import { areaPath, axisGutter, labelStride, linePath } from "./shapes";
import { CHROME, MARK } from "./tokens";
import { Tooltip } from "./Tooltip";

/**
 * One or more measures over the same days, on one axis.
 *
 * They share an axis because they share a unit — money against money is a
 * comparison the eye can make, and the gap between the two lines is itself
 * the thing being read. A second y-scale would let that gap say whatever the
 * scales were chosen to make it say.
 *
 * `rows[].values` is parallel to `series`, so a row never has to know what the
 * chart is called; it carries numbers in a fixed order and the series say what
 * they mean.
 */

const PLOT_HEIGHT = 218;
const AXIS_BAND = 24;
const PAD = { top: 10, bottom: 8 };

/** Two end labels sitting on top of each other are worse than none, so they
 * are pushed apart when the lines finish close together. */
const LABEL_SPACING = 15;

export function TrendLines({ rows, series, formatTooltip, ariaLabel }) {
  const [ref, width] = useMeasure();
  const [active, setActive] = useState(null);

  const height = PLOT_HEIGHT + AXIS_BAND;
  const innerHeight = PLOT_HEIGHT - PAD.top - PAD.bottom;

  const scale = useMemo(() => {
    const peak = rows.reduce(
      (max, row) => Math.max(max, ...row.values.map((value) => Math.max(0, value))),
      0,
    );
    return niceTicks(peak, 4);
  }, [rows]);

  const tickLabel = (tick) => (tick === 0 ? "0" : formatCurrencyCompact(tick));
  const last = rows[rows.length - 1];
  const endLabels = series.map((item, index) =>
    formatCurrencyCompact(last?.values[index] ?? 0),
  );

  const padLeft = axisGutter(scale.ticks.map(tickLabel));
  const padRight = axisGutter(endLabels, 44, 22);
  const innerWidth = Math.max(0, width - padLeft - padRight);

  const xAt = (index) =>
    padLeft +
    (rows.length <= 1 ? innerWidth / 2 : (index / (rows.length - 1)) * innerWidth);
  const yAt = (value) => PAD.top + innerHeight - (value / scale.max) * innerHeight;

  const baseline = PAD.top + innerHeight;
  const stride = labelStride(rows.length, innerWidth, 30);

  const lines = series.map((item, index) => ({
    ...item,
    points: rows.map((row, position) => ({
      x: xAt(position),
      y: yAt(row.values[index]),
    })),
  }));

  const labelSlots = useMemo(
    () => spreadLabels(lines.map((line) => line.points[line.points.length - 1]?.y ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, width, scale.max, series.length],
  );

  const activeRow = active === null ? null : rows[active];

  function handleMove(event) {
    if (!innerWidth || rows.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - padLeft) / innerWidth;
    const index = Math.round((rows.length <= 1 ? 0 : ratio) * (rows.length - 1));
    setActive(Math.min(rows.length - 1, Math.max(0, index)));
  }

  function handleKey(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActive((current) => {
      const next = (current ?? rows.length - 1) + (event.key === "ArrowRight" ? 1 : -1);
      return Math.min(rows.length - 1, Math.max(0, next));
    });
  }

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && rows.length > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onMouseMove={handleMove}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(rows.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKey}
          className="block outline-none"
        >
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={padLeft + innerWidth}
                y1={yAt(tick)}
                y2={yAt(tick)}
                strokeWidth="1"
                style={{ stroke: tick === 0 ? CHROME.axis : CHROME.grid }}
                shapeRendering="crispEdges"
              />
              <text
                x={padLeft - 10}
                y={yAt(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[11px] tabular-nums"
                style={{ fill: CHROME.muted }}
              >
                {tickLabel(tick)}
              </text>
            </g>
          ))}

          {/* The lead series gets the fill: two washes over each other would
              muddy both, and the second line reads as a line against it. */}
          {lines[0] ? (
            <path
              d={areaPath(lines[0].points, baseline)}
              style={{ fill: lines[0].color, opacity: MARK.areaOpacity }}
            />
          ) : null}

          {activeRow ? (
            <line
              x1={xAt(active)}
              x2={xAt(active)}
              y1={PAD.top}
              y2={baseline}
              strokeWidth="1"
              style={{ stroke: CHROME.axis }}
              shapeRendering="crispEdges"
            />
          ) : null}

          {lines.map((line) => (
            <path
              key={line.name}
              d={linePath(line.points)}
              fill="none"
              strokeWidth={MARK.lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: line.color }}
            />
          ))}

          {lines.map((line, index) => {
            const end = line.points[line.points.length - 1];
            return (
              <g key={line.name}>
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={MARK.dotRadius}
                  strokeWidth="2"
                  style={{ fill: line.color, stroke: CHROME.surface }}
                />
                <text
                  x={end.x + 10}
                  y={labelSlots[index]}
                  dominantBaseline="middle"
                  className="text-[12px] font-medium"
                  style={{ fill: line.color }}
                >
                  {endLabels[index]}
                </text>
              </g>
            );
          })}

          {activeRow
            ? lines.map((line) => (
                <circle
                  key={line.name}
                  cx={xAt(active)}
                  cy={line.points[active].y}
                  r={MARK.dotRadius}
                  strokeWidth="2"
                  style={{ fill: line.color, stroke: CHROME.surface }}
                />
              ))
            : null}

          {rows.map((row, index) =>
            index % stride === 0 || index === rows.length - 1 ? (
              <text
                key={row.key}
                x={xAt(index)}
                y={PLOT_HEIGHT + 14}
                textAnchor="middle"
                className="text-[11px]"
                style={{ fill: CHROME.muted }}
              >
                {row.label}
              </text>
            ) : null,
          )}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {activeRow ? (
        <Tooltip
          x={xAt(active)}
          y={Math.min(...lines.map((line) => line.points[active].y))}
          width={width}
          title={activeRow.tooltipLabel}
          rows={series.map((item, index) => ({
            name: item.name,
            value: formatTooltip(activeRow.values[index]),
            color: item.color,
          }))}
        />
      ) : null}
    </div>
  );
}

/** Keep end labels at least `LABEL_SPACING` apart, holding their order. */
function spreadLabels(positions) {
  const order = positions
    .map((y, index) => ({ y, index }))
    .sort((a, b) => a.y - b.y);

  const slots = [];
  let previous = -Infinity;
  for (const item of order) {
    const y = Math.max(item.y, previous + LABEL_SPACING);
    slots[item.index] = y;
    previous = y;
  }
  return slots;
}
