import { LABEL_MAX_MM, LABEL_MIN_MM } from "./labels";

/**
 * The label design: what a printed label carries, where each piece sits on it,
 * and how it is set.
 *
 * The stock (`width`, `height`, `rotate`) is the physical label; `margin` is
 * the quiet edge kept clear of ink, and what is left inside it is the canvas
 * every element is placed on. Element geometry is a *percentage of that
 * canvas* rather than millimetres, so a design drawn for 50 × 50 stock still
 * holds together when the same design is printed on 40 × 58 — the pieces keep
 * their relative places instead of sliding off the edge. Type is the exception
 * and is absolute (points): a 10 pt price is 10 pt on any stock, which is what
 * anyone setting a font size expects.
 *
 * Read from and written to local storage by LabelTemplateProvider, which is
 * why `normalizeTemplate` treats every field as untrusted: a design saved by
 * an older build, or edited by hand, must still print something sane.
 */

/** Bumped when the shape below changes in a way older saves cannot satisfy. */
export const TEMPLATE_VERSION = 1;

/**
 * The pieces of a label, in the order they are stacked by default — which is
 * also the order they are listed in the designer. `kind` decides what the
 * designer offers: text has type settings, the logo has an alignment inside
 * its box, the symbol only has a size.
 */
export const LABEL_ELEMENTS = [
  { id: "logo", kind: "logo", labelKey: "lbl.el.logo" },
  { id: "store", kind: "text", labelKey: "lbl.el.store" },
  { id: "name", kind: "text", labelKey: "lbl.el.name" },
  { id: "barcode", kind: "barcode", labelKey: "lbl.el.barcode" },
  { id: "code", kind: "text", labelKey: "lbl.el.code" },
  { id: "price", kind: "text", labelKey: "lbl.el.price" },
];

export const FONT_WEIGHTS = [400, 500, 600, 700];
export const ALIGNMENTS = ["left", "center", "right"];

/** Millimetres of stock kept clear of ink, at most. Past this a 20 mm label
 * would have nothing left to print on. */
export const MARGIN_MAX_MM = 8;

/** Points. The floor is around where a laser printer stops resolving a glyph;
 * the ceiling is taller than the shortest label allowed. */
export const FONT_MIN_PT = 4;
export const FONT_MAX_PT = 48;

export const LINE_MIN = 0.8;
export const LINE_MAX = 2.5;

/** Percent of the canvas. Small enough to place a single digit, large enough
 * that an element can never be resized down to something unclickable. */
export const MIN_ELEMENT_W = 5;
export const MIN_ELEMENT_H = 3;

export const STORE_NAME_MAX = 48;

/**
 * The design the shop prints today, and what Reset goes back to: the stack
 * that shipped before the label was designable, expressed in the model above.
 */
export const DEFAULT_TEMPLATE = {
  version: TEMPLATE_VERSION,
  width: 50,
  height: 50,
  rotate: false,
  margin: 2.5,
  storeName: "PUMPS UP BAKU",
  elements: {
    // Off to begin with: the shipped design says the shop's name in type, and
    // a label that suddenly grew a wordmark over it would be a surprise. The
    // box it switches on into is the wordmark's own proportions, near enough
    // that turning it on is not immediately a resizing job.
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
      h: 12,
      fontSize: 8,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    name: {
      visible: true,
      x: 0,
      y: 14,
      w: 100,
      h: 26,
      fontSize: 10,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    barcode: {
      visible: true,
      x: 2,
      y: 43,
      w: 96,
      h: 26,
    },
    code: {
      visible: true,
      x: 0,
      y: 70,
      w: 100,
      h: 11,
      fontSize: 8,
      fontWeight: 400,
      align: "center",
      lineHeight: 1.2,
    },
    price: {
      visible: true,
      x: 0,
      y: 83,
      w: 100,
      h: 17,
      fontSize: 14,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
  },
};

/** The area left inside the label's margin: everything is placed against it,
 * so widening the margin moves the whole design in rather than clipping it. */
export function canvasStyle(template) {
  return { inset: `${template.margin}mm` };
}

/** An element's box, as a share of that canvas. Shared with the designer,
 * which lays its drag handles over the real label — the two have to agree to
 * the pixel, so they are placed by the same function. */
export function boxStyle({ x, y, w, h }) {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${w}%`,
    height: `${h}%`,
  };
}

/**
 * An element pushed against an edge of the canvas, or centred on it — the same
 * six moves a drag can make by eye, made exactly. The other axis is left
 * alone, so aligning left never also moves an element up.
 */
export function alignBox(box, axis, position) {
  const room = 100 - (axis === "x" ? box.w : box.h);
  const value = position === "start" ? 0 : position === "end" ? room : room / 2;
  return { ...box, [axis]: roundGeometry(Math.max(0, value)) };
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Geometry is kept to one decimal: finer than a drag can be aimed, coarse
 * enough that the number fields stay readable. */
export const roundGeometry = (value) => Math.round(value * 10) / 10;

function number(value, fallback, min, max, round = (n) => n) {
  const parsed = typeof value === "string" ? Number(value) : value;
  const usable =
    typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
  // The fallback is clamped too: a stored width of 100 leaves no room for the
  // default x beside it, and the pair has to end up describing a box that fits.
  return round(clamp(usable, min, max));
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/**
 * A box clamped to the canvas. Width is settled first so that a stored `x`
 * can be held to what is left of the canvas beside it — the pair can never
 * describe an element hanging off the right edge, whatever was stored.
 */
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

  // The wordmark keeps its proportions inside whatever box it is given, so
  // alignment is where it sits in the leftover room.
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

/**
 * A complete, printable template built from whatever was passed in — every
 * missing or impossible field replaced by the default's. Keys are written in a
 * fixed order so two normalized templates can be compared as JSON.
 */
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

/** True when two normalized templates would print the same label. */
export function isSameTemplate(one, other) {
  return JSON.stringify(one) === JSON.stringify(other);
}

/** A template with one element's fields replaced, normalized on the way out. */
export function withElement(template, id, changes) {
  return normalizeTemplate({
    ...template,
    elements: {
      ...template.elements,
      [id]: { ...template.elements[id], ...changes },
    },
  });
}

const STORAGE_KEY = "pumpsup.labelTemplate";

export function readTemplate() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeTemplate(JSON.parse(stored)) : DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

export function writeTemplate(template) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  } catch {
    // A design that cannot be stored is still the design in use for this
    // session; a full or blocked store is not worth interrupting a print for.
  }
}
