import { TRPCError } from '@trpc/server'
import dayjs from 'dayjs'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { createTRPCRouter, internalProcedure } from '../trpc'

export const kvRouter = createTRPCRouter({
  create: internalProcedure
    .input(
      z.object({
        botId: z.string(),
        key: z.string(),
        value: z.any(),
        durationSecs: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log('kvRouter.create input:', input)
      // Embed the content
      const res = await getEmbeddingsFromContents([input.key])
      if (res.length === 0) {
        throw new TRPCError({
          message: 'No embeddings found',
          code: 'INTERNAL_SERVER_ERROR',
        })
      }
      if (res.length > 1) {
        throw new TRPCError({
          message: 'Multiple embeddings found',
          code: 'INTERNAL_SERVER_ERROR',
        })
      }
      // console.log(res)

      console.log('kvRouter.create res:', res)
      const rs = res[0]
      // Store cache
      const rows = await db
        .insert(schema.kvCache)
        .values({
          id: uuidv7(),
          botId: input.botId,
          key: input.key,
          value: JSON.stringify(input.value),
          vector: rs?.embeddings,
          expiredAt: dayjs().add(input.durationSecs, 'seconds').toDate(),
        })
        .returning()

      return rows
    }),
})
