import { env } from '~/env';
import mockEmbedding from './mock-embedding.json' assert { type: "json" };

/**
 * calls to openAI's embedding for the vector representation of the contents
 */
export default async function getEmbeddingsFromContents(contents: string[]) {
    const openAICred = env.OPENAI_API_KEY

    let data: {
        object: string;
        index: number;
        embedding: number[];
    }[] = []

    if (env.MOCK_EMBEDDING) {
        data = mockEmbedding.data
    } else {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            body: JSON.stringify({
                input: contents,
                model: "text-embedding-3-small",
                dimensions: 1024,
            }),
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + openAICred
            }
        })

        data = (await response.json()).data
    }

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
