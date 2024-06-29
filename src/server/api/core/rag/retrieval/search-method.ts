import { and, desc, eq, or, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'
import { SearchTypeEnum } from '~/model/search-type'

export async function Search(
  type: SearchTypeEnum,
  top_k: number,
  similarity_threshold: number,
  botId: string,
  msg: string,
) {
  switch (type) {
    case SearchTypeEnum.Vector:
      return await VectorSearch(botId, top_k, similarity_threshold, msg)
    case SearchTypeEnum.FullText:
      return await FullTextSearch(botId, top_k, msg)
    case SearchTypeEnum.Hybrid:
      return await HybridSearch(botId, top_k, similarity_threshold, msg)
    default:
      return
  }
}

async function VectorSearch(
  botId: string,
  top_k: number,
  similarity_threshold: number,
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
      similarity: sql<number>`1 - (${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})`,
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
      ),
    )
    .orderBy(
      sql<number>`${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)} ASC`,
    )
    .limit(top_k)

  return contexts.filter(
    (context) => context.similarity >= similarity_threshold,
  )
}

async function FullTextSearch(botId: string, top_k: number, msg: string) {
  const contexts = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      referLinks: schema.botSources.url,
      referName: schema.botSources.name,
      sourceType: schema.botSources.typeId,
      textRank: sql<number>`ts_rank(to_tsvector('english', ${schema.botSourceExtractedDataVector.content}), websearch_to_tsquery('english', ${msg}))`,
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
    .orderBy(
      desc(
        sql`ts_rank(to_tsvector('english', ${schema.botSourceExtractedDataVector.content}), websearch_to_tsquery('english', ${msg}))`,
      ),
    )
    .limit(top_k)

  return contexts
}

async function HybridSearch(
  botId: string,
  top_k: number,
  similarity_threshold: number,
  msg: string,
) {
  const msgVectors = await getEmbeddingsFromContents([msg])
  if (!msgVectors?.length || !msgVectors[0]?.embeddings) {
    throw new Error('Failed to get embeddings')
  }
  const msgEmbeddings = msgVectors[0].embeddings

  const contexts = await db
    .select({
      content: schema.botSourceExtractedDataVector.content,
      referLinks: schema.botSources.url,
      referName: schema.botSources.name,
      sourceType: schema.botSources.typeId,
      vectorSimilarity: sql<number>`1 - (${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})`,
      textRank: sql<number>`ts_rank(to_tsvector('english', ${schema.botSourceExtractedDataVector.content}), websearch_to_tsquery('english', ${msg}))`,
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
        or(
          sql`${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)} < ${1 - similarity_threshold}`,
          sql`to_tsvector('english', ${schema.botSourceExtractedDataVector.content}) @@ websearch_to_tsquery('english', ${msg})`,
        ),
      ),
    )
    .orderBy(
      desc(sql`
        CASE
          WHEN ${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)} < ${1 - similarity_threshold}
            AND to_tsvector('english', ${schema.botSourceExtractedDataVector.content} ) @@ websearch_to_tsquery('english', ${msg})
          THEN (1 - (${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})) * 0.5 + 
               ts_rank(to_tsvector('english', ${schema.botSourceExtractedDataVector.content}), websearch_to_tsquery('english', ${msg})) * 0.5
          WHEN ${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)} < ${1 - similarity_threshold}
          THEN 1 - (${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'::vector`)})
          ELSE ts_rank(to_tsvector('english', ${schema.botSourceExtractedDataVector.content}), websearch_to_tsquery('english', ${msg}))
        END
      `),
    )
    .limit(top_k)

  // The ORDER BY clause now uses a CASE statement to implement adaptive ranking
  // If a result matches both vector similarity and text search, it combines both scores.
  // If it only matches vector similarity, it uses the vector similarity score.
  // If it only matches text search, it uses the text rank score.

  // Reciprocal Rank Fusion (RRF) is an algorithm that evaluates the search scores from multiple, previously ranked results to produce a unified result set.
  // In Azure AI Search, RRF is used whenever there are two or more queries that execute in parallel.
  // Each query produces a ranked result set, and RRF is used to merge and homogenize the rankings into a single result set, returned in the query response.

  // To understanding concept ranking by pgvector library support following here:
  // https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
  // https://github.com/pgvector/pgvector-python/blob/master/examples/hybrid_search_rrf.py
  // https://docs.pgvecto.rs/use-case/hybrid-search.html

  return contexts
}
