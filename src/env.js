import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.number(),
    DATABASE_NAME: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === 'production'
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    OPENAI_API_KEY: z.string(),
    MOCK_EMBEDDING: z.coerce.boolean(),
    ASYNC_EMBEDDING_COUNT: z.string().optional().default('10'),
    ASYNC_BULK_IMPORT_THREAD_LIMIT: z.string().optional().default('10'),
    FIRECRAWL_API_URL: z.string().url(),
    FIRECRAWL_SECRET_TOKEN: z.string(),
    CLOSEST_CHUNKS_COUNT_FOR_CHAT_CONTEXT: z.string().optional().default('2'),
    CRON_SERVICE_URL: z.string().url(),
    CRON_JOB_SECRET: z.string(),
    MAX_CRON_DURATION: z.string().default('60'),
    // DISCORD_CLIENT_ID: z.string(),
    // DISCORD_CLIENT_SECRET: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MOCK_EMBEDDING: process.env.MOCK_EMBEDDING,
    ASYNC_EMBEDDING_COUNT: process.env.ASYNC_EMBEDDING_COUNT,
    ASYNC_BULK_IMPORT_THREAD_LIMIT: process.env.ASYNC_BULK_IMPORT_THREAD_LIMIT,
    FIRECRAWL_API_URL: process.env.FIRECRAWL_API_URL,
    FIRECRAWL_SECRET_TOKEN: process.env.FIRECRAWL_SECRET_TOKEN,
    CLOSEST_CHUNKS_COUNT_FOR_CHAT_CONTEXT:
      process.env.CLOSEST_CHUNKS_COUNT_FOR_CHAT_CONTEXT,
    CRON_SERVICE_URL: process.env.CRON_SERVICE_URL,
    CRON_JOB_SECRET: process.env.CRON_JOB_SECRET,
    MAX_CRON_DURATION: process.env.MAX_CRON_DURATION,
    // DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    // DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})
