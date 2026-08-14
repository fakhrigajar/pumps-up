import { IconChevronDown } from './Icons'
import { dateRanges } from '../data/erp'
import { useTranslation } from '../i18n/context'

export function FilterBar({ range, onRangeChange }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label={t('filter.period')}
        value={range}
        onChange={onRangeChange}
        options={dateRanges.map((item) => ({ value: item.id, label: t(item.labelKey) }))}
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="relative flex h-9 items-center rounded-lg border border-line bg-surface-1 pl-3 pr-8 hover:bg-surface-2">
      <span className="mr-1.5 text-[13px] text-ink-3">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-[13px] font-medium text-ink-1 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-ink-3" />
    </label>
  )
}
