import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { IconChevronDown } from "../components/Icons";
import {
  formatClockTime,
  formatMinutesAgo,
  formatNumber,
  formatPrice,
} from "../lib/format";
import { useTranslation } from "../i18n/context";

const ACTIONS = [
  { id: "added", messageKey: "log.added", tone: "var(--series-2)" },
  { id: "updated", messageKey: "log.updated", tone: "var(--series-1)" },
  { id: "sold", messageKey: "log.sold", tone: "var(--status-good)" },
  { id: "returned", messageKey: "log.returned", tone: "var(--status-warning)" },
  { id: "deleted", messageKey: "log.deleted", tone: "var(--status-critical)" },
];

const ACTION_BY_MESSAGE = new Map(
  ACTIONS.map((action) => [action.messageKey, action]),
);

const CHANGE_FIELDS = {
  name: { labelKey: "dlg.name", format: (value) => value },
  category: {
    labelKey: "dlg.category",
    format: (value, t) => t(`category.${value}`),
  },
  stock: { labelKey: "dlg.stock", format: (value) => formatNumber(value) },
  purchasePrice: {
    labelKey: "dlg.purchase",
    format: (value) => formatPrice(value),
  },
  sellingPrice: {
    labelKey: "dlg.selling",
    format: (value) => formatPrice(value),
  },
};

const MINUTE = 60_000;
export function Activity({ entries }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), MINUTE);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    if (filter === "all") return entries;
    const messageKey = ACTIONS.find(
      (action) => action.id === filter,
    )?.messageKey;
    return entries.filter((entry) => entry.messageKey === messageKey);
  }, [entries, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-4">
        <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
          <label className="relative flex h-9 items-center rounded-lg border border-line bg-surface-1 pl-3 pr-8 hover:bg-surface-2">
            <span className="mr-1.5 text-[13px] text-ink-3">
              {t("act.filter")}
            </span>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label={t("act.filter")}
              className="cursor-pointer appearance-none bg-transparent pr-1 text-[13px] font-medium text-ink-1 outline-none"
            >
              <option value="all">{t("act.all")}</option>
              {ACTIONS.map((action) => (
                <option key={action.id} value={action.id}>
                  {t(`act.action.${action.id}`)}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-ink-3" />
          </label>

          <p className="text-[13px] text-ink-3" aria-live="polite">
            {t("act.count", { count: rows.length })}
          </p>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {t("activity.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{t("act.subtitle")}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr>
                <Th className="pl-5">{t("act.col.action")}</Th>
                <Th>{t("act.col.product")}</Th>
                <Th align="right" className="pr-5">
                  {t("act.col.when")}
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, index) => {
                const action = ACTION_BY_MESSAGE.get(entry.messageKey);
                const border =
                  index === rows.length - 1 ? "" : "border-b border-line";
                const minutes = Math.max(
                  0,
                  Math.round((now - entry.at) / MINUTE),
                );

                return (
                  <tr key={entry.id}>
                    <td className={`py-2.5 pl-5 pr-4 align-top ${border}`}>
                      <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-ink-1">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: action?.tone ?? "var(--ink-3)",
                          }}
                        />
                        {action
                          ? t(`act.action.${action.id}`)
                          : entry.messageKey}
                      </span>
                    </td>

                    <td className={`py-2.5 pr-4 align-top ${border}`}>
                      <span className="block font-medium text-ink-1">
                        {entry.name}
                      </span>

                      {(entry.changes ?? [])
                        .filter((change) => CHANGE_FIELDS[change.field])
                        .map((change) => (
                          <ChangeLine key={change.field} change={change} />
                        ))}

                      {entry.reason ? (
                        <span className="mt-0.5 block text-[11.5px] italic text-ink-2">
                          “{entry.reason}”
                        </span>
                      ) : null}
                    </td>

                    <td
                      className={`whitespace-nowrap py-2.5 pr-5 text-right align-top ${border}`}
                    >
                      <span className="block tabular-nums text-ink-1">
                        {formatClockTime(entry.at)}
                      </span>
                      <span className="block text-[11.5px] text-ink-3">
                        {formatMinutesAgo(minutes)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[13px] text-ink-2">
                {t(entries.length === 0 ? "activity.empty" : "act.noMatch")}
              </p>
              {entries.length === 0 ? (
                <p className="mx-auto mt-1.5 max-w-md text-[12.5px] text-ink-3">
                  {t("act.emptyHint")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function ChangeLine({ change }) {
  const { t } = useTranslation();
  const { labelKey, format } = CHANGE_FIELDS[change.field];

  return (
    <span className="mt-0.5 block text-[11.5px] text-ink-3">
      {t(labelKey)} <del>{format(change.from, t)}</del>
      <span aria-hidden="true"> → </span>
      <ins className="font-medium text-ink-2 no-underline">
        {format(change.to, t)}
      </ins>
    </span>
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
