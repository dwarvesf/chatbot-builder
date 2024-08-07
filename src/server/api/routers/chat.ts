import { and, desc, eq, gte, sql } from 'drizzle-orm'
import lodash from 'lodash'
import OpenAI from 'openai'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { env } from '~/env'
import { BotModelEnum } from '~/model/bot-model'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { ChatRoleEnum } from '~/model/chat'
import { SearchTypeEnum } from '~/model/search-type'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { retrievalSearch } from '~/server/api/core/rag/retrieval/search-method'
import { createTRPCRouter, integrationProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { type Nullable } from '~/utils/types'

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
        limit: z.number().max(50).default(10),
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
        message: z.string().max(500),
      }),
    )
    .mutation(async ({ ctx, input: msg }) => {
      const rows = await db
        .select({
          id: schema.bots.id,
          modelId: schema.bots.modelId,
          noRelevantContextMsg: schema.bots.noRelevantContextMsg,
          usageLimitPerUserType: schema.bots.usageLimitPerUserType,
          usageLimitPerUser: schema.bots.usageLimitPerUser,
        })
        .from(schema.bots)
        .where(eq(schema.bots.id, ctx.session.botId))

      const bot = rows.length ? rows[0] : null
      if (!bot) {
        throw new Error('Bot not found')
      }

      if (!bot.noRelevantContextMsg) {
        bot.noRelevantContextMsg =
          'No context is relevant to your question. Feel free to ask again.'
      }

      const rowsBs = await db
        .select({
          retrievalModel: schema.botSources.retrievalModel,
        })
        .from(schema.botSources)
        .where(eq(schema.botSources.botId, ctx.session.botId))

      const bsRetrievalModel = rowsBs.length ? rowsBs[0] : null

      //Default config retrievalModel
      const searchMethod =
        bsRetrievalModel?.retrievalModel?.searchMethod ?? SearchTypeEnum.Vector
      const topK = bsRetrievalModel?.retrievalModel?.topK ?? 2
      const similarityThreshold =
        bsRetrievalModel?.retrievalModel?.similarityThreshold ?? 0.5

      const vectorRankWeight =
        bsRetrievalModel?.retrievalModel?.vectorRankWeight ?? 0.5
      const textRankWeight =
        bsRetrievalModel?.retrievalModel?.textRankWeight ?? 0.5

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

      const contexts = await retrievalSearch(
        searchMethod,
        topK,
        similarityThreshold,
        bot.id,
        msg.message,
        vectorRankWeight,
        textRankWeight,
      )

      if (!contexts) {
        return
      }

      const assistantMsgs = []

      if (contexts.length > 0) {
        // Build prompt
        const prompt = await buildPrompt(contexts, msg.message)
        console.log('Prompt:', prompt)

        // Ask bot
        const res = await askAI(bot, prompt)
        if (!res) {
          throw new Error('Failed to ask AI')
        }

        console.log(
          'Refer Links:',
          contexts.map((row) => row.referLinks),
        )

        const sourceLinks: string[] = []

        contexts.forEach((context) => {
          if (context.sourceType === Number(BotSourceTypeEnum.File)) {
            return
          }

          if (!context.referLinks) {
            return
          }

          sourceLinks.push(context.referLinks)
        })

        const formatSourceLinks = lodash.uniq(sourceLinks) // filter duplicate link

        const { completion } = res

        const resChoices = completion?.choices?.filter(
          (c) => c?.message?.role === 'assistant',
        )

        // Save bot response
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
                prompt,
                promptTokens: isLastMsg ? completion?.usage?.prompt_tokens : 0,
                completionTokens: isLastMsg
                  ? completion?.usage?.completion_tokens
                  : 0,
                totalTokens: isLastMsg ? completion?.usage?.total_tokens : 0,
              })
              .returning()

            assistantMsgs.push(m)

            return {
              chat: c,
              chatIdAssistants: resId,
              assistants: assistantMsgs,
              referSourceLinks: formatSourceLinks,
              res: completion,
            }
          }
        }
      } else {
        console.log('Context: No relevant context')

        const resId = uuidv7()
        const m = await db
          .insert(schema.chats)
          .values({
            id: resId,
            botModelId: bot.modelId,
            roleId: ChatRoleEnum.Assistant,
            parentChatId: chatId,
            threadId,
            msg: bot.noRelevantContextMsg,
            prompt: null,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          })
          .returning()
        assistantMsgs.push(m)

        return {
          chat: c,
          chatIdAssistants: resId,
          assistants: assistantMsgs,
          referSourceLinks: null,
          res: null,
        }
      }
    })
}

async function askAI(
  bot: { id: string; modelId: BotModelEnum },
  prompt: string,
) {
  if (!bot || !prompt) {
    return
  }

  // Ask gpt
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: getAIModel(bot.modelId),
  })

  return { completion }
}

async function buildPrompt(
  context: {
    content: string | null
  }[],
  message: string,
) {
  const contents = context.map((row) => row.content).filter((c) => !!c)
  const prompt = `Question: ${message} \n\n Context: ${contents.join('\n')}`

  return prompt
}

function getAIModel(modelID: BotModelEnum): string {
  switch (modelID) {
    case BotModelEnum.GPT3:
      return 'gpt-3.5-turbo'
    case BotModelEnum.GPT4oMini:
      return 'gpt-4o-mini'
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
