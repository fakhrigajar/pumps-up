import { useState } from "react";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageMenu } from "../components/LanguageMenu";
import { IconAlert } from "../components/Icons";
import { useTranslation } from "../i18n/context";

const fieldClass =
  "mt-1 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-[14px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1";

/**
 * The way in, for both roles.
 *
 * It is the whole window rather than a dialog over the app: there is nothing
 * behind it to look at yet, and a shop screen left on the sign-in page all
 * morning should read as closed rather than as an app with a box on top.
 *
 * The failure message names neither the login nor the password as the wrong
 * one, so a wrong guess tells the person guessing nothing about which half
 * they got right.
 */
export function Login({ onSignIn }) {
  const { t } = useTranslation();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!onSignIn(login, password)) setError(true);
  }

  return (
    <div className="theme-transition flex min-h-screen flex-col bg-plane">
      <header className="flex h-16 shrink-0 items-center justify-end gap-2 px-4 sm:px-6">
        <LanguageMenu />
        <ThemeToggle />
      </header>

      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pb-16 pt-[6vh] sm:pt-[10vh]"
      >
        <div className="w-full max-w-[380px]">
          <Logo className="mx-auto h-6 w-auto text-ink-1" />

          <h1 className="mt-7 text-center text-[19px] font-semibold tracking-tight text-ink-1">
            {t("login.title")}
          </h1>
          <p className="mt-1 text-center text-[13px] text-ink-3">
            {t("login.subtitle")}
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 rounded-card border border-line bg-surface-1 p-5 shadow-card"
          >
            <label className="block">
              <span className="text-[12.5px] font-medium text-ink-2">
                {t("login.login")}
              </span>
              <input
                type="text"
                value={login}
                onChange={(event) => {
                  setLogin(event.target.value);
                  setError(false);
                }}
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                className={fieldClass}
              />
            </label>

            <label className="mt-3 block">
              <span className="text-[12.5px] font-medium text-ink-2">
                {t("login.password")}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(false);
                }}
                autoComplete="current-password"
                className={fieldClass}
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="mt-3 flex items-start gap-1.5 text-[12.5px]"
                style={{ color: "var(--status-critical)" }}
              >
                <IconAlert className="mt-px h-4 w-4 shrink-0" />
                {t("err.signIn")}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              className="mt-4 h-10 w-full justify-center text-[14px]"
              disabled={login.trim() === "" || password === ""}
            >
              {t("login.submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink-3">
            {t("login.demo")}
          </p>
        </div>
      </main>
    </div>
  );
}
