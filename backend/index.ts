import 'dotenv/config';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from '../server/routers/_app';
import cors from 'cors';
import { clerkClient } from '@clerk/nextjs/server';
import { verifyToken } from '@clerk/backend';

const server = createHTTPServer({
    middleware: cors({
        origin: ['http://localhost:3013', 'http://localhost:3000'],
        credentials: true,
    }),
    router: appRouter,
    createContext: async ({ req, res }) => {
        const authHeader = req.headers.authorization;
        let userId: string | null = null;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const verify = await verifyToken(token, {
                    secretKey: process.env.CLERK_SECRET_KEY,
                });
                userId = verify.sub;
            } catch (e) {
                // console.error("Token verification failed", e);
            }
        }

        return {
            userId,
        };
    },
    maxBodySize: 10 * 1024 * 1024, // 10MB limit for images
});

const port = 3015;
console.log(`Backend server listening on port ${port}`);
server.listen(port);
