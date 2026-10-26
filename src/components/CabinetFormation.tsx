import { createElement, useState } from 'react'
import type { MinistryType } from '../types/minister'
import { MINISTER_CANDIDATES, getCandidatesForMinistry } from '../data/ministers'
import { useCabinetStore } from '../stores/cabinetStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { getPortrait } from '../assets/potraits'
import { getCharacterPortrait } from './portraits/CharacterPortraits'
import { usePageInsets } from '../hooks/usePageInsets'
import { Z } from '../constants/zIndex'

const MINISTRY_LABELS: Record<MinistryType, string> = {
  finance: 'Finance',
  interior: 'Interior',
  defense: 'Defense',
  justice: 'Justice',
  labor: 'Labor',
  foreign_affairs: 'Foreign Affairs',
  education: 'Education',
  health: 'Health',
  development: 'Development',
  resources: 'Resources',
}

const MINISTRY_COLORS: Record<MinistryType, string> = {
  finance: '#c9a84c',
  interior: '#8b4513',
  defense: '#4a5a6a',
  justice: '#6a4a8b',
  labor: '#c0392b',
  foreign_affairs: '#2d7a3a',
  education: '#2980b9',
  health: '#16a085',
  development: '#d35400',
  resources: '#7f8c8d',
}

function CandidatePortrait({ candidateId, isChosen }: { candidateId: string; isChosen: boolean }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = getPortrait(candidateId)
  const SvgComp = getCharacterPortrait(candidateId)

  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: `2px solid ${isChosen ? '#2d7a3a' : 'rgba(201,168,76,0.4)'}`,
      overflow: 'hidden',
      flexShrink: 0,
      background: 'rgba(201,168,76,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {imgSrc && !imgError ? (
        <img
          src={imgSrc}
          alt={candidateId}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : SvgComp ? (
        createElement(SvgComp)
      ) : (
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'rgba(201,168,76,0.6)',
          fontFamily: 'Georgia, serif',
        }}>
          {candidateId.split('_').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

interface CabinetFormationProps {
  onComplete: () => void
  reshuffleMinistry?: MinistryType
  reshuffleMode?: boolean
}

export const CabinetFormation: React.FC<CabinetFormationProps> = ({ onComplete, reshuffleMinistry, reshuffleMode }) => {
  // Keep clear of the fixed HUD; phones stack columns and drop the rail gap
  const insets = usePageInsets()
  // Dense layout for every non-desktop viewport (landscape phones are 'compact')
  const isDense = insets.mode !== 'desktop'
  const [selections, setSelections] = useState<Partial<Record<MinistryType, string>>>({})
  const [activeMinistry, setActiveMinistry] = useState<MinistryType>(reshuffleMinistry ?? 'finance')
  // Follow a new reshuffle target (adjusted during render, not in an effect)
  const [prevReshuffleMinistry, setPrevReshuffleMinistry] = useState(reshuffleMinistry)
  if (prevReshuffleMinistry !== reshuffleMinistry) {
    setPrevReshuffleMinistry(reshuffleMinistry)
    if (reshuffleMinistry) setActiveMinistry(reshuffleMinistry)
  }
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null)

  const isReshuffle = !!(reshuffleMinistry || reshuffleMode)

  const { appointMinister, reshuffleMinister, completeFormation } = useCabinetStore()
  const currentWeek = useGameStore.getState().currentWeek

  const ministries = isReshuffle
    ? [reshuffleMinistry]
    : (Object.keys(MINISTRY_LABELS) as MinistryType[])
  const allSelected = ministries.every(m => m && selections[m])
  const selectedCount = Object.keys(selections).length

  const handleSelect = (ministry: MinistryType, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [ministry]: candidateId,
    }))
  }

  const handleConfirm = () => {
    if (isReshuffle && reshuffleMinistry) {
      const candidateId = selections[reshuffleMinistry]
      if (!candidateId) return
      const candidate = MINISTER_CANDIDATES.find(c => c.id === candidateId)
      if (!candidate) return

      reshuffleMinister(reshuffleMinistry, candidate, currentWeek, 'reshuffled')

      // Political cost: public_trust -8, outgoing minister's primary faction -10
      const outgoing = useCabinetStore.getState().dismissedMinisters.at(-1)
      const mods: { stat: string; operation: 'add'; value: number }[] = [
        { stat: 'public_trust', operation: 'add', value: -8 },
      ]
      if (outgoing?.faction_ties?.[0]) {
        mods.push({ stat: `factions.${outgoing.faction_ties[0]}`, operation: 'add', value: -10 })
      }
      useGameStore.getState().applyModifiers(mods)

      onComplete()
      return
    }

    // Original formation flow — all 10 ministries
    ministries.forEach(ministry => {
      if (!ministry) return
      const candidateId = selections[ministry]
      if (candidateId) {
        const candidate = MINISTER_CANDIDATES.find(c => c.id === candidateId)
        if (candidate) {
          appointMinister(candidate, currentWeek)
        }
      }
    })
    completeFormation(currentWeek)
    useNarrativeStore.getState().markSceneVisited('act1_week2_cabinet_appointments')
    useWeekStore.getState().advanceQueue()
    onComplete()
  }

  const candidates = getCandidatesForMinistry(activeMinistry)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: '40px',
      background: 'rgba(8,6,4,0.97)',
      zIndex: Z.overlay,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      paddingLeft: insets.left,
      paddingRight: insets.right,
      // the panel starts 40px down; phones also clear the Government row
      paddingTop: insets.isPhone ? insets.top - 40 : undefined,
      paddingBottom: insets.bottom,
    }}>
      {/* Header */}
      <div data-testid="cabinet-header" style={{
        padding: insets.isPhone ? '12px 16px' : isDense ? '6px 16px' : '20px 48px 16px',
        borderBottom: '1px solid rgba(201,168,76,0.3)',
        flexShrink: 0,
      }}>
        {/* Dense: overline, title and count share one row */}
        <div style={isDense ? {
          display: 'flex',
          alignItems: 'baseline',
          gap: '12px',
          flexWrap: 'wrap',
        } : undefined}>
          <div style={{
            fontSize: isDense ? '9px' : '10px',
            letterSpacing: '3px',
            color: 'rgba(201,168,76,0.6)',
            marginBottom: isDense ? 0 : '4px',
          }}>
            WEEK {currentWeek} · {isReshuffle ? 'CABINET RESHUFFLE' : 'CABINET FORMATION'}
          </div>
          <div style={{
            fontSize: isDense ? '17px' : '22px',
            color: '#e8d5a3',
            fontWeight: 700,
            fontStyle: 'italic',
          }}>
            {isReshuffle
              ? `Reshuffle: Ministry of ${MINISTRY_LABELS[reshuffleMinistry!]}`
              : 'Appoint Your Cabinet'
            }
          </div>
          {!isReshuffle && (
            <div style={{
              fontSize: isDense ? '11px' : '12px',
              color: 'rgba(201,168,76,0.5)',
              marginTop: isDense ? 0 : '4px',
              marginLeft: isDense ? 'auto' : undefined,
            }}>
              {selectedCount} of {ministries.length} ministries filled
            </div>
          )}
        </div>
        {isReshuffle && (
          <div style={{
            fontSize: isDense ? '10px' : '11px',
            color: 'rgba(255,150,150,0.7)',
            marginTop: isDense ? '2px' : '4px',
            fontStyle: 'italic',
          }}>
            Dismissing a minister carries a political cost — public trust will suffer.
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: insets.isPhone ? 'column' : 'row',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Left — Ministry List (hidden in single-ministry reshuffle mode) */}
        {!(reshuffleMinistry) && (
          <div style={{
            width: insets.isPhone ? '100%' : isDense ? '150px' : '200px',
            maxHeight: insets.isPhone ? '30vh' : undefined,
            flexShrink: 0,
            borderRight: insets.isPhone ? 'none' : '1px solid rgba(201,168,76,0.2)',
            borderBottom: insets.isPhone ? '1px solid rgba(201,168,76,0.2)' : 'none',
            overflowY: 'auto',
            padding: insets.isPhone ? '12px 0' : isDense ? '6px 0' : '12px 0',
          }}>
            {Object.keys(MINISTRY_LABELS).map(ministry => {
              const isSelected = !!selections[ministry as MinistryType]
              const isActive = ministry === activeMinistry
              const color = MINISTRY_COLORS[ministry as MinistryType]
              return (
                <div
                  key={ministry}
                  data-testid={`ministry-row-${ministry}`}
                  onClick={() => setActiveMinistry(ministry as MinistryType)}
                  style={{
                    padding: isDense && !insets.isPhone ? '7px 12px' : '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                    borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isSelected ? '#2d7a3a' : 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: isDense && !insets.isPhone ? '11px' : '12px',
                    color: isActive ? '#e8d5a3' : 'rgba(201,168,76,0.6)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>
                    {MINISTRY_LABELS[ministry as MinistryType]}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Right — Candidate Cards */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: insets.isPhone ? '16px' : isDense ? '10px 14px' : '24px 40px',
        }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '3px',
            color: MINISTRY_COLORS[activeMinistry],
            marginBottom: isDense ? '10px' : '20px',
            textTransform: 'uppercase',
          }}>
            Ministry of {MINISTRY_LABELS[activeMinistry]}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: insets.isPhone ? '1fr' : '1fr 1fr',
            gap: isDense ? '12px' : '20px',
          }}>
            {candidates.map(candidate => {
              const isChosen = selections[activeMinistry] === candidate.id
              const isHovered = hoveredCandidate === candidate.id

              return (
                <div
                  key={candidate.id}
                  data-testid={`candidate-card-${candidate.id}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isChosen}
                  onClick={() => handleSelect(activeMinistry, candidate.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelect(activeMinistry, candidate.id)
                    }
                  }}
                  onMouseEnter={() => setHoveredCandidate(candidate.id)}
                  onMouseLeave={() => setHoveredCandidate(null)}
                  style={{
                    background: isChosen
                      ? 'rgba(45,122,58,0.15)'
                      : isHovered
                        ? 'rgba(201,168,76,0.08)'
                        : 'rgba(255,255,255,0.03)',
                    border: isChosen
                      ? '1px solid rgba(45,122,58,0.6)'
                      : '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '4px',
                    padding: isDense ? '12px' : '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {isChosen && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#2d7a3a',
                      color: 'white',
                      fontSize: '9px',
                      letterSpacing: '2px',
                      padding: '3px 8px',
                      borderRadius: '2px',
                    }}>
                      APPOINTED
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '14px',
                    marginBottom: '14px',
                    alignItems: 'center',
                  }}>
                    <CandidatePortrait
                      candidateId={candidate.id}
                      isChosen={isChosen}
                    />
                    <div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#e8d5a3',
                        marginBottom: '2px',
                      }}>
                        {candidate.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(201,168,76,0.6)',
                        letterSpacing: '0.5px',
                      }}>
                        {candidate.title}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.3)',
                        marginTop: '2px',
                      }}>
                        Age {candidate.age} · {candidate.ideology.charAt(0).toUpperCase() + candidate.ideology.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Stats bars */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '14px',
                  }}>
                    {[
                      { label: 'Competence', value: candidate.competence, color: '#c9a84c' },
                      { label: 'Loyalty', value: candidate.loyalty, color: '#2980b9' },
                      { label: 'Integrity', value: 100 - candidate.corruption_risk, color: '#2d7a3a' },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '3px',
                        }}>
                          <span style={{
                            fontSize: '9px',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                          }}>
                            {stat.label}
                          </span>
                          <span style={{ fontSize: '9px', color: stat.color }}>
                            {stat.value}
                          </span>
                        </div>
                        <div style={{
                          height: '3px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${stat.value}%`,
                            height: '100%',
                            background: stat.color,
                            borderRadius: '2px',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Background */}
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(232,213,163,0.7)',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    fontStyle: 'italic',
                  }}>
                    {candidate.background}
                  </div>

                  {/* Vyktor's assessment */}
                  <div style={{
                    borderTop: '1px solid rgba(201,168,76,0.15)',
                    paddingTop: '10px',
                  }}>
                    <div style={{
                      fontSize: '9px',
                      color: 'rgba(201,168,76,0.5)',
                      letterSpacing: '2px',
                      marginBottom: '4px',
                    }}>
                      VYKTOR REZNIK —
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(201,168,76,0.8)',
                      fontStyle: 'italic',
                    }}>
                      &ldquo;{candidate.vyktor_assessment}&rdquo;
                    </div>
                  </div>

                  {/* Weakness warning */}
                  <div style={{
                    marginTop: '10px',
                    padding: '6px 10px',
                    background: 'rgba(255,100,100,0.05)',
                    border: '1px solid rgba(255,100,100,0.15)',
                    borderRadius: '2px',
                  }}>
                    <span style={{
                      fontSize: '9px',
                      color: 'rgba(255,150,150,0.6)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}>
                      RISK —{' '}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: 'rgba(255,150,150,0.7)',
                      fontStyle: 'italic',
                    }}>
                      {candidate.weakness}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom confirm bar */}
      <div style={{
        flexShrink: 0,
        padding: isDense ? '6px 16px' : '16px 48px',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(8,6,4,0.98)',
      }}>
        <div style={{
          fontSize: '11px',
          color: 'rgba(201,168,76,0.5)',
          fontStyle: 'italic',
        }}>
          {isReshuffle
            ? (allSelected
              ? 'Replacement selected. Public trust will decline.'
              : 'Select a replacement minister.')
            : (allSelected
              ? 'Cabinet is complete. These appointments cannot be undone easily.'
              : `${ministries.length - selectedCount} ministries still need appointments.`)
          }
        </div>
        <button
          onClick={handleConfirm}
          disabled={!allSelected}
          style={{
            background: allSelected
              ? (isReshuffle ? '#c0392b' : '#c9a84c')
              : 'rgba(201,168,76,0.2)',
            color: allSelected ? '#fff' : 'rgba(201,168,76,0.4)',
            border: 'none',
            padding: isDense ? '8px 22px' : '12px 36px',
            fontFamily: 'Georgia, serif',
            fontSize: isDense ? '12px' : '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: allSelected ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          {isReshuffle ? 'Confirm Reshuffle →' : 'Confirm Cabinet →'}
        </button>
      </div>
    </div>
  )
}
