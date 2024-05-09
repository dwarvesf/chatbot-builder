import { postRouter } from '~/server/api/routers/post'
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc'
import { botRouter } from './routers/bot'
import { botSourceRouter } from './routers/bot_source'
import { chatRouter } from './routers/chat'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bot: botRouter,
  botSource: botSourceRouter,
  chatRouter: chatRouter,
  post: postRouter,
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
