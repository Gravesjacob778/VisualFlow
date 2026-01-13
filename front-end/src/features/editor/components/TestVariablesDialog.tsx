"use client";

import { Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/stores";
import type { ConditionNodeData } from "@/types/node";
import type { TestVariables } from "@/types/workflow";

interface TestVariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartExecution: (variables: TestVariables) => void;
}

export function TestVariablesDialog({
  open,
  onOpenChange,
  onStartExecution,
}: TestVariablesDialogProps) {
  const nodes = useEditorStore((state) => state.nodes);
  const [variables, setVariables] = useState<TestVariables>({});

  // Extract all field names from condition nodes
  const requiredFields = useMemo(() => {
    const fields = new Set<string>();

    nodes.forEach((node) => {
      if (node.type === "condition") {
        const data = node.data as ConditionNodeData;
        data.conditionGroups?.forEach((group) => {
          group.conditions.forEach((condition) => {
            if (condition.field && condition.field.trim()) {
              fields.add(condition.field.trim());
            }
          });
        });
      }
    });

    return Array.from(fields).sort();
  }, [nodes]);

  const handleVariableChange = useCallback((field: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleStart = useCallback(() => {
    onStartExecution(variables);
    onOpenChange(false);
  }, [variables, onStartExecution, onOpenChange]);

  const handleReset = useCallback(() => {
    setVariables({});
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Test Variables</DialogTitle>
          <DialogDescription>
            Enter test values for the variables used in your workflow
            conditions. These values will be used to simulate the workflow
            execution path.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {requiredFields.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No variables found in condition nodes.</p>
              <p className="mt-1 text-sm">
                Add conditions to your workflow to use test variables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requiredFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`var-${field}`} className="text-sm font-medium">
                    {field}
                  </Label>
                  <Input
                    id={`var-${field}`}
                    value={(variables[field] as string) || ""}
                    onChange={(e) => handleVariableChange(field, e.target.value)}
                    placeholder={`Enter value for ${field}...`}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleStart}>
            <Play className="mr-2 h-4 w-4" />
            Start Execution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
