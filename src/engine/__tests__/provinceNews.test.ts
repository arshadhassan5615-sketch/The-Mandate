import { describe, expect, it } from 'vitest'
import type { NewsArticle } from '../../types/news'
import { provinceFeed, provincesForArticle, unseenItems, type ProvinceNewsItem } from '../provinceNews'

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: 'article-1',
    headline: 'Quiet day in the capital',
    body: 'Nothing of note happened.',
    publication: 'veltrian_times',
    weekNumber: 1,
    date: '1963-01-07',
    templateId: 'template-1',
    category: 'economy',
    ...overrides,
  }
}

describe('provincesForArticle', () => {
  it('matches a province named in the headline', () => {
    const article = makeArticle({ headline: 'Mine collapse in Kravenstal', body: '' })

    expect(provincesForArticle(article)).toEqual(['kravenstal'])
  })

  it('matches a province named in the body', () => {
    const article = makeArticle({ headline: 'Rail delays', body: 'Trains stopped near Thornfeld.' })

    expect(provincesForArticle(article)).toEqual(['thornfeld'])
  })

  it('matches case-insensitively', () => {
    const article = makeArticle({ headline: 'UNREST GROWS IN KRAVENSTAL', body: '' })

    expect(provincesForArticle(article)).toEqual(['kravenstal'])
  })

  it('matches a possessive form', () => {
    const article = makeArticle({ headline: "Kravenstal's mines reopen", body: '' })

    expect(provincesForArticle(article)).toEqual(['kravenstal'])
  })

  it('does not match a province name inside another word', () => {
    const article = makeArticle({ headline: 'Kravenstalwerk expands', body: 'The Kravenstalwerk plant grows.' })

    expect(provincesForArticle(article)).toEqual([])
  })

  it('matches the Amber Coast alias to aldenmoor', () => {
    const article = makeArticle({ headline: 'Fishing fleet returns to the Amber Coast', body: '' })

    expect(provincesForArticle(article)).toEqual(['aldenmoor'])
  })

  it('matches the Dravenni alias to dravenhollow', () => {
    const article = makeArticle({ headline: 'Dravenni farmers protest', body: '' })

    expect(provincesForArticle(article)).toEqual(['dravenhollow'])
  })

  it('orders provinces by first mention and removes duplicates', () => {
    const article = makeArticle({
      headline: 'Sevagrad talks with Ashenmere',
      body: 'Kravenstal and Sevagrad again, while Ashenmere waits',
    })

    expect(provincesForArticle(article)).toEqual(['sevagrad', 'ashenmere', 'kravenstal'])
  })

  it('returns an empty array when no province is named', () => {
    const article = makeArticle({ headline: 'Parliament adjourns', body: 'Debate continues tomorrow.' })

    expect(provincesForArticle(article)).toEqual([])
  })
})

describe('provinceFeed', () => {
  it('keeps only articles within the two-week window ending at the current week', () => {
    const articles = [1, 2, 3, 4, 5].map(week =>
      makeArticle({ id: `week-${week}`, headline: 'Kravenstal report', weekNumber: week, templateId: `t-${week}` }),
    )

    const feed = provinceFeed(articles, 'kravenstal', 4)

    expect(feed.map(item => item.article.weekNumber).sort()).toEqual([3, 4])
  })

  it('keeps one article per templateId and week, newest first', () => {
    const articles = [
      makeArticle({ id: 'mine-w4-a', headline: 'Kravenstal mine', weekNumber: 4, templateId: 'mine' }),
      makeArticle({ id: 'mine-w4-b', headline: 'Kravenstal mine, another paper', weekNumber: 4, templateId: 'mine' }),
      makeArticle({ id: 'mine-w3', headline: 'Kravenstal mine', weekNumber: 3, templateId: 'mine' }),
      makeArticle({ id: 'strike-w4', headline: 'Kravenstal strike', weekNumber: 4, templateId: 'strike' }),
    ]

    const feed = provinceFeed(articles, 'kravenstal', 4)

    expect(feed.map(item => item.article.id)).toEqual(['mine-w4-a', 'strike-w4', 'mine-w3'])
  })

  it('flags crisis, war and security articles as alerts and economy articles as not', () => {
    const articles = [
      makeArticle({ id: 'crisis', headline: 'Kravenstal crisis', category: 'crisis', templateId: 'a' }),
      makeArticle({ id: 'war', headline: 'Kravenstal war', category: 'war', templateId: 'b' }),
      makeArticle({ id: 'security', headline: 'Kravenstal security', category: 'security', templateId: 'c' }),
      makeArticle({ id: 'economy', headline: 'Kravenstal economy', category: 'economy', templateId: 'd' }),
    ]

    const feed = provinceFeed(articles, 'kravenstal', 1)
    const alertById = Object.fromEntries(feed.map(item => [item.article.id, item.isAlert]))

    expect(alertById).toEqual({ crisis: true, war: true, security: true, economy: false })
  })

  it('does not mutate its input array or items', () => {
    const articles = Object.freeze([
      Object.freeze(makeArticle({ id: 'first', headline: 'Kravenstal mine', weekNumber: 3, templateId: 'x' })),
      Object.freeze(makeArticle({ id: 'second', headline: 'Kravenstal strike', weekNumber: 4, templateId: 'y' })),
    ])
    const idsBefore = articles.map(article => article.id)

    const feed = provinceFeed(articles, 'kravenstal', 4)

    expect(feed.map(item => item.article.id)).toEqual(['second', 'first'])
    expect(articles.map(article => article.id)).toEqual(idsBefore)
  })
})

describe('unseenItems', () => {
  it('filters out items whose article ids are already seen', () => {
    const feed: ProvinceNewsItem[] = [
      { article: makeArticle({ id: 'a' }), isAlert: false },
      { article: makeArticle({ id: 'b' }), isAlert: true },
      { article: makeArticle({ id: 'c' }), isAlert: false },
    ]

    const unseen = unseenItems(feed, ['b', 'z'])

    expect(unseen.map(item => item.article.id)).toEqual(['a', 'c'])
  })
})
