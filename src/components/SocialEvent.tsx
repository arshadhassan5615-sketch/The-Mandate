import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NarrativeSegment, SceneChoice, SocialInteraction } from '../types/narrative'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { evaluateAll } from '../engine/conditionEvaluator'
import { playStamp } from '../engine/audioEngine'
import {
  getCharacterPortrait,
  getCharacterColor,
} from './portraits/CharacterPortraits'
import { getPortrait } from '../assets/potraits'

// ─── Character display names ─────────────────────────────────────────────────
const CHAR_NAMES: Record<string, string> = {
  vyktor_reznik: 'Vyktor Reznik',
  jonas_ashavel: 'Jonas Ashavel',
  drazen_kolvar: 'Dražen Kolvar',
  stanislov_renek: 'Archbishop Renek',
  soraya_khaled: 'Soraya Khaled',
  lucan_vael: 'Lucan Vael',
  nadia_voss: 'Nadia Voss',
  oskar_brenner: 'Gen. Brenner',
  harrison_cole: 'Amb. Harrison Cole',
  yevgeni_stahl: 'Commissar Stahl',
  elara_vostane: 'Elara Vostane',
  irina_dusek: 'Col. Irina Dusek',
  liora_ashavel: 'Liora Ashavel',
  tomas_ashavel: 'Tomas Ashavel',
  maren_tovik:   'Maren Tovik',
  viktor_dorne:  'Viktor Dorne',
  elena_braskov: 'Elena Braskov',
}

function charName(id: string): string {
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

// ─── Event atmosphere configuration ──────────────────────────────────────────
const EVENT_ATMOSPHERES: Record<string, { bg: string; accent: string; vignette: string; headerBg: string }> = {
  social_inaugural_ball_wk1: {
    bg: 'radial-gradient(ellipse at 50% 30%, #2a2318 0%, #1a1510 40%, #0f0b06 100%)',
    accent: '#c8902a',
    vignette: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
    headerBg: 'rgba(200,144,42,0.08)',
  },
  social_autumn_festival_wk18: {
    bg: 'radial-gradient(ellipse at 50% 40%, #2d1f0e 0%, #1a1410 40%, #0f0b06 100%)',
    accent: '#c4782a',
    vignette: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)',
    headerBg: 'rgba(196,120,42,0.08)',
  },
  social_state_dinner_wk24: {
    bg: 'radial-gradient(ellipse at 50% 20%, #1a2740 0%, #111820 40%, #0a0d14 100%)',
    accent: '#5a7a9c',
    vignette: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
    headerBg: 'rgba(90,122,156,0.08)',
  },
  social_independence_parade_wk36: {
    bg: 'radial-gradient(ellipse at 50% 20%, #2a3538 0%, #1a1f22 40%, #0f1214 100%)',
    accent: '#7a8a6c',
    vignette: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.65) 100%)',
    headerBg: 'rgba(122,138,108,0.08)',
  },
}

// ─── Interaction display names ───────────────────────────────────────────────
const INTERACTION_TITLES: Record<string, string> = {
  ball_toast: 'The Toast',
  ball_jonas: 'Jonas at the Bar',
  ball_kolvar: "Kolvar's Approach",
  ball_renek: "The Archbishop's Blessing",
  ball_foreign: 'The Foreign Table',
  ball_soraya: "Soraya's Corner",
  ball_vael: "Vael's Invitation",
  ball_nadia: "Nadia's Question",
  ball_brenner: "General Brenner's Salute",
  ball_dance: 'The Dance',
  festival_speech: 'The Festival Speech',
  festival_renek: 'The Church Booth',
  festival_soraya: "The Workers' March",
  festival_dravenni: 'The Dravenni Performance',
  festival_vael: "Vael's Banners",
  festival_citizens: 'Street Conversations',
  dinner_seating: 'The Seating Arrangement',
  dinner_toast: 'The Toast',
  dinner_cole: "Cole's Proposal",
  dinner_stahl: "Stahl's Demand",
  dinner_jonas: 'Jonas at Dinner',
  dinner_private: 'The After-Dinner Meeting',
  parade_theme: 'The Parade Theme',
  parade_citizens: 'The Crowd',
  parade_brenner: "Brenner's Officers",
  parade_assassination: 'Security Incident',
  parade_family: 'Family at the Parade',
  parade_tyvaren: 'Tyvaren Message',
}

// ─── Segment renderer ────────────────────────────────────────────────────────
function Segment({ seg }: { seg: NarrativeSegment }) {
  if (seg.type === 'dialogue') {
    const id = seg.character ?? ''
    const name = charName(id)
    const color = getCharacterColor(id)
    return (
      <div style={{ marginBottom: '1.2em' }}>
        <div style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.65rem', letterSpacing: '0.16em',
          textTransform: 'uppercase', color,
          marginBottom: '0.2em',
        }}>
          {name}
        </div>
        <p style={{ color: 'var(--cream)', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>
          "{seg.text}"
        </p>
      </div>
    )
  }
  if (seg.type === 'internal_thought') {
    return (
      <p style={{
        fontStyle: 'italic', color: 'var(--muted)',
        borderLeft: '2px solid var(--border)',
        paddingLeft: '1rem', marginBottom: '1.2em',
        lineHeight: 1.75, fontFamily: 'var(--font-body)',
      }}>
        {seg.text}
      </p>
    )
  }
  return (
    <p style={{
      color: 'var(--cream)', lineHeight: 1.75,
      marginBottom: '1em', fontFamily: 'var(--font-body)',
      opacity: 0.9,
    }}>
      {seg.text}
    </p>
  )
}

// ─── Choice chip inside an interaction ───────────────────────────────────────
function ChoiceChip({ choice, disabled, onPick }: {
  choice: SceneChoice; disabled: boolean; onPick: (id: string) => void
}) {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setClicked(true)
    setTimeout(() => {
      onPick(choice.id)
      setClicked(false)
    }, 150)
  }

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '0.7rem 1rem',
        marginBottom: '0.4rem',
        background: clicked
          ? 'rgba(200,144,42,0.18)'
          : disabled
          ? 'rgba(200,144,42,0.03)'
          : 'rgba(200,144,42,0.06)',
        border: clicked
          ? '1px solid rgba(200,144,42,0.6)'
          : '1px solid var(--border)',
        borderRadius: '2px',
        color: disabled ? 'var(--muted)' : clicked ? '#ffffff' : 'var(--cream)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.82rem',
        lineHeight: 1.6,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        transform: clicked ? 'scale(0.97)' : 'scale(1)',
        boxShadow: clicked ? '0 0 16px rgba(200,144,42,0.3)' : 'none',
        animation: clicked ? 'choice-glow-burst 0.4s ease-out' : 'none',
      }}
    >
      {choice.text}
    </button>
  )
}

// ─── Portrait circle ─────────────────────────────────────────────────────────
function PortraitCircle({ characterId, label, onClick, dimmed, visited }: {
  characterId: string; label: string; onClick?: () => void; dimmed?: boolean; visited?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = getPortrait(characterId)
  const PortraitFC = getCharacterPortrait(characterId)
  const color = getCharacterColor(characterId)

  function renderContent() {
    if (imgSrc && !imgError) {
      return (
        <img
          src={imgSrc}
          alt={label}
          onError={() => setImgError(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            display: 'block',
            filter: visited ? 'grayscale(0.8)' : 'none',
            transition: 'filter 0.2s',
          }}
        />
      )
    }
    if (PortraitFC) return <PortraitFC />
    return null
  }

  return (
    <motion.div
      whileHover={onClick && !visited ? { scale: 1.08 } : {}}
      onClick={onClick && !visited ? onClick : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
        opacity: dimmed ? 0.4 : 1,
        cursor: onClick && !visited ? 'pointer' : 'default',
        transition: 'opacity 0.3s',
      }}
    >
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
        border: `3px solid ${visited ? 'var(--amber-dim)' : color}`,
        boxShadow: visited ? 'none' : `0 0 12px ${color}44`,
        position: 'relative',
      }}>
        {renderContent()}
        {visited && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Special Elite', monospace",
            fontSize: '1.2rem', color: 'var(--amber)',
          }}>
            ✓
          </div>
        )}
      </div>
      <span style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.52rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color, textAlign: 'center', maxWidth: '90px',
      }}>
        {label}
      </span>
    </motion.div>
  )
}

// ─── Main layout ─────────────────────────────────────────────────────────────
export default function SocialEvent() {
  const { currentScene } = useNarrativeStore()
  const gameState = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const { advanceQueue } = useWeekStore()

  // Currently open interaction (null = room view)
  const [activeInteraction, setActiveInteraction] = useState<SocialInteraction | null>(null)
  // IDs of completed interactions
  const [visitedIds, setVisitedIds] = useState<string[]>([])
  // Whether the current interaction's choice has been made
  const [interactionResolved, setInteractionResolved] = useState(false)

  const scene = currentScene
  const interactions = scene?.socialInteractions ?? []
  const eventId = scene?.id ?? ''
  const atmosphere = EVENT_ATMOSPHERES[eventId] ?? EVENT_ATMOSPHERES.social_inaugural_ball_wk1

  // Find mandatory interaction (the toast)
  const mandatoryInteraction = interactions.find(i => i.mandatory)

  // Map of mutually exclusive interactions
  const exclusivePairs = useMemo(() => {
    const map: Record<string, string> = {}
    for (const i of interactions) {
      if (i.mutualExclusive) {
        map[i.id] = i.mutualExclusive
        map[i.mutualExclusive] = i.id
      }
    }
    return map
  }, [interactions])

  // Unavailable interactions (mutual exclusive partner was chosen)
  const unavailableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const visited of visitedIds) {
      const partner = exclusivePairs[visited]
      if (partner) ids.add(partner)
    }
    return ids
  }, [visitedIds, exclusivePairs])

  const minimumReached = visitedIds.length >= 4

  // Force mandatory interaction first
  const canInteract = useCallback((interaction: SocialInteraction) => {
    if (visitedIds.includes(interaction.id)) return false
    if (unavailableIds.has(interaction.id)) return false
    if (mandatoryInteraction && !visitedIds.includes(mandatoryInteraction.id) && interaction.id !== mandatoryInteraction.id) {
      return false
    }
    return true
  }, [visitedIds, unavailableIds, mandatoryInteraction])

  const handleOpenInteraction = (interaction: SocialInteraction) => {
    if (!canInteract(interaction)) return
    setActiveInteraction(interaction)
    setInteractionResolved(false)
    playStamp()
  }

  const handleChoice = (choiceId: string) => {
    if (!activeInteraction) return
    const choice = activeInteraction.choices.find(c => c.id === choiceId)
    if (!choice) return

    gameState.applyModifiers(choice.stateChanges)
    if (choice.flags.length) {
      useNarrativeStore.getState().addFlags(choice.flags)
    }

    setInteractionResolved(true)
  }

  const handleCloseInteraction = () => {
    if (activeInteraction) {
      setVisitedIds(prev => [...prev, activeInteraction.id])
    }
    setActiveInteraction(null)
    setInteractionResolved(false)
  }

  const handleLeave = () => {
    advanceQueue()
  }

  // Get active interaction's available choices
  const availableChoices = useMemo(() => {
    if (!activeInteraction) return []
    return activeInteraction.choices.filter(c => {
      if (!c.conditions || c.conditions.length === 0) return true
      return evaluateAll(c.conditions, gameState, activeFlags)
    })
  }, [activeInteraction, gameState, activeFlags])

  if (!scene || !interactions.length) return null

  // Build character clusters for the room view
  // Group characters by interaction
  const interactionCharacters = useMemo(() => {
    const chars: Array<{ id: string; label: string; interactionId: string }> = []
    for (const inter of interactions) {
      if (inter.character) {
        chars.push({
          id: inter.character,
          label: charName(inter.character),
          interactionId: inter.id,
        })
      }
    }
    return chars
  }, [interactions])

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: atmosphere.bg, paddingTop: '48px', paddingRight: '60px' }}>
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: atmosphere.vignette, zIndex: 1 }} />

      {/* Location banner */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '0.6rem 2rem',
        background: atmosphere.headerBg,
        borderBottom: `1px solid ${atmosphere.accent}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: atmosphere.accent,
            marginBottom: '0.15rem',
          }}>
            {scene.title}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            color: 'var(--cream)',
            fontStyle: 'italic',
          }}>
            {scene.location}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.52rem',
            letterSpacing: '0.12em',
            color: 'var(--muted)',
          }}>
            Conversations: {visitedIds.length} of {Math.min(6, interactions.length)}
          </p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex relative" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {!activeInteraction ? (
            /* ─── ROOM VIEW ──────────────────────────────────────────────── */
            <motion.div
              key="room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
              style={{ padding: '2rem' }}
            >
              {/* Room description */}
              <div style={{
                maxWidth: '700px',
                textAlign: 'center',
                marginBottom: '2.5rem',
              }}>
                {scene.narrative.slice(0, 2).map((seg, i) => (
                  <p key={i} style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    color: 'var(--cream)',
                    lineHeight: 1.8,
                    marginBottom: '0.6em',
                    opacity: 0.9,
                  }}>
                    {seg.text}
                  </p>
                ))}
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.6rem',
                  letterSpacing: '0.12em',
                  color: atmosphere.accent,
                  marginTop: '1rem',
                }}>
                  Click a person below to speak with them · {6 - visitedIds.length} conversation{6 - visitedIds.length !== 1 ? 's' : ''} remaining
                </p>
              </div>

              {/* Character clusters */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '1.5rem',
                maxWidth: '800px',
              }}>
                {interactionCharacters.map(char => {
                  const inter = interactions.find(i => i.id === char.interactionId)!
                  const isAvailable = canInteract(inter)
                  const isVisited = visitedIds.includes(inter.id)
                  const isUnavailable = unavailableIds.has(inter.id)

                  return (
                    <PortraitCircle
                      key={char.interactionId}
                      characterId={char.id}
                      label={INTERACTION_TITLES[char.interactionId] ?? inter.title}
                      onClick={isAvailable ? () => handleOpenInteraction(inter) : undefined}
                      dimmed={!isAvailable && !isVisited}
                      visited={isVisited || isUnavailable}
                    />
                  )
                })}
              </div>

              {/* Leave button */}
              <div style={{ marginTop: '2.5rem' }}>
                <button
                  className="choice-btn"
                  onClick={handleLeave}
                  disabled={!minimumReached}
                  style={{
                    width: 'auto',
                    minWidth: '200px',
                    opacity: minimumReached ? 1 : 0.4,
                    cursor: minimumReached ? 'pointer' : 'not-allowed',
                    fontSize: '0.75rem',
                    padding: '0.6rem 1.5rem',
                  }}
                >
                  {minimumReached ? 'Leave the Event' : `Visit ${4 - visitedIds.length} more conversation${4 - visitedIds.length !== 1 ? 's' : ''} before leaving`}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ─── INTERACTION VIEW ───────────────────────────────────────── */
            <motion.div
              key={`inter-${activeInteraction.id}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}
            >
              <div style={{
                maxWidth: '780px',
                margin: '0 auto',
                padding: '2.5rem 2rem',
                width: '100%',
              }}>
                {/* Interaction header */}
                <div style={{ marginBottom: '2rem' }}>
                  <p style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.55rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: atmosphere.accent,
                    marginBottom: '0.4rem',
                  }}>
                    {activeInteraction.location}
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.3rem',
                    color: 'var(--cream)',
                    marginBottom: '0.3rem',
                  }}>
                    {activeInteraction.title}
                  </h2>
                  <div style={{ height: '1px', background: 'var(--border)', marginTop: '0.8rem' }} />
                </div>

                {/* Narrative segments */}
                <div style={{ marginBottom: '2rem' }}>
                  {activeInteraction.narrative.map((seg, i) => (
                    <Segment key={i} seg={seg} />
                  ))}
                </div>

                {/* Choices */}
                {!interactionResolved && (
                  <div style={{ marginTop: '1.5rem' }}>
                    {availableChoices.map(choice => (
                      <ChoiceChip
                        key={choice.id}
                        choice={choice}
                        disabled={false}
                        onPick={handleChoice}
                      />
                    ))}
                  </div>
                )}

                {/* Post-choice narrative */}
                {interactionResolved && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(200,144,42,0.04)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.88rem',
                      color: 'var(--cream)',
                      fontStyle: 'italic',
                      marginBottom: '1rem',
                    }}>
                      You have concluded this conversation.
                    </p>
                    <button
                      className="choice-btn"
                      onClick={handleCloseInteraction}
                      style={{ width: 'auto', minWidth: '180px', fontSize: '0.75rem', padding: '0.5rem 1.2rem' }}
                    >
                      Return to the Room
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
