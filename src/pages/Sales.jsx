import { useEffect, useMemo, useRef, useState } from "react";
import { ProductSearch } from "../components/panels/ProductSearch";
import { ProductTable } from "../components/panels/ProductTable";
import { SaleBadge, SalePanel } from "../components/panels/SalePanel";
import { SellDialog } from "../components/panels/SellDialog";
import { ReturnProductDialog } from "../components/panels/ProductDialogs";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { IconRegister, IconReturn } from "../components/Icons";
import { filterProducts } from "../data/erp";
import { formatClockTime, formatPrice } from "../lib/format";
import { sessionTotals } from "../data/register";
import { useTranslation } from "../i18n/context";
import { usePending } from "../lib/usePending";

export function Sales({
  products,
  lines,
  payment,
  onPaymentChange,
  onAdd,
  onQuantityChange,
  onRemove,
  onClear,
  onSell,
  onSellError,
  onReturn,
  barHeight,
  register,
  lastScan,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selling, setSelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const panelRef = useRef(null);

  const locked = register.required && !register.session;

  const sellable = useMemo(
    () => products.filter((product) => product.stock > 0),
    [products],
  );

  const filtered = useMemo(
    () => filterProducts(sellable, query),
    [sellable, query],
  );

  const saleLines = useMemo(
    () =>
      lines
        .map((line) => {
          const product = products.find((item) => item.sku === line.sku);
          return product ? { ...product, qty: line.qty } : null;
        })
        .filter(Boolean),
    [lines, products],
  );

  const quantityOf = (sku) => lines.find((line) => line.sku === sku)?.qty ?? 0;

  useEffect(() => {
    if (!lastScan) return;
    setQuery(lastScan.code);
    panelRef.current?.focus();
  }, [lastScan]);

  return (
    <>
      <div
        style={{ paddingBottom: barHeight }}
        className="flex h-full min-h-0 flex-col"
      >
        {register.required ? (
          <RegisterBar register={register} locked={locked} />
        ) : null}

        <ProductSearch
          query={query}
          onQueryChange={setQuery}
          resultCount={filtered.length}
          totalCount={sellable.length}
        />

        <ProductTable
          products={filtered}
          title={t("sales.title")}
          hint={locked ? t("reg.lockedHint") : t("sales.hint")}
          isSelected={(product) => quantityOf(product.sku) > 0}
          isDisabled={() => locked}
          onSelect={onAdd}
          badge={(product) => {
            const qty = quantityOf(product.sku);
            return qty > 0 ? <SaleBadge qty={qty} /> : null;
          }}
          filtering={query.trim().length > 0}
          actions={
            <Button
              onClick={() => setReturning(true)}
              disabled={locked}
              title={locked ? t("reg.lockedHint") : undefined}
            >
              <IconReturn className="h-4 w-4" />
              {t("sales.return")}
            </Button>
          }
        />
      </div>

      <SalePanel
        innerRef={panelRef}
        height={barHeight}
        lines={saleLines}
        payment={payment}
        onPaymentChange={onPaymentChange}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onClear={onClear}
        onSell={() => setSelling(true)}
        locked={locked}
      />

      {selling && saleLines.length > 0 ? (
        <SellDialog
          lines={saleLines}
          payment={payment}
          onCancel={() => setSelling(false)}
          onConfirm={async (sold) => {
            try {
              await onSell(sold);
              setSelling(false);
            } catch (error) {
              onSellError?.(error);
            }
          }}
        />
      ) : null}

      {returning ? (
        <ReturnProductDialog
          products={products}
          onCancel={() => setReturning(false)}
          onConfirm={async (sku, units, reason) => {
            await onReturn(sku, units, reason);
            setReturning(false);
          }}
        />
      ) : null}
    </>
  );
}

function RegisterBar({ register, locked }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [working, run] = usePending();

  const totals = register.session ? sessionTotals(register.session) : null;

  return (
    <div className="shrink-0 pb-4">
      <Card className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2"
          style={{ color: locked ? "var(--ink-3)" : "var(--status-good)" }}
        >
          <IconRegister className="h-[18px] w-[18px]" />
        </span>

        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-1">
            {locked
              ? t("reg.closed")
              : t("reg.openSince", {
                  time: formatClockTime(register.session.openedAt),
                })}
          </p>
          <p className="text-[12px] text-ink-3">
            {locked
              ? t("reg.closedHint")
              : `${t("reg.ordersCount", { count: totals.orders })} · ${t(
                  "reg.units",
                  {
                    count: totals.units,
                  },
                )} · ${formatPrice(totals.revenue)}`}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <p className="text-[12.5px] text-ink-2">
                {t("reg.confirmClose")}
              </p>
              <Button onClick={() => setConfirming(false)} disabled={working}>
                {t("dlg.cancel")}
              </Button>
              <Button
                variant="destructive"
                pending={working}
                onClick={() =>
                  run(register.onClose).then(() => setConfirming(false))
                }
              >
                {working ? t("reg.closing") : t("reg.close")}
              </Button>
            </>
          ) : locked ? (
            <Button
              variant="primary"
              pending={working}
              onClick={() => run(register.onOpen)}
            >
              {working ? null : <IconRegister className="h-4 w-4" />}
              {working ? t("reg.opening") : t("reg.openRegister")}
            </Button>
          ) : (
            <Button onClick={() => setConfirming(true)} disabled={working}>
              <IconRegister className="h-4 w-4" />
              {t("reg.close")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
