import { Card, CardHeader } from "../ui/Card";
import { LOW_STOCK_THRESHOLD } from "../../data/dashboard";
import { useTranslation } from "../../i18n/context";

const LIMIT = 7;

/**
 * What is about to run out — still sellable, but not for long.
 *
 * The bar is stock against the threshold rather than against the biggest row,
 * so the mark means the same thing every time the panel is drawn: a bar that
 * is nearly empty is nearly out of stock, not merely the smallest number on
 * screen today.
 */
export function LowStock({ products }) {
  const { t } = useTranslation();
  const rows = products.slice(0, LIMIT);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={t("dash.low")}
        subtitle={t("dash.low.sub", { count: LOW_STOCK_THRESHOLD })}
      />

      {rows.length === 0 ? (
        <p className="px-5 pb-6 pt-3 text-[13px] text-ink-3">
          {t("dash.low.empty")}
        </p>
      ) : (
        <ul className="space-y-3 px-5 pb-5 pt-4">
          {rows.map((product) => {
            const share = Math.min(1, product.stock / LOW_STOCK_THRESHOLD);
            const critical = product.stock <= 2;

            return (
              <li key={product.sku}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] text-ink-1">
                    {product.name}
                  </span>
                  <span
                    className="shrink-0 text-[12.5px] font-medium tabular-nums"
                    style={{
                      color: critical
                        ? "var(--status-critical)"
                        : "var(--status-warning)",
                    }}
                  >
                    {t("dash.left", { count: product.stock })}
                  </span>
                </div>

                <div
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(6, share * 100)}%`,
                      backgroundColor: critical
                        ? "var(--status-critical)"
                        : "var(--status-warning)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {products.length > LIMIT ? (
        <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-3">
          {t("dash.andMore", { count: products.length - LIMIT })}
        </p>
      ) : null}
    </Card>
  );
}
