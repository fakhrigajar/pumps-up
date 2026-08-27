/**
 * The app's accent, as a short list of chosen colors rather than a free
 * picker.
 *
 * A hex field would let anyone set the accent to pale yellow, and every
 * primary button in the app carries white text on it — so the choice is made
 * from colors that have been checked against white in both themes, each at or
 * above the contrast the shipped blue already prints at (4.4 light, 3.6 dark).
 * The hues avoid the two other chart series (orange, green) and the fixed
 * status colors, so a recolored app still reads a chart and a warning.
 *
 * Each accent is two values, not one: the light theme's surfaces need a
 * deeper color than the dark theme's do, which is exactly why `--series-1` is
 * already defined twice in index.css.
 */
export const ACCENTS = [
  { id: "blue", labelKey: "accent.blue", light: "#2a78d6", dark: "#3987e5" },
  { id: "violet", labelKey: "accent.violet", light: "#6d4bd6", dark: "#8467e8" },
  { id: "magenta", labelKey: "accent.magenta", light: "#c33a86", dark: "#d2528f" },
  { id: "slate", labelKey: "accent.slate", light: "#4d5f75", dark: "#6b809b" },
];

/** What index.css defines on its own, and what an unreadable stored value
 * falls back to. */
export const DEFAULT_ACCENT = "blue";

/** The surface each theme's soft wash is mixed into, and how much of the
 * accent goes in. Taken from the shipped pair: 16% of #2a78d6 over the light
 * surface is #dae7f5 exactly, which is the value in the stylesheet. */
const SOFT = {
  light: { surface: "#fcfcfb", ratio: 0.16 },
  dark: { surface: "#1a1a19", ratio: 0.22 },
};

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const mix = (over, under, ratio) =>
  `#${channels(over)
    .map((value, index) =>
      Math.round(value * ratio + channels(under)[index] * (1 - ratio))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

export const findAccent = (id) =>
  ACCENTS.find((accent) => accent.id === id) ??
  ACCENTS.find((accent) => accent.id === DEFAULT_ACCENT);

/**
 * The two tokens an accent decides, for one theme: the color itself and the
 * wash of it that sits behind full-strength ink. The wash is mixed rather
 * than picked so a new accent cannot arrive without one, and so the pair can
 * never drift apart.
 */
export function accentTokens(id, theme) {
  const accent = findAccent(id)[theme === "dark" ? "dark" : "light"];
  const { surface, ratio } = SOFT[theme === "dark" ? "dark" : "light"];
  return { accent, soft: mix(accent, surface, ratio) };
}
