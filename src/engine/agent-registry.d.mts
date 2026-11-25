export type AgentCapability = "REPORT_GENERATION" | "REPOSITORY_AUDIT" | "CI_OBSERVATION" | "TASK_REVIEW";
export type AgentPermission = "READ_TASK" | "READ_REPOSITORY" | "WRITE_TASK_RESULT" | "REQUEST_OWNER_APPROVAL";
export interface AgentDefinition {
  key: string;
  version: number;
  displayName: string;
  capabilities: AgentCapability[];
  permissions?: AgentPermission[];
  projectKeys?: string[];
  enabled?: boolean;
}
export interface ValidatedAgentDefinition {
  key: string;
  version: number;
  displayName: string;
  capabilities: readonly AgentCapability[];
  permissions: readonly AgentPermission[];
  projectKeys: readonly string[];
  enabled: boolean;
}
export function validateAgentDefinition(input: AgentDefinition): ValidatedAgentDefinition;
export function assertAgentCanHandle(agent: AgentDefinition, task: { handlerKey: string; projectKey: string }): ValidatedAgentDefinition;
export function assertAgentCanReview(agent: AgentDefinition, projectKey: string): ValidatedAgentDefinition;
export function validateTaskReview(input: { taskId: string; executorAgentKey: string; reviewerAgentKey: string; decision: "APPROVE" | "REQUEST_CHANGES" | "BLOCK"; evidence: string[] }): Readonly<{ taskId: string; executorAgentKey: string; reviewerAgentKey: string; decision: "APPROVE" | "REQUEST_CHANGES" | "BLOCK"; evidence: readonly string[] }>;
export function evaluateTaskResult(task: { handler_key: string }, result: Record<string, unknown>): Readonly<{ decision: "APPROVE" | "BLOCK"; evidence: readonly string[] }>;
