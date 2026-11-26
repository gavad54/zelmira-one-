export type GoalHandlerKey = "report.generate" | "repo.audit" | "repo.test";

export interface GoalAcceptanceCriterion {
  id: string;
  title: string;
  handlerKey: GoalHandlerKey;
  repo?: string;
  dependsOn?: string[];
}

export interface GoalDefinition {
  goalId: string;
  projectKey: string;
  title: string;
  version?: number;
  priority?: number;
  approvalRequired?: boolean;
  scheduledAt?: string | Date | null;
  deadline?: string | Date | null;
  acceptanceCriteria: GoalAcceptanceCriterion[];
}

export interface PlannedGoalTask {
  projectKey: string;
  taskType: "REPORTING" | "ENGINEERING";
  handlerKey: GoalHandlerKey;
  title: string;
  priority: number;
  scheduledAt: Date | null;
  deadline: Date | null;
  idempotencyKey: string;
  criterionId: string;
  dependsOn: string[];
  approvalRequired: boolean;
  payload: {
    goalId: string;
    goalVersion: number;
    goalTitle: string;
    criterionId: string;
    acceptanceCriterion: string;
    dependsOn: string[];
    repo?: string;
  };
}

export interface PlannedGoal {
  goalId: string;
  projectKey: string;
  version: number;
  title: string;
  approvalRequired: boolean;
  scheduledAt: Date | null;
  deadline: Date | null;
  tasks: readonly PlannedGoalTask[];
}

export function planGoal(goal: GoalDefinition): PlannedGoal;
export function selectReadyTasks(
  tasks: readonly PlannedGoalTask[],
  completedTaskIds: Set<string>
): PlannedGoalTask[];
