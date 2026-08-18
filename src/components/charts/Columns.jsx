import { useMemo, useState } from "react";
import { useMeasure } from "../../lib/useMeasure";
import { niceTicks } from "../../lib/format";
import { axisGutter, barPath, labelStride } from "./shapes";
import { CHROME, MARK } from "./tokens";
import { Tooltip } from "./Tooltip";

/**
 * Categories along the bottom, magnitude up the side — hours of the day,
 * days of the week, months of the year.
 *
 * A second series stands beside the first rather than on top of it: stacking
 * would make the total readable and the parts not, and the question these
 * charts are asked is how the two compare, not what they add up to.
 *
 * The hover target is the whole column slot rather than the bar itself, so a
 * quiet hour is as easy to inspect as a busy one — the mark for an hour that
 * took nothing is a few pixels tall, and nobody can point at it.
 */

const PLOT_HEIGHT = 176;
const AXIS_BAND = 22;
const PAD = { top: 10 };

/** Share of each slot left as breathing room between one column and the next. */
const SLOT_GAP = 0.3;

export function Columns({
  rows,
  series,
  formatTick,
  buildTooltip,
  ariaLabel,
}) {
  const [ref, width] = useMeasure();
  const [active, setActive] = useState(null);

  const height = PLOT_HEIGHT + AXIS_BAND;
  const innerHeight = PLOT_HEIGHT - PAD.top;

  const scale = useMemo(() => {
    const peak = rows.reduce(
      (max, row) => Math.max(max, ...row.values.map((value) => Math.max(0, value))),
      0,
    );
    return niceTicks(peak, 4);
  }, [rows]);

  const padLeft = axisGutter(scale.ticks.map(formatTick), 40, 12);
  const innerWidth = Math.max(0, width - padLeft);

  const slot = rows.length > 0 ? innerWidth / rows.length : 0;
  const groupWidth = slot * (1 - SLOT_GAP);
  const barWidth = Math.min(
    MARK.barMaxThickness,
    Math.max(
      2,
      (groupWidth - MARK.surfaceGap * (series.length - 1)) / series.length,
    ),
  );
  const groupSpan = barWidth * series.length + MARK.surfaceGap * (series.length - 1);

  const slotAt = (index) => padLeft + index * slot;
  const yAt = (value) => PAD.top + innerHeight - (value / scale.max) * innerHeight;
  const baseline = PAD.top + innerHeight;
  const stride = labelStride(rows.length, innerWidth, 34);

  const activeRow = active === null ? null : rows[active];

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && rows.length > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="block"
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
                x={padLeft - 8}
                y={yAt(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[11px] tabular-nums"
                style={{ fill: CHROME.muted }}
              >
                {formatTick(tick)}
              </text>
            </g>
          ))}

          {rows.map((row, index) => {
            const start = slotAt(index) + (slot - groupSpan) / 2;
            const dimmed = active !== null && active !== index;

            return (
              <g
                key={row.key}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              >
                <rect
                  x={slotAt(index)}
                  y={PAD.top}
                  width={slot}
                  height={innerHeight}
                  fill="transparent"
                />

                <g style={{ opacity: dimmed ? 0.45 : 1 }}>
                  {row.values.map((value, position) => {
                    const top = yAt(Math.max(0, value));
                    return (
                      <path
                        key={series[position].name}
                        d={barPath(
                          start + position * (barWidth + MARK.surfaceGap),
                          top,
                          barWidth,
                          baseline - top,
                          MARK.barRadius,
                        )}
                        style={{ fill: series[position].color }}
                      />
                    );
                  })}
                </g>
              </g>
            );
          })}

          {rows.map((row, index) =>
            index % stride === 0 || index === rows.length - 1 ? (
              <text
                key={row.key}
                x={slotAt(index) + slot / 2}
                y={PLOT_HEIGHT + 13}
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
          x={slotAt(active) + slot / 2}
          y={Math.min(...activeRow.values.map((value) => yAt(Math.max(0, value))))}
          width={width}
          {...buildTooltip(activeRow, active)}
        />
      ) : null}
    </div>
  );
}
