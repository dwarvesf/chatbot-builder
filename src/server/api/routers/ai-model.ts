import { db } from '~/server/db'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botAIModelRouter = createTRPCRouter({
  getList: protectedProcedure.query(async ({ ctx }) => {
    const aiModels = await db.query.botModels.findMany({})
    return aiModels
  }),
})
