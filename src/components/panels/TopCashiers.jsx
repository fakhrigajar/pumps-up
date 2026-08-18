import { Card, CardHeader } from "../ui/Card";
import { SERIES } from "../charts/tokens";
import { formatPrice } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

/**
 * The counter, ranked.
 *
 * Revenue orders the list and the bar draws it, because it is the one figure
 * that means the same thing for everybody. Profit and orders sit beside it as
 * numbers rather than as bars of their own: three bars per row would be a
 * chart nobody can read across, and the ranking is what the panel is for.
 */
export function TopCashiers({ rows }) {
  const { t } = useTranslation();
  const peak = rows.reduce((max, row) => Math.max(max, row.revenue), 0) || 1;

  return (
    <Card className="flex flex-col">
      <CardHeader title={t("dash.cashiers")} subtitle={t("dash.cashiers.sub")} />

      {rows.length === 0 ? (
        <p className="px-5 pb-6 pt-3 text-[13px] text-ink-3">
          {t("dash.cashiers.empty")}
        </p>
      ) : (
        <ul className="space-y-3.5 px-5 pb-5 pt-4">
          {rows.map((row, index) => (
            <li key={row.cashier}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-4 shrink-0 text-[11.5px] tabular-nums text-ink-3">
                    {index + 1}
                  </span>
                  <span className="truncate text-[13px] font-medium text-ink-1">
                    {row.cashier}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink-1">
                  {formatPrice(row.revenue)}
                </span>
              </div>

              <div
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(row.revenue / peak) * 100}%`,
                    backgroundColor: SERIES[0],
                  }}
                />
              </div>

              <p className="mt-1.5 text-[11.5px] tabular-nums text-ink-3">
                {t("dash.profitOf", { value: formatPrice(row.profit) })} ·{" "}
                {t("reg.ordersCount", { count: row.orders })} ·{" "}
                {t("rep.units", { count: row.units })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
