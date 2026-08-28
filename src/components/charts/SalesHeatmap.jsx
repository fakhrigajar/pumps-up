import { useState } from "react";
import { useMeasure } from "../../lib/useMeasure";
import { Tooltip } from "./Tooltip";
import { MARK } from "./tokens";

const STEPS = [
  "var(--ordinal-1)",
  "var(--ordinal-2)",
  "var(--ordinal-3)",
  "var(--ordinal-4)",
  "var(--ordinal-5)",
];

const EMPTY = "var(--surface-2)";

const ROW_HEIGHT = 26;
const ROW_GAP = MARK.surfaceGap;
const LABEL_WIDTH = 92;
const AXIS_HEIGHT = 18;

const HOUR_LABEL_STEP = 3;

export function SalesHeatmap({ rows, hours, formatValue, ariaLabel, maxHeight }) {
  const [ref, width] = useMeasure();
  const [active, setActive] = useState(null);
  const [scrolled, setScrolled] = useState(0);

  const peak = rows.reduce(
    (top, row) => row.cells.reduce((best, cell) => Math.max(best, cell.value), top),
    0,
  );

  const gridWidth = Math.max(width - LABEL_WIDTH, 120);
  const cellWidth = gridWidth / Math.max(hours.length, 1);
  const height = rows.length * ROW_HEIGHT;

  const stepOf = (value) => {
    if (value <= 0) return -1;
    const share = peak > 0 ? value / peak : 0;
    return Math.min(STEPS.length - 1, Math.floor(share * STEPS.length - 1e-9));
  };

  return (
    <div ref={ref} className="relative w-full">
      <div
        style={{ maxHeight }}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop)}
        className="overflow-y-auto"
      >
        {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="block"
        >
          {rows.map((row, rowIndex) => (
            <g key={row.id}>
              <text
                x="0"
                y={rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2}
                dominantBaseline="middle"
                className="text-[11.5px] tabular-nums"
                style={{ fill: "var(--ink-2)" }}
              >
                {row.label}
              </text>

              {row.cells.map((cell, hourIndex) => {
                const step = stepOf(cell.value);
                const on = active?.row === rowIndex && active?.hour === hourIndex;

                return (
                  <rect
                    key={cell.hour}
                    x={LABEL_WIDTH + hourIndex * cellWidth}
                    y={rowIndex * ROW_HEIGHT}
                    width={Math.max(cellWidth - ROW_GAP, 1)}
                    height={ROW_HEIGHT - ROW_GAP}
                    rx="3"
                    style={{
                      fill: step < 0 ? EMPTY : STEPS[step],
                      stroke: on ? "var(--ink-1)" : "transparent",
                      strokeWidth: 1.5,
                    }}
                    onMouseEnter={() => setActive({ row: rowIndex, hour: hourIndex })}
                    onMouseLeave={() => setActive(null)}
                  />
                );
              })}
            </g>
          ))}

        </svg>
        ) : null}
      </div>

      {width > 0 ? (
        <svg width={width} height={AXIS_HEIGHT} className="block">
          {hours.map((hour, index) =>
            index % HOUR_LABEL_STEP === 0 ? (
              <text
                key={hour}
                x={LABEL_WIDTH + index * cellWidth}
                y={12}
                className="text-[11px] tabular-nums"
                style={{ fill: "var(--ink-3)" }}
              >
                {String(hour).padStart(2, "0")}
              </text>
            ) : null,
          )}
        </svg>
      ) : null}

      {active ? (
        <Tooltip
          x={LABEL_WIDTH + (active.hour + 0.5) * cellWidth}
          y={active.row * ROW_HEIGHT + ROW_HEIGHT / 2 - scrolled}
          width={width}
          title={rows[active.row].label}
          rows={[
            {
              name: `${String(hours[active.hour]).padStart(2, "0")}:00`,
              value: formatValue(rows[active.row].cells[active.hour].value),
            },
          ]}
          footer={rows[active.row].cells[active.hour].footer}
        />
      ) : null}
    </div>
  );
}

export function HeatmapLegend({ lowLabel, highLabel }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11.5px] text-ink-3">{lowLabel}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {STEPS.map((color) => (
          <span
            key={color}
            className="h-2.5 w-6 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="text-[11.5px] text-ink-3">{highLabel}</span>
    </div>
  );
}
