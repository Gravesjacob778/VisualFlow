"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsNodeCompleted, useIsNodeExecuting } from "@/stores";
import type { TaskNodeData } from "@/types/node";

export function TaskNode({ id, data, selected }: NodeProps<TaskNodeData>) {
  const isExecuting = useIsNodeExecuting(id);
  const isCompleted = useIsNodeCompleted(id);

  const configKeys = Object.keys(data.config || {});

  return (
    <Card
      className={cn(
        "min-w-[180px] max-w-[250px] shadow-md transition-all",
        selected && "ring-2 ring-primary ring-offset-2",
        isExecuting && "node-executing",
        isCompleted && "node-completed"
      )}
    >
      <Handle type="target" position={Position.Top} />
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-3 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
          <Settings className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 truncate font-medium">{data.label}</div>
      </CardHeader>
      {(data.description || configKeys.length > 0) && (
        <CardContent className="p-3 pt-0">
          {data.description && (
            <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
          {configKeys.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {configKeys.length} config{configKeys.length > 1 ? "s" : ""} set
            </div>
          )}
        </CardContent>
      )}
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}
