"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores";
import type { ConditionalEdgeData } from "@/types/edge";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<ConditionalEdgeData>) {
  const executedEdgeIds = useExecutionStore((state) => state.executedEdgeIds);
  const executionState = useExecutionStore((state) => state.executionState);

  const isExecuted = executedEdgeIds.has(id);
  const isRunning = executionState === "running";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge style based on execution state
  const getEdgeStyle = () => {
    if (isExecuted) {
      return {
        stroke: "#22c55e", // green-500
        strokeWidth: 2,
        strokeDasharray: "none",
      };
    }
    if (executionState === "idle") {
      return {
        stroke: "#9ca3af", // gray-400
        strokeWidth: 1.5,
        strokeDasharray: "5,5",
      };
    }
    return {
      stroke: "#9ca3af", // gray-400
      strokeWidth: 1,
      strokeDasharray: "5,5",
    };
  };

  const edgeStyle = getEdgeStyle();

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
        className={cn(isExecuted && isRunning && "edge-animated")}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm border",
              isExecuted ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-muted-foreground"
            )}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
