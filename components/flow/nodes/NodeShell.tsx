"use client";

import { X } from "lucide-react";
import { useFlowStore } from "@/store/flowStore";
import { cn } from "@/lib/utils";

interface NodeShellProps {
  title: string;
  nodeId?: string;
  children: React.ReactNode;
  selected?: boolean; // Added selected prop
  className?: string; // Added className prop
}

export function NodeShell({ title, nodeId, children, selected, className }: NodeShellProps) {
  const deleteNode = useFlowStore((s) => s.deleteNode);

  return (
    <div
      className={cn(
        "floating-node relative min-w-[200px] rounded-xl border-[0.5px] border-white/10 bg-card text-card-foreground shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300",
        selected && "scale-[1.02] border-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.3)]",
        className
      )}
    >
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