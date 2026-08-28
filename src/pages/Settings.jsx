import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import {
  IconCash,
  IconCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconKey,
  IconPalette,
  IconUsers,
} from "../components/Icons";
import {
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_PATTERN,
  PASSWORD_MIN_LENGTH,
  findUser,
  normalizeLogin,
} from "../data/users";
import { CURRENCIES, clockToMinutes } from "../lib/storeSettings";
import { formatPrice } from "../lib/format";
import { useStoreSettings } from "../settings/context";
import { useSession } from "../auth/context";
import { useTheme } from "../theme/context";
import { ACCENTS, accentTokens } from "../theme/accents";
import { useTranslation } from "../i18n/context";
import { mapApiError } from "../api/errors";
import { usePending } from "../lib/usePending";

const PREVIEW_AMOUNT = 1234.5;

const TABS = [
  { id: "system", labelKey: "set.tab.system" },
  { id: "account", labelKey: "set.tab.account" },
];

const inputClass =
  "mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1";

function storeBaseline(settings) {
  return {
    currency: settings.currency,
    opensAt: settings.opensAt,
    closesAt: settings.closesAt,
  };
}

function loginProblem(login, users, current, t) {
  if (!login) return t("err.login");
  if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
    return t("err.loginLength", {
      min: LOGIN_MIN_LENGTH,
      max: LOGIN_MAX_LENGTH,
    });
  }
  if (!LOGIN_PATTERN.test(login)) return t("err.loginChars");
  if (login !== current && findUser(users, login)) {
    return t("err.loginDup", { login });
  }
  return null;
}

export function Settings({ users, onUpdateAccount }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const [tab, setTab] = useState(TABS[0].id);

  return (
    <div className="mx-auto w-full space-y-4">
      <p className="text-[13px] text-ink-2">{t("set.desc")}</p>

      <Tabs value={tab} onChange={setTab} />

      <Panel id="system" active={tab === "system"}>
        <SystemForm />
      </Panel>

      <Panel id="account" active={tab === "account"}>
        <AccountForm
          users={users}
          currentLogin={user.login}
          onUpdate={(changes) => onUpdateAccount(user.login, changes)}
        />
      </Panel>
    </div>
  );
}

function Tabs({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t("set.tabs")}
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {TABS.map(({ id, labelKey }, index) => {
        const active = id === value;

        return (
          <button
            key={id}
            id={`set-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`set-panel-${id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(event) => {
              const step =
                event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              event.preventDefault();
              const next = TABS[(index + step + TABS.length) % TABS.length];
              onChange(next.id);
              document.getElementById(`set-tab-${next.id}`)?.focus();
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-surface-1 text-ink-1 shadow-card"
                : "text-ink-3 hover:text-ink-1"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function Panel({ id, active, children }) {
  return (
    <div
      id={`set-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`set-tab-${id}`}
      hidden={!active}
    >
      {children}
    </div>
  );
}

function SystemForm() {
  const { t } = useTranslation();
  const { settings, update } = useStoreSettings();

  const [draft, setDraft] = useState(() => storeBaseline(settings));
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, runSave] = usePending();

  useEffect(() => {
    setDraft(storeBaseline(settings));
  }, [settings]);

  const set = (key) => (value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
    setSaved(null);
  };

  const changed = {
    currency: draft.currency !== settings.currency,
    opensAt: draft.opensAt !== settings.opensAt,
    closesAt: draft.closesAt !== settings.closesAt,
  };
  const dirty = changed.currency || changed.opensAt || changed.closesAt;

  const backwards =
    clockToMinutes(draft.closesAt) <= clockToMinutes(draft.opensAt);

  async function handleSave(event) {
    event.preventDefault();
    if (!dirty) return;
    setSaved(null);

    const store = {};
    if (changed.currency) store.currency = draft.currency;
    if (changed.opensAt) store.opensAt = draft.opensAt;
    if (changed.closesAt) store.closesAt = draft.closesAt;

    try {
      await runSave(() => update(store));
    } catch (err) {
      return setError(mapApiError(err, t));
    }

    setError(null);
    return setSaved(t("set.saved"));
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-4">
      <Section
        Icon={IconCash}
        title={t("set.currency")}
        description={t("set.currency.desc")}
      >
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <label className="block w-full max-w-[260px]">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("set.currency.label")}
            </span>
            <div className="mt-1">
              <Select
                label={t("set.currency.label")}
                value={draft.currency}
                onChange={set("currency")}
                options={CURRENCIES.map(({ code, nameKey }) => ({
                  value: code,
                  label: `${code} · ${t(nameKey)}`,
                }))}
              />
            </div>
          </label>

          <p className="pb-2 text-[12.5px] text-ink-3">
            {t("set.currency.preview")}{" "}
            <span className="font-medium tabular-nums text-ink-1">
              {formatPrice(PREVIEW_AMOUNT)}
            </span>
          </p>
        </div>
      </Section>

      <Section
        Icon={IconClock}
        title={t("set.hours")}
        description={t("set.hours.desc")}
      >
        <div className="flex flex-wrap gap-3">
          <TimeField
            label={t("set.opensAt")}
            value={draft.opensAt}
            onChange={set("opensAt")}
          />
          <TimeField
            label={t("set.closesAt")}
            value={draft.closesAt}
            onChange={set("closesAt")}
          />
        </div>

        {backwards ? (
          <p
            role="status"
            className="mt-3 text-[12.5px]"
            style={{ color: "var(--status-warning)" }}
          >
            {t("set.hours.backwards")}
          </p>
        ) : null}
      </Section>

      <AccentSection />

      <SaveRow error={error} saved={saved} disabled={!dirty} saving={saving} />
    </form>
  );
}

function AccentSection() {
  const { t } = useTranslation();
  const { theme, accent, setAccent } = useTheme();

  return (
    <Section
      Icon={IconPalette}
      title={t("set.accent")}
      description={t("set.accent.desc")}
    >
      <div
        role="radiogroup"
        aria-label={t("set.accent")}
        className="flex flex-wrap gap-2"
      >
        {ACCENTS.map(({ id, labelKey }) => {
          const active = id === accent;
          const name = t(labelKey);
          const { accent: color } = accentTokens(id, theme);

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAccent(id)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-ink-1"
                  : "border-line bg-surface-2 text-ink-2 hover:text-ink-1"
              }`}
            >
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {active ? <IconCheck className="h-3 w-3" /> : null}
              </span>
              {name}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11.5px] text-ink-3">{t("set.accent.hint")}</p>
    </Section>
  );
}

function AccountForm({ users, currentLogin, onUpdate }) {
  const { t } = useTranslation();
  const blank = { current: "", next: "", confirm: "" };

  const [login, setLogin] = useState(currentLogin);
  const [password, setPassword] = useState(blank);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, runSave] = usePending();

  useEffect(() => setLogin(currentLogin), [currentLogin]);

  const clear = () => {
    setError(null);
    setSaved(null);
  };

  const setField = (key) => (value) => {
    setPassword((current) => ({ ...current, [key]: value }));
    clear();
  };

  const nextLogin = normalizeLogin(login);
  const renaming = nextLogin !== currentLogin;
  const changingPassword =
    password.current !== "" || password.next !== "" || password.confirm !== "";
  const dirty = renaming || changingPassword;

  async function handleSave(event) {
    event.preventDefault();
    if (!dirty) return;
    setSaved(null);

    if (renaming) {
      const problem = loginProblem(nextLogin, users, currentLogin, t);
      if (problem) return setError(problem);
    }

    if (changingPassword) {
      if (password.current === "") return setError(t("err.needCurrentPass"));
      if (password.next.length < PASSWORD_MIN_LENGTH) {
        return setError(t("err.password", { min: PASSWORD_MIN_LENGTH }));
      }
      if (password.next === password.current) return setError(t("err.samePass"));
      if (password.next !== password.confirm) {
        return setError(t("err.confirmPass"));
      }
    }

    const changes = {};
    if (renaming) changes.login = nextLogin;
    if (changingPassword) {
      changes.password = password.next;
      changes.currentPassword = password.current;
    }

    try {
      await runSave(() => onUpdate(changes));
    } catch (err) {
      return setError(mapApiError(err, t));
    }

    if (changingPassword) setPassword(blank);
    setError(null);
    return setSaved(
      [
        renaming ? t("set.login.saved", { login: nextLogin }) : null,
        changingPassword ? t("set.password.saved") : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-4">
      <Section
        Icon={IconUsers}
        title={t("set.login")}
        description={t("set.login.desc")}
      >
        <label className="block w-full max-w-[260px]">
          <span className="text-[12.5px] font-medium text-ink-2">
            {t("set.login.label")}
          </span>
          <input
            type="text"
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              clear();
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={LOGIN_MAX_LENGTH}
            className={inputClass}
          />
        </label>
        <p className="mt-2 text-[11.5px] text-ink-3">{t("udlg.loginHint")}</p>
      </Section>

      <Section
        Icon={IconKey}
        title={t("set.password")}
        description={t("set.password.desc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2 sm:max-w-[260px]">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("set.currentPassword")}
            </span>
            <input
              type="password"
              value={password.current}
              onChange={(event) => setField("current")(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("set.newPassword")}
            </span>
            <span className="relative block">
              <input
                type={revealed ? "text" : "password"}
                value={password.next}
                onChange={(event) => setField("next")(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="absolute right-1.5 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-1.5 text-ink-3 hover:bg-surface-3 hover:text-ink-1"
              >
                {revealed ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {t(revealed ? "udlg.hidePassword" : "udlg.showPassword")}
                </span>
              </button>
            </span>
          </label>

          <label className="block">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("set.confirmPassword")}
            </span>
            <input
              type={revealed ? "text" : "password"}
              value={password.confirm}
              onChange={(event) => setField("confirm")(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </label>
        </div>

        <p className="mt-2 text-[11.5px] text-ink-3">
          {t("udlg.passwordHint", { min: PASSWORD_MIN_LENGTH })}
        </p>
      </Section>

      <SaveRow error={error} saved={saved} disabled={!dirty} saving={saving} />
    </form>
  );
}

function SaveRow({ error, saved, disabled, saving }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <Status error={error} saved={saved} className="" />
      <Button
        type="submit"
        variant="primary"
        disabled={disabled}
        pending={saving}
      >
        {saving ? t("dlg.saving") : t("set.save")}
      </Button>
    </div>
  );
}

function Section({ Icon, title, description, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2"
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-ink-1">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{description}</p>
          <div className="mt-3.5">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function TimeField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => {
          if (clockToMinutes(event.target.value) !== null) {
            onChange(event.target.value);
          }
        }}
        className={`${inputClass} w-[132px] tabular-nums`}
      />
    </label>
  );
}

function Status({ error, saved, className = "mt-2.5" }) {
  if (!error && !saved) return null;

  return (
    <p
      role={error ? "alert" : "status"}
      className={`text-[12.5px] ${className}`}
      style={{ color: `var(--status-${error ? "critical" : "good"})` }}
    >
      {error ?? saved}
    </p>
  );
}
