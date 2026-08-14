import { useMemo, useState } from 'react'
import { FilterBar } from '../components/FilterBar'
import { StatTile } from '../components/StatTile'
import { ChartCard, DataTable } from '../components/charts/ChartCard'
import { RevenueTrend } from '../components/charts/RevenueTrend'
import { RankedBars } from '../components/charts/RankedBars'
import { RecentSales } from '../components/panels/RecentSales'
import { OutOfStock } from '../components/panels/OutOfStock'
import { ActivityLog } from '../components/panels/ActivityLog'
import { SERIES } from '../components/charts/tokens'
import { dateRanges, selectBestSellers, selectMonthRevenue, selectRealKpis } from '../data/erp'
import { isoParts } from '../lib/dates'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import { useTranslation } from '../i18n/context'

export function Dashboard({ products, sales, activityLog }) {
  const { t } = useTranslation()
  const [range, setRange] = useState('3m')
  const monthsBack = dateRanges.find((item) => item.id === range)?.monthsBack ?? 3

  const kpis = useMemo(() => selectRealKpis(sales, monthsBack), [sales, monthsBack])
  const bestSellers = useMemo(
    () => selectBestSellers(sales, products, monthsBack),
    [sales, products, monthsBack],
  )

  const monthRevenue = useMemo(() => selectMonthRevenue(sales), [sales])
  const monthTotal = monthRevenue.reduce((sum, row) => sum + row.revenue, 0)
  const revenueRows = useMemo(
    () =>
      monthRevenue.map((row) => ({
        key: row.date,
        label: String(isoParts(row.date).day),
        tooltipLabel: formatDate(row.date),
        revenue: row.revenue,
      })),
    [monthRevenue],
  )

  return (
    <div className="space-y-4">
      <FilterBar range={range} onRangeChange={setRange} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatTile key={kpi.id} {...kpi} label={t(kpi.labelKey)} note={t('kpi.vsPrevious')} />
        ))}
      </div>

      <ChartCard
        title={t('revenue.title')}
        subtitle={t('revenue.subtitle')}
        footer={
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] text-ink-2">{t('revenue.footer')}</span>
            <span className="text-[15px] font-semibold text-ink-1">
              {formatCurrency(monthTotal)}
            </span>
          </div>
        }
        table={
          <DataTable
            columns={[
              { key: 'date', label: t('revenue.col.date') },
              { key: 'revenue', label: t('revenue.revenue'), align: 'right' },
            ]}
            rows={monthRevenue.map((row) => ({
              key: row.date,
              date: formatDate(row.date),
              revenue: formatCurrency(row.revenue),
            }))}
          />
        }
      >
        <RevenueTrend rows={revenueRows} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title={t('topsku.title')}
          subtitle={t('topsku.subtitle')}
          table={
            <DataTable
              columns={[
                { key: 'product', label: t('topsku.col.product') },
                { key: 'units', label: t('topsku.col.units'), align: 'right' },
                { key: 'revenue', label: t('topsku.col.revenue'), align: 'right' },
              ]}
              rows={bestSellers.map((item) => ({
                key: item.sku,
                product: `${item.name} (${item.sku})`,
                units: formatNumber(item.units),
                revenue: formatCurrency(item.revenue),
              }))}
            />
          }
        >
          <RankedBars
            items={bestSellers.map((item) => ({ id: item.sku, name: item.name, value: item.units }))}
            colors={SERIES[0]}
            formatValue={formatNumber}
            ariaLabel={t('topsku.aria')}
            buildTooltip={(item) => {
              const product = bestSellers.find((seller) => seller.sku === item.id)
              return {
                title: item.name,
                rows: [
                  { name: t('topsku.units'), value: formatNumber(item.value) },
                  { name: t('topsku.col.revenue'), value: formatCurrency(product?.revenue ?? 0) },
                ],
                footer: product?.category ? t(`category.${product.category}`) : undefined,
              }
            }}
          />
        </ChartCard>

        <OutOfStock products={products} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentSales sales={sales} products={products} />
        </div>
        <ActivityLog entries={activityLog} />
      </div>
    </div>
  )
}
