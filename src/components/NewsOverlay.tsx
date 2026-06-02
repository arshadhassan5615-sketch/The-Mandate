import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNewsStore } from '../stores/newsStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { NEWSPAPERS, TAB_ORDER } from '../data/newspapers'
import type { NewspaperDef } from '../data/newspapers'
import type { NewsArticle } from '../types/news'
import { renderWithEntities } from './news/EntityLinker'
import {
  HeraldMasthead,
  StandardMasthead,
  WorkerMasthead,
  TimesMasthead,
  GazetteMasthead,
} from './news/NewsMastheads'

function groupByWeek(articles: NewsArticle[]): Map<number, NewsArticle[]> {
  const map = new Map<number, NewsArticle[]>()
  for (const a of articles) {
    const existing = map.get(a.weekNumber) ?? []
    existing.push(a)
    map.set(a.weekNumber, existing)
  }
  return map
}

const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`

interface TabProps {
  paper: NewspaperDef
  active: boolean
  unread: number
  onClick: () => void
}

function Tab({ paper, active, unread, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.55rem 0.8rem',
        border: 'none',
        borderBottom: active ? `3px solid ${paper.accentColor}` : '3px solid transparent',
        background: active ? 'rgba(0,0,0,0.03)' : 'transparent',
        cursor: 'pointer',
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        color: active ? paper.accentColor : '#8a8070',
        textTransform: 'uppercase',
        transition: 'all 0.15s',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {paper.shortName}
      {unread > 0 && (
        <span style={{
          background: 'var(--accent-red)',
          color: '#f5f0e8',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.52rem',
          fontWeight: 700,
        }}>
          {unread}
        </span>
      )}
    </button>
  )
}

function renderMasthead(
  paper: NewspaperDef,
  week: number,
  flags: string[],
) {
  const mediaDeal = flags.includes('media_deal')
  const nadiaActive = flags.includes('nadia_activated')

  switch (paper.id) {
    case 'ashenmere_herald':
      return <HeraldMasthead paper={paper} week={week} mediaDeal={mediaDeal} />
    case 'peoples_standard':
      return <StandardMasthead paper={paper} week={week} />
    case 'kravenstal_worker':
      return <WorkerMasthead paper={paper} week={week} />
    case 'veltrian_times':
      return <TimesMasthead paper={paper} week={week} nadiaActive={nadiaActive} />
    case 'thornfeld_gazette':
      return <GazetteMasthead paper={paper} week={week} />
    default:
      return <HeraldMasthead paper={paper} week={week} mediaDeal={mediaDeal} />
  }
}

function ArticleBlock({ article, paper }: { article: NewsArticle; paper: NewspaperDef }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <h2 style={{
        fontFamily: paper.fontFamily,
        fontSize: article.category === 'crisis' || article.category === 'war' ? '0.95rem' : '0.78rem',
        fontWeight: article.category === 'crisis' || article.category === 'war' ? 800 : 700,
        lineHeight: 1.2,
        margin: '0 0 2px',
        letterSpacing: article.category === 'crisis' || article.category === 'war' ? '0.02em' : '0.01em',
        color: paper.textColor,
        textTransform: article.category === 'crisis' || article.category === 'war' ? 'uppercase' : 'none',
      }}>
        {article.headline}
      </h2>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.4rem',
        color: '#8a7a60',
        letterSpacing: '0.06em',
        margin: '0 0 4px',
        textTransform: 'uppercase',
      }}>
        By {paper.reporterName} · {article.date}
      </p>
      <p style={{
        fontFamily: paper.bodyFontFamily,
        fontSize: '0.64rem',
        lineHeight: 1.55,
        color: paper.textColor,
        margin: 0,
      }}>
        {renderWithEntities(article.body)}
      </p>
    </div>
  )
}

export default function NewsOverlay() {
  const { articles, isOpen, setOpen, lastReadIndex, markArticleRead } = useNewsStore()
  const { activeFlags } = useNarrativeStore()

  const [activeTab, setActiveTab] = useState<NewspaperDef['id']>('ashenmere_herald')
  const [pageIndex, setPageIndex] = useState(0)

  const weekMap = useMemo(() => {
    const map = groupByWeek(articles)
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [articles])

  const totalPages = weekMap.length
  const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1))
  const currentPage = weekMap[safePageIndex]
  const currentWeek = currentPage?.[0] ?? 0
  const allWeekArticles = currentPage?.[1] ?? []

  const tabArticles = allWeekArticles.filter(a => {
    if (activeTab === 'ashenmere_herald') return a.publication === 'ashenmere_herald'
    if (activeTab === 'peoples_standard') return a.publication === 'peoples_standard'
    if (activeTab === 'veltrian_times') return a.publication === 'veltrian_times'
    if (activeTab === 'kravenstal_worker') return a.publication === 'kravenstal_worker'
    if (activeTab === 'thornfeld_gazette') return a.publication === 'thornfeld_gazette'
    return false
  })

  // Mark articles as read when tab changes
  useEffect(() => {
    for (const a of tabArticles) {
      markArticleRead(a)
    }
  }, [activeTab, pageIndex, tabArticles, markArticleRead])

  const tabUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of articles) {
      const idx = articles.indexOf(a)
      if (idx > lastReadIndex) {
        counts[a.publication] = (counts[a.publication] ?? 0) + 1
      }
    }
    return counts
  }, [articles, lastReadIndex])

  const activePaper = NEWSPAPERS[activeTab]
  const mid = Math.ceil(tabArticles.length / 2)
  const leftColumn = tabArticles.slice(0, mid)
  const rightColumn = tabArticles.slice(mid)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, rotateX: -5 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.95, opacity: 0, rotateX: -5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(1100px, 95vw)', height: 'min(800px, 90vh)',
              background: activePaper.paperColor,
              backgroundImage: PAPER_TEXTURE,
              color: activePaper.textColor,
              display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.15), 2px 4px 16px rgba(0,0,0,0.3)',
              borderRadius: '2px',
            }}
          >
            {/* Tab strip */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #d0c8b8',
              background: 'rgba(0,0,0,0.02)',
              flexShrink: 0,
            }}>
              {TAB_ORDER.map(id => (
                <Tab
                  key={id}
                  paper={NEWSPAPERS[id]}
                  active={activeTab === id}
                  unread={tabUnreadCounts[id] ?? 0}
                  onClick={() => { setActiveTab(id); setPageIndex(0) }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '10px', right: '16px', zIndex: 10,
                background: 'transparent', border: 'none', color: activePaper.textColor,
                fontSize: '1.4rem', cursor: 'pointer', opacity: 0.4,
                fontFamily: 'serif', lineHeight: 1, padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.4' }}
            >✕</button>

            {/* Masthead */}
            {renderMasthead(activePaper, currentWeek, activeFlags)}

            {/* Body */}
            {totalPages === 0 || tabArticles.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.8rem', color: '#8a8060', letterSpacing: '0.1em' }}>
                  {totalPages === 0 ? 'NO NEWS THIS WEEK' : `No articles in ${activePaper.shortName} for Week ${currentWeek}`}
                </p>
                <p style={{ fontFamily: activePaper.fontFamily, fontStyle: 'italic', fontSize: '0.85rem', color: '#a09070' }}>
                  {totalPages === 0 ? 'Your decisions have not yet made the papers. The press is watching.' : 'Try another newspaper for coverage of this week.'}
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1, display: 'flex', padding: '16px 20px 16px 28px', gap: '24px', overflowY: 'auto' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {leftColumn.map(article => (
                      <div key={article.id}>
                        <ArticleBlock article={article} paper={activePaper} />
                        <div style={{ height: '1px', background: '#d0c8b0', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: activePaper.paperColor, padding: '0 8px', color: '#c0b898', fontSize: '0.5rem' }}>✦</span>
                        </div>
                      </div>
                    ))}
                    {leftColumn.length === 0 && rightColumn.length > 0 && (
                      <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.65rem', color: '#a09070', textAlign: 'center' }}>
                        Articles in right column →
                      </p>
                    )}
                  </div>
                  <div style={{ width: '1px', background: '#d0c8b0', flexShrink: 0, margin: '8px 0' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {rightColumn.map(article => (
                      <div key={article.id}>
                        <ArticleBlock article={article} paper={activePaper} />
                        <div style={{ height: '1px', background: '#d0c8b0', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: activePaper.paperColor, padding: '0 8px', color: '#c0b898', fontSize: '0.5rem' }}>✦</span>
                        </div>
                      </div>
                    ))}
                    {rightColumn.length === 0 && leftColumn.length > 0 && (
                      <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.65rem', color: '#a09070', textAlign: 'center' }}>
                        Articles in left column ←
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page nav */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
              padding: '10px 24px 14px', borderTop: '1px solid #d0c8b0', position: 'relative', zIndex: 1,
              flexShrink: 0,
            }}>
              <button
                onClick={() => setPageIndex(i => Math.max(0, i - 1))}
                disabled={safePageIndex <= 0}
                style={{
                  background: 'transparent', border: '1px solid #c0b898', color: safePageIndex <= 0 ? '#c0b898' : activePaper.textColor,
                  cursor: safePageIndex <= 0 ? 'default' : 'pointer', padding: '4px 10px',
                  fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', letterSpacing: '0.08em',
                }}
              >◀</button>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.52rem', color: '#7a7060', letterSpacing: '0.08em' }}>
                Week {currentWeek} — {activePaper.shortName} {safePageIndex + 1}/{Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPageIndex(i => Math.min(totalPages - 1, i + 1))}
                disabled={safePageIndex >= totalPages - 1}
                style={{
                  background: 'transparent', border: '1px solid #c0b898', color: safePageIndex >= totalPages - 1 ? '#c0b898' : activePaper.textColor,
                  cursor: safePageIndex >= totalPages - 1 ? 'default' : 'pointer', padding: '4px 10px',
                  fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', letterSpacing: '0.08em',
                }}
              >▶</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
