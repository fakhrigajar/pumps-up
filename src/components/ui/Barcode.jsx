import { useMemo } from "react";
import { code11Bars } from "../../lib/barcode";

const HEIGHT = 40;

/**
 * A Code 11 symbol as inline SVG. The viewBox is in symbol units, so the
 * element scales to whatever box CSS gives it — `preserveAspectRatio="none"`
 * lets height and width be set independently, which changes how tall the bars
 * are without touching the 1:2 narrow-to-wide ratio a scanner reads.
 */
export function Barcode({ value, className = "", color = "currentColor" }) {
  const symbol = useMemo(() => code11Bars(value), [value]);
  if (!symbol) return null;

  return (
    <svg
      viewBox={`0 0 ${symbol.units} ${HEIGHT}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-label={String(value)}
      className={className}
    >
      {symbol.bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y="0"
          width={bar.width}
          height={HEIGHT}
          fill={color}
        />
      ))}
    </svg>
  );
}
