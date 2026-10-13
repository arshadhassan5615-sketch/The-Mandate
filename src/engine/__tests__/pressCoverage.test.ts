import { describe, it, expect } from 'vitest'
import { buildCoverage, isMajor, PRESS_CLOSURE_THRESHOLD } from '../pressCoverage'
import { NEWS_TEMPLATES } from '../../data/news/newsTemplates'
import { TAB_ORDER } from '../../data/newspapers'
import type { NewsTemplate } from '../../types/news'

const ctx = { week: 4, date: 'January 22, 1963', pressFreedom: 60, mediaControl: 40 }
const story = (over: Partial<NewsTemplate>): NewsTemplate => ({
  trigger: 't',
  category: 'economy',
  herald: { headline: 'Herald says', body: 'Herald body.' },
  standard: { headline: 'Standard says', body: 'Standard body.' },
  ...over,
})
const papers = (t: NewsTemplate, c = ctx) => buildCoverage(t, c).map(a => a.publication).sort()

describe('press coverage', () => {
  it('runs a major story in all five papers', () => {
    expect(papers(story({ category: 'crisis' }))).toEqual([...TAB_ORDER].sort())
  })

  it('runs a minor story only where the paper cares', () => {
    // Personal stories: Herald (paper of record), Standard and Times only
    expect(papers(story({ category: 'personal' }))).toEqual(['ashenmere_herald', 'peoples_standard', 'veltrian_times'])
  })

  it('lets a template override the default importance', () => {
    expect(isMajor({ category: 'personal', importance: 'major' })).toBe(true)
    expect(papers(story({ category: 'personal', importance: 'major' }))).toHaveLength(5)
  })

  it('gives each paper its own slant on the same story', () => {
    const arts = buildCoverage(story({ category: 'crisis' }), ctx)
    const worker = arts.find(a => a.publication === 'kravenstal_worker')!
    const gazette = arts.find(a => a.publication === 'thornfeld_gazette')!
    expect(worker.headline).toBe('WORKER VIEW: Standard says')
    expect(gazette.headline).toBe('FROM THE CAPITAL: Herald says')
    expect(worker.body).not.toBe(gazette.body)
  })

  it('prints a paper’s own authored text when the story has it', () => {
    const arts = buildCoverage(story({ category: 'crisis', worker: { headline: 'Own words', body: 'b' } }), ctx)
    expect(arts.find(a => a.publication === 'kravenstal_worker')!.headline).toBe('Own words')
  })

  it('shuts the opposition press when press freedom collapses', () => {
    const closed = papers(story({ category: 'crisis' }), { ...ctx, pressFreedom: PRESS_CLOSURE_THRESHOLD - 1 })
    expect(closed).not.toContain('kravenstal_worker')
    expect(closed).not.toContain('veltrian_times')
    expect(closed).toContain('ashenmere_herald')
  })

  it('only ever files under papers that have a tab', () => {
    for (const t of NEWS_TEMPLATES) {
      for (const a of buildCoverage(t, ctx)) expect(TAB_ORDER).toContain(a.publication)
    }
  })
})
