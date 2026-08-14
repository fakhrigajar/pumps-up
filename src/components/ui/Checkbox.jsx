import { useEffect, useRef } from "react";

/**
 * A native checkbox, tinted with the accent color. Native because it already
 * has the keyboard behaviour, the focus ring and the indeterminate state — the
 * last of which is a DOM property rather than an attribute, so it has to be
 * set through a ref.
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

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      title={label}
      style={{ accentColor: "var(--series-1)" }}
      className={`h-4 w-4 shrink-0 cursor-pointer ${className}`}
    />
  );
}
