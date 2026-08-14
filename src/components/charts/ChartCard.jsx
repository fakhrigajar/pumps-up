import { useId, useState } from 'react'
import { Card, CardHeader } from '../ui/Card'
import { Legend } from './Legend'
import { IconChart, IconTable } from '../Icons'
import { useTranslation } from '../../i18n/context'

export function ChartCard({ title, subtitle, legend, table, footer, children, className = '' }) {
  const [view, setView] = useState('chart')
  const panelId = useId()

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={table ? <ViewSwitch view={view} onChange={setView} controls={panelId} /> : null}
      />

      {legend?.length ? <Legend items={legend} className="px-5 pt-3" /> : null}

      <div id={panelId} className="min-w-0 flex-1 px-2 pb-4 pt-3 sm:px-4">
        {view === 'chart' ? children : <div className="px-1">{table}</div>}
      </div>

      {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
    </Card>
  )
}

function ViewSwitch({ view, onChange, controls }) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('chart.viewAs')}
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      <SwitchButton
        active={view === 'chart'}
        onClick={() => onChange('chart')}
        controls={controls}
        label={t('chart.chartView')}
      >
        <IconChart className="h-4 w-4" />
      </SwitchButton>
      <SwitchButton
        active={view === 'table'}
        onClick={() => onChange('table')}
        controls={controls}
        label={t('chart.tableView')}
      >
        <IconTable className="h-4 w-4" />
      </SwitchButton>
    </div>
  )
}

function SwitchButton({ active, onClick, controls, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-controls={controls}
      title={`${label} view`}
      className={`rounded-[6px] p-1.5 transition-colors ${
        active
          ? 'bg-surface-1 text-ink-1 shadow-card'
          : 'text-ink-3 hover:text-ink-1'
      }`}
    >
      {children}
      <span className="sr-only">{label} view</span>
    </button>
  )
}

export function DataTable({ columns, rows }) {
  return (
    <div className="max-h-[280px] overflow-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="sticky top-0 bg-surface-1">
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap py-2 pr-4 text-[12px] font-medium text-ink-3 ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-line last:border-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap py-2 pr-4 text-ink-2 ${
                    column.align === 'right' ? 'text-right tabular-nums text-ink-1' : ''
                  }`}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
