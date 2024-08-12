import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { SearchTypeEnum } from '~/model/search-type'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'
import getEmbeddingsFromContents from '~/server/gateway/openai/embedding'

export interface RankedResult {
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
  alpha: number,
): Promise<RankedResult[]> {
  switch (type) {
    case SearchTypeEnum.Vector:
      return await vectorSearch(botId, topK, similarityThreshold, msg)
    case SearchTypeEnum.FullText:
      return await fullTextSearch(botId, topK, msg)
    case SearchTypeEnum.Hybrid:
      return await hybridSearch(botId, topK, similarityThreshold, msg, alpha)
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
      similarity: sql<number>`1 - (${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'`)})`,
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
      asc(
        sql<number>`${schema.botSourceExtractedDataVector.vector} <=> ${sql.raw(`'[${msgEmbeddings.join(',')}]'`)}`,
      ),
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

function calculateRRFScore(
  vectorRank: number | undefined,
  fullTextRank: number | undefined,
  alpha: number,
  k = 60,
) {
  if (vectorRank === undefined && fullTextRank === undefined) {
    throw new Error('Both ranks cannot be undefined')
  }

  const vectorScore = vectorRank ? 1 / (k + vectorRank) : 0
  const fullTextScore = fullTextRank ? 1 / (k + fullTextRank) : 0

  return (1 - alpha) * vectorScore + alpha * fullTextScore
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
  alpha: number,
) {
  const vectorResults = await vectorSearch(
    botId,
    topK * 2,
    similarityThreshold,
    msg,
  )

  const fullTextResults = await fullTextSearch(botId, topK * 2, msg)

  const combinedResults = combineSearchResults(vectorResults, fullTextResults)

  /**
   * RRF (Reciprocal Rank Fusion) scoring is used to combine results from multiple
   * search methods (in this case, vector search and full-text search).
   *
   * The formula for each rank is: 1 / (k + rank)
   * where k is a constant (default 60) that mitigates the impact of high rankings.
   *
   * The final score is a weighted sum of the vector and full-text scores:
   * RRF_score = (vectorWeight * vectorScore) + (fullTextWeight * fullTextScore)
   */

  /**
   * Example:
   * Let's say we have a result with:
   * - vectorRank = 2
   * - fullTextRank = 5
   * - vectorRankWeight = 0.3
   * - textRankWeight = 0.7
   * - k = 60 (default)
   *
   * Calculation:
   * vectorScore = 1 / (60 + 2) = 0.0161
   * fullTextScore = 1 / (60 + 5) = 0.0154
   *
   * RRF_score = (0.3 * 0.0161) + (0.7 * 0.0154)
   *           = 0.00483 + 0.01078
   *           = 0.01561
   *
   * This result would have an RRF score of approximately 0.01561.
   */
  combinedResults.forEach((result) => {
    result.rrfScore = calculateRRFScore(
      result.vectorRank,
      result.textRank,
      alpha,
    )
  })

  // Sort by RRF score (desc) and return topK results
  return combinedResults.sort((a, b) => b.rrfScore - a.rrfScore).slice(0, topK)
}
