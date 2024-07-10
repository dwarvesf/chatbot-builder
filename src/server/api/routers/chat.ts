import { PGVectorStore } from '@langchain/community/vectorstores/pgvector'
import { type Document } from '@langchain/core/documents'
import {
  HumanMessageChunk,
  type BaseMessage,
  type MessageContentComplex,
} from '@langchain/core/messages'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import OpenAI from 'openai'
import pg from 'pg'
import sharp from 'sharp'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { env } from '~/env'
import { BotModelEnum } from '~/model/bot-model'
import { ChatRoleEnum } from '~/model/chat'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { type Nullable } from '~/utils/types'
import { isBase64, isImageData } from '~/utils/utils'
import { createTRPCRouter, integrationProcedure } from '../trpc'

const reusablePool = new pg.Pool({
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
})

const originalConfig = {
  pool: reusablePool,
  tableName: 'bot_source_extracted_data_vector',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
  },
}

const pgvectorStore = new PGVectorStore(
  new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    dimensions: 1024,
  }),
  originalConfig,
)

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

      const retriever = pgvectorStore.asRetriever()
      const contexts = await retriever.invoke(msg.message)

      // const contexts = await getRelatedContexts(bot.id, msg.message)
      const assistantMsgs = []

      if (contexts.length > 0) {
        // Build prompt
        // const prompt = await buildPrompt(contexts, msg.message)
        const prompt = await buildPromptv2(contexts, msg.message)
        // console.log('Prompt:', prompt)

        // Ask bot
        // const res = await askAI(bot, msg.message)
        const res = await askAIv2(bot, prompt)
        if (!res) {
          throw new Error('Failed to ask AI')
        }
        // console.log('AI Response:', res)

        // console.log(
        //   'Refer Links:',
        //   contexts.map((row) => row.referLinks),
        // )

        //const sourceLinks: string[] = []

        // contexts.forEach((context) => {
        //   if (context.sourceType === Number(BotSourceTypeEnum.File)) {
        //     return
        //   }

        //   if (!context.referLinks) {
        //     return
        //   }

        //   sourceLinks.push(context.referLinks)
        // })

        // const formatSourceLinks = lodash.uniq(sourceLinks) // filter duplicate link

        // const { completion } = res

        // const resChoices = completion?.choices?.filter(
        //   (c) => c?.message?.role === 'assistant',
        // )

        // Save bot response
        // if (resChoices?.length) {
        //   for (const res of resChoices) {
        //     const isLastMsg = res === resChoices[resChoices.length - 1]

        //     const resId = uuidv7()
        //     const m = await db
        //       .insert(schema.chats)
        //       .values({
        //         id: resId,
        //         botModelId: bot.modelId,
        //         roleId: ChatRoleEnum.Assistant,
        //         parentChatId: chatId,
        //         threadId,
        //         msg: res.message.content,
        //         prompt,
        //         promptTokens: isLastMsg ? completion?.usage?.prompt_tokens : 0,
        //         completionTokens: isLastMsg
        //           ? completion?.usage?.completion_tokens
        //           : 0,
        //         totalTokens: isLastMsg ? completion?.usage?.total_tokens : 0,
        //       })
        //       .returning()

        //     assistantMsgs.push(m)
        //   }
        // }
        // return {
        //   chat: c,
        //   assistants: assistantMsgs,
        //   referSourceLinks: formatSourceLinks,
        //   res: completion,
        // }
        return {
          chat: c,
          assistants: prompt,
          referSourceLinks: null,
          res: res.content.toString(),
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

async function askAIv2(
  bot: { id: string; modelId: BotModelEnum },
  prompt: BaseMessage[],
) {
  if (!bot || !prompt) {
    return
  }

  const model = new ChatOpenAI({
    model: 'gpt-4o',
    // model: getAIModel(bot.modelId),
    maxTokens: 1024,
    temperature: 0,
  })
  for (const p of prompt) {
    console.log('Prompt:', p.content)
  }

  const result = await model.invoke(prompt)

  return result
}

async function getRelatedContexts(botId: string, msg: string) {
  const msgVectors = await getEmbeddingsFromContents([msg])
  if (!msgVectors?.length) {
    throw new Error('Failed to get embeddings')
  }

  const msgEmbeddings = msgVectors[0]?.embeddings
  if (!msgEmbeddings) {
    throw new Error('Failed to get embeddings')
  }

  // Get similar sources
  const contexts = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      referLinks: schema.botSources.url,
      sourceType: schema.botSources.typeId,
      // vectors: schema.botSourceExtractedDataVector.vector,
      distance: sql`vector <=> ${'[' + msgEmbeddings.join(', ') + ']'} as distance`,
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
        sql`vector <=> ${'[' + msgEmbeddings.join(', ') + ']'} < 0.7`, // Could adjust this threshold
      ),
    )
    .orderBy(sql`distance ASC`)
    .limit(Number(env.CLOSEST_CHUNKS_COUNT_FOR_CHAT_CONTEXT))

  return contexts
}

async function buildPrompt(
  context: {
    content: string | null
    distance: unknown
  }[],
  message: string,
) {
  const contents = context.map((row) => row.content).filter((c) => !!c)
  const prompt = `Question: ${message} \n\n Context: ${contents.join('\n')}`

  return prompt
}

async function buildPromptv2(context: Document[], question: string) {
  const messages: MessageContentComplex[] = []
  const textMessages = []
  for (const r of context) {
    if (isBase64(r.pageContent) && isImageData(r.pageContent)) {
      // image data
      const resizeImage = await resizeBase64Image(r.pageContent, [1300, 600])
      messages.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${resizeImage}`,
        },
      })
    } else {
      // text, table
      textMessages.push(r.pageContent)
    }
  }
  const formattedTextMessages = textMessages.join('\n')
  messages.push({
    type: 'text',
    text: `
          You are AI assistant which is capable of answering questions.\n
          You will be given a mixed of text, tables, and image(s) usually of charts or graphs.\n
          Use this information to provide answer related to the user question but keep answer clean and understandable.\n
          User-provided question: ${question}\n
          Text and/or tables provided: \n
          ${formattedTextMessages}
          `,
  })

  const humanMessages: BaseMessage[] = [
    new HumanMessageChunk({ content: messages }),
  ]

  return humanMessages
}

function getAIModel(modelID: BotModelEnum): string {
  switch (modelID) {
    case BotModelEnum.GPT3:
      return 'gpt-4o'
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

async function resizeBase64Image(
  base64String: string,
  size: [number, number] = [128, 128],
): Promise<string> {
  // Decode the Base64 string to a Buffer
  const imgBuffer = Buffer.from(base64String, 'base64')

  // Resize the image using sharp
  const resizedImgBuffer = await sharp(imgBuffer)
    .resize(...size)
    .toBuffer()

  // Encode the resized image to Base64
  return resizedImgBuffer.toString('base64')
}
