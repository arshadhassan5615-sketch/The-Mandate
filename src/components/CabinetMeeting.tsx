import { useState } from 'react'
import type { MinisterRequest, MinisterRequestOption } from '../types/minister'
import { useCabinetStore } from '../stores/cabinetStore'
import { useNewsStore } from '../stores/newsStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import type { NewsArticle } from '../types/news'
import { buildCoverage } from '../engine/pressCoverage'
import { getPortrait } from '../assets/potraits'
import { getCharacterPortrait } from './portraits/CharacterPortraits'
import { usePageInsets } from '../hooks/usePageInsets'

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
  // Keep clear of the fixed HUD; phones stack columns and drop the rail gap
  const insets = usePageInsets()
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

  // --- REACTIVE RESHUFFLE TRIGGER ---
  // If a minister's loyalty has collapsed or they've been exposed for corruption
  // with low satisfaction, surface a forced dismissal choice instead of their
  // normal request. This bypasses the 6-week cooldown and has no public_trust
  // penalty — the player is reacting to a genuine crisis.
  const { activeFlags } = useNarrativeStore.getState()
  const loyaltyCollapse = minister && minister.current_loyalty < 25
  const scandalCollapse = minister
    && activeFlags.includes(`${minister.id}_corruption_exposed`)
    && minister.satisfaction < 20
  const forcedDismissal = (loyaltyCollapse || scandalCollapse) ? minister : null
  const forcedReason = loyaltyCollapse ? 'loyalty_collapse' as const : 'scandal' as const

  const handleForcedDismiss = () => {
    if (!forcedDismissal) return
    completeRequest(current.id)
    useWeekStore.setState({ showCabinetMeeting: false })
    useWeekStore.getState().triggerReshuffle(forcedDismissal.ministry)
  }

  const handleDecision = (option: MinisterRequestOption) => {
    setSelectedOption(option.id)
    completeRequest(current.id)
    if (minister) {
      updateLoyalty(minister.ministry, option.loyalty_effect)
      updateSatisfaction(minister.ministry, option.satisfaction_effect)
    }
    setResolved(prev => [...prev, current.id])

    // --- WIRE MINISTER CONSEQUENCE DATA ---
    // 1. Apply declared stat effects through the canonical gameStore pipeline
    //    (same StateModifier[] pattern used by bills and projects).
    const statMods = Object.entries(option.stat_effects).map(
      ([stat, value]) => ({ stat, operation: 'add' as const, value })
    )
    if (statMods.length > 0) {
      useGameStore.getState().applyModifiers(statMods)
    }

    // 2. Collect flags to push into narrativeStore.activeFlags via addFlags.
    const flagsToAdd: string[] = []
    if (option.flag) flagsToAdd.push(option.flag)

    // 3. Track corruption exposure: a corrupt minister (corruption_risk > 25)
    //    who is repeatedly denied (negative satisfaction) gains a motive for
    //    scandal/betrayal.
    if (
      minister &&
      minister.corruption_risk > 25 &&
      option.satisfaction_effect < 0
    ) {
      flagsToAdd.push(`${minister.id}_corruption_exposed`)
    }

    if (flagsToAdd.length > 0) {
      useNarrativeStore.getState().addFlags(flagsToAdd)
    }

    // --- PROCEDURAL MEDIA ENGINE ---
    const currentWeek = useGameStore.getState().currentWeek
    const date = `Week ${currentWeek}, 1963`
    const generatedNews: NewsArticle[] = []

    // The decision as a governance story; the press decides who prints it and
    // how (engine/pressCoverage). Was filed under two papers that do not exist.
    generatedNews.push(...buildCoverage({
      trigger: `cabinet_${current.id}`,
      category: 'governance',
      herald: {
        headline: `EXECUTIVE DIRECTIVE: ${current.title.toUpperCase()}`,
        body: `The Chancellor's Office has issued a formal directive regarding a recent ${minister?.title || 'Ministry'} proposal. Official sources confirm the decision will result in the following: ${option.consequence.toLowerCase()}.`,
      },
      standard: {
        headline: `CONTROVERSY OVER NEW ${minister?.ministry.toUpperCase() || 'CABINET'} POLICY`,
        body: `Debate erupted in the capital today following the Chancellor's decision to "${option.text}". While government loyalists praise the swift executive action, critics point out that it ${option.consequence.toLowerCase()}.`,
      },
    }, {
      week: currentWeek,
      date,
      pressFreedom: useGameStore.getState().nation.pressFreedom,
      mediaControl: useGameStore.getState().nation.mediaControl,
    }))

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
      paddingRight: insets.right,
      paddingTop: insets.isPhone ? insets.top : undefined,
      paddingBottom: insets.bottom,
    }}>
      {/* Header */}
      <div style={{
        padding: insets.isPhone ? '12px 16px' : '20px 48px 16px',
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

          {/* Forced Dismissal — reactive reshuffle trigger */}
          {forcedDismissal && !selectedOption && (
            <div style={{
              background: 'rgba(192,57,43,0.08)',
              border: '1px solid rgba(192,57,43,0.3)',
              borderLeft: '3px solid #c0392b',
              borderRadius: '2px',
              padding: '20px 24px',
              marginBottom: '24px',
            }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                color: '#c0392b',
                marginBottom: '8px',
                fontFamily: "'Special Elite', monospace",
              }}>
                ► MINISTERIAL CRISIS
              </div>
              <div style={{
                fontSize: '13px',
                color: '#e8d5a3',
                lineHeight: '1.6',
                marginBottom: '16px',
                fontFamily: "'Crimson Text', serif",
              }}>
                {forcedReason === 'loyalty_collapse'
                  ? `${forcedDismissal.name}'s loyalty has fallen to ${forcedDismissal.current_loyalty}%. Their position has become untenable. You may dismiss them now, or continue with the political risk of keeping them.`
                  : `${forcedDismissal.name}'s corruption has been exposed and their satisfaction is at ${forcedDismissal.satisfaction}%. Keeping them invites scandal. You may dismiss them now, or continue with the political risk.`
                }
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  onClick={handleForcedDismiss}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(192,57,43,0.15)',
                    border: '1px solid rgba(192,57,43,0.4)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#e8d5a3',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    fontFamily: 'Georgia, serif',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(192,57,43,0.3)'
                    e.currentTarget.style.borderColor = '#c0392b'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(192,57,43,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)'
                  }}
                >
                  Dismiss Minister
                </div>
                <div
                  onClick={() => {
                    // Skip this request without dismissing — continue with political risk
                    completeRequest(current.id)
                    setResolved(prev => [...prev, current.id])
                    setSelectedOption('__skip__')
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(201,168,76,0.05)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: 'rgba(201,168,76,0.6)',
                    letterSpacing: '1px',
                    fontFamily: 'Georgia, serif',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.05)'
                  }}
                >
                  Keep for Now
                </div>
              </div>
            </div>
          )}

          {/* Options — normal request flow (hidden during forced dismissal) */}
          {!selectedOption && !forcedDismissal ? (
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
                color: selectedOption === '__skip__' ? 'rgba(201,168,76,0.6)' : '#2d7a3a',
                marginBottom: '16px',
                fontFamily: "'Special Elite', monospace",
              }}>
                {selectedOption === '__skip__' ? '► RISK ACCEPTED' : '► DIRECTIVE CONFIRMED'}
              </div>
              <div style={{
                padding: '16px 20px',
                background: selectedOption === '__skip__'
                  ? 'linear-gradient(90deg, rgba(201,168,76,0.05) 0%, rgba(10,8,6,0.5) 100%)'
                  : 'linear-gradient(90deg, rgba(45,122,58,0.1) 0%, rgba(10,8,6,0.5) 100%)',
                border: selectedOption === '__skip__'
                  ? '1px solid rgba(201,168,76,0.15)'
                  : '1px solid rgba(45,122,58,0.2)',
                borderLeft: selectedOption === '__skip__'
                  ? '3px solid rgba(201,168,76,0.3)'
                  : '3px solid #2d7a3a',
                borderRadius: '2px',
                marginBottom: '24px',
                fontSize: '15px',
                color: '#e8d5a3',
                fontFamily: "'Crimson Text', serif",
                fontStyle: 'italic',
              }}>
                {selectedOption === '__skip__'
                  ? `You keep ${minister?.name ?? 'the minister'} despite the risk. The political cost of inaction may come later.`
                  : `"${selectedData?.text}"`
                }
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
