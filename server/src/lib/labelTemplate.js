/**
 * Ported from src/lib/labelTemplate.js on the client — the validation
 * (`normalizeTemplate`) and defaults only. The style-computing helpers
 * (`canvasStyle`, `boxStyle`, `alignBox`) stay client-side; they exist to
 * position React elements, which only makes sense in a browser.
 */

const LABEL_MIN_MM = 20;
const LABEL_MAX_MM = 297;

export const TEMPLATE_VERSION = 1;

export const LABEL_ELEMENTS = [
  { id: "logo", kind: "logo" },
  { id: "store", kind: "text" },
  { id: "name", kind: "text" },
  { id: "barcode", kind: "barcode" },
  { id: "code", kind: "text" },
  { id: "price", kind: "text" },
];

export const FONT_WEIGHTS = [400, 500, 600, 700];
export const ALIGNMENTS = ["left", "center", "right"];
export const MARGIN_MAX_MM = 8;
export const FONT_MIN_PT = 4;
export const FONT_MAX_PT = 48;
export const LINE_MIN = 0.8;
export const LINE_MAX = 2.5;
export const MIN_ELEMENT_W = 5;
export const MIN_ELEMENT_H = 3;
export const STORE_NAME_MAX = 48;

export const DEFAULT_TEMPLATE = {
  version: TEMPLATE_VERSION,
  width: 50,
  height: 50,
  rotate: false,
  margin: 2.5,
  storeName: "PUMPS UP BAKU",
  elements: {
    logo: { visible: false, x: 15, y: 0, w: 70, h: 12, align: "center" },
    store: {
      visible: true, x: 0, y: 0, w: 100, h: 12,
      fontSize: 8, fontWeight: 700, align: "center", lineHeight: 1.2,
    },
    name: {
      visible: true, x: 0, y: 14, w: 100, h: 26,
      fontSize: 10, fontWeight: 700, align: "center", lineHeight: 1.2,
    },
    barcode: { visible: true, x: 2, y: 43, w: 96, h: 26 },
    code: {
      visible: true, x: 0, y: 70, w: 100, h: 11,
      fontSize: 8, fontWeight: 400, align: "center", lineHeight: 1.2,
    },
    price: {
      visible: true, x: 0, y: 83, w: 100, h: 17,
      fontSize: 14, fontWeight: 700, align: "center", lineHeight: 1.2,
    },
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundGeometry = (value) => Math.round(value * 10) / 10;

function number(value, fallback, min, max, round = (n) => n) {
  const parsed = typeof value === "string" ? Number(value) : value;
  const usable = typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
  return round(clamp(usable, min, max));
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeBox(source, fallback) {
  const w = number(source.w, fallback.w, MIN_ELEMENT_W, 100, roundGeometry);
  const h = number(source.h, fallback.h, MIN_ELEMENT_H, 100, roundGeometry);
  return {
    x: number(source.x, fallback.x, 0, 100 - w, roundGeometry),
    y: number(source.y, fallback.y, 0, 100 - h, roundGeometry),
    w,
    h,
  };
}

function normalizeElement({ id, kind }, source, defaults) {
  const fallback = defaults[id];
  const raw = source && typeof source === "object" ? source : {};
  const box = normalizeBox(raw, fallback);

  const element = {
    visible: typeof raw.visible === "boolean" ? raw.visible : fallback.visible,
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
  };

  if (kind === "logo") {
    return { ...element, align: pick(raw.align, ALIGNMENTS, fallback.align) };
  }
  if (kind !== "text") return element;

  return {
    ...element,
    fontSize: number(raw.fontSize, fallback.fontSize, FONT_MIN_PT, FONT_MAX_PT),
    fontWeight: pick(
      typeof raw.fontWeight === "string" ? Number(raw.fontWeight) : raw.fontWeight,
      FONT_WEIGHTS,
      fallback.fontWeight,
    ),
    align: pick(raw.align, ALIGNMENTS, fallback.align),
    lineHeight: number(raw.lineHeight, fallback.lineHeight, LINE_MIN, LINE_MAX),
  };
}

export function normalizeTemplate(source) {
  const raw = source && typeof source === "object" ? source : {};
  const defaults = DEFAULT_TEMPLATE.elements;
  const storeName =
    typeof raw.storeName === "string"
      ? raw.storeName.slice(0, STORE_NAME_MAX)
      : DEFAULT_TEMPLATE.storeName;

  return {
    version: TEMPLATE_VERSION,
    width: number(raw.width, DEFAULT_TEMPLATE.width, LABEL_MIN_MM, LABEL_MAX_MM),
    height: number(raw.height, DEFAULT_TEMPLATE.height, LABEL_MIN_MM, LABEL_MAX_MM),
    rotate: raw.rotate === true,
    margin: number(raw.margin, DEFAULT_TEMPLATE.margin, 0, MARGIN_MAX_MM),
    storeName,
    elements: Object.fromEntries(
      LABEL_ELEMENTS.map((element) => [
        element.id,
        normalizeElement(element, raw.elements?.[element.id], defaults),
      ]),
    ),
  };
}
