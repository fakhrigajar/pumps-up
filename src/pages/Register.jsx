import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import {
  closingStatus,
  openingStatus,
  sessionProducts,
  sessionTotals,
} from "../data/register";
import {
  formatClockTime,
  formatDate,
  formatNumber,
  formatPrice,
} from "../lib/format";
import { useSession } from "../auth/context";
import { useStoreSettings } from "../settings/context";
import { useTranslation } from "../i18n/context";

const ALL_CASHIERS = "all";

/**
 * Register sessions — a shift per row, newest first.
 *
 * The same screen serves both roles, because the difference between them is
 * which shifts exist as far as they are concerned rather than what a shift
 * looks like: an admin is handed every cashier's and a filter to pick between
 * them, a cashier is handed their own and no filter, and neither is a view of
 * the other's page with parts hidden.
 */
export function Register({ sessions, users }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const { settings } = useStoreSettings();
  const admin = user.role === "admin";

  const [cashier, setCashier] = useState(ALL_CASHIERS);
  const [openId, setOpenId] = useState(null);

  const mine = useMemo(
    () =>
      admin
        ? sessions
        : sessions.filter((session) => session.cashier === user.login),
    [sessions, admin, user.login],
  );

  const rows = useMemo(
    () =>
      cashier === ALL_CASHIERS
        ? mine
        : mine.filter((session) => session.cashier === cashier),
    [mine, cashier],
  );

  const cashierOptions = useMemo(
    () => [
      { value: ALL_CASHIERS, label: t("reg.allCashiers") },
      ...users
        .filter((account) => account.role === "cashier")
        .map((account) => ({ value: account.login, label: account.login })),
    ],
    [users, t],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, session) => {
          const totalsOf = sessionTotals(session);
          return {
            orders: sum.orders + totalsOf.orders,
            units: sum.units + totalsOf.units,
            revenue: sum.revenue + totalsOf.revenue,
          };
        },
        { orders: 0, units: 0, revenue: 0 },
      ),
    [rows],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-4">
        <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
          {admin ? (
            <Select
              variant="pill"
              label={t("reg.cashier")}
              caption={t("reg.cashier")}
              value={cashier}
              onChange={setCashier}
              options={cashierOptions}
            />
          ) : (
            <p className="text-[13px] font-medium text-ink-1">
              {t("reg.mine")}
            </p>
          )}

          <p className="text-[13px] text-ink-3" aria-live="polite">
            {t("reg.count", { count: rows.length })}
            {rows.length > 0
              ? ` · ${t("reg.ordersCount", { count: totals.orders })} · ${formatPrice(totals.revenue)}`
              : ""}
          </p>

          {/* The hours every row below is being judged against, said once
              here rather than implied by the colour of forty cells. */}
          <p className="ml-auto text-[12.5px] tabular-nums text-ink-3">
            {t("reg.storeHours", {
              opens: settings.opensAt,
              closes: settings.closesAt,
            })}
          </p>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {t("reg.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{t("reg.subtitle")}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr>
                {admin ? <Th className="pl-5">{t("reg.col.cashier")}</Th> : null}
                <Th className={admin ? "" : "pl-5"}>{t("reg.col.date")}</Th>
                <Th>{t("reg.col.opened")}</Th>
                <Th>{t("reg.col.closed")}</Th>
                <Th align="right">{t("reg.col.orders")}</Th>
                <Th align="right">{t("reg.col.items")}</Th>
                <Th align="right" className="pr-5">
                  {t("reg.col.revenue")}
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((session, index) => {
                const totalsOf = sessionTotals(session);
                const expanded = session.id === openId;
                const border =
                  index === rows.length - 1 && !expanded
                    ? ""
                    : "border-b border-line";

                return (
                  <SessionRows
                    key={session.id}
                    session={session}
                    totals={totalsOf}
                    admin={admin}
                    hours={settings}
                    border={border}
                    expanded={expanded}
                    onToggle={() => setOpenId(expanded ? null : session.id)}
                  />
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[13px] text-ink-2">{t("reg.empty")}</p>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] text-ink-3">
                {t("reg.emptyHint")}
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

/**
 * A shift and, when it is opened, what was sold on it. The products live in a
 * second row of the same table rather than in a panel elsewhere, so the list
 * stays under the shift it belongs to when several are opened in turn.
 */
function SessionRows({
  session,
  totals,
  admin,
  hours,
  border,
  expanded,
  onToggle,
}) {
  const { t } = useTranslation();
  const open = session.closedAt === null;

  return (
    <>
      <tr
        aria-selected={expanded}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={`cursor-pointer select-none ${
          expanded ? "bg-surface-2" : "hover:bg-surface-2"
        }`}
      >
        {admin ? (
          <td className={`py-2.5 pl-5 pr-4 align-top font-medium text-ink-1 ${border}`}>
            {session.cashier}
          </td>
        ) : null}

        <td
          className={`py-2.5 pr-4 align-top text-ink-1 ${admin ? "" : "pl-5"} ${border}`}
        >
          {formatDate(session.date)}
        </td>

        <td className={`py-2.5 pr-4 align-top tabular-nums text-ink-2 ${border}`}>
          <ClockCell
            at={session.openedAt}
            status={openingStatus(session.openedAt, hours.opensAt)}
          />
        </td>

        <td className={`py-2.5 pr-4 align-top tabular-nums text-ink-2 ${border}`}>
          {open ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: "var(--status-good)" }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--status-good)" }}
              />
              {t("reg.open")}
            </span>
          ) : (
            <ClockCell
              at={session.closedAt}
              status={closingStatus(session.closedAt, hours.closesAt)}
            />
          )}
        </td>

        <td className={`py-2.5 pr-4 text-right align-top tabular-nums text-ink-2 ${border}`}>
          {formatNumber(totals.orders)}
        </td>
        <td className={`py-2.5 pr-4 text-right align-top tabular-nums text-ink-2 ${border}`}>
          {formatNumber(totals.units)}
        </td>
        <td
          className={`py-2.5 pr-5 text-right align-top font-medium tabular-nums text-ink-1 ${border}`}
        >
          {formatPrice(totals.revenue)}
        </td>
      </tr>

      {expanded ? (
        <tr>
          <td colSpan={admin ? 7 : 6} className="border-b border-line bg-surface-2 px-5 py-3">
            <p className="text-[12px] font-medium uppercase tracking-wider text-ink-3">
              {t("reg.products")}
            </p>

            {totals.orders === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">{t("reg.noSales")}</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {sessionProducts(session).map((product) => (
                  <li
                    key={product.sku}
                    className="flex items-baseline justify-between gap-4 text-[13px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink-1">
                      {product.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-3">
                      {t("reg.units", { count: product.qty })}
                    </span>
                    <span className="w-[92px] shrink-0 text-right font-medium tabular-nums text-ink-1">
                      {formatPrice(product.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

/**
 * A time, and how it compares to the hour the shop keeps.
 *
 * The verdict sits under the clock rather than beside it because it is read
 * down a column: a scan of the Opened column should show the late shifts as
 * a run of red without anybody reading a single word of it.
 */
function ClockCell({ at, status }) {
  const { t } = useTranslation();

  return (
    <>
      <span className="block">{formatClockTime(at)}</span>
      {status ? (
        <span
          className="mt-0.5 block whitespace-nowrap text-[11.5px] font-medium"
          style={{ color: `var(--status-${status.tone})` }}
        >
          ({t(status.key)})
        </span>
      ) : null}
    </>
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
