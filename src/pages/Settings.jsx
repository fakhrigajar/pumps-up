import { useEffect, useState } from "react";
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
import { mapApiError } from "../api/errors";
import { usePending } from "../lib/usePending";

const PREVIEW_AMOUNT = 1234.5;

const inputClass =
  "mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1";

/** What the form shows when nothing has been typed into it: the shop as it is
 *  stored, and the name the session is under. */
function baselineOf(settings, login) {
  return {
    currency: settings.currency,
    opensAt: settings.opensAt,
    closesAt: settings.closesAt,
    login,
  };
}

/** Everything about a login that can be judged without asking the server. */
function loginProblem(login, users, current, t) {
  if (!login) return t("err.login");
  if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
    return t("err.loginLength", {
      min: LOGIN_MIN_LENGTH,
      max: LOGIN_MAX_LENGTH,
    });
  }
  if (!LOGIN_PATTERN.test(login)) return t("err.loginChars");
  // The account being renamed is not a clash with itself, and every other
  // login in the list is.
  if (login !== current && findUser(users, login)) {
    return t("err.loginDup", { login });
  }
  return null;
}

export function Settings({ users, onUpdateAccount }) {
  const { t } = useTranslation();
  const { settings, update } = useStoreSettings();
  const { user } = useSession();

  const [draft, setDraft] = useState(() => baselineOf(settings, user.login));
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, runSave] = usePending();

  // The stored values are the draft's baseline, and they move twice: when the
  // server's answer replaces the defaults the provider starts from, and after
  // each save. Re-seeding on both is what keeps the form showing what the shop
  // is actually set to rather than what it happened to be set to on arrival.
  useEffect(() => {
    setDraft(baselineOf(settings, user.login));
  }, [settings, user.login]);

  const set = (key) => (value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
    setSaved(null);
  };

  const login = normalizeLogin(draft.login);
  const changed = {
    currency: draft.currency !== settings.currency,
    opensAt: draft.opensAt !== settings.opensAt,
    closesAt: draft.closesAt !== settings.closesAt,
    login: login !== user.login,
  };
  const storeChanged = changed.currency || changed.opensAt || changed.closesAt;
  const dirty = storeChanged || changed.login;

  // Judged on the draft rather than on what is stored, so the warning appears
  // while the typo is still on screen to be fixed.
  const backwards =
    clockToMinutes(draft.closesAt) <= clockToMinutes(draft.opensAt);

  async function handleSave(event) {
    event.preventDefault();
    setSaved(null);

    // Whatever the client can rule out is ruled out before any request goes,
    // so a rejected login never leaves the hours saved and the name not.
    if (changed.login) {
      const problem = loginProblem(login, users, user.login, t);
      if (problem) return setError(problem);
    }

    // Only what moved is sent. The shop's settings and the account behind two
    // different endpoints is a fact about the API; one button over both is a
    // fact about this screen, and this is where the two are reconciled.
    const store = {};
    if (changed.currency) store.currency = draft.currency;
    if (changed.opensAt) store.opensAt = draft.opensAt;
    if (changed.closesAt) store.closesAt = draft.closesAt;

    try {
      await runSave(async () => {
        if (storeChanged) await update(store);
        if (changed.login) await onUpdateAccount(user.login, { login });
      });
    } catch (err) {
      return setError(mapApiError(err, t));
    }

    setError(null);
    // A rename is worth saying out loud rather than confirming generically:
    // it is also the name the reader signs in under next time.
    return setSaved(
      changed.login ? t("set.login.saved", { login }) : t("set.saved"),
    );
  }

  return (
    <div className="mx-auto w-full space-y-4">
      <p className="text-[13px] text-ink-2">{t("set.desc")}</p>

      {/* Everything the shop is set to, saved by the one button at the end of
          it. Changing the password is deliberately not part of that: it needs
          the current password, it succeeds and fails on its own terms, and it
          clears itself afterwards — so it stays a form of its own, below the
          rule, with its own button. */}
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

            {/* The preview follows the stored currency, not the draft: it is
                showing how prices read across the app, and they do not change
                until this is saved. */}
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
          <label className="block w-full max-w-[260px]">
            <span className="text-[12.5px] font-medium text-ink-2">
              {t("set.login.label")}
            </span>
            <input
              type="text"
              value={draft.login}
              onChange={(event) => set("login")(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={LOGIN_MAX_LENGTH}
              className={inputClass}
            />
          </label>
          <p className="mt-2 text-[11.5px] text-ink-3">{t("udlg.loginHint")}</p>
        </Section>

        {/* The one button the whole form answers to. It sits at the end and on
            the right, where the last thing read on a page of fields is the
            thing that commits them, and it has nothing to do until something
            has actually moved. */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <Status error={error} saved={saved} className="" />
          <Button
            type="submit"
            variant="primary"
            disabled={!dirty}
            pending={saving}
          >
            {saving ? t("dlg.saving") : t("set.save")}
          </Button>
        </div>
      </form>

      <div className="border-t border-line pt-4">
        <Section
          Icon={IconKey}
          title={t("set.password")}
          description={t("set.password.desc")}
        >
          <PasswordForm
            onSubmit={(password, currentPassword) =>
              onUpdateAccount(user.login, { password, currentPassword })
            }
          />
        </Section>
      </div>
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

function PasswordForm({ onSubmit }) {
  const { t } = useTranslation();
  const blank = { current: "", next: "", confirm: "" };
  const [form, setForm] = useState(blank);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, runSave] = usePending();

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setSaved(null);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSaved(null);

    // The current password can only be checked by the server now — this
    // account's real password never reaches the client — so what stays here
    // is the cheap, still-legitimate pre-checks that don't need it.
    if (form.next.length < PASSWORD_MIN_LENGTH) {
      return setError(t("err.password", { min: PASSWORD_MIN_LENGTH }));
    }
    if (form.next === form.current) return setError(t("err.samePass"));
    if (form.next !== form.confirm) return setError(t("err.confirmPass"));

    try {
      // The current password is asked for even though the account is
      // already signed in: a screen left unlocked is the ordinary case in a
      // shop, and it is the one thing standing between a passer-by and the
      // back office.
      await runSave(() => onSubmit(form.next, form.current));
    } catch (err) {
      return setError(mapApiError(err, t));
    }
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
          pending={saving}
        >
          {saving ? t("dlg.saving") : t("set.changePassword")}
        </Button>
      </div>

      <p className="mt-2 text-[11.5px] text-ink-3">
        {t("udlg.passwordHint", { min: PASSWORD_MIN_LENGTH })}
      </p>
    </form>
  );
}

/**
 * What a form has to say back, in the one place a reader looks for it. The
 * margin is a prop because it is read in two positions: stacked under the
 * password fields, and inline beside the save button, where a top margin
 * would knock it out of line with the button it sits next to.
 */
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
