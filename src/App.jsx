import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { Sales } from "./pages/Sales";
import { Reports } from "./pages/Reports";
import { Activity } from "./pages/Activity";
import { Users } from "./pages/Users";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import { NAV_ITEMS } from "./navigation";
import { useTranslation } from "./i18n/context";
import {
  products as initialProducts,
  salesHistory as initialSales,
} from "./data/erp";
import { users as initialUsers } from "./data/users";
import { todayIso } from "./lib/dates";
import { useMeasure } from "./lib/useMeasure";
import { SALE_PANEL_HEIGHT } from "./lib/layout";

function describeChanges(before, after) {
  if (!before) return null;
  const changed = Object.keys(after)
    .filter((field) => before[field] !== after[field])
    .map((field) => ({ field, from: before[field], to: after[field] }));
  return changed.length > 0 ? changed : null;
}

export default function App() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const [sidebarFooterRef, , sidebarFooterHeight] = useMeasure();

  const [productList, setProductList] = useState(initialProducts);

  const [activityLog, setActivityLog] = useState([]);
  const logSerial = useRef(0);

  const logAction = useCallback((messageKey, product, extra = {}) => {
    logSerial.current += 1;
    const entry = {
      id: logSerial.current,
      messageKey,
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      reason: extra.reason || null,
      changes: extra.changes || null,
      at: Date.now(),
    };
    setActivityLog((log) => [entry, ...log]);
  }, []);

  const addProducts = useCallback(
    (newProducts) => {
      setProductList((list) => [...newProducts, ...list]);
      newProducts.forEach((product) => logAction("log.added", product));
    },
    [logAction],
  );

  const deleteProduct = useCallback(
    (sku) => {
      const product = productList.find((item) => item.sku === sku);
      setProductList((list) => list.filter((item) => item.sku !== sku));
      logAction("log.deleted", product);
    },
    [productList, logAction],
  );

  const returnProduct = useCallback(
    (sku, units, reason) => {
      const product = productList.find((item) => item.sku === sku);
      setProductList((list) =>
        list.map((item) =>
          item.sku === sku ? { ...item, stock: item.stock + units } : item,
        ),
      );
      logAction("log.returned", product, { reason });
    },
    [productList, logAction],
  );

  const updateProduct = useCallback(
    (sku, changes) => {
      const product = productList.find((item) => item.sku === sku);
      setProductList((list) =>
        list.map((item) => (item.sku === sku ? { ...item, ...changes } : item)),
      );
      logAction(
        "log.updated",
        { ...product, ...changes },
        { changes: describeChanges(product, changes) },
      );
    },
    [productList, logAction],
  );

  const [saleLines, setSaleLines] = useState([]);
  const [payment, setPayment] = useState("cash");

  const addToSale = useCallback((product) => {
    if (product.stock < 1) return;
    setSaleLines((lines) => {
      const existing = lines.find((line) => line.sku === product.sku);
      if (!existing) return [...lines, { sku: product.sku, qty: 1 }];
      const qty = Math.min(product.stock, existing.qty + 1);
      return lines.map((line) =>
        line.sku === product.sku ? { ...line, qty } : line,
      );
    });
  }, []);

  const setSaleQuantity = useCallback(
    (sku, value) => {
      const product = productList.find((item) => item.sku === sku);
      const parsed = Number(value);
      if (!product || !Number.isFinite(parsed)) return;
      const qty = Math.min(product.stock, Math.max(1, Math.round(parsed)));
      setSaleLines((lines) =>
        lines.map((line) => (line.sku === sku ? { ...line, qty } : line)),
      );
    },
    [productList],
  );

  const removeFromSale = useCallback((sku) => {
    setSaleLines((lines) => lines.filter((line) => line.sku !== sku));
  }, []);

  const clearSale = useCallback(() => setSaleLines([]), []);

  const [sales, setSales] = useState(initialSales);
  const saleSerial = useRef(0);

  const completeSale = useCallback(
    (sold) => {
      const date = todayIso();
      const entries = sold.map((line) => {
        const product = productList.find((item) => item.sku === line.sku);
        saleSerial.current += 1;
        logAction("log.sold", product ?? { name: line.sku, sku: line.sku });
        return {
          id: `SL-${date}-${saleSerial.current}`,
          date,
          sku: line.sku,
          name: product?.name ?? line.sku,
          purchasePrice: product?.purchasePrice ?? 0,
          sellingPrice: product?.sellingPrice ?? 0,
          soldFor: line.soldFor,
          qty: line.qty,
          payment,
        };
      });
      setSales((list) => [...entries, ...list]);

      setProductList((list) =>
        list.map((product) => {
          const line = sold.find((item) => item.sku === product.sku);
          return line
            ? { ...product, stock: Math.max(0, product.stock - line.qty) }
            : product;
        }),
      );
      setSaleLines([]);
    },
    [productList, payment, logAction],
  );

  const [userList, setUserList] = useState(initialUsers);

  const addUser = useCallback((user) => {
    setUserList((list) => [user, ...list]);
  }, []);

  const deleteUser = useCallback((login) => {
    setUserList((list) => list.filter((user) => user.login !== login));
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const active = NAV_ITEMS.find((item) => item.id === current) ?? NAV_ITEMS[0];

  function navigate(id) {
    setCurrent(id);
    setNavOpen(false);
  }

  return (
    <div className="theme-transition h-screen overflow-hidden bg-plane">
      <Sidebar
        current={current}
        onNavigate={navigate}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        footerRef={sidebarFooterRef}
      />

      <div className="flex h-screen flex-col lg:pl-[264px]">
        <Topbar
          title={t(active.labelKey)}
          onOpenNav={() => setNavOpen(true)}
          activityLog={activityLog}
        />

        <main
          id="main"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
        >
          {current === "dashboard" ? (
            <Dashboard
              products={productList}
              sales={sales}
              activityLog={activityLog}
            />
          ) : current === "sales" ? (
            <Sales
              products={productList}
              lines={saleLines}
              payment={payment}
              onPaymentChange={setPayment}
              onAdd={addToSale}
              onQuantityChange={setSaleQuantity}
              onRemove={removeFromSale}
              onClear={clearSale}
              onSell={completeSale}
              barHeight={sidebarFooterHeight || SALE_PANEL_HEIGHT}
            />
          ) : current === "inventory" ? (
            <Inventory
              products={productList}
              onAdd={addProducts}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
              onReturn={returnProduct}
            />
          ) : current === "reports" ? (
            <Reports sales={sales} />
          ) : current === "activity" ? (
            <Activity entries={activityLog} />
          ) : current === "users" ? (
            <Users users={userList} onAdd={addUser} onDelete={deleteUser} />
          ) : (
            <ModulePlaceholder label={t(active.labelKey)} Icon={active.Icon} />
          )}
        </main>
      </div>
    </div>
  );
}
