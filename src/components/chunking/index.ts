import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
export default async function recursiveChunkingData(
  data: string,
): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 128,
    chunkOverlap: 16,
  })

  const docOutput = await splitter.splitDocuments([
    new Document({ pageContent: data }),
  ])
  return docOutput.map((doc) => doc.pageContent)
}
