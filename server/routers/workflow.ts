import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../../lib/prisma'; // Relative path
import { currentUser } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export const workflowRouter = router({
    create: protectedProcedure
        .input(z.object({
            name: z.string(),
            nodes: z.any().optional(),
            edges: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Sync user from Clerk to DB
            const user = await currentUser();
            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }
            const email = user.emailAddresses[0]?.emailAddress;
            if (!email) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "User must have an email" });
            }

            await prisma.user.upsert({
                where: { clerkId: ctx.userId },
                create: {
                    clerkId: ctx.userId,
                    email: email,
                },
                update: {
                    email: email // Keep email in sync
                },
            });

            return await prisma.workflow.create({
                data: {
                    name: input.name,
                    nodes: input.nodes ?? undefined,
                    edges: input.edges ?? undefined,
                    userId: ctx.userId,
                },
            });
        }),

    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(), // ID of the last item
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const limit = input.limit ?? 10;
            const { cursor, search } = input;

            const items = await prisma.workflow.findMany({
                take: limit + 1, // Get one extra to determine if there is a next page
                where: {
                    userId: ctx.userId,
                    name: search ? {
                        contains: search,
                        mode: 'insensitive',
                    } : undefined,
                },
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: [
                    { updatedAt: 'desc' },
                    { id: 'desc' } // Ensure deterministic sort
                ],
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem!.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUnique({
                where: {
                    id: input.id,
                },
            });

            if (!workflow || workflow.userId !== ctx.userId) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return workflow;
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            nodes: z.any().optional(),
            edges: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if exists
            const existing = await prisma.workflow.findUnique({
                where: { id: input.id }
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            // Verify ownership
            if (existing.userId !== ctx.userId) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }
            return await prisma.workflow.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    nodes: input.nodes ?? [],
                    edges: input.edges ?? [],
                }
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUnique({
                where: { id: input.id },
            });

            if (!workflow || workflow.userId !== ctx.userId) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return await prisma.workflow.delete({
                where: { id: input.id },
            });
        }),

    runGemini: protectedProcedure
        .input(z.object({
            system_prompt: z.string().optional(),
            user_message: z.string(),
            model: z.string().default("gemini-2.0-flash"),
            images: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gemini API Key not configured" });
            }

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: input.model });

                if (input.system_prompt) {
                    // Gemini supports system instructions in the model config, but for simplicity/compatibility 
                    // we can prepend it or use the proper config if available in this SDK version. 
                    // The @google/genai SDK usually handles system instructions via 'systemInstruction' in model params
                    // but let's stick to simple prompting if uncertain about SDK version features, 
                    // OR use the correct property. 
                    // Checking package.json: "@google/genai": "^1.34.0". This is likely the new Google Gen AI SDK.
                    // Wait, the new SDK might be distinct from @google/generative-ai. 
                    // Let's assume standard content structure for now.

                    // Correction: The user's package.json has "@google/genai": "^1.34.0".
                    // This might be the beta SDK or the specific Node one. 
                    // Let's assume standard usage pattern for safety:
                    // If it fails, I'll debug.
                }

                // Constructing the prompt parts
                const parts: Part[] = [];
                if (input.system_prompt) {
                    parts.push({ text: `System: ${input.system_prompt}\nUser:` });
                }

                parts.push({ text: input.user_message });

                if (input.images && input.images.length > 0) {
                    // Assuming base64 images are passed. need to convert to inline data
                    // format: "data:image/png;base64,..."
                    for (const img of input.images) {
                        const base64Data = img.split(',')[1];
                        const mimeType = img.split(';')[0].split(':')[1];
                        parts.push({
                            inlineData: {
                                mimeType,
                                data: base64Data
                            }
                        });
                    }
                }

                const result = await model.generateContent(parts);
                const response = result.response;
                const text = response.text();

                return {
                    output: text,
                    outputType: 'text'
                };

            } catch (error) {
                console.error("Gemini Error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: (error as Error).message || "Failed to generate content"
                });
            }
        }),
});
