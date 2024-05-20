import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { ChatRoleEnum } from '~/model/chat'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { createTRPCRouter, integrationProcedure } from '../trpc'

export const threadRouter = createTRPCRouter({
  create: integrationProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        firstMessage: z.string().default('Hey there! How can I help you?'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get bot
      const bot = await db.query.bots.findFirst({
        where: eq(schema.bots.id, ctx.session.botId),
      })
      if (!bot) {
        throw new Error('Bot not found')
      }

      let thread = null
      let chat = null
      await db.transaction(async (db) => {
        // Create thread
        const threadId = uuidv7()
        thread = await db
          .insert(schema.threads)
          .values({
            id: threadId,
            botId: bot.id,
            title: input.title,
          })
          .returning()

        // Create first message
        const chatId = uuidv7()
        chat = await db
          .insert(schema.chats)
          .values({
            id: chatId,
            botModelId: bot.modelId,
            roleId: ChatRoleEnum.User,
            threadId,
            msg: input.firstMessage,
          })
          .returning()
      })

      return {
        thread,
        chat,
      }
    }),
})
