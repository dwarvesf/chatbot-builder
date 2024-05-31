/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import * as asyncLib from 'async'
import { eq, type InferSelectModel } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { XMLParser } from 'fast-xml-parser'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { uniq } from 'lodash'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { env } from '~/env'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import scrapeURL from '~/server/gateway/firecrawl'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { chunkMarkdown } from '~/server/lib/chunking/markdown'

export const maxDuration = Number(env.MAX_CRON_DURATION) // This function can run for a maximum of 300 seconds
export const dynamic = 'force-dynamic' // static by default, unless reading the request

export async function POST(req: Request) {
  console.log('maxDuration ', maxDuration)

  const cronJobSecret = req.headers.get('x-cron-secret')
  if (!cronJobSecret || cronJobSecret !== env.CRON_JOB_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Validate the request body: { botSourceId: string } using zod
  const zSchema = z.object({
    botSourceId: z.string(),
  })
  const reqBody = await req.json()

  console.log('reqBody', reqBody)

  let bsId = ''
  try {
    const { botSourceId } = zSchema.parse(reqBody)
    bsId = botSourceId
  } catch (error) {
    console.error('Invalid reqBody', error)
    return new Response('Invalid reqBody', { status: 400 })
  }

  // Sync bot source
  try {
    await syncBotSource(bsId)
  } catch (error) {
    console.error('Failed to sync bot source', error)
    return new Response('Failed to sync bot source', { status: 500 })
  }

  return new Response(`Sync bot source from ${process.env.VERCEL_REGION} xxx`)
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
    case BotSourceTypeEnum.SitemapChildUrl:
      return syncBotSourceURL(bs)
    case BotSourceTypeEnum.SitemapFile:
      return syncBotSourceSitemapFile(bs)
    case BotSourceTypeEnum.File:
      return syncBotSourceFile(bs)
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
    const siteMapUrls = content.split('\n').filter((url) => url.trim() !== '')

    // Create child bot sources
    const asyncCount = Number(env.ASYNC_EMBEDDING_COUNT) || 1
    console.log(
      'siteMapUrls: ',
      siteMapUrls.length,
      ' asyncCount: ',
      asyncCount,
    )
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
    // Each url, crawl data => create child bot source + extracted data
    const asyncCount = Number(env.ASYNC_EMBEDDING_COUNT) || 1
    console.log('Found urls: ', urls.length, ' asyncCount: ', asyncCount)
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

      try {
        await syncBotSource(childBotSourceId)
      } catch (error) {
        console.error('Error while crawling child bot source ', error)
      }

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

async function getURLsFromSitemap(url: string) {
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

  const res = await scrapeURL(url)
  const chunks = await chunkMarkdown(res.data.markdown)
  return chunks
}

async function saveEmbeddings(
  client: PostgresJsDatabase<typeof schema>,
  bsDataId: string,
  content: string,
  embeddings: number[],
) {
  if (!content) {
    return
  }

  await client.insert(schema.botSourceExtractedDataVector).values({
    id: uuidv7(),
    botSourceExtractedDataId: bsDataId,
    content,
    vector: embeddings,
  })
}

async function syncBotSourceFile(
  bs: InferSelectModel<typeof schema.botSources>,
) {
  if (bs.statusId !== BotSourceStatusEnum.Created) {
    throw new Error('Invalid bot source status')
  }

  if (!bs.url) {
    throw new Error('URL is required')
  }

  const bsId = bs.id

  try {
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Crawling })
      .where(eq(schema.botSources.id, bs.id))

    const fileURL = bs.url

    // Fetch file content
    const res = await fetch(fileURL)
    const sourcesText = await res.blob()

    const loader = await formatFileLoader(sourcesText)

    if (!loader) {
      return
    }

    const docs = await loader.load()
    const splitter = new RecursiveCharacterTextSplitter({
      separators: [
        '\n\n',
        '\n',
        ' ',
        '.',
        ',',
        '\u200b', // Zero-width space
        '\uff0c', // Fullwidth comma
        '\u3001', // Ideographic comma
        '\uff0e', // Fullwidth full stop
        '\u3002', // Ideographic full stop
        '',
      ],
    })

    const contents = await splitter.splitDocuments(docs)
    const formatContents = contents.map((doc) => doc.pageContent)

    const bsDataId = uuidv7()
    await db.insert(schema.botSourceExtractedData).values({
      id: bsDataId,
      botSourceId: bsId,
      data: JSON.stringify(formatContents),
    })

    // Update status to embedding
    console.log('Embedding bot source URL... ', bs.url)
    await db
      .update(schema.botSources)
      .set({ statusId: BotSourceStatusEnum.Embedding })
      .where(eq(schema.botSources.id, bsId))

    // Embed the bot source
    for (const { content, embeddings } of await getEmbeddingsFromContents(
      formatContents,
    )) {
      // Store data to DB
      await saveEmbeddings(db, bsDataId, content, embeddings)
    }

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

async function formatFileLoader(file: Blob) {
  switch (file.type) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return new DocxLoader(file)
    case 'application/pdf':
      return new PDFLoader(file)
    case 'text/plain':
      return new TextLoader(file)
    default:
      return false
  }
}
