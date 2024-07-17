import { and, desc, eq, sql } from 'drizzle-orm'
import { SearchTypeEnum } from '~/model/search-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'

interface RankedResult {
  content: string | null
  referLinks: string | null
  referName: string | null
  sourceType: number
  vectorRank?: number
  textRank?: number
  rrfScore: number
}

export async function retrievalSearch(
  type: SearchTypeEnum,
  topK: number,
  similarityThreshold: number,
  botId: string,
  msg: string,
): Promise<RankedResult[]> {
  switch (type) {
    case SearchTypeEnum.Vector:
      return await vectorSearch(botId, topK, similarityThreshold, msg)
    case SearchTypeEnum.FullText:
      return await fullTextSearch(botId, topK, msg)
    case SearchTypeEnum.Hybrid:
      return await hybridSearch(botId, topK, similarityThreshold, msg)
    default:
      return []
  }
}

async function vectorSearch(
  botId: string,
  topK: number,
  similarityThreshold: number,
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
    .limit(topK)

  return contexts
    .filter((context) => context.similarity >= similarityThreshold)
    .map((context, index) => ({
      content: context.content,
      referLinks: context.referLinks,
      referName: context.referName,
      sourceType: context.sourceType,
      vectorRank: index + 1,
      rrfScore: 0,
    }))
}

async function fullTextSearch(botId: string, topK: number, msg: string) {
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
    .limit(topK)

  return contexts.map((context, index) => ({
    content: context.content,
    referLinks: context.referLinks,
    referName: context.referName,
    sourceType: context.sourceType,
    textRank: index + 1,
    rrfScore: 0,
  }))
}

function calculateRRFScore(ranks: number[], k = 60) {
  return ranks.reduce((sum, rank) => sum + 1 / (k + rank), 0)
}

function combineSearchResults(
  vectorResults: RankedResult[],
  fullTextResults: RankedResult[],
): RankedResult[] {
  const combinedResults: RankedResult[] = []

  function updateResult(result: RankedResult, rank: number, isVector: boolean) {
    const existingResult = combinedResults.find(
      (r) => r.content === result.content,
    )

    if (existingResult) {
      if (isVector) {
        existingResult.vectorRank = rank
      } else {
        existingResult.textRank = rank
      }
    } else {
      combinedResults.push({
        ...result,
        vectorRank: isVector ? rank : undefined,
        textRank: isVector ? undefined : rank,
        rrfScore: 0,
      })
    }
  }

  vectorResults.forEach((result, index) =>
    updateResult(result, index + 1, true),
  )
  fullTextResults.forEach((result, index) =>
    updateResult(result, index + 1, false),
  )

  return combinedResults
}

async function hybridSearch(
  botId: string,
  topK: number,
  similarityThreshold: number,
  msg: string,
) {
  // Get vector search results
  const vectorResults = await vectorSearch(
    botId,
    topK * 2,
    similarityThreshold,
    msg,
  )

  // Get full-text search results
  const fullTextResults = await fullTextSearch(botId, topK * 2, msg)

  // Combine results
  const combinedResults = combineSearchResults(vectorResults, fullTextResults)

  // Calculate RRF scores
  // formula: RRF = 1 / (k + rank) for each rank
  // Assume we have 2 search results: vector search and full-text search
  // For each result d, we have 2 ranks: rank d in vector search and rank d in full-text
  // If d found in both searches, then RFF score d = 1 / (k + rank d in vector search) + 1 / (k + rank d in full-text search)
  // If d found in vector search but not in full-text search, then RFF score d = 1 / (k + rank d in vector search) + 1 / (k + (len(full-text search) + 1))

  combinedResults.forEach((result) => {
    const ranks = [
      result.vectorRank ?? vectorResults.length + 1,
      result.textRank ?? fullTextResults.length + 1,
    ]

    result.rrfScore = calculateRRFScore(ranks)
  })

  // Sort by RRF score (desc) and return topK results
  return combinedResults.sort((a, b) => b.rrfScore - a.rrfScore).slice(0, topK)
}
