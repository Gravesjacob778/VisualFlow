"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, type DragEvent } from "react";

import { useEditorStore } from "@/stores";
import type {
  ConditionNodeData,
  EndNodeData,
  StartNodeData,
  TaskNodeData,
  WorkflowNode,
  WorkflowNodeType,
} from "@/types/node";

import { edgeTypes } from "../edges";
import { nodeTypes } from "../nodes";

function generateNodeId() {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createNodeData(type: WorkflowNodeType): WorkflowNode["data"] {
  switch (type) {
    case "start":
      return {
        type: "start",
        label: "Start",
      } as StartNodeData;
    case "task":
      return {
        type: "task",
        label: "New Task",
        description: "",
        config: {},
      } as TaskNodeData;
    case "condition":
      return {
        type: "condition",
        label: "Condition",
        conditionGroups: [],
      } as ConditionNodeData;
    case "end":
      return {
        type: "end",
        label: "End",
      } as EndNodeData;
  }
}

interface EditorCanvasProps {
  className?: string;
}

export function EditorCanvas({ className }: EditorCanvasProps) {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const onConnect = useEditorStore((state) => state.onConnect);
  const addNode = useEditorStore((state) => state.addNode);
  const selectNode = useEditorStore((state) => state.selectNode);

  const { screenToFlowPosition } = useReactFlow();

  const handleNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      onNodesChange(changes);

      // Handle selection changes
      const selectionChange = changes.find(
        (change) => change.type === "select" && change.selected
      );
      if (selectionChange && selectionChange.type === "select") {
        selectNode(selectionChange.id);
      }
    },
    [onNodesChange, selectNode]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as WorkflowNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: generateNodeId(),
        type,
        position,
        data: createNodeData(type),
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "animatedEdge",
        }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        connectionLineStyle={{ stroke: "#9ca3af", strokeWidth: 2 }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-background"
        />
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
      </ReactFlow>
    </div>
  );
}
