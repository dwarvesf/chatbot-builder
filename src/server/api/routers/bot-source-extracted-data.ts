import { and, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botSourceExtractedDataRouter = createTRPCRouter({
  getList: getListHandler(),

  getVectorContents: getVectorsHandler(),
})

function getVectorsHandler() {
  return protectedProcedure
    .input(
      z.object({
        botSourceId: z.string().uuid(),
        loadVectorArray: z.boolean().default(false),
        limit: z.number().max(100).default(10),
        offset: z.number().default(0),
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

      // Get bsDataIds
      const bsDataIdsRows = await db
        .select({
          id: schema.botSourceExtractedData.id,
        })
        .from(schema.botSourceExtractedData)
        .where(eq(schema.botSourceExtractedData.botSourceId, input.botSourceId))
      const bsDataIds = bsDataIdsRows.map((r) => r.id)

      if (bsDataIds.length === 0) {
        return {
          data: [],
          pagination: { total: 0, limit: input.limit, offset: input.offset },
        }
      }

      const query = db
        .select({
          id: schema.botSourceExtractedDataVector.id,
          content: schema.botSourceExtractedDataVector.content,
        })
        .from(schema.botSourceExtractedDataVector)
        .limit(input.limit)
        .offset(input.offset)
        .$dynamic()

      const whereQms = [
        inArray(
          schema.botSourceExtractedDataVector.botSourceExtractedDataId,
          bsDataIds,
        ),
      ]

      const arr = await query.where(and(...whereQms))

      const countRows = await db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(schema.botSourceExtractedDataVector)
        .where(and(...whereQms))
      const count = Number(countRows[0]?.count) ?? 0

      return {
        data: arr,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    })
}

function getListHandler() {
  return protectedProcedure
    .input(
      z.object({
        botSourceId: z.string().uuid(),
        limit: z.number().max(100).default(10),
        offset: z.number().default(0),
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

      const query = db
        .select()
        .from(schema.botSourceExtractedData)
        .limit(input.limit)
        .offset(input.offset)
        .$dynamic()

      const whereQms = [
        eq(schema.botSourceExtractedData.botSourceId, input.botSourceId),
      ]

      const arr = await query.where(and(...whereQms))

      const countRows = await db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(schema.botSourceExtractedData)
        .where(and(...whereQms))
      const count = Number(countRows[0]?.count) ?? 0

      return {
        data: arr,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    })
}
