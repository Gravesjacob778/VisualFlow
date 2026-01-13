"use client";

import { Trash2 } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useEditorStore, useSelectedNode } from "@/stores";
import type {
  ConditionNodeData,
  TaskNodeData,
  WorkflowNodeData,
} from "@/types/node";

import { ConditionBuilder } from "./ConditionBuilder";
import { JsonConfigEditor } from "./JsonConfigEditor";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const selectedNode = useSelectedNode();
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  const removeNode = useEditorStore((state) => state.removeNode);

  const handleLabelChange = useCallback(
    (label: string) => {
      if (selectedNode) {
        updateNodeData(selectedNode.id, { label });
      }
    },
    [selectedNode, updateNodeData]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      if (selectedNode) {
        updateNodeData(selectedNode.id, { description } as Partial<TaskNodeData>);
      }
    },
    [selectedNode, updateNodeData]
  );

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      if (selectedNode) {
        updateNodeData(selectedNode.id, { config } as Partial<TaskNodeData>);
      }
    },
    [selectedNode, updateNodeData]
  );

  const handleConditionsChange = useCallback(
    (conditionGroups: ConditionNodeData["conditionGroups"]) => {
      if (selectedNode) {
        updateNodeData(selectedNode.id, {
          conditionGroups,
        } as Partial<ConditionNodeData>);
      }
    },
    [selectedNode, updateNodeData]
  );

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      removeNode(selectedNode.id);
    }
  }, [selectedNode, removeNode]);

  if (!selectedNode) {
    return (
      <Card className={className}>
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Properties</CardTitle>
          <CardDescription className="text-xs">
            Select a node to edit its properties
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const nodeData = selectedNode.data as WorkflowNodeData;

  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">
              {selectedNode.type?.charAt(0).toUpperCase()}
              {selectedNode.type?.slice(1)} Node
            </CardTitle>
            <CardDescription className="text-xs">
              ID: {selectedNode.id}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 p-4">
          {/* Common: Label */}
          <div className="space-y-2">
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={nodeData.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Node label..."
            />
          </div>

          {/* Task Node: Description & Config */}
          {selectedNode.type === "task" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={(nodeData as TaskNodeData).description || ""}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="What does this task do..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <JsonConfigEditor
                value={(nodeData as TaskNodeData).config || {}}
                onChange={handleConfigChange}
              />
            </>
          )}

          {/* Condition Node: Condition Builder */}
          {selectedNode.type === "condition" && (
            <div className="space-y-2">
              <Label>Condition Branches</Label>
              <ConditionBuilder
                conditionGroups={
                  (nodeData as ConditionNodeData).conditionGroups || []
                }
                onChange={handleConditionsChange}
              />
            </div>
          )}

          {/* Start/End Nodes: Minimal info */}
          {(selectedNode.type === "start" || selectedNode.type === "end") && (
            <p className="text-sm text-muted-foreground">
              {selectedNode.type === "start"
                ? "This is the entry point of your workflow. Connect it to the first task or condition."
                : "This marks the end of a workflow path. Multiple paths can lead to this node."}
            </p>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
