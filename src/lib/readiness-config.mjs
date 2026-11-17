export function mfaConfiguration(env = process.env) {
  return /^[a-f0-9]{64}$/i.test(env.VAYRO_MFA_ENCRYPTION_KEY ?? "")
    ? "ok"
    : "not_configured";
}

export function trustedProxyConfiguration(env = process.env) {
  const value = env.TRUSTED_PROXY_HOPS ?? "";
  if (!/^\\d+$/.test(value)) return "not_configured";
  const hops = Number(value);
  return Number.isSafeInteger(hops) && hops >= 1 && hops <= 10
    ? "ok"
    : "not_configured";
}

export function emailConfiguration(env = process.env) {
  const provider = env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "resend") {
    const apiKey = env.EMAIL_API_KEY?.trim() ?? "";
    const from = env.EMAIL_FROM?.trim() ?? "";
    const validFrom = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(from);
    // Resend's shared test sender is deliberately not production-ready.
    return apiKey.length > 0 && validFrom && !from.toLowerCase().endsWith("@resend.dev")
      ? "ok"
      : "not_configured";
  }
  if (provider === "gmail") {
    const sender = env.GMAIL_SENDER_EMAIL?.trim() ?? "";
    const validSender = /^[^\\s@]+@gmail\\.com$/i.test(sender);
    return Boolean(
      env.GMAIL_CLIENT_ID?.trim() &&
      env.GMAIL_CLIENT_SECRET?.trim() &&
      env.GMAIL_REFRESH_TOKEN?.trim() &&
      validSender
    ) ? "ok" : "not_configured";
  }
  return "not_configured";
}
