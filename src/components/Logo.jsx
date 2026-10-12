import { APP_NAME, LOGO_HANDLE_PATH, LOGO_MARK_PATH, LOGO_WORDMARK_PATH } from "../brand.js";

function Mark() {
  return (
    <>
      <path d={LOGO_HANDLE_PATH} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d={LOGO_MARK_PATH} fillRule="evenodd" />
    </>
  );
}

export function Logo({ className = "", preserveAspectRatio }) {
  return (
    <svg
      viewBox="0 0 312 64"
      role="img"
      aria-label={APP_NAME}
      preserveAspectRatio={preserveAspectRatio}
      className={`fill-current ${className}`}
    >
      <Mark />
      <path d={LOGO_WORDMARK_PATH} fillRule="evenodd" />
    </svg>
  );
}

export function LogoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 56 64" role="img" aria-label={APP_NAME} className={`fill-current ${className}`}>
      <Mark />
    </svg>
  );
}
