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

function ArticleBlock({
  article,
  paper,
  isLead = false
}: {
  article: NewsArticle
  paper: NewspaperDef
  isLead?: boolean
}) {

  // Paper-specific style overrides
  const paperStyles: Record<string, {
    headlineSize: string
    headlineWeight: number
    headlineTransform: string
    headlineColor: string
    headlineFamily: string
    bodyFamily: string
    bodySize: string
    accentRule: string
    categoryStyle: React.CSSProperties
    bylineStyle: React.CSSProperties
    containerStyle: React.CSSProperties
  }> = {
    ashenmere_herald: {
      headlineSize: isLead ? '2.1rem' : '0.9rem',
      headlineWeight: 800,
      headlineTransform: 'uppercase',
      headlineColor: '#1a1a2e',
      headlineFamily: "'Playfair Display', Georgia, serif",
      bodyFamily: "'Crimson Text', Georgia, serif",
      bodySize: isLead ? '0.8rem' : '0.65rem',
      accentRule: '3px solid #1a1a2e',
      categoryStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.38rem',
        letterSpacing: '0.25em',
        color: '#5a5040',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        marginBottom: '6px',
        borderBottom: '1px solid #d0c8b0',
        paddingBottom: '3px',
      },
      bylineStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.4rem',
        color: '#5a5040',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        margin: '4px 0 8px',
      },
      containerStyle: {
        borderTop: isLead ? 'none' : '1px solid #d0c8b0',
        paddingTop: isLead ? '0' : '12px',
      },
    },

    peoples_standard: {
      headlineSize: isLead ? '2.2rem' : '1rem',
      headlineWeight: 900,
      headlineTransform: 'uppercase',
      headlineColor: '#8b1a1a',
      headlineFamily: "'Libre Baskerville', Georgia, serif",
      bodyFamily: "'Crimson Text', Georgia, serif",
      bodySize: isLead ? '0.76rem' : '0.63rem',
      accentRule: '4px solid #8b1a1a',
      categoryStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.38rem',
        letterSpacing: '0.2em',
        color: '#f5f0e8',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        marginBottom: '6px',
        background: '#8b1a1a',
        padding: '2px 8px',
        display: 'inline-block' as const,
      },
      bylineStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.4rem',
        color: '#8b1a1a',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        margin: '4px 0 8px',
        fontWeight: 700,
      },
      containerStyle: {
        background: isLead ? 'rgba(139,26,26,0.04)' : 'transparent',
        padding: isLead ? '12px' : '0',
        borderLeft: 'none',
      },
    },

    kravenstal_worker: {
      headlineSize: isLead ? '2.2rem' : '1rem',
      headlineWeight: 900,
      headlineTransform: 'uppercase',
      headlineColor: '#c0392b',
      headlineFamily: "'IBM Plex Serif', Georgia, serif",
      bodyFamily: "'IBM Plex Serif', Georgia, serif",
      bodySize: isLead ? '0.74rem' : '0.62rem',
      accentRule: '4px solid #c0392b',
      categoryStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.38rem',
        letterSpacing: '0.2em',
        color: '#c0392b',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        marginBottom: '6px',
        fontWeight: 700,
      },
      bylineStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.4rem',
        color: '#6a5a40',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        margin: '4px 0 8px',
      },
      containerStyle: {
        borderTop: isLead ? '3px solid #1c1410' : '1px solid #d0c8b0',
        paddingTop: '10px',
      },
    },

    veltrian_times: {
      headlineSize: isLead ? '1.8rem' : '0.88rem',
      headlineWeight: 700,
      headlineTransform: 'uppercase',
      headlineColor: '#1a2a3a',
      headlineFamily: "'Crimson Text', Georgia, serif",
      bodyFamily: "'Crimson Text', Georgia, serif",
      bodySize: isLead ? '0.78rem' : '0.64rem',
      accentRule: '2px solid #2c3e50',
      categoryStyle: {
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.38rem',
        letterSpacing: '0.3em',
        color: '#f5f0e8',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'left' as const : 'left' as const,
        marginBottom: '8px',
        background: '#2c3e50',
        padding: '2px 10px',
        display: 'inline-block' as const,
      },
      bylineStyle: {
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '0.5rem',
        color: '#4a5a6a',
        letterSpacing: '0.04em',
        textTransform: 'none' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        margin: '4px 0 8px',
        fontStyle: 'italic' as const,
      },
      containerStyle: {
        borderTop: '4px solid #2c3e50',
        paddingTop: '14px',
      },
    },

    thornfeld_gazette: {
      headlineSize: isLead ? '1.9rem' : '0.88rem',
      headlineWeight: 700,
      headlineTransform: 'uppercase',
      headlineColor: '#2d4a1e',
      headlineFamily: "'EB Garamond', Georgia, serif",
      bodyFamily: "'EB Garamond', Georgia, serif",
      bodySize: isLead ? '0.76rem' : '0.63rem',
      accentRule: '2px solid #4a4a2a',
      categoryStyle: {
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '0.5rem',
        letterSpacing: '0.15em',
        color: '#6a5a3a',
        textTransform: 'uppercase' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        marginBottom: '6px',
        fontVariant: 'small-caps' as const,
        fontStyle: 'italic' as const,
      },
      bylineStyle: {
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '0.52rem',
        color: '#6a5a3a',
        letterSpacing: '0.04em',
        textTransform: 'none' as const,
        textAlign: isLead ? 'center' as const : 'left' as const,
        margin: '4px 0 8px',
        fontStyle: 'italic' as const,
      },
      containerStyle: {
        background: 'rgba(74,74,42,0.04)',
        padding: isLead ? '12px 16px' : '0',
        border: isLead ? '2px solid #4a4a2a' : 'none',
        boxShadow: isLead ? 'inset 0 0 0 4px rgba(74,74,42,0.08)' : 'none',
      },
    },
  }

  const ps = paperStyles[paper.id] ?? paperStyles.ashenmere_herald

  return (
    <div style={{ marginBottom: isLead ? '20px' : '16px', ...ps.containerStyle }}>

      {/* Category */}
      <div style={ps.categoryStyle}>
        {article.category.toUpperCase()}
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: ps.headlineFamily,
        fontSize: ps.headlineSize,
        fontWeight: ps.headlineWeight,
        lineHeight: isLead ? 1.1 : 1.25,
        margin: isLead ? '0 0 8px' : '0 0 4px',
        color: ps.headlineColor,
        textTransform: ps.headlineTransform as React.CSSProperties['textTransform'],
        textAlign: isLead ? 'center' : 'left',
      }}>
        {article.headline}
      </h2>

      {/* Decorative rule under lead headline */}
      {isLead && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '6px 0 8px',
        }}>
          <div style={{ flex: 1, height: '2px', background: ps.headlineColor, opacity: 0.7 }} />
          <div style={{
            width: '5px', height: '5px',
            background: ps.headlineColor,
            transform: 'rotate(45deg)',
            opacity: 0.5, flexShrink: 0,
          }} />
          <div style={{ flex: 1, height: '1px', background: ps.headlineColor, opacity: 0.3 }} />
        </div>
      )}

      {/* Byline */}
      <p style={ps.bylineStyle}>
        By {paper.reporterName} · {article.date}
      </p>

      {/* Body */}
      <p style={{
        fontFamily: ps.bodyFamily,
        fontSize: ps.bodySize,
        lineHeight: isLead ? 1.7 : 1.55,
        color: paper.textColor,
        margin: 0,
        textAlign: isLead ? 'justify' : 'left',
        opacity: 0.92,
        ...(isLead ? {
          columnCount: 2,
          columnGap: '24px',
          columnRule: '1px solid rgba(0,0,0,0.1)',
        } : {}),
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

  // When overlay opens, show the page with the most recently added article
  useEffect(() => {
    if (!isOpen) return
    if (articles.length === 0) return
    const lastArticle = articles[articles.length - 1]
    const weekOfLastArticle = lastArticle.weekNumber
    const pageIdx = weekMap.findIndex(([week]) => week === weekOfLastArticle)
    if (pageIdx !== -1) setPageIndex(pageIdx)
  }, [isOpen])

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
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '40px',
              }}>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.8rem',
                  color: '#8a8060',
                  letterSpacing: '0.1em',
                }}>
                  NO COVERAGE THIS WEEK
                </p>
                <p style={{
                  fontFamily: activePaper.fontFamily,
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: '#a09070',
                }}>
                  Try another publication for coverage.
                </p>
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
              }}>
                <div style={{
                  flex: 1,
                  padding: '16px 28px 16px 28px',
                  overflowY: 'auto',
                }}>
                  {tabArticles.length > 0 && (() => {
                    const lead = tabArticles[0]
                    const rest = tabArticles.slice(1)
                    return (
                      <div>
                        {/* BANNER HEADLINE — full width */}
                        <div style={{
                          borderBottom: '3px solid #1a1a2e',
                          marginBottom: '12px',
                          paddingBottom: '10px',
                        }}>
                          {/* Category tag */}
                          <div style={{
                            fontFamily: "'Special Elite', monospace",
                            fontSize: '0.38rem',
                            letterSpacing: '0.25em',
                            color: activePaper.accentColor ?? '#5a5040',
                            textTransform: 'uppercase' as const,
                            textAlign: 'center' as const,
                            marginBottom: '6px',
                          }}>
                            ── {lead.category.toUpperCase()} ──
                          </div>

                          {/* MASSIVE headline spanning full width */}
                          <h2 style={{
                            fontFamily: activeTab === 'peoples_standard' ? "'SispectlyHarmonies', 'Libre Baskerville', Georgia, serif"
                              : activeTab === 'kravenstal_worker' ? "'BulletinGothic', 'Special Elite', monospace"
                              : activeTab === 'thornfeld_gazette' ? "'Worldstar', sans-serif"
                              : activeTab === 'veltrian_times' ? "'Crimson Text', Georgia, serif"
                              : activePaper.fontFamily,
                            fontSize: activeTab === 'kravenstal_worker' ? 'clamp(2rem, 4.5vw, 3.2rem)'
                              : activeTab === 'veltrian_times' ? 'clamp(1.5rem, 3.2vw, 2.2rem)'
                              : activeTab === 'thornfeld_gazette' ? 'clamp(2.2rem, 5vw, 3.6rem)'
                              : 'clamp(1.8rem, 4vw, 2.8rem)',
                            fontWeight: activeTab === 'veltrian_times' ? 700
                              : activeTab === 'thornfeld_gazette' ? 700
                              : 900,
                            lineHeight: 1.05,
                            margin: '0 0 4px',
                            color: activeTab === 'peoples_standard' ? '#6b0f1a'
                              : activeTab === 'kravenstal_worker' ? '#1c1410'
                              : activeTab === 'thornfeld_gazette' ? '#2d4a1e'
                              : activeTab === 'veltrian_times' ? '#2c3e50'
                              : activePaper.textColor,
                            textTransform: activeTab === 'veltrian_times' ? 'none' as const
                              : activeTab === 'thornfeld_gazette' ? 'none' as const
                              : 'uppercase' as const,
                            textAlign: 'center' as const,
                            letterSpacing: activeTab === 'kravenstal_worker' ? '0.12em'
                              : activeTab === 'peoples_standard' ? '0.06em'
                              : activeTab === 'veltrian_times' ? '0.02em'
                              : '-0.01em',
                            width: '100%',
                            fontStyle: activeTab === 'veltrian_times' ? 'none' as const : activeTab === 'thornfeld_gazette' ? 'normal' as const : 'normal' as const,
                          }}>
                            {lead.headline}
                          </h2>

                          {/* Byline centered */}
                          <p style={{
                            fontFamily: "'Special Elite', monospace",
                            fontSize: '0.4rem',
                            color: '#8a7a60',
                            letterSpacing: '0.1em',
                            margin: '6px 0 0',
                            textTransform: 'uppercase' as const,
                            textAlign: 'center' as const,
                          }}>
                            By {activePaper.reporterName} · {lead.date}
                          </p>
                        </div>

                        <p style={{
                          fontFamily: activePaper.bodyFontFamily,
                          fontSize: '0.7rem',
                          lineHeight: 1.7,
                          color: activePaper.textColor,
                          margin: 0,
                          textAlign: 'justify',
                        }}>
                          {renderWithEntities(lead.body)}
                        </p>

                        {/* Divider before secondary stories */}
                        {rest.length > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '14px',
                            borderTop: '2px solid #1a1a2e',
                            borderBottom: '1px solid #1a1a2e',
                            padding: '3px 0',
                          }}>
                            <span style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.38rem',
                              letterSpacing: '0.2em',
                              color: '#5a5040',
                              textTransform: 'uppercase' as const,
                              width: '100%',
                              textAlign: 'center' as const,
                            }}>
                              Further Coverage
                            </span>
                          </div>
                        )}

                        {/* Secondary stories in 2 columns */}
                        {rest.length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: '20px',
                          }}>
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column' as const,
                              gap: '14px',
                            }}>
                              {rest
                                .filter((_, i) => i % 2 === 0)
                                .map(article => (
                                  <div key={article.id}>
                                    <ArticleBlock
                                      article={article}
                                      paper={activePaper}
                                      isLead={false}
                                    />
                                    <div style={{
                                      height: '1px',
                                      background: '#d0c8b0',
                                      marginTop: '10px',
                                    }} />
                                  </div>
                                ))}
                            </div>

                            <div style={{
                              width: '1px',
                              background: '#d0c8b0',
                              flexShrink: 0,
                            }} />

                            <div style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column' as const,
                              gap: '14px',
                            }}>
                              {rest
                                .filter((_, i) => i % 2 === 1)
                                .map(article => (
                                  <div key={article.id}>
                                    <ArticleBlock
                                      article={article}
                                      paper={activePaper}
                                      isLead={false}
                                    />
                                    <div style={{
                                      height: '1px',
                                      background: '#d0c8b0',
                                      marginTop: '10px',
                                    }} />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state */}
                        {tabArticles.length === 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column' as const,
                            gap: '12px',
                            paddingTop: '60px',
                          }}>
                            <p style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.8rem',
                              color: '#8a8060',
                              letterSpacing: '0.1em',
                            }}>
                              NO NEWS THIS WEEK
                            </p>
                            <p style={{
                              fontFamily: activePaper.fontFamily,
                              fontStyle: 'italic',
                              fontSize: '0.85rem',
                              color: '#a09070',
                            }}>
                              Your decisions have not yet made the papers.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
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
