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
    for (const url of retrieveURLs()) {
        const { status, headers, promiseBody } = await fetchWeb(url)

        if (status != 200) {
            console.log("failed to fetch url %s", url)
        } else {
            const body = await promiseBody
            console.log(headers, body)
            // TODO: filter body, relevant tags

            // TODO: embedding and save web data to vectorDB
            saveWebData(body)
        }
    }
}

function retrieveURLs() {
    console.log(getEnvironmentData("DB_URL"))

    // TODO: from DB, load user web urls not crawled
    return ["https://www.iban.com/exchange-rates"]
}

/**
 * @param { string } webData // TODO: change this
 */
function saveWebData(webData) {
    console.log(getEnvironmentData("VECTOR_DB_URL"))
}

/**
 * @param { string } url
 */
async function fetchWeb(url) {
    const response = await fetch(url)
    return {
        status: response.status,
        headers: response.headers,
        promiseBody: response.text(),
    }
}
