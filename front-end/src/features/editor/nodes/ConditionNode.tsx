"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsNodeCompleted, useIsNodeExecuting } from "@/stores";
import type { ConditionNodeData } from "@/types/node";

export function ConditionNode({
  id,
  data,
  selected,
}: NodeProps<ConditionNodeData>) {
  const isExecuting = useIsNodeExecuting(id);
  const isCompleted = useIsNodeCompleted(id);

  const conditionGroups = data.conditionGroups || [];
  // Always have at least 2 outputs: one for conditions + one for else/default
  const outputCount = Math.max(conditionGroups.length, 1) + 1;

  return (
    <div
      className={cn(
        "relative flex min-w-[200px] flex-col items-center",
        selected && "ring-2 ring-primary ring-offset-2 rounded-lg",
        isExecuting && "node-executing rounded-lg",
        isCompleted && "node-completed rounded-lg"
      )}
    >
      <Handle type="target" position={Position.Top} />

      {/* Diamond shape container */}
      <div className="flex flex-col items-center rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-amber-600" />
          <span className="font-medium">{data.label}</span>
        </div>

        {conditionGroups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {conditionGroups.map((group) => (
              <Badge
                key={group.id}
                variant="secondary"
                className="text-xs bg-amber-100"
              >
                {group.label || `Condition ${conditionGroups.indexOf(group) + 1}`}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Output handles for each condition + else */}
      <div className="mt-2 flex w-full justify-around">
        {conditionGroups.map((group, index) => (
          <div key={group.id} className="relative flex flex-col items-center">
            <Handle
              type="source"
              position={Position.Bottom}
              id={`condition-${group.id}`}
              className="!relative !transform-none !bg-amber-500"
              style={{ left: "auto", bottom: "auto" }}
            />
            <span className="mt-1 text-xs text-muted-foreground">
              {group.label || `If ${index + 1}`}
            </span>
          </div>
        ))}
        {/* Default/Else output */}
        <div className="relative flex flex-col items-center">
          <Handle
            type="source"
            position={Position.Bottom}
            id="else"
            className="!relative !transform-none !bg-gray-500"
            style={{ left: "auto", bottom: "auto" }}
          />
          <span className="mt-1 text-xs text-muted-foreground">Else</span>
        </div>
      </div>
    </div>
  );
}
