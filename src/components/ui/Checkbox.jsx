import { useEffect, useRef } from "react";

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
