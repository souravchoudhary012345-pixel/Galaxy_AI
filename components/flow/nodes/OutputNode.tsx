"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import Image from "next/image";
import { X } from "lucide-react";

import { useFlowStore } from "@/store/flowStore";
import type { OutputNodeData, LLMNodeData } from "@/types/workflow";

const MAX_PREVIEW_LENGTH = 300; // Characters to show initially

export default function OutputNode({ id }: NodeProps<OutputNodeData>) {
  const { nodes, edges, deleteNode, updateNodeData } = useFlowStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const prevContentRef = useRef<string>("");

  // 🔗 Find incoming edge - Always call hooks before any early returns
  const incomingEdge = edges.find((e) => e.target === id);
  const sourceNode = incomingEdge ? nodes.find((n) => n.id === incomingEdge.source) : null;

  // ----------------------------
  // Extract output - Memoized to prevent unnecessary recalculations
  // ----------------------------
  const content = useMemo(() => {
    if (!sourceNode) return null;

    let result: { type: "text" | "image" | "both"; text?: string; image?: string } | null = null;

    // Handle LLM node output (can have text, image, or both)
    if (sourceNode.type === "llm") {
      const llmData = sourceNode.data as LLMNodeData;
      
      let outputText: string | undefined;
      let outputImage: string | undefined;
      let outputType: "text" | "image" | "both" = "text";

      if (Array.isArray(llmData.output)) {
        outputText = llmData.output[0] || "";
      } else if (typeof llmData.output === "string") {
        outputText = llmData.output;
      }

      if (Array.isArray(llmData.outputImage)) {
        outputImage = llmData.outputImage[0];
      } else if (typeof llmData.outputImage === "string") {
        outputImage = llmData.outputImage;
      }

      if (outputImage) {
        outputType = outputText ? "both" : "image";
      } else if (outputText) {
        outputType = "text";
      }

      if (outputText || outputImage) {
        result = {
          type: outputType,
          text: outputText,
          image: outputImage,
        };
      }
    }

    // Handle text node
    if (sourceNode.type === "text" && sourceNode.data?.value) {
      const textValue = Array.isArray(sourceNode.data.value) 
        ? sourceNode.data.value[0] 
        : sourceNode.data.value;
      
      if (typeof textValue === "string") {
        result = {
          type: "text",
          text: textValue,
        };
      }
    }

    // Handle image node
    if (sourceNode.type === "image" && sourceNode.data?.preview) {
      const imageValue = Array.isArray(sourceNode.data.preview)
        ? sourceNode.data.preview[0]
        : sourceNode.data.preview;
      
      if (typeof imageValue === "string") {
        result = {
          type: "image",
          image: imageValue,
        };
      }
    }

    // Handle OutputNode chaining (OutputNode -> OutputNode)
    if (sourceNode.type === "output") {
      const outputData = sourceNode.data as OutputNodeData;
      
      if (outputData?.value) {
        const textValue = Array.isArray(outputData.value) 
          ? outputData.value[0] 
          : outputData.value;
        
        if (typeof textValue === "string") {
          result = {
            type: "text",
            text: textValue,
          };
        }
      }
    }

    return result;
  }, [sourceNode]);

  // Store content in node data for chaining - Only update when content actually changes
  useEffect(() => {
    // Create a stable string representation to compare
    const contentKey = content 
      ? `${content.type}-${content.text || ""}-${content.image || ""}` 
      : "empty";
    
    // Only update if content has actually changed
    if (prevContentRef.current !== contentKey) {
      prevContentRef.current = contentKey;
      
      if (content) {
        updateNodeData(id, {
          value: content.text,
          type: content.type,
        });
      } else {
        updateNodeData(id, {
          value: undefined,
          type: undefined,
        });
      }
    }
  }, [content, id, updateNodeData]);

  // Truncate text if needed - with proper null/undefined checks
  const textContent = content?.text;
  const shouldTruncate = textContent && textContent.length > MAX_PREVIEW_LENGTH;
  const displayText = textContent
    ? (shouldTruncate && !isExpanded
        ? textContent.substring(0, MAX_PREVIEW_LENGTH) + "..."
        : textContent)
    : undefined;

  const hasConnection = incomingEdge && sourceNode;

  return (
    <OutputNodeShell title="Output" nodeId={id} onDelete={deleteNode}>
      {!hasConnection && <EmptyState />}

      {/* Text output - only show if exists */}
      {hasConnection && textContent && displayText && (
        <div className="output-text-container">
          <div className="output-text-content">
            {displayText}
          </div>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-accent hover:text-accentHover transition"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Image output - only show if exists */}
      {hasConnection && content?.image && (
        <div className="output-image-container">
          <Image
            src={content.image}
            alt="Output"
            fill
            className="output-image"
            unoptimized
          />
        </div>
      )}

      {/* Input handle */}
      <Handle type="target" position={Position.Left} />
      {/* Output handle for chaining */}
      <Handle type="source" position={Position.Right} />
    </OutputNodeShell>
  );
}

// Custom shell for OutputNode with black background
function OutputNodeShell({ 
  title, 
  nodeId, 
  onDelete, 
  children 
}: { 
  title: string; 
  nodeId?: string; 
  onDelete: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="output-node-shell">
      {/* Header - Black with white text */}
      <div className="output-node-header">
        <span>{title}</span>
        {nodeId && (
          <button
            onClick={() => onDelete(nodeId)}
            className="nodrag text-red-500 hover:text-red-600 transition"
            title="Delete node"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="output-node-content">
        {children}
      </div>
    </div>
  );
}

// ----------------------------
// Empty State
// ----------------------------
function EmptyState() {
  return (
    <div className="output-empty-state">
      No output connected
    </div>
  );
}