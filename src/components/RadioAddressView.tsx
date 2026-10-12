import { useState, useEffect, useRef, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { getRadioResult, MAX_BROADCASTS, type RadioTheme } from '../engine/RadioEngine'
import { Z } from '../constants/zIndex'

const THEME_OPTIONS: { value: RadioTheme; label: string; desc: string }[] = [
  { value: 'unity_calm', label: 'Unity & Calm', desc: '+10 public order, +5 public image. Best during crises.' },
  { value: 'reform_progress', label: 'Reform & Progress', desc: '+10 reformists, +5 public image. Best before votes.' },
  { value: 'strength_security', label: 'Strength & Security', desc: '+10 iron covenant, +10 military. Best during Tyvaren threats.' },
  { value: 'accountability_truth', label: 'Accountability & Truth', desc: '+10 press freedom, +10 reformists. Best after scandals.' },
  { value: 'personal_appeal', label: 'Personal Appeal', desc: '+10 public image, +5 marriage. Best when image is low.' },
]

export default function RadioAddressView({ onClose }: { onClose: () => void }) {
  const { factions, radioBroadcastsUsed } = useGameStore()
  const { applyModifiers } = useGameStore()
  const phase = useWeekStore(s => s.phase)
  const advanceQueue = useWeekStore(s => s.advanceQueue)

  const remaining = MAX_BROADCASTS - radioBroadcastsUsed
  const [step, setStep] = useState<'select' | 'preview' | 'broadcasting' | 'done'>('select')
  const [theme, setTheme] = useState<RadioTheme>('unity_calm')
  const [typingIndex, setTypingIndex] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const result = useMemo(() => getRadioResult(theme, radioBroadcastsUsed, factions), [theme, radioBroadcastsUsed, factions])

  const fullSpeech = `${result.speechIntro}\n\n${result.speechBody}\n\n${result.speechClosing}`

  useEffect(() => {
    if (step === 'broadcasting') {
      setTypingIndex(0)
      let i = 0
      intervalRef.current = window.setInterval(() => {
        i++
        setTypingIndex(i)
        if (i >= fullSpeech.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }, 25)
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }
  }, [step, fullSpeech.length])

  const handleTransmit = () => {
    setStep('broadcasting')
    useGameStore.getState().useRadioBroadcast(theme)
    if (result.modifiers.length > 0) {
      applyModifiers(result.modifiers as { stat: string; operation: 'add' | 'set' | 'multiply'; value: number }[])
    }
  }

  const dismissRadio = () => {
    onClose()
    if (phase === 'scene') {
      setTimeout(() => advanceQueue(), 100)
    }
  }

  if (remaining <= 0 && step === 'select') {
    return (
      <div onClick={dismissRadio} style={{ position: 'fixed', inset: 0, zIndex: Z.overlay, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#1a1815', border: '1px solid var(--accent-red)', padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.7rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>No Broadcasts Remaining</p>
          <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            You have used all {MAX_BROADCASTS} of your national radio addresses. The people have heard from you enough. More broadcasts would only dilute your message.
          </p>
          <button onClick={dismissRadio} style={{ marginTop: '1rem', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1rem', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <div onClick={step === 'done' ? dismissRadio : undefined} style={{ position: 'fixed', inset: 0, zIndex: Z.overlay, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {step === 'select' && (
          <div style={{ background: '#1a1815', border: '1px solid var(--border)', padding: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 8px var(--accent-red)' }} />
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--accent-red)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>LIVE BROADCAST — VNN Radio</span>
            </div>

            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--amber)', marginBottom: '0.3rem' }}>
              Address the Nation
            </p>
            <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.8rem' }}>
              Remaining broadcasts: {remaining} of {MAX_BROADCASTS}. Each subsequent broadcast has 30% less impact. Choose your moment and your message.
            </p>

            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Message Theme</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
              {THEME_OPTIONS.map(t => (
                <label key={t.value} onClick={() => setTheme(t.value)} style={{
                  padding: '0.4rem 0.6rem', cursor: 'pointer',
                  border: theme === t.value ? '1px solid var(--amber)' : '1px solid transparent',
                  background: theme === t.value ? 'var(--amber-glow)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: theme === t.value ? '2px solid var(--amber)' : '2px solid var(--muted)', flexShrink: 0 }}>
                      {theme === t.value && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--amber)', margin: '2px' }} />}
                    </div>
                    <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', color: theme === t.value ? 'var(--amber)' : 'var(--cream)' }}>{t.label}</span>
                  </div>
                  <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.6rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '1px', marginLeft: '1.1rem' }}>{t.desc}</div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={dismissRadio} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setStep('preview')} style={{ background: 'var(--amber)', border: 'none', color: 'var(--ink)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.08em' }}>PREVIEW SPEECH</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div style={{ background: '#1a1815', border: '1px solid var(--border)', padding: '1.2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-red)' }} />
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--accent-red)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>SPEECH MANUSCRIPT — VNN Radio</span>
            </div>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {result.label} — Broadcast #{radioBroadcastsUsed + 1} of {MAX_BROADCASTS} ({(result.multiplier * 100).toFixed(0)}% effectiveness)
            </p>
            <div style={{ overflowY: 'auto', flex: 1, background: '#f5f0e8', padding: '1.5rem 2rem', fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.95rem', color: '#3a2510', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontStyle: 'italic', borderRadius: '1px', scrollbarWidth: 'thin', maxHeight: '50vh' }}>
              {fullSpeech}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
              <button onClick={() => setStep('select')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1rem', cursor: 'pointer' }}>← Change Theme</button>
              <button onClick={handleTransmit} style={{ background: 'var(--accent-red)', border: 'none', color: 'var(--cream)', fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.3rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.12em' }}>TRANSMIT LIVE</button>
            </div>
          </div>
        )}

        {step === 'broadcasting' && (
          <div style={{ background: '#1a1815', border: '1px solid var(--accent-red)', padding: '1.2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-red)', animation: 'stat-pulse 1s infinite' }} />
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--accent-red)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>LIVE — TRANSMITTING — VNN NATIONAL NETWORK</span>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.3rem', filter: 'grayscale(1) opacity(0.4)' }}>🎙</div>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.7rem', color: 'var(--amber)', letterSpacing: '0.12em' }}>KATERIN ASHAVEL</p>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>CHANCELLOR OF THE REPUBLIC</p>
            </div>

            <div style={{
              background: '#0d0b09', border: '1px solid rgba(200,144,42,0.15)', padding: '1.5rem 1.8rem',
              fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.88rem', color: 'var(--cream)', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', fontStyle: 'italic', borderRadius: '1px', minHeight: '200px', maxHeight: '45vh', overflowY: 'auto', scrollbarWidth: 'thin',
            }}>
              {fullSpeech.slice(0, typingIndex)}
              {typingIndex < fullSpeech.length && <span style={{ animation: 'blink 0.8s infinite', color: 'var(--amber)' }}>|</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.6rem', justifyContent: 'center' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: `${i * 6}px`, height: `${i * 2}px`, background: 'var(--accent-green)', opacity: typingIndex > i * fullSpeech.length / 4 ? 1 : 0.2, transition: 'opacity 0.3s', borderRadius: '1px' }} />
              ))}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.4rem', color: 'var(--muted)', letterSpacing: '0.1em', marginLeft: '0.5rem' }}>AUDIO LEVELS</span>
            </div>

            {typingIndex >= fullSpeech.length && (
              <button onClick={() => setStep('done')} style={{
                marginTop: '1rem', alignSelf: 'center', background: 'var(--accent-red)', border: 'none', color: 'var(--cream)',
                fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', padding: '0.4rem 1.5rem', cursor: 'pointer', letterSpacing: '0.12em',
              }}>
                END TRANSMISSION
              </button>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={{ background: '#1a1815', border: '1px solid var(--border)', padding: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--muted)' }} />
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>TRANSMISSION ENDED — VNN Radio</span>
            </div>

            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--amber)', marginBottom: '0.5rem' }}>
              Broadcast Complete
            </p>
            <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.6rem' }}>
              "{result.label}" — {radioBroadcastsUsed} of {MAX_BROADCASTS} broadcasts used. {(result.multiplier * 100).toFixed(0)}% effectiveness.
            </p>

            {result.reactions.length > 0 && (
              <div style={{ marginBottom: '0.8rem' }}>
                <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Reactions</p>
                {result.reactions.map((r, i) => (
                  <div key={i} style={{ padding: '0.3rem 0.5rem', borderLeft: '2px solid var(--amber-dim)', marginBottom: '0.3rem', background: 'rgba(200,144,42,0.04)' }}>
                    <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--amber-dim)' }}>{r.character}: </span>
                    <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.68rem', color: 'var(--cream)', fontStyle: 'italic' }}>"{r.text}"</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={dismissRadio} style={{
              width: '100%', background: 'var(--amber)', border: 'none', color: 'var(--ink)',
              fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', padding: '0.5rem', cursor: 'pointer', letterSpacing: '0.1em', fontWeight: 'bold',
            }}>
              {phase === 'scene' ? 'CONTINUE TO AGENDA →' : 'CLOSE'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
