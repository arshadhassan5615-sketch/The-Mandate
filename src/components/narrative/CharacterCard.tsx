import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { getPortrait } from '../../assets/potraits'
import { Z } from '../../constants/zIndex'
import type { CharacterCardData } from './characterCardData'
import { initialsFor } from './initials'
import { rem } from '../../constants/typography'

const CARD_WIDTH = 280
const CARD_GAP = 12
// Rough rendered height, used only until the card has been measured after mount.
const CARD_ESTIMATED_HEIGHT = 170
const VIEWPORT_MARGIN = 8
const PORTRAIT_SIZE = 52
const ENTRANCE_SECONDS = 0.12
const DESCRIPTION_MAX_LINES = 3

const GOLD = 'rgba(201,168,76,0.45)'

const CARD_STYLE: CSSProperties = {
  zIndex: Z.sceneTop,
  pointerEvents: 'none',
  width: CARD_WIDTH,
  boxSizing: 'border-box',
  background: 'rgba(12,11,10,0.96)',
  border: `1px solid ${GOLD}`,
  borderRadius: 3,
  boxShadow: '0 10px 28px rgba(0,0,0,0.65)',
  padding: 12,
}

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const PORTRAIT_FRAME_STYLE: CSSProperties = {
  width: PORTRAIT_SIZE,
  height: PORTRAIT_SIZE,
  flexShrink: 0,
  borderRadius: '50%',
  overflow: 'hidden',
  border: `1px solid ${GOLD}`,
  background: 'rgba(201,168,76,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const PORTRAIT_IMAGE_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center top',
  display: 'block',
}

const INITIALS_STYLE: CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontWeight: 600,
  fontSize: rem(18),
  color: '#c9a84c',
}

const NAME_STYLE: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 700,
  fontSize: rem(16),
  color: '#f0d896',
  lineHeight: 1.2,
}

const TITLE_STYLE: CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontStyle: 'italic',
  fontSize: rem(13),
  color: 'rgba(230,215,185,0.8)',
  lineHeight: 1.3,
  marginTop: 2,
}

const FACTION_STYLE: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: rem(9),
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.75)',
  marginTop: 4,
}

const PILL_WRAPPER_STYLE: CSSProperties = {
  marginTop: 10,
}

const PILL_STYLE: CSSProperties = {
  display: 'inline-block',
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: rem(13),
  padding: '3px 10px',
  borderRadius: 999,
  border: `1px solid ${GOLD}`,
  color: '#e8dcc0',
}

const DESCRIPTION_STYLE: CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: rem(13),
  lineHeight: 1.4,
  color: 'rgba(225,210,180,0.75)',
  marginTop: 8,
  marginBottom: 0,
  display: '-webkit-box',
  WebkitLineClamp: DESCRIPTION_MAX_LINES,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

interface CharacterCardProps {
  data: CharacterCardData
  anchor: DOMRect
  /** Optional DOM id, so a focused control can point aria-describedby at the open card. */
  id?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

// To the right of the anchor; flipped to its left when that would overflow the
// viewport. Opens downward from the anchor top; flipped to sit above the anchor
// when its height would overflow the viewport bottom. Both axes are clamped.
function cardPosition(anchor: DOMRect, height: number): CSSProperties {
  const rightOfAnchor = anchor.right + CARD_GAP
  const fitsOnRight = rightOfAnchor + CARD_WIDTH <= window.innerWidth - VIEWPORT_MARGIN
  const preferredLeft = fitsOnRight ? rightOfAnchor : anchor.left - CARD_GAP - CARD_WIDTH
  const maxLeft = window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN
  const fitsBelow = anchor.top + height <= window.innerHeight - VIEWPORT_MARGIN
  const preferredTop = fitsBelow ? anchor.top : anchor.top - CARD_GAP - height
  const maxTop = window.innerHeight - height - VIEWPORT_MARGIN
  return {
    position: 'fixed',
    left: clamp(preferredLeft, VIEWPORT_MARGIN, maxLeft),
    top: clamp(preferredTop, VIEWPORT_MARGIN, maxTop),
  }
}

function CardPortrait({ id, name }: { id: string; name: string }) {
  const portrait = getPortrait(id)
  return (
    <div style={PORTRAIT_FRAME_STYLE}>
      {portrait
        ? <img src={portrait} alt="" style={PORTRAIT_IMAGE_STYLE} />
        : <span aria-hidden="true" style={INITIALS_STYLE}>{initialsFor(name)}</span>}
    </div>
  )
}

export default function CharacterCard({ data, anchor, id }: CharacterCardProps) {
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  // The rendered height, measured once mounted so placement uses the real card rather than an estimate.
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)

  // Runs before paint, so the first visible frame already uses the measured height.
  useLayoutEffect(() => {
    const height = cardRef.current?.getBoundingClientRect().height ?? 0
    if (height > 0) setMeasuredHeight(height)
  }, [anchor, data])

  return createPortal(
    <motion.div
      ref={cardRef}
      id={id}
      role="tooltip"
      data-testid="character-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : ENTRANCE_SECONDS }}
      style={{ ...CARD_STYLE, ...cardPosition(anchor, measuredHeight ?? CARD_ESTIMATED_HEIGHT) }}
    >
      <div style={ROW_STYLE}>
        <CardPortrait id={data.id} name={data.name} />
        <div style={{ minWidth: 0 }}>
          <div style={NAME_STYLE}>{data.name}</div>
          <div style={TITLE_STYLE}>{data.title}</div>
          {data.faction && <div style={FACTION_STYLE}>{data.faction}</div>}
        </div>
      </div>
      <div style={PILL_WRAPPER_STYLE}>
        <span style={PILL_STYLE}>{data.relationship}</span>
      </div>
      <p style={DESCRIPTION_STYLE}>{data.description}</p>
    </motion.div>,
    document.body,
  )
}
