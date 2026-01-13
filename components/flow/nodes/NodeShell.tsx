"use client";

import { X } from "lucide-react";
import { useFlowStore } from "@/store/flowStore";

interface NodeShellProps {
  title: string;
  nodeId?: string;
  children: React.ReactNode;
}

export function NodeShell({ title, nodeId, children }: NodeShellProps) {
  const deleteNode = useFlowStore((s) => s.deleteNode);

  return (
    <div className="relative w-72 rounded-xl border border-nodeBorder bg-node shadow-node">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-nodeBorder px-3 py-2 text-xs text-muted">
        <span>{title}</span>

        {nodeId && (
          <button
            onClick={() => deleteNode(nodeId)}
            className="nodrag text-red-500 hover:text-red-600 transition"
            title="Delete node"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 p-3">
        {children}
      </div>
    </div>
  );
}