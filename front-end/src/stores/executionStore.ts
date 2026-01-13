import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  ExecutionSpeed,
  ExecutionState,
  ExecutionStep,
  TestVariables,
} from "@/types/workflow";

interface ExecutionStoreState {
  // State
  executionState: ExecutionState;
  currentStepIndex: number;
  executionPath: ExecutionStep[];
  executedEdgeIds: Set<string>;
  testVariables: TestVariables;
  executionSpeed: ExecutionSpeed;

  // Actions
  setExecutionState: (state: ExecutionState) => void;
  setCurrentStepIndex: (index: number) => void;
  addExecutionStep: (step: ExecutionStep) => void;
  updateExecutionStep: (stepId: string, updates: Partial<ExecutionStep>) => void;
  addExecutedEdge: (edgeId: string) => void;
  setTestVariables: (variables: TestVariables) => void;
  setExecutionSpeed: (speed: ExecutionSpeed) => void;
  resetExecution: () => void;
  startExecution: (variables: TestVariables) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
}

const initialState = {
  executionState: "idle" as ExecutionState,
  currentStepIndex: -1,
  executionPath: [] as ExecutionStep[],
  executedEdgeIds: new Set<string>(),
  testVariables: {} as TestVariables,
  executionSpeed: 800 as ExecutionSpeed,
};

export const useExecutionStore = create<ExecutionStoreState>()(
  devtools(
    (set) => ({
      ...initialState,

      setExecutionState: (executionState) => set({ executionState }),

      setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),

      addExecutionStep: (step) =>
        set((state) => ({
          executionPath: [...state.executionPath, step],
          currentStepIndex: state.executionPath.length,
        })),

      updateExecutionStep: (stepId, updates) =>
        set((state) => ({
          executionPath: state.executionPath.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
          ),
        })),

      addExecutedEdge: (edgeId) =>
        set((state) => ({
          executedEdgeIds: new Set([...state.executedEdgeIds, edgeId]),
        })),

      setTestVariables: (testVariables) => set({ testVariables }),

      setExecutionSpeed: (executionSpeed) => set({ executionSpeed }),

      resetExecution: () =>
        set({
          executionState: "idle",
          currentStepIndex: -1,
          executionPath: [],
          executedEdgeIds: new Set(),
        }),

      startExecution: (variables) =>
        set({
          executionState: "running",
          currentStepIndex: -1,
          executionPath: [],
          executedEdgeIds: new Set(),
          testVariables: variables,
        }),

      pauseExecution: () => set({ executionState: "paused" }),

      resumeExecution: () => set({ executionState: "running" }),
    }),
    { name: "execution-store" }
  )
);

/**
 * Helper selectors
 */
export const useCurrentExecutionStep = () => {
  const executionPath = useExecutionStore((state) => state.executionPath);
  const currentStepIndex = useExecutionStore((state) => state.currentStepIndex);
  return currentStepIndex >= 0 ? executionPath[currentStepIndex] : null;
};

export const useIsNodeExecuting = (nodeId: string) => {
  const currentStep = useCurrentExecutionStep();
  const executionState = useExecutionStore((state) => state.executionState);
  return executionState === "running" && currentStep?.nodeId === nodeId;
};

export const useIsNodeCompleted = (nodeId: string) => {
  const executionPath = useExecutionStore((state) => state.executionPath);
  const currentStepIndex = useExecutionStore((state) => state.currentStepIndex);
  return executionPath
    .slice(0, currentStepIndex)
    .some((step) => step.nodeId === nodeId && step.status === "completed");
};

export const useIsEdgeExecuted = (edgeId: string) => {
  return useExecutionStore((state) => state.executedEdgeIds.has(edgeId));
};
