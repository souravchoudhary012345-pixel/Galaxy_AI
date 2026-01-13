"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Trash2 } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { useFlowStore } from "@/store/flowStore";
import { ImageNodeData } from "@/types/workflow";
import Image from "next/image";

export default function ImageNode({ id, data }: NodeProps<ImageNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateNodeData(id, { preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    updateNodeData(id, { preview: undefined });
  };

  return (
    <NodeShell title="Image" nodeId={id}>
      <label className="block nodrag">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="cursor-pointer rounded-lg border border-dashed border-nodeBorder bg-panel p-3 text-center text-xs text-muted hover:border-accent transition">
          Click to upload image
        </div>
      </label>

   {data.preview && (
  <div className="relative h-40 w-full overflow-hidden rounded-lg">
    <Image
      src={data.preview}
      alt="Preview"
      fill
      unoptimized
      className="object-cover"
    />

     {/* Remove image only */}
    <button
      onClick={clearImage}
      className="nodrag absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-red-600 transition"
      title="Remove image"
    >
      <Trash2 size={14} />
    </button>
  </div>
)}

      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}
