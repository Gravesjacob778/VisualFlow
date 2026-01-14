"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { use, useCallback, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EditorCanvas,
  EditorToolbar,
  ExecutionLogPanel,
  NodePalette,
  PropertiesPanel,
} from "@/features/editor";

interface EditorPageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { workflowId } = use(params);
  const [leftPanelWidth, setLeftPanelWidth] = useState(256); // 256px = w-64
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // 320px = w-80

  const workflowName =
    workflowId === "new" ? "New Workflow" : `Workflow ${workflowId}`;

  const handleSave = () => {
    // TODO: Implement save functionality with React Query mutation
    console.log("Saving workflow...");
  };

  const handleLeftResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(500, startWidth + delta));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPanelWidth]);

  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(250, Math.min(600, startWidth + delta));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [rightPanelWidth]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        {/* Toolbar */}
        <EditorToolbar workflowName={workflowName} onSave={handleSave} />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Node Palette */}
          <div style={{ width: `${leftPanelWidth}px` }}>
            <NodePalette className="shrink-0 rounded-none border-r h-full" />
          </div>

          {/* Left Resize Handle */}
          <div
            onMouseDown={handleLeftResize}
            className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary transition-colors"
          />

          {/* Center: Canvas */}
          <EditorCanvas className="flex-1" />

          {/* Right Resize Handle */}
          <div
            onMouseDown={handleRightResize}
            className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary transition-colors"
          />

          {/* Right Panel: Properties & Execution Log */}
          <div
            className="shrink-0 border-l"
            style={{ width: `${rightPanelWidth}px` }}
          >
            <Tabs defaultValue="properties" className="flex h-full flex-col">
              <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              <TabsContent
                value="properties"
                className="flex-1 overflow-hidden m-0"
              >
                <ScrollArea className="h-full">
                  <PropertiesPanel className="rounded-none border-0 shadow-none" />
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="execution"
                className="flex-1 overflow-hidden m-0"
              >
                <ScrollArea className="h-full">
                  <ExecutionLogPanel />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
