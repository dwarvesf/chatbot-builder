import { Readability } from "@mozilla/readability";
import { load, type CheerioAPI } from "cheerio";
import { Element, Text } from "domhandler";
import { JSDOM } from "jsdom";

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
  return results;
}

/**
 * cleans text format tags so when `fishContent`, the text content of the whole paragraph is in the same element(exp: <p>My <b>paragraph</b></p> is output as {'My', 'paragraph'} without text format cleaning)
 */
function cleanTextFormat(string: string) {
  for (const format of [
    "b",
    "strong",
    "i",
    "em",
    "mark",
    "small",
    "del",
    "ins",
    "sub",
    "sup",
  ]) {
    string = string.replaceAll(
      new RegExp("<" + format + ">|</" + format + ">", "g"),
      " ",
    );
  }
  return string.replaceAll(new RegExp("<br>|<br/>|&nbsp;", "g"), " ");
}

/**
 * recursively goes through children of the element.
 * each text content of children is a separate set of content.
 * if element is list tag: ul, tr, group text content of children to a single set.
 * filter empty text content text(when go through render/display tags: img, div, etc...).
 */
function fishContent(el: Element) {
  if (el.children.length == 0) {
    return [getTextContent(load(el), el.tagName, el.attribs).trim()];
  }

  let contents: string[] = [];
  for (const child of el.children) {
    if (child instanceof Element) {
      contents = contents.concat(fishContent(child));
    } else if (child instanceof Text) {
      contents.push(child.nodeValue);
    }
  }

  if (el.tagName.match(/(ul)|(tr)/g)) {
    return [
      contents
        .filter((s) => s.trim() != "")
        .map((s) => s.trim())
        .join(", "),
    ];
  }

  return contents.filter((s) => s.trim() != "").map((s) => s.trim());
}

// returns text content of common text tags
function getTextContent(
  element: CheerioAPI,
  tag: string,
  attributes: Record<string, string>,
) {
  switch (true) {
    case tag === "a":
      // <a> tag also includes href in case the bot want to provide the reference link to the user
      return element.text() + "[" + attributes.href + "]";
    case /(h\d)|(span)|p/.test(tag):
      return element.text();

    default:
      return "";
  }
}