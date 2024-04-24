import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../migration/schema";

import { env } from '~/env';

import { getEmbeddingsFromContents } from "~/server/components/Embedding";
import { crawURL } from "~/server/components/WebCrawler";
import { db } from "~/server/db/";

export async function crawlBotSource() {
    const contents: string[] = []
    for (const { id, url } of await retrieveURLs(db)) {
        if (url == undefined) {
            continue
        }

        let botSourceStatus = 2 // "CRAWLED"

        try {
            contents.push(...await crawURL(url))

            for (const { content, embedding } of await getEmbeddingsFromContents(env.OPENAI_API_KEY, contents)) {
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
    // TODO: uncomment
    // await client.query("INSERT INTO source_vectors (content, embedding) VALUES ($1, $2)", [content, "[" + embeddedContents.toString() + "]"])
}

/**
 * updates bot source status after crawled attempt
 */
async function updateBotSourceStatus(client: PostgresJsDatabase<typeof schema>, id: string, status: number) {
    await client.update(schema.botSources).set({
        statusId: status
    }).where(eq(schema.botSources.id, id))
}
