import type { WorkflowEdge } from "./edge";
import type { WorkflowNode } from "./node";

/**
 * Workflow execution state
 */
export type ExecutionState =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "error";

/**
 * Single execution step record
 */
export interface ExecutionStep {
  /** Unique step ID */
  id: string;
  /** Node ID that was executed */
  nodeId: string;
  /** Node label for display */
  nodeLabel: string;
  /** Node type */
  nodeType: string;
  /** Timestamp when this step started */
  timestamp: number;
  /** Duration in milliseconds */
  duration?: number;
  /** For condition nodes: which condition was evaluated */
  conditionEvaluated?: {
    expression: string;
    result: boolean;
    selectedPath: string;
  };
  /** Step result status */
  status: "pending" | "running" | "completed" | "error";
  /** Error message if status is error */
  error?: string;
}

/**
 * Test variables for workflow execution simulation
 */
export type TestVariables = Record<string, unknown>;

/**
 * Execution speed options (in milliseconds)
 */
export const EXECUTION_SPEEDS = [
  { value: 400, label: "Fast (0.4s)" },
  { value: 800, label: "Normal (0.8s)" },
  { value: 1200, label: "Slow (1.2s)" },
  { value: 2000, label: "Very Slow (2s)" },
] as const;

export type ExecutionSpeed = (typeof EXECUTION_SPEEDS)[number]["value"];

/**
 * Complete workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Workflow validation result
 */
export interface WorkflowValidation {
  isValid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

export interface WorkflowValidationError {
  type: "error";
  nodeId?: string;
  message: string;
}

export interface WorkflowValidationWarning {
  type: "warning";
  nodeId?: string;
  message: string;
}
