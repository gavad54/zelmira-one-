import { randomBytes } from "node:crypto";
type TransactionalEmail = { to: string; subject: string; html: string; text: string };
function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Email provider is not configured: " + name);
  return value;
}
function cleanHeader(value: string, name: string): string {
  if (!value || /[\r\n]/.test(value)) throw new Error("Invalid email " + name);
  return value;
}
function base64Lines(value: string | Buffer): string {
  return Buffer.from(value).toString("base64").replace(/.{1,76}/g, "$&\r\n").trim();
}
function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function sendWithResend(message: TransactionalEmail): Promise<void> {
  const apiKey = requiredEnv("EMAIL_API_KEY");
  const from = cleanHeader(requiredEnv("EMAIL_FROM"), "sender");
  const recipient = cleanHeader(message.to.trim().toLowerCase(), "recipient");
  if (from.toLowerCase().endsWith("@resend.dev")) {
    const testRecipient = requiredEnv("EMAIL_TEST_RECIPIENT").toLowerCase();
    if (recipient !== testRecipient) throw new Error("Resend test sender is restricted to the configured test recipient");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient], subject: message.subject, html: message.html, text: message.text }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error("Email provider rejected the request (" + response.status + ")");
}
async function sendWithGmail(message: TransactionalEmail): Promise<void> {
  const clientId = requiredEnv("GMAIL_CLIENT_ID");
  const clientSecret = requiredEnv("GMAIL_CLIENT_SECRET");
  const refreshToken = requiredEnv("GMAIL_REFRESH_TOKEN");
  const sender = cleanHeader(requiredEnv("GMAIL_SENDER_EMAIL").toLowerCase(), "sender");
  const recipient = cleanHeader(message.to.trim().toLowerCase(), "recipient");
  if (!/^[^\s@]+@gmail\.com$/.test(sender) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Invalid Gmail sender or recipient address");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!tokenResponse.ok) throw new Error("Gmail authorization refresh failed");
  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Gmail authorization response was incomplete");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: "Bearer " + tokenData.access_token },
    signal: AbortSignal.timeout(10000)
  });
  if (!profileResponse.ok) throw new Error("Gmail sender profile could not be verified");
  const profile = await profileResponse.json() as { email?: string };
  if (!profile.email || profile.email.toLowerCase() !== sender) {
    throw new Error("Configured Gmail sender does not match the authorized mailbox");
  }

  const boundary = "vayro_" + randomBytes(12).toString("hex");
  const subject = "=?UTF-8?B?" + Buffer.from(cleanHeader(message.subject, "subject"), "utf8").toString("base64") + "?=";
  const mime = [
    "From: <" + sender + ">",
    "To: <" + recipient + ">",
    "Subject: " + subject,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    "",
    "--" + boundary,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(message.text),
    "--" + boundary,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(message.html),
    "--" + boundary + "--",
    ""
  ].join("\r\n");
  const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + tokenData.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: base64Url(mime) }),
    signal: AbortSignal.timeout(10000)
  });
  if (!sendResponse.ok) throw new Error("Gmail rejected the message (" + sendResponse.status + ")");
}

/** Server-only adapter. Provider credentials must exist only in protected runtime variables. */
export async function sendTransactionalEmail(message: TransactionalEmail): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "resend") return sendWithResend(message);
  if (provider === "gmail") return sendWithGmail(message);
  throw new Error("No supported email provider is configured");
}
