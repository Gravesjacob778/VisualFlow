"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsNodeCompleted, useIsNodeExecuting } from "@/stores";
import type { EndNodeData } from "@/types/node";

type EndNode = Node<EndNodeData, "end">;

export function EndNode({ id, data, selected }: NodeProps<EndNode>) {
  const isExecuting = useIsNodeExecuting(id);
  const isCompleted = useIsNodeCompleted(id);

  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 bg-red-50 shadow-md transition-all",
        selected && "ring-2 ring-primary ring-offset-2",
        isExecuting && "node-executing",
        isCompleted && "node-completed"
      )}
    >
      <Square className="h-6 w-6 fill-red-500 text-red-500" />
      <Handle type="target" position={Position.Top} className="!bg-red-500" />
      <div className="absolute -bottom-6 whitespace-nowrap text-xs font-medium text-muted-foreground">
        {data.label}
      </div>
    </div>
  );
}
