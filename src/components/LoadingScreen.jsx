import { Logo } from "./Logo";

/**
 * What sits on screen for the one gap that only exists now that a session is
 * something the server has to be asked about: between the app mounting and
 * `GET /api/auth/me` answering. Brief on a warm connection, but real — and a
 * blank frame or a flash of the sign-in screen would both misreport it.
 */
export function LoadingScreen() {
  return (
    <div className="theme-transition flex min-h-screen items-center justify-center bg-plane">
      <Logo className="h-6 w-auto animate-pulse text-ink-3" />
    </div>
  );
}
