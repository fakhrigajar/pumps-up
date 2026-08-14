import { useState } from "react";
import { Modal, ModalFooter } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatPrice } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

const toCents = (value) => Math.round(value * 100) / 100;

function parseMoney(raw) {
  const text = String(raw ?? "").trim();
  if (text === "") return NaN;
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
}

function discountedPrice(sellingPrice, discountPercent) {
  return toCents(sellingPrice * (1 - discountPercent / 100));
}

export function SellDialog({ lines, payment, onCancel, onConfirm }) {
  const { t } = useTranslation();

  const [discount, setDiscount] = useState("");
  const [soldFor, setSoldFor] = useState(() =>
    Object.fromEntries(lines.map((line) => [line.sku, String(line.sellingPrice)])),
  );
  const [error, setError] = useState(null);

  function handleDiscount(value) {
    setDiscount(value);
    setError(null);

    const percent = Number(value);
    if (value === "" || !Number.isFinite(percent)) {
      setSoldFor(
        Object.fromEntries(lines.map((l) => [l.sku, String(l.sellingPrice)])),
      );
      return;
    }
    const clamped = Math.min(100, Math.max(0, percent));
    setSoldFor(
      Object.fromEntries(
        lines.map((l) => [l.sku, String(discountedPrice(l.sellingPrice, clamped))]),
      ),
    );
  }

  const total = lines.reduce((sum, line) => {
    const price = parseMoney(soldFor[line.sku]);
    return sum + (Number.isNaN(price) ? 0 : price) * line.qty;
  }, 0);

  function handleSubmit(event) {
    event.preventDefault();

    const percent = Number(discount);
    if (discount !== "" && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      return setError(t("err.discount"));
    }
    const invalid = lines.some((line) => {
      const price = parseMoney(soldFor[line.sku]);
      return Number.isNaN(price) || price < 0;
    });
    if (invalid) return setError(t("err.soldFor"));

    return onConfirm(
      lines.map((line) => ({
        sku: line.sku,
        qty: line.qty,
        soldFor: parseMoney(soldFor[line.sku]),
      })),
    );
  }

  return (
    <Modal title={t("sell.title")} description={t("sell.desc")} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="px-5 py-4">
          <label className="block">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("sell.discount")}
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(event) => handleDiscount(event.target.value)}
              placeholder="0"
              autoFocus
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] tabular-nums text-ink-1 placeholder:text-ink-3 focus:bg-surface-1"
            />
            <span className="mt-1 block text-[11.5px] text-ink-3">
              {t("sell.discountHint")}
            </span>
          </label>

          <div className="mt-4 max-h-[280px] overflow-y-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr>
                  <th className="sticky top-0 border-b border-line bg-surface-1 py-2 pr-3 text-[12px] font-medium text-ink-3">
                    {t("sell.col.product")}
                  </th>
                  <th className="sticky top-0 border-b border-line bg-surface-1 py-2 pr-3 text-right text-[12px] font-medium text-ink-3">
                    {t("sell.col.price")}
                  </th>
                  <th className="sticky top-0 border-b border-line bg-surface-1 py-2 pr-3 text-right text-[12px] font-medium text-ink-3">
                    {t("sell.col.qty")}
                  </th>
                  <th className="sticky top-0 border-b border-line bg-surface-1 py-2 text-right text-[12px] font-medium text-ink-3">
                    {t("sell.col.soldFor")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.sku}>
                    <td className="border-b border-line py-2 pr-3 align-middle">
                      <span className="block max-w-[150px] truncate font-medium text-ink-1">
                        {line.name}
                      </span>
                      <span className="block text-[11px] tabular-nums text-ink-3">
                        {line.sku}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-line py-2 pr-3 text-right tabular-nums text-ink-2">
                      {formatPrice(line.sellingPrice)}
                    </td>
                    <td className="border-b border-line py-2 pr-3 text-right tabular-nums text-ink-2">
                      {line.qty}
                    </td>
                    <td className="border-b border-line py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={soldFor[line.sku] ?? ""}
                        onChange={(event) => {
                          setSoldFor({
                            ...soldFor,
                            [line.sku]: event.target.value,
                          });
                          setError(null);
                        }}
                        aria-label={`${t("sell.col.soldFor")} — ${line.name}`}
                        className="h-8 w-[84px] rounded-lg border border-line bg-surface-2 px-2 text-right text-[13px] tabular-nums text-ink-1 focus:bg-surface-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-3 text-[12.5px]"
              style={{ color: "var(--status-critical)" }}
            >
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
            <div>
              <p className="text-[13px] text-ink-2">{t("sell.total")}</p>
              <p className="text-[11.5px] text-ink-3">
                {t("sell.paidBy", { method: t(`sales.${payment}`) })}
              </p>
            </div>
            <p className="text-[20px] font-semibold tracking-tight text-ink-1">
              {formatPrice(total)}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button onClick={onCancel}>{t("dlg.cancel")}</Button>
          <Button variant="primary" type="submit">
            {t("sell.confirm")}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
