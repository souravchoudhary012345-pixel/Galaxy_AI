"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { NodeShell } from "./NodeShell";
import { useFlowStore } from "@/store/flowStore";
import { TextNodeData } from "@/types/workflow";

export default function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <NodeShell title="Text" nodeId={id}>
      <textarea
        className="nodrag w-full bg-panel text-sm p-2 rounded-lg resize-none text-white"
        placeholder="Enter text..."
        value={data.value ?? ""}
        onChange={(e) =>
          updateNodeData(id, { value: e.target.value })
        }
      />

      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}

