import { useMemo } from "react";
import { ean13Bars } from "../../lib/barcode";

const HEIGHT = 40;

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
