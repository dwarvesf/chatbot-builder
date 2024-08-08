import { z } from 'zod'
import * as schema from '~/server/db/migration/schema'

import { desc, eq, sql } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { FeedbackTypeEnum } from '~/model/feedback'
import {
  createTRPCRouter,
  integrationProcedure,
  protectedProcedure,
} from '~/server/api/trpc'
import { db } from '~/server/db'

export const feedbackRouter = createTRPCRouter({
  createRating: integrationProcedure
    .input(
      z.object({
        threadId: z.string(),
        chatId: z.string(),
        feedbackType: z.nativeEnum(FeedbackTypeEnum),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const feedbackId = uuidv7()
      await db
        .insert(schema.chatFeedbacks)
        .values({
          id: feedbackId,
          threadId: input.threadId,
          chatId: input.chatId,
          typeId: input.feedbackType,
          notes: input.notes,
          createdAt: new Date(),
        })
        .returning()
    }),

  getList: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().max(100).default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const countRow = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.chatFeedbacks)
        .where(eq(schema.chatFeedbacks.threadId, input.threadId))
      const count = Number(countRow[0]?.count) ?? 0

      const chat_feedback = await db.query.chatFeedbacks.findMany({
        where: eq(schema.chatFeedbacks.threadId, input.threadId),
        orderBy: [desc(schema.chatFeedbacks.id)],
        limit: input.limit,
        offset: input.offset,
      })

      return {
        chat_feedback,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    }),
})
