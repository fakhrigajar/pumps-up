/**
 * What a print run is allowed to be: how many labels, and how big.
 *
 * Separate from the sheet that draws them so the dialog collecting these
 * numbers and the page holding the last-used size can read them without
 * importing a component.
 */

/**
 * Enough to tag a delivery several times over, and low enough that a typo in
 * the quantity field costs a validation message rather than a thousand pages.
 */
export const MAX_LABELS_PER_PRODUCT = 999;

/**
 * A whole job is capped too, because the per-product cap says nothing about
 * ticking the entire catalogue: every label is an SVG symbol on a page of its
 * own, and a five-figure job would lock the browser up long before it reached
 * the printer. The message says how to get the rest printed.
 */
export const MAX_LABELS_PER_JOB = 1000;

/** Millimetres. The floor is about where a 13-digit symbol stops being worth
 * scanning; the ceiling is the long edge of A4. */
export const LABEL_MIN_MM = 20;
export const LABEL_MAX_MM = 297;

/**
 * `width` and `height` are the physical stock loaded in the printer, and stay
 * that way — `rotate` turns the *design* a quarter turn inside it. The two are
 * different knobs: a 40 × 58 label is 40 × 58 whichever way the artwork runs,
 * and a printer that feeds it one way round cannot be argued with.
 */
export const DEFAULT_LABEL_LAYOUT = { width: 50, height: 50, rotate: false };
