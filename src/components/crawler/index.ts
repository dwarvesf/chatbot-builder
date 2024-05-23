import FirecrawlApp from '@mendable/firecrawl-js'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { env } from '~/env'

const fireCrawlClient = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY })

export default async function crawURL(url: string): Promise<string[]> {
  const response = await fetch(url)
  if (response.status != 200) {
    throw new Error('Unable to fetch web, status:x ' + response.status)
  }

  const html = await response.text()
  const dom = new JSDOM(html)
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  const results: string[] = []
  if (article?.title) {
    results.push(article.title)
  }
  if (article?.content) {
    results.push(article.textContent)
  }
  return results
}

export async function crawlURLV2(url: string): Promise<{
  content: string
  metadata: object
  markdown: string
}> {
  const params = {
    pageOptions: {
      onlyMainContent: true,
      includeHtml: true,
    },
  }

  const scrapeResult = await fireCrawlClient.scrapeUrl(url, params)

  const dom = new JSDOM(scrapeResult.data.html)
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  return {
    content: article?.textContent ?? '',
    metadata: scrapeResult.data.metadata,
    markdown: scrapeResult.data.markdown,
  }
}
