import { Card } from "../ui/Card";
import { IconClose, IconSearch } from "../Icons";
import { useTranslation } from "../../i18n/context";

export function ProductSearch({ query, onQueryChange, resultCount, totalCount }) {
  const { t } = useTranslation();
  const filtering = query.trim().length > 0;

  return (
    <div className="shrink-0 pb-4">
      <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
        <label className="relative min-w-[220px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("inv.search")}
            aria-label={t("inv.searchLabel")}
            className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-9 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1"
          />
          {filtering ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink-1"
            >
              <IconClose className="h-4 w-4" />
              <span className="sr-only">{t("inv.clear")}</span>
            </button>
          ) : null}
        </label>

        <p className="text-[13px] text-ink-3" aria-live="polite">
          {filtering
            ? t("inv.countFiltered", { count: resultCount, total: totalCount })
            : t("inv.count", { count: totalCount })}
        </p>
      </Card>
    </div>
  );
}
