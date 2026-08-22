/**
 * Ported from src/lib/storeSettings.js on the client — the validation and
 * defaults only; the localStorage read/write pair does not apply here, the
 * database is the store now.
 */

export const SETTINGS_VERSION = 1;

export const CURRENCIES = [
  { code: "AZN", nameKey: "cur.AZN" },
  { code: "USD", nameKey: "cur.USD" },
  { code: "EUR", nameKey: "cur.EUR" },
  { code: "GBP", nameKey: "cur.GBP" },
  { code: "TRY", nameKey: "cur.TRY" },
  { code: "RUB", nameKey: "cur.RUB" },
];

export const DEFAULT_SETTINGS = {
  currency: "AZN",
  opensAt: "09:00",
  closesAt: "21:00",
};

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function clockToMinutes(clock) {
  const match = CLOCK_PATTERN.exec(clock ?? "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isKnownCurrency(code) {
  return CURRENCIES.some((currency) => currency.code === code);
}

/** Anything coming in off a request body is untrusted the same way a stored
 * blob was on the client: an unknown currency or a malformed time falls back
 * to the current/default value rather than being written. */
export function normalizeSettings(input, current = DEFAULT_SETTINGS) {
  const source = input && typeof input === "object" ? input : {};
  const opensAt =
    clockToMinutes(source.opensAt) === null ? current.opensAt : source.opensAt;
  const closesAt =
    clockToMinutes(source.closesAt) === null ? current.closesAt : source.closesAt;

  return {
    currency: isKnownCurrency(source.currency) ? source.currency : current.currency,
    opensAt,
    closesAt,
  };
}
