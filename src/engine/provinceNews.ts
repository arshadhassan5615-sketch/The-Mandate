import type { NewsArticle, NewsCategory } from '../types/news'

export type HomeProvinceId = 'ashenmere' | 'kravenstal' | 'thornfeld' | 'sevagrad' | 'aldenmoor' | 'dravenhollow'
export const HOME_PROVINCES: readonly HomeProvinceId[] = ['ashenmere', 'kravenstal', 'thornfeld', 'sevagrad', 'aldenmoor', 'dravenhollow']

/** Words that place an article in a province (whole-word, case-insensitive). */
export const PROVINCE_ALIASES: Record<HomeProvinceId, readonly string[]> = {
  ashenmere: ['Ashenmere'],
  kravenstal: ['Kravenstal'],
  thornfeld: ['Thornfeld'],
  sevagrad: ['Sevagrad'],
  aldenmoor: ['Aldenmoor', 'Amber Coast'],
  dravenhollow: ['Dravenhollow', 'Dravenni'],
}

/** How many weeks back (including the current one) a province's feed reaches. */
export const PROVINCE_NEWS_WINDOW_WEEKS = 2

/** Categories shown with an alert (!) pin instead of a news pin. */
export const ALERT_CATEGORIES: readonly NewsCategory[] = ['crisis', 'war', 'security']

export interface ProvinceNewsItem { article: NewsArticle; isAlert: boolean }

interface AliasPattern { provinceId: HomeProvinceId; regex: RegExp }

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const ALIAS_PATTERNS: readonly AliasPattern[] = HOME_PROVINCES.flatMap(provinceId =>
  PROVINCE_ALIASES[provinceId].map(alias => ({
    provinceId,
    regex: new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i'),
  })),
)

/** Returns the provinces named in an article, ordered by their first mention. */
export function provincesForArticle(article: Pick<NewsArticle, 'headline' | 'body'>): HomeProvinceId[] {
  const text = `${article.headline} ${article.body}`
  const firstIndex = new Map<HomeProvinceId, number>()
  for (const { provinceId, regex } of ALIAS_PATTERNS) {
    const match = regex.exec(text)
    if (!match) continue
    const known = firstIndex.get(provinceId)
    if (known === undefined || match.index < known) firstIndex.set(provinceId, match.index)
  }
  return [...firstIndex.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([provinceId]) => provinceId)
}

function isInWindow(weekNumber: number, currentWeek: number): boolean {
  return currentWeek - PROVINCE_NEWS_WINDOW_WEEKS < weekNumber && weekNumber <= currentWeek
}

/** Keeps the first article per event (templateId + week), so papers printing the same story collapse to one entry. */
function firstPerEvent(articles: readonly NewsArticle[]): NewsArticle[] {
  const seenEvents = new Set<string>()
  return articles.filter(article => {
    const eventKey = `${article.templateId}|${article.weekNumber}`
    if (seenEvents.has(eventKey)) return false
    seenEvents.add(eventKey)
    return true
  })
}

/** Builds the newest-first news feed for one province within the current window. */
export function provinceFeed(
  articles: readonly NewsArticle[],
  provinceId: HomeProvinceId,
  currentWeek: number,
): ProvinceNewsItem[] {
  const matching = articles.filter(article =>
    isInWindow(article.weekNumber, currentWeek) && provincesForArticle(article).includes(provinceId),
  )
  return firstPerEvent(matching)
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .map(article => ({ article, isAlert: ALERT_CATEGORIES.includes(article.category) }))
}

/** Returns the feed items whose article has not been seen yet. */
export function unseenItems(feed: readonly ProvinceNewsItem[], seenIds: readonly string[]): ProvinceNewsItem[] {
  const seen = new Set(seenIds)
  return feed.filter(item => !seen.has(item.article.id))
}
