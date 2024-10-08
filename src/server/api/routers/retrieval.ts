import { z } from 'zod'
import { SearchTypeEnum } from '~/model/search-type'
import { retrievalSearch } from '~/server/api/core/rag/retrieval/search-method'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const retrievalDocuments = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        message: z.string(),
        type: z.nativeEnum(SearchTypeEnum),
        topK: z.number(),
        similarityThreshold: z.number(),
        alpha: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await retrievalSearch(
        input.type,
        input.topK,
        input.similarityThreshold,
        input.botId,
        input.message,
        input.alpha,
      )
    }),
})
