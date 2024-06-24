import { z } from 'zod'
import * as schema from '~/server/db/migration/schema'

import {
  createTRPCRouter,
  integrationProcedure,
  protectedProcedure,
} from '~/server/api/trpc'
import { db } from '~/server/db'
import { FeedbackTypeEnum } from '~/model/feedback'
import { uuidv7 } from 'uuidv7'
import { desc, eq, sql } from 'drizzle-orm'

export const createFeedback = createTRPCRouter({
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
        .insert(schema.chat_feedback)
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
        .from(schema.chat_feedback)
        .where(eq(schema.chat_feedback.threadId, input.threadId))
      const count = Number(countRow[0]?.count) ?? 0

      const chat_feedback = await db.query.chat_feedback.findMany({
        where: eq(schema.chat_feedback.threadId, input.threadId),
        orderBy: [desc(schema.chat_feedback.id)],
        limit: input.limit,
        offset: input.offset,
      })

      return {
        chat_feedback,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    }),
})
