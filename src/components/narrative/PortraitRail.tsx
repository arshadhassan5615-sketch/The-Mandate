import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPortrait } from '../../assets/potraits'
import { useGameStore } from '../../stores/gameStore'
import { charName, speakerRole } from './speakers'
import { medallionStates } from './medallionStates'
import type { MedallionState } from './medallionStates'
import CharacterCard from './CharacterCard'
import { characterCardData } from './characterCardData'
import type { CharacterCardData } from './characterCardData'
import { initialsFor } from './initials'

type RailLayout = 'column' | 'row'

interface PortraitRailProps {
  ids: string[]
  currentId: string | null
  layout: RailLayout
}

const SIZES: Record<RailLayout, { speaking: string | number; normal: string | number }> = {
  column: { speaking: 'var(--rail-big, 112px)', normal: 'var(--rail-small, 58px)' },
  row: { speaking: 46, normal: 32 },
}

const RAIL_STYLE: Record<RailLayout, CSSProperties> = {
  column: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 },
  row: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' },
}

const COLUMN_OVERLAP: CSSProperties = { marginTop: '-3px' }
const INITIALS_SCALE = 0.36
const COLUMN_BIG_INITIALS_FONT = 'calc(var(--rail-big, 112px) * 0.36)'
const COLUMN_SMALL_INITIALS_FONT = 'calc(var(--rail-small, 58px) * 0.36)'

const MEDALLION_BG = '#0a0806'
// Suzerain rims every portrait, the speaker included, in the same thin neutral grey.
const MEDALLION_RING = '#36373a'
const PRESENT_SHADOW = '0 0 0 1px rgba(150,150,150,0.45), 0 3px 8px rgba(0,0,0,0.65)'
const SPEAKING_SHADOW = '0 0 0 1px rgba(150,150,150,0.5), 0 6px 18px rgba(0,0,0,0.75)'
const GOLD = '#c9a84c'
const MEDALLION_EASE = 'cubic-bezier(0.16,1,0.3,1)'
const MEDALLION_TRANSITION = [
  `width 0.3s ${MEDALLION_EASE}`,
  `height 0.3s ${MEDALLION_EASE}`,
  'box-shadow 0.3s ease',
].join(', ')
const SPEAKER_POP_KEYFRAMES = '@keyframes speaker-pop { from { transform: scale(0.82) } to { transform: scale(1) } }'

function initialsFontSize(layout: RailLayout, isSpeaking: boolean, size: string | number): string | number {
  if (layout === 'column') {
    return isSpeaking ? COLUMN_BIG_INITIALS_FONT : COLUMN_SMALL_INITIALS_FONT
  }
  return `${Math.round(Number(size) * INITIALS_SCALE)}px`
}

function medallionStyle(state: MedallionState, size: string | number): CSSProperties {
  const base: CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: '50%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: MEDALLION_BG,
    opacity: 1,
    filter: 'none',
    transition: MEDALLION_TRANSITION,
  }

  if (state === 'speaking') {
    return {
      ...base,
      border: `3px solid ${MEDALLION_RING}`,
      boxShadow: SPEAKING_SHADOW,
      animation: `speaker-pop 0.35s ${MEDALLION_EASE}`,
    }
  }

  return {
    ...base,
    border: `2px solid ${MEDALLION_RING}`,
    boxShadow: PRESENT_SHADOW,
  }
}

function MedallionFace({ id, initialsFont }: { id: string; initialsFont: string | number }) {
  const portrait = getPortrait(id)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        background: MEDALLION_BG,
      }}
    >
      {portrait ? (
        <img
          src={portrait}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <div
          data-testid="portrait-initials"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontWeight: 600,
            color: GOLD,
            fontSize: initialsFont,
            background: 'rgba(201,168,76,0.15)',
          }}
        >
          {initialsFor(charName(id))}
        </div>
      )}
    </div>
  )
}

function labelFor(id: string): string {
  const role = speakerRole(id)
  return role ? `${charName(id)}, ${role}` : charName(id)
}

// Stable DOM id of a medallion's character card, referenced by the medallion's aria-describedby.
function cardIdFor(id: string): string {
  return `character-card-${id}`
}

interface HoveredMedallion {
  id: string
  data: CharacterCardData
  anchor: DOMRect
}

export default function PortraitRail({ ids, currentId, layout }: PortraitRailProps) {
  const [hovered, setHovered] = useState<HoveredMedallion | null>(null)
  const isCardShown = hovered !== null
  // Escape closes an open card. The listener exists only while a card is open.
  useEffect(() => {
    if (!isCardShown) return
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHovered(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isCardShown])
  if (ids.length === 0) return null

  const sizes = SIZES[layout]
  const states = medallionStates(ids, currentId)

  // Shows the character card for a medallion, or nothing when the id is not in the roster.
  const showCardFor = (id: string, element: HTMLElement) => {
    const data = characterCardData(id, useGameStore.getState())
    if (data) setHovered({ id, data, anchor: element.getBoundingClientRect() })
  }
  const hideCard = () => setHovered(null)
  // The card only stays up while its medallion is still in the rail.
  const visibleCard = hovered && ids.includes(hovered.id) ? hovered : null

  return (
    <div data-testid="portrait-rail" data-layout={layout}>
      <style>{SPEAKER_POP_KEYFRAMES}</style>
      <ul
        aria-label="In this meeting"
        style={{ listStyle: 'none', margin: 0, padding: 0, ...RAIL_STYLE[layout] }}
      >
        {ids.map((id, index) => {
          const state = states[id]
          const isSpeaking = state === 'speaking'
          const size = isSpeaking ? sizes.speaking : sizes.normal
          const label = labelFor(id)
          const overlap = layout === 'column' && index > 0 ? COLUMN_OVERLAP : undefined

          return (
            <li
              key={id}
              data-testid="portrait-medallion"
              data-speaking={isSpeaking ? 'true' : 'false'}
              data-state={state}
              aria-current={isSpeaking ? 'true' : undefined}
              aria-label={label}
              aria-describedby={visibleCard?.id === id ? cardIdFor(id) : undefined}
              tabIndex={0}
              onMouseEnter={e => showCardFor(id, e.currentTarget)}
              onMouseLeave={hideCard}
              onFocus={e => showCardFor(id, e.currentTarget)}
              onBlur={hideCard}
              style={{ ...medallionStyle(state, size), ...overlap }}
            >
              <MedallionFace id={id} initialsFont={initialsFontSize(layout, isSpeaking, size)} />
            </li>
          )
        })}
      </ul>
      {visibleCard && (
        <CharacterCard id={cardIdFor(visibleCard.id)} data={visibleCard.data} anchor={visibleCard.anchor} />
      )}
    </div>
  )
}
