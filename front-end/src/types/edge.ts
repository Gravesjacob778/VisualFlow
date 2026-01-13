import type { Edge } from "@xyflow/react";

/**
 * Edge data for conditional connections
 */
export interface ConditionalEdgeData extends Record<string, unknown> {
  /** Reference to condition group ID if this is a conditional branch */
  conditionGroupId?: string;
  /** Label to display on the edge */
  label?: string;
  /** Whether this is the default/else path */
  isDefault?: boolean;
}

/**
 * Workflow edge type
 */
export type WorkflowEdge = Edge<ConditionalEdgeData>;

/**
 * Edge style variants
 */
export type EdgeStyle = "default" | "executing" | "completed" | "error";

/**
 * Get edge style class based on execution state
 */
export function getEdgeStyleClass(style: EdgeStyle): string {
  switch (style) {
    case "executing":
      return "stroke-blue-500 stroke-2";
    case "completed":
      return "stroke-green-500 stroke-2";
    case "error":
      return "stroke-red-500 stroke-2";
    default:
      return "stroke-gray-400 stroke-1";
  }
}
