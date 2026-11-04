type TransactionalEmail = { to: string; subject: string; html: string; text: string };
function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Email provider is not configured: " + name);
  return value;
}
/** Provider adapter boundary. API keys remain in protected runtime variables. */
export async function sendTransactionalEmail(message: TransactionalEmail): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider !== "resend") throw new Error("No supported email provider is configured");
  const apiKey = requiredEnv("EMAIL_API_KEY");
  const from = requiredEnv("EMAIL_FROM");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error("Email provider rejected the request (" + response.status + ")");
}
