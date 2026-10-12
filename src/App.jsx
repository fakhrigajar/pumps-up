import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { Sales } from "./pages/Sales";
import { Reports } from "./pages/Reports";
import { Activity } from "./pages/Activity";
import { Users } from "./pages/Users";
import { Tools } from "./pages/Tools";
import { Register } from "./pages/Register";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import { canOpen, NAV_ITEMS, pagesFor } from "./navigation";
import { useTranslation } from "./i18n/context";
import { findByBarcode } from "./data/erp";
import { sessionTotals } from "./data/register";
import { normalizeLogin } from "./data/users";
import { formatPrice } from "./lib/format";
import { SessionContext } from "./auth/context";
import { useSessionState } from "./auth/useSessionState";
import { useAppData } from "./data/useAppData";
import * as store from "./data/store";
import { mapError } from "./lib/errors";
import { useMeasure } from "./lib/useMeasure";
import { useBarcodeScanner } from "./lib/useBarcodeScanner";
import { errorBeep } from "./lib/beep";
import { useToast } from "./toast/context";
import { SALE_PANEL_HEIGHT } from "./lib/layout";

export default function App() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [current, setCurrent] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const [lastScan, setLastScan] = useState(null);
  const [sidebarFooterRef, , sidebarFooterHeight] = useMeasure();

  const [data, apply] = useAppData();
  const { products: productList, users: userList, activity: activityLog, sales, sessions } = data;
  const session = useSessionState(userList);
  const signedIn = session.user;
  const openShift = signedIn ? store.openSessionOf(data, signedIn.login) : null;

  const [readThroughAt, setReadThroughAt] = useState(0);

  useEffect(() => {
    setReadThroughAt(
      signedIn?.activityReadThrough
        ? new Date(signedIn.activityReadThrough).getTime()
        : 0,
    );
  }, [signedIn?.login, signedIn?.activityReadThrough]);

  const unreadActivity = activityLog.filter(
    (entry) => new Date(entry.at).getTime() > readThroughAt,
  ).length;

  const markActivityRead = useCallback(() => {
    if (!signedIn) return;
    const at = Date.now();
    setReadThroughAt(at);
    apply((state) => ({
      ...state,
      users: state.users.map((user) => user.login === signedIn.login ? { ...user, activityReadThrough: at } : user),
    }));
  }, [signedIn, apply]);

  const addProducts = useCallback((newProducts) => {
    apply((state) => store.addProducts(state, newProducts));
    notify(
      newProducts.length === 1
        ? t("toast.added", { name: newProducts[0].name })
        : t("toast.addedCount", { count: newProducts.length }),
      "success",
    );
    return newProducts;
  }, [apply, notify, t]);

  const deleteProduct = useCallback((sku) => {
    const next = apply((state) => store.deleteProduct(state, sku));
    notify(t("toast.deleted", { name: next.activity[0].name }), "success");
  }, [apply, notify, t]);

  const returnProduct = useCallback((sku, units, reason) => {
    const next = apply((state) => store.returnProduct(state, sku, units, reason));
    notify(t("toast.returned", { count: units, name: next.activity[0].name }), "success");
  }, [apply, notify, t]);

  const updateProduct = useCallback((sku, changes) => {
    const next = apply((state) => store.updateProduct(state, sku, changes));
    const product = next.products.find((item) => item.sku === sku);
    notify(t("toast.updated", { name: product.name }), "success");
    return product;
  }, [apply, notify, t]);

  const openRegister = useCallback(() => {
    apply((state) => store.openRegister(state, signedIn.login));
    notify(t("toast.registerOpened"), "success");
  }, [apply, signedIn, notify, t]);

  const closeRegister = useCallback(() => {
    const takings = openShift ? sessionTotals(openShift).revenue : 0;
    try {
      apply((state) => store.closeRegister(state, signedIn.login));
      notify(t("toast.registerClosed", { total: formatPrice(takings) }), "success");
    } catch (error) {
      notify(mapError(error, t), "error");
    }
  }, [apply, signedIn, notify, t, openShift]);

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

  const completeSale = useCallback((sold) => {
    apply((state) => store.completeSale(state, signedIn, payment, sold));
    setSaleLines([]);
    notify(t("toast.sold", {
      count: sold.reduce((units, line) => units + line.qty, 0),
      total: formatPrice(sold.reduce((sum, line) => sum + line.qty * line.soldFor, 0)),
    }), "success");
  }, [apply, signedIn, payment, notify, t]);

  const addUser = useCallback((user) => {
    apply((state) => store.addUser(state, user));
    notify(t("toast.userAdded", { name: user.login }), "success");
  }, [apply, notify, t]);

  const deleteUser = useCallback((login) => {
    apply((state) => store.deleteUser(state, login));
    notify(t("toast.userDeleted", { name: login }), "success");
  }, [apply, notify, t]);

  const updateAccount = useCallback((login, changes) => {
    const next = apply((state) => store.updateAccount(state, login, changes));
    const updated = next.users.find((user) => user.login === normalizeLogin(changes.login ?? login));
    if (updated.login !== login) session.follow(updated.login);
    return updated;
  }, [apply, session]);

  useEffect(() => {
    setSaleLines([]);
    setPayment("cash");
    setLastScan(null);
  }, [signedIn?.login]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const allowed = signedIn ? pagesFor(signedIn.role) : [];
  const page =
    signedIn && canOpen(current, signedIn.role) ? current : allowed[0]?.id;
  const active = NAV_ITEMS.find((item) => item.id === page) ?? NAV_ITEMS[0];

  function navigate(id) {
    setCurrent(id);
    setNavOpen(false);
  }

  function onScan(code) {
    navigate("sales");
    setLastScan({ code });

    const product = findByBarcode(productList, code);
    const tillClosed = signedIn?.role === "cashier" && !openShift;
    const inSale = saleLines.find((line) => line.sku === product?.sku)?.qty ?? 0;

    const problem = !product
      ? { message: t("scan.notFound"), tone: "error" }
      : tillClosed
        ? { message: t("reg.closedHint"), tone: "warning" }
        : inSale >= product.stock
          ? { message: t("scan.noStock", { name: product.name }), tone: "warning" }
          : null;

    if (problem) {
      notify(problem.message, problem.tone);
      errorBeep();
      return;
    }

    addToSale(product);
  }

  useBarcodeScanner(onScan, { enabled: Boolean(signedIn) });

  if (!signedIn) {
    return <Login onSignIn={session.signIn} />;
  }

  return (
    <SessionContext.Provider value={session}>
    <div className="theme-transition h-screen overflow-hidden bg-plane">
      <Sidebar
        current={page}
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
          unreadActivity={unreadActivity}
          activityReadThrough={readThroughAt}
          onActivityRead={markActivityRead}
          onViewActivity={
            canOpen("activity", signedIn.role)
              ? () => navigate("activity")
              : null
          }
        />

        <main
          id="main"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
        >
          {page === "dashboard" ? (
            <Dashboard products={productList} sales={sales} sessions={sessions} activityLog={activityLog} />
          ) : page === "sales" ? (
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
              onSellError={(error) => notify(mapError(error, t), "error")}
              onReturn={returnProduct}
              barHeight={sidebarFooterHeight || SALE_PANEL_HEIGHT}
              lastScan={lastScan}
              register={{
                required: signedIn.role === "cashier",
                session: openShift,
                onOpen: openRegister,
                onClose: closeRegister,
              }}
            />
          ) : page === "inventory" ? (
            <Inventory
              products={productList}
              onAdd={addProducts}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
            />
          ) : page === "reports" ? (
            <Reports sales={sales} sessions={sessions} />
          ) : page === "activity" ? (
            <Activity entries={activityLog} />
          ) : page === "users" ? (
            <Users users={userList} onAdd={addUser} onDelete={deleteUser} />
          ) : page === "tools" ? (
            <Tools products={productList} />
          ) : page === "register" ? (
            <Register users={userList} sessions={sessions} />
          ) : page === "settings" ? (
            <Settings users={userList} onUpdateAccount={updateAccount} />
          ) : (
            <ModulePlaceholder label={t(active.labelKey)} Icon={active.Icon} />
          )}
        </main>
      </div>
    </div>
    </SessionContext.Provider>
  );
}
