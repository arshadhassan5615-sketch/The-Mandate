// Which papers cover a story, and how each one tells it. Content-agnostic: the
// outlets and their verdicts live in data/news/outlets.ts.
//
// - Major stories (crisis, war, constitution, security) run in every paper.
// - Minor stories run only in papers whose interests include the category.
// - A paper with its own authored text for the story prints it; otherwise it
//   reprints its usual wire copy with its own kicker and closing verdict, so
//   the same event reads differently in each paper.
// - When press freedom collapses, opposition papers are shut and print nothing.
import type { NewsArticle, NewsTemplate, NewsCategory, Publication } from '../types/news'
import { OUTLETS, MAJOR_CATEGORIES, type OutletId, type OutletProfile } from '../data/news/outlets'

/** Below this press freedom the opposition press is closed. */
export const PRESS_CLOSURE_THRESHOLD = 20
/** Below this media control the Herald stops toeing the palace line. */
const HERALD_INDEPENDENT_BELOW = 20

export interface CoverageContext {
  week: number
  date: string
  pressFreedom: number
  mediaControl: number
}

const OWN_TEXT: Record<OutletId, keyof NewsTemplate> = {
  ashenmere_herald: 'herald',
  peoples_standard: 'standard',
  kravenstal_worker: 'worker',
  veltrian_times: 'times',
  thornfeld_gazette: 'gazette',
}

export function isMajor(template: Pick<NewsTemplate, 'category' | 'importance'>): boolean {
  if (template.importance) return template.importance === 'major'
  return MAJOR_CATEGORIES.includes(template.category)
}

export function coversStory(outlet: OutletProfile, category: NewsCategory, major: boolean, pressFreedom: number): boolean {
  if (outlet.isOpposition && pressFreedom < PRESS_CLOSURE_THRESHOLD) return false
  if (major) return true
  return outlet.interests === 'all' || outlet.interests.includes(category)
}

type Copy = { headline: string; body: string }

function copyFor(outlet: OutletProfile, template: NewsTemplate, mediaControl: number): Copy {
  if (outlet.id === 'ashenmere_herald') {
    return mediaControl < HERALD_INDEPENDENT_BELOW ? template.standard : template.herald
  }
  const own = template[OWN_TEXT[outlet.id]] as Copy | undefined
  if (own) return own
  const wire = outlet.wireFrom === 'herald' ? template.herald : template.standard
  const verdict = outlet.verdict[template.category] ?? outlet.defaultVerdict
  return {
    headline: `${outlet.kicker}${wire.headline}`,
    body: verdict ? `${wire.body}\n\nOUR VIEW — ${verdict}` : wire.body,
  }
}

export function buildCoverage(template: NewsTemplate, ctx: CoverageContext): NewsArticle[] {
  const major = isMajor(template)
  return (Object.values(OUTLETS) as OutletProfile[])
    .filter(outlet => coversStory(outlet, template.category, major, ctx.pressFreedom))
    .map((outlet, i) => {
      const copy = copyFor(outlet, template, ctx.mediaControl)
      return {
        id: `news_${template.trigger}_${outlet.id}_${ctx.week}_${i}_${Math.random().toString(36).slice(2, 8)}`,
        headline: copy.headline,
        body: copy.body,
        publication: outlet.id as Publication,
        weekNumber: ctx.week,
        date: ctx.date,
        templateId: template.trigger,
        category: template.category,
      }
    })
}
