import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { CalendarPicker } from "../components/ui/CalendarPicker";
import { ExportMenu } from "../components/ui/ExportMenu";
import { PaymentTag } from "../components/ui/PaymentTag";
import { Select } from "../components/ui/Select";
import { ChartCard, DataTable } from "../components/charts/ChartCard";
import { HeatmapLegend, SalesHeatmap } from "../components/charts/SalesHeatmap";
import { countOrders, selectHeatmap } from "../data/register";
import { daySelection, isWithin, todayIso } from "../lib/dates";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSelection,
} from "../lib/format";
import { useTranslation } from "../i18n/context";

export function Reports({ sales, sessions }) {
  const { t, language } = useTranslation();
  const [selection, setSelection] = useState(() => daySelection(todayIso()));
  const [grouping, setGrouping] = useState("day");
  const [metric, setMetric] = useState("revenue");

  const heatmap = useMemo(
    () =>
      selectHeatmap(sessions, {
        start: selection.start,
        end: selection.end,
        groupBy: grouping,
      }),
    [sessions, selection, grouping],
  );

  const heatmapRows = useMemo(
    () =>
      heatmap.rows.map((row) => ({
        id: row.id,
        label: grouping === "day" ? formatDate(row.key) : row.key,
        cells: row.cells.map((cell) => ({
          hour: cell.hour,
          value: metric === "revenue" ? cell.revenue : cell.orders,
          footer:
            cell.orders === 0
              ? undefined
              : `${t("reg.ordersCount", { count: cell.orders })} · ${formatPrice(cell.revenue)}`,
        })),
      })),
    [heatmap, grouping, metric, t],
  );

  const busiest = useMemo(() => {
    const totals = heatmap.hours.map((hour, index) => ({
      hour,
      orders: heatmap.rows.reduce(
        (sum, row) => sum + row.cells[index].orders,
        0,
      ),
      revenue: heatmap.rows.reduce(
        (sum, row) => sum + row.cells[index].revenue,
        0,
      ),
    }));
    return totals;
  }, [heatmap]);

  const showValue = (value) =>
    metric === "revenue" ? formatPrice(value) : formatNumber(value);

  const rows = useMemo(
    () =>
      sales.filter((sale) =>
        isWithin(sale.date, selection.start, selection.end),
      ),
    [sales, selection],
  );

  /** Customers rather than items: the rows already in `rows`, counted by the
   * checkout each belonged to. Same list, same date range, same filters. */
  const orderCount = useMemo(
    () => countOrders(rows, selection.start, selection.end),
    [rows, selection],
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
        {
          label: t("rep.totalOrders"),
          value: orderCount,
          display: formatNumber(orderCount),
        },
      ],
    };
  }

  return (
    <div className="flex flex-col">
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
        <div className="mt-4 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <TotalCard
            label={t("rep.totalSales")}
            value={formatPrice(totals.sales)}
          />
          <TotalCard
            label={t("rep.totalProfit")}
            value={formatPrice(totals.profit)}
            tone={totals.profit < 0 ? "critical" : "good"}
          />
          <TotalCard
            label={t("rep.totalOrders")}
            value={formatNumber(orderCount)}
          />
        </div>
      </div>

      <div className="shrink-0 pb-4">
        <ChartCard
          title={t("heat.title")}
          subtitle={t("heat.subtitle")}
          legend={undefined}
          table={
            <DataTable
              columns={[
                { key: "hour", label: t("heat.col.hour") },
                { key: "orders", label: t("heat.col.orders"), align: "right" },
                {
                  key: "revenue",
                  label: t("heat.col.revenue"),
                  align: "right",
                },
              ]}
              rows={busiest.map((row) => ({
                key: row.hour,
                hour: `${String(row.hour).padStart(2, "0")}:00`,
                orders: formatNumber(row.orders),
                revenue: formatPrice(row.revenue),
              }))}
            />
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <HeatmapLegend
                lowLabel={t("heat.quiet")}
                highLabel={t("heat.busy")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  variant="pill"
                  label={t("heat.metric")}
                  caption={t("heat.metric")}
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "revenue", label: t("heat.revenue") },
                    { value: "orders", label: t("heat.orders") },
                  ]}
                />
                <Select
                  variant="pill"
                  label={t("heat.rows")}
                  caption={t("heat.rows")}
                  value={grouping}
                  onChange={setGrouping}
                  options={[
                    { value: "day", label: t("heat.byDay") },
                    { value: "cashier", label: t("heat.byCashier") },
                  ]}
                />
              </div>
            </div>
          }
        >
          {heatmapRows.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-ink-3">
              {t("heat.empty")}
            </p>
          ) : (
            <div className="px-1">
              <SalesHeatmap
                rows={heatmapRows}
                hours={heatmap.hours}
                formatValue={showValue}
                ariaLabel={t("heat.aria")}
                maxHeight={168}
              />
            </div>
          )}
        </ChartCard>
      </div>

      <Card className="flex flex-col">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {t("rep.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{t("rep.subtitle")}</p>
        </div>

        <div className="max-sm:overflow-x-auto">
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
    </div>
  );
}

/**
 * The page scrolls, so the column headers ride up and stop at the top of it.
 * The offset is the negative of `main`'s own padding: `top: 0` would pin them
 * to the *content* edge and leave a band of padding above, through which the
 * rows would go on scrolling in plain sight.
 */
function Th({ children, align, className = "" }) {
  return (
    <th
      scope="col"
      className={`sticky -top-4 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-[12px] font-medium text-ink-3 sm:-top-6 ${
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
