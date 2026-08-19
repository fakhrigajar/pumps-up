import { useMemo } from "react";
import { ean13Bars } from "../../lib/barcode";

const HEIGHT = 40;

/**
 * An EAN-13 symbol as inline SVG. The viewBox is in modules, so the element
 * scales to whatever box CSS gives it — `preserveAspectRatio="none"` lets
 * height and width be set independently, which changes how tall the bars are
 * without touching the widths a scanner measures against each other. The
 * quiet zones are inside that viewBox, so the clear paper either side scales
 * with the symbol instead of being the caller's problem.
 */
export function Barcode({ value, className = "", color = "currentColor" }) {
  const symbol = useMemo(() => ean13Bars(value), [value]);
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
