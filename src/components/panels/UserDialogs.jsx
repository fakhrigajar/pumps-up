import { useId, useState } from "react";
import { Modal, ModalFooter } from "../ui/Modal";
import { Button } from "../ui/Button";
import { IconAlert, IconEye, IconEyeOff, IconTrash } from "../Icons";
import {
  DEFAULT_ROLE,
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_PATTERN,
  PASSWORD_MIN_LENGTH,
  ROLES,
  createUser,
  findUser,
  normalizeLogin,
} from "../../data/users";
import { useTranslation } from "../../i18n/context";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}

function FieldGroup({ label, children }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <span id={labelId} className="block text-[12.5px] font-medium text-ink-2">
        {label}
      </span>
      {children}
    </div>
  );
}

const inputClass =
  "mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1";

export function UserFormDialog({ users, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    login: "",
    password: "",
    role: DEFAULT_ROLE,
  });
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  function handleSubmit(event) {
    event.preventDefault();

    // The login is validated in the shape it will actually be stored in —
    // folded to lowercase — so typing "Aysel" is accepted and saved as
    // "aysel" rather than rejected for a capital letter the user can't see
    // the problem with.
    const login = normalizeLogin(form.login);

    if (!login) return setError(t("err.login"));
    if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
      return setError(
        t("err.loginLength", { min: LOGIN_MIN_LENGTH, max: LOGIN_MAX_LENGTH }),
      );
    }
    if (!LOGIN_PATTERN.test(login)) return setError(t("err.loginChars"));
    if (findUser(users, login)) return setError(t("err.loginDup", { login }));
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      return setError(t("err.password", { min: PASSWORD_MIN_LENGTH }));
    }

    return onSubmit(
      createUser({ login, password: form.password, role: form.role }),
    );
  }

  return (
    <Modal
      title={t("udlg.addTitle")}
      description={t("udlg.addDesc")}
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          <Field label={t("udlg.login")} hint={t("udlg.loginHint")}>
            <input
              className={inputClass}
              value={form.login}
              onChange={(event) => set("login")(event.target.value)}
              placeholder={t("udlg.loginPlaceholder")}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={LOGIN_MAX_LENGTH}
              autoFocus
            />
          </Field>

          <Field
            label={t("udlg.password")}
            hint={t("udlg.passwordHint", { min: PASSWORD_MIN_LENGTH })}
          >
            <span className="relative block">
              <input
                className={`${inputClass} pr-10`}
                type={revealed ? "text" : "password"}
                value={form.password}
                onChange={(event) => set("password")(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
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
          </Field>

          <FieldGroup label={t("udlg.role")}>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {ROLES.map((role) => {
                const active = form.role === role;
                return (
                  <label key={role} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={active}
                      onChange={() => set("role")(role)}
                      className="peer sr-only"
                    />
                    <span
                      className={`block h-full rounded-lg border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                        active
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-surface-2 hover:bg-surface-3"
                      }`}
                    >
                      <span className="block text-[13px] font-medium text-ink-1">
                        {t(`role.${role}`)}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-3">
                        {t(`role.${role}.desc`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </FieldGroup>

          {error ? (
            <p
              role="alert"
              className="text-[12.5px]"
              style={{ color: "var(--status-critical)" }}
            >
              {error}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          <Button onClick={onCancel}>{t("dlg.cancel")}</Button>
          <Button variant="primary" type="submit">
            {t("udlg.create")}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function DeleteUserDialog({ user, onCancel, onConfirm }) {
  const { t } = useTranslation();

  return (
    <Modal ariaLabel={t("udlg.confirmTitle")} onClose={onCancel}>
      <div className="px-6 pb-2 pt-6 text-center">
        <span className="relative mx-auto flex h-12 w-12 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: "var(--status-critical)", opacity: 0.14 }}
          />
          <IconAlert
            className="relative h-6 w-6"
            style={{ color: "var(--status-critical)" }}
          />
        </span>

        <h2 className="mt-3 text-[16px] font-semibold text-ink-1">
          {t("udlg.confirmTitle")}
        </h2>

        <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-left">
          <p className="truncate text-[13px] font-medium text-ink-1">
            {user.login}
          </p>
          <p className="text-[11.5px] text-ink-3">{t(`role.${user.role}`)}</p>
        </div>

        <p className="mt-3 text-[13px] text-ink-2">
          {t("udlg.confirmBody", { login: user.login })}
        </p>
        <p
          className="mt-1.5 text-[12.5px] font-medium"
          style={{ color: "var(--status-critical)" }}
        >
          {t("dlg.confirmWarn")}
        </p>
      </div>

      <ModalFooter>
        <Button onClick={onCancel}>{t("udlg.confirmKeep")}</Button>
        <Button variant="destructive" onClick={onConfirm}>
          <IconTrash className="h-4 w-4" />
          {t("udlg.confirmDelete")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
