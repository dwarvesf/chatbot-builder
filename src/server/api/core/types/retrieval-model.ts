import { SearchTypeEnum } from '~/model/search-type'

export type RetrievalModel = {
  search_method: SearchTypeEnum
  top_k: number
  similarity_threshold: number
}
