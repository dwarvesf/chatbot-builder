import { Worker, isMainThread, setEnvironmentData, getEnvironmentData } from 'node:worker_threads'
import { string } from 'zod'

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
    for (const url of retrieveURLs()) {
        const body = await fetchAndProcessWeb(url)

        // TODO: filter body, relevant tags

        // TODO: embedding and save web data to vectorDB
        saveWebData(body)
    }
}

function retrieveURLs() {
    console.log(getEnvironmentData("DB_URL"))

    // TODO: from DB, load user web urls not crawled
    // return ["https://memo.d.foundation/"]
    // return ["https://www.iban.com/exchange-rates"]
    return ["https://www.iban.com/exchange-rates", "https://memo.d.foundation/"]
}

/**
 * @param { string[] } webData // TODO: change this
 */
function saveWebData(webData) {
    console.log(getEnvironmentData("VECTOR_DB_URL"))
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