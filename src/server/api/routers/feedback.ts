import { z } from 'zod'
import * as schema from '~/server/db/migration/schema'

import { createTRPCRouter, integrationProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import { FeedbackTypeEnum } from '~/model/feedback'
import { uuidv7 } from 'uuidv7'

export const createFeedback = createTRPCRouter({
  createRating: integrationProcedure
    .input(
      z.object({
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
          chatId: input.chatId,
          typeId: input.feedbackType,
          notes: input.notes,
          createdAt: new Date(),
        })
        .returning()
    }),
})
