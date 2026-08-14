import { useState } from "react";
import { Modal, ModalFooter } from "../ui/Modal";
import { Button } from "../ui/Button";
import { IconPrint } from "../Icons";
import { barcodeValue } from "../../lib/barcode";
import {
  LABEL_MAX_MM,
  LABEL_MIN_MM,
  MAX_LABELS_PER_JOB,
  MAX_LABELS_PER_PRODUCT,
} from "../../lib/labels";
import { formatNumber } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

const DASH = "—";

const inRange = (value) =>
  Number.isFinite(value) && value >= LABEL_MIN_MM && value <= LABEL_MAX_MM;

export function PrintLabelsDialog({ products, labelSize, onCancel, onPrint }) {
  const { t } = useTranslation();
  // Stock is the count that is usually wanted — a delivery lands and every
  // unit of it needs a tag — so it is what the field opens on. Nothing holds
  // it there: the number is free to go above stock or below it.
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(
      products.map((product) => [product.sku, String(product.stock)]),
    ),
  );
  const [size, setSize] = useState(() => ({
    width: String(labelSize.width),
    height: String(labelSize.height),
  }));
  const [error, setError] = useState(null);

  const parsed = products.map((product) => {
    const raw = quantities[product.sku] ?? "";
    const quantity = raw === "" ? 0 : Number(raw);
    return { product, raw, quantity };
  });

  const invalid = parsed.some(
    ({ raw, quantity }) =>
      raw !== "" &&
      (!Number.isInteger(quantity) ||
        quantity < 0 ||
        quantity > MAX_LABELS_PER_PRODUCT),
  );

  // A quantity that is too large still counts toward the total. Zeroing it
  // would disable the Print button, and a button that goes dead without a word
  // is worse than one that explains itself when pressed.
  const total = parsed.reduce(
    (sum, line) =>
      sum + (Number.isFinite(line.quantity) ? Math.max(0, line.quantity) : 0),
    0,
  );

  const setDimension = (key) => (event) => {
    setSize((current) => ({ ...current, [key]: event.target.value }));
    setError(null);
  };

  function handleSubmit(event) {
    event.preventDefault();

    const width = Number(size.width);
    const height = Number(size.height);
    if (!inRange(width) || !inRange(height)) {
      return setError(
        t("err.labelSize", { min: LABEL_MIN_MM, max: LABEL_MAX_MM }),
      );
    }
    if (invalid) {
      return setError(t("err.printQty", { max: MAX_LABELS_PER_PRODUCT }));
    }
    if (total === 0) return setError(t("err.printEmpty"));
    if (total > MAX_LABELS_PER_JOB) {
      return setError(t("err.printJob", { max: MAX_LABELS_PER_JOB }));
    }

    return onPrint({
      jobs: parsed
        .filter((line) => line.quantity > 0)
        .map((line) => ({ product: line.product, quantity: line.quantity })),
      size: { width, height },
    });
  }

  return (
    <Modal
      title={t("prn.title")}
      description={t("prn.desc")}
      width="lg"
      onClose={onCancel}
    >
      {/* noValidate: the quantity and size rules are the dialog's to explain,
          in the app's own language. Left on, the browser blocks submit on
          `max` and on a fractional step before handleSubmit ever runs, and
          answers in whatever language the browser is set to. */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
            <Dimension
              label={t("prn.width")}
              value={size.width}
              onChange={setDimension("width")}
            />
            <Dimension
              label={t("prn.height")}
              value={size.height}
              onChange={setDimension("height")}
            />
            <p className="flex-1 text-[11.5px] text-ink-3">
              {t("prn.sizeHint")}
            </p>
          </div>

          <div className="mt-3 max-h-[38vh] overflow-y-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr>
                  <Th>{t("prn.col.product")}</Th>
                  <Th>{t("prn.col.color")}</Th>
                  <Th align="right">{t("prn.col.size")}</Th>
                  <Th align="right">{t("prn.col.stock")}</Th>
                  <Th align="right" className="pr-0">
                    {t("prn.col.qty")}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td className="border-b border-line py-2 pr-3 align-middle">
                      <span className="block max-w-[220px] truncate font-medium text-ink-1">
                        {product.name}
                      </span>
                      <span className="block text-[11px] tabular-nums text-ink-3">
                        {barcodeValue(product.sku)}
                      </span>
                    </td>
                    <td className="border-b border-line py-2 pr-3 align-middle text-ink-2">
                      {product.color ?? DASH}
                    </td>
                    <td className="border-b border-line py-2 pr-3 text-right align-middle tabular-nums text-ink-2">
                      {product.size ?? DASH}
                    </td>
                    <td className="border-b border-line py-2 pr-3 text-right align-middle tabular-nums text-ink-2">
                      {formatNumber(product.stock)}
                    </td>
                    <td className="border-b border-line py-2 text-right align-middle">
                      <input
                        type="number"
                        min="0"
                        max={MAX_LABELS_PER_PRODUCT}
                        step="1"
                        value={quantities[product.sku] ?? ""}
                        onChange={(event) => {
                          setQuantities({
                            ...quantities,
                            [product.sku]: event.target.value,
                          });
                          setError(null);
                        }}
                        aria-label={`${t("prn.col.qty")} — ${product.name}`}
                        className="h-8 w-[84px] rounded-lg border border-line bg-surface-2 px-2 text-right text-[13px] tabular-nums text-ink-1 focus:bg-surface-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11.5px] text-ink-3">{t("prn.hint")}</p>

          {error ? (
            <p
              role="alert"
              className="mt-2 text-[12.5px]"
              style={{ color: "var(--status-critical)" }}
            >
              {error}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          <p
            className="mr-auto text-[13px] text-ink-2"
            aria-live="polite"
            style={
              total > MAX_LABELS_PER_JOB
                ? { color: "var(--status-critical)" }
                : undefined
            }
          >
            {t("prn.total", { count: total })}
          </p>
          <Button onClick={onCancel}>{t("dlg.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={total === 0}>
            <IconPrint className="h-4 w-4" />
            {t("prn.confirm")}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function Dimension({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-medium text-ink-2">
        {label}
      </span>
      <input
        type="number"
        min={LABEL_MIN_MM}
        max={LABEL_MAX_MM}
        step="1"
        value={value}
        onChange={onChange}
        className="mt-1 h-8 w-[92px] rounded-lg border border-line bg-surface-1 px-2 text-right text-[13px] tabular-nums text-ink-1 focus:bg-surface-1"
      />
    </label>
  );
}

function Th({ children, align, className = "" }) {
  return (
    <th
      scope="col"
      className={`sticky top-0 border-b border-line bg-surface-1 py-2 pr-3 text-[12px] font-medium text-ink-3 ${
        align === "right" ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </th>
  );
}
