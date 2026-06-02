import { useState } from 'react'
import { PROVINCES, PROVINCE_ORDER, type ProvinceData } from '../../data/provinces'
import { useGameStore } from '../../stores/gameStore'
import { useCodexStore } from '../../stores/codexStore'
import { renderWithEntities } from '../news/EntityLinker'

function Skyline({ type }: { type: ProvinceData['skylineType'] }) {
  const h = 120; const w = 500
  switch (type) {
    case 'city':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1410" />
              <stop offset="60%" stopColor="#2a2218" />
              <stop offset="100%" stopColor="#3a3020" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#city-sky)" />
          <rect x="0" y="90" width={w} height="30" fill="rgba(15,12,10,0.7)" />
          <rect x="30" y="55" width="18" height="35" fill="rgba(80,70,50,0.35)" />
          <rect x="55" y="45" width="22" height="45" fill="rgba(90,75,55,0.4)" />
          <rect x="55" y="42" width="22" height="3" fill="rgba(200,144,42,0.15)" />
          <rect x="85" y="60" width="16" height="30" fill="rgba(70,60,45,0.3)" />
          <rect x="110" y="35" width="26" height="55" fill="rgba(95,80,60,0.38)" />
          <rect x="110" y="32" width="26" height="3" fill="rgba(200,144,42,0.2)" />
          <rect x="145" y="50" width="20" height="40" fill="rgba(85,70,50,0.35)" />
          <rect x="175" y="28" width="30" height="62" fill="rgba(100,85,65,0.42)" />
          <rect x="175" y="24" width="30" height="4" fill="rgba(200,144,42,0.25)" />
          <rect x="215" y="65" width="14" height="25" fill="rgba(65,55,40,0.28)" />
          <rect x="240" y="42" width="24" height="48" fill="rgba(90,75,55,0.36)" />
          <rect x="275" y="22" width="32" height="68" fill="rgba(105,88,68,0.44)" />
          <rect x="275" y="18" width="32" height="4" fill="rgba(200,144,42,0.28)" />
          <rect x="318" y="55" width="22" height="35" fill="rgba(85,70,52,0.34)" />
          <rect x="350" y="40" width="26" height="50" fill="rgba(92,78,58,0.38)" />
          <rect x="385" y="62" width="18" height="28" fill="rgba(72,60,44,0.3)" />
          <rect x="412" y="48" width="24" height="42" fill="rgba(80,68,50,0.34)" />
          <rect x="445" y="58" width="20" height="32" fill="rgba(70,58,42,0.28)" />
          <rect x="0" y="75" width={w} height="8" fill="rgba(20,15,10,0.25)" />
        </svg>
      )
    case 'industrial':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="ind-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1410" />
              <stop offset="70%" stopColor="#2a1e14" />
              <stop offset="100%" stopColor="#3a2818" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#ind-sky)" />
          <rect x="0" y="92" width={w} height="28" fill="rgba(15,12,10,0.65)" />
          <rect x="20" y="45" width="35" height="47" fill="rgba(65,45,30,0.45)" />
          <rect x="25" y="35" width="25" height="10" fill="rgba(60,40,25,0.35)" />
          <rect x="22" y="30" width="6" height="8" fill="rgba(200,100,30,0.2)" />
          <rect x="70" y="35" width="45" height="57" fill="rgba(70,50,35,0.48)" />
          <rect x="75" y="25" width="35" height="10" fill="rgba(65,45,30,0.38)" />
          <rect x="78" y="20" width="8" height="10" fill="rgba(200,100,30,0.22)" />
          <rect x="130" y="50" width="30" height="42" fill="rgba(60,40,28,0.4)" />
          <rect x="175" y="30" width="55" height="62" fill="rgba(75,52,36,0.5)" />
          <rect x="182" y="20" width="40" height="12" fill="rgba(68,48,32,0.38)" />
          <rect x="186" y="15" width="10" height="10" fill="rgba(210,110,35,0.25)" />
          <rect x="245" y="42" width="40" height="50" fill="rgba(68,46,32,0.44)" />
          <rect x="250" y="32" width="30" height="12" fill="rgba(62,42,28,0.36)" />
          <rect x="255" y="28" width="7" height="9" fill="rgba(200,100,30,0.2)" />
          <rect x="300" y="48" width="35" height="44" fill="rgba(62,42,30,0.42)" />
          <rect x="350" y="38" width="50" height="54" fill="rgba(72,50,34,0.46)" />
          <rect x="356" y="28" width="38" height="12" fill="rgba(65,45,30,0.37)" />
          <rect x="360" y="24" width="9" height="9" fill="rgba(210,110,35,0.24)" />
          <rect x="415" y="50" width="32" height="42" fill="rgba(60,42,28,0.4)" />
          <rect x="300" y="38" width={w-300} height="1" fill="rgba(100,80,50,0.1)" />
          <rect x="130" y="40" width={w-130} height="1" fill="rgba(100,80,50,0.08)" />
        </svg>
      )
    case 'rural':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rural-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1610" />
              <stop offset="50%" stopColor="#2a2218" />
              <stop offset="100%" stopColor="#3a3020" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#rural-sky)" />
          <rect x="0" y="85" width={w} height="35" fill="rgba(30,25,15,0.6)" />
          <circle cx="420" cy="30" r="16" fill="rgba(200,160,42,0.12)" />
          <rect x="70" y="55" width="28" height="35" fill="rgba(80,60,40,0.22)" />
          <polygon points="84,35 60,55 108,55" fill="rgba(75,55,35,0.18)" />
          <rect x="250" y="58" width="26" height="32" fill="rgba(75,55,38,0.2)" />
          <polygon points="263,40 242,58 284,58" fill="rgba(70,52,34,0.16)" />
          <rect x="370" y="52" width="30" height="38" fill="rgba(82,62,42,0.22)" />
          <polygon points="385,32 360,52 410,52" fill="rgba(78,58,36,0.18)" />
          <circle cx="130" cy="40" r="10" fill="rgba(140,120,60,0.08)" />
          <circle cx="310" cy="42" r="12" fill="rgba(140,120,60,0.07)" />
          <rect x="0" y="75" width={w} height="3" fill="rgba(100,80,40,0.06)" />
        </svg>
      )
    case 'fortress':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="fort-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141210" />
              <stop offset="60%" stopColor="#201a18" />
              <stop offset="100%" stopColor="#2a2418" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#fort-sky)" />
          <rect x="0" y="88" width={w} height="32" fill="rgba(20,18,15,0.7)" />
          <rect x="160" y="35" width="180" height="55" fill="rgba(55,45,35,0.28)" />
          <rect x="140" y="32" width="18" height="14" fill="rgba(70,50,35,0.25)" />
          <rect x="175" y="28" width="22" height="18" fill="rgba(72,52,36,0.28)" />
          <rect x="216" y="26" width="20" height="20" fill="rgba(74,54,38,0.3)" />
          <rect x="254" y="30" width="20" height="16" fill="rgba(70,50,35,0.26)" />
          <rect x="290" y="32" width="16" height="12" fill="rgba(68,48,33,0.24)" />
          <rect x="325" y="34" width="18" height="14" fill="rgba(72,52,36,0.26)" />
          <rect x="170" y="62" width="40" height="28" fill="rgba(30,25,18,0.32)" />
          <rect x="230" y="64" width="40" height="26" fill="rgba(32,28,20,0.3)" />
          <rect x="290" y="60" width="40" height="30" fill="rgba(30,25,18,0.32)" />
          <rect x="0" y="78" width={w} height="5" fill="rgba(60,40,20,0.08)" />
        </svg>
      )
    case 'harbor':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="harbor-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#121820" />
              <stop offset="55%" stopColor="#1a222e" />
              <stop offset="100%" stopColor="#202a28" />
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a2a38" />
              <stop offset="100%" stopColor="#063040" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#harbor-sky)" />
          <rect x="0" y="82" width={w} height="38" fill="url(#water)" />
          <rect x="20" y="55" width="28" height="30" fill="rgba(50,65,85,0.22)" />
          <rect x="60" y="50" width="32" height="35" fill="rgba(55,70,95,0.25)" />
          <rect x="105" y="45" width="36" height="40" fill="rgba(60,78,100,0.28)" />
          <rect x="155" y="58" width="30" height="28" fill="rgba(48,62,82,0.22)" />
          <rect x="200" y="48" width="34" height="38" fill="rgba(58,75,96,0.26)" />
          <rect x="250" y="55" width="28" height="30" fill="rgba(52,68,88,0.23)" />
          <rect x="300" y="44" width="38" height="42" fill="rgba(62,80,102,0.3)" />
          <rect x="355" y="52" width="32" height="34" fill="rgba(55,72,90,0.25)" />
          <rect x="405" y="48" width="36" height="38" fill="rgba(58,76,96,0.27)" />
          <rect x="455" y="56" width="30" height="30" fill="rgba(50,65,85,0.23)" />
          <rect x="40" y="78" width="60" height="4" fill="rgba(40,80,100,0.08)" />
          <rect x="220" y="75" width="80" height="5" fill="rgba(40,80,100,0.1)" />
          <rect x="380" y="80" width="55" height="3" fill="rgba(40,80,100,0.06)" />
        </svg>
      )
    case 'mountain':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="mtn-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141820" />
              <stop offset="60%" stopColor="#1a2028" />
              <stop offset="100%" stopColor="#202820" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#mtn-sky)" />
          <polygon points="30,80 90,25 150,80" fill="rgba(45,42,55,0.25)" />
          <polygon points="85,80 165,20 245,80" fill="rgba(50,48,62,0.3)" />
          <polygon points="195,80 275,30 355,80" fill="rgba(48,44,58,0.28)" />
          <polygon points="120,80 200,42 280,80" fill="rgba(42,40,52,0.22)" />
          <polygon points="300,80 370,35 440,80" fill="rgba(46,42,56,0.24)" />
          <polygon points="390,80 458,28 530,80" fill="rgba(48,44,58,0.26)" />
          <polygon points="90,42 100,34 110,42" fill="rgba(150,155,165,0.12)" />
          <polygon points="168,32 180,22 192,32" fill="rgba(155,160,170,0.14)" />
          <polygon points="275,42 286,32 297,42" fill="rgba(152,158,168,0.12)" />
          <polygon points="370,44 382,34 394,44" fill="rgba(148,154,164,0.11)" />
          <rect x="0" y="72" width={w} height="48" fill="rgba(20,22,28,0.7)" />
        </svg>
      )
  }
}

const ICON_POPULATION = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="7" r="4" /><path d="M2 21c0-4 3-7 7-7s7 3 7 7" />
    <circle cx="18" cy="5" r="3" /><path d="M16 14c3 0 6 1.5 6 5" />
  </svg>
)

const ICON_ECONOMY = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2v20M17 5H9.5A3.5 3.5 0 007 8.5 3.5 3.5 0 009.5 12H14a3.5 3.5 0 013.5 3.5A3.5 3.5 0 0114 19H6" />
  </svg>
)

const ICON_STABILITY = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 22 22 2 22" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <circle cx="12" cy="19" r="0.5" fill="currentColor" />
  </svg>
)

function PieChart({ data, colors, size }: { data: Record<string, number>; colors: Record<string, string>; size: number }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const r = size / 2; const cx = r; const cy = r
  let currentAngle = -Math.PI / 2

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      {entries.map(([key, val]) => {
        const angle = (val / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(currentAngle)
        const y1 = cy + r * Math.sin(currentAngle)
        const x2 = cx + r * Math.cos(currentAngle + angle)
        const y2 = cy + r * Math.sin(currentAngle + angle)
        const largeArc = angle > Math.PI ? 1 : 0
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        currentAngle += angle
        return <path key={key} d={path} fill={colors[key] ?? '#6a6a6a'} stroke="rgba(12,10,8,0.85)" strokeWidth="1" />
      })}
      <circle cx={cx} cy={cy} r={r * 0.38} fill="rgba(14,12,10,0.9)" />
    </svg>
  )
}

const ETH_COLORS: Record<string, string> = {
  veltrian: '#8b6b3a', dravenni: '#5a6b3a', morivask: '#3a5a7c', other: '#6a6a6a',
}
const ETH_LABELS: Record<string, string> = {
  veltrian: 'Veltrian', dravenni: 'Dravenni', morivask: 'Morivask', other: 'Other',
}

const POL_COLORS: Record<string, string> = {
  reformist: '#3a5a7c', halvekist: '#5a5a5a', workers: '#8b2e2e',
  business: '#5a7a5a', church: '#9b7b3a', ironCovenant: '#4a6b3a',
  dravenni: '#7b5a3a', other: '#6a6a6a',
}
const POL_LABELS: Record<string, string> = {
  reformist: 'Reformist', halvekist: 'Halvekist', workers: 'Workers',
  business: 'Business', church: 'Church', ironCovenant: 'Mil.',
  dravenni: 'Dravenni', other: 'Other',
}

function qualitativeStatus(province: ProvinceData): { population: string; economy: string; stability: string } {
  const pop = province.population
  const gdp = province.gdp
  return {
    population: pop >= 1000000 ? 'Dense Urban' : pop >= 400000 ? 'Urban Center' : pop >= 250000 ? 'Moderate' : 'Sparse',
    economy: gdp >= 500 ? 'Industrial Base' : gdp >= 250 ? 'Diversified' : gdp >= 150 ? 'Developing' : 'Limited',
    stability: province.skylineType === 'rural' || province.skylineType === 'mountain'
      ? 'Quiescent' : province.skylineType === 'fortress' ? 'Militarized' : 'Urban Tensions',
  }
}

interface ProvinceDetailProps {
  initialProvince?: string
  onClose: () => void
}

const PROVINCE_CODEX: Record<string, string> = {
  ashenmere: 'province_ashenmere',
  kravenstal: 'province_kravenstal',
  thornfeld: 'province_thornfeld',
  sevagrad: 'province_sevagrad',
  aldenmoor: 'province_aldenmoor',
  dravenhollow: 'province_dravenhollow',
}

export default function ProvinceDetail({ initialProvince, onClose }: ProvinceDetailProps) {
  const [idx, setIdx] = useState(() => {
    const i = PROVINCE_ORDER.indexOf(initialProvince ?? 'ashenmere')
    return i >= 0 ? i : 0
  })
  const province = PROVINCES[PROVINCE_ORDER[idx]]
  const status = qualitativeStatus(province)
  const viewEntry = useCodexStore(s => s.viewEntry)
  const openCodex = useCodexStore(s => s.openCodex)
  const codexId = PROVINCE_CODEX[province.id] ?? ''

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        width: '500px', maxHeight: '92vh', overflowY: 'auto',
        background: 'rgba(12,10,8,0.98)',
        border: '1px solid rgba(196,148,58,0.28)',
        borderRadius: '3px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 6px 48px rgba(0,0,0,0.65)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,144,42,0.2) transparent',
        fontFamily: "'Crimson Text', serif",
      }} onClick={e => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 28px 0' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--amber)', margin: 0, fontWeight: 600, letterSpacing: '0.02em' }}>
              {province.name}
            </h2>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)',
              letterSpacing: '0.14em', textTransform: 'uppercase', margin: '4px 0 0',
            }}>
              {province.subtitle}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(196,148,58,0.15)', color: 'var(--muted)',
            cursor: 'pointer', fontSize: '1.1rem', padding: '2px 8px', lineHeight: 1, borderRadius: '2px',
          }}>✕</button>
        </div>

        {/* ── Skyline illustration ──────────────────────────── */}
        <div style={{ padding: '10px 28px 0' }}>
          <Skyline type={province.skylineType} />
        </div>

        {/* ── Status icons row ──────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', padding: '14px 0' }}>
          {[
            { icon: ICON_POPULATION, label: 'Population', value: status.population },
            { icon: ICON_ECONOMY, label: 'Economy', value: status.economy },
            { icon: ICON_STABILITY, label: 'Stability', value: status.stability },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '1.5px solid rgba(196,148,58,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 5px',
                background: 'rgba(196,148,58,0.06)',
                color: 'var(--amber-dim)',
              }}>
                {s.icon}
              </div>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.42rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px',
              }}>
                {s.label}
              </span>
              <span style={{
                fontFamily: "'Crimson Text', serif", fontSize: '0.65rem', color: '#d4c8b0',
                fontStyle: 'italic',
              }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Divider ──────────────────────────────────────── */}
        <div style={{ height: '1px', background: 'rgba(196,148,58,0.1)', margin: '0 28px' }} />

        {/* ── Description ──────────────────────────────────── */}
        <p style={{
          fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '0.82rem',
          color: '#8a7d6a', padding: '14px 28px', margin: 0, lineHeight: 1.55,
        }}>
          {renderWithEntities(province.description)}
        </p>

        {/* ── Open Codex Entry button ──────────────────────── */}
        <div style={{ padding: '0 28px 12px' }}>
          <button
            onClick={() => { viewEntry(codexId); openCodex(undefined, codexId) }}
            style={{
              width: '100%', background: 'rgba(196,148,58,0.08)',
              border: '1px solid rgba(196,148,58,0.25)',
              color: 'var(--amber-dim)', cursor: 'pointer',
              fontFamily: "'Special Elite', monospace", fontSize: '0.58rem',
              letterSpacing: '0.1em', padding: '7px 0',
              textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.borderColor = 'var(--amber)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--amber-dim)'; e.currentTarget.style.borderColor = 'rgba(196,148,58,0.25)' }}
          >
            Open Codex Entry
          </button>
        </div>

        {/* ── Stats table + Pie charts ─────────────────────── */}
        <div style={{ display: 'flex', padding: '0 28px 10px', gap: '24px' }}>
          {/* Stats table */}
          <div style={{ flex: 1, paddingTop: '4px' }}>
            {[
              ['Population', `${(province.population / 1000).toFixed(0)}k`],
              ['Population Rank', `${province.populationRanking} of 6`],
              ['GDP', `${province.gdp}M ₭`],
              ['GDP Rank', `${province.gdpRanking} of 6`],
              ['Dominant Faction', province.dominantFaction],
              ['Key Industry', province.keyIndustry],
            ].map(([l, v]) => (
              <div key={l} style={{
                display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                borderBottom: '1px solid rgba(196,148,58,0.04)',
              }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem',
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{l}</span>
                <span style={{
                  fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: '#d4c8b0',
                }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Pie charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '140px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.4rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px',
              }}>Ethnicity</span>
              <PieChart data={province.ethnicity} colors={ETH_COLORS} size={75} />
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 8px', marginTop: '4px' }}>
                {Object.entries(province.ethnicity).map(([k, v]) =>
                  v > 0 && (
                    <span key={k} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.38rem', color: ETH_COLORS[k] ?? '#6a6a6a' }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: ETH_COLORS[k] ?? '#6a6a6a', marginRight: 2, verticalAlign: 'middle' }} />
                      {ETH_LABELS[k] ?? k} {v}%
                    </span>
                  ),
                )}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.4rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px',
              }}>Political Lean</span>
              <PieChart data={province.politics} colors={POL_COLORS} size={75} />
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 6px', marginTop: '4px' }}>
                {Object.entries(province.politics).map(([k, v]) =>
                  v > 0 && (
                    <span key={k} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.38rem', color: POL_COLORS[k] ?? '#6a6a6a' }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: POL_COLORS[k] ?? '#6a6a6a', marginRight: 2, verticalAlign: 'middle' }} />
                      {POL_LABELS[k] ?? k} {v}%
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Page navigation ──────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 28px 16px', borderTop: '1px solid rgba(196,148,58,0.1)',
        }}>
          <button
            onClick={() => setIdx(i => (i - 1 + PROVINCE_ORDER.length) % PROVINCE_ORDER.length)}
            style={{
              background: 'none', border: '1px solid rgba(196,148,58,0.2)', color: 'var(--muted)',
              cursor: 'pointer', padding: '5px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem',
              borderRadius: '2px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,148,58,0.5)'; e.currentTarget.style.color = 'var(--amber)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,148,58,0.2)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            ◄
          </button>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.1em',
          }}>
            {idx + 1} / {PROVINCE_ORDER.length}
          </span>
          <button
            onClick={() => setIdx(i => (i + 1) % PROVINCE_ORDER.length)}
            style={{
              background: 'none', border: '1px solid rgba(196,148,58,0.2)', color: 'var(--muted)',
              cursor: 'pointer', padding: '5px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem',
              borderRadius: '2px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,148,58,0.5)'; e.currentTarget.style.color = 'var(--amber)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,148,58,0.2)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
