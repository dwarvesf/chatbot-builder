import { type InferSelectModel, eq } from 'drizzle-orm'
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
        firstMessage: z.string(),
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

      let thread: InferSelectModel<typeof schema.threads> | undefined
      let chat: InferSelectModel<typeof schema.chats> | undefined
      await db.transaction(async (db) => {
        // Create thread
        const threadId = uuidv7()
        const rows = await db
          .insert(schema.threads)
          .values({
            id: threadId,
            botId: bot.id,
            title: input.title,
          })
          .returning()
        if (!rows || rows.length === 0) {
          throw new Error('Failed to create thread')
        }
        thread = rows[0]

        // Create first message
        const chatId = uuidv7()
        const chatRows = await db
          .insert(schema.chats)
          .values({
            id: chatId,
            botModelId: bot.modelId,
            roleId: ChatRoleEnum.User,
            threadId,
            msg: input.firstMessage,
          })
          .returning()
        if (!chatRows || chatRows.length === 0) {
          throw new Error('Failed to create chat')
        }
        chat = chatRows[0]
      })

      return {
        thread,
        chat,
      }
    }),
})
