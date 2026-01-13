import type { Node } from "@xyflow/react";

import type { ConditionGroup } from "./condition";

/**
 * Available node types in the workflow editor
 */
export type WorkflowNodeType = "start" | "task" | "condition" | "end";

/**
 * Base node data interface
 */
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

/**
 * Start node data - entry point of workflow
 */
export interface StartNodeData extends BaseNodeData {
  type: "start";
}

/**
 * Task node data - configurable work unit
 */
export interface TaskNodeData extends BaseNodeData {
  type: "task";
  description?: string;
  config: Record<string, unknown>;
}

/**
 * Condition node data - branching logic
 */
export interface ConditionNodeData extends BaseNodeData {
  type: "condition";
  conditionGroups: ConditionGroup[];
}

/**
 * End node data - workflow termination point
 */
export interface EndNodeData extends BaseNodeData {
  type: "end";
}

/**
 * Union type for all node data types
 */
export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ConditionNodeData
  | EndNodeData;

/**
 * Workflow node with React Flow node properties
 */
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

/**
 * Helper type guards
 */
export function isStartNode(
  node: WorkflowNode
): node is Node<StartNodeData, "start"> {
  return node.type === "start";
}

export function isTaskNode(
  node: WorkflowNode
): node is Node<TaskNodeData, "task"> {
  return node.type === "task";
}

export function isConditionNode(
  node: WorkflowNode
): node is Node<ConditionNodeData, "condition"> {
  return node.type === "condition";
}

export function isEndNode(
  node: WorkflowNode
): node is Node<EndNodeData, "end"> {
  return node.type === "end";
}

/**
 * Node palette item for drag and drop
 */
export interface NodePaletteItem {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
}
