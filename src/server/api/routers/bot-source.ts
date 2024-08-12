/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import * as asyncLib from 'async'
import { and, eq, inArray, sql, type InferSelectModel } from 'drizzle-orm'
import { XMLParser } from 'fast-xml-parser'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { env } from '~/env'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { SearchTypeEnum } from '~/model/search-type'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import { submitSyncBotSource } from '~/server/gateway/cronjob/sync-bot-source'

export const botSourceRouter = createTRPCRouter({
  create: createBotSourceHandler(),
  createBulk: createLinkBotSourceBulkHandler(),

  sync: syncBotSourceHandler(),

  getByBotId: getByBotIdHandler(),

  getRetrievalModelByBotSourceId: getRetrievalModelByBotIdHandler(),
  setRetrievalModelBotSource: setRetrievalModelBotSource(),

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
      await db.transaction(async (trx) => {
        console.log('Deleting bot source... ', input.botSourceId)
        await cleanBotSourceData(input.botSourceId, trx)
        console.log('Bot source data cleaned... ', input.botSourceId)
        await trx
          .delete(schema.botSources)
          .where(eq(schema.botSources.id, input.botSourceId))
      })
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

function setRetrievalModelBotSource() {
  return protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        retrievalModel: z.object({
          searchMethod: z.nativeEnum(SearchTypeEnum),
          topK: z.number(),
          similarityThreshold: z.number(),
          alpha: z.number(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const retrival_model = await db
        .select({
          botId: schema.botSources.botId,
          retrievalModel: schema.botSources.retrievalModel,
        })
        .from(schema.botSources)
        .where(
          and(
            eq(schema.botSources.botId, input.botId),
            eq(schema.botSources.createdBy, ctx.session.user.id),
          ),
        )

      if (!retrival_model.length) {
        throw new Error('BotId not found')
      }

      await db
        .update(schema.botSources)
        .set({
          retrievalModel: sql`${input.retrievalModel}::jsonb`,
          updatedAt: new Date(),
          updatedBy: ctx.session.user.id,
        })
        .where(eq(schema.botSources.botId, input.botId))
    })
}

function getRetrievalModelByBotIdHandler() {
  return protectedProcedure
    .input(
      z.object({
        botId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bs = await db.query.botSources.findFirst({
        columns: {
          retrievalModel: true,
        },
        where: eq(schema.botSources.botId, input.botId),
      })

      return bs?.retrievalModel
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
          ]),
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

      await cleanBotSourceData(bsId)
      // await syncBotSource(bsId)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      submitSyncBotSource(bsId)

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
          statusId: BotSourceStatusEnum.Pending,
          createdAt: new Date(),
        })
        .returning()

      // Sync the bot source
      if (botSources.length) {
        for (const bs of botSources) {
          // await syncBotSource(bs.id)

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          submitSyncBotSource(bs.id)
        }
      }

      console.log('Bot sources created: ', botSources.length)

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
            statusId: BotSourceStatusEnum.Pending,
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
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          submitSyncBotSource(bs.id)
          return bs.id
        },
      )

      return botSources
    })
}

async function cleanBotSourceData(bsId: string, repo = db) {
  console.log('Cleaning old source data...')
  // Find child bot sources
  const rows = await repo
    .select({
      id: schema.botSources.id,
    })
    .from(schema.botSources)
    .where(eq(schema.botSources.parentId, bsId))

  // F1 children
  const childSourceIDs = rows.map((r) => r.id)

  // Add F2 children to the list
  if (childSourceIDs.length > 0) {
    const f2ChildSourceRows = await repo
      .select({
        id: schema.botSources.id,
      })
      .from(schema.botSources)
      .where(inArray(schema.botSources.parentId, childSourceIDs))
    const f2ChildSourceIDs = f2ChildSourceRows.map((r) => r.id)
    childSourceIDs.push(...f2ChildSourceIDs)
  }

  // Delete extracted data vector
  const extractedDataIDs = await repo
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

  if (extractedDataIDs.length > 0) {
    await repo.delete(schema.botSourceExtractedDataVector).where(
      inArray(
        schema.botSourceExtractedDataVector.botSourceExtractedDataId,
        extractedDataIDs.map((r) => r.id),
      ),
    )
  }

  // Delete extracted data
  await repo
    .delete(schema.botSourceExtractedData)
    .where(
      inArray(schema.botSourceExtractedData.botSourceId, [
        ...childSourceIDs,
        bsId,
      ]),
    )

  if (childSourceIDs.length > 0) {
    // Delete child bot sources
    await repo
      .delete(schema.botSources)
      .where(inArray(schema.botSources.id, childSourceIDs))
  }

  // Reset status
  await repo
    .update(schema.botSources)
    .set({ statusId: BotSourceStatusEnum.Pending })
    .where(eq(schema.botSources.id, bsId))
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

function extractSiteMapURLs(robotsTxt: string, websiteUrl: string): string[] {
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

async function isValidSitemapUrl(url: string): Promise<boolean> {
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
