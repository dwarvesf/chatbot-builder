import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { SearchTypeEnum } from '~/model/search-type'

export async function Search(
  type: SearchTypeEnum,
  top_k: number,
  distance: number,
  botId: string,
  msg: string,
) {
  switch (type) {
    case SearchTypeEnum.Vector:
      return await SearchVector(botId, top_k, distance, msg)
    case SearchTypeEnum.FullText:
      return await SearchFullText(botId, top_k, msg)
    default:
      return
  }
}

async function SearchVector(
  botId: string,
  top_k: number,
  distance: number,
  msg: string,
) {
  const msgVectors = await getEmbeddingsFromContents([msg])
  if (!msgVectors?.length) {
    throw new Error('Failed to get embeddings')
  }

  const msgEmbeddings = msgVectors[0]?.embeddings
  if (!msgEmbeddings) {
    throw new Error('Failed to get embeddings')
  }

  const contexts = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      referLinks: schema.botSources.url,
      referName: schema.botSources.name,
      sourceType: schema.botSources.typeId,
      distance: sql`vector <=> ${'[' + msgEmbeddings.join(', ') + ']'} as distance`,
    })
    .from(schema.botSourceExtractedDataVector)
    .innerJoin(
      schema.botSourceExtractedData,
      eq(
        schema.botSourceExtractedData.id,
        schema.botSourceExtractedDataVector.botSourceExtractedDataId,
      ),
    )
    .innerJoin(
      schema.botSources,
      eq(schema.botSources.id, schema.botSourceExtractedData.botSourceId),
    )
    .where(
      and(
        eq(schema.botSources.botId, botId),
        eq(schema.botSources.visible, true),
        sql`vector <=> ${'[' + msgEmbeddings.join(', ') + ']'} < ${distance}`,
      ),
    )
    .orderBy(sql`distance ASC`)
    .limit(top_k)

  return contexts
}

async function SearchFullText(botId: string, top_k: number, msg: string) {
  const contexts = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      referLinks: schema.botSources.url,
      referName: schema.botSources.name,
      sourceType: schema.botSources.typeId,
    })
    .from(schema.botSourceExtractedDataVector)
    .innerJoin(
      schema.botSourceExtractedData,
      eq(
        schema.botSourceExtractedData.id,
        schema.botSourceExtractedDataVector.botSourceExtractedDataId,
      ),
    )
    .innerJoin(
      schema.botSources,
      eq(schema.botSources.id, schema.botSourceExtractedData.botSourceId),
    )
    .where(
      and(
        eq(schema.botSources.botId, botId),
        eq(schema.botSources.visible, true),
        sql`to_tsvector('english', ${schema.botSourceExtractedDataVector.content}) @@ websearch_to_tsquery('english', ${msg})`,
      ),
    )
    .limit(top_k)

  return contexts
}
