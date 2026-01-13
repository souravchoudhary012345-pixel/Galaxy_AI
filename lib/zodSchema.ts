import { z } from "zod";


export const runLLMSchema = z.object({
model: z.string(),
system_prompt: z.string().optional(),
user_message: z.string(),
images: z.array(z.string()).optional()
});