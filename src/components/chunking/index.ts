import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
export default async function recursiveChunkingData(
  data: string,
): Promise<string[]> {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 512,
    chunkOverlap: 64,
  })

  const docOutput = await splitter.createDocuments([data])

  return docOutput.map((doc) => doc.pageContent)
}
