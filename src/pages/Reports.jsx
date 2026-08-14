import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { CalendarPicker } from "../components/ui/CalendarPicker";
import { ExportMenu } from "../components/ui/ExportMenu";
import { PaymentTag } from "../components/ui/PaymentTag";
import { daySelection, isWithin, todayIso } from "../lib/dates";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSelection,
} from "../lib/format";
import { useTranslation } from "../i18n/context";

export function Reports({ sales }) {
  const { t, language } = useTranslation();
  const [selection, setSelection] = useState(() => daySelection(todayIso()));

  const rows = useMemo(
    () =>
      sales.filter((sale) =>
        isWithin(sale.date, selection.start, selection.end),
      ),
    [sales, selection],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, sale) => ({
          sales: sum.sales + sale.soldFor * sale.qty,
          profit: sum.profit + (sale.soldFor - sale.purchasePrice) * sale.qty,
          units: sum.units + sale.qty,
        }),
        { sales: 0, profit: 0, units: 0 },
      ),
    [rows],
  );

  function buildDoc() {
    const period = formatSelection(selection);
    return {
      fileBase: `${t("rep.fileName")}-${
        selection.start === selection.end
          ? selection.start
          : `${selection.start}_${selection.end}`
      }`,
      sheetName: t("rep.title"),
      title: t("rep.title"),
      subtitle: `${period} · ${t("rep.count", { count: rows.length })}`,
      lang: language,
      columns: [
        {
          label: t("rep.col.product"),
          width: 32,
          text: (sale) => sale.name,
          value: (sale) => sale.name,
        },
        {
          label: t("rep.col.id"),
          width: 18,
          text: (sale) => sale.sku,
          value: (sale) => sale.sku,
        },
        {
          label: t("rep.col.date"),
          width: 16,
          text: (sale) => formatDate(sale.date),
          value: (sale) => formatDate(sale.date),
        },
        {
          label: t("rep.col.cost"),
          numeric: true,
          text: (sale) => formatPrice(sale.purchasePrice),
          value: (sale) => sale.purchasePrice,
        },
        {
          label: t("rep.col.price"),
          numeric: true,
          text: (sale) => formatPrice(sale.sellingPrice),
          value: (sale) => sale.sellingPrice,
        },
        {
          label: t("rep.col.soldFor"),
          numeric: true,
          text: (sale) => formatPrice(sale.soldFor),
          value: (sale) => sale.soldFor,
        },
        {
          label: t("rep.col.qty"),
          numeric: true,
          width: 10,
          text: (sale) => formatNumber(sale.qty),
          value: (sale) => sale.qty,
        },
        {
          label: t("rep.col.payment"),
          width: 12,
          text: (sale) => t(`sales.${sale.payment}`),
          value: (sale) => t(`sales.${sale.payment}`),
        },
      ],
      rows,
      totals: [
        {
          label: t("rep.totalSales"),
          value: Math.round(totals.sales * 100) / 100,
          display: formatPrice(totals.sales),
        },
        {
          label: t("rep.totalProfit"),
          value: Math.round(totals.profit * 100) / 100,
          display: formatPrice(totals.profit),
        },
      ],
    };
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-4">
        <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
          <CalendarPicker selection={selection} onChange={setSelection} />
          <p className="text-[13px] text-ink-3" aria-live="polite">
            {t("rep.count", { count: rows.length })}
            {rows.length > 0
              ? ` · ${t("rep.units", { count: totals.units })}`
              : ""}
          </p>
          <div className="ml-auto">
            <ExportMenu buildDoc={buildDoc} disabled={rows.length === 0} />
          </div>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {t("rep.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{t("rep.subtitle")}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr>
                <Th className="pl-5">{t("rep.col.product")}</Th>
                <Th align="right">{t("rep.col.cost")}</Th>
                <Th align="right">{t("rep.col.price")}</Th>
                <Th align="right">{t("rep.col.soldFor")}</Th>
                <Th align="right">{t("rep.col.qty")}</Th>
                <Th className="pr-5">{t("rep.col.payment")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sale, index) => {
                const border =
                  index === rows.length - 1 ? "" : "border-b border-line";
                return (
                  <tr key={sale.id}>
                    <td className={`py-2.5 pl-5 pr-4 ${border}`}>
                      <span className="block font-medium text-ink-1">
                        {sale.name}
                      </span>
                      <span className="block text-[11.5px] tabular-nums text-ink-3">
                        {sale.sku} · {formatDate(sale.date)}
                      </span>
                    </td>
                    <Td className={border}>
                      {formatPrice(sale.purchasePrice)}
                    </Td>
                    <Td className={border}>{formatPrice(sale.sellingPrice)}</Td>
                    <Td className={`font-medium text-ink-1 ${border}`}>
                      {formatPrice(sale.soldFor)}
                    </Td>
                    <Td className={border}>{formatNumber(sale.qty)}</Td>
                    <td className={`whitespace-nowrap py-2.5 pr-5 ${border}`}>
                      <PaymentTag method={sale.payment} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">
              {t("rep.empty")}
            </p>
          ) : null}
        </div>
      </Card>

      <div className="mt-4 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <TotalCard
          label={t("rep.totalSales")}
          value={formatPrice(totals.sales)}
        />
        <TotalCard
          label={t("rep.totalProfit")}
          value={formatPrice(totals.profit)}
          tone={totals.profit < 0 ? "critical" : "good"}
        />
      </div>
    </div>
  );
}

function Th({ children, align, className = "" }) {
  return (
    <th
      scope="col"
      className={`sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-[12px] font-medium text-ink-3 ${
        align === "right" ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td
      className={`whitespace-nowrap py-2.5 pr-4 text-right tabular-nums text-ink-2 ${className}`}
    >
      {children}
    </td>
  );
}

function TotalCard({ label, value, tone }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-2">{label}</p>
      <p
        className="mt-1 text-[24px] font-semibold tracking-tight tabular-nums text-ink-1"
        style={tone ? { color: `var(--status-${tone})` } : undefined}
      >
        {value}
      </p>
    </Card>
  );
}
