export const ACCENTS = [
  { id: "blue", labelKey: "accent.blue", light: "#2a78d6", dark: "#3987e5" },
  { id: "violet", labelKey: "accent.violet", light: "#6d4bd6", dark: "#8467e8" },
  { id: "magenta", labelKey: "accent.magenta", light: "#c33a86", dark: "#d2528f" },
  { id: "slate", labelKey: "accent.slate", light: "#4d5f75", dark: "#6b809b" },
];

export const DEFAULT_ACCENT = "blue";

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

export function accentTokens(id, theme) {
  const accent = findAccent(id)[theme === "dark" ? "dark" : "light"];
  const { surface, ratio } = SOFT[theme === "dark" ? "dark" : "light"];
  return { accent, soft: mix(accent, surface, ratio) };
}
