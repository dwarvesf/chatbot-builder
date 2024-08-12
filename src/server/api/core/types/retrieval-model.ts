import { SearchTypeEnum } from '~/model/search-type'

export type RetrievalModel = {
  searchMethod: SearchTypeEnum
  topK: number
  similarityThreshold: number
  alpha: number
}
