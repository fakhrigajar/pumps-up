import { useEffect, useMemo, useRef, useState } from 'react'
import { IconCalendar, IconChevronDown, IconChevronLeft, IconChevronRight } from '../Icons'
import {
  addMonths,
  daySelection,
  isoParts,
  isWithin,
  monthGrid,
  monthSelection,
  orderRange,
  rangeSelection,
  todayIso,
  yearSelection,
} from '../../lib/dates'
import {
  formatDate,
  formatMonthLong,
  formatMonthShort,
  formatSelection,
  formatWeekdayShort,
} from '../../lib/format'
import { useTranslation } from '../../i18n/context'

const MODES = ['day', 'month', 'year', 'range']
const YEAR_PAGE = 12

function triggerLabel(selection, t) {
  const period = formatSelection(selection)
  return selection.mode === 'day' && selection.start === todayIso()
    ? `${t('cal.today')} · ${period}`
    : period
}

export function CalendarPicker({ selection, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface-1 px-3 text-[13px] font-medium text-ink-1 hover:bg-surface-2"
      >
        <IconCalendar className="h-4 w-4 text-ink-3" />
        <span className="tabular-nums">{triggerLabel(selection, t)}</span>
        <IconChevronDown className="h-4 w-4 text-ink-3" />
      </button>

      {open ? (
        <CalendarPanel
          selection={selection}
          onPick={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CalendarPanel({ selection, onPick }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState(selection.mode)
  const [view, setView] = useState(() => {
    const { year, monthIndex } = isoParts(selection.start)
    return { year, monthIndex }
  })
  const [pendingStart, setPendingStart] = useState(null)
  const [hovered, setHovered] = useState(null)

  function pickMode(next) {
    setMode(next)
    setPendingStart(null)
  }

  return (
    <div
      role="dialog"
      aria-label={t('cal.label')}
      className="absolute left-0 top-full z-30 mt-1.5 w-[304px] rounded-card border border-line bg-surface-1 p-3 shadow-pop"
    >
      <div className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
        {MODES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => pickMode(id)}
            aria-pressed={mode === id}
            className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
              mode === id
                ? 'bg-surface-1 text-ink-1 shadow-card'
                : 'text-ink-3 hover:text-ink-1'
            }`}
          >
            {t(`cal.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {mode === 'year' ? (
          <YearGrid selection={selection} view={view} onView={setView} onPick={onPick} />
        ) : mode === 'month' ? (
          <MonthGrid selection={selection} view={view} onView={setView} onPick={onPick} />
        ) : (
          <DayGrid
            mode={mode}
            selection={selection}
            view={view}
            onView={setView}
            pendingStart={pendingStart}
            hovered={hovered}
            onHover={setHovered}
            onPick={(iso) => {
              if (mode === 'day') return onPick(daySelection(iso))
              if (!pendingStart) {
                setPendingStart(iso)
                return undefined
              }
              onPick(rangeSelection(pendingStart, iso))
              return setPendingStart(null)
            }}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <p className="text-[11.5px] text-ink-3">
          {mode === 'range'
            ? t(pendingStart ? 'cal.pickEnd' : 'cal.pickStart')
            : t(`cal.hint.${mode}`)}
        </p>
        <button
          type="button"
          onClick={() => onPick(daySelection(todayIso()))}
          className="text-[12px] font-medium text-accent hover:underline"
        >
          {t('cal.today')}
        </button>
      </div>
    </div>
  )
}

function Pager({ label, onPrev, onNext }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between px-0.5">
      <PagerButton onClick={onPrev} label={t('cal.prev')}>
        <IconChevronLeft className="h-4 w-4" />
      </PagerButton>
      <span className="text-[13px] font-semibold text-ink-1">{label}</span>
      <PagerButton onClick={onNext} label={t('cal.next')}>
        <IconChevronRight className="h-4 w-4" />
      </PagerButton>
    </div>
  )
}

function PagerButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="rounded-md p-1 text-ink-2 hover:bg-surface-2 hover:text-ink-1"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function DayGrid({ mode, selection, view, onView, pendingStart, hovered, onHover, onPick }) {
  const weeks = useMemo(() => monthGrid(view.year, view.monthIndex), [view])
  const today = todayIso()

  const preview =
    mode === 'range' && pendingStart && hovered
      ? orderRange(pendingStart, hovered)
      : null

  return (
    <div>
      <Pager
        label={formatMonthLong(view.year, view.monthIndex)}
        onPrev={() => onView(addMonths(view.year, view.monthIndex, -1))}
        onNext={() => onView(addMonths(view.year, view.monthIndex, 1))}
      />

      <div className="mt-2 grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            className="pb-1 text-center text-[11px] font-medium uppercase text-ink-3"
          >
            {formatWeekdayShort(index)}
          </span>
        ))}

        {weeks.flat().map((cell) => {
          const inSelection =
            (mode === 'range' || selection.mode === 'day' || selection.mode === 'range') &&
            isWithin(cell.iso, selection.start, selection.end)
          const inPreview = preview && isWithin(cell.iso, preview.start, preview.end)
          const isEdge =
            cell.iso === selection.start ||
            cell.iso === selection.end ||
            cell.iso === pendingStart
          const marked = (inSelection || inPreview) && isEdge

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onPick(cell.iso)}
              onPointerEnter={() => onHover(cell.iso)}
              onPointerLeave={() => onHover(null)}
              aria-label={formatDate(cell.iso)}
              aria-current={cell.iso === today ? 'date' : undefined}
              className={`relative h-8 text-[12.5px] tabular-nums transition-colors ${
                marked
                  ? 'rounded-md bg-accent font-semibold text-white'
                  : inSelection || inPreview
                    ? 'bg-accent-soft text-ink-1'
                    : cell.inMonth
                      ? 'rounded-md text-ink-1 hover:bg-surface-2'
                      : 'rounded-md text-ink-3/60 hover:bg-surface-2'
              }`}
            >
              {cell.day}
              {cell.iso === today && !marked ? (
                <span className="absolute inset-x-0 bottom-1 mx-auto block h-1 w-1 rounded-full bg-accent" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthGrid({ selection, view, onView, onPick }) {
  const active = isoParts(selection.start)
  return (
    <div>
      <Pager
        label={String(view.year)}
        onPrev={() => onView({ ...view, year: view.year - 1 })}
        onNext={() => onView({ ...view, year: view.year + 1 })}
      />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const chosen =
            selection.mode === 'month' &&
            active.year === view.year &&
            active.monthIndex === monthIndex
          return (
            <button
              key={monthIndex}
              type="button"
              onClick={() => onPick(monthSelection(view.year, monthIndex))}
              className={`rounded-md py-2 text-[12.5px] font-medium transition-colors ${
                chosen
                  ? 'bg-accent text-white'
                  : 'text-ink-1 hover:bg-surface-2'
              }`}
            >
              {formatMonthShort(view.year, monthIndex)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function YearGrid({ selection, view, onView, onPick }) {
  const active = isoParts(selection.start)
  const first = Math.floor(view.year / YEAR_PAGE) * YEAR_PAGE
  const years = Array.from({ length: YEAR_PAGE }, (_, index) => first + index)

  return (
    <div>
      <Pager
        label={`${years[0]} – ${years[years.length - 1]}`}
        onPrev={() => onView({ ...view, year: view.year - YEAR_PAGE })}
        onNext={() => onView({ ...view, year: view.year + YEAR_PAGE })}
      />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {years.map((year) => {
          const chosen = selection.mode === 'year' && active.year === year
          return (
            <button
              key={year}
              type="button"
              onClick={() => onPick(yearSelection(year))}
              className={`rounded-md py-2 text-[12.5px] font-medium tabular-nums transition-colors ${
                chosen ? 'bg-accent text-white' : 'text-ink-1 hover:bg-surface-2'
              }`}
            >
              {year}
            </button>
          )
        })}
      </div>
    </div>
  )
}
