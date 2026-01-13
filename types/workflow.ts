// types/workflow.ts

export interface TextNodeData {
  value?: string;
}

export interface ImageNodeData {
  preview?: string;
}

export interface LLMNodeData {
  model: string;
  loading?: boolean;
  error?: string;
  output?: string; // Text output
  outputImage?: string; // Base64 image output (data URL)
  outputType?: "text" | "image" | "both"; // Type of output
  systemPrompt?: string; // Manual input
  userMessage?: string; // Manual input
}

export interface OutputNodeData {
  value?: string;
  type?: "text" | "image" | "both";
  text?: string;
  image?: string;
}

