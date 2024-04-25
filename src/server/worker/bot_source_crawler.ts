import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import embeddingContents from "~/components/embedding";
import webCrawler from "~/components/webcrawler";
import * as schema from "~/migration/schema";
import { db } from "~/server/db/";

export default async function crawlBotSources() {
    const contents: string[] = []
    for (const { id, url } of await retrieveURLs(db)) {
        if (url == undefined) {
            continue
        }

        let botSourceStatus = 2 // "CRAWLED"

        try {
            contents.push(...await webCrawler(url))

            for (const { content, embedding } of await embeddingContents(contents)) {
                await saveWebData(db, content, embedding)
            }
        } catch (err) {
            // TODO: use logger for error log
            botSourceStatus = 3 // "CRAWLED_FAILED"
        }

        await updateBotSourceStatus(db, id, botSourceStatus)
    }

    return contents
}

/**
 * retrieves `NOT_CRAWLED` bot source's id url from DB
 */
async function retrieveURLs(client: PostgresJsDatabase<typeof schema>) {
    const result = await client.select({
        id: schema.botSources.id,
        url: schema.botSources.url
    }).from(schema.botSources).where(eq(schema.botSources.statusId, 1)) // TODO: change status id to `NOT_CRAWLED`'s id

    return result
}

/**
 * saves the contents and the vector representation into vectorDB
 */
async function saveWebData(client: PostgresJsDatabase<typeof schema>, content: string, embeddedContents: number[]) {
    const sourceVectorId = randomUUID()

    try {
        await client.insert(schema.sourceVectors).values({
            id: sourceVectorId,
            embeddings: embeddedContents,
        })

        await client.insert(schema.dataSources).values({
            id: randomUUID(),
            content: content,
            vectors: sourceVectorId,
        })
    } catch (err) {
        console.log(err)
    }
}

/**
 * updates bot source status after crawled attempt
 */
async function updateBotSourceStatus(client: PostgresJsDatabase<typeof schema>, id: string, status: number) {
    await client.update(schema.botSources).set({
        statusId: status
    }).where(eq(schema.botSources.id, id))
}
