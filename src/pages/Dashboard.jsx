import { useMemo, useState } from "react";
import { FilterBar } from "../components/FilterBar";
import { StatTile } from "../components/StatTile";
import { ChartCard, DataTable } from "../components/charts/ChartCard";
import { TrendLines } from "../components/charts/TrendLines";
import { Columns } from "../components/charts/Columns";
import { RankedBars } from "../components/charts/RankedBars";
import { RegisterStatus } from "../components/panels/RegisterStatus";
import { TopCashiers } from "../components/panels/TopCashiers";
import { LowStock } from "../components/panels/LowStock";
import { SlowMovers } from "../components/panels/SlowMovers";
import { RecentSales } from "../components/panels/RecentSales";
import { OutOfStock } from "../components/panels/OutOfStock";
import { ActivityLog } from "../components/panels/ActivityLog";
import { SERIES } from "../components/charts/tokens";
import { dateRanges, selectRealKpis, trailingWindow } from "../data/erp";
import {
  selectByHour,
  selectByWeekday,
  selectCashiers,
  selectCategories,
  selectDailySeries,
  selectInventory,
  selectMonthly,
  selectMovers,
  selectRegisterStatus,
  selectToday,
} from "../data/dashboard";
import { isoParts, todayIso } from "../lib/dates";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatMonthShort,
  formatNumber,
  formatPrice,
  formatWeekdayShort,
} from "../lib/format";
import { useTranslation } from "../i18n/context";

/**
 * The shop at a glance, in the order somebody actually asks about it: what
 * happened today, how the period is going, what is selling, what is on the
 * shelves, and what has just been touched.
 *
 * The sections are what make that an argument rather than a wall of cards —
 * a heading says which question the next few panels answer, and only the
 * middle three follow the period filter. Today is today whatever the filter
 * says, and the stock figures are a count of the shelves right now.
 */

const HOUR = (hour) => String(hour).padStart(2, "0");

export function Dashboard({ products, sales, sessions, users, activityLog }) {
  const { t } = useTranslation();
  const [range, setRange] = useState("3m");

  const period = dateRanges.find((item) => item.id === range) ?? dateRanges[0];
  const monthsBack = period.monthsBack;
  // Not `window` — shadowing the global inside a component is a trap for
  // whoever adds a resize listener here later.
  const span = useMemo(() => trailingWindow(monthsBack), [monthsBack]);

  const day = useMemo(() => selectToday(sales), [sales]);
  const registers = useMemo(
    () => selectRegisterStatus(sessions, users),
    [sessions, users],
  );

  const kpis = useMemo(
    () => selectRealKpis(sales, monthsBack),
    [sales, monthsBack],
  );

  const daily = useMemo(
    () => selectDailySeries(sales, span.start, span.end),
    [sales, span],
  );
  const monthly = useMemo(
    () => selectMonthly(sales, span.start, span.end),
    [sales, span],
  );
  const byHour = useMemo(
    () => selectByHour(sessions, span.start, span.end),
    [sessions, span],
  );
  const byWeekday = useMemo(
    () => selectByWeekday(sales, span.start, span.end),
    [sales, span],
  );
  const movers = useMemo(
    () => selectMovers(sales, products, span.start, span.end),
    [sales, products, span],
  );
  const categories = useMemo(
    () => selectCategories(sales, products, span.start, span.end),
    [sales, products, span],
  );
  const cashiers = useMemo(
    () => selectCashiers(sales, span.start, span.end),
    [sales, span],
  );
  const inventory = useMemo(() => selectInventory(products), [products]);

  // Percent change against yesterday, or nothing at all when yesterday took
  // nothing: a percentage of zero is not a large number, it is not a number.
  const traded = day.yesterday.orders > 0;
  const change = (now, before) => (traded && before ? ((now - before) / before) * 100 : undefined);
  const dayNote = t(traded ? "dash.vsYesterday" : "dash.noYesterday");

  const todayTiles = [
    { id: "revenue", labelKey: "dash.todayRevenue", format: "price", now: day.today.revenue, before: day.yesterday.revenue },
    { id: "profit", labelKey: "dash.todayProfit", format: "price", now: day.today.profit, before: day.yesterday.profit },
    { id: "orders", labelKey: "dash.todayOrders", format: "number", now: day.today.orders, before: day.yesterday.orders },
    { id: "units", labelKey: "dash.todayItems", format: "number", now: day.today.units, before: day.yesterday.units },
    { id: "aov", labelKey: "dash.todayAov", format: "price", now: day.today.aov, before: day.yesterday.aov },
  ];

  const money = (value) => (value === 0 ? "0" : formatCurrencyCompact(value));

  const trendRows = daily.map((row) => ({
    key: row.date,
    label: String(isoParts(row.date).day),
    tooltipLabel: formatDate(row.date),
    values: [row.revenue, row.profit],
  }));

  const monthlyRows = monthly.map((row) => {
    const [year, month] = row.month.split("-").map(Number);
    return {
      key: row.month,
      label: formatMonthShort(year, month - 1),
      values: [row.revenue, row.profit],
      orders: row.orders,
    };
  });

  const hourRows = byHour.map((row) => ({
    key: row.hour,
    label: HOUR(row.hour),
    values: [row.revenue],
    orders: row.orders,
    units: row.units,
  }));

  const weekdayRows = byWeekday.map((row) => ({
    key: row.weekday,
    label: formatWeekdayShort(row.weekday),
    values: [row.revenue],
    orders: row.orders,
    units: row.units,
  }));

  const moneySeries = [
    { name: t("dash.revenue"), color: SERIES[0] },
    { name: t("dash.profit"), color: SERIES[1] },
  ];
  const revenueOnly = [{ name: t("dash.revenue"), color: SERIES[0] }];
  const moneyLegend = moneySeries.map((item) => ({ ...item }));

  return (
    <div className="space-y-6">
      <FilterBar range={range} onRangeChange={setRange} />

      <Section title={t("dash.section.today")} hint={formatDate(todayIso())}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {todayTiles.map((tile) => (
            <StatTile
              key={tile.id}
              label={t(tile.labelKey)}
              value={tile.now}
              format={tile.format}
              delta={change(tile.now, tile.before)}
              upIsGood
              note={dayNote}
            />
          ))}
        </div>

        <RegisterStatus status={registers} />
      </Section>

      <Section title={t("dash.section.performance")} hint={t(period.labelKey)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <StatTile
              key={kpi.id}
              {...kpi}
              label={t(kpi.labelKey)}
              note={t("kpi.vsPrevious")}
            />
          ))}
        </div>

        <ChartCard
          title={t("dash.trend")}
          subtitle={t("dash.trend.sub")}
          legend={moneyLegend}
          table={
            <DataTable
              columns={[
                { key: "date", label: t("revenue.col.date") },
                { key: "revenue", label: t("dash.revenue"), align: "right" },
                { key: "profit", label: t("dash.profit"), align: "right" },
              ]}
              rows={daily.map((row) => ({
                key: row.date,
                date: formatDate(row.date),
                revenue: formatCurrency(row.revenue),
                profit: formatCurrency(row.profit),
              }))}
            />
          }
        >
          <TrendLines
            rows={trendRows}
            series={moneySeries}
            formatTooltip={formatPrice}
            ariaLabel={t("dash.trend.aria", { count: trendRows.length })}
          />
        </ChartCard>

        <ChartCard
          title={t("dash.monthly")}
          subtitle={t("dash.monthly.sub")}
          legend={moneyLegend}
          table={
            <DataTable
              columns={[
                { key: "month", label: t("dash.col.month") },
                { key: "revenue", label: t("dash.revenue"), align: "right" },
                { key: "profit", label: t("dash.profit"), align: "right" },
                { key: "orders", label: t("dash.col.orders"), align: "right" },
              ]}
              rows={monthlyRows.map((row) => ({
                key: row.key,
                month: row.label,
                revenue: formatCurrency(row.values[0]),
                profit: formatCurrency(row.values[1]),
                orders: formatNumber(row.orders),
              }))}
            />
          }
        >
          <Columns
            rows={monthlyRows}
            series={moneySeries}
            formatTick={money}
            ariaLabel={t("dash.monthly.aria")}
            buildTooltip={(row) => ({
              title: row.label,
              rows: [
                { name: t("dash.revenue"), value: formatPrice(row.values[0]), color: SERIES[0] },
                { name: t("dash.profit"), value: formatPrice(row.values[1]), color: SERIES[1] },
              ],
              footer: t("reg.ordersCount", { count: row.orders }),
            })}
          />
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title={t("dash.hour")}
            subtitle={t("dash.hour.sub")}
            table={
              <DataTable
                columns={[
                  { key: "hour", label: t("heat.col.hour") },
                  { key: "revenue", label: t("dash.revenue"), align: "right" },
                  { key: "orders", label: t("dash.col.orders"), align: "right" },
                ]}
                rows={hourRows.map((row) => ({
                  key: row.key,
                  hour: `${row.label}:00`,
                  revenue: formatCurrency(row.values[0]),
                  orders: formatNumber(row.orders),
                }))}
              />
            }
          >
            {hourRows.length === 0 ? (
              <Empty>{t("dash.hour.empty")}</Empty>
            ) : (
              <Columns
                rows={hourRows}
                series={revenueOnly}
                formatTick={money}
                ariaLabel={t("dash.hour.aria")}
                buildTooltip={(row) => ({
                  title: `${row.label}:00`,
                  rows: [
                    { name: t("dash.revenue"), value: formatPrice(row.values[0]), color: SERIES[0] },
                    { name: t("dash.col.orders"), value: formatNumber(row.orders) },
                    { name: t("dash.col.items"), value: formatNumber(row.units) },
                  ],
                })}
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("dash.weekday")}
            subtitle={t("dash.weekday.sub")}
            table={
              <DataTable
                columns={[
                  { key: "day", label: t("dash.col.weekday") },
                  { key: "revenue", label: t("dash.revenue"), align: "right" },
                  { key: "orders", label: t("dash.col.orders"), align: "right" },
                ]}
                rows={weekdayRows.map((row) => ({
                  key: row.key,
                  day: row.label,
                  revenue: formatCurrency(row.values[0]),
                  orders: formatNumber(row.orders),
                }))}
              />
            }
          >
            <Columns
              rows={weekdayRows}
              series={revenueOnly}
              formatTick={money}
              ariaLabel={t("dash.weekday.aria")}
              buildTooltip={(row) => ({
                title: row.label,
                rows: [
                  { name: t("dash.revenue"), value: formatPrice(row.values[0]), color: SERIES[0] },
                  { name: t("dash.col.orders"), value: formatNumber(row.orders) },
                  { name: t("dash.col.items"), value: formatNumber(row.units) },
                ],
              })}
            />
          </ChartCard>
        </div>
      </Section>

      <Section title={t("dash.section.selling")} hint={t(period.labelKey)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title={t("topsku.title")}
            subtitle={t("topsku.subtitle")}
            table={
              <DataTable
                columns={[
                  { key: "product", label: t("topsku.col.product") },
                  { key: "units", label: t("topsku.col.units"), align: "right" },
                  { key: "revenue", label: t("topsku.col.revenue"), align: "right" },
                ]}
                rows={movers.best.map((item) => ({
                  key: item.sku,
                  product: `${item.name} (${item.sku})`,
                  units: formatNumber(item.units),
                  revenue: formatCurrency(item.revenue),
                }))}
              />
            }
          >
            <RankedBars
              items={movers.best.map((item) => ({
                id: item.sku,
                name: item.name,
                value: item.units,
              }))}
              colors={SERIES[0]}
              formatValue={formatNumber}
              ariaLabel={t("topsku.aria")}
              buildTooltip={(item) => {
                const product = movers.best.find((row) => row.sku === item.id);
                return {
                  title: item.name,
                  rows: [
                    { name: t("topsku.units"), value: formatNumber(item.value) },
                    { name: t("topsku.col.revenue"), value: formatPrice(product?.revenue ?? 0) },
                  ],
                  footer: product?.category ? t(`category.${product.category}`) : undefined,
                };
              }}
            />
          </ChartCard>

          <SlowMovers rows={movers.slowest} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title={t("dash.categories")}
            subtitle={t("dash.categories.sub")}
            table={
              <DataTable
                columns={[
                  { key: "category", label: t("dash.col.category") },
                  { key: "revenue", label: t("dash.revenue"), align: "right" },
                  { key: "units", label: t("dash.col.items"), align: "right" },
                ]}
                rows={categories.map((row) => ({
                  key: row.category,
                  category: t(`category.${row.category}`),
                  revenue: formatCurrency(row.revenue),
                  units: formatNumber(row.units),
                }))}
              />
            }
          >
            {categories.length === 0 ? (
              <Empty>{t("dash.categories.empty")}</Empty>
            ) : (
              <RankedBars
                items={categories.map((row) => ({
                  id: row.category,
                  name: t(`category.${row.category}`),
                  value: row.revenue,
                }))}
                colors={SERIES[0]}
                formatValue={formatCurrency}
                ariaLabel={t("dash.categories.aria")}
                buildTooltip={(item) => {
                  const row = categories.find((entry) => entry.category === item.id);
                  return {
                    title: item.name,
                    rows: [
                      { name: t("dash.revenue"), value: formatPrice(row?.revenue ?? 0) },
                      { name: t("dash.profit"), value: formatPrice(row?.profit ?? 0) },
                      { name: t("dash.col.items"), value: formatNumber(row?.units ?? 0) },
                    ],
                  };
                }}
              />
            )}
          </ChartCard>

          <TopCashiers rows={cashiers} />
        </div>
      </Section>

      <Section title={t("dash.section.stock")} hint={t("dash.stock.hint")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label={t("dash.stockValue")}
            value={inventory.value}
            format="currency0"
            note={t("dash.atCost")}
          />
          <StatTile
            label={t("dash.stockProfit")}
            value={inventory.potential}
            format="currency0"
            note={t("dash.ifAllSold")}
          />
          <StatTile
            label={t("dash.variants")}
            value={inventory.variants}
            format="number"
            note={t("dash.variants.note")}
          />
          <StatTile
            label={t("dash.active")}
            value={inventory.active}
            format="number"
            note={t("dash.active.note", { count: inventory.out.length })}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <LowStock products={inventory.low} />
          <OutOfStock products={products} />
        </div>
      </Section>

      <Section title={t("dash.section.activity")}>
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentSales sales={sales} products={products} />
          </div>
          <ActivityLog entries={activityLog} />
        </div>
      </Section>
    </div>
  );
}

/** A band of the dashboard, and the question it answers. */
function Section({ title, hint, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-2">
          {title}
        </h2>
        {hint ? <p className="text-[12px] text-ink-3">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <p className="px-3 py-10 text-center text-[13px] text-ink-3">{children}</p>
  );
}
