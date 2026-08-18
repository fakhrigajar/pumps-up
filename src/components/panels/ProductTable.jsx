import { Card } from "../ui/Card";
import { Barcode } from "../ui/Barcode";
import { Checkbox } from "../ui/Checkbox";
import { barcodeValue } from "../../lib/barcode";
import { formatNumber, formatPrice } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

export function ProductTable({
  products,
  title,
  hint,
  actions,
  isSelected = () => false,
  onSelect,
  badge,
  isDisabled = () => false,
  filtering,
  selection,
  showBarcode = false,
}) {
  const { t } = useTranslation();

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-t-[11px] bg-surface-1 px-5 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{hint}</p>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table
          role="grid"
          aria-label={title}
          className="w-full border-separate border-spacing-0 text-left text-[13px]"
        >
          <thead>
            <tr>
              {selection ? (
                <th
                  scope="col"
                  className="sticky top-0 z-[5] w-10 border-y border-line bg-surface-2 py-2 pl-5 pr-2"
                >
                  <Checkbox
                    checked={selection.allChecked}
                    indeterminate={
                      selection.someChecked && !selection.allChecked
                    }
                    onChange={selection.onToggleAll}
                    label={t("inv.selectAll")}
                  />
                </th>
              ) : null}
              <th
                scope="col"
                className={`sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-[12px] font-medium text-ink-3 ${
                  selection ? "" : "pl-5"
                }`}
              >
                {t("inv.col.product")}
              </th>
              <th
                scope="col"
                className="sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-right text-[12px] font-medium text-ink-3"
              >
                {t("inv.col.price")}
              </th>
              <th
                scope="col"
                className={`sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-right text-[12px] font-medium text-ink-3 ${
                  showBarcode ? "" : "pr-5"
                }`}
              >
                {t("inv.col.stock")}
              </th>
              {showBarcode ? (
                <th
                  scope="col"
                  className="sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-5 text-right text-[12px] font-medium text-ink-3"
                >
                  {t("inv.col.barcode")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const selected = isSelected(product);
              const disabled = isDisabled(product);
              const cellBorder =
                index === products.length - 1 ? "" : "border-b border-line";
              const activate = () => {
                if (!disabled) onSelect(product);
              };

              return (
                <tr
                  key={product.sku}
                  aria-selected={selected}
                  aria-disabled={disabled || undefined}
                  tabIndex={disabled ? -1 : 0}
                  onClick={activate}
                  onKeyDown={(event) => {
                    // Space on the row's own checkbox is the checkbox's to
                    // handle; only the row itself selects.
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      activate();
                    }
                  }}
                  className={`select-none ${
                    disabled
                      ? "cursor-not-allowed opacity-45"
                      : `cursor-pointer ${
                          selected ? "bg-surface-2" : "hover:bg-surface-2"
                        }`
                  }`}
                >
                  {selection ? (
                    <td
                      className={`py-2.5 pl-5 pr-2 ${cellBorder}`}
                      onClick={(event) => event.stopPropagation()}
                      style={
                        selected
                          ? { boxShadow: "inset 3px 0 0 var(--series-1)" }
                          : undefined
                      }
                    >
                      <Checkbox
                        checked={selection.isChecked(product)}
                        onChange={() => selection.onToggle(product)}
                        label={t("inv.selectRow", { name: product.name })}
                      />
                    </td>
                  ) : null}

                  <td
                    className={`py-2.5 pr-4 ${selection ? "" : "pl-5"} ${cellBorder}`}
                    style={
                      selected && !selection
                        ? { boxShadow: "inset 3px 0 0 var(--series-1)" }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-ink-1">
                        {product.name}
                      </span>
                      {badge ? badge(product) : null}
                    </span>
                    <span className="block text-[11.5px] tabular-nums text-ink-3">
                      {product.sku}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap py-2.5 pr-4 text-right tabular-nums text-ink-1 ${cellBorder}`}
                  >
                    {formatPrice(product.sellingPrice)}
                  </td>
                  <td
                    className={`whitespace-nowrap py-2.5 pr-4 text-right tabular-nums text-ink-1 ${
                      showBarcode ? "" : "pr-5"
                    } ${cellBorder}`}
                  >
                    {formatNumber(product.stock)}
                  </td>
                  {showBarcode ? (
                    <td className={`py-2.5 pr-5 text-right ${cellBorder}`}>
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <Barcode
                          value={barcodeValue(product.sku)}
                          className="h-5 w-[108px] text-ink-1"
                        />
                        <span className="text-[11px] tracking-[0.08em] tabular-nums text-ink-3">
                          {barcodeValue(product.sku)}
                        </span>
                      </span>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-3">
            {filtering ? t("inv.noMatch") : t("inv.empty")}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
