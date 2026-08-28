import { LABEL_MAX_MM, LABEL_MIN_MM } from "./labels";

export const TEMPLATE_VERSION = 1;

export const LABEL_ELEMENTS = [
  { id: "logo", kind: "logo", labelKey: "lbl.el.logo" },
  { id: "store", kind: "text", labelKey: "lbl.el.store" },
  { id: "name", kind: "text", labelKey: "lbl.el.name" },
  { id: "color", kind: "text", labelKey: "lbl.el.color" },
  { id: "size", kind: "text", labelKey: "lbl.el.size" },
  { id: "barcode", kind: "barcode", labelKey: "lbl.el.barcode" },
  { id: "code", kind: "text", labelKey: "lbl.el.code" },
  { id: "price", kind: "text", labelKey: "lbl.el.price" },
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
    logo: {
      visible: false,
      x: 15,
      y: 0,
      w: 70,
      h: 12,
      align: "center",
    },
    store: {
      visible: true,
      x: 0,
      y: 0,
      w: 100,
      h: 11,
      fontSize: 8,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    name: {
      visible: true,
      x: 0,
      y: 12,
      w: 100,
      h: 15,
      fontSize: 10,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    color: {
      visible: true,
      x: 0,
      y: 27.5,
      w: 100,
      h: 7.5,
      fontSize: 7.5,
      fontWeight: 500,
      align: "center",
      lineHeight: 1.2,
    },
    size: {
      visible: true,
      x: 0,
      y: 35,
      w: 100,
      h: 7.5,
      fontSize: 7.5,
      fontWeight: 500,
      align: "center",
      lineHeight: 1.2,
    },
    barcode: {
      visible: true,
      x: 2,
      y: 43,
      w: 96,
      h: 24.5,
    },
    code: {
      visible: true,
      x: 0,
      y: 68,
      w: 100,
      h: 10,
      fontSize: 8,
      fontWeight: 400,
      align: "center",
      lineHeight: 1.2,
    },
    price: {
      visible: true,
      x: 0,
      y: 79.5,
      w: 100,
      h: 20.5,
      fontSize: 14,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
  },
};

export function canvasStyle(template) {
  return { inset: `${template.margin}mm` };
}

export function boxStyle({ x, y, w, h }) {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${w}%`,
    height: `${h}%`,
  };
}

export function alignBox(box, axis, position) {
  const room = 100 - (axis === "x" ? box.w : box.h);
  const value = position === "start" ? 0 : position === "end" ? room : room / 2;
  return { ...box, [axis]: roundGeometry(Math.max(0, value)) };
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const roundGeometry = (value) => Math.round(value * 10) / 10;

function number(value, fallback, min, max, round = (n) => n) {
  const parsed = typeof value === "string" ? Number(value) : value;
  const usable =
    typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
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

export function isSameTemplate(one, other) {
  return JSON.stringify(one) === JSON.stringify(other);
}

export function withElement(template, id, changes) {
  return normalizeTemplate({
    ...template,
    elements: {
      ...template.elements,
      [id]: { ...template.elements[id], ...changes },
    },
  });
}
