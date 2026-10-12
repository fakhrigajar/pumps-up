import { countOrders, selectHeatmap } from "./register.js";

export function selectLedger(sales, sessions, { start, end }, groupBy) {
  const rows = sales.filter((sale) => sale.date >= start && sale.date <= end);
  const totals = rows.reduce((sum, sale) => ({
    sales: sum.sales + sale.soldFor * sale.qty,
    profit: sum.profit + (sale.soldFor - sale.purchasePrice) * sale.qty,
    units: sum.units + sale.qty,
  }), { sales: 0, profit: 0, units: 0 });
  return { rows, totals, orderCount: countOrders(rows, start, end), heatmap: selectHeatmap(sessions, { start, end, groupBy }) };
}
