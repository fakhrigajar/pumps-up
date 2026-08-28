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

const QUIET_LEFT = 11;
const QUIET_RIGHT = 7;

export const BARCODE_LENGTH = 13;

export function checkDigit(digits) {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    sum += Number(digits[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

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

function fnv1a(text, seed) {
  let hash = seed;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const PREFIX = "2";

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
