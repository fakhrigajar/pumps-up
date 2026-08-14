import { Card, CardHeader } from '../ui/Card'
import { PaymentTag } from '../ui/PaymentTag'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import { useTranslation } from '../../i18n/context'

const LIMIT = 8

export function RecentSales({ sales, products }) {
  const { t } = useTranslation()
  const rows = sales.slice(0, LIMIT)
  const stockOf = (sku) => products.find((product) => product.sku === sku)?.stock ?? 0

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={t('orders.title')}
        subtitle={t('orders.count', { count: rows.length })}
        action={
          <button type="button" className="text-[13px] font-medium text-accent hover:underline">
            {t('orders.viewAll')}
          </button>
        }
      />

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead>
            <tr className="border-y border-line bg-surface-2">
              <th scope="col" className="py-2 pl-5 pr-4 text-[12px] font-medium text-ink-3">
                {t('orders.col.order')}
              </th>
              <th scope="col" className="py-2 pr-4 text-[12px] font-medium text-ink-3">
                {t('orders.col.product')}
              </th>
              <th scope="col" className="py-2 pr-4 text-right text-[12px] font-medium text-ink-3">
                {t('orders.col.stock')}
              </th>
              <th scope="col" className="py-2 pr-4 text-right text-[12px] font-medium text-ink-3">
                {t('orders.col.value')}
              </th>
              <th scope="col" className="py-2 pr-5 text-[12px] font-medium text-ink-3">
                {t('orders.col.payment')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sale) => (
              <tr key={sale.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                <td className="whitespace-nowrap py-2.5 pl-5 pr-4">
                  <span className="font-medium tabular-nums text-ink-1">{sale.id}</span>
                  <span className="block text-[11.5px] text-ink-3">{formatDate(sale.date)}</span>
                </td>
                <td className="py-2.5 pr-4 text-ink-2">
                  <span className="block max-w-[220px] truncate font-medium text-ink-1">
                    {sale.name}
                  </span>
                  <span className="block text-[11.5px] tabular-nums text-ink-3">{sale.sku}</span>
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-ink-2">
                  {formatNumber(stockOf(sale.sku))}
                </td>
                <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-ink-1">
                  {formatCurrency(sale.soldFor * sale.qty)}
                </td>
                <td className="py-2.5 pr-5">
                  <PaymentTag method={sale.payment} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-ink-3">{t('orders.empty')}</p>
        ) : null}
      </div>
    </Card>
  )
}
