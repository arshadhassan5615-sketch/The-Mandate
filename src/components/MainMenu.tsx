import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore } from '../stores/settingsStore'
import { listSaves, loadGame } from '../engine/SaveManager'
import { audioManager } from '../engine/AudioManager'

export default function MainMenu() {
  const startCustomization = useWeekStore(s => s.startCustomization)
  const setSettingsOpen = useSettingsStore(s => s.setSettingsOpen)
  const setSaveMenuOpen = useSettingsStore(s => s.setSaveMenuOpen)
  const [hasSaves, setHasSaves] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listSaves().then(saves => {
      setHasSaves(saves.some(s => s !== undefined))
    })
  }, [])

  useEffect(() => {
    audioManager.playTrack('theme_main')
    return () => audioManager.pause()
  }, [])

  const handleContinue = useCallback(async () => {
    setLoading(true)
    const saves = await listSaves()
    let bestSlot = -1
    let bestTime = 0
    for (let i = 0; i < saves.length; i++) {
      if (saves[i]?.timestamp && saves[i]!.timestamp > bestTime) {
        bestTime = saves[i]!.timestamp
        bestSlot = i
      }
    }
    if (bestSlot >= 0) {
      const ok = await loadGame(bestSlot)
      if (ok) setSaveMenuOpen(false)
    }
    setLoading(false)
  }, [setSaveMenuOpen])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', 'IM Fell English', Georgia, serif",
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 600,
            color: 'var(--amber)',
            letterSpacing: '0.08em',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          THE MANDATE
        </h1>
        <p
          style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: 'var(--cream)',
            opacity: 0.6,
            marginTop: '0.8rem',
            letterSpacing: '0.03em',
          }}
        >
          Every compromise has a cost.
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '280px' }}>
        <button
          className="choice-btn"
          onClick={startCustomization}
          style={{ textAlign: 'center' }}
        >
          New Game
        </button>

        <button
          className="choice-btn"
          onClick={handleContinue}
          disabled={!hasSaves || loading}
          style={{
            textAlign: 'center',
            opacity: hasSaves && !loading ? 1 : 0.35,
            pointerEvents: hasSaves && !loading ? 'auto' : 'none',
          }}
        >
          {loading ? 'Loading…' : 'Continue'}
        </button>

        <button
          className="choice-btn"
          onClick={() => setSettingsOpen(true)}
          style={{ textAlign: 'center' }}
        >
          Settings
        </button>
      </div>

      {/* Footer */}
      <p className="stamp" style={{ position: 'absolute', bottom: '2rem', opacity: 0.4 }}>
        A Political Narrative RPG
      </p>
    </motion.div>
  )
}
