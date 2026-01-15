import type { ExecutionState, ExecutionStep, TestVariables } from "./workflow";

export interface StartWorkflowExecutionRequest {
    workflowId: string;
    variables?: TestVariables;
    trigger?: "manual" | "schedule" | "webhook" | "api";
}

export interface WorkflowExecutionDetail {
    id: string;
    workflowId: string;
    status: ExecutionState;
    startedAt: string;
    completedAt?: string;
    steps?: ExecutionStep[];
    error?: string;
}

export interface WorkflowExecutionQuery {
    status?: ExecutionState;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}
