import type { JSX } from 'react'
import { useLetterStore } from '../../stores/letterStore'
import { renderWithEntities } from '../news/EntityLinker'

const SEAL_SVGS: Record<string, JSX.Element> = {
  arcturian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#3a5a7c" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#3a5a7c" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#3a5a7c" fontFamily="serif" fontWeight="bold">ARCTURIAN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#3a5a7c" fontFamily="serif">COMMONWEALTH</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(58,90,124,0.5)" fontFamily="serif" fontStyle="italic">Est. 1804</text>
    </svg>
  ),
  orythian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#8b2e2e" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8b2e2e" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#8b2e2e" fontFamily="serif" fontWeight="bold">ORYTHIAN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#8b2e2e" fontFamily="serif">DOMINION</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(139,46,46,0.5)" fontFamily="serif" fontStyle="italic">For the People</text>
    </svg>
  ),
  lytheirian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#6a5a3a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#6a5a3a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#6a5a3a" fontFamily="serif" fontWeight="bold">REPUBLIC OF</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6a5a3a" fontFamily="serif">LYTHEIRA</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(106,90,58,0.5)" fontFamily="serif" fontStyle="italic">Liberté · Égalité</text>
    </svg>
  ),
  tyvaren: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#6a6a7a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#6a6a7a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#6a6a7a" fontFamily="serif" fontWeight="bold">TYVAREN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6a6a7a" fontFamily="serif">CONFEDERATION</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(106,106,122,0.5)" fontFamily="serif" fontStyle="italic">Strength Through Unity</text>
    </svg>
  ),
  asturien: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#9b7b3a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#9b7b3a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="7" fill="#9b7b3a" fontFamily="serif" fontWeight="bold">ASTURIEN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="6" fill="#9b7b3a" fontFamily="serif">FORUM</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(155,123,58,0.5)" fontFamily="serif" fontStyle="italic">Justice · Peace</text>
    </svg>
  ),
}

export default function DiplomaticLetterPanel() {
  const { letters, currentIndex, isOpen, setOpen, setIndex, markRead } = useLetterStore()

  const letter = letters[currentIndex]
  const total = letters.length

  const seal = letter ? SEAL_SVGS[letter.seal] ?? SEAL_SVGS.arcturian : null

  if (!isOpen || !letter) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)',
    }} onClick={() => setOpen(false)}>
      <div style={{
        width: '560px', maxHeight: '90vh',
        background: '#f5f0e8', color: '#1a1814',
        borderRadius: '3px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 6px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.1)',
        fontFamily: "'Crimson Text', serif",
        position: 'relative',
        overflow: 'hidden',
      }} onClick={e => { e.stopPropagation(); markRead(letter.id) }}>
        {/* Close */}
        <button onClick={() => setOpen(false)} style={{
          position: 'absolute', top: '12px', right: '16px',
          background: 'none', border: 'none', color: '#8a7060',
          cursor: 'pointer', fontSize: '1.2rem', padding: 0, lineHeight: 1, zIndex: 10,
        }}>✕</button>

        {/* Nav buttons — inside panel, circular */}
        {currentIndex > 0 && (
          <button onClick={() => setIndex(currentIndex - 1)} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.4)',
            color: '#c9a84c', cursor: 'pointer',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, fontSize: '0.8rem', fontWeight: 'bold',
          }}>◀</button>
        )}
        {currentIndex < total - 1 && (
          <button onClick={() => setIndex(currentIndex + 1)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.4)',
            color: '#c9a84c', cursor: 'pointer',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, fontSize: '0.8rem', fontWeight: 'bold',
          }}>▶</button>
        )}

        {/* Scrollable content */}
        <div style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '40px 48px',
          flex: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(192,176,144,0.3) transparent',
        }}>

        {/* Ministry header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ marginBottom: '6px' }}>{seal}</div>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.65rem', fontWeight: 600,
            letterSpacing: '0.14em', color: '#5a4a3a',
            textTransform: 'uppercase', margin: 0, lineHeight: 1.4,
          }}>
            {letter.ministry}
          </p>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.55rem', fontWeight: 700,
            letterSpacing: '0.12em', color: '#4a3a2a',
            margin: '2px 0 0', lineHeight: 1.3,
          }}>
            REPUBLIC OF VELTRIA
          </p>
        </div>

        {/* Source country — small caps styled */}
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '0.58rem', fontWeight: 600,
          letterSpacing: '0.2em', color: '#6a5040',
          textAlign: 'center', margin: '0 0 12px',
          textTransform: 'uppercase', fontVariantCaps: 'all-small-caps',
        }}>
          {letter.senderTitle}
        </p>

        {/* Headline */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.3rem', fontWeight: 700,
          color: '#1a1814', textAlign: 'center',
          margin: '0 0 8px', letterSpacing: '0.02em',
        }}>
          {letter.headline}
        </h2>

        {/* Divider */}
        <div style={{ height: '1px', background: '#c0b090', margin: '8px 0 16px' }} />

        {/* Body */}
        {letter.body.split('\n\n').map((para, i) => (
          <p key={i} style={{
            fontSize: '0.9rem', lineHeight: 1.7,
            color: '#2a2218', marginBottom: '12px',
            textAlign: 'justify',
          }}>
            {renderWithEntities(para)}
          </p>
        ))}

        {/* Sender signature */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#1a1814', fontStyle: 'italic', margin: 0 }}>
            {letter.sender}
          </p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: '#8a7060', margin: '2px 0 0', letterSpacing: '0.06em' }}>
            {letter.senderTitle}
          </p>
        </div>

        {/* Bottom seal */}
        <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.25 }}>
          {seal}
        </div>

        {/* Page counter — bottom right */}
        <div style={{ textAlign: 'right', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(192,176,144,0.25)' }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: '#8a7060',
            letterSpacing: '0.08em',
          }}>
            {currentIndex + 1} / {total}
          </span>
        </div>

        </div>{/* end scrollable content */}
      </div>
    </div>
  )
}
