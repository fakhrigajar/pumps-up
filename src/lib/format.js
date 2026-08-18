
let locale = 'en-US'
let overrides = null
let currency = 'AZN'
let cache = build(locale)

function build(target) {
  return {
    plain: new Intl.NumberFormat(target),
    decimal: new Intl.NumberFormat(target, { maximumFractionDigits: 1 }),
    compact: new Intl.NumberFormat(target, { notation: 'compact', maximumFractionDigits: 1 }),
    amount: new Intl.NumberFormat(target, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    price: new Intl.NumberFormat(target, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    currency: new Intl.NumberFormat(target, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }),
    currencyCompact: new Intl.NumberFormat(target, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
    weekdayShort: new Intl.DateTimeFormat(target, { weekday: 'short' }),
    monthShort: new Intl.DateTimeFormat(target, { month: 'short' }),
    monthLong: new Intl.DateTimeFormat(target, { month: 'short', year: 'numeric' }),
    date: new Intl.DateTimeFormat(target, { day: 'numeric', month: 'short', year: 'numeric' }),
    time: new Intl.DateTimeFormat(target, { hour: '2-digit', minute: '2-digit' }),
    relative: new Intl.RelativeTimeFormat(target, { numeric: 'auto' }),
  }
}

export function setFormatLocale(target, formatOverrides = null) {
  if (target === locale && formatOverrides === overrides) return
  locale = target
  overrides = formatOverrides
  rebuild()
}

/**
 * The currency every price in the app is written in, set once from the store
 * settings. It lives here rather than being threaded through each call because
 * a price is formatted in some forty places and none of them has an opinion
 * about the currency — the shop does.
 */
export function setFormatCurrency(code) {
  if (code === currency) return
  currency = code
  rebuild()
}

/** For the one place that spells the currency out as text rather than
 * formatting an amount in it: the printed label. */
export function currencyCode() {
  return currency
}

function rebuild() {
  cache = build(overrides?.numberLocale ?? locale)
}

const decimal = (value) => cache.decimal.format(value)

export function formatNumber(value) {
  return cache.plain.format(Math.round(value))
}

export function formatCompactNumber(value) {
  if (Math.abs(value) < 1000) return cache.plain.format(Math.round(value))
  return overrides?.compact ? overrides.compact(value, decimal) : cache.compact.format(value)
}

export function formatCurrencyCompact(value) {
  if (overrides?.compactCurrency) return overrides.compactCurrency(value, decimal)
  return cache.currencyCompact.format(value)
}

export function formatCurrency(value) {
  return cache.currency.format(Math.round(value))
}

export function formatPrice(value) {
  return cache.price.format(value)
}

/** A price with no currency symbol, for the label that spells the currency
 * code out itself. */
export function formatAmount(value) {
  return cache.amount.format(value)
}

export function formatPercent(value, digits = 1) {
  return `${cache.plain.format(Number(value.toFixed(digits)))}%`
}

export function formatDelta(value, unit) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  const magnitude = cache.plain.format(Number(Math.abs(value).toFixed(1)))
  return unit === 'pp' ? `${sign}${magnitude} pp` : `${sign}${magnitude}%`
}

export function formatValue(value, format) {
  switch (format) {
    case 'currency':
      return formatCurrencyCompact(value)
    case 'currency0':
      return formatCurrency(value)
    case 'price':
      return formatPrice(value)
    case 'percent':
      return formatPercent(value)
    default:
      return formatCompactNumber(value)
  }
}

const WEEK_REFERENCE = new Date(2024, 0, 1)

export function formatWeekdayShort(index) {
  if (overrides?.weekdayShort) return overrides.weekdayShort(index)
  const date = new Date(WEEK_REFERENCE)
  date.setDate(date.getDate() + index)
  return cache.weekdayShort.format(date)
}

export function formatMonthShort(year, monthIndex) {
  if (overrides?.monthShort) return overrides.monthShort(monthIndex)
  return cache.monthShort.format(new Date(year, monthIndex, 1))
}

export function formatMonthLong(year, monthIndex) {
  if (overrides?.monthYear) return overrides.monthYear(year, monthIndex)
  return cache.monthLong.format(new Date(year, monthIndex, 1))
}

export function formatSelection(selection) {
  const [year, month] = selection.start.split('-').map(Number)
  switch (selection.mode) {
    case 'month':
      return formatMonthLong(year, month - 1)
    case 'year':
      return String(year)
    case 'range':
      return `${formatDate(selection.start)} – ${formatDate(selection.end)}`
    default:
      return formatDate(selection.start)
  }
}

export function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  if (overrides?.date) return overrides.date(year, month - 1, day)
  return cache.date.format(new Date(year, month - 1, day))
}

export function formatClockTime(timestamp) {
  return cache.time.format(timestamp)
}

export function formatMinutesAgo(minutes) {
  if (overrides?.relative) return overrides.relative(minutes)
  if (minutes < 60) return cache.relative.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return cache.relative.format(-hours, 'hour')
  return cache.relative.format(-Math.round(hours / 24), 'day')
}

export function niceTicks(max, count = 4) {
  if (!Number.isFinite(max) || max <= 0) return { ticks: [0], max: 1 }
  const rawStep = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) *
    magnitude
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Number(value.toFixed(6)))
  }
  return { ticks, max: top }
}
