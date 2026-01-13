// components/flow/nodes/LLMNode.tsx
"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { NodeShell } from "./NodeShell";
import { LLMNodeData, OutputNodeData } from "@/types/workflow";
import { useFlowStore } from "@/store/flowStore";
import { trpc } from "@/utils/trpc";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const { nodes, edges, updateNodeData, addOutputNode } = useFlowStore();
  // Set default model to gemini-2.5-flash-image
  const model = data.model || "gemini-2.5-flash";

  // Retrieve data from connected nodes
  const getConnectedData = () => {
    const connectedEdges = edges.filter((e) => e.target === id);

    const inputData: {
      system?: string;
      user?: string;
      images?: string[];
    } = {};

    connectedEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      const handleId = edge.targetHandle;

      // Handle TextNode
      if (sourceNode.type === "text" && sourceNode.data?.value) {
        if (handleId === "system") inputData.system = sourceNode.data.value as string;
        if (handleId === "user") inputData.user = sourceNode.data.value as string;
      }

      // Handle ImageNode
      if (sourceNode.type === "image" && sourceNode.data?.preview && handleId === "images") {
        if (!inputData.images) inputData.images = [];
        inputData.images.push(sourceNode.data.preview as string);
      }

      // Handle OutputNode - Extract text for system/user prompts
      if (sourceNode.type === "output") {
        const outputData = sourceNode.data as OutputNodeData;

        // Get text content from OutputNode
        let outputText: string | undefined;
        if (outputData?.value) {
          outputText = Array.isArray(outputData.value)
            ? outputData.value[0]
            : outputData.value;
        }

        // If OutputNode has text, use it for system or user based on handle
        if (outputText && typeof outputText === "string") {
          if (handleId === "system") {
            inputData.system = outputText;
          } else if (handleId === "user") {
            inputData.user = outputText;
          }
        }

        // Get image content from OutputNode
        if (outputData?.image && handleId === "images") {
          const outputImage = Array.isArray(outputData.image)
            ? outputData.image[0]
            : outputData.image;

          if (outputImage && typeof outputImage === "string") {
            if (!inputData.images) inputData.images = [];
            inputData.images.push(outputImage);
          }
        }
      }
    });

    // Fallback to manual input if no connection
    if (!connectedHandles.system && data.systemPrompt) {
      inputData.system = data.systemPrompt;
    }
    if (!connectedHandles.user && data.userMessage) {
      inputData.user = data.userMessage;
    }

    return inputData;
  };

  // Execute LLM generation
  const runGemini = trpc.workflow.runGemini.useMutation({
    onSuccess: (data) => {
      updateNodeData(id, {
        output: data.output,
        outputType: data.outputType || "text",
        loading: false,
        error: undefined,
      });
      // Note: Automatic output node generation disabled to keep response internal
    },
    onError: (err) => {
      updateNodeData(id, {
        loading: false,
        output: undefined,
        outputType: undefined,
        error: err.message || "Failed to generate content",
      });
    },
  });

  const handleRun = () => {
    const inputData = getConnectedData();

    if (!inputData.user) {
      updateNodeData(id, {
        error: "User message is required",
        loading: false,
      });
      return;
    }

    updateNodeData(id, {
      loading: true,
      error: undefined,
      output: undefined,
      outputImage: undefined,
      outputType: undefined,
    });

    // Handle images: Ensure they are strings (Base64) if present
    const images = inputData.images ? inputData.images.filter(img => typeof img === 'string') : undefined;

    runGemini.mutate({
      system_prompt: inputData.system,
      user_message: inputData.user,
      model: model,
      images: images,
    });
  };

  // Connection status helpers
  const connectedHandles = {
    system: edges.some((e) => e.target === id && e.targetHandle === "system"),
    user: edges.some((e) => e.target === id && e.targetHandle === "user"),
    images: edges.some((e) => e.target === id && e.targetHandle === "images"),
  };

  return (
    <NodeShell title="Run Any LLM" nodeId={id}>
      {/* Input status - Normal flow layout */}
      <div className="space-y-3 mb-4 text-xs">
        <StatusDot
          label="System Prompt"
          active={connectedHandles.system}
        />
        <StatusDot
          label="User Message"
          active={connectedHandles.user}
        />
        <StatusDot
          label="Images"
          active={connectedHandles.images}
        />
      </div>

      {/* Run button - Comes after input labels */}
      <button
        onClick={handleRun}
        disabled={data.loading}
        className="nodrag w-full rounded-lg bg-accent py-2 text-sm font-medium disabled:opacity-50 mt-4"
      >
        {data.loading ? "Running..." : "Run"}
      </button>

      {/* Error only (NO OUTPUT HERE) */}
      {data.error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400 mt-2">
          {data.error}
        </div>
      )}

      {/* Response Display */}
      {data.output && (
        <div className="mt-4 rounded-md border border-gray-700 bg-gray-900/50 p-2 text-xs text-gray-200 overflow-y-auto max-h-[150px] nodrag nowheel cursor-text prose prose-invert prose-xs max-w-none">
          <div className="font-semibold mb-1 text-gray-400">Response:</div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {data.output}
          </ReactMarkdown>
        </div>
      )}

      {/* Input Handles - Positioned to align with StatusDot labels */}
      <Handle id="system" type="target" position={Position.Left} style={{ top: 66 }} />
      <Handle id="user" type="target" position={Position.Left} style={{ top: 86 }} />
      <Handle id="images" type="target" position={Position.Left} style={{ top: 106 }} />

      {/* Output Handle */}
      <Handle id="output" type="source" position={Position.Right} />
    </NodeShell>
  );
}

// ----------------------------
// Small helper component
// ----------------------------
function StatusDot({
  label,
  active
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-green-500" : "bg-gray-500"}`} />
      <span className="text-muted">{label}</span>
    </div>
  );
}