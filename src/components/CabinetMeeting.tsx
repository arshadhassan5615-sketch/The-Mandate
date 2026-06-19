import { useState } from 'react'
import type { MinisterRequest, MinisterRequestOption } from '../types/minister'
import { useCabinetStore } from '../stores/cabinetStore'
import { useNewsStore } from '../stores/newsStore'
import { useGameStore } from '../stores/gameStore'
import type { NewsArticle } from '../types/news'
import { getPortrait } from '../assets/potraits'
import { getCharacterPortrait } from './portraits/CharacterPortraits'

function MinisterPortrait({ ministerId }: { ministerId: string }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = getPortrait(ministerId)
  const SvgComp = getCharacterPortrait(ministerId)

  return (
    <div style={{
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      border: '2px solid rgba(201,168,76,0.4)',
      overflow: 'hidden',
      margin: '0 auto 12px',
      background: 'rgba(201,168,76,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {imgSrc && !imgError ? (
        <img
          src={imgSrc}
          alt={ministerId}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : SvgComp ? (
        <SvgComp />
      ) : (
        <span style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'rgba(201,168,76,0.6)',
          fontFamily: 'Georgia, serif',
        }}>
          {ministerId.split('_').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

interface CabinetMeetingProps {
  requests: MinisterRequest[]
  onComplete: () => void
}

export const CabinetMeeting: React.FC<CabinetMeetingProps> = ({ requests, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [, setResolved] = useState<string[]>([])

  const { completeRequest, updateLoyalty, updateSatisfaction, getAllMinisters } = useCabinetStore()

  if (requests.length === 0) {
    onComplete()
    return null
  }

  const current = requests[currentIndex]

  if (!current) {
    return null
  }

  const minister = getAllMinisters().find(m => m.id === current.minister_id) ?? null

  const handleDecision = (option: MinisterRequestOption) => {
    setSelectedOption(option.id)
    completeRequest(current.id)
    if (minister) {
      updateLoyalty(minister.ministry, option.loyalty_effect)
      updateSatisfaction(minister.ministry, option.satisfaction_effect)
    }
    setResolved(prev => [...prev, current.id])

    // --- PROCEDURAL MEDIA ENGINE ---
    const currentWeek = useGameStore.getState().currentWeek
    const date = `Week ${currentWeek}, 1963`
    const generatedNews: NewsArticle[] = []

    // 1. State Media (Official Government Record)
    generatedNews.push({
      id: `news_${current.id}_state_${Date.now()}`,
      headline: `EXECUTIVE DIRECTIVE: ${current.title.toUpperCase()}`,
      body: `The Chancellor's Office has issued a formal directive regarding a recent ${minister?.title || 'Ministry'} proposal. Official sources confirm the decision will result in the following: ${option.consequence.toLowerCase()}.`,
      publication: 'The Veltrian State Times' as any,
      weekNumber: currentWeek,
      date,
      templateId: 'event_standard',
      category: 'POLITICS' as any
    })

    // 2. Tribune Reaction (Centrist Analysis)
    generatedNews.push({
      id: `news_${current.id}_reaction_${Date.now()}`,
      headline: `CONTROVERSY OVER NEW ${minister?.ministry.toUpperCase() || 'CABINET'} POLICY`,
      body: `Debate erupted in the capital today following the Chancellor's decision to "${option.text}". While government loyalists praise the swift executive action, critics point out that it ${option.consequence.toLowerCase()}.`,
      publication: 'The Republic Tribune' as any,
      weekNumber: currentWeek,
      date,
      templateId: 'event_standard',
      category: 'POLITICS' as any
    })

    // 3. Custom Author Overrides
    if (option.newsImpact) {
      option.newsImpact.forEach((n, i) => {
        generatedNews.push({
          id: `news_custom_${current.id}_${i}_${Date.now()}`,
          headline: n.headline,
          body: n.body,
          publication: n.publication as any,
          weekNumber: currentWeek,
          date,
          templateId: 'event_standard',
          category: (n.category || 'POLITICS') as any
        })
      })
    }

    useNewsStore.getState().addArticles(generatedNews)
  }

  const handleNext = () => {
    if (currentIndex < requests.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
    } else {
      onComplete()
    }
  }

  const isLast = currentIndex === requests.length - 1
  const selectedData = current.options.find(o => o.id === selectedOption)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: 0,
      background: 'rgba(8,6,4,0.95)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      paddingRight: '60px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 48px 16px',
        borderBottom: '1px solid rgba(201,168,76,0.3)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '3px',
            color: 'rgba(201,168,76,0.5)',
            marginBottom: '4px',
          }}>
            CABINET MEETING · WEEKLY REPORTS
          </div>
          <div style={{
            fontSize: '18px',
            color: '#e8d5a3',
            fontWeight: 700,
            fontStyle: 'italic',
          }}>
            {current.title}
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(201,168,76,0.4)',
        }}>
          {currentIndex + 1} of {requests.length}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px 48px',
        display: 'flex',
        gap: '40px',
      }}>
        {/* Minister portrait + info */}
        {minister && (
          <div style={{
            width: '180px',
            flexShrink: 0,
          }}>
            <MinisterPortrait ministerId={minister.id} />
            <div style={{
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#e8d5a3',
              marginBottom: '4px',
            }}>
              {minister.name}
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '10px',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              {minister.title}
            </div>

            {/* Loyalty bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
              }}>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '1px',
                }}>LOYALTY</span>
                <span style={{
                  fontSize: '9px',
                  color: '#c9a84c',
                }}>
                  {minister.current_loyalty}
                </span>
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
              }}>
                <div style={{
                  width: `${minister.current_loyalty}%`,
                  height: '100%',
                  background: '#c9a84c',
                  borderRadius: '2px',
                }} />
              </div>
            </div>

            {/* Satisfaction bar */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
              }}>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '1px',
                }}>SATISFACTION</span>
                <span style={{
                  fontSize: '9px',
                  color: minister.satisfaction > 50 ? '#2d7a3a' : '#c0392b',
                }}>
                  {minister.satisfaction}
                </span>
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
              }}>
                <div style={{
                  width: `${minister.satisfaction}%`,
                  height: '100%',
                  background: minister.satisfaction > 50 ? '#2d7a3a' : '#c0392b',
                  borderRadius: '2px',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Report + Options */}
        <div style={{ flex: 1 }}>
          {/* Minister's report */}
          <div style={{
            background: 'rgba(10,8,6,0.6)',
            borderTop: '1px solid rgba(201,168,76,0.15)',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            padding: '24px 0',
            marginBottom: '32px',
          }}>
            <div style={{
              fontSize: '10px',
              letterSpacing: '2px',
              color: '#c9a84c',
              marginBottom: '12px',
              fontFamily: "'Special Elite', monospace",
            }}>
              {minister ? `[ ${minister.name.toUpperCase()} ]` : '[ MINISTER REPORT ]'}
            </div>
            <div style={{
              fontSize: '15px',
              color: 'rgba(232,213,163,0.92)',
              lineHeight: '1.7',
              fontFamily: "'Crimson Text', serif",
              fontStyle: 'italic',
            }}>
              "{current.description}"
            </div>
          </div>

          {/* Options */}
          {!selectedOption ? (
            <div>
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                color: '#c9a84c',
                marginBottom: '16px',
                fontFamily: "'Special Elite', monospace",
              }}>
                ► EXECUTIVE DIRECTIVE REQUIRED
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {current.options.map(option => (
                  <div
                    key={option.id}
                    onClick={() => handleDecision(option)}
                    style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(90deg, rgba(201,168,76,0.05) 0%, rgba(10,8,6,0.5) 100%)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      borderLeft: '3px solid rgba(201,168,76,0.3)',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.02) 100%)'
                      e.currentTarget.style.borderLeft = '3px solid #c9a84c'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(201,168,76,0.05) 0%, rgba(10,8,6,0.5) 100%)'
                      e.currentTarget.style.borderLeft = '3px solid rgba(201,168,76,0.3)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'
                      e.currentTarget.style.transform = 'translateX(0px)'
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      color: '#e8d5a3',
                      fontFamily: "'Crimson Text', serif",
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      {option.text}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(201,168,76,0.6)',
                      fontFamily: "'Special Elite', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ↳ {option.consequence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                color: '#2d7a3a',
                marginBottom: '16px',
                fontFamily: "'Special Elite', monospace",
              }}>
                ► DIRECTIVE CONFIRMED
              </div>
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(90deg, rgba(45,122,58,0.1) 0%, rgba(10,8,6,0.5) 100%)',
                border: '1px solid rgba(45,122,58,0.2)',
                borderLeft: '3px solid #2d7a3a',
                borderRadius: '2px',
                marginBottom: '24px',
                fontSize: '15px',
                color: '#e8d5a3',
                fontFamily: "'Crimson Text', serif",
                fontStyle: 'italic',
              }}>
                "{selectedData?.text}"
              </div>
              <button
                onClick={handleNext}
                style={{
                  background: '#c9a84c',
                  color: '#1a1410',
                  border: 'none',
                  padding: '12px 32px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isLast ? 'Conclude Meeting →' : 'Next Report →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
