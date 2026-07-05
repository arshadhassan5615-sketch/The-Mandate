import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// ─── Ink-bleed reveal, once, before the first prologue scene ──────────────────
// SVG turbulence filter distorts a growing/shrinking circular mask into an
// organic ink-splatter edge. Original silhouette illustration inside —
// no photographs, no external assets, fully self-drawn vector art.

const BLOOM_DURATION = 2200   // ms — mask grows, ink spreads in
const HOLD_DURATION  = 1800   // ms — full illustration visible
const RECEDE_DURATION = 1600  // ms — mask shrinks, bleeds back to black

export default function InkSplashIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'bloom' | 'hold' | 'recede'>('bloom')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), BLOOM_DURATION)
    const t2 = setTimeout(() => setPhase('recede'), BLOOM_DURATION + HOLD_DURATION)
    const t3 = setTimeout(() => onComplete(), BLOOM_DURATION + HOLD_DURATION + RECEDE_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  const maskScale = phase === 'bloom' ? 1 : phase === 'hold' ? 1 : 0
  const maskDuration = phase === 'bloom' ? BLOOM_DURATION / 1000
                      : phase === 'recede' ? RECEDE_DURATION / 1000
                      : 0

  return (
    <motion.div
      onClick={onComplete}
      initial={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: '#0a0906',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', cursor: 'pointer',
      }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ink-distort" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.025" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id="ink-mask">
            <motion.circle
              cx="50%" cy="50%"
              r="0%"
              initial={{ r: '0%' }}
              animate={{ r: maskScale === 1 ? '75%' : '0%' }}
              transition={{ duration: maskDuration, ease: 'easeInOut' }}
              fill="white"
              filter="url(#ink-distort)"
            />
          </mask>
        </defs>
      </svg>

      {/* Film grain, always present */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        opacity: 0.14,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }}/>

      {/* Masked illustration content */}
      <div style={{
        position: 'absolute', inset: 0,
        mask: 'url(#ink-mask)',
        WebkitMask: 'url(#ink-mask)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1a1510',
      }}>
        <svg viewBox="0 0 800 500" width="90%" height="90%" style={{ maxWidth: 900 }}>
          {/* Factory smokestacks, background */}
          <g opacity="0.35" fill="#3a2f22">
            <rect x="80" y="60" width="18" height="140" />
            <rect x="110" y="40" width="18" height="160" />
            <rect x="650" y="70" width="18" height="130" />
            <rect x="680" y="50" width="18" height="150" />
          </g>

          {/* Crowd silhouette — simple raised-fist figures */}
          <g fill="#2a2218">
            {[120, 200, 280, 360, 440, 520, 600, 680].map((x, i) => {
              const h = 90 + (i % 3) * 12
              const raised = i % 2 === 0
              return (
                <g key={x} transform={`translate(${x}, ${290 - h})`}>
                  <circle cx="0" cy="0" r="16" />
                  <rect x="-12" y="14" width="24" height={h - 20} rx="6" />
                  {raised && (
                    <rect x="8" y="-10" width="10" height="40" rx="4" transform="rotate(20 8 -10)" />
                  )}
                </g>
              )
            })}
          </g>

          {/* A woman at a podium, foreground, slightly larger */}
          <g transform="translate(400, 195)" fill="#1a1510">
            <rect x="-30" y="60" width="60" height="14" rx="3" />
            <rect x="-14" y="10" width="28" height="60" rx="8" />
            <circle cx="0" cy="-6" r="18" />
            <rect x="-22" y="18" width="16" height="34" rx="6" transform="rotate(-15 -22 18)" />
          </g>

          {/* Banner, torn edge feel via jagged polygon */}
          <polygon
            points="180,90 620,90 610,120 600,95 580,122 560,96 540,120 520,94 500,118 480,93 460,119 440,95 420,118 400,92 380,120 360,94 340,118 320,93 300,119 280,95 260,118 240,92 220,120 200,94 180,118"
            fill="#8a6a30" opacity="0.6"
          />
        </svg>
      </div>
    </motion.div>
  )
}
