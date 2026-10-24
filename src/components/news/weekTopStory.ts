import type { NewsArticle, NewsCategory } from '../../types/news'

const CATEGORY_WEIGHT: Record<NewsCategory, number> = {
  crisis: 5,
  war: 5,
  security: 4,
  economy: 3,
  governance: 3,
  constitutional: 3,
  diplomacy: 2,
  faction: 2,
  media: 2,
  budget: 2,
  bni: 1,
  personal: 1,
}

/** The top story of a week: highest category weight, then the first in list order. Null if none. */
export function topStoryOfWeek(articles: readonly NewsArticle[], week: number): NewsArticle | null {
  let top: NewsArticle | null = null
  for (const article of articles) {
    if (article.weekNumber !== week) continue
    if (top === null || CATEGORY_WEIGHT[article.category] > CATEGORY_WEIGHT[top.category]) {
      top = article
    }
  }
  return top
}
