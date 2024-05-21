import { and, desc, eq, gte, sql } from 'drizzle-orm'
import OpenAI from 'openai'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { embeddingDocuments } from '~/components/embedding'
import { env } from '~/env'
import { BotModelEnum } from '~/model/bot-model'
import { ChatRoleEnum } from '~/model/chat'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { type Nullable } from '~/utils/types'
import { createTRPCRouter, integrationProcedure } from '../trpc'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY, // This is the default and can be omitted
})

export const chatRouter = createTRPCRouter({
  create: createChatHandler(),
  getList: getListHandler(),
})

function getListHandler() {
  return integrationProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        limit: z.number().max(20).default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const countRow = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.chats)
        .where(eq(schema.chats.threadId, input.threadId))
      const count = Number(countRow[0]?.count) ?? 0

      const chats = await db.query.chats.findMany({
        where: eq(schema.chats.threadId, input.threadId),
        orderBy: [desc(schema.chats.id)],
        limit: input.limit,
        offset: input.offset,
      })

      return {
        chats,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    })
}

function createChatHandler() {
  return integrationProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: msg }) => {
      const rows = await db
        .select({
          id: schema.bots.id,
          modelId: schema.bots.modelId,
          usageLimitPerUserType: schema.bots.usageLimitPerUserType,
          usageLimitPerUser: schema.bots.usageLimitPerUser,
        })
        .from(schema.bots)
        .where(eq(schema.bots.id, ctx.session.botId))
      const bot = rows.length ? rows[0] : null
      if (!bot) {
        throw new Error('Bot not found')
      }

      const thread = await db.query.threads.findFirst({
        where: and(
          eq(schema.threads.id, msg.threadId),
          eq(schema.threads.botId, bot.id),
        ),
      })
      if (!thread) {
        throw new Error('Thread not found')
      }

      const threadId = msg.threadId
      const isUsageLimitValid = await isUserUsageLimitValid(
        threadId,
        bot.usageLimitPerUserType,
        bot.usageLimitPerUser,
      )
      if (!isUsageLimitValid) {
        throw new Error('Usage limit exceeded')
      }

      // create new message
      const chatId = uuidv7()
      const c = await db
        .insert(schema.chats)
        .values({
          id: chatId,
          botModelId: bot.modelId,
          roleId: ChatRoleEnum.User,
          threadId,
          msg: msg.message,
        })
        .returning()

      // Ask bot
      const botRes = await askAI(bot, msg.message)
      const resChoices = botRes?.choices?.filter(
        (c) => c?.message?.role === 'assistant',
      )

      // Save bot response
      const assistantMsgs = []
      if (resChoices?.length) {
        for (const res of resChoices) {
          const isLastMsg = res === resChoices[resChoices.length - 1]

          const resId = uuidv7()
          const m = await db
            .insert(schema.chats)
            .values({
              id: resId,
              botModelId: bot.modelId,
              roleId: ChatRoleEnum.Assistant,
              parentChatId: chatId,
              threadId,
              msg: res.message.content,
              promptTokens: isLastMsg ? botRes?.usage?.prompt_tokens : 0,
              completionTokens: isLastMsg
                ? botRes?.usage?.completion_tokens
                : 0,
              totalTokens: isLastMsg ? botRes?.usage?.total_tokens : 0,
            })
            .returning()
          assistantMsgs.push(m)
        }
      }

      return {
        chat: c,
        assistants: assistantMsgs,
        res: botRes,
      }
    })
}

async function askAI(bot: { id: string; modelId: BotModelEnum }, msg: string) {
  if (!bot) {
    return
  }

  // Build prompt
  const prompt = await buildPrompt(bot.id, msg)
  console.log('Prompt:', prompt)

  // Ask gpt
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: getAIModel(bot.modelId),
  })

  return chatCompletion
}

async function buildPrompt(botId: string, msg: string) {
  const msgVectors = await embeddingDocuments([msg])
  if (!msgVectors?.length) {
    throw new Error('Failed to get embeddings')
  }

  const msgEmbeddings = msgVectors[0]?.embeddings
  if (!msgEmbeddings) {
    throw new Error('Failed to get embeddings')
  }

  // Get similar sources
  const rows = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      // vectors: schema.botSourceExtractedDataVector.vector,
      similarity: sql`vector <=> ${'[' + msgEmbeddings.join(', ') + ']'} as similarity`,
    })
    .from(schema.botSourceExtractedDataVector)
    .innerJoin(
      schema.botSourceExtractedData,
      eq(
        schema.botSourceExtractedData.id,
        schema.botSourceExtractedDataVector.botSourceExtractedDataId,
      ),
    )
    .innerJoin(
      schema.botSources,
      eq(schema.botSources.id, schema.botSourceExtractedData.botSourceId),
    )
    .where(
      and(
        eq(schema.botSources.botId, botId),
        eq(schema.botSources.visible, true),
      ),
    )
    .orderBy(sql`similarity DESC`)
    .limit(5)

  const contents = rows.map((row) => row.content).filter((c) => !!c)

  const prompt = `Question: ${msg} \n\nContext: ${contents.join('\n')}`
  return prompt
}

function getAIModel(modelID: BotModelEnum): string {
  switch (modelID) {
    case BotModelEnum.GPT3:
      return 'gpt-3.5-turbo'
    default:
      throw new Error('Invalid model')
  }
}

async function isUserUsageLimitValid(
  threadID: string,
  usageLimitPerUserType: Nullable<number>,
  usageLimitPerUser: Nullable<number>,
) {
  if (!usageLimitPerUser) {
    return true
  }

  let sqlTimestamp = sql`'1 hour'`
  switch (usageLimitPerUserType) {
    case UsageLimitTypeEnum.PerOneHour:
      sqlTimestamp = sql`'1 hour'`
      break
    case UsageLimitTypeEnum.PerFourHours:
      sqlTimestamp = sql`'4 hours'`
      break
    case UsageLimitTypeEnum.PerDay:
      sqlTimestamp = sql`'24 hours'`
      break
    case UsageLimitTypeEnum.PerWeek:
      sqlTimestamp = sql`'7 days'`
      break
    case UsageLimitTypeEnum.PerMonth:
      sqlTimestamp = sql`'30 days'`
      break
    default:
      break
  }

  const userUsage = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.chats)
    .where(
      and(
        eq(schema.chats.threadId, threadID),
        gte(
          schema.chats.createdAt,
          sql`NOW() - INTERVAL ${sqlTimestamp}::INTERVAL`,
        ),
      ),
    )

  if (!userUsage || userUsage.length === 0) {
    throw new Error('Failed to get user usage')
  }
  if (Number(userUsage[0]?.count) >= usageLimitPerUser) {
    return false
  }
  return true
}
