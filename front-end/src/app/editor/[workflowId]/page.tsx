"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { use } from "react";

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

  const workflowName =
    workflowId === "new" ? "New Workflow" : `Workflow ${workflowId}`;

  const handleSave = () => {
    // TODO: Implement save functionality with React Query mutation
    console.log("Saving workflow...");
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        {/* Toolbar */}
        <EditorToolbar workflowName={workflowName} onSave={handleSave} />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Node Palette */}
          <NodePalette className="w-64 shrink-0 rounded-none border-r" />

          {/* Center: Canvas */}
          <EditorCanvas className="flex-1" />

          {/* Right Panel: Properties & Execution Log */}
          <div className="w-80 shrink-0 border-l">
            <Tabs defaultValue="properties" className="flex h-full flex-col">
              <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              <TabsContent
                value="properties"
                className="flex-1 overflow-hidden m-0"
              >
                <PropertiesPanel className="h-full rounded-none border-0 shadow-none" />
              </TabsContent>
              <TabsContent
                value="execution"
                className="flex-1 overflow-hidden m-0"
              >
                <ExecutionLogPanel className="h-full" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
