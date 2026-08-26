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
import { sessionTotals } from "./data/register";
import { formatPrice } from "./lib/format";
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

  // Every mutation below says so when it lands. The dialogs already report
  // their own failures inline, next to the field that caused them, so what is
  // missing is the other half: a row changing behind a dialog that has just
  // closed is not, on its own, confirmation that the server agreed.
  const addProducts = useCallback(async (newProducts) => {
    const { products: created, activity: entries } = await productsApi.add(newProducts);
    setProductList((list) => [...created, ...list]);
    setActivityLog((log) => [...entries, ...log]);
    // Naming the product only reads right when there is exactly one, and
    // that is not the same question as which plural form to use: Russian
    // puts 21 in its `one` category, so the choice is made here rather than
    // left to a `_one` template that quietly drops the count.
    notify(
      created.length === 1
        ? t("toast.added", { name: created[0].name })
        : t("toast.addedCount", { count: created.length }),
      "success",
    );
    return created;
  }, [notify, t]);

  // The name comes back on the log entry rather than out of the catalogue:
  // by the time there is something to announce, the product it named is gone
  // from the list this would have looked it up in.
  const deleteProduct = useCallback(async (sku) => {
    const { sku: deletedSku, activity: entries } = await productsApi.remove(sku);
    setProductList((list) => list.filter((item) => item.sku !== deletedSku));
    setActivityLog((log) => [...entries, ...log]);
    notify(t("toast.deleted", { name: entries[0]?.name ?? deletedSku }), "success");
  }, [notify, t]);

  const returnProduct = useCallback(async (sku, units, reason) => {
    const { product, activity: entries } = await productsApi.returnStock(sku, units, reason);
    setProductList((list) => list.map((item) => (item.sku === product.sku ? product : item)));
    setActivityLog((log) => [...entries, ...log]);
    notify(t("toast.returned", { count: units, name: product.name }), "success");
  }, [notify, t]);

  const updateProduct = useCallback(async (sku, changes) => {
    const { product, activity: entries } = await productsApi.update(sku, changes);
    setProductList((list) => list.map((item) => (item.sku === product.sku ? product : item)));
    setActivityLog((log) => [...entries, ...log]);
    notify(t("toast.updated", { name: product.name }), "success");
    return product;
  }, [notify, t]);

  // Nothing downstream catches these — the register bar calls them straight
  // from its buttons — so they answer for themselves, either way.
  const openRegister = useCallback(async () => {
    try {
      setOpenShift(await ordersApi.open());
      notify(t("toast.registerOpened"), "success");
    } catch (error) {
      notify(mapApiError(error, t), "error");
    }
  }, [notify, t]);

  // The takings are read off the shift being closed, before the call: what
  // comes back is a till with no session on it, which is the point.
  const closeRegister = useCallback(async () => {
    const takings = openShift ? sessionTotals(openShift).revenue : 0;
    try {
      setOpenShift(await ordersApi.close());
      notify(
        t("toast.registerClosed", { total: formatPrice(takings) }),
        "success",
      );
    } catch (error) {
      notify(mapApiError(error, t), "error");
    }
  }, [notify, t, openShift]);

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
      notify(
        t("toast.sold", {
          count: sold.reduce((units, line) => units + line.qty, 0),
          total: formatPrice(
            sold.reduce((sum, line) => sum + line.qty * line.soldFor, 0),
          ),
        }),
        "success",
      );
    },
    [payment, notify, t],
  );

  const addUser = useCallback(async (user) => {
    const created = await usersApi.add(user);
    setUserList((list) => [created, ...list]);
    notify(t("toast.userAdded", { name: created.login }), "success");
  }, [notify, t]);

  const deleteUser = useCallback(async (login) => {
    await usersApi.remove(login);
    setUserList((list) => list.filter((user) => user.login !== login));
    notify(t("toast.userDeleted", { name: login }), "success");
  }, [notify, t]);

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

    // A code that matched nothing is a failure; a till that is not open yet
    // and a product already rung up to its last unit are both the scan
    // working correctly and finding a reason not to proceed. Same beep — the
    // hand reaching for the next item needs stopping either way — but the
    // card that explains it is not red for the two that are recoverable.
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

  // A tab resuming a session has a moment where it does not yet know who is
  // signed in; showing the sign-in screen through it would ask a signed-in
  // cashier to sign in again for a frame. A tab that never signed in skips
  // this entirely — `authChecked` starts true there.
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
