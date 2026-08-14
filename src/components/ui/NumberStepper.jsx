import { IconMinus, IconPlus } from "../Icons";

const SIZES = {
  md: { control: "h-9 w-9", input: "h-9 text-[13px]" },
  sm: { control: "h-7 w-7", input: "h-7 text-[12px]" },
};

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  size = "md",
  className = "",
  decreaseLabel,
  increaseLabel,
  inputProps = {},
}) {
  const scale = SIZES[size] ?? SIZES.md;
  const current = Number(value);
  const base =
    Number.isFinite(current) && value !== "" ? Math.round(current) : min;
  const atMin = base <= min;
  const atMax = base >= max;

  const nudge = (delta) =>
    onChange(String(Math.min(max, Math.max(min, base + delta))));

  return (
    <div className={`flex items-stretch ${className}`}>
      <StepButton
        onClick={() => nudge(-step)}
        disabled={atMin}
        label={decreaseLabel}
        side="left"
        scale={scale.control}
      >
        <IconMinus className="h-3.5 w-3.5" />
      </StepButton>

      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${scale.input} w-full border-y border-line bg-surface-2 px-1 text-center tabular-nums text-ink-1 placeholder:text-ink-3 focus:bg-surface-1`}
        {...inputProps}
      />

      <StepButton
        onClick={() => nudge(step)}
        disabled={atMax}
        label={increaseLabel}
        side="right"
        scale={scale.control}
      >
        <IconPlus className="h-3.5 w-3.5" />
      </StepButton>
    </div>
  );
}

function StepButton({ onClick, disabled, label, side, scale, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`${scale} flex shrink-0 items-center justify-center border border-line bg-surface-2 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-2 ${
        side === "left" ? "rounded-l-lg" : "rounded-r-lg"
      }`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
