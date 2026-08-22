/**
 * Maps a server error `code` onto the app's existing translation keys, so a
 * failed request reads the same way a client-side validation failure always
 * did. Codes that carry a value only the server knows the exact wording for
 * (a duplicate login, a stock shortfall) fall back to the server's own
 * message rather than a generic one — still in English, but still specific.
 */
const CODE_KEYS = {
  invalid_credentials: "err.signIn",
  current_password_mismatch: "err.currentPass",
  last_admin: "usr.lastAdmin",
  register_closed: "reg.closedHint",
  register_not_open: "reg.closedHint",
  login_required: "err.login",
  password_length: "err.password",
  name_required: "err.name",
  stock_invalid: "err.stock",
  purchase_invalid: "err.purchase",
  selling_invalid: "err.selling",
  units_invalid: "err.units",
  reason_required: "err.reason",
  network_error: "err.generic",
  internal_error: "err.generic",
};

export function mapApiError(error, t) {
  const key = CODE_KEYS[error?.code];
  if (key) return t(key);
  return error?.message || t("err.generic");
}
