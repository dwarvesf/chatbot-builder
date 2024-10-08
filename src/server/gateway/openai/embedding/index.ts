import { env } from '~/env'
import mockEmbedding from './mock-embedding.json' assert { type: 'json' }

/**
 * calls to openAI's embedding for the vector representation of the contents
 */
export default async function getEmbeddingsFromContents(contents: string[]) {
  const openAICred = env.OPENAI_API_KEY

  type EmbeddingData = {
    object: string
    index: number
    embedding: number[]
  }
  let data: EmbeddingData[] = []

  if (env.MOCK_EMBEDDING) {
    data = mockEmbedding.data
  } else {
    // console.log('Fetching embeddings from OpenAI')
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        input: contents,
        model: 'text-embedding-3-small',
        dimensions: 1024,
      }),
      headers: {
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + openAICred,
      },
    })

    type JSONResponse = {
      data?: EmbeddingData[]
    }
    const resBody = (await response.json()) as JSONResponse
    data = resBody?.data ?? []
  }
  // console.log('getEmbeddingsFromContents data:', data)

  const results: {
    content: string
    embeddings: number[]
  }[] = []

  for (const item of data) {
    const { object, embedding } = item
    const index: number = item.index

    if (object === 'embedding') {
      results.push({
        content: contents[index] ?? '',
        embeddings: embedding,
      })
    }
  }
  return results
}
