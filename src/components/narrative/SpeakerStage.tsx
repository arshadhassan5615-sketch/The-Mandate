// The characters on stage during a conversation (Suzerain-style S04 layout):
// a large portrait of whoever is speaking, standing in the scene to the left of
// the text column, with a name and role plate. When two people are trading
// lines (ministers arguing), both stand on stage facing each other: the one
// speaking now is lit, the other waits dimmed. Katerin never appears; the
// player is the camera.
import { AnimatePresence, motion } from 'framer-motion'
import { getPortrait } from '../../assets/potraits'
import { Z } from '../../constants/zIndex'
import { charName, speakerColor, speakerRole } from './speakers'

interface SpeakerStageProps {
  /** On stage, speaking now first; at most two. */
  speakerIds: string[]
  isPhone: boolean
  /** Desktop: the right edge of the stage, i.e. where the text column begins. */
  rightInset: string
  /** Phone: the top of the text column; the stage fills the band above it. */
  phoneBottom: string
}

export default function SpeakerStage({ speakerIds, isPhone, rightInset, phoneBottom }: SpeakerStageProps) {
  const region: React.CSSProperties = isPhone
    ? { top: 60, left: 0, right: 0, bottom: phoneBottom }
    : { top: 76, left: 24, right: rightInset, bottom: 24 }
  const [current, other] = speakerIds
  const isDuel = !!other
  // Keep each person on the same side for the whole exchange: order by id so a
  // reply swaps who is lit, not where people stand.
  const placed = isDuel ? [...speakerIds].sort() : speakerIds

  return (
    <div
      data-testid="speaker-stage"
      data-duel={isDuel || undefined}
      style={{
        position: 'fixed',
        ...region,
        zIndex: Z.sceneBackdrop,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isPhone ? 'center' : 'flex-end',
        gap: isDuel ? (isPhone ? '4px' : '2%') : 0,
      }}
    >
      <AnimatePresence initial={false}>
        {placed.map((id, i) => {
          const isLit = id === current
          return (
            <motion.figure
              key={id}
              data-testid="speaker-figure"
              data-speaking={isLit}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: isLit ? 1 : 0.55, y: 0, scale: isDuel && !isLit ? 0.92 : 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                margin: 0,
                height: isPhone ? '100%' : `min(${isDuel ? 64 : 70}vh, 100%)`,
                aspectRatio: '1 / 1.08',
                maxWidth: isDuel ? '49%' : '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transformOrigin: 'bottom center',
                filter: isLit ? 'none' : 'grayscale(0.5) brightness(0.7)',
              }}
            >
              {/* In a duel the left figure faces right and the right one faces left */}
              <Portrait speakerId={id} mirror={isDuel && i === 1} />
              <NamePlate speakerId={id} isPhone={isPhone} isLit={isLit} />
            </motion.figure>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function Portrait({ speakerId, mirror }: { speakerId: string; mirror: boolean }) {
  const img = getPortrait(speakerId)
  const name = charName(speakerId)
  // Square studio portraits: fade every edge into the scene (strongest at the
  // bottom) so the figure reads as standing in it rather than as a framed photo.
  const fade = 'radial-gradient(ellipse 60% 72% at 50% 44%, black 52%, transparent 100%)'
  return (
    <div style={{ flex: 1, minHeight: 0, aspectRatio: '1 / 1', maxWidth: '100%', position: 'relative' }}>
      {img ? (
        <img
          src={img}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            maskImage: fade,
            WebkitMaskImage: fade,
            transform: mirror ? 'scaleX(-1)' : undefined,
            filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.6))',
          }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', Georgia, serif", fontSize: '64px', color: 'rgba(201,168,76,0.5)',
        }}>
          {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function NamePlate({ speakerId, isPhone, isLit }: { speakerId: string; isPhone: boolean; isLit: boolean }) {
  const role = speakerRole(speakerId)
  return (
    <figcaption
      data-testid="speaker-plate"
      style={{
        flexShrink: 0,
        marginTop: '-28px',
        position: 'relative',
        padding: isPhone ? '4px 12px' : '8px 22px',
        background: 'rgba(7,6,5,0.85)',
        borderTop: `2px solid ${isLit ? speakerColor(speakerId) : 'rgba(181,154,94,0.3)'}`,
        textAlign: 'center',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        maxWidth: '100%',
      }}
    >
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: isPhone ? '14px' : '20px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: speakerColor(speakerId),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {charName(speakerId)}
      </div>
      {role && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: isPhone ? '9px' : '11px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginTop: '2px',
        }}>
          {role}
        </div>
      )}
    </figcaption>
  )
}
