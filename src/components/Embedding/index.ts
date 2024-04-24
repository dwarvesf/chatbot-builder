import { env } from '~/env';
import mockEmbedding from './mock-embedding.json' assert { type: "json" };

/**
 * calls to openAI's embedding for the vector representation of the contents
 */
export default async function getEmbeddingsFromContents(contents: string[]) {
    const openAICred = env.OPENAI_API_KEY
    // TODO: uncomment for live test
    // const response = await fetch("https://api.openai.com/v1/embeddings", {
    //     method: "POST",
    //     body: JSON.stringify({
    //         input: contents,
    //         model: "text-embedding-3-small",
    //         dimensions: 1024,
    //     }),
    //     headers: {
    //         "Content-type": "application/json",
    //         "Authorization": "Bearer " + openAICred
    //     }
    // })

    // const { data } = await response.json()

    // TODO: Mock only remove when go live
    const { data } = mockEmbedding

    const result: {
        content: string,
        embedding: number[],
    }[] = []

    for (const item of data) {
        const { object, embedding } = item
        const index: number = item.index

        if (object === "embedding") {
            result.push({
                content: contents[index] ?? "",
                embedding: embedding
            })
        }
    }
    return result;
}
