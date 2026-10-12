import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useChainStore } from '../stores/chainStore'
import { getAvailableLetters, generateLetterContent, createSentLetter, LETTER_OPTIONS } from '../engine/LetterEngine'
import type { LetterTone } from '../types/gameState'
import { Z } from '../constants/zIndex'
import { DocumentSeal, SignatureLine } from './ui/StateDocument'

/** Time for the signature to write in before the letter is sent. */
const SIGN_BEFORE_SEND_MS = 1000

const TONES: { value: LetterTone; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Measured, official, the voice of the Chancellor.' },
  { value: 'personal', label: 'Personal', description: 'Warm, direct, the voice of Katerin.' },
  { value: 'threatening', label: 'Direct', description: 'Blunt, unambiguous, no room for misinterpretation.' },
  { value: 'conciliatory', label: 'Conciliatory', description: 'Gentle, diplomatic, seeking common ground.' },
]

export default function LetterView({ onClose }: { onClose: () => void }) {
  const gameState = useGameStore()
  const { currentWeek } = gameState
  const actualIds = gameState.sentLetters.map(l => {
    const opt = LETTER_OPTIONS.find(o => l.title === o.title)
    return opt?.id ?? ''
  }).filter(Boolean)

  const available = getAvailableLetters(
    currentWeek, gameState.personal.marriageHealth, gameState.personal.lioraRelationship,
    gameState.factions.halvekists, gameState.factions.workersCoalition, gameState.nation.economyHealth,
    gameState.sorenFilesRevealed, actualIds,
  )

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedTone, setSelectedTone] = useState<LetterTone>('personal')
  const [preview, setPreview] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [sent, setSent] = useState(false)

  const opt = LETTER_OPTIONS.find(o => o.id === selectedLetter)

  const handlePreview = () => {
    if (!opt) return
    const { body } = generateLetterContent(opt.recipient, selectedTone, currentWeek)
    setPreview(body)
  }

  const handleSend = () => {
    if (!opt || isSigning) return
    // Sign first, then send once the signature has written in.
    setIsSigning(true)
    setTimeout(() => {
      const letter = createSentLetter(opt, selectedTone, currentWeek)
      useGameStore.getState().sendLetter(letter)
      useChainStore.getState().schedule(
        [{ targetNodeId: opt.responseSceneId, delayWeeks: 1 }],
        currentWeek, opt.id, 'letter_system',
      )
      setSent(true)
      setTimeout(onClose, 2000)
    }, SIGN_BEFORE_SEND_MS)
  }

  if (sent) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: Z.overlay, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#f5f0e8', padding: '2rem 3rem', maxWidth: '500px', textAlign: 'center', border: '4px double #8a621c' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#4a3520', marginBottom: '0.5rem' }}>Letter Sent</p>
          <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', color: '#6b5030', fontStyle: 'italic' }}>Your letter to {opt?.recipient} will arrive in one week.</p>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: Z.overlay, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1815', border: '1px solid rgba(200,144,42,0.3)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--amber)' }}>Compose a Letter</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(200,144,42,0.2)', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {!selectedLetter ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', marginBottom: '0.8rem' }}>Choose a recipient:</p>
              {available.length === 0 ? (
                <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>No letters are available to write at this time. Check back as events unfold.</p>
              ) : (
                available.map(o => (
                  <button key={o.id} onClick={() => setSelectedLetter(o.id)} style={{
                    display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: '1px solid var(--border)', padding: '0.6rem 0.8rem', marginBottom: '0.4rem', cursor: 'pointer', color: 'var(--cream)',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase' }}>{o.title}</div>
                    <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.7rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>{o.prompt.slice(0, 120)}...</div>
                  </button>
                ))
              )}
            </div>
          ) : preview ? (
            <div data-testid="letter-preview" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem clamp(1rem, 5vw, 2rem)', scrollbarWidth: 'thin', background: '#f5f0e8' }}>
              {/* Personal letters go out as Katerin, not under the state seal. */}
              {selectedTone !== 'personal' && <DocumentSeal size={40} />}
              <div style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.95rem', color: '#3a2510', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                {preview}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <SignatureLine isSigned={isSigning} caption={selectedTone === 'personal' ? 'Katerin Ashavel' : 'Office of the Chancellor'} width={220} height={90} />
              </div>
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #c8b898', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPreview(null)} disabled={isSigning} style={{ background: 'none', border: '1px solid #8a6a3a', color: '#5a3a10', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 0.8rem', cursor: isSigning ? 'default' : 'pointer' }}>← Edit</button>
                <button onClick={handleSend} disabled={isSigning} style={{ background: '#8a6a3a', border: 'none', color: '#f5f0e8', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1.2rem', cursor: isSigning ? 'default' : 'pointer', letterSpacing: '0.1em' }}>SIGN &amp; SEND</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.65rem', color: 'var(--amber)', marginBottom: '0.3rem' }}>{opt?.title}</p>
              <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.8rem' }}>{opt?.prompt}</p>

              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Choose Tone:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                {TONES.map(t => (
                  <label key={t.value} onClick={() => setSelectedTone(t.value)} style={{
                    display: 'flex', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer',
                    border: selectedTone === t.value ? '1px solid var(--amber)' : '1px solid transparent',
                    background: selectedTone === t.value ? 'var(--amber-glow)' : 'transparent',
                  }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: selectedTone === t.value ? '2px solid var(--amber)' : '2px solid var(--muted)', marginTop: '1px', flexShrink: 0 }}>
                      {selectedTone === t.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', margin: '2px' }} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: selectedTone === t.value ? 'var(--amber)' : 'var(--cream)' }}>{t.label}</div>
                      <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.6rem', color: 'var(--muted)', fontStyle: 'italic' }}>{t.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelectedLetter(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>← Back</button>
                <button onClick={handlePreview} style={{ background: 'var(--amber)', border: 'none', color: 'var(--ink)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1.2rem', cursor: 'pointer', letterSpacing: '0.1em', fontWeight: 'bold' }}>PREVIEW LETTER</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
