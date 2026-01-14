import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined in your environment variables.");
}

export const genAI = new GoogleGenAI({
  apiKey: apiKey || "MISSING_KEY",
});