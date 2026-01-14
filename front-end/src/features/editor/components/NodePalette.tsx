"use client";

import { GitBranch, GripVertical, Play, Settings, Square } from "lucide-react";
import { type DragEvent, useCallback } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { NodePaletteItem, WorkflowNodeType } from "@/types/node";

const paletteItems: NodePaletteItem[] = [
  {
    type: "start",
    label: "Start",
    description: "Entry point of the workflow",
    icon: "play",
  },
  {
    type: "task",
    label: "Task",
    description: "Execute a configurable action",
    icon: "settings",
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branch based on conditions",
    icon: "git-branch",
  },
  {
    type: "end",
    label: "End",
    description: "Terminate the workflow",
    icon: "square",
  },
];

const iconMap: Record<string, React.ReactNode> = {
  play: <Play className="h-5 w-5 text-green-500" />,
  settings: <Settings className="h-5 w-5 text-blue-500" />,
  "git-branch": <GitBranch className="h-5 w-5 text-amber-500" />,
  square: <Square className="h-5 w-5 text-red-500" />,
};

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const onDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, nodeType: WorkflowNodeType) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Node Palette</CardTitle>
        <CardDescription className="text-xs">
          Drag nodes to the canvas
        </CardDescription>
      </CardHeader>
      <Separator />
      <ScrollArea className="flex-1">
        <CardContent className="p-2">
          <div className="space-y-2">
            {paletteItems.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="flex cursor-grab items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  {iconMap[item.icon]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs leading-tight text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
