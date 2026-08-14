/**
 * Code 11 (USD-8), the symbology on the shelf labels.
 *
 * It encodes the digits 0–9 and the dash, and nothing else — which is why a
 * label carries a *numeric* value derived from the product id rather than the
 * id itself ("PUNIKBLU192337" has letters Code 11 cannot express). Every
 * character is five elements wide, alternating bar–space–bar–space–bar, and
 * each element is either narrow (1 unit) or wide (2). A one-unit space
 * separates characters, and the same start/stop character opens and closes the
 * symbol.
 *
 * Check digits (the optional C and K of the spec) are deliberately left off, so
 * the digits printed under the bars are exactly the digits encoded in them.
 */

const PATTERNS = {
  0: "00001",
  1: "10001",
  2: "01001",
  3: "11000",
  4: "00101",
  5: "10100",
  6: "01100",
  7: "00011",
  8: "10010",
  9: "10000",
  "-": "00100",
};

const START_STOP = "00110";
const NARROW = 1;
const WIDE = 2;

/**
 * The black bars of `value`, as `{ x, width }` in symbol units, plus the total
 * width so a caller can build a viewBox. Spaces are the gaps left between
 * them. Returns `null` for anything Code 11 cannot encode, so a caller renders
 * nothing rather than a symbol that scans as the wrong product.
 */
export function code11Bars(value) {
  const text = String(value);
  if (!text || [...text].some((character) => !PATTERNS[character])) return null;

  const characters = [START_STOP, ...[...text].map((c) => PATTERNS[c]), START_STOP];
  const bars = [];
  let x = 0;

  characters.forEach((pattern, index) => {
    for (let element = 0; element < pattern.length; element += 1) {
      const width = pattern[element] === "1" ? WIDE : NARROW;
      // Even elements are bars, odd ones the spaces between them.
      if (element % 2 === 0) bars.push({ x, width });
      x += width;
    }
    if (index < characters.length - 1) x += NARROW;
  });

  return { bars, units: x };
}

export const BARCODE_LENGTH = 13;

/** FNV-1a, seeded, over `text`. */
function fnv1a(text, seed) {
  let hash = seed;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const values = new Map();

/**
 * The 13-digit number printed on a product's labels, derived from its id.
 *
 * Derived rather than stored: it is a pure function of the id, so a product
 * created today and the same product after a reload carry the same number
 * without a field to keep in sync — and a label printed months ago still
 * points at the row it was printed from. Two FNV-1a passes with different
 * seeds are folded together because one 32-bit pass is only ~9 digits of
 * spread; across a catalogue this size a collision is far below the odds of
 * the label peeling off.
 */
export function barcodeValue(sku) {
  const cached = values.get(sku);
  if (cached) return cached;

  const high = fnv1a(sku, 0x811c9dc5);
  const low = fnv1a(sku, 0x9e3779b9);
  const number = (high * 100000 + (low % 100000)) % 10 ** BARCODE_LENGTH;
  const value = String(number).padStart(BARCODE_LENGTH, "0");

  values.set(sku, value);
  return value;
}
