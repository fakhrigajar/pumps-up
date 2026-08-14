import { Card } from "../ui/Card";
import { formatDate } from "../../lib/format";
import { useTranslation } from "../../i18n/context";

const ROLE_TONES = {
  admin: "var(--series-1)",
  cashier: "var(--series-2)",
};

function RoleBadge({ role }) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-ink-1">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: ROLE_TONES[role] ?? "var(--ink-3)" }}
      />
      {t(`role.${role}`)}
    </span>
  );
}

export function UserTable({
  users,
  title,
  hint,
  actions,
  isSelected = () => false,
  onSelect,
}) {
  const { t } = useTranslation();

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-t-[11px] bg-surface-1 px-5 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-ink-1">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{hint}</p>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table
          role="grid"
          aria-label={title}
          className="w-full border-separate border-spacing-0 text-left text-[13px]"
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pl-5 pr-4 text-[12px] font-medium text-ink-3"
              >
                {t("usr.col.user")}
              </th>
              <th
                scope="col"
                className="sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-4 text-[12px] font-medium text-ink-3"
              >
                {t("usr.col.role")}
              </th>
              <th
                scope="col"
                className="sticky top-0 z-[5] border-y border-line bg-surface-2 py-2 pr-5 text-right text-[12px] font-medium text-ink-3"
              >
                {t("usr.col.added")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const selected = isSelected(user);
              const cellBorder =
                index === users.length - 1 ? "" : "border-b border-line";
              const activate = () => onSelect(user);

              return (
                <tr
                  key={user.login}
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={activate}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      activate();
                    }
                  }}
                  className={`cursor-pointer select-none ${
                    selected ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  <td
                    className={`py-2.5 pl-5 pr-4 ${cellBorder}`}
                    style={
                      selected
                        ? { boxShadow: "inset 3px 0 0 var(--series-1)" }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold uppercase text-white"
                      >
                        {user.login.slice(0, 2)}
                      </span>
                      <span className="font-medium text-ink-1">
                        {user.login}
                      </span>
                    </span>
                  </td>
                  <td className={`py-2.5 pr-4 ${cellBorder}`}>
                    <RoleBadge role={user.role} />
                  </td>
                  <td
                    className={`whitespace-nowrap py-2.5 pr-5 text-right tabular-nums text-ink-2 ${cellBorder}`}
                  >
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-3">
            {t("usr.empty")}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
