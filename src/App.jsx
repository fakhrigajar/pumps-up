import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  findByBarcode,
  mulberry32,
  products as initialProducts,
  salesHistory as initialSales,
} from "./data/erp";
import { users as initialUsers } from "./data/users";
import {
  buildRegisterHistory,
  closeSession,
  openSession,
  openSessionOf,
} from "./data/register";
import { SessionContext } from "./auth/context";
import { useSessionState } from "./auth/useSessionState";
import { todayIso } from "./lib/dates";
import { useMeasure } from "./lib/useMeasure";
import { useBarcodeScanner } from "./lib/useBarcodeScanner";
import { errorBeep } from "./lib/beep";
import { useToast } from "./toast/context";
import { SALE_PANEL_HEIGHT } from "./lib/layout";

/**
 * The shifts behind the seeded ledger. Built once at module load from the same
 * sales the reports read, so every screen is describing one history.
 *
 * It hands back which checkout each ledger row was part of and who rang it up,
 * and the ledger is stamped with both here: "how many orders" and "whose" are
 * then questions the sales list can answer on its own, for a seeded month and
 * for a sale rung up a minute ago alike.
 */
const seeded = buildRegisterHistory(
  initialSales,
  initialUsers.filter((user) => user.role === "cashier").map((user) => user.login),
  mulberry32(4931),
);

const initialSessions = seeded.sessions;

const seededSales = initialSales.map((sale) => {
  const stamp = seeded.stampOf.get(sale.id);
  return {
    ...sale,
    orderId: stamp?.orderId ?? sale.id,
    cashier: stamp?.cashier ?? null,
  };
});

function describeChanges(before, after) {
  if (!before) return null;
  const changed = Object.keys(after)
    .filter((field) => before[field] !== after[field])
    .map((field) => ({ field, from: before[field], to: after[field] }));
  return changed.length > 0 ? changed : null;
}

export default function App() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [current, setCurrent] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  // The last code the scanner sent, wrapped in a fresh object every time so
  // that scanning the same label twice is still two scans for the till to
  // react to — it watches the object, not the string inside it.
  const [lastScan, setLastScan] = useState(null);

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

  // Everything logged up to this id has been seen. A watermark rather than a
  // read flag on every entry is what keeps the two honest with each other:
  // marking the log read is one number to move, and an entry is unread on its
  // own terms — it was issued a higher id than the last one looked at, so an
  // entry logged while the panel is open cannot be swept up by it.
  const [readThroughId, setReadThroughId] = useState(0);

  const unreadActivity = activityLog.filter(
    (entry) => entry.id > readThroughId,
  ).length;

  /** Opening the panel is reading it: the serial has already stamped every
   * entry that exists, so the watermark can move to it without consulting the
   * log itself. */
  const markActivityRead = useCallback(() => {
    setReadThroughId(logSerial.current);
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

  const [userList, setUserList] = useState(initialUsers);
  const session = useSessionState(userList);
  const signedIn = session.user;

  // Every shift ever rung up, newest first. A cashier's own open shift is
  // found in here rather than held beside it, so there is one list to add an
  // order to and one list to read a history from.
  const [sessions, setSessions] = useState(initialSessions);
  const openShift = signedIn ? openSessionOf(sessions, signedIn.login) : null;

  const openRegister = useCallback(() => {
    if (!signedIn) return;
    setSessions((list) =>
      openSessionOf(list, signedIn.login)
        ? list
        : [openSession(signedIn.login), ...list],
    );
  }, [signedIn]);

  const closeRegister = useCallback(() => {
    if (!signedIn) return;
    setSessions((list) =>
      list.map((item) =>
        item.cashier === signedIn.login && item.closedAt === null
          ? closeSession(item)
          : item,
      ),
    );
  }, [signedIn]);

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

  const [sales, setSales] = useState(seededSales);
  const saleSerial = useRef(0);

  const completeSale = useCallback(
    (sold) => {
      const date = todayIso();
      // One checkout, one id: the ledger rows it produces and the shift order
      // it becomes are stamped with the same one, so counting orders on the
      // reports screen counts this sale once however many products were on
      // the counter — and counts it whether or not a register was open.
      const at = Date.now();
      const orderId = `OR-${at}`;

      const entries = sold.map((line) => {
        const product = productList.find((item) => item.sku === line.sku);
        saleSerial.current += 1;
        logAction("log.sold", product ?? { name: line.sku, sku: line.sku });
        return {
          id: `SL-${date}-${saleSerial.current}`,
          orderId,
          cashier: signedIn?.login ?? null,
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

      // The ledger keeps a row per product; the shift keeps the checkout whole.
      // Both are written from the same sale, so an order can never appear in
      // one and not the other.
      if (signedIn) {
        setSessions((list) =>
          list.map((item) =>
            item.cashier === signedIn.login && item.closedAt === null
              ? {
                  ...item,
                  orders: [
                    ...item.orders,
                    {
                      id: orderId,
                      at,
                      payment,
                      lines: entries.map((entry) => ({
                        sku: entry.sku,
                        name: entry.name,
                        qty: entry.qty,
                        soldFor: entry.soldFor,
                      })),
                    },
                  ],
                }
              : item,
          ),
        );
      }

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
    [productList, payment, logAction, signedIn],
  );

  const addUser = useCallback((user) => {
    setUserList((list) => [user, ...list]);
  }, []);

  const deleteUser = useCallback((login) => {
    setUserList((list) => list.filter((user) => user.login !== login));
  }, []);

  // An account editing itself on the settings screen. The session is pointed
  // at the new login in the same breath as the list is rewritten, so a rename
  // is a rename rather than an accidental sign-out.
  const updateAccount = useCallback(
    (login, changes) => {
      setUserList((list) =>
        list.map((user) =>
          user.login === login ? { ...user, ...changes } : user,
        ),
      );
      if (changes.login && changes.login !== login) session.follow(changes.login);
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

  // What the signed-in role may open, and where it lands. A cashier's first
  // page is the till rather than a dashboard they cannot see, and a page left
  // behind by signing out as an admin is not still on screen when a cashier
  // signs in — `current` is answered against the role every render, not only
  // when a nav button is pressed.
  const allowed = signedIn ? pagesFor(signedIn.role) : [];
  const page =
    signedIn && canOpen(current, signedIn.role) ? current : allowed[0]?.id;
  const active = NAV_ITEMS.find((item) => item.id === page) ?? NAV_ITEMS[0];

  function navigate(id) {
    setCurrent(id);
    setNavOpen(false);
  }

  /**
   * A scan, from wherever in the app it was made.
   *
   * The scanner is a keyboard, and a keyboard is not attached to a screen —
   * so this is answered here rather than on the till, and the till is where
   * it lands whatever was in front of the cashier at the time. The page and
   * the basket are set in the same handler and so in the same render: the
   * transition is one frame with the product already on it, not a hop
   * followed by an add.
   *
   * `addToSale` is the same call a tapped row makes, which is what keeps a
   * second scan of something raising its quantity rather than opening a
   * duplicate line, and leaves the totals to follow from the lines.
   */
  function onScan(code) {
    navigate("sales");
    setLastScan({ code });

    const product = findByBarcode(productList, code);
    const tillClosed = signedIn?.role === "cashier" && !openShift;
    const inSale = saleLines.find((line) => line.sku === product?.sku)?.qty ?? 0;

    // A till a cashier has not opened takes nothing by scanner either, but it
    // says so on the screen it has just moved them to rather than swallowing
    // the scan — as does a code nothing answers to, and a product with none
    // left to sell. Silence is indistinguishable from a scanner that missed.
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

  // Live for as long as somebody is signed in, on every page there is.
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
          onActivityRead={markActivityRead}
          onViewActivity={
            canOpen("activity", signedIn.role)
              ? () => navigate("activity")
              : null
          }
        />

        {/* Takes what the topbar leaves and no more. A page that wants to be
            taller than this scrolls a list inside itself rather than pushing
            the window down. */}
        <main
          id="main"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
        >
          {page === "dashboard" ? (
            <Dashboard
              products={productList}
              sales={sales}
              sessions={sessions}
              users={userList}
              activityLog={activityLog}
            />
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
            <Reports sales={sales} sessions={sessions} />
          ) : page === "activity" ? (
            <Activity entries={activityLog} />
          ) : page === "users" ? (
            <Users users={userList} onAdd={addUser} onDelete={deleteUser} />
          ) : page === "tools" ? (
            <Tools products={productList} />
          ) : page === "register" ? (
            <Register sessions={sessions} users={userList} />
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
