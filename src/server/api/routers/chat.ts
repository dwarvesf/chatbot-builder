import { TRPCError } from '@trpc/server'
import { and, desc, eq, gt, gte, type InferSelectModel, sql } from 'drizzle-orm'
import lodash from 'lodash'
import OpenAI from 'openai'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { env } from '~/env'
import { BotModelEnum } from '~/model/bot-model'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { ChatRoleEnum } from '~/model/chat'
import { KvCacheTypeEnum } from '~/model/kv-cache'
import { SearchTypeEnum } from '~/model/search-type'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import {
  type RankedResult,
  retrievalSearch,
} from '~/server/api/core/rag/retrieval/search-method'
import { createTRPCRouter, integrationProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { type Nullable } from '~/utils/types'
import { createCaller } from '../root'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY, // This is the default and can be omitted
})

// TODO: Move this to bot config
const CACHE_SIMILARITY_THRESHOLD = 0.8
const CACHE_EMBEDDING_SIMILARITY_THRESHOLD = 0.9

export const chatRouter = createTRPCRouter({
  create: createChatHandler(),
  getList: getListHandler(),
})

interface CachedAIResponseData {
  chatId: string
  chatIdAssistants: string
  referSourceLinks: string[]
  res: OpenAI.ChatCompletion | null
}

interface createChatResponse {
  chats: InferSelectModel<typeof schema.chats>[]
  chatIdAssistants: string
  assistants: InferSelectModel<typeof schema.chats>[] | null
  referSourceLinks: string[]
  res: OpenAI.ChatCompletion | null
}

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
          cacheResponseSecs: schema.bots.cacheResponseSecs,
          cacheEmbeddingSecs: schema.bots.cacheEmbeddingSecs,
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

      const bsRows = await db
        .select({
          retrievalModel: schema.botSources.retrievalModel,
        })
        .from(schema.botSources)
        .where(eq(schema.botSources.botId, ctx.session.botId))

      const bsRetrievalModel = bsRows.length ? bsRows[0] : null

      //Default config retrievalModel
      const searchMethod =
        bsRetrievalModel?.retrievalModel?.searchMethod ?? SearchTypeEnum.Vector
      const topK = bsRetrievalModel?.retrievalModel?.topK ?? 2
      const similarityThreshold =
        bsRetrievalModel?.retrievalModel?.similarityThreshold ?? 0.5
      const alpha = bsRetrievalModel?.retrievalModel?.alpha ?? 0.5

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
      const userQuestions = await db
        .insert(schema.chats)
        .values({
          id: chatId,
          botModelId: bot.modelId,
          roleId: ChatRoleEnum.User,
          threadId,
          msg: msg.message,
        })
        .returning()

      if (bot.cacheResponseSecs > 0) {
        // Check cache
        const cachedAIResponse = await getCachedAIResponse(bot.id, msg.message)
        if (cachedAIResponse) {
          return createChatForCacheAndResponse({
            userQuestions,
            v: cachedAIResponse,
            botModelId: bot.modelId,
            threadId,
          })
        }
      }

      let contexts: RankedResult[] = []
      if (bot.cacheEmbeddingSecs > 0) {
        console.log('Checking cached embeddings')
        const cValue = await getCachedEmbeddings({
          botId: bot.id,
          msg: msg.message,
        })
        // console.log('[getCachedEmbeddings] cValue:', cValue)

        if (cValue?.existed) {
          contexts = cValue.contexts
        } else {
          contexts = await retrievalSearch(
            searchMethod,
            topK,
            similarityThreshold,
            bot.id,
            msg.message,
            alpha,
          )

          console.log('Caching embeddings')
          // store Cache embeddings without blocking
          storeEmbeddingsToCache({
            botId: bot.id,
            msg: msg.message,
            contexts,
            expireSecs: bot.cacheEmbeddingSecs,
          }).catch((err) => {
            console.error('Failed to store embeddings', err)
          })
        }
      } else {
        contexts = await retrievalSearch(
          searchMethod,
          topK,
          similarityThreshold,
          bot.id,
          msg.message,
          alpha,
        )
      }

      if (!contexts) {
        return
      }

      let aiResponseCompletion: OpenAI.ChatCompletion | null = null
      let replyMsg: string | null = null
      let prompt: string | null = null
      let referSourceLinks: string[] = []

      if (contexts.length > 0) {
        // Build prompt
        prompt = await buildPrompt(contexts, msg.message)
        console.log('Prompt:', prompt)

        // Ask bot
        const res = await askAI(bot, prompt)
        if (!res) {
          throw new Error('Failed to ask AI')
        }

        // Get source links
        console.log(
          'Refer Links:',
          contexts.map((row) => row.referLinks),
        )
        referSourceLinks = extractReferSourceLinks(contexts) // filter duplicate link

        aiResponseCompletion = res.completion
        const resChoices = aiResponseCompletion?.choices?.filter(
          (c) => c?.message?.role === 'assistant',
        )

        // Save bot response
        if (resChoices?.length) {
          const lastChoice = resChoices[resChoices.length - 1]
          if (!lastChoice) {
            console.error('OpenAI response is empty', resChoices)
            throw new TRPCError({
              message: 'OpenAI response is empty',
              code: 'INTERNAL_SERVER_ERROR',
            })
          }
          replyMsg = lastChoice.message.content
        }
      } else {
        console.log('Context: No relevant context')
        replyMsg = bot.noRelevantContextMsg
      }

      const resId = uuidv7()
      const resChat = await db
        .insert(schema.chats)
        .values({
          id: resId,
          botModelId: bot.modelId,
          roleId: ChatRoleEnum.Assistant,
          parentChatId: chatId,
          threadId,
          msg: replyMsg,
          prompt,
          promptTokens: aiResponseCompletion?.usage?.prompt_tokens ?? 0,
          completionTokens: aiResponseCompletion?.usage?.completion_tokens ?? 0,
          totalTokens: aiResponseCompletion?.usage?.total_tokens ?? 0,
        })
        .returning()

      // Cache response
      if (bot.cacheResponseSecs > 0) {
        console.log('Caching response')
        const v: CachedAIResponseData = {
          chatId: chatId,
          chatIdAssistants: resId,
          referSourceLinks,
          res: aiResponseCompletion,
        }
        createCaller({ session: null, apiToken: undefined })
          .kvRouter.create({
            secret_key: env.INTERNAL_JOB_SECRET,
            type: KvCacheTypeEnum.UserQueryResponse,
            botId: bot.id,
            key: msg.message,
            value: v,
            durationSecs: bot.cacheResponseSecs,
          })
          .catch((err) => {
            console.error('Failed to cache response', err)
          })
      }

      return {
        chats: userQuestions,
        chatIdAssistants: resId,
        assistants: resChat,
        referSourceLinks,
        res: aiResponseCompletion,
      } as createChatResponse
    })
}

function extractReferSourceLinks(contexts: RankedResult[]) {
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
  return lodash.uniq(sourceLinks) // filter duplicate link
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

async function getCachedAIResponse(
  botId: string,
  msg: string,
): Promise<Nullable<CachedAIResponseData>> {
  const msgVectors = await getEmbeddingsFromContents([msg])
  if (!msgVectors?.length) {
    throw new Error('Failed to get embeddings')
  }

  const msgEmbeddings = msgVectors[0]?.embeddings
  if (!msgEmbeddings) {
    throw new Error('Failed to get embeddings')
  }

  const rows = await db
    .select({
      content: schema.kvCache.value,
      similarity: sql<number>`1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})`,
    })
    .from(schema.kvCache)
    .where(
      and(
        eq(schema.kvCache.botId, botId),
        eq(schema.kvCache.typeId, KvCacheTypeEnum.UserQueryResponse),
        gt(schema.kvCache.expiredAt, new Date()),
        sql<boolean>`(1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})) > ${CACHE_SIMILARITY_THRESHOLD}`,
      ),
    )
    .orderBy(
      sql<number>`(1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})) DESC`,
    )
    .limit(1)

  if (rows.length === 0) {
    return null
  }

  return rows[0]?.content as CachedAIResponseData
}

async function createChatForCacheAndResponse({
  userQuestions,
  v,
  botModelId,
  threadId,
}: {
  botModelId: BotModelEnum
  threadId: string
  userQuestions: InferSelectModel<typeof schema.chats>[]
  v: CachedAIResponseData
}): Promise<createChatResponse> {
  if (userQuestions.length === 0 || !userQuestions[0]?.id) {
    throw new Error('User question is empty')
  }
  const parentChatId = userQuestions[0]?.id

  const resId = uuidv7()
  const resChatRows = await db
    .insert(schema.chats)
    .values({
      id: resId,
      botModelId: botModelId,
      roleId: ChatRoleEnum.Assistant,
      parentChatId,
      threadId,
      msg: v.res?.choices?.[0]?.message?.content,
      prompt: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedFromChatId: v.chatId,
    })
    .returning()

  const res: createChatResponse = {
    chats: userQuestions,
    assistants: resChatRows,
    chatIdAssistants: v.chatIdAssistants,
    referSourceLinks: v.referSourceLinks,
    res: v.res,
  }
  return res
}

async function getCachedEmbeddings(params: {
  botId: string
  msg: string
}): Promise<{ contexts: RankedResult[]; existed: boolean } | null> {
  const msgVectors = await getEmbeddingsFromContents([params.msg])
  if (!msgVectors?.length) {
    throw new Error('Failed to get embeddings')
  }

  const msgEmbeddings = msgVectors[0]?.embeddings
  if (!msgEmbeddings) {
    throw new Error('Failed to get embeddings')
  }

  const rows = await db
    .select({
      contexts: schema.kvCache.value,
      similarity: sql<number>`1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})`,
    })
    .from(schema.kvCache)
    .where(
      and(
        eq(schema.kvCache.typeId, KvCacheTypeEnum.UserQueryEmbedding),
        eq(schema.kvCache.botId, params.botId),
        gt(schema.kvCache.expiredAt, new Date()),
        sql<boolean>`(1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})) > ${CACHE_EMBEDDING_SIMILARITY_THRESHOLD}`,
      ),
    )
    .orderBy(
      sql<number>`(1 - (${schema.kvCache.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})) DESC`,
    )
    .limit(1)

  if (rows.length === 0) {
    return null
  }

  return { contexts: rows[0]?.contexts as RankedResult[], existed: true }
}

async function storeEmbeddingsToCache(params: {
  botId: string
  msg: string
  contexts: RankedResult[]
  expireSecs: number
}) {
  return createCaller({ session: null, apiToken: undefined }).kvRouter.create({
    secret_key: env.INTERNAL_JOB_SECRET,
    type: KvCacheTypeEnum.UserQueryEmbedding,
    botId: params.botId,
    key: params.msg,
    value: params.contexts,
    durationSecs: params.expireSecs,
  })
}
