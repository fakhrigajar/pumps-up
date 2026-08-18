import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import {
  IconCash,
  IconClock,
  IconEye,
  IconEyeOff,
  IconKey,
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
import { useTranslation } from "../i18n/context";

const PREVIEW_AMOUNT = 1234.5;

const inputClass =
  "mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1";

/**
 * The back office's own settings: what the shop trades in, when it is open,
 * and who the person reading this signs in as.
 *
 * The two shop settings apply the moment they are changed, the way the theme
 * and the language do — there is one right answer and no draft of it worth
 * keeping. The account settings are the opposite: a half-typed password is
 * not a password, so they are forms that are submitted and answered.
 */
export function Settings({ users, onUpdateAccount }) {
  const { t } = useTranslation();
  const { settings, update } = useStoreSettings();
  const { user } = useSession();

  const backwards =
    clockToMinutes(settings.closesAt) <= clockToMinutes(settings.opensAt);

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-4">
      <p className="text-[13px] text-ink-2">{t("set.desc")}</p>

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
                value={settings.currency}
                onChange={(currency) => update({ currency })}
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
            value={settings.opensAt}
            onChange={(opensAt) => update({ opensAt })}
          />
          <TimeField
            label={t("set.closesAt")}
            value={settings.closesAt}
            onChange={(closesAt) => update({ closesAt })}
          />
        </div>

        {/* Not an error — a shop that shuts before it opens is a typo, but it
            is the reader's typo to fix, and refusing to store it would lose
            whichever of the two they meant to type next. */}
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

      <Section
        Icon={IconUsers}
        title={t("set.login")}
        description={t("set.login.desc")}
      >
        <LoginForm
          users={users}
          user={user}
          onSubmit={(login) => onUpdateAccount(user.login, { login })}
        />
      </Section>

      <Section
        Icon={IconKey}
        title={t("set.password")}
        description={t("set.password.desc")}
      >
        <PasswordForm
          user={user}
          onSubmit={(password) => onUpdateAccount(user.login, { password })}
        />
      </Section>
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

/**
 * A wall clock, in the browser's own time control. It is the one native input
 * kept in the app: a time is typed digit by digit and stepped with the arrow
 * keys, and no drawn-from-scratch pair of dropdowns does either as well.
 */
function TimeField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      <input
        type="time"
        value={value}
        // An empty or half-typed time is not a time; the field keeps showing
        // it while the shop keeps the last one it was actually set to.
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

function LoginForm({ users, user, onSubmit }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(user.login);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  const login = normalizeLogin(value);
  const unchanged = login === user.login;

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(null);

    if (!login) return setError(t("err.login"));
    if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
      return setError(
        t("err.loginLength", { min: LOGIN_MIN_LENGTH, max: LOGIN_MAX_LENGTH }),
      );
    }
    if (!LOGIN_PATTERN.test(login)) return setError(t("err.loginChars"));
    // The account being renamed is not a clash with itself, and every other
    // login in the list is.
    if (login !== user.login && findUser(users, login)) {
      return setError(t("err.loginDup", { login }));
    }

    onSubmit(login);
    setValue(login);
    setError(null);
    return setSaved(t("set.login.saved", { login }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block w-full max-w-[260px]">
          <span className="text-[12.5px] font-medium text-ink-2">
            {t("set.login.label")}
          </span>
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
              setSaved(null);
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={LOGIN_MAX_LENGTH}
            className={inputClass}
          />
        </label>

        <Button type="submit" variant="primary" disabled={unchanged}>
          {t("set.save")}
        </Button>
      </div>

      <Status error={error} saved={saved} />
      <p className="mt-2 text-[11.5px] text-ink-3">{t("udlg.loginHint")}</p>
    </form>
  );
}

function PasswordForm({ user, onSubmit }) {
  const { t } = useTranslation();
  const blank = { current: "", next: "", confirm: "" };
  const [form, setForm] = useState(blank);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setSaved(null);
  };

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(null);

    // The current password is asked for even though the account is already
    // signed in: a screen left unlocked is the ordinary case in a shop, and
    // it is the one thing standing between a passer-by and the back office.
    if (form.current !== user.password) return setError(t("err.currentPass"));
    if (form.next.length < PASSWORD_MIN_LENGTH) {
      return setError(t("err.password", { min: PASSWORD_MIN_LENGTH }));
    }
    if (form.next === form.current) return setError(t("err.samePass"));
    if (form.next !== form.confirm) return setError(t("err.confirmPass"));

    onSubmit(form.next);
    setForm(blank);
    setError(null);
    return setSaved(t("set.password.saved"));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2 sm:max-w-[260px]">
          <span className="text-[12.5px] font-medium text-ink-2">
            {t("set.currentPassword")}
          </span>
          <input
            type="password"
            value={form.current}
            onChange={(event) => set("current")(event.target.value)}
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
              value={form.next}
              onChange={(event) => set("next")(event.target.value)}
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
            value={form.confirm}
            onChange={(event) => set("confirm")(event.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </label>
      </div>

      <Status error={error} saved={saved} />

      <div className="mt-3">
        <Button
          type="submit"
          variant="primary"
          disabled={form.current === "" || form.next === ""}
        >
          {t("set.changePassword")}
        </Button>
      </div>

      <p className="mt-2 text-[11.5px] text-ink-3">
        {t("udlg.passwordHint", { min: PASSWORD_MIN_LENGTH })}
      </p>
    </form>
  );
}

/** What the form has to say back, in the one place a reader looks for it. */
function Status({ error, saved }) {
  if (!error && !saved) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className="mt-2.5 text-[12.5px]"
      style={{ color: `var(--status-${error ? "critical" : "good"})` }}
    >
      {error ?? saved}
    </p>
  );
}
