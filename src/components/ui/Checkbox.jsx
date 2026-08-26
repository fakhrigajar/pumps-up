import { useEffect, useRef } from "react";

/**
 * An iOS-style checkbox: a rounded tile that fills with the accent colour and
 * draws its tick on, rather than the native square.
 *
 * The control underneath is still a real checkbox, laid transparently over the
 * whole tile. That keeps the keyboard behaviour, the label association and the
 * indeterminate state — the last of which is a DOM property rather than an
 * attribute, so it has to be set through a ref — and it means clicking
 * anywhere on the tile is a click on the input itself.
 *
 * The root is a span rather than a label because two callers already wrap this
 * in a label of their own to put text beside it, and a label inside a label is
 * both invalid and a double toggle.
 *
 * What is drawn over the input is driven by the props rather than by `:checked`
 * because `peer-checked:` compiles to a sibling combinator, which cannot reach
 * past one level — and the tile needs two: a fill, and the tick above it. Focus
 * is the exception, since the ring sits on the tile itself: left in CSS, it
 * keeps following :focus-visible and so stays off after a plain click.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // Indeterminate outranks checked, the way the native control paints it: the
  // header box over a part-selected table is neither on nor off, and showing
  // it as on would be a lie about the rows underneath.
  const marked = checked || indeterminate;

  return (
    <span
      title={label}
      className={`group relative inline-block h-[18px] w-[18px] shrink-0 cursor-pointer select-none align-middle [-webkit-tap-highlight-color:transparent] ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />

      {/* Tile and tick move together, so the hover nudge does not slide one
          out from under the other. Pointer events belong to the input above. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[7px] transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 peer-focus-visible:ring-4 peer-focus-visible:ring-accent-soft ${
          marked ? "animate-check-pop" : ""
        }`}
      >
        <span
          className={`absolute inset-0 rounded-[7px] border-2 transition-colors duration-200 ease-out ${
            marked ? "border-accent bg-accent" : "border-axis bg-surface-1"
          }`}
        />

        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`absolute inset-0 m-auto h-[78%] w-[78%] text-white transition-transform duration-200 ease-out ${
            marked ? "scale-100" : "scale-0"
          }`}
        >
          {/* The tick is drawn on rather than switched on: dashed to its own
              length and unrolled by the offset, after the fill has landed. */}
          <path
            d={indeterminate ? "M5 12h14" : "M4 12L10 18L20 6"}
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-dasharray:40] transition-[stroke-dashoffset] delay-100 duration-300 ease-out"
            style={{ strokeDashoffset: marked ? 0 : 40 }}
          />
        </svg>
      </span>
    </span>
  );
}
