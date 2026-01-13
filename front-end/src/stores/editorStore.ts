import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { WorkflowEdge } from "@/types/edge";
import type { WorkflowNode, WorkflowNodeData } from "@/types/node";

interface EditorState {
  // State
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;

  // Node actions
  setNodes: (nodes: WorkflowNode[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  removeNode: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;

  // Edge actions
  setEdges: (edges: WorkflowEdge[]) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Workflow actions
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  clearWorkflow: () => void;
  setDirty: (isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,

      // Node actions
      setNodes: (nodes) => set({ nodes, isDirty: true }),

      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
          isDirty: true,
        })),

      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          isDirty: true,
        })),

      removeNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isDirty: true,
        })),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
          isDirty: true,
        })),

      // Edge actions
      setEdges: (edges) => set({ edges, isDirty: true }),

      addEdge: (edge) =>
        set((state) => ({
          edges: [...state.edges, edge],
          isDirty: true,
        })),

      removeEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
          isDirty: true,
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
          isDirty: true,
        })),

      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              type: "animatedEdge",
              data: {},
            },
            state.edges
          ),
          isDirty: true,
        })),

      // Selection
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      // Workflow actions
      loadWorkflow: (nodes, edges) =>
        set({
          nodes,
          edges,
          selectedNodeId: null,
          isDirty: false,
        }),

      clearWorkflow: () =>
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          isDirty: false,
        }),

      setDirty: (isDirty) => set({ isDirty }),
    }),
    { name: "editor-store" }
  )
);

/**
 * Helper selectors
 */
export const useSelectedNode = () => {
  const nodes = useEditorStore((state) => state.nodes);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  return nodes.find((node) => node.id === selectedNodeId) ?? null;
};

export const useNodeById = (nodeId: string) => {
  return useEditorStore((state) =>
    state.nodes.find((node) => node.id === nodeId)
  );
};
