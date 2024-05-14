/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import * as asyncLib from 'async'
import { and, eq, inArray, type InferSelectModel } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { XMLParser } from 'fast-xml-parser'
import { uniq } from 'lodash'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import crawURL from '~/components/crawler'
import getEmbeddingsFromContents from '~/components/embedding'
import { env } from '~/env'
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
    .mutation(async ({ ctx, input }) => {
      const bsId = input.botSourceId
      const bs = await db
        .select({
          id: schema.botSources.id,
        })
        .from(schema.botSources)
        .where(
          and(
            eq(schema.botSources.id, bsId),
            eq(schema.botSources.createdBy, ctx.session.user.id),
          ),
        )
      if (!bs.length) {
        throw new Error('Bot source not found')
      }

      await cleanOldBotSourceData(bsId)
      await syncBotSource(bsId)
      return null
    }),

  getByBotId: protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        typeIDs: z
          .array(z.nativeEnum(BotSourceTypeEnum))
          .default([])
          .optional(),
        limit: z.number().max(100).optional().default(10),
        offset: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bot = await db
        .select({})
        .from(schema.bots)
        .where(
          and(
            eq(schema.bots.id, input.botId),
            eq(schema.bots.createdBy, ctx.session.user.id),
          ),
        )
      if (!bot.length) {
        throw new Error('Bot not found')
      }

      const query = db
        .select()
        .from(schema.botSources)
        .limit(input.limit)
        .offset(input.offset)
        .$dynamic()

      const whereQms = [eq(schema.botSources.botId, input.botId)]

      if (input?.typeIDs && input.typeIDs.length > 0) {
        whereQms.push(inArray(schema.botSources.typeId, input.typeIDs))
      }

      const arr = await query.where(and(...whereQms))
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

async function cleanOldBotSourceData(bsId: string) {
  console.log('Cleaning old bot source data...')
  // Find child bot sources
  const rows = await db
    .select({
      id: schema.botSources.id,
    })
    .from(schema.botSources)
    .where(eq(schema.botSources.parentId, bsId))

  const childSourceIDs = rows.map((r) => r.id)

  // Delete extracted data vector
  const extractedDataIDs = await db
    .select({
      id: schema.botSourceExtractedData.id,
    })
    .from(schema.botSourceExtractedData)
    .where(
      inArray(schema.botSourceExtractedData.botSourceId, [
        ...childSourceIDs,
        bsId,
      ]),
    )
  await db.delete(schema.botSourceExtractedDataVector).where(
    inArray(
      schema.botSourceExtractedDataVector.botSourceExtractedDataId,
      extractedDataIDs.map((r) => r.id),
    ),
  )

  // Delete extracted data
  await db
    .delete(schema.botSourceExtractedData)
    .where(
      inArray(schema.botSourceExtractedData.botSourceId, [
        ...childSourceIDs,
        bsId,
      ]),
    )

  // Delete child bot sources
  await db
    .delete(schema.botSources)
    .where(inArray(schema.botSources.id, childSourceIDs))

  // Reset status
  await db
    .update(schema.botSources)
    .set({ statusId: BotSourceStatusEnum.Created })
    .where(eq(schema.botSources.id, bsId))
}

async function syncBotSource(bsId: string) {
  const bs = await db.query.botSources.findFirst({
    where: eq(schema.botSources.id, bsId),
  })
  if (!bs) {
    throw new Error('Bot source not found')
  }

  switch (bs.typeId) {
    case BotSourceTypeEnum.Link:
      return syncBotSourceURL(bs)
    case BotSourceTypeEnum.Sitemap:
      return syncBotSourceSitemap(bs)
    case BotSourceTypeEnum.SitemapExtractedData:
      return syncBotSourceURL(bs)
  }
}

async function syncBotSourceSitemap(
  bs: InferSelectModel<typeof schema.botSources>,
) {
  console.log('Syncing bot source sitemap... ', bs.id)
  if (!bs.url) {
    throw new Error('URL is required')
  }

  // Update bot source status to crawling
  await db
    .update(schema.botSources)
    .set({ statusId: BotSourceStatusEnum.Crawling })
    .where(eq(schema.botSources.id, bs.id))

  // get site map
  // Extract all unique urls from sitemap
  const urls = await getURLsFromSitemap(bs.url)
  console.log('Found urls: ', urls.length)
  // Each url, crawl data => create child bot source + extracted data
  const asyncCount = Number(env.ASYNC_EMBEDDING_COUNT) || 1
  await asyncLib.mapLimit(urls, asyncCount, async (url: string) => {
    const childBotSourceId = uuidv7()
    await db.insert(schema.botSources).values({
      id: childBotSourceId,
      parentId: bs.id,
      botId: bs.botId,
      typeId: BotSourceTypeEnum.SitemapExtractedData,
      url,
      statusId: BotSourceStatusEnum.Created,
      createdAt: new Date(),
      createdBy: bs.createdBy,
    })

    await syncBotSource(childBotSourceId)
    return childBotSourceId
  })
  console.log('All urls are crawled and embedded')

  // Update bot source status to completed
  await db
    .update(schema.botSources)
    .set({ statusId: BotSourceStatusEnum.Completed })
    .where(eq(schema.botSources.id, bs.id))
}

export async function getURLsFromSitemap(url: string) {
  const siteMapURLsQueue = [url]
  const pageURLs: string[] = []
  const usedURLs = new Set<string>()

  while (siteMapURLsQueue.length) {
    const url = siteMapURLsQueue.pop()
    if (!url) {
      continue
    }

    if (usedURLs.has(url)) {
      continue
    }
    usedURLs.add(url)

    const { urls, siteMapUrls } = await fetchSitemap(url)
    pageURLs.push(...urls)
    siteMapURLsQueue.push(...siteMapUrls)
  }

  return uniq(pageURLs)
}

interface ISitemapStructure {
  sitemapindex: {
    sitemap: {
      loc: string
      lastmod: string
    }[]
  }

  urlset: {
    url: {
      loc: string
      lastmod: string
      changefreq: string
      priority: string
    }[]
  }
}

async function fetchSitemap(url: string) {
  const urls = []
  const siteMapUrls = []

  // Fetch the sitemap
  const res = await fetch(url)
  const raw = await res.text()

  const parser = new XMLParser()
  const s = parser.parse(raw) as ISitemapStructure

  if (s?.sitemapindex?.sitemap) {
    for (const { loc } of s.sitemapindex.sitemap) {
      siteMapUrls.push(loc)
    }
  }

  if (s?.urlset?.url?.length > 0) {
    for (const { loc } of s.urlset.url) {
      urls.push(loc)
    }
  }

  return { urls, siteMapUrls }
}

async function syncBotSourceURL(
  bs: InferSelectModel<typeof schema.botSources>,
) {
  console.log('Syncing bot source URL... ', bs.id, ' - ', bs.url)
  const bsId = bs.id

  try {
    if (
      bs.statusId !== BotSourceStatusEnum.Created &&
      bs.statusId !== BotSourceStatusEnum.Failed
    ) {
      throw new Error('Invalid bot source status')
    }

    // Update status to crawling
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Crawling })
      .where(eq(schema.botSources.id, bsId))

    // Crawl the bot source
    const contents = await crawBotSourceUrl(bs.url)

    const bsDataId = uuidv7()
    await db.insert(schema.botSourceExtractedData).values({
      id: bsDataId,
      botSourceId: bsId,
      data: JSON.stringify(contents),
    })

    // Update status to embedding
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Embedding })
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
