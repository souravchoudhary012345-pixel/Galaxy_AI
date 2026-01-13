# Deploying Galaxy AI to Vercel

Here are the step-by-step instructions to deploy your application to Vercel.

## Prerequisites

1.  **GitHub Account**: Ensure your project is pushed to a GitHub repository.
2.  **Vercel Account**: [Sign up for Vercel](https://vercel.com/signup) if you haven't already.

## 1. Prepare Codebase (Already Done)
I have already performed these necessary changes for you:
-   **Updated `package.json`**: Added `"postinstall": "prisma generate"` to ensure the database client is generated during build.
-   **Updated `TrpcProvider.tsx`**: Configured the API URL to work dynamically. It will default to `/api/trpc` (internal Next.js usage), which is perfect for Vercel.

## 2. Push to GitHub
If you haven't pushed the latest changes:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## 3. Import Project in Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Connect your GitHub account and look for the **Galaxy-AI-main** (or your repo name) repository.
4.  Click **"Import"**.

## 4. Configure Build Settings
Vercel should automatically detect that this is a **Next.js** project.
-   **Framework Preset**: Next.js
-   **Root Directory**: `./` (default)
-   **Build Command**: `next build` (default)
-   **Install Command**: `npm install` (default)

## 5. Configure Environment Variables
This is the most strictly important step. Expand the **"Environment Variables"** section and add the following keys from your local `.env` file:

| Key | Value Source |
| :--- | :--- |
| `DATABASE_URL` | Your NeonDB or Supabase connection string |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From your `.env` or Clerk Dashboard |
| `CLERK_SECRET_KEY` | From your `.env` or Clerk Dashboard |

> **Note**: You do *not* need `NEXT_PUBLIC_API_URL` on Vercel, as it defaults to the correct internal path.

## 6. Deploy
1.  Click **"Deploy"**.
2.  Wait for the build to complete.
3.  Once finished, you will get a live URL (e.g., `galaxy-ai.vercel.app`).

## Troubleshooting
-   **Database**: Ensure your Database (Neon/Supabase) accepts connections from the internet (0.0.0.0/0).
-   **Prisma Error**: If you see errors about "Prisma Client", ensure the "postinstall" script ran successfully. Redeploying often fixes this.

## Known Limitations on Vercel
-   **Image Upload Size**: Vercel Serverless Functions have a request body size limit of **4.5 MB**.
    -   Since we are now uploading images as base64 strings directly to the database (via the API), you will be limited to uploading images smaller than approximately **3 MB**.
    -   Attempting to upload larger images will result in a `413 Payload Too Large` error.
    -   *Solution*: To support larger images in production, consider re-integrating a cloud storage service (like Cloudinary) and performing uploads client-side, or using Vercel Blob.
-   **Execution Timeout**: Vercel Hobby (free) plans have a **10-second (default) to 60-second limit** for Serverless Functions.
    -   If Google Gemini takes longer than this to generate a response, the request will time out.
    -   *Solution*: Upgrading to Pro increases this limit, or you can use streaming responses (requires code changes) to keep the connection alive.

## 7. Verifying "Vercel-Mode" Locally
Before deploying, you can verify that your app works without the standalone backend server (`npm run backend`):
1.  Stop all running terminals.
2.  Run only `npm run dev`.
3.  Open `http://localhost:3013`.
4.  Try to create a workflow.
    -   If it works, your app is correctly using the internal Next.js API routes (`/api/trpc`), which mimics how Vercel runs it.
    -   If it fails, ensure your `.env` variables are correct and `DATABASE_URL` is accessible.
