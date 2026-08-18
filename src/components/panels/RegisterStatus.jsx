import { Card, CardHeader } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";
import { sessionTotals } from "../../data/register";
import { formatClockTime, formatPrice } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

/**
 * Who is standing at a till right now.
 *
 * A closed till is a card that says so rather than a card that is missing:
 * "three cashiers, one open" is the state of the shop floor, and it cannot be
 * read off a list that only contains what is open.
 */
export function RegisterStatus({ status }) {
  const { t } = useTranslation();
  const open = status.filter((row) => row.session).length;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={t("dash.register")}
        subtitle={t("dash.registerCount", { count: open })}
      />

      {status.length === 0 ? (
        <p className="px-5 pb-5 pt-3 text-[13px] text-ink-3">
          {t("dash.noCashiers")}
        </p>
      ) : (
        <ul className="grid gap-3 px-5 pb-5 pt-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {status.map(({ login, session }) => {
            const totals = session ? sessionTotals(session) : null;

            return (
              <li
                key={login}
                className="rounded-lg border border-line bg-surface-2 px-3.5 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase text-white"
                    style={{
                      backgroundColor: session
                        ? "var(--status-good)"
                        : "var(--ink-3)",
                    }}
                  >
                    {login.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-1">
                    {login}
                  </span>
                  <StatusPill tone={session ? "good" : "neutral"}>
                    {t(session ? "dash.open" : "dash.closed")}
                  </StatusPill>
                </div>

                <p className="mt-2 text-[12px] tabular-nums text-ink-3">
                  {session
                    ? `${t("reg.openSince", {
                        time: formatClockTime(session.openedAt),
                      })} · ${t("reg.ordersCount", { count: totals.orders })} · ${formatPrice(totals.revenue)}`
                    : t("dash.noShift")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
