import { useEffect, useMemo, useState } from 'react'
import { recordEnding } from '../engine/collections'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { calculateEnding } from '../engine/endingCalculator'
import { GOVERNANCE_LABELS, PERSONAL_LABELS } from '../types/ending'
import type { EpilogueVariant } from '../types/ending'
import epilogueData from '../data/epilogues.json'
import { getEpilogueArt } from '../assets/epilogueArt'
import CinematicPlate from './scene/CinematicPlate'
import { CINEMA_FADE_IN_S, CINEMA_EASE } from './scene/cinematic'
import { usePageInsets } from '../hooks/usePageInsets'

const variants: EpilogueVariant[] = epilogueData as EpilogueVariant[]

const EPILOGUE_PLATE_HOLD_MS = 6000
const HERO_DRIFT_S = 30

function StatBar({ label, value, color = 'var(--amber)' }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.65rem', color, letterSpacing: '0.08em' }}>{value}/100</span>
      </div>
      <div style={{ height: '3px', background: 'var(--border)', borderRadius: '1px' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 1.2s ease-out', borderRadius: '1px' }} />
      </div>
    </div>
  )
}

export default function EpilogueScreen() {
  const gameState = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const [showStats, setShowStats] = useState(false)
  const [vignetteIndex, setVignetteIndex] = useState(0)
  const [plateDone, setPlateDone] = useState(false)
  const reduceMotion = useReducedMotion() ?? false
  const { mode } = usePageInsets()
  // On phones and landscape phones the advance button is pinned in a footer so it
  // is always reachable; desktop keeps it inline with the text.
  const isPinnedAdvance = mode !== 'desktop'

  const ending = useMemo(() => calculateEnding(gameState, activeFlags), [gameState, activeFlags])

  const epilogue = useMemo(() => {
    // Exact match first
    const exact = variants.find(v => v.id === ending.variantId)
    if (exact) return exact
    // Fallback: match governance outcome
    const govMatch = variants.find(v => v.governanceOutcome === ending.governanceOutcome)
    if (govMatch) return govMatch
    // Ultimate fallback
    return variants[0]
  }, [ending])

  useEffect(() => {
    if (epilogue) recordEnding(epilogue.id)
  }, [epilogue])

  const showNextVignette = () => {
    if (vignetteIndex < epilogue.vignettes.length) {
      setVignetteIndex(prev => prev + 1)
    }
  }

  const handlePlayAgain = () => {
    // Reset to main menu — reload the page to clear all state
    window.location.reload()
  }

  const allVignettesShown = vignetteIndex >= epilogue.vignettes.length
  const advanceLabel = vignetteIndex === 0 ? 'Read the Epilogue' : 'Continue Reading'

  const artUrl = getEpilogueArt(ending.governanceOutcome)

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: 'var(--paper)' }}
    >
      {/* ── TOP BAR — CLASSIFIED DOCUMENT HEADER ──────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-8 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="stamp">
          REPUBLIC OF VELTRIA · OFFICE OF THE CHANCELLOR · DECLASSIFIED
        </span>
        <span className="stamp">
          CLASSIFICATION: PUBLIC ARCHIVE · {String(new Date().getFullYear()).padStart(4, '0')}
        </span>
      </div>

      {/* ── MAIN SCROLL AREA ─────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}
      >
        {/* Ending painting — full-width hero above the text column */}
        {artUrl && (
          <motion.figure
            data-testid="epilogue-art"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: CINEMA_FADE_IN_S, ease: CINEMA_EASE }}
            style={{ position: 'relative', margin: 0, width: '100%', height: 'clamp(180px, 46vh, 520px)', overflow: 'hidden' }}
          >
            <motion.img
              src={artUrl}
              alt=""
              initial={{ scale: 1 }}
              animate={reduceMotion ? { scale: 1 } : { scale: 1.06 }}
              transition={{ duration: reduceMotion ? 0 : HERO_DRIFT_S, ease: 'linear' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
            />
            <div
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, var(--paper) 100%)' }}
            />
          </motion.figure>
        )}
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <p
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                color: 'var(--amber-dim)',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              ▸ Historical Assessment · Chancellorship of Katerin Ashavel · Fiscal Year 1963-64
            </p>
            <h1
              style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontSize: '2.4rem',
                color: 'var(--amber)',
                lineHeight: 1.2,
                marginBottom: '0.5rem',
                fontWeight: 400,
              }}
            >
              {epilogue.title}
            </h1>
            <p
              style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: 'var(--cream)',
                lineHeight: 1.6,
                marginBottom: '2rem',
                opacity: 0.8,
              }}
            >
              {epilogue.subtitle}
            </p>
          </motion.div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2rem' }} />

          {/* Nation Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <p
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.6rem',
                letterSpacing: '0.25em',
                color: 'var(--amber-dim)',
                textTransform: 'uppercase',
                marginBottom: '0.8rem',
              }}
            >
              ▸ National Summary
            </p>
            <p
              style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontSize: '1rem',
                color: 'var(--cream)',
                lineHeight: 1.8,
                marginBottom: '2.5rem',
              }}
            >
              {epilogue.nationSummary}
            </p>
          </motion.div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2rem' }} />

          {/* Character Vignettes — staggered reveal */}
          <p
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              color: 'var(--amber-dim)',
              textTransform: 'uppercase',
              marginBottom: '1.2rem',
            }}
          >
            ▸ Where They Are Now
          </p>

          <AnimatePresence>
            {epilogue.vignettes.slice(0, vignetteIndex).map((vig) => (
              <motion.div
                key={vig.characterId}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ marginBottom: '2rem' }}
              >
                <p
                  style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.58rem',
                    letterSpacing: '0.15em',
                    color: 'var(--amber)',
                    textTransform: 'uppercase',
                    marginBottom: '0.3rem',
                  }}
                >
                  {vig.characterName}
                </p>
                <p
                  style={{
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontSize: '0.9rem',
                    color: 'var(--cream)',
                    lineHeight: 1.7,
                    opacity: 0.85,
                  }}
                >
                  {vig.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* "Continue reading" prompt */}
          {!allVignettesShown && !isPinnedAdvance && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}
            >
              <button
                className="choice-btn"
                onClick={showNextVignette}
                style={{ width: 'auto', minWidth: '280px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {advanceLabel}
              </button>
            </motion.div>
          )}

          {/* Stats reveal — after all vignettes */}
          {allVignettesShown && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2rem', marginTop: '1rem' }} />

              {/* Toggle stats */}
              {!showStats ? (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <button
                    className="choice-btn"
                    onClick={() => setShowStats(true)}
                    style={{ width: 'auto', minWidth: '320px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    ▸ View Declassified Assessment Report
                  </button>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.6rem',
                      letterSpacing: '0.25em',
                      color: 'var(--amber-dim)',
                      textTransform: 'uppercase',
                      marginBottom: '1.2rem',
                    }}
                  >
                    ▸ Declassified Assessment Report
                  </p>

                  {/* Governance & Personal Scores */}
                  <div
                    style={{
                      background: 'var(--paper-raised)',
                      border: '1px solid var(--border)',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.55rem',
                        letterSpacing: '0.2em',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        marginBottom: '1rem',
                      }}
                    >
                      Classification: INTERNAL MEMORANDUM — For Archival Purposes Only
                    </p>

                    <StatBar label="Governance Index" value={ending.governanceScore} color="var(--amber)" />
                    <StatBar label="Personal Resilience Index" value={ending.personalScore} color="var(--accent-green)" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.2rem' }}>
                      <div>
                        <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Governance Category</p>
                        <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--amber)' }}>{GOVERNANCE_LABELS[ending.governanceOutcome]}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Personal Category</p>
                        <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--accent-green)' }}>{PERSONAL_LABELS[ending.personalOutcome]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key state stats */}
                  <div
                    style={{
                      background: 'var(--paper-raised)',
                      border: '1px solid var(--border)',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.55rem',
                        letterSpacing: '0.2em',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        marginBottom: '1rem',
                      }}
                    >
                      Final State Indicators — End of Week 52
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 2rem' }}>
                      {[
                        ['Economy Health', gameState.nation.economyHealth],
                        ['Unemployment', `${gameState.nation.unemployment}%`],
                        ['Inflation', `${gameState.nation.inflation}%`],
                        ['Press Freedom', gameState.nation.pressFreedom],
                        ['Civil Liberties', gameState.nation.civilLiberties],
                        ['Public Order', gameState.nation.publicOrder],
                        ['Military Readiness', gameState.nation.militaryReadiness],
                        ['Intl. Standing', gameState.nation.internationalStanding],
                        ['Corruption', gameState.nation.corruption],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.2rem 0',
                            borderBottom: '1px solid rgba(200,144,42,0.06)',
                          }}
                        >
                          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>{label}</span>
                          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', color: 'var(--cream)', letterSpacing: '0.06em' }}>{typeof value === 'number' && value < 0 ? value : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declassified note */}
                  <div
                    style={{
                      borderLeft: '3px solid var(--amber-dim)',
                      paddingLeft: '1rem',
                      marginBottom: '2rem',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.55rem',
                        color: 'var(--muted)',
                        lineHeight: 1.6,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {epilogue.declassifiedNote}
                    </p>
                  </div>
                </>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2.5rem' }} />

              {/* Play Again + Term Report */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ textAlign: 'center', paddingBottom: '3rem' }}
              >
                <p
                  style={{
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontStyle: 'italic',
                    color: 'var(--muted)',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  The mandate is complete. The Republic endures — or falls, or transforms. The choices were yours. The consequences were theirs. The story of Katerin Ashavel, first woman Chancellor of the Republic of Veltria, is now part of the historical record. The record is open to interpretation. Like all records. Like all history.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="choice-btn"
                    onClick={() => useWeekStore.getState().openTermReport()}
                    style={{
                      width: 'auto',
                      minWidth: '240px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      padding: '0.85rem 2rem',
                    }}
                  >
                    ▸ View Full Term Report
                  </button>
                  <button
                    className="choice-btn"
                    onClick={handlePlayAgain}
                    style={{
                      width: 'auto',
                      minWidth: '180px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      padding: '0.85rem 2rem',
                    }}
                  >
                    Play Again?
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      {!allVignettesShown && isPinnedAdvance && (
        <div
          data-testid="epilogue-footer"
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            background: 'var(--paper)',
          }}
        >
          <button
            className="choice-btn"
            onClick={showNextVignette}
            style={{
              width: '100%',
              maxWidth: '360px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {advanceLabel}
          </button>
        </div>
      )}
      {artUrl && !plateDone && (
        <CinematicPlate
          image={artUrl}
          holdMs={EPILOGUE_PLATE_HOLD_MS}
          onDone={() => setPlateDone(true)}
        />
      )}
    </div>
  )
}
