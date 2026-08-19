const L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];

/** Left-hand digits, even parity — the right-hand code, reversed. */
const G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];

/** Right-hand digits: the left-hand code inverted, so they start with a bar
 * and a scanner can tell which half of the symbol it is reading. */
const R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];

/** Which of the left six digits are set in G rather than L. The leading digit
 * is never drawn — this is the whole of how it is carried. */
const PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

const EDGE_GUARD = "101";
const CENTRE_GUARD = "01010";

/**
 * Clear paper either side of the symbol, in modules, as the spec asks for it.
 * Carried inside the viewBox rather than left to the caller's padding: the
 * quiet zone is part of what a scanner reads, and a symbol laid flush to the
 * edge of its box is one a till will refuse at the worst moment.
 */
const QUIET_LEFT = 11;
const QUIET_RIGHT = 7;

export const BARCODE_LENGTH = 13;

/**
 * The thirteenth digit of an EAN-13, given the twelve that precede it.
 *
 * Weights alternate 1 and 3 from the left, and the check digit is whatever
 * rounds that total up to the next multiple of ten — so a single wrong digit,
 * or two adjacent ones swapped, cannot leave the sum where it was.
 */
export function checkDigit(digits) {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    sum += Number(digits[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * The black bars of `value`, as `{ x, width }` in modules, plus the total
 * width so a caller can build a viewBox. Spaces are the gaps left between
 * them.
 *
 * Returns `null` for anything that is not a well-formed EAN-13, the failed
 * check digit included, so a caller renders nothing rather than a symbol that
 * scans as the wrong product — or that a scanner throws away in silence.
 */
export function ean13Bars(value) {
  const text = String(value);
  if (!/^\d{13}$/.test(text)) return null;
  if (Number(text[12]) !== checkDigit(text.slice(0, 12))) return null;

  const parity = PARITY[Number(text[0])];

  let modules = EDGE_GUARD;
  for (let index = 1; index <= 6; index += 1) {
    const table = parity[index - 1] === "L" ? L : G;
    modules += table[Number(text[index])];
  }
  modules += CENTRE_GUARD;
  for (let index = 7; index <= 12; index += 1) {
    modules += R[Number(text[index])];
  }
  modules += EDGE_GUARD;

  // Adjacent set modules are one bar, not several touching ones: a run of
  // three is a bar three modules wide, which is what the printer should lay
  // down and what the scanner will measure.
  const bars = [];
  let run = 0;
  for (let index = 0; index <= modules.length; index += 1) {
    if (modules[index] === "1") {
      run += 1;
      continue;
    }
    if (run > 0) bars.push({ x: QUIET_LEFT + index - run, width: run });
    run = 0;
  }

  return { bars, units: QUIET_LEFT + modules.length + QUIET_RIGHT };
}

/** FNV-1a, seeded, over `text`. */
function fnv1a(text, seed) {
  let hash = seed;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * GS1 reserves 20–29 for codes a shop assigns itself, which is exactly what
 * these are. Starting there is what keeps a shelf label off the number of
 * some real product on the same counter.
 */
const PREFIX = "2";

/** The digits the hash gets to choose: everything but the prefix and the
 * check digit it implies. */
const SPREAD = BARCODE_LENGTH - PREFIX.length - 1;

const values = new Map();

export function barcodeValue(sku) {
  const cached = values.get(sku);
  if (cached) return cached;

  const high = fnv1a(sku, 0x811c9dc5);
  const low = fnv1a(sku, 0x9e3779b9);
  const spread = (high * 100000 + (low % 100000)) % 10 ** SPREAD;

  const body = PREFIX + String(spread).padStart(SPREAD, "0");
  const value = body + checkDigit(body);

  values.set(sku, value);
  return value;
}
