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
import { LoadingScreen } from "./components/LoadingScreen";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import { canOpen, NAV_ITEMS, pagesFor } from "./navigation";
import { useTranslation } from "./i18n/context";
import { findByBarcode } from "./data/erp";
import { SessionContext } from "./auth/context";
import { useSessionState } from "./auth/useSessionState";
import { products as productsApi } from "./api/products";
import { users as usersApi } from "./api/users";
import { orders as ordersApi } from "./api/orders";
import { activity as activityApi } from "./api/activity";
import { mapApiError } from "./api/errors";
import { useMeasure } from "./lib/useMeasure";
import { useBarcodeScanner } from "./lib/useBarcodeScanner";
import { errorBeep } from "./lib/beep";
import { useToast } from "./toast/context";
import { SALE_PANEL_HEIGHT } from "./lib/layout";

const ACTIVITY_FEED_LIMIT = 100;

export default function App() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [current, setCurrent] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const [lastScan, setLastScan] = useState(null);
  const [sidebarFooterRef, , sidebarFooterHeight] = useMeasure();

  const session = useSessionState();
  const signedIn = session.user;

  const [productList, setProductList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [openShift, setOpenShift] = useState(null);

  // Everything logged up to this moment has been seen. A watermark rather
  // than a read flag on every entry: marking the log read is one number to
  // move, and an entry issued after that moment is unread on its own terms.
  const [readThroughAt, setReadThroughAt] = useState(0);
  const unreadActivity = activityLog.filter(
    (entry) => new Date(entry.at).getTime() > readThroughAt,
  ).length;
  const markActivityRead = useCallback(() => setReadThroughAt(Date.now()), []);

  // What every signed-in role needs, fetched once per session rather than
  // shipped as static data: the catalogue (Sales needs it too, not just
  // Inventory), the recent activity feed, and this account's own shift.
  useEffect(() => {
    if (!signedIn) return undefined;
    let cancelled = false;

    productsApi.list().then((list) => {
      if (!cancelled) setProductList(list);
    }).catch(() => {});
    activityApi.list(ACTIVITY_FEED_LIMIT).then((entries) => {
      if (!cancelled) setActivityLog(entries);
    }).catch(() => {});
    ordersApi.mine().then((mySession) => {
      if (!cancelled) setOpenShift(mySession);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [signedIn?.login]);

  // The account list is admin-only data — a cashier's browser never asks for
  // it, matching the page it feeds (Users) being an admin-only nav item.
  useEffect(() => {
    if (!signedIn || signedIn.role !== "admin") {
      setUserList([]);
      return undefined;
    }
    let cancelled = false;
    usersApi.list().then((list) => {
      if (!cancelled) setUserList(list);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn?.login, signedIn?.role]);

  const addProducts = useCallback(async (newProducts) => {
    const { products: created, activity: entries } = await productsApi.add(newProducts);
    setProductList((list) => [...created, ...list]);
    setActivityLog((log) => [...entries, ...log]);
    return created;
  }, []);

  const deleteProduct = useCallback(async (sku) => {
    const { sku: deletedSku, activity: entries } = await productsApi.remove(sku);
    setProductList((list) => list.filter((item) => item.sku !== deletedSku));
    setActivityLog((log) => [...entries, ...log]);
  }, []);

  const returnProduct = useCallback(async (sku, units, reason) => {
    const { product, activity: entries } = await productsApi.returnStock(sku, units, reason);
    setProductList((list) => list.map((item) => (item.sku === product.sku ? product : item)));
    setActivityLog((log) => [...entries, ...log]);
  }, []);

  const updateProduct = useCallback(async (sku, changes) => {
    const { product, activity: entries } = await productsApi.update(sku, changes);
    setProductList((list) => list.map((item) => (item.sku === product.sku ? product : item)));
    setActivityLog((log) => [...entries, ...log]);
    return product;
  }, []);

  const openRegister = useCallback(async () => {
    setOpenShift(await ordersApi.open());
  }, []);

  const closeRegister = useCallback(async () => {
    setOpenShift(await ordersApi.close());
  }, []);

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

  /**
   * Checkout. Ported from the client-side `completeSale` this used to be —
   * the same call, but now one request the server commits as a single
   * transaction (ledger rows, the shift's order, the stock decrement) rather
   * than three separate `useState` updates trusted to stay in sync.
   */
  const completeSale = useCallback(
    async (sold) => {
      const result = await ordersApi.create(payment, sold);
      setProductList((list) =>
        list.map((product) => {
          const updated = result.products.find((item) => item.sku === product.sku);
          return updated ? { ...product, stock: updated.stock } : product;
        }),
      );
      if (result.session) setOpenShift(result.session);
      setActivityLog((log) => [...result.activity, ...log]);
      setSaleLines([]);
    },
    [payment],
  );

  const addUser = useCallback(async (user) => {
    const created = await usersApi.add(user);
    setUserList((list) => [created, ...list]);
  }, []);

  const deleteUser = useCallback(async (login) => {
    await usersApi.remove(login);
    setUserList((list) => list.filter((user) => user.login !== login));
  }, []);

  // An account editing itself on the settings screen. The session follows a
  // rename in the same breath the list is rewritten, so a rename reads as a
  // rename rather than an accidental sign-out.
  const updateAccount = useCallback(
    async (login, changes) => {
      const updated = await usersApi.updateSelf(changes);
      setUserList((list) => list.map((user) => (user.login === login ? updated : user)));
      if (changes.login && changes.login !== login) session.follow(changes.login);
      return updated;
    },
    [session],
  );

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
      ? t("scan.notFound")
      : tillClosed
        ? t("reg.closedHint")
        : inSale >= product.stock
          ? t("scan.noStock", { name: product.name })
          : null;

    if (problem) {
      notify(problem, "error");
      errorBeep();
      return;
    }

    addToSale(product);
  }

  useBarcodeScanner(onScan, { enabled: Boolean(signedIn) });

  if (!session.authChecked) {
    return <LoadingScreen />;
  }

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
            <Dashboard products={productList} activityLog={activityLog} />
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
              onSellError={(error) => notify(mapApiError(error, t), "error")}
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
              onReturn={returnProduct}
            />
          ) : page === "reports" ? (
            <Reports />
          ) : page === "activity" ? (
            <Activity />
          ) : page === "users" ? (
            <Users users={userList} onAdd={addUser} onDelete={deleteUser} />
          ) : page === "tools" ? (
            <Tools products={productList} />
          ) : page === "register" ? (
            <Register users={userList} />
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
