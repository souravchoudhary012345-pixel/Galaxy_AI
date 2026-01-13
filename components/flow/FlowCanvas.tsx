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

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        fitView
      >
        <MiniMap
          style={{ background: '#111827', border: '1px solid #1f2937' }}
          nodeColor="#6366f1"
          maskColor="#0b0f14"
        />
        <Controls />
        <Background gap={18} size={1} />
      </ReactFlow>
    </div>
  );
}