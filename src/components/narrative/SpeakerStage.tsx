// The character on stage during a conversation (Suzerain-style S04 layout):
// a large portrait of whoever spoke last, standing in the scene to the left
// of the text column, with a name and role plate. Crossfades on speaker change.
// Katerin never appears; the player is the camera.
import { AnimatePresence, motion } from 'framer-motion'
import { getPortrait } from '../../assets/potraits'
import { Z } from '../../constants/zIndex'
import { charName, speakerColor, speakerRole } from './speakers'

interface SpeakerStageProps {
  speakerId: string | null
  isPhone: boolean
  /** Desktop: the right edge of the stage, i.e. where the text column begins. */
  rightInset: string
  /** Phone: the top of the text column; the stage fills the band above it. */
  phoneBottom: string
}

export default function SpeakerStage({ speakerId, isPhone, rightInset, phoneBottom }: SpeakerStageProps) {
  const region: React.CSSProperties = isPhone
    ? { top: 124, left: 0, right: 0, bottom: phoneBottom }
    // bottom clears the scene's footer bar (Save / Menu)
    : { top: 96, left: 96, right: rightInset, bottom: 56 }

  return (
    <div
      data-testid="speaker-stage"
      style={{
        position: 'fixed',
        ...region,
        zIndex: Z.sceneBackdrop,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isPhone ? 'center' : 'flex-end',
      }}
    >
      <AnimatePresence mode="wait">
        {speakerId && (
          <motion.figure
            key={speakerId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              margin: 0,
              height: isPhone ? '100%' : 'min(70vh, 100%)',
              aspectRatio: '1 / 1.08',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Portrait speakerId={speakerId} />
            <NamePlate speakerId={speakerId} isPhone={isPhone} />
          </motion.figure>
        )}
      </AnimatePresence>
    </div>
  )
}

function Portrait({ speakerId }: { speakerId: string }) {
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

function NamePlate({ speakerId, isPhone }: { speakerId: string; isPhone: boolean }) {
  const role = speakerRole(speakerId)
  return (
    <figcaption
      data-testid="speaker-plate"
      style={{
        flexShrink: 0,
        marginTop: '-28px',
        position: 'relative',
        padding: isPhone ? '4px 14px' : '8px 22px',
        background: 'rgba(7,6,5,0.85)',
        borderTop: `2px solid ${speakerColor(speakerId)}`,
        textAlign: 'center',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: isPhone ? '15px' : '20px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: speakerColor(speakerId),
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
