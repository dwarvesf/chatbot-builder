import { postRouter } from '~/server/api/routers/post'
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc'
import { botAIModelRouter } from './routers/ai-model'
import { attachmentRouter } from './routers/attachment'
import { botRouter } from './routers/bot'
import { botIntegrationRouter } from './routers/bot-integration'
import { botSourceRouter } from './routers/bot-source'
import { botSourceExtractedDataRouter } from './routers/bot-source-extracted-data'
import { chatRouter } from './routers/chat'
import { feedbackRouter } from './routers/feedback'
import { kvRouter } from './routers/kv-cache'
import { retrievalDocuments } from './routers/retrieval'
import { threadRouter } from './routers/thread'
import { userRouter } from './routers/user'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  attachments: attachmentRouter,
  bot: botRouter,
  botAIModelRouter: botAIModelRouter,
  botIntegrationRouter: botIntegrationRouter,
  botSource: botSourceRouter,
  botSourceExtractedDataRouter: botSourceExtractedDataRouter,
  chatRouter: chatRouter,
  feedback: feedbackRouter,
  kvRouter: kvRouter,
  post: postRouter,
  retrieval: retrievalDocuments,
  thread: threadRouter,
  user: userRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
