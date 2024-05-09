import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

export default async function crawURL(url: string): Promise<string[]> {
  const response = await fetch(url)
  if (response.status != 200) {
    throw new Error('Unable to fetch web, status: ' + response.status)
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
