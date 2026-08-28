import { Logo } from "./Logo";

export function LoadingScreen() {
  return (
    <div className="theme-transition flex min-h-screen items-center justify-center bg-plane">
      <Logo className="h-6 w-auto animate-pulse text-ink-3" />
    </div>
  );
}
