import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { NumberStepper } from "../ui/NumberStepper";
import { IconCard, IconCash, IconChevronDown, IconClose } from "../Icons";
import { formatNumber, formatPrice } from "../../lib/format";
import { SALE_PANEL_EXPANDED } from "../../lib/layout";
import { useTranslation } from "../../i18n/context";

const PAYMENT_METHODS = [
  {
    id: "cash",
    labelKey: "sales.cash",
    Icon: IconCash,
    activeClassName: "border-status-good bg-[#0ca30c26] text-status-good",
  },
  {
    id: "card",
    labelKey: "sales.card",
    Icon: IconCard,
    activeClassName: "border-status-warning bg-[#fab21926] text-status-warning",
  },
];

/**
 * The basket, along the bottom of the till — and a drawer when the basket
 * outgrows the strip.
 *
 * Collapsed it is a status bar: a couple of lines, the total, and the button
 * that ends the sale. Pulled open by the handle on its top edge it becomes a
 * working surface, tall enough to check a long order line by line and wide
 * enough to lay those lines out in columns rather than one tall list.
 *
 * It grows *over* the product table rather than pushing it up: the page keeps
 * the padding it reserved for the collapsed strip, so nothing behind the
 * drawer moves while it opens and the row somebody was about to tap is still
 * where they left it when it shuts.
 */
export function SalePanel({
  innerRef,
  height,
  lines,
  payment,
  onPaymentChange,
  onQuantityChange,
  onRemove,
  onClear,
  onSell,
  locked = false,
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Escape shuts the drawer before anything else can act on it, the way it
  // shuts a menu — the drawer is the thing covering the screen.
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setExpanded(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [expanded]);

  const total = lines.reduce(
    (sum, line) => sum + line.sellingPrice * line.qty,
    0,
  );
  const units = lines.reduce((sum, line) => sum + line.qty, 0);

  const activeMethod =
    PAYMENT_METHODS.find((method) => method.id === payment) ?? PAYMENT_METHODS[0];
  const nextMethod =
    PAYMENT_METHODS.find((method) => method.id !== activeMethod.id) ?? activeMethod;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 lg:left-[264px]">
      {/* The handle sits outside the panel's own box so the panel can clip its
          contents while the height animates, and still show a grip above the
          edge it is being pulled from. */}
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={t(expanded ? "sales.collapse" : "sales.expand")}
        title={t(expanded ? "sales.collapse" : "sales.expand")}
        className="absolute bottom-full left-1/2 z-10 -mb-px flex h-6 w-16 -translate-x-1/2 items-center justify-center rounded-t-lg border border-b-0 border-line bg-surface-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-1"
      >
        <IconChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            expanded ? "" : "-rotate-180"
          }`}
        />
      </button>

      {/* `tabIndex={-1}` makes this focusable without putting it in the tab
          order: it is a place to be sent — a scan lands here — rather than a
          stop on the way through the page. Sent focus is not keyboard focus,
          so no ring is drawn for it. */}
      <div
        ref={innerRef}
        tabIndex={-1}
        style={{ height: expanded ? SALE_PANEL_EXPANDED : height }}
        className="flex overflow-hidden border-t border-line bg-surface-1 outline-none transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      >
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-2 sm:px-6">
          <div className="flex shrink-0 items-baseline gap-2">
            <h2 className="text-[13px] font-semibold text-ink-1">
              {t("sales.panel")}
            </h2>
            {lines.length > 0 ? (
              <p className="text-[11.5px] text-ink-3">
                {t("sales.lines", { count: lines.length })} ·{" "}
                {t("sales.units", { count: units })}
              </p>
            ) : null}
          </div>

          <div className="min-h-0 w-full flex-1 overflow-y-auto pb-2 pt-1.5">
            {lines.length === 0 ? (
              <p className="text-[13px] text-ink-3">{t("sales.empty")}</p>
            ) : (
              <ul
                className={`grid w-full content-start gap-x-3 gap-y-2 ${
                  expanded ? "md:grid-cols-2 2xl:grid-cols-3" : ""
                }`}
              >
                {lines.map((line) => (
                  <li
                    key={line.sku}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-2 py-1 pl-2.5 pr-1"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-1">
                      {line.name}
                    </span>
                    <span className="w-[104px] shrink-0">
                      <NumberStepper
                        value={String(line.qty)}
                        min={1}
                        max={line.stock}
                        onChange={(value) => onQuantityChange(line.sku, value)}
                        decreaseLabel={t("dlg.decrease")}
                        increaseLabel={t("dlg.increase")}
                        size="sm"
                        inputProps={{ "aria-label": t("sell.col.qty") }}
                      />
                    </span>
                    <span className="w-[78px] shrink-0 text-right text-[12.5px] tabular-nums text-ink-2">
                      {formatPrice(line.sellingPrice * line.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(line.sku)}
                      title={t("sales.remove")}
                      className="rounded p-1 text-ink-3 hover:bg-surface-3 hover:text-ink-1"
                    >
                      <IconClose className="h-3.5 w-3.5" />
                      <span className="sr-only">{t("sales.remove")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div
          className={`flex shrink-0 flex-col gap-3 border-l border-line px-4 sm:px-6 ${
            expanded ? "justify-between py-4" : "justify-center"
          }`}
        >
          <div className="flex gap-5">
            <button
              type="button"
              role="switch"
              aria-checked={activeMethod.id === "card"}
              aria-label={t("sales.payment")}
              onClick={() => onPaymentChange(nextMethod.id)}
              className={`flex w-16 flex-col items-center gap-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-medium transition-colors ${activeMethod.activeClassName}`}
            >
              <activeMethod.Icon className="h-4 w-4" />
              {t(activeMethod.labelKey)}
            </button>
            <div className="text-right">
              <p className="text-[10.5px] leading-tight text-ink-3">
                {t("sales.total")}
              </p>
              <p className="text-[22px] font-semibold leading-tight tracking-tight tabular-nums text-ink-1">
                {formatPrice(total)}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-1.5">
              {lines.length > 0 ? (
                <Button size="sm" onClick={onClear}>
                  {t("sales.clear")}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="primary"
                onClick={onSell}
                disabled={locked || lines.length === 0}
              >
                {t("sales.sell")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SaleBadge({ qty }) {
  return (
    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
      {formatNumber(qty)}
    </span>
  );
}
