import { eq, sql, type InferSelectModel } from 'drizzle-orm'
import OpenAI from 'openai'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import getEmbeddingsFromContents from '~/components/embedding'
import { env } from '~/env'
import { BotModelEnum } from '~/model/bot-model'
import { ChatRoleEnum } from '~/model/chat'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { createTRPCRouter, integrationProcedure } from '../trpc'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY, // This is the default and can be omitted
})

export const chatRouter = createTRPCRouter({
  create: integrationProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: msg }) => {
      const apiToken = ctx.apiToken
      const bi = await db.query.botIntegrations.findFirst({
        where: eq(schema.botIntegrations.apiToken, apiToken),
      })
      if (!bi) {
        throw new Error('Integration not found')
      }

      const bot = await db.query.bots.findFirst({
        where: eq(schema.bots.id, bi?.botId),
      })
      if (!bot) {
        throw new Error('Bot not found')
      }

      let threadId = msg.threadId
      if (!threadId) {
        // create new thread
        const id = uuidv7()
        await db.insert(schema.threads).values({
          id,
          botId: bot.id,
          title: msg.message,
        })
        threadId = id
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
    }),
})

async function askAI(bot: InferSelectModel<typeof schema.bots>, msg: string) {
  if (!bot) {
    return
  }

  // Build prompt
  const prompt = await buildPrompt(bot, msg)
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

async function buildPrompt(
  bot: InferSelectModel<typeof schema.bots>,
  msg: string,
) {
  const msgVectors = await getEmbeddingsFromContents([msg])
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
    .where(eq(schema.botSources.botId, bot.id))
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
