/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import * as asyncLib from 'async'
import { and, eq, inArray, or, sql, type InferSelectModel } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { XMLParser } from 'fast-xml-parser'
import { uniq } from 'lodash'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import crawURL from '~/components/crawler'
import getEmbeddingsFromContents from '~/components/embedding'
import { env } from '~/env'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botSourceRouter = createTRPCRouter({
  create: createBotSourceHandler(),
  createBulk: createLinkBotSourceBulkHandler(),

  sync: syncBotSourceHandler(),

  getByBotId: getByBotIdHandler(),

  deleteById: deleteByIdHandler(),
  setVisibility: setVisibility(),

  getSiteMaps: getSiteMaps(),
  validateSitemapUrl: validateSitemapUrl(),
})

function deleteByIdHandler() {
  return protectedProcedure
    .input(
      z.object({
        botSourceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const childSources = await db
        .select({ id: schema.botSources.id })
        .from(schema.botSources)
        .where(eq(schema.botSources.parentId, input.botSourceId))
      const childSourceIDs = childSources.map((r) => r.id)

      // Delete extracted data vector
      await db.delete(schema.botSourceExtractedDataVector).where(
        inArray(
          schema.botSourceExtractedDataVector.botSourceExtractedDataId,
          db
            .select({
              id: schema.botSourceExtractedData.id,
            })
            .from(schema.botSourceExtractedData)
            .where(
              or(
                eq(
                  schema.botSourceExtractedData.botSourceId,
                  input.botSourceId,
                ),
                inArray(
                  schema.botSourceExtractedData.botSourceId,
                  childSourceIDs,
                ),
              ),
            ),
        ),
      )

      // Delete extracted data
      await db
        .delete(schema.botSourceExtractedData)
        .where(
          or(
            eq(schema.botSourceExtractedData.botSourceId, input.botSourceId),
            inArray(schema.botSourceExtractedData.botSourceId, childSourceIDs),
          ),
        )

      // Delete source
      await db
        .delete(schema.botSources)
        .where(inArray(schema.botSources.id, childSourceIDs))

      await db
        .delete(schema.botSources)
        .where(eq(schema.botSources.id, input.botSourceId))
    })
}

function setVisibility() {
  return protectedProcedure
    .input(
      z.object({
        botSourceId: z.string(),
        visible: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bs = await db
        .select({
          id: schema.botSources.id,
          visible: schema.botSources.visible,
        })
        .from(schema.botSources)
        .where(
          and(
            eq(schema.botSources.id, input.botSourceId),
            eq(schema.botSources.createdBy, ctx.session.user.id),
          ),
        )
      if (!bs.length) {
        throw new Error('Bot source not found')
      }

      await db
        .update(schema.botSources)
        .set({
          visible: input.visible,
          updatedAt: new Date(),
          updatedBy: ctx.session.user.id,
        })
        .where(eq(schema.botSources.id, input.botSourceId))
    })
}

function getByBotIdHandler() {
  return protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        typeIDs: z
          .array(z.nativeEnum(BotSourceTypeEnum))
          .default([
            BotSourceTypeEnum.Link,
            BotSourceTypeEnum.Sitemap,
            BotSourceTypeEnum.File,
            BotSourceTypeEnum.SitemapFile,
          ])
          .optional(),
        parentBotSourceID: z.string().uuid().optional(),
        limit: z.number().max(100).default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bot = await db
        .select({
          id: schema.bots.id,
        })
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

      if (input?.parentBotSourceID) {
        whereQms.push(eq(schema.botSources.parentId, input.parentBotSourceID))
      }

      const countRows = await db
        .select({
          count: sql<string>`COUNT(*)`,
        })
        .from(schema.botSources)
        .where(and(...whereQms))
      const count = Number(countRows[0]?.count) ?? 0

      const arr = await query.where(and(...whereQms))
      return {
        botSources: arr,
        pagination: { total: count, limit: input.limit, offset: input.offset },
      }
    })
}

function syncBotSourceHandler() {
  return protectedProcedure
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
    })
}

function createBotSourceHandler() {
  return protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        typeId: z.nativeEnum(BotSourceTypeEnum),
        url: z.string(),
        name: z.string().optional(),
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
    })
}

function createLinkBotSourceBulkHandler() {
  return protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        urls: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const botSources = await db
        .insert(schema.botSources)
        .values(
          input.urls.map((url) => ({
            id: uuidv7(),
            botId: input.botId,
            typeId: BotSourceTypeEnum.Link,
            url,
            createdBy: ctx.session.user.id,
            statusId: BotSourceStatusEnum.Created,
            createdAt: new Date(),
          })),
        )
        .returning()

      // Sync the bot sources
      const parallelCount = Number(env.ASYNC_BULK_IMPORT_THREAD_LIMIT)
      await asyncLib.mapLimit(
        botSources,
        parallelCount,
        async (bs: InferSelectModel<typeof schema.botSources>) => {
          await syncBotSource(bs.id)
          return bs.id
        },
      )

      return botSources
    })
}

async function cleanOldBotSourceData(bsId: string) {
  console.log('Cleaning old bot source data...')
  // Find child bot sources
  const rows = await db
    .select({
      id: schema.botSources.id,
    })
    .from(schema.botSources)
    .where(eq(schema.botSources.parentId, bsId))

  // F1 children
  const childSourceIDs = rows.map((r) => r.id)

  // Add F2 children to the list
  if (childSourceIDs.length > 0) {
    const f2ChildSourceRows = await db
      .select({
        id: schema.botSources.id,
      })
      .from(schema.botSources)
      .where(inArray(schema.botSources.parentId, childSourceIDs))
    const f2ChildSourceIDs = f2ChildSourceRows.map((r) => r.id)
    childSourceIDs.push(...f2ChildSourceIDs)
  }

  // Delete extracted data vector
  if (childSourceIDs.length > 0) {
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
  }

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
    case BotSourceTypeEnum.SitemapFileChild:
      return syncBotSourceSitemap(bs)
    case BotSourceTypeEnum.SitemapChildUrl:
      return syncBotSourceURL(bs)
    case BotSourceTypeEnum.SitemapFile:
      return syncBotSourceSitemapFile(bs)
  }
}

// Sitemap file contain list of URL of site
async function syncBotSourceSitemapFile(
  bs: InferSelectModel<typeof schema.botSources>,
) {
  if (!bs.url) {
    throw new Error('URL is required')
  }

  try {
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Crawling })
      .where(eq(schema.botSources.id, bs.id))

    const fileURL = bs.url
    // Fetch file content
    const res = await fetch(fileURL)
    const content = await res.text()
    const siteMapUrls = content.split('\n')

    // Create child bot sources
    const asyncCount = Number(env.ASYNC_EMBEDDING_COUNT) || 1
    await asyncLib.mapLimit(siteMapUrls, asyncCount, async (url: string) => {
      const childBotSourceId = uuidv7()
      await db.insert(schema.botSources).values({
        id: childBotSourceId,
        parentId: bs.id,
        botId: bs.botId,
        typeId: BotSourceTypeEnum.SitemapChildUrl,
        url,
        statusId: BotSourceStatusEnum.Created,
        createdAt: new Date(),
        createdBy: bs.createdBy,
      })

      await syncBotSource(childBotSourceId)
      return childBotSourceId
    })

    // Update to completed
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Completed })
      .where(eq(schema.botSources.id, bs.id))
  } catch (error) {
    console.error('Error while crawling bot source ', error)
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Failed })
      .where(eq(schema.botSources.id, bs.id))
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

  try {
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
        typeId: BotSourceTypeEnum.SitemapChildUrl,
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
  } catch (error) {
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Failed })
      .where(eq(schema.botSources.id, bs.id))
  }
}

function getSiteMaps() {
  return protectedProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // add https to url if not present
      if (!input.url.startsWith('http')) {
        input.url = `https://${input.url}`
      }

      // fetch robots.txt of the site
      let robotsTxt

      try {
        robotsTxt = await fetch(`${input.url}/robots.txt`)
      } catch (e) {
        return []
      }

      const robotsTxtText = await robotsTxt.text()

      // parse sitemap URLs from robots.txt
      const sitemapUrls = extractSiteMapURLs(robotsTxtText, input.url)
      return sitemapUrls
    })
}

function validateSitemapUrl() {
  return protectedProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await isValidSitemapUrl(input.url)
    })
}

export function extractSiteMapURLs(
  robotsTxt: string,
  websiteUrl: string,
): string[] {
  const sitemapUrls: string[] = []
  const lines = robotsTxt.split('\n')

  for (const line of lines) {
    const match = line.match(/Sitemap:\s*(.+)/i)
    if (match?.[1]) {
      let sitemapUrl = match[1].trim()
      // Ensure the sitemap URL is absolute
      if (!sitemapUrl.startsWith('http')) {
        sitemapUrl = new URL(sitemapUrl, websiteUrl).href
      }
      sitemapUrls.push(sitemapUrl)
    }
  }

  return sitemapUrls
}

export async function isValidSitemapUrl(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url)

    // Ensure the URL protocol is either http or https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false
    }

    // Ensure the URL ends with .xml (basic check for sitemap format)
    if (!parsedUrl.pathname.endsWith('.xml')) {
      return false
    }

    // validate xml content in link is valid format
    const xmlContent = await fetch(url)

    const xmlContentText = await xmlContent.text()
    const parser = new XMLParser()
    const s = parser.parse(xmlContentText) as ISitemapStructure
    if (!s?.urlset?.url?.length) {
      return false
    }

    return true
  } catch (error) {
    // If the URL constructor throws an error, the URL is not valid
    return false
  }
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
    console.log('Crawling bot source URL... ', bs.url)
    const contents = await crawBotSourceUrl(bs.url)

    const bsDataId = uuidv7()
    await db.insert(schema.botSourceExtractedData).values({
      id: bsDataId,
      botSourceId: bsId,
      data: JSON.stringify(contents),
    })

    // Update status to embedding
    console.log('Embedding bot source URL... ', bs.url)
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
