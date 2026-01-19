"use client";

import { Pause, Play, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore, useExecutionStore } from "@/stores";
import { EXECUTION_SPEEDS, type ExecutionSpeed, type TestVariables } from "@/types/workflow";

import { useWorkflowExecution } from "../hooks/useWorkflowExecution";
import { TestVariablesDialog } from "./TestVariablesDialog";

interface EditorToolbarProps {
  workflowName?: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export function EditorToolbar({
  workflowName = "Untitled Workflow",
  onSave,
  isSaving = false,
}: EditorToolbarProps) {
  const isDirty = useEditorStore((state) => state.isDirty);
  const executionSpeed = useExecutionStore((state) => state.executionSpeed);
  const setExecutionSpeed = useExecutionStore((state) => state.setExecutionSpeed);

  const { executionState, start, pause, resume, reset } = useWorkflowExecution();

  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleRunClick = useCallback(() => {
    if (executionState === "idle" || executionState === "completed" || executionState === "error") {
      setShowTestDialog(true);
    } else if (executionState === "running") {
      pause();
    } else if (executionState === "paused") {
      resume();
    }
  }, [executionState, pause, resume]);

  const handleStartExecution = useCallback(
    (variables: TestVariables) => {
      start(variables);
    },
    [start]
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleSpeedChange = useCallback(
    (value: string) => {
      setExecutionSpeed(Number(value) as ExecutionSpeed);
    },
    [setExecutionSpeed]
  );

  const getRunButtonLabel = () => {
    switch (executionState) {
      case "running":
        return "Pause";
      case "paused":
        return "Resume";
      default:
        return "Run Preview";
    }
  };

  const getRunButtonIcon = () => {
    switch (executionState) {
      case "running":
        return <Pause className="mr-2 h-4 w-4" />;
      default:
        return <Play className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        {/* Left: Workflow Name */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{workflowName}</h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>

        {/* Center: Execution Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={executionState === "running" ? "secondary" : "default"}
            size="sm"
            onClick={handleRunClick}
          >
            {getRunButtonIcon()}
            {getRunButtonLabel()}
          </Button>

          {(executionState === "running" ||
            executionState === "paused" ||
            executionState === "completed" ||
            executionState === "error") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset execution</TooltipContent>
              </Tooltip>
            )}

          <Separator orientation="vertical" className="mx-2 h-6" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Speed:</span>
            <Select
              value={String(executionSpeed)}
              onValueChange={handleSpeedChange}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXECUTION_SPEEDS.map((speed) => (
                  <SelectItem key={speed.value} value={String(speed.value)}>
                    {speed.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: Save */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/robot-sim">Return to Simulation</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <TestVariablesDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        onStartExecution={handleStartExecution}
      />
    </TooltipProvider>
  );
}
