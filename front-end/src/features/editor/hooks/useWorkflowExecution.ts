"use client";

import { useCallback, useEffect, useRef } from "react";

import { useEditorStore, useExecutionStore } from "@/stores";
import type { Condition, ConditionGroup, ConditionOperator } from "@/types/condition";
import type { ConditionNodeData } from "@/types/node";
import type { ExecutionStep, TestVariables } from "@/types/workflow";

function generateStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Evaluate a single condition against test variables
 */
function evaluateCondition(
  condition: Condition,
  variables: TestVariables
): boolean {
  const fieldValue = variables[condition.field];
  const compareValue = condition.value;

  // Convert values for comparison
  const fieldStr = String(fieldValue ?? "");
  const fieldNum = Number(fieldValue);
  const compareNum = Number(compareValue);

  switch (condition.operator as ConditionOperator) {
    case "==":
      return fieldStr === compareValue;
    case "!=":
      return fieldStr !== compareValue;
    case ">":
      return !isNaN(fieldNum) && !isNaN(compareNum) && fieldNum > compareNum;
    case "<":
      return !isNaN(fieldNum) && !isNaN(compareNum) && fieldNum < compareNum;
    case ">=":
      return !isNaN(fieldNum) && !isNaN(compareNum) && fieldNum >= compareNum;
    case "<=":
      return !isNaN(fieldNum) && !isNaN(compareNum) && fieldNum <= compareNum;
    case "contains":
      return fieldStr.includes(compareValue);
    case "startsWith":
      return fieldStr.startsWith(compareValue);
    case "endsWith":
      return fieldStr.endsWith(compareValue);
    case "isEmpty":
      return fieldStr === "" || fieldValue === null || fieldValue === undefined;
    case "isNotEmpty":
      return fieldStr !== "" && fieldValue !== null && fieldValue !== undefined;
    default:
      return false;
  }
}

/**
 * Evaluate a condition group (AND/OR logic)
 */
function evaluateConditionGroup(
  group: ConditionGroup,
  variables: TestVariables
): boolean {
  if (group.conditions.length === 0) return false;

  if (group.logic === "AND") {
    return group.conditions.every((c) => evaluateCondition(c, variables));
  } else {
    return group.conditions.some((c) => evaluateCondition(c, variables));
  }
}

/**
 * Format condition group to readable expression
 */
function formatConditionExpression(group: ConditionGroup): string {
  return group.conditions
    .map((c) => `${c.field} ${c.operator} ${c.value}`)
    .join(` ${group.logic} `);
}

export function useWorkflowExecution() {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);

  const executionState = useExecutionStore((state) => state.executionState);
  const executionSpeed = useExecutionStore((state) => state.executionSpeed);
  const testVariables = useExecutionStore((state) => state.testVariables);
  const addExecutionStep = useExecutionStore((state) => state.addExecutionStep);
  const updateExecutionStep = useExecutionStore((state) => state.updateExecutionStep);
  const addExecutedEdge = useExecutionStore((state) => state.addExecutedEdge);
  const setExecutionState = useExecutionStore((state) => state.setExecutionState);
  const startExecution = useExecutionStore((state) => state.startExecution);
  const pauseExecution = useExecutionStore((state) => state.pauseExecution);
  const resumeExecution = useExecutionStore((state) => state.resumeExecution);
  const resetExecution = useExecutionStore((state) => state.resetExecution);

  const executionQueueRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find start node
  const findStartNode = useCallback(() => {
    return nodes.find((n) => n.type === "start");
  }, [nodes]);

  // Find outgoing edges from a node
  const findOutgoingEdges = useCallback(
    (nodeId: string, sourceHandle?: string) => {
      return edges.filter(
        (e) =>
          e.source === nodeId &&
          (sourceHandle === undefined || e.sourceHandle === sourceHandle)
      );
    },
    [edges]
  );

  // Find node by ID
  const findNodeById = useCallback(
    (nodeId: string) => {
      return nodes.find((n) => n.id === nodeId);
    },
    [nodes]
  );

  // Execute a single step
  const executeStep = useCallback(
    (nodeId: string) => {
      const node = findNodeById(nodeId);
      if (!node) {
        setExecutionState("error");
        return;
      }

      const stepId = generateStepId();
      const step: ExecutionStep = {
        id: stepId,
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type || "unknown",
        timestamp: Date.now(),
        status: "running",
      };

      addExecutionStep(step);

      // Process based on node type
      timeoutRef.current = setTimeout(() => {
        let nextNodeIds: string[] = [];

        switch (node.type) {
          case "start": {
            const outEdges = findOutgoingEdges(node.id);
            nextNodeIds = outEdges.map((e) => e.target);
            outEdges.forEach((e) => addExecutedEdge(e.id));
            break;
          }

          case "task": {
            const outEdges = findOutgoingEdges(node.id);
            nextNodeIds = outEdges.map((e) => e.target);
            outEdges.forEach((e) => addExecutedEdge(e.id));
            break;
          }

          case "condition": {
            const conditionData = node.data as ConditionNodeData;
            const groups = conditionData.conditionGroups || [];

            // Evaluate each condition group
            let matchedGroup: ConditionGroup | null = null;
            for (const group of groups) {
              if (evaluateConditionGroup(group, testVariables)) {
                matchedGroup = group;
                break;
              }
            }

            // Find the matching edge
            let selectedEdge;
            if (matchedGroup) {
              selectedEdge = edges.find(
                (e) =>
                  e.source === node.id &&
                  e.sourceHandle === `condition-${matchedGroup!.id}`
              );
            }

            // Fallback to else edge
            if (!selectedEdge) {
              selectedEdge = edges.find(
                (e) => e.source === node.id && e.sourceHandle === "else"
              );
            }

            if (selectedEdge) {
              nextNodeIds = [selectedEdge.target];
              addExecutedEdge(selectedEdge.id);
            }

            // Update step with condition evaluation info
            updateExecutionStep(stepId, {
              conditionEvaluated: {
                expression: matchedGroup
                  ? formatConditionExpression(matchedGroup)
                  : "No conditions matched",
                result: !!matchedGroup,
                selectedPath: matchedGroup?.label || "Else",
              },
            });
            break;
          }

          case "end": {
            // End node - execution complete
            updateExecutionStep(stepId, {
              status: "completed",
              duration: executionSpeed,
            });
            setExecutionState("completed");
            return;
          }

          default:
            break;
        }

        // Mark current step as completed
        updateExecutionStep(stepId, {
          status: "completed",
          duration: executionSpeed,
        });

        // Queue next nodes
        if (nextNodeIds.length > 0) {
          executionQueueRef.current = [...nextNodeIds];
          const nextNodeId = executionQueueRef.current.shift();
          if (nextNodeId) {
            executeStep(nextNodeId);
          }
        } else {
          // No more nodes to execute
          setExecutionState("completed");
        }
      }, executionSpeed);
    },
    [
      findNodeById,
      findOutgoingEdges,
      addExecutionStep,
      updateExecutionStep,
      addExecutedEdge,
      setExecutionState,
      testVariables,
      executionSpeed,
      edges,
    ]
  );

  // Start workflow execution
  const start = useCallback(
    (variables: TestVariables) => {
      const startNode = findStartNode();
      if (!startNode) {
        console.error("No start node found");
        return;
      }

      startExecution(variables);
      executionQueueRef.current = [];
      executeStep(startNode.id);
    },
    [findStartNode, startExecution, executeStep]
  );

  // Pause execution
  const pause = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pauseExecution();
  }, [pauseExecution]);

  // Resume execution
  const resume = useCallback(() => {
    resumeExecution();
    const nextNodeId = executionQueueRef.current.shift();
    if (nextNodeId) {
      executeStep(nextNodeId);
    }
  }, [resumeExecution, executeStep]);

  // Reset execution
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    executionQueueRef.current = [];
    resetExecution();
  }, [resetExecution]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    executionState,
    start,
    pause,
    resume,
    reset,
  };
}
