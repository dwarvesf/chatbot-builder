import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { SearchTypeEnum } from '~/model/search-type'
import { Search } from '~/server/api/core/rag/retrieval/search-method'

export const retrievalDocuments = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        message: z.string(),
        type: z.nativeEnum(SearchTypeEnum),
        top_k: z.number(),
        distance: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await Search(
        input.type,
        input.top_k,
        input.distance,
        input.botId,
        input.message,
      )
    }),
})
