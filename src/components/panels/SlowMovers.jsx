import { Card, CardHeader } from "../ui/Card";
import { formatPrice } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

/**
 * The other end of the best-seller list: what barely moved, or did not move
 * at all.
 *
 * It is a list rather than a chart because most of these bars would be zero,
 * and a row of empty bars says less than the two numbers that matter — how
 * few sold, and how many are still sitting on the shelf behind it.
 */
export function SlowMovers({ rows }) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col">
      <CardHeader title={t("dash.slow")} subtitle={t("dash.slow.sub")} />

      {rows.length === 0 ? (
        <p className="px-5 pb-6 pt-3 text-[13px] text-ink-3">
          {t("dash.slow.empty")}
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {rows.map((row) => (
            <li
              key={row.sku}
              className="flex items-center justify-between gap-3 px-5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] text-ink-1">{row.name}</p>
                <p className="text-[11.5px] tabular-nums text-ink-3">
                  {row.sku} · {t(`category.${row.category}`)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[12.5px] font-medium tabular-nums text-ink-1">
                  {t("dash.soldCount", { count: row.units })}
                </p>
                <p className="text-[11.5px] tabular-nums text-ink-3">
                  {row.units > 0
                    ? formatPrice(row.revenue)
                    : t("dash.inStock", { count: row.stock })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
