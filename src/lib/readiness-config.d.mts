export type ReadinessConfigurationCheck = "ok" | "not_configured";

export function mfaConfiguration(
  env?: Record<string, string | undefined>
): ReadinessConfigurationCheck;

export function trustedProxyConfiguration(
  env?: Record<string, string | undefined>
): ReadinessConfigurationCheck;

export function emailConfiguration(
  env?: Record<string, string | undefined>
): ReadinessConfigurationCheck;
