
const MONTHS_SHORT = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyn',
  'iyl',
  'avq',
  'sen',
  'okt',
  'noy',
  'dek',
]

const WEEKDAYS_SHORT = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz']

function compact(value, decimal) {
  const magnitude = Math.abs(value)
  if (magnitude >= 1e9) return `${decimal(value / 1e9)} mlrd`
  if (magnitude >= 1e6) return `${decimal(value / 1e6)} mln`
  if (magnitude >= 1e3) return `${decimal(value / 1e3)} min`
  return decimal(value)
}

export const azFormats = {
  numberLocale: 'tr-TR',

  weekdayShort: (index) => WEEKDAYS_SHORT[index],
  monthShort: (monthIndex) => MONTHS_SHORT[monthIndex],
  monthYear: (year, monthIndex) => `${MONTHS_SHORT[monthIndex]} ${year}`,
  date: (year, monthIndex, day) => `${day} ${MONTHS_SHORT[monthIndex]} ${year}`,

  compact,
  compactCurrency: (value, decimal) => `₼${compact(value, decimal)}`,

  relative: (minutes) => {
    if (minutes < 60) return `${minutes} dəqiqə əvvəl`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} saat əvvəl`
    return `${Math.round(hours / 24)} gün əvvəl`
  },
}
