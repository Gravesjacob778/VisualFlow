"use client";

import {
  CheckCircle2,
  Circle,
  GitBranch,
  Loader2,
  Play,
  Settings,
  Square,
  XCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores";
import type { ExecutionStep } from "@/types/workflow";

const nodeTypeIcons: Record<string, React.ReactNode> = {
  start: <Play className="h-3 w-3" />,
  task: <Settings className="h-3 w-3" />,
  condition: <GitBranch className="h-3 w-3" />,
  end: <Square className="h-3 w-3" />,
};

const nodeTypeColors: Record<string, string> = {
  start: "bg-green-100 text-green-700",
  task: "bg-blue-100 text-blue-700",
  condition: "bg-amber-100 text-amber-700",
  end: "bg-red-100 text-red-700",
};

function StatusIcon({ status }: { status: ExecutionStep["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

interface ExecutionLogPanelProps {
  className?: string;
}

export function ExecutionLogPanel({ className }: ExecutionLogPanelProps) {
  const executionPath = useExecutionStore((state) => state.executionPath);
  const executionState = useExecutionStore((state) => state.executionState);
  const testVariables = useExecutionStore((state) => state.testVariables);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [executionPath.length]);

  if (executionState === "idle" && executionPath.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <Play className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Click &quot;Run Preview&quot; to simulate workflow execution
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Test Variables Summary */}
      {Object.keys(testVariables).length > 0 && (
        <div className="border-b p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Test Variables:
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(testVariables).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Execution Steps */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <Accordion
          type="multiple"
          className="px-2"
          defaultValue={executionPath.map((s) => s.id)}
        >
          {executionPath.map((step, index) => (
            <AccordionItem key={step.id} value={step.id} className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                    {index + 1}
                  </span>
                  <StatusIcon status={step.status} />
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", nodeTypeColors[step.nodeType])}
                  >
                    {nodeTypeIcons[step.nodeType]}
                    <span className="ml-1">{step.nodeType}</span>
                  </Badge>
                  <span className="truncate text-sm font-medium">
                    {step.nodeLabel}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-0">
                <div className="ml-7 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {formatTimestamp(step.timestamp)}
                  </p>
                  {step.duration !== undefined && (
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {step.duration}ms
                    </p>
                  )}
                  {step.conditionEvaluated && (
                    <div className="mt-2 rounded-md bg-muted p-2">
                      <p className="font-medium">Condition Evaluation:</p>
                      <p className="mt-1 font-mono text-xs">
                        {step.conditionEvaluated.expression}
                      </p>
                      <p className="mt-1">
                        Result:{" "}
                        <span
                          className={
                            step.conditionEvaluated.result
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        >
                          {step.conditionEvaluated.result ? "true" : "false"}
                        </span>
                      </p>
                      <p>
                        Path taken:{" "}
                        <span className="font-medium">
                          {step.conditionEvaluated.selectedPath}
                        </span>
                      </p>
                    </div>
                  )}
                  {step.error && (
                    <p className="text-destructive">
                      <span className="font-medium">Error:</span> {step.error}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      {/* Execution Status Footer */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {executionPath.length} step{executionPath.length !== 1 ? "s" : ""}
          </span>
          <Badge
            variant={
              executionState === "completed"
                ? "default"
                : executionState === "error"
                  ? "destructive"
                  : "secondary"
            }
          >
            {executionState}
          </Badge>
        </div>
      </div>
    </div>
  );
}
