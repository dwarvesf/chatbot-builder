import { Worker, getEnvironmentData, isMainThread, setEnvironmentData } from 'node:worker_threads';
import mockEmbedding from './mock-embedding.json' assert { type: "json" };

if (isMainThread) {
    if (process.env.DATABASE_URL === undefined) {
        console.error("No DATABASE_URL config")
    } else if (process.env.OPENAI_API_KEY === undefined) {
        console.error("No OPENAI_API_KEY config")
    } else {
        setEnvironmentData("DATABASE_URL", process.env.DATABASE_URL?.toString())
        setEnvironmentData("OPENAI_API_KEY", process.env.OPENAI_API_KEY?.toString())
        new Worker("./src/server/worker/WebCrawler.ts")
    }
} else {
    var dbClient = new pg.Client(getEnvironmentData("DATABASE_URL").toString());
    var openAICred = getEnvironmentData("OPENAI_API_KEY").toString()

    await dbClient.connect()

    for (const { id, url } of await retrieveURLs(dbClient)) {
        let botSourceStatus = 2 // "CRAWLED"

        try {
            const contents = await fetchAndProcessWeb(url)
            for (const content of contents) {
                // TODO: uncomment for live test
                // const embeddingPromises = getEmbeddingsFromContent(openAICred, content)
                // for (const ep of embeddingPromises) {
                //     const response = await ep
                //     const { data } = await response.json()
                //     await saveWebData(dbClient, content, data.embedding)
                // }

                // TODO: Mock only remove when go live
                const { data } = mockEmbedding
                for (const i of data) {
                    await saveWebData(dbClient, content, i.embedding)
                }
            }
        } catch (err) {
            console.log(err)
            botSourceStatus = 3 // "CRAWLED_FAILED"
        }

        updateBotSourceStatus(dbClient, id, botSourceStatus)
    }

    await dbClient.end()
}

import pg from "pg";

/**
 * updates bot source status after crawled attempt
 * @param {pg.Client} client
 * @param {string} id
 * @param {number} status
 */
async function updateBotSourceStatus(client: pg.Client, id: string, status: number) {
    await client.query("UPDATE bot_sources SET status_id = $2 WHERE id = $1", [id, status])
}

/**
 * retrieves `NOT_CRAWLED` bot source's id url from DB
 * @param {pg.Client} client
 */
async function retrieveURLs(client: pg.Client) {
    const query = await client.query("SELECT id, url FROM bot_sources WHERE status_id = $1", [1]) // TODO: change status id to `NOT_CRAWLED`'s id

    const result = []
    for (const r of query.rows) {
        result.push({
            id: r.id,
            url: r.url
        })
    }

    return result
}

/**
 * calls to openAI's embedding for the vector representation of the contents
 * @param {string} openAICred
 * @param {string[]} contents
 */
function getEmbeddingsFromContent(openAICred: string, contents: string) {
    const embeddings = []

    for (const c of contents) {
        embeddings.push(fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            body: JSON.stringify({
                input: c,
                model: "text-embedding-3-small",
                dimensions: 1024,
            }),
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + openAICred
            }
        }));
    }
    return embeddings
}

/**
 * saves the contents and the vector representation into vectorDB
 * @param {pg.Client} client
 * @param {string} content
 * @param {number[]} embeddedContents
 */
async function saveWebData(client: pg.Client, content: string, embeddedContents: number[]) {
    await client.query("INSERT INTO source_vectors (content, embedding) VALUES ($1, $2)", [content, "[" + embeddedContents.toString() + "]"])
}

import { CheerioAPI, load } from 'cheerio';

/**
 * fetches html data from the provide url and process html data into relevant contents
 * @param { string } url
 */
async function fetchAndProcessWeb(url: string) {
    const response = await fetch(url)
    if (response.status != 200) {
        throw new Error("Unable to fetch web, status: " + response.status);
    }

    let document = await response.text()

    // clean script tags
    document = document.replaceAll(/<script([ a-z](=\".{0,}\")?)*?>(\s*.*\s*)*?<\/script>/g, "")
    document = cleanTextFormat(document)

    // clean white spaces
    while (document.match(/\s\s/g)) {
        document = document.replaceAll(/\s\s/g, " ")
    }

    // clean tabs, new lines
    document = document.replaceAll(/\t|\n/g, " ").replaceAll(/\n\n/g, " ")

    const body = load(document)("body");

    let contents: string[] = []
    body.each((_, el) => {
        contents = contents.concat(fishContent(el))
    })

    return contents
}

/**
 * cleans text format tags so when `fishContent`, the text content of the whole paragraph is in the same element(exp: <p>My <b>paragraph</b></p> is output as {'My', 'paragraph'} without text format cleaning)
 * @param {string} string
 */
function cleanTextFormat(string: string) {

    for (const format of ["b", "strong", "i", "em", "mark", "small", "del", "ins", "sub", "sup"]) {
        string = string.replaceAll(new RegExp("<" + format + ">|<\/" + format + ">", 'g'), " ")
    }
    return string.replaceAll(new RegExp("<br>|<br/>|&nbsp;", 'g'), " ")
}

import { Element, Text } from "domhandler";

/**
 * recursively goes through children of the element.
 * each text content of children is a separate set of content.
 * if element is list tag: ul, tr, group text content of children to a single set.
 * filter empty text content text(when go through render/display tags: img, div, etc...).
 * @param { Element } el
 * @returns {string[]}
 */
function fishContent(el: Element) {
    if (el.children.length == 0) {
        return [getTextContent(load(el), el.tagName, el.attribs).trim()]
    }

    let contents: string[] = []
    for (const child of el.children) {
        if (child instanceof Element) {
            contents = contents.concat(fishContent(child))
        } else if (child instanceof Text) {
            contents.push(child.nodeValue)
        }
    }

    if (el.tagName.match(/(ul)|(tr)/g)) {
        return [contents.filter(s => s.trim() != "").map(s => s.trim()).join(", ")]
    }


    return contents.filter(s => s.trim() != "").map(s => s.trim())
}

function getTextContent(element: CheerioAPI, tag: string, attributes: { [x: string]: string }) {
    switch (tag) {
        case "a":
            // <a> tag also includes href in case the bot want to provide the reference link to the user
            return element.text() + "[" + attributes["href"] + "]"
        case "span":
        case "p":
            return element.text()

        default:
            return "";
    }
}
