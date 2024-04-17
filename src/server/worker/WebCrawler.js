import { Worker, isMainThread, setEnvironmentData, getEnvironmentData } from 'node:worker_threads'

if (isMainThread) {
    if (process.env.DB_URL === undefined) {
        console.error("No DB_URL config")
    } else if (process.env.VECTOR_DB_URL === undefined) {
        console.error("No VECTOR_DB_URL config")
    } else {
        setEnvironmentData("DB_URL", process.env.DB_URL?.toString())
        setEnvironmentData("VECTOR_DB_URL", process.env.VECTOR_DB_URL?.toString())
        new Worker("./src/server/worker/WebCrawler.js")
    }
} else {
    var dbClient = new pg.Client(getEnvironmentData("DB_URL").toString());
    var vectorDBClient = new pg.Client(getEnvironmentData("VECTOR_DB_URL").toString());

    dbClient.connect()
    vectorDBClient.connect()

    for (const url of await retrieveURLs(dbClient)) {
        const contents = await fetchAndProcessWeb(url)

        // TODO: embedding contents
        const embeddedContents = ['[11, 12, 13]']

        await saveWebData(vectorDBClient, embeddedContents)
    }

    dbClient.end()
    vectorDBClient.end()
}

import pg from "pg"

/**
 * @param {pg.Client} client
 */
async function retrieveURLs(client) {
    const query = await client.query("SELECT url FROM urls")

    // TODO: from DB, load user web urls not crawled

    return ["https://www.iban.com/exchange-rates", "https://memo.d.foundation/"]
}

/**
 * @param {pg.Client} client
 * @param {string[]} embeddedContents
 */
async function saveWebData(client, embeddedContents) {
    await client.query("INSERT INTO items (embedding) VALUES ($1)", embeddedContents)
}

import { load } from 'cheerio';

/**
 * @param { string } url
 */
async function fetchAndProcessWeb(url) {
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

    /**
     * @type {string[]}
    */
    let contents = []
    body.each((_, el) => {
        contents = contents.concat(fishContent(el))
    })

    return contents
}

/**
 * @param {string} string
 */
function cleanTextFormat(string) {
    for (const format of ["b", "strong", "i", "em", "mark", "small", "del", "ins", "sub", "sup"]) {
        string = string.replaceAll(new RegExp("<" + format + ">|<\/" + format + ">", 'g'), " ")
    }
    return string.replaceAll(new RegExp("<br>|<br/>|&nbsp;", 'g'), " ")
}

import { Element, Text } from "domhandler"

/**
 * @param { Element } el
 * @returns {string[]}
 */
function fishContent(el) {
    if (el.children.length == 0) {
        return [getTextContent(load(el), el.tagName, el.attribs).trim()]
    }

    /**
     * @type {string[]}
     */
    let contents = []
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

/**
 * @param {{ text: () => string; }} element
 * @param {string} tag
 * @param {{ [x: string]: string; }} attributes
 * 
 * @returns {string}
 */
function getTextContent(element, tag, attributes) {
    switch (tag) {
        case "a":
            return element.text() + "[" + attributes["href"] + "]"
        case "span":
        case "p":
            return element.text()

        default:
            return "";
    }
}