import { Logo } from "./Logo";
import { useTranslation } from "../i18n/context";
import { IconClose, IconSettings } from "./Icons";
import { NAV_SECTIONS } from "../navigation";

export function Sidebar({ current, onNavigate, open, onClose, footerRef }) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface-1 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={t("nav.main")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
          <a href="#main" className="flex items-center gap-2 text-ink-1">
            <Logo className="h-[18px] w-auto" />
            <span className="sr-only">Pumps Up ERP</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink-1 lg:hidden"
          >
            <IconClose />
            <span className="sr-only">{t("nav.close")}</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.titleKey} className="mb-5 last:mb-0">
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-3">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ id, labelKey, Icon }) => {
                  const active = current === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(id)}
                        aria-current={active ? "page" : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition-colors ${
                          active
                            ? "bg-surface-2 font-medium text-ink-1"
                            : "text-ink-2 hover:bg-surface-2 hover:text-ink-1"
                        }`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${
                            active ? "text-accent" : "text-ink-3"
                          }`}
                        />
                        <span className="flex-1 text-left">{t(labelKey)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div ref={footerRef} className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            aria-current={current === "settings" ? "page" : undefined}
            className={`mb-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition-colors ${
              current === "settings"
                ? "bg-surface-2 font-medium text-ink-1"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink-1"
            }`}
          >
            <IconSettings className="h-[18px] w-[18px] shrink-0 text-ink-3" />
            {t("nav.settings")}
          </button>

          <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-white">
              DO
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink-1">
                Dami Osei
              </p>
              <p className="truncate text-[11.5px] text-ink-3">
                {t("user.role")}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
