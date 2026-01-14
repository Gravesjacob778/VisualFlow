"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsNodeCompleted, useIsNodeExecuting } from "@/stores";
import type { StartNodeData } from "@/types/node";

type StartNode = Node<StartNodeData, "start">;

export function StartNode({ id, data, selected }: NodeProps<StartNode>) {
  const isExecuting = useIsNodeExecuting(id);
  const isCompleted = useIsNodeCompleted(id);

  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 shadow-md transition-all",
        selected && "ring-2 ring-primary ring-offset-2",
        isExecuting && "node-executing",
        isCompleted && "node-completed"
      )}
    >
      <Play className="h-6 w-6 fill-green-500 text-green-500" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500"
      />
      <div className="absolute -bottom-6 whitespace-nowrap text-xs font-medium text-muted-foreground">
        {data.label}
      </div>
    </div>
  );
}
