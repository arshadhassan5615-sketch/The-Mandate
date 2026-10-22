import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore } from '../stores/settingsStore'
import { loadGame, saveGame } from '../engine/SaveManager'
import { audioManager } from '../engine/AudioManager'
import SaveSlotScreen from './SaveSlotScreen'
import CollectionsScreen from './CollectionsScreen'
import CreditsScreen from './CreditsScreen'
import WindowSnow from './title/WindowSnow'
import officeScene from '../assets/images/prologue/splash_1962.jpeg'

const MENU_ITEM_CSS = `
.main-menu__item {
  background: transparent;
  border: none;
  position: relative;
  isolation: isolate;
  font-family: 'Playfair Display', 'IM Fell English', Georgia, serif;
  font-size: clamp(0.95rem, 4.4vh, 1.35rem);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #e8dcc0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  min-height: clamp(30px, 8.5vh, 40px);
  padding: 0 28px;
  cursor: pointer;
  display: inline-block;
  transform: scale(1);
  transform-origin: center;
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s ease, border-color 0.18s ease;
  will-change: transform;
  backface-visibility: hidden;
}
.main-menu__item::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -38%;
  right: -38%;
  top: 52%;
  height: 3px;
  transform: translateY(-50%) scaleX(0);
  transform-origin: center;
  opacity: 0;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent 0%, rgba(232, 176, 74, 0.15) 12%, rgba(232, 176, 74, 0.85) 38%, rgba(255, 230, 170, 1) 50%, rgba(232, 176, 74, 0.85) 62%, rgba(232, 176, 74, 0.15) 88%, transparent 100%);
  box-shadow: 0 0 8px rgba(255, 190, 100, 0.55), 0 0 18px rgba(255, 170, 80, 0.3);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.main-menu__item::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: -26%;
  right: -30%;
  top: 60%;
  height: 1px;
  transform: translateY(-50%) scaleX(0) rotate(-0.6deg);
  transform-origin: center;
  opacity: 0;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 220, 160, 0.6) 30%, rgba(255, 220, 160, 0.6) 70%, transparent);
  box-shadow: none;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  transition-delay: 0.05s;
}
.main-menu__item:focus-visible:not(:disabled) {
  color: #ffe7b0;
  text-shadow: 0 0 10px rgba(255, 190, 100, 0.6), 0 1px 2px rgba(0, 0, 0, 0.8);
  outline: none;
}
.main-menu__item:focus-visible:not(:disabled) {
  transform: scale(1.08);
}
.main-menu__item:focus-visible:not(:disabled)::before {
  transform: translateY(-50%) scaleX(1);
  opacity: 1;
}
.main-menu__item:focus-visible:not(:disabled)::after {
  transform: translateY(-50%) scaleX(1) rotate(-0.6deg);
  opacity: 1;
}
@media (hover: hover) and (pointer: fine) {
  .main-menu__item:hover:not(:disabled) {
    color: #ffe7b0;
    text-shadow: 0 0 10px rgba(255, 190, 100, 0.6), 0 1px 2px rgba(0, 0, 0, 0.8);
    outline: none;
    transform: scale(1.08);
    transition-duration: 0.18s;
  }
  .main-menu__item:hover:not(:disabled)::before {
    transform: translateY(-50%) scaleX(1);
    opacity: 1;
  }
  .main-menu__item:hover:not(:disabled)::after {
    transform: translateY(-50%) scaleX(1) rotate(-0.6deg);
    opacity: 1;
  }
}
.main-menu__item:active:not(:disabled) {
  transform: scale(0.97);
  transition-duration: 0.08s;
}
.main-menu__item:disabled {
  opacity: 0.35;
  cursor: default;
  transform: none;
}
.main-menu__item:disabled::before,
.main-menu__item:disabled::after {
  display: none;
}
@keyframes title-lamp-flicker {
  0%, 100% { opacity: 1 }
  42% { opacity: 0.92 }
  45% { opacity: 0.7 }
  47% { opacity: 0.95 }
  70% { opacity: 0.88 }
}
.title-lamp {
  animation: title-lamp-flicker 5.5s ease-in-out infinite;
}
@media (max-height: 399px) {
  .main-menu__footer { display: none }
}
`

export default function MainMenu() {
  const startCustomization = useWeekStore(s => s.startCustomization)
  const setActiveSlot = useWeekStore(s => s.setActiveSlot)
  const setSettingsOpen = useSettingsStore(s => s.setSettingsOpen)
  const [hasSaves, setHasSaves] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slotScreenMode, setSlotScreenMode] = useState<'load' | 'save' | null>(null)
  const [overlay, setOverlay] = useState<'collections' | 'credits' | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const { listSaves } = await import('../engine/SaveManager')
        const saves = await listSaves()
        setHasSaves(saves.some(s => s !== undefined))
      } catch {
        // ignore
      }
    }
    check()
  }, [])

  useEffect(() => {
    audioManager.playTrack('theme_main')
    return () => audioManager.pause()
  }, [])

  const handleContinue = useCallback(async () => {
    setLoading(true)
    const { listSaves } = await import('../engine/SaveManager')
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
      sessionStorage.setItem('mandate-manual-load', '1')
      const ok = await loadGame(bestSlot)
      if (ok) setSettingsOpen(false)
    }
    setLoading(false)
  }, [setSettingsOpen])

  const handleSlotSelected = useCallback((slot: number) => {
    if (slotScreenMode === 'load') {
      sessionStorage.setItem('mandate-manual-load', '1')
      loadGame(slot).then(ok => {
        if (ok) {
          setSettingsOpen(false)
          setSlotScreenMode(null)
        }
      })
    } else {
      setActiveSlot(slot)
      saveGame(slot, `Playthrough ${slot}`).catch(() => {})
      setSlotScreenMode(null)
      setSettingsOpen(false)
      startCustomization()
    }
  }, [slotScreenMode, setActiveSlot, setSettingsOpen, startCustomization])

  return (
    <motion.div
      data-testid="main-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        overflow: 'hidden',
        background: '#050403',
      }}
    >
      <style>{MENU_ITEM_CSS}</style>

      {/* Illustrated scene: sized to cover the viewport at the art's aspect ratio */}
      <motion.div
        aria-hidden
        data-testid="title-scene"
        initial={{ scale: 1.03 }}
        animate={{ scale: 1.08 }}
        transition={{ duration: 45, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          x: '-50%',
          y: '-50%',
          width: 'max(100vw, calc(100vh * 1.7917))',
          height: 'max(100vh, calc(100vw / 1.7917))',
        }}
      >
        <img
          src={officeScene}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.85) saturate(0.9)',
          }}
        />
        <div
          className="title-lamp"
          style={{
            position: 'absolute',
            left: '47.8%',
            top: '42%',
            width: '34%',
            height: '50%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(ellipse at center, rgba(255,190,100,0.28) 0%, rgba(255,170,80,0.12) 35%, transparent 70%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        <WindowSnow />
      </motion.div>

      {/* Legibility overlays */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 40% 50%, transparent 45%, rgba(5,4,3,0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, transparent 50%, rgba(5,4,3,0.55) 72%, rgba(5,4,3,0.82) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Title and menu (no panel) */}
      <nav
        aria-label="Main menu"
        data-testid="title-menu"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 'calc(clamp(16px, 6vw, 110px) + env(safe-area-inset-right, 0px))',
          width: 'clamp(240px, 34vw, 520px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(6px, 3vh, 36px)',
        }}
      >
        <h1
          style={{
            margin: 0,
            lineHeight: 0.9,
            textAlign: 'center',
            fontFamily: "'Playfair Display', 'IM Fell English', Georgia, serif",
          }}
        >
          <span
            style={{
              display: 'block',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(0.9rem, 3.4vh, 1.8rem)',
              color: '#e8d5a3',
              letterSpacing: '0.3em',
              marginBottom: 'clamp(0px, 0.6vh, 8px)',
            }}
          >
            The
          </span>
          <span
            style={{
              display: 'block',
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 13vh, 7rem)',
              color: '#f3e3b8',
              letterSpacing: '0.02em',
              textShadow:
                '0 0 18px rgba(255,190,100,0.45), 0 0 42px rgba(255,170,80,0.25), 0 2px 0 rgba(0,0,0,0.6)',
            }}
          >
            Mandate
          </span>
        </h1>
        <p
          style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(0.7rem, 2.4vh, 1.05rem)',
            color: 'rgba(232,213,163,0.7)',
            textAlign: 'center',
            margin: 'clamp(2px, 1vh, 10px) 0 0',
          }}
        >
          Every compromise has a cost.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(0px, 0.9vh, 12px)',
          }}
        >
          <button type="button" className="main-menu__item" onClick={() => setSlotScreenMode('save')}>
            New Game
          </button>
          <button
            type="button"
            className="main-menu__item"
            onClick={handleContinue}
            disabled={!hasSaves || loading}
          >
            {loading ? 'Loading…' : 'Continue'}
          </button>
          <button
            type="button"
            className="main-menu__item"
            onClick={() => setSlotScreenMode('load')}
            disabled={!hasSaves}
          >
            Load
          </button>
          <button type="button" className="main-menu__item" onClick={() => setSettingsOpen(true)}>
            Options
          </button>
          <button type="button" className="main-menu__item" onClick={() => setOverlay('collections')}>
            Collections
          </button>
          <button type="button" className="main-menu__item" onClick={() => setOverlay('credits')}>
            Credits
          </button>
        </div>
      </nav>

      <p
        className="main-menu__footer"
        style={{
          position: 'absolute',
          left: 'calc(16px + env(safe-area-inset-left, 0px))',
          bottom: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(181,154,94,0.45)',
          margin: 0,
        }}
      >
        A political narrative RPG · v0.3
      </p>

      {/* Save slot screen overlay */}
      {slotScreenMode && (
        <SaveSlotScreen
          mode={slotScreenMode}
          onClose={() => setSlotScreenMode(null)}
          onSlotSelected={handleSlotSelected}
        />
      )}

      {overlay === 'collections' && <CollectionsScreen onClose={() => setOverlay(null)} />}
      {overlay === 'credits' && <CreditsScreen onClose={() => setOverlay(null)} />}
    </motion.div>
  )
}
