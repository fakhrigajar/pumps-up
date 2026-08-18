/**
 * The shop's own settings: what it prices in, and when it is open.
 *
 * These are the shop rather than the reader — a currency is a property of the
 * till, not a preference of whoever is looking at it, and the working hours
 * are what a shift is judged against. They are kept apart from the theme and
 * the language for that reason: those are per-browser tastes, these are one
 * answer the whole shop shares.
 */

export const SETTINGS_VERSION = 1;

const STORAGE_KEY = "pumpsup.settings";

/**
 * What the till can be set to. The code is the record; the name is only how
 * the picker reads, and the symbol is drawn by `Intl` from the code so a
 * currency never has to be spelled out twice.
 */
export const CURRENCIES = [
  { code: "AZN", nameKey: "cur.AZN" },
  { code: "USD", nameKey: "cur.USD" },
  { code: "EUR", nameKey: "cur.EUR" },
  { code: "GBP", nameKey: "cur.GBP" },
  { code: "TRY", nameKey: "cur.TRY" },
  { code: "RUB", nameKey: "cur.RUB" },
];

export const DEFAULT_SETTINGS = {
  version: SETTINGS_VERSION,
  currency: "AZN",
  opensAt: "09:00",
  closesAt: "21:00",
};

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** A wall clock as minutes past midnight, or null if it is not one. Times are
 * held as "HH:MM" because that is what a time input speaks and what a person
 * reads; minutes are what arithmetic needs. */
export function clockToMinutes(clock) {
  const match = CLOCK_PATTERN.exec(clock ?? "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToClock(minutes) {
  const whole = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(
    whole % 60,
  ).padStart(2, "0")}`;
}

/** The minutes a timestamp sits from a wall clock on its own day: negative is
 * before the hour, positive is after it. */
export function minutesFromClock(timestamp, clock) {
  const target = clockToMinutes(clock);
  if (target === null) return null;
  const at = new Date(timestamp);
  return at.getHours() * 60 + at.getMinutes() - target;
}

export function isKnownCurrency(code) {
  return CURRENCIES.some((currency) => currency.code === code);
}

/**
 * Anything read back from storage is treated as a suggestion: a settings blob
 * written by an older version, or edited by hand, must not be able to leave
 * the app with a currency `Intl` cannot format or a closing time that is not
 * a time at all.
 */
export function normalizeSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const opensAt = clockToMinutes(source.opensAt) === null
    ? DEFAULT_SETTINGS.opensAt
    : source.opensAt;
  const closesAt = clockToMinutes(source.closesAt) === null
    ? DEFAULT_SETTINGS.closesAt
    : source.closesAt;

  return {
    version: SETTINGS_VERSION,
    currency: isKnownCurrency(source.currency)
      ? source.currency
      : DEFAULT_SETTINGS.currency,
    opensAt,
    closesAt,
  };
}

export function readSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeSettings(JSON.parse(stored)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A shop that cannot be remembered is still set for this session.
  }
}
