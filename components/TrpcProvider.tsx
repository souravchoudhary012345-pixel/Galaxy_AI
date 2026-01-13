"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';
import superjson from 'superjson';
import { useAuth } from '@clerk/nextjs';

export function TrpcProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: process.env.NEXT_PUBLIC_API_URL || '/api/trpc',
                    transformer: superjson,
                    async headers() {
                        const token = await getToken();
                        return {
                            Authorization: token ? `Bearer ${token}` : undefined,
                        };
                    },
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
