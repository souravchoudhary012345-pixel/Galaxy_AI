import { create } from "zustand";
import {
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  getOutgoers
} from "reactflow";

interface FlowState {
  nodes: Node[];
  edges: Edge[];

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection) => boolean;

  addNode: (type: string) => void;
  addOutputNode: (sourceNodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  setWorkflow: (nodes: Node[], edges: Edge[]) => void;
}

let nodeId = 1;

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },

  // Validate connections, including specific rules for LLM and Output nodes
  isValidConnection: (connection) => {
    const { nodes } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;
    if (!sourceNode.type || !targetNode.type) return false;

    const targetHandle = connection.targetHandle;
    if (!targetHandle) return false;

    // LLM Input Validation
    if (targetNode.type === "llm") {
      if (targetHandle === "system" || targetHandle === "user") {
        // Allow TextNode OR OutputNode (with text) to connect
        return sourceNode.type === "text" || sourceNode.type === "output";
      }

      if (targetHandle === "images") {
        // Allow ImageNode OR OutputNode (with image) to connect
        return sourceNode.type === "image" || sourceNode.type === "output";
      }

      return false;
    }

    // Output Node Validation
    if (targetNode.type === "output") {
      // Allow LLM, Text, Image, or even another OutputNode to connect
      return ["llm", "text", "image", "output"].includes(sourceNode.type);
    }

    // Cycle Detection (DAG) 

    if (hasCycle({ source: connection.source!, target: connection.target! }, nodes, get().edges)) {
      return false;
    }

    return true;
  },

  onConnect: (connection) => {
    if (get().isValidConnection(connection)) {
      set({
        edges: addEdge(
          { ...connection, type: "smoothstep", animated: true },
          get().edges
        )
      });
    }
  },

  addNode: (type) => {
    const newNode: Node = {
      id: `node-${nodeId++}`,
      type,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: type === "llm" ? { model: "gemini-2.5-flash", loading: false } : {}
    };

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
    }));
  },

  setWorkflow: (nodes, edges) => {
    set({ nodes, edges });
  },

  addOutputNode: (sourceNodeId) => {
    const { nodes, edges } = get();

    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    if (!sourceNode) return;

    // Prevent duplicate output nodes
    const existing = edges.find(
      (e) => e.source === sourceNodeId &&
        nodes.find(n => n.id === e.target)?.type === "output"
    );

    if (existing) return;

    const outputNodeId = `node-${nodeId++}`;

    const outputNode: Node = {
      id: outputNodeId,
      type: "output",
      position: {
        x: sourceNode.position.x + 360,
        y: sourceNode.position.y
      },
      data: {}
    };

    set({
      nodes: [...nodes, outputNode],
      edges: [
        ...edges,
        {
          id: `edge-${sourceNodeId}-${outputNodeId}`,
          source: sourceNodeId,
          target: outputNodeId,
          type: "smoothstep",
          animated: true
        }
      ]
    });
  },
}));

// Helper: Check for cycles using DFS
// We want to see if 'target' can reach 'source' via existing edges.
// If yes, adding an edge source->target would create a cycle.
const hasCycle = (
  potentialEdge: { source: string; target: string },
  nodes: Node[],
  edges: Edge[]
) => {
  const sourceNode = nodes.find((n) => n.id === potentialEdge.source);
  const targetNode = nodes.find((n) => n.id === potentialEdge.target);

  if (!sourceNode || !targetNode) return false;

  const stack = [targetNode];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    // If we reach the source node from the target, a cycle exists
    if (current.id === sourceNode.id) return true;

    // Find all nodes connected from generic 'current' node
    const outgoers = getOutgoers(current, nodes, edges);
    outgoers.forEach((node) => stack.push(node));
  }

  return false;
};