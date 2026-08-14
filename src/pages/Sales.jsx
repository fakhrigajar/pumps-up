import { useMemo, useState } from "react";
import { ProductSearch } from "../components/panels/ProductSearch";
import { ProductTable } from "../components/panels/ProductTable";
import { SaleBadge, SalePanel } from "../components/panels/SalePanel";
import { SellDialog } from "../components/panels/SellDialog";
import { filterProducts } from "../data/erp";
import { useTranslation } from "../i18n/context";

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
  barHeight,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selling, setSelling] = useState(false);

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

  return (
    <>
      <div
        style={{ paddingBottom: barHeight }}
        className="flex h-full min-h-0 flex-col"
      >
        <ProductSearch
          query={query}
          onQueryChange={setQuery}
          resultCount={filtered.length}
          totalCount={sellable.length}
        />

        <ProductTable
          products={filtered}
          title={t("sales.title")}
          hint={t("sales.hint")}
          isSelected={(product) => quantityOf(product.sku) > 0}
          onSelect={onAdd}
          badge={(product) => {
            const qty = quantityOf(product.sku);
            return qty > 0 ? <SaleBadge qty={qty} /> : null;
          }}
          filtering={query.trim().length > 0}
        />
      </div>

      <SalePanel
        height={barHeight}
        lines={saleLines}
        payment={payment}
        onPaymentChange={onPaymentChange}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onClear={onClear}
        onSell={() => setSelling(true)}
      />

      {selling && saleLines.length > 0 ? (
        <SellDialog
          lines={saleLines}
          payment={payment}
          onCancel={() => setSelling(false)}
          onConfirm={(sold) => {
            onSell(sold);
            setSelling(false);
          }}
        />
      ) : null}
    </>
  );
}
