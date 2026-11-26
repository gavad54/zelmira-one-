export function redactErrorMessage(value) {
  return String(value ?? "")
    .replace(/(https?:\/\/)[^/@\s]+:[^/@\s]+@/gi, "$1[REDACTED]@")
    .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/(password|token|secret|authorization|api[_-]?key)\s*[:=]\s*[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .slice(0, 500);
}
