/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { eq, type InferSelectModel } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import crawURL from '~/components/crawler'
import getEmbeddingsFromContents from '~/components/embedding'
import * as schema from '~/migration/schema'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { db } from '~/server/db'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botSourceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        typeId: z.nativeEnum(BotSourceTypeEnum),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const botSources = await db
        .insert(schema.botSources)
        .values({
          ...input,
          id: uuidv7(),
          createdBy: ctx.session.user.id,
          statusId: BotSourceStatusEnum.Created,
          createdAt: new Date(),
        })
        .returning()

      // Sync the bot source
      if (botSources.length) {
        for (const bs of botSources) {
          await syncBotSource(bs.id)
        }
      }

      return botSources
    }),

  sync: protectedProcedure
    .input(
      z.object({
        botSourceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const bsId = input.botSourceId
      await syncBotSource(bsId)
      return null
    }),

  getByBotId: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const arr = await db.query.botSources.findMany({
      where: eq(schema.botSources.botId, input),
    })

    return arr
  }),

  dev: protectedProcedure.query(async () => {
    const arr = await db.query.botSources.findMany()
    return arr
  }),

  deleteById: protectedProcedure
    .input(
      z.object({
        botSourceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Delete extracted data
      await db
        .delete(schema.botSourceExtractedData)
        .where(eq(schema.botSourceExtractedData.botSourceId, input.botSourceId))

      // Delete source
      await db
        .delete(schema.botSources)
        .where(eq(schema.botSources.id, input.botSourceId))
    }),
})

async function syncBotSource(bsId: string) {
  try {
    const bs = await db.query.botSources.findFirst({
      where: eq(schema.botSources.id, bsId),
    })
    if (!bs) {
      throw new Error('Bot source not found')
    }
    if (
      bs.statusId !== BotSourceStatusEnum.Created &&
      bs.statusId !== BotSourceStatusEnum.Failed
    ) {
      throw new Error('Invalid bot source status')
    }

    // Update status to crawling
    await db
      .update(schema.botSources)
      .set({
        statusId: BotSourceStatusEnum.Crawling,
      })
      .where(eq(schema.botSources.id, bsId))

    // Crawl the bot source
    const contents = await crawlBotSource(bs)

    const bsDataId = uuidv7()
    await db.insert(schema.botSourceExtractedData).values({
      id: bsDataId,
      botSourceId: bsId,
      data: JSON.stringify(contents),
    })

    // Update status to embedding
    await db
      .update(schema.botSources)
      .set({
        statusId: BotSourceStatusEnum.Embedding,
      })
      .where(eq(schema.botSources.id, bsId))

    // Embed the bot source
    for (const { content, embeddings } of await getEmbeddingsFromContents(
      contents,
    )) {
      // Store data to DB
      await saveEmbeddings(db, bsDataId, content, embeddings)
    }

    // Update status to completed
    await db
      .update(schema.botSources)
      .set({
        statusId: BotSourceStatusEnum.Completed,
      })
      .where(eq(schema.botSources.id, bsId))
  } catch (error) {
    // Set status to failed
    console.error('Error while crawling bot source ', error)

    // Update status to failed
    await db
      .update(schema.botSources)
      .set({
        statusId: BotSourceStatusEnum.Failed,
      })
      .where(eq(schema.botSources.id, bsId))

    throw error
  }
}

async function crawlBotSource(bs: InferSelectModel<typeof schema.botSources>) {
  switch (bs.typeId) {
    case BotSourceTypeEnum.Link:
      return await crawBotSourceUrl(bs?.url)
    case BotSourceTypeEnum.Sitemap:
      // Crawl sitemap
      throw new Error('Not implemented')
    default:
      throw new Error('Invalid bot source type')
  }
}

async function crawBotSourceUrl(url: string | null) {
  if (!url) {
    throw new Error('URL is required')
  }
  return await crawURL(url)
}

async function saveEmbeddings(
  client: PostgresJsDatabase<typeof schema>,
  bsDataId: string,
  content: string,
  embeddings: number[],
) {
  await client.insert(schema.botSourceExtractedDataVector).values({
    id: uuidv7(),
    botSourceExtractedDataId: bsDataId,
    content,
    vector: embeddings,
  })
}
