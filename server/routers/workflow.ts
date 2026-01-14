import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../../lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { genAI } from '../../lib/gemini';

export const workflowRouter = router({
    create: protectedProcedure
        .input(z.object({
            name: z.string(),
            nodes: z.any().optional(),
            edges: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                if (!ctx.userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED" });
                }

                const client = await clerkClient();
                const user = await client.users.getUser(ctx.userId);

                if (!user) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found in Clerk" });
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
                        email: email
                    },
                });

                return await prisma.workflow.create({
                    data: {
                        name: input.name,
                        nodes: input.nodes ?? [],
                        edges: input.edges ?? [],
                        userId: ctx.userId,
                    },
                });
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: (error as Error).message || "Failed to create workflow"
                });
            }
        }),

    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
                search: z.string().optional(),
                direction: z.any().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const limit = input.limit ?? 10;
            const { cursor, search } = input;

            const items = await prisma.workflow.findMany({
                take: limit + 1,
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
                    { id: 'desc' }
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
            const existing = await prisma.workflow.findUnique({
                where: { id: input.id }
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

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
            user_message: z.string().min(1, "Message cannot be empty"),
            model: z.string().default("gemini-2.0-flash"),
            images: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
            try {
                const parts: any[] = [{ text: input.user_message }];

                if (input.images && input.images.length > 0) {
                    input.images.forEach(img => {
                        const [header, data] = img.split(',');
                        const mimeType = header.split(';')[0].split(':')[1];

                        parts.push({
                            inlineData: {
                                data,
                                mimeType
                            }
                        });
                    });
                }

                const response = await genAI.models.generateContent({
                    model: input.model,
                    contents: parts,
                    config: {
                        systemInstruction: input.system_prompt,
                    },
                });

                return {
                    output: response.text || "No response generated.",
                    outputType: 'text'
                };

            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: (error as Error).message || "Gemini failed to process request"
                });
            }
        }),
});