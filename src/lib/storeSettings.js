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
  version: SETTINGS_VERSION,
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

export function minutesToClock(minutes) {
  const whole = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(
    whole % 60,
  ).padStart(2, "0")}`;
}

export function minutesFromClock(timestamp, clock) {
  const target = clockToMinutes(clock);
  if (target === null) return null;
  const at = new Date(timestamp);
  return at.getHours() * 60 + at.getMinutes() - target;
}

export function isKnownCurrency(code) {
  return CURRENCIES.some((currency) => currency.code === code);
}

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
