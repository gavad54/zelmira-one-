/**
 * DANA action policy registry.
 *
 * This module classifies proposed actions only. It is not an authorization
 * token, approval record, executor, or substitute for server-side permission
 * checks. Callers must enforce the returned class at the protected boundary.
 */
export const DANA_ACTION_POLICY = Object.freeze({
  automatic: Object.freeze([
    "portfolio.read",
    "portfolio.report",
    "analytics.read",
    "task.plan",
    "code.review",
    "code.draft",
    "test.run_sandbox",
    "monitor.alert"
  ]),
  approvalRequired: Object.freeze([
    "production.code_change",
    "production.deploy",
    "security.setting_change",
    "spend.commit",
    "customer_data.change",
    "customer_data.delete"
  ]),
  prohibited: Object.freeze([
    "security.bypass",
    "data.export_external",
    "ownership.transfer"
  ])
});

const automaticActions = new Set(DANA_ACTION_POLICY.automatic);
const approvalRequiredActions = new Set(DANA_ACTION_POLICY.approvalRequired);
const prohibitedActions = new Set(DANA_ACTION_POLICY.prohibited);

/**
 * @param {unknown} actionId
 * @returns {"AUTOMATIC"|"APPROVAL_REQUIRED"|"PROHIBITED"|"UNKNOWN"}
 */
export function classifyDanaAction(actionId) {
  if (typeof actionId !== "string" || actionId.length === 0) return "UNKNOWN";
  if (prohibitedActions.has(actionId)) return "PROHIBITED";
  if (approvalRequiredActions.has(actionId)) return "APPROVAL_REQUIRED";
  if (automaticActions.has(actionId)) return "AUTOMATIC";
  return "UNKNOWN";
}
