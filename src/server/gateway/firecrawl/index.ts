import { env } from '~/env'

interface IFireCrawlRequestOpts {
  pageOptions: {
    onlyMainContent: boolean
    includeHtml: boolean
  }
  timeout: number
}

interface IFireCrawlResponse {
  success: boolean
  data: {
    content: string
    markdown: string
    metadata: {
      title: string
      description: string
      ogTitle: string
      ogDescription: string
      ogUrl: string
      ogImage: string
      ogLocaleAlternate: string
      ogSiteName: string
      sourceURL: string
    }
  }
  returnCode: number
}

export default async function scrapeURL(
  url: string,
  opts: IFireCrawlRequestOpts = {
    // Default options
    pageOptions: {
      onlyMainContent: false,
      includeHtml: false,
    },
    timeout: 20000, // Timeout 20 seconds
  },
) {
  const res = await fetch(`${env.FIRECRAWL_API_URL}/v0/scrape`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      authorization: `Basic ${env.FIRECRAWL_SECRET_TOKEN}`,
    },
    body: JSON.stringify({
      url: url,
      ...opts,
    }),
  })
  if (res.status != 200) {
    throw new Error('Unable to fetch web, status: ' + res.status)
  }

  const resBody = (await res.json()) as IFireCrawlResponse
  return resBody
}
