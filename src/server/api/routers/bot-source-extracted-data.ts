import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botSourceExtractedDataRouter = createTRPCRouter({
  getList: protectedProcedure
    .input(
      z.object({
        botSourceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bs = await db.query.botSources.findFirst({
        where: and(
          eq(schema.botSources.id, input.botSourceId),
          eq(schema.botSources.createdBy, ctx.session.user.id),
        ),
      })
      if (!bs) {
        throw new Error('Bot source not found')
      }

      const arr = await db.query.botSourceExtractedData.findMany({
        where: eq(schema.botSourceExtractedData.botSourceId, input.botSourceId),
      })

      return arr
    }),
})
