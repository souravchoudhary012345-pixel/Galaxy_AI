"use client";

import ReactFlow, {
  MiniMap,
  Controls,
  Background
} from "reactflow";

import { useFlowStore } from "@/store/flowStore";
import { useMemo } from "react";

import TextNode from "./nodes/TextNode";
import ImageNode from "./nodes/ImageNode";
import LLMNode from "./nodes/LLMNode";
import OutputNode from "./nodes/OutputNode";
import AnimatedEdge from "./edges/AnimatedEdge";

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection
  } = useFlowStore();

  const nodeTypes = useMemo(() => ({
    text: TextNode,
    image: ImageNode,
    llm: LLMNode,
    output: OutputNode // ✅ Make sure this is registered
  }), []);

  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge
  }), []);

  // Assuming defaultEdgeOptions is defined elsewhere or will be defined.
  // For now, I'll define a placeholder if it's not imported/defined.
  // If it's meant to be imported, the instruction didn't include the import.
  // Based on the prompt, it's likely meant to use the custom edge by default.
  const defaultEdgeOptions = useMemo(() => ({
    type: 'animated',
  }), []);

  return (
    <div className="h-screen w-screen antigravity-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={defaultEdgeOptions} // Use the custom edge by default
        fitView
      >
        <Controls />
        <MiniMap
          className="!bg-black/20"
          nodeColor="#6366f1"
          maskColor="rgba(0,0,0,0.4)"
          style={{ opacity: 0.4 }}
        />
        {/* Background removed to allow nebula effect */}
      </ReactFlow>
    </div>
  );
}