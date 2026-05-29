import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { calculateLegacy, type LegacyGrade } from '../engine/LegacyEngine'

const GRADE_COLORS: Record<LegacyGrade, string> = {
  A: 'var(--accent-green)',
  B: '#5a8a4a',
  C: 'var(--amber-dim)',
  D: '#a05030',
  F: 'var(--accent-red)',
}

const GRADE_BG: Record<LegacyGrade, string> = {
  A: 'rgba(74,107,58,0.12)',
  B: 'rgba(90,138,74,0.08)',
  C: 'rgba(138,98,28,0.08)',
  D: 'rgba(160,80,48,0.10)',
  F: 'rgba(139,46,46,0.12)',
}

const mono: React.CSSProperties = { fontFamily: "'Special Elite', monospace" }

export default function LegacyScreen({ onContinue }: { onContinue: () => void }) {
  const state = useGameStore()
  const flags = useNarrativeStore(s => s.activeFlags)
  const legacy = useMemo(() => calculateLegacy(state, flags), [state, flags])
  const [tab, setTab] = useState<'verdict' | 'dimensions' | 'achievements'>('verdict')

  const unlockedCount = legacy.achievements.filter(a => a.unlocked).length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'var(--paper)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid var(--border)', background: '#0d0b09', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          Fifty Years Later — A Historian's Assessment
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--amber)', marginTop: '0.3rem', letterSpacing: '0.04em' }}>
          {legacy.title}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
          {(['A', 'B', 'C', 'D', 'F'] as LegacyGrade[]).map(g => (
            <span key={g} style={{
              ...mono, fontSize: g === legacy.overallGrade ? '1rem' : '0.7rem', fontWeight: g === legacy.overallGrade ? 'bold' : 'normal',
              color: legacy.overallGrade === g ? GRADE_COLORS[g] : 'var(--muted)',
              padding: '0.1rem 0.5rem', border: legacy.overallGrade === g ? `2px solid ${GRADE_COLORS[g]}` : 'none',
              borderRadius: '2px', transition: 'all 0.3s',
            }}>
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['verdict', 'dimensions', 'achievements'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...mono, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: tab === t ? 'var(--amber-glow)' : 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--amber)' : 'var(--muted)',
            padding: '0.6rem 1.8rem', borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t === 'verdict' ? 'Historian\'s Verdict' : t === 'dimensions' ? 'Legacy Dimensions' : `Achievements (${unlockedCount})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
        {tab === 'verdict' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <p style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.95rem', color: 'var(--cream)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '1rem' }}>
                {legacy.paragraph1}
              </p>
              <p style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.95rem', color: 'var(--cream)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '2rem' }}>
                {legacy.paragraph2}
              </p>

              {/* Comparison board */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <p style={{ ...mono, fontSize: '0.55rem', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Your Veltria vs The Average Chancellor
                </p>
                {Object.entries(legacy.comparison).map(([label, result]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem', padding: '0.3rem 0' }}>
                    <span style={{ ...mono, fontSize: '0.52rem', color: 'var(--muted)', minWidth: '90px' }}>{label}</span>
                    <span style={{
                      ...mono, fontSize: '0.58rem',
                      color: result === 'better' ? 'var(--accent-green)' : result === 'worse' ? 'var(--accent-red)' : 'var(--amber-dim)',
                      textTransform: 'uppercase',
                    }}>
                      {result === 'better' ? '↑ Better' : result === 'worse' ? '↓ Worse' : '→ Similar'}
                    </span>
                    <div style={{ flex: 1, height: '2px', background: 'rgba(200,144,42,0.08)' }}>
                      <div style={{
                        height: '100%', width: result === 'better' ? '80%' : result === 'worse' ? '20%' : '50%',
                        background: result === 'better' ? 'var(--accent-green)' : result === 'worse' ? 'var(--accent-red)' : 'var(--amber-dim)',
                        transition: 'width 1s',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'dimensions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              {legacy.dimensions.map((dim, i) => (
                <motion.div key={dim.dimension} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{
                  marginBottom: '0.8rem', background: GRADE_BG[dim.grade], border: '1px solid var(--border)',
                  padding: '0.8rem 1rem', borderRadius: '1px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {dim.label}
                      </span>
                      <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.65rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        {dim.description}
                      </p>
                    </div>
                    <span style={{
                      ...mono, fontSize: '1.2rem', fontWeight: 'bold', color: GRADE_COLORS[dim.grade],
                      border: `3px solid ${GRADE_COLORS[dim.grade]}`, padding: '0.1rem 0.6rem', borderRadius: '2px',
                      minWidth: '40px', textAlign: 'center', lineHeight: 1.2,
                    }}>
                      {dim.grade}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ ...mono, fontSize: '0.42rem', color: 'var(--muted)' }}>Score: {dim.score}/{dim.maxScore}</span>
                      <span style={{ ...mono, fontSize: '0.42rem', color: GRADE_COLORS[dim.grade] }}>
                        {Math.round((dim.score / dim.maxScore) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(200,144,42,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                        style={{ height: '100%', background: GRADE_COLORS[dim.grade], borderRadius: '1px' }} />
                    </div>
                  </div>

                  <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.7rem', color: 'var(--cream)', fontStyle: 'italic', lineHeight: 1.5, marginTop: '0.4rem' }}>
                    {dim.historianComment}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <p style={{ ...mono, fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                {unlockedCount} of {legacy.achievements.length} achievements unlocked
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {legacy.achievements.map(ach => (
                  <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: ach.unlocked ? 1 : 0.4, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    style={{
                      padding: '0.5rem 0.7rem', background: ach.unlocked ? 'var(--amber-glow)' : 'rgba(107,96,80,0.04)',
                      border: ach.unlocked ? '1px solid var(--amber)' : '1px solid rgba(200,144,42,0.08)',
                      borderRadius: '1px',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.7rem' }}>{ach.unlocked ? '★' : '☆'}</span>
                      <span style={{ ...mono, fontSize: '0.52rem', color: ach.unlocked ? 'var(--amber)' : 'var(--muted)', textTransform: 'uppercase' }}>
                        {ach.name}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.58rem', color: 'var(--muted)', fontStyle: 'italic', marginLeft: '1.3rem' }}>
                      {ach.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.8rem 2rem', borderTop: '2px solid var(--border)', background: '#0d0b09', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <button onClick={onContinue} style={{
          ...mono, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          background: 'var(--amber)', border: 'none', color: 'var(--ink)', padding: '0.5rem 2rem',
          cursor: 'pointer', fontWeight: 'bold', borderRadius: '1px',
        }}>
          Return to Title
        </button>
      </div>
    </div>
  )
}
