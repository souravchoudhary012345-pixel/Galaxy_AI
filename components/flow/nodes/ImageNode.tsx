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
    reader.onload = async () => {
      let result = reader.result as string;

      // Convert AVIF to PNG as Gemini doesn't support AVIF
      if (result.startsWith("data:image/avif")) {
        try {
          result = await convertToPng(result);
        } catch (err) {
          console.error("Failed to convert AVIF image", err);
          // Fallback to original, though it might fail at API level
        }
      }

      updateNodeData(id, { preview: result });
    };
    reader.readAsDataURL(file);
  };

  const convertToPng = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
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
