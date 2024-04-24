
import { CheerioAPI, load } from 'cheerio';
import { Element, Text } from "domhandler";

export async function crawURL(url: string) : Promise<string[]>{ 
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

    let contents:string[] = []
    body.each((_, el) => {
        contents = contents.concat(fishContent(el))
    })

    return contents
}

/**
 * cleans text format tags so when `fishContent`, the text content of the whole paragraph is in the same element(exp: <p>My <b>paragraph</b></p> is output as {'My', 'paragraph'} without text format cleaning)
 */
function cleanTextFormat(string:string) {

    for (const format of ["b", "strong", "i", "em", "mark", "small", "del", "ins", "sub", "sup"]) {
        string = string.replaceAll(new RegExp("<" + format + ">|<\/" + format + ">", 'g'), " ")
    }
    return string.replaceAll(new RegExp("<br>|<br/>|&nbsp;", 'g'), " ")
}

/**
 * recursively goes through children of the element.
 * each text content of children is a separate set of content.
 * if element is list tag: ul, tr, group text content of children to a single set.
 * filter empty text content text(when go through render/display tags: img, div, etc...).
 */
function fishContent(el:Element) {
    if (el.children.length == 0) {
        return [getTextContent(load(el), el.tagName, el.attribs).trim()]
    }

    let contents:string[] = []
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

// returns text content of common text tags
function getTextContent(element: CheerioAPI, tag:string, attributes:{ [x: string]: string; }) {
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
