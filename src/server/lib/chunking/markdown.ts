import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function chunkMarkdown(data: string): Promise<string[]> {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 512,
    chunkOverlap: 64,
  })

  const docOutput = await splitter.createDocuments([data])
  const res = docOutput.map((doc) => doc.pageContent)
  return res
}
