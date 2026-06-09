import { useState, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import type { GameState } from '../types/gameState'

// ─── Province geometry & static data ──────────────────────────────────────────
// SVG canvas: 0–640 × 0–480
// viewBox extended to "-70 -60 780 600" to show neighbor-country margins

interface Province {
  id: string
  name: string
  path: string
  labelX: number
  labelY: number
  cityX: number
  cityY: number
  isCapital?: boolean
  population: string
  economy: string
  politicalLean: string
  character: string
  color: string        // warm 1960s atlas base fill
  hoverColor: string
  primaryFaction:   keyof GameState['factions']
  secondaryFaction: keyof GameState['factions']
}

const PROVINCES: Province[] = [
  {
    id: 'dravenhollow',
    name: 'Dravenhollow',
    path: 'M 0,0 L 640,0 L 640,130 L 530,118 L 430,128 L 310,108 L 200,128 L 100,118 L 0,132 Z',
    labelX: 320, labelY: 65, cityX: 318, cityY: 92,
    population: '~620,000', economy: 'Timber, Hydroelectric',
    politicalLean: 'Separatist / Autonomist',
    character: 'Mountainous north. Ethnic Dravenni minority. Suppressed under Halvek. Separatist movement growing.',
    color: '#364612', hoverColor: '#4a5e1a',
    primaryFaction: 'dravenni', secondaryFaction: 'halvekists',
  },
  {
    id: 'kravenstal',
    name: 'Kravenstal',
    path: 'M 0,132 L 100,118 L 200,128 L 185,222 L 182,332 L 78,352 L 0,342 Z',
    labelX: 90, labelY: 237, cityX: 92, cityY: 258,
    population: '~1.2M', economy: 'Steel, Coal, Manufacturing',
    politicalLean: 'Labor / Socialist',
    character: 'Industrial heartland. Heavily polluted. The Halvek steel industry still dominates. Workers wield real political power.',
    color: '#502808', hoverColor: '#662e10',
    primaryFaction: 'workersCoalition', secondaryFaction: 'halvekists',
  },
  {
    id: 'ashenmere',
    name: 'Ashenmere',
    path: 'M 200,128 L 310,108 L 430,128 L 428,218 L 422,322 L 280,340 L 182,332 L 185,222 Z',
    labelX: 305, labelY: 237, cityX: 305, cityY: 218,
    isCapital: true,
    population: '~1.8M', economy: 'Finance, Media, Government',
    politicalLean: 'Reformist / Liberal',
    character: 'The capital province. Urban, cosmopolitan. Seat of the Republic. The reformist heartland — but the old guard is entrenched.',
    color: '#4a3c0c', hoverColor: '#5e4e12',
    primaryFaction: 'reformists', secondaryFaction: 'halvekists',
  },
  {
    id: 'sevagrad',
    name: 'Sevagrad',
    path: 'M 430,128 L 530,118 L 640,130 L 640,400 L 555,425 L 480,380 L 422,322 L 428,218 Z',
    labelX: 532, labelY: 268, cityX: 520, cityY: 288,
    population: '~840,000', economy: 'Mining, Refugee Processing',
    politicalLean: 'Militarist / Anxious',
    character: 'Eastern border province. War-scarred. Tyvaren threatens across the Ondra River. Morivask refugees straining services.',
    color: '#1e3810', hoverColor: '#2a4e18',
    primaryFaction: 'ironCovenant', secondaryFaction: 'halvekists',
  },
  {
    id: 'thornfeld',
    name: 'Thornfeld',
    path: 'M 0,342 L 78,352 L 182,332 L 280,340 L 220,430 L 90,440 L 0,420 Z',
    labelX: 118, labelY: 390, cityX: 120, cityY: 408,
    population: '~780,000', economy: 'Agriculture, Livestock',
    politicalLean: 'Conservative / Nationalist',
    character: 'Rural farmland and deep tradition. The Church is the backbone of society here. Halvek nostalgia runs deep in the valleys.',
    color: '#443a08', hoverColor: '#584c10',
    primaryFaction: 'halvekists', secondaryFaction: 'church',
  },
  {
    id: 'aldenmoor',
    name: 'Aldenmoor',
    path: 'M 280,340 L 422,322 L 480,380 L 555,425 L 640,400 L 640,480 L 0,480 L 0,420 L 90,440 L 220,430 Z',
    labelX: 345, labelY: 449, cityX: 346, cityY: 462,
    population: '~950,000', economy: 'Shipping, Tourism, Trade',
    politicalLean: 'Capitalist / Pragmatist',
    character: 'Southern coastal hub on the Amber Coast. Money speaks here. Smuggling is an open secret. Business over ideology.',
    color: '#102840', hoverColor: '#183650',
    primaryFaction: 'businessClass', secondaryFaction: 'reformists',
  },
]

// ─── Province status computation ───────────────────────────────────────────────

const FACTION_LABELS: Partial<Record<keyof GameState['factions'], string>> = {
  halvekists:       'Halvekist Old Guard',
  workersCoalition: "Workers' Coalition",
  reformists:       'Reformist Bloc',
  ironCovenant:     'Iron Covenant (Military)',
  church:           'Church of the Eternal Flame',
  businessClass:    'Business Consortium',
  dravenni:         'Dravenni Council',
}

interface ConditionEntry { label: string; value: string; warning: boolean }

interface ProvinceStatus {
  crisisLevel: 0 | 1 | 2
  statusLine: string
  conditions: ConditionEntry[]
  dominantFactionId: keyof GameState['factions']
  dominantFactionName: string
  factionStance: string
}

function stance(score: number): string {
  if (score >= 68) return 'Strongly Supportive'
  if (score >= 52) return 'Generally Supportive'
  if (score >= 36) return 'Cautiously Neutral'
  if (score >= 20) return 'Skeptical'
  return 'Hostile'
}

function computeStatus(id: string, state: GameState, flags: string[]): ProvinceStatus {
  const { nation: n, factions: f } = state

  const publicOrderLabel = (v: number) =>
    v >= 65 ? 'Stable' : v >= 48 ? 'Tense' : v >= 32 ? 'Low' : 'Critical'
  const economyLabel = (v: number) =>
    v >= 20 ? 'Growing' : v >= 0 ? 'Stagnant' : v >= -35 ? 'Contracting' : 'In Crisis'

  switch (id) {
    case 'kravenstal': {
      const isCrisis = n.unemployment > 28 || f.workersCoalition < 22
      const isTense  = n.unemployment > 22 || f.workersCoalition < 36
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Wildcat strikes. Factory gates locked. Police deployed.'
          : isTense ? 'Labor agitation growing. Slowdowns spreading.'
          : 'Industrial output steady. Union leadership cooperative.',
        conditions: [
          { label: 'Unemployment', value: n.unemployment > 28 ? 'Severe' : n.unemployment > 22 ? 'High' : n.unemployment > 15 ? 'Elevated' : 'Moderate', warning: n.unemployment > 22 },
          { label: "Workers' Coalition", value: stance(f.workersCoalition), warning: f.workersCoalition < 36 },
          { label: 'Public Order', value: publicOrderLabel(n.publicOrder), warning: n.publicOrder < 48 },
          { label: 'Economy', value: economyLabel(n.economyHealth), warning: n.economyHealth < -20 },
        ],
        dominantFactionId: 'workersCoalition',
        dominantFactionName: FACTION_LABELS.workersCoalition!,
        factionStance: stance(f.workersCoalition),
      }
    }
    case 'dravenhollow': {
      const isCrisis = f.dravenni < 20 || flags.includes('bni_weaponized')
      const isTense  = f.dravenni < 38 || n.civilLiberties < 28
      const bniState = flags.includes('bni_dissolved') ? 'Dissolved' :
                       flags.includes('bni_weaponized') ? 'Weaponized ⚠' :
                       flags.includes('bni_reformed')   ? 'Reformed' : 'Active'
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Separatist violence. DLF mobilizing in the mountains.'
          : isTense ? 'Ethnic tensions high. Autonomy demands escalating.'
          : 'Relative calm. Dravenni leaders cautiously engaged.',
        conditions: [
          { label: 'Dravenni Support', value: stance(f.dravenni), warning: f.dravenni < 38 },
          { label: 'Civil Liberties', value: n.civilLiberties >= 50 ? 'Improving' : n.civilLiberties >= 30 ? 'Restricted' : 'Severely Restricted', warning: n.civilLiberties < 30 },
          { label: 'BNI Status', value: bniState, warning: flags.includes('bni_weaponized') },
          { label: 'Language Rights', value: flags.includes('bni_dissolved') ? 'Under Review' : 'Officially Suppressed', warning: !flags.includes('bni_dissolved') },
        ],
        dominantFactionId: 'dravenni',
        dominantFactionName: FACTION_LABELS.dravenni!,
        factionStance: stance(f.dravenni),
      }
    }
    case 'ashenmere': {
      const isCrisis = n.corruption > 78 || n.publicOrder < 28 || n.pressFreedom < 14
      const isTense  = n.corruption > 60 || n.publicOrder < 44 || n.pressFreedom < 26
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Civil unrest. Protests blocking Palace Square.'
          : isTense ? 'Opposition organizing. Press scrutiny intense.'
          : 'Capital stable. Reform agenda proceeding.',
        conditions: [
          { label: 'Press Freedom', value: n.pressFreedom >= 60 ? 'Open' : n.pressFreedom >= 35 ? 'Partially Free' : 'Suppressed', warning: n.pressFreedom < 35 },
          { label: 'Corruption', value: n.corruption >= 80 ? 'Endemic' : n.corruption >= 60 ? 'High' : n.corruption >= 40 ? 'Moderate' : 'Manageable', warning: n.corruption > 60 },
          { label: 'Public Order', value: publicOrderLabel(n.publicOrder), warning: n.publicOrder < 44 },
          { label: 'Reformist Base', value: stance(f.reformists), warning: f.reformists < 42 },
        ],
        dominantFactionId: 'reformists',
        dominantFactionName: FACTION_LABELS.reformists!,
        factionStance: stance(f.reformists),
      }
    }
    case 'sevagrad': {
      const isCrisis = n.militaryReadiness < 28 || (n.publicOrder < 28 && n.internationalStanding < 26)
      const isTense  = n.militaryReadiness < 44 || n.internationalStanding < 36
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Border failing. Tyvaren incursions reported.'
          : isTense ? 'Tyvaren activity elevated. Refugee influx straining services.'
          : 'Border holding. Refugee processing under control.',
        conditions: [
          { label: 'Military Readiness', value: n.militaryReadiness >= 65 ? 'High' : n.militaryReadiness >= 45 ? 'Adequate' : n.militaryReadiness >= 30 ? 'Low' : 'Critical', warning: n.militaryReadiness < 44 },
          { label: 'Intl. Standing', value: n.internationalStanding >= 60 ? 'Strong' : n.internationalStanding >= 40 ? 'Moderate' : 'Weak', warning: n.internationalStanding < 36 },
          { label: 'Iron Covenant', value: stance(f.ironCovenant), warning: f.ironCovenant < 36 },
          { label: 'Refugee Situation', value: 'Ongoing — Morivask crisis', warning: true },
        ],
        dominantFactionId: 'ironCovenant',
        dominantFactionName: FACTION_LABELS.ironCovenant!,
        factionStance: stance(f.ironCovenant),
      }
    }
    case 'thornfeld': {
      const isCrisis = f.halvekists < 18 || (n.publicOrder < 32 && f.church < 22)
      const isTense  = f.halvekists > 72 || f.church < 30 || n.publicOrder < 44
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Rural unrest. Armed Halvekist militias forming.'
          : isTense ? 'Conservative backlash. Church rallying opposition.'
          : 'Rural stability holding. Church influence dominant.',
        conditions: [
          { label: 'Halvekist Strength', value: f.halvekists >= 70 ? 'Dominant' : f.halvekists >= 50 ? 'Strong' : f.halvekists >= 30 ? 'Present' : 'Fractured', warning: f.halvekists > 65 },
          { label: 'Church Influence', value: stance(f.church), warning: f.church < 30 },
          { label: 'Public Order', value: publicOrderLabel(n.publicOrder), warning: n.publicOrder < 44 },
          { label: 'Reform Resistance', value: f.halvekists > 60 ? 'Organized' : f.halvekists > 40 ? 'Latent' : 'Fragmented', warning: f.halvekists > 60 },
        ],
        dominantFactionId: 'halvekists',
        dominantFactionName: FACTION_LABELS.halvekists!,
        factionStance: stance(f.halvekists),
      }
    }
    case 'aldenmoor': {
      const isCrisis = f.businessClass < 18 || n.economyHealth < -62
      const isTense  = f.businessClass < 32 || n.economyHealth < -28
      return {
        crisisLevel: isCrisis ? 2 : isTense ? 1 : 0,
        statusLine: isCrisis
          ? 'Capital flight. Shipping disrupted. Trade war looming.'
          : isTense ? 'Business confidence low. Investment slowing.'
          : 'Trade routes stable. Port activity normal.',
        conditions: [
          { label: 'Business Class', value: stance(f.businessClass), warning: f.businessClass < 32 },
          { label: 'Economy', value: economyLabel(n.economyHealth), warning: n.economyHealth < -20 },
          { label: 'Trade Relations', value: n.internationalStanding >= 55 ? 'Open' : n.internationalStanding >= 35 ? 'Guarded' : 'Restricted', warning: n.internationalStanding < 36 },
          { label: 'Inflation', value: n.inflation > 20 ? 'Severe' : n.inflation > 12 ? 'High' : n.inflation > 8 ? 'Elevated' : 'Moderate', warning: n.inflation > 12 },
        ],
        dominantFactionId: 'businessClass',
        dominantFactionName: FACTION_LABELS.businessClass!,
        factionStance: stance(f.businessClass),
      }
    }
    default:
      return { crisisLevel: 0, statusLine: '', conditions: [], dominantFactionId: 'reformists', dominantFactionName: '', factionStance: '' }
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', 'Special Elite', monospace" }
const serif: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" }

interface HoverTooltipProps { province: Province; status: ProvinceStatus; x: number; y: number }

function HoverTooltip({ province, status, x, y }: HoverTooltipProps) {
  const crisisColors = ['var(--accent-green)', '#c47a3a', 'var(--accent-red)']
  return (
    <div style={{
      position: 'fixed', left: x + 16, top: y - 12,
      background: 'rgba(10, 8, 6, 0.97)',
      border: '1px solid rgba(200,144,42,0.3)',
      padding: '0.6rem 0.85rem',
      pointerEvents: 'none', zIndex: 10001,
      minWidth: '210px', maxWidth: '270px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{ ...serif, fontSize: '0.88rem', color: 'var(--amber)', marginBottom: '0.2rem', fontWeight: 500 }}>
        {province.name}{province.isCapital ? ' ★' : ''}
      </div>
      <div style={{ ...mono, fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
        {province.population} · {province.economy}
      </div>
      <div style={{ ...mono, fontSize: '0.58rem', color: crisisColors[status.crisisLevel], letterSpacing: '0.04em', lineHeight: 1.5 }}>
        {status.statusLine}
      </div>
    </div>
  )
}

interface DetailPanelProps { province: Province; status: ProvinceStatus; onClose: () => void }

function DetailPanel({ province, status, onClose }: DetailPanelProps) {
  const crisisLabel = ['Stable', 'Tense', 'In Crisis']
  const crisisColor = ['var(--accent-green)', '#c47a3a', 'var(--accent-red)']
  return (
    <div style={{
      width: '300px', flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', scrollbarWidth: 'thin',
      scrollbarColor: 'var(--amber-dim) transparent',
      background: 'rgba(12,10,8,0.95)',
    }}>
      <div style={{ padding: '1.2rem 1.4rem 0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.22em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Provincial Report
          </p>
          <h2 style={{ ...serif, fontSize: '1.2rem', color: 'var(--cream)', fontWeight: 600, lineHeight: 1.2 }}>
            {province.name}{province.isCapital ? ' ★' : ''}
          </h2>
          <p style={{ ...mono, fontSize: '0.56rem', color: 'var(--muted)', letterSpacing: '0.08em', marginTop: '0.2rem' }}>
            {province.politicalLean}
          </p>
        </div>
        <button onClick={onClose} style={{ ...mono, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, paddingTop: '2px' }}>×</button>
      </div>

      <div style={{ padding: '1rem 1.4rem', flex: 1 }}>
        <p style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.2rem', fontStyle: 'italic' }}>
          {province.character}
        </p>

        <div style={{ ...mono, fontSize: '0.56rem', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Population</div>
        <div style={{ ...mono, fontSize: '0.68rem', color: 'var(--cream)', marginBottom: '0.9rem' }}>{province.population}</div>
        <div style={{ ...mono, fontSize: '0.56rem', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Economy</div>
        <div style={{ ...mono, fontSize: '0.68rem', color: 'var(--cream)', marginBottom: '1.2rem' }}>{province.economy}</div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1rem' }} />
        <div style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>▸ Current Conditions</div>
        <div style={{ ...mono, fontSize: '0.6rem', color: crisisColor[status.crisisLevel], letterSpacing: '0.06em', marginBottom: '0.8rem', lineHeight: 1.5 }}>
          {crisisLabel[status.crisisLevel].toUpperCase()} — {status.statusLine}
        </div>

        {status.conditions.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.22rem 0', borderBottom: '1px solid rgba(200,144,42,0.06)' }}>
            <span style={{ ...mono, fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>{c.label}</span>
            <span style={{ ...mono, fontSize: '0.6rem', color: c.warning ? '#c47a3a' : 'var(--cream)', letterSpacing: '0.06em' }}>{c.value}</span>
          </div>
        ))}

        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
        <div style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>▸ Dominant Faction</div>
        <div style={{ ...mono, fontSize: '0.7rem', color: 'var(--cream)', marginBottom: '0.3rem' }}>{status.dominantFactionName}</div>
        <div style={{ ...mono, fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
          Stance toward you: <span style={{ color: 'var(--cream)' }}>{status.factionStance}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Map SVG ──────────────────────────────────────────────────────────────────

interface MapSVGProps {
  statuses: Map<string, ProvinceStatus>
  hoveredId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onMouseMove: (x: number, y: number) => void
  interactive: boolean
  militaryReadiness: number
  refugeeCount: number
}

function MapSVG({ statuses, hoveredId, selectedId, onHover, onSelect, onMouseMove, interactive, militaryReadiness, refugeeCount }: MapSVGProps) {
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    onMouseMove(e.clientX, e.clientY)
  }, [onMouseMove])

  const showRefugees = refugeeCount > 2000
  const militaryWarning = militaryReadiness < 44

  return (
    <svg
      viewBox="-70 -60 780 600"
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={interactive ? () => onHover(null) : undefined}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Refugee flow arrow marker */}
        <marker id="refugee-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="rgba(180,100,30,0.65)" />
        </marker>
        {/* Mountain gradient */}
        <linearGradient id="mountain-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2a2420" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3a3430" stopOpacity="0.4" />
        </linearGradient>
        {/* Sea gradient */}
        <linearGradient id="sea-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1e2e" stopOpacity="1" />
          <stop offset="100%" stopColor="#0a1420" stopOpacity="1" />
        </linearGradient>
        {/* Tyvaren gradient (threatening grey-blue from north) */}
        <linearGradient id="tyvaren-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1c1e" stopOpacity="1" />
          <stop offset="100%" stopColor="#141214" stopOpacity="0.6" />
        </linearGradient>
        {/* Morivask gradient (unstable orange from east) */}
        <linearGradient id="morivask-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1c0c06" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#261408" stopOpacity="1" />
        </linearGradient>
        {/* Lytheira gradient (imperial purple from west) */}
        <linearGradient id="lytheira-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#14101e" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1a1428" stopOpacity="1" />
        </linearGradient>
        {/* Province hover glow filter */}
        <filter id="province-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* ── Map background ──────────────────────────────────────────── */}
      <rect x="-70" y="-60" width="780" height="600" fill="#0c0a07" />

      {/* ── Thalassic Sea (south) ──────────────────────────────────── */}
      <rect x="-70" y="476" width="780" height="84" fill="url(#sea-grad)" />
      <text x="320" y="508" textAnchor="middle" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '13px', fill: '#1a3040', letterSpacing: '5px', fontStyle: 'italic' }}>
        THALASSIC SEA
      </text>
      <text x="320" y="522" textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', fill: '#142030', letterSpacing: '3px' }}>
        AMBER COAST
      </text>
      {/* Coastline shimmer */}
      <line x1="-70" y1="480" x2="710" y2="480" stroke="rgba(30,60,90,0.4)" strokeWidth="1.5" />

      {/* ── Tyvaren Confederation (north) — threatening grey ─────── */}
      <rect x="-70" y="-60" width="780" height="68" fill="url(#tyvaren-grad)" />
      {/* Country border (bold dark line) */}
      <line x1="-70" y1="0" x2="710" y2="0" stroke="rgba(60,50,40,0.6)" strokeWidth="1.5" />
      <text x="320" y="-36" textAnchor="middle" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '11px', fill: '#3a3434', letterSpacing: '4px', fontStyle: 'italic' }}>
        TYVAREN CONFEDERATION
      </text>
      <text x="320" y="-20" textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7.5px', fill: '#2e2828', letterSpacing: '2.5px' }}>
        GRAVENMARK MOUNTAINS
      </text>

      {/* Mountain range symbols in Tyvaren area */}
      <g opacity="0.55" style={{ pointerEvents: 'none' }}>
        {/* Row of overlapping mountain triangles */}
        <polygon points="40,-2 58,-38 76,-2" fill="url(#mountain-grad)" />
        <polygon points="62,-2 84,-48 106,-2" fill="#302a28" opacity="0.9" />
        <polygon points="100,-2 120,-42 140,-2" fill="url(#mountain-grad)" />
        <polygon points="134,-2 158,-52 182,-2" fill="#302a28" opacity="0.9" />
        <polygon points="176,-2 200,-44 224,-2" fill="url(#mountain-grad)" />
        <polygon points="218,-2 245,-55 272,-2" fill="#302a28" opacity="0.9" />
        <polygon points="265,-2 290,-46 315,-2" fill="url(#mountain-grad)" />
        <polygon points="310,-2 336,-50 362,-2" fill="#302a28" opacity="0.9" />
        <polygon points="355,-2 380,-44 405,-2" fill="url(#mountain-grad)" />
        <polygon points="398,-2 425,-52 452,-2" fill="#302a28" opacity="0.9" />
        <polygon points="445,-2 470,-42 495,-2" fill="url(#mountain-grad)" />
        <polygon points="488,-2 512,-50 536,-2" fill="#302a28" opacity="0.9" />
        <polygon points="528,-2 552,-44 576,-2" fill="url(#mountain-grad)" />
        <polygon points="568,-2 590,-48 612,-2" fill="#302a28" opacity="0.9" />
        {/* Snow-cap highlights */}
        <polygon points="155,-44 165,-56 175,-44" fill="#4a4442" opacity="0.5" />
        <polygon points="240,-47 250,-58 260,-47" fill="#4a4442" opacity="0.5" />
        <polygon points="328,-42 336,-52 344,-42" fill="#4a4442" opacity="0.5" />
        <polygon points="420,-44 428,-54 436,-44" fill="#4a4442" opacity="0.5" />
      </g>

      {/* ── Morivask (east) — unstable orange-brown ──────────────── */}
      <rect x="640" y="-60" width="70" height="600" fill="url(#morivask-grad)" />
      {/* Country border (bold) */}
      <line x1="640" y1="-60" x2="640" y2="540" stroke="rgba(60,40,20,0.6)" strokeWidth="1.5" />
      <text x="688" y="240" textAnchor="middle" transform="rotate(90, 688, 240)"
        style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '10px', fill: '#2e1c10', letterSpacing: '3px', fontStyle: 'italic' }}>
        MORIVASK
      </text>

      {/* ── Ondra River (east border) ─────────────────────────────── */}
      <path d="M 642,118 C 655,200 652,310 648,405"
        fill="none" stroke="rgba(20,50,80,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <text x="656" y="270" textAnchor="middle" transform="rotate(90, 656, 270)"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: '#1a3040', letterSpacing: '1.5px' }}>
        ONDRA RIVER
      </text>

      {/* ── Lytheira (west) — imperial faded purple ───────────────── */}
      <rect x="-70" y="-60" width="70" height="600" fill="url(#lytheira-grad)" />
      {/* Country border */}
      <line x1="0" y1="-60" x2="0" y2="540" stroke="rgba(40,30,50,0.5)" strokeWidth="1.5" />
      <text x="-38" y="240" textAnchor="middle" transform="rotate(-90, -38, 240)"
        style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '10px', fill: '#24182e', letterSpacing: '3px', fontStyle: 'italic' }}>
        LYTHEIRA
      </text>

      {/* ── Province fills ────────────────────────────────────────── */}
      {PROVINCES.map(p => {
        const status = statuses.get(p.id)!
        const isHovered  = hoveredId === p.id
        const isSelected = selectedId === p.id
        const fill = isHovered || isSelected ? p.hoverColor : p.color
        const strokeColor = isHovered
          ? '#c9a84c'
          : isSelected
            ? 'rgba(200,144,42,0.9)'
            : 'rgba(0,0,0,0.4)'
        const strokeWidth = isHovered ? 2.5 : isSelected ? 1.5 : 1

        return (
          <g key={p.id}>
            {/* Province fill */}
            <path
              d={p.path}
              fill={fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isSelected || isHovered ? 'none' : '5,2'}
              filter={isHovered ? 'url(#province-glow)' : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.18s ease, stroke 0.18s ease' }}
              onMouseEnter={interactive ? () => onHover(p.id) : undefined}
              onClick={interactive ? () => onSelect(p.id) : undefined}
            />

            {/* Crisis pulse overlay */}
            {status.crisisLevel === 2 && (
              <path d={p.path} fill="rgb(120,30,30)"
                style={{ animation: 'province-crisis 2.5s ease-in-out infinite', pointerEvents: 'none' }} />
            )}
            {status.crisisLevel === 1 && (
              <path d={p.path} fill="rgb(160,85,15)"
                style={{ animation: 'province-tense 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
            )}

            {/* Province name label */}
            <text
              x={p.labelX} y={p.labelY - 8}
              textAnchor="middle"
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: p.isCapital ? '10.5px' : '9.5px',
                fill: isHovered || isSelected ? 'rgba(200,144,42,0.92)' : 'rgba(180,150,80,0.55)',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                transition: 'fill 0.18s ease',
                fontStyle: 'italic',
              }}
            >
              {p.name.toUpperCase()}
            </text>

            {/* Economy sub-label */}
            <text
              x={p.labelX} y={p.labelY + 5}
              textAnchor="middle"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '6.5px',
                fill: 'rgba(100,82,50,0.55)',
                letterSpacing: '1px',
                pointerEvents: 'none',
              }}
            >
              {p.economy.toUpperCase()}
            </text>

            {/* Crisis indicator dot */}
            {status.crisisLevel >= 1 && (
              <circle
                cx={p.labelX + 28} cy={p.labelY - 16} r={status.crisisLevel === 2 ? 4 : 3}
                fill={status.crisisLevel === 2 ? 'rgba(180,50,50,0.9)' : 'rgba(180,110,30,0.85)'}
                style={{ animation: `province-crisis ${status.crisisLevel === 2 ? '1.8' : '2.8'}s ease-in-out infinite`, pointerEvents: 'none' }}
              />
            )}

            {/* City dot */}
            <circle cx={p.cityX} cy={p.cityY} r={p.isCapital ? 3.5 : 2}
              fill={isHovered || isSelected ? 'var(--amber)' : 'rgba(160,120,50,0.5)'}
              style={{ pointerEvents: 'none', transition: 'fill 0.18s ease' }}
            />
          </g>
        )
      })}

      {/* ── Veltria outer border (bold country border) ────────────── */}
      <rect x="0" y="0" width="640" height="480"
        fill="none" stroke="rgba(100,75,40,0.45)" strokeWidth="2"
      />

      {/* ── Capital star marker ───────────────────────────────────── */}
      <circle cx={305} cy={218} r={4} fill="var(--amber)" opacity={0.85} style={{ pointerEvents: 'none' }} />
      <circle cx={305} cy={218} r={7} fill="none" stroke="var(--amber)" strokeWidth="0.8" opacity={0.35} style={{ pointerEvents: 'none' }} />
      <text x={314} y={214} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: 'rgba(200,144,42,0.55)', letterSpacing: '0.5px', pointerEvents: 'none' }}>
        ASHENMERE
      </text>

      {/* ── Dynamic map markers ───────────────────────────────────── */}

      {/* Military readiness warning shield near Sevagrad border */}
      {militaryWarning && (
        <g transform="translate(566, 194)" style={{ pointerEvents: 'none' }}>
          <path d="M8,0 L16,3 L16,16 C16,24 8,28 8,28 C8,28 0,24 0,16 L0,3 Z"
            fill="rgba(180,120,30,0.12)" stroke="rgba(200,144,42,0.5)" strokeWidth="1.2" />
          <text x="8" y="19" textAnchor="middle"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fill: 'rgba(200,144,42,0.6)' }}>!</text>
        </g>
      )}

      {/* Refugee flow arrow (Morivask → Sevagrad) */}
      {showRefugees && (
        <g style={{ pointerEvents: 'none' }}>
          <path d="M 704,258 C 680,260 658,265 542,272"
            fill="none" stroke="rgba(180,100,30,0.55)" strokeWidth="1.5"
            strokeDasharray="5,4" markerEnd="url(#refugee-arrow)" />
          <text x="658" y="252" textAnchor="middle"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '6.5px', fill: 'rgba(160,90,30,0.65)', letterSpacing: '1px' }}>
            REFUGEES
          </text>
        </g>
      )}

      {/* ── Status legend (overlay mode only) ────────────────────── */}
      {interactive && (
        <g>
          <rect x="-60" y="458" width="160" height="56" fill="rgba(10,8,6,0.75)" stroke="rgba(200,144,42,0.15)" strokeWidth="0.5" />
          <text x="-52" y="470" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: 'rgba(200,144,42,0.5)', letterSpacing: '1.5px' }}>STATUS KEY</text>
          <rect x="-52" y="477" width="8" height="5" fill="rgba(74,107,58,0.6)" />
          <text x="-40" y="483" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: 'rgba(100,82,50,0.7)' }}>STABLE</text>
          <rect x="-52" y="488" width="8" height="5" fill="rgba(180,100,20,0.6)" />
          <text x="-40" y="494" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: 'rgba(100,82,50,0.7)' }}>TENSE</text>
          <rect x="-52" y="499" width="8" height="5" fill="rgba(139,46,46,0.6)" />
          <text x="-40" y="505" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '7px', fill: 'rgba(100,82,50,0.7)' }}>CRISIS</text>
        </g>
      )}
    </svg>
  )
}

// ─── City Medallion ──────────────────────────────────────────────────────────

function CityIcon({ type }: { type: string }) {
  switch (type) {
    case 'capital': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="7" width="18" height="13" rx="1" />
        <polygon points="12,2 3,7 21,7" />
        <rect x="8" y="10" width="2" height="3" />
        <rect x="11" y="10" width="2" height="3" />
        <rect x="14" y="10" width="2" height="3" />
      </svg>
    )
    case 'industrial': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="6" width="6" height="10" />
        <rect x="14" y="8" width="6" height="8" />
        <polyline points="10,6 14,8" />
        <line x1="4" y1="16" x2="20" y2="16" />
      </svg>
    )
    case 'church': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="12" width="12" height="10" rx="1" />
        <polygon points="12,2 6,8 18,8" />
        <line x1="12" y1="8" x2="12" y2="12" />
      </svg>
    )
    case 'fortress': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="10" width="20" height="12" rx="1" />
        {[[4,2],[9,1],[14,1],[19,2]].map(([x,y], i) => (
          <rect key={i} x={x} y={y} width="5" height="8" rx="0.5" />
        ))}
        <rect x="10" y="12" width="4" height="6" />
      </svg>
    )
    case 'harbor': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="12" width="8" height="8" rx="1" />
        <polygon points="12,6 6,12 18,12" />
        <line x1="6" y1="12" x2="6" y2="16" />
        <line x1="18" y1="12" x2="18" y2="16" />
      </svg>
    )
    case 'mountain': return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="2,18 10,4 18,18" />
        <polygon points="8,14 14,8 20,14" opacity="0.5" />
      </svg>
    )
    default: return <CityIcon type="capital" />
  }
}

function getMedallionType(economy: string): string {
  if (economy.includes('Government') || economy.includes('Finance') || economy.includes('Media')) return 'capital'
  if (economy.includes('Steel') || economy.includes('Coal') || economy.includes('Manufacturing')) return 'industrial'
  if (economy.includes('Agriculture') || economy.includes('Livestock')) return 'church'
  if (economy.includes('Mining') || economy.includes('Military') || economy.includes('Refugee')) return 'fortress'
  if (economy.includes('Shipping') || economy.includes('Tourism') || economy.includes('Trade')) return 'harbor'
  if (economy.includes('Timber') || economy.includes('Hydroelectric')) return 'mountain'
  return 'capital'
}

function CityMedallion({ cityName, economy, isCapital, hasEvent, onClick }: {
  cityName: string
  economy: string
  isCapital?: boolean
  hasEvent?: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const iconType = getMedallionType(economy)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '42px', height: '42px', borderRadius: '50%',
        background: hovered ? 'rgba(20,15,8,0.95)' : 'rgba(10,8,6,0.85)',
        border: `2px solid ${hovered ? 'rgba(200,144,42,0.8)' : 'rgba(200,144,42,0.4)'}`,
        cursor: 'pointer', pointerEvents: 'all',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? 'var(--amber)' : 'rgba(180,150,80,0.6)',
        boxShadow: hovered
          ? '0 0 16px rgba(200,144,42,0.3), 0 2px 8px rgba(0,0,0,0.5)'
          : '0 2px 6px rgba(0,0,0,0.4)',
        transition: 'all 0.2s ease',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        position: 'relative',
        zIndex: hovered ? 5 : 1,
      }}
    >
      <CityIcon type={iconType} />

      {isCapital && (
        <div style={{
          position: 'absolute', top: '-6px', right: '-6px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 6px rgba(200,144,42,0.4)',
        }}>
          <span style={{ fontSize: '8px', color: '#1a1410', fontWeight: 700 }}>★</span>
        </div>
      )}

      {hasEvent && (
        <div style={{
          position: 'absolute', top: '-4px', left: '-4px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#c8902a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 8px rgba(200,144,42,0.5)',
          animation: 'event-pulse 1.5s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '10px', color: '#1a1410', fontWeight: 900, lineHeight: 1 }}>!</span>
        </div>
      )}

      {hovered && (
        <div style={{
          position: 'absolute', bottom: '-22px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.45rem', letterSpacing: '0.06em',
          color: 'var(--amber)', textTransform: 'uppercase',
          background: 'rgba(10,8,6,0.9)', padding: '2px 6px',
          border: '1px solid rgba(200,144,42,0.3)',
        }}>
          {cityName}
        </div>
      )}
    </button>
  )
}

export default function VeltriaMap({ onProvinceDetail, mapImage }: {
  onProvinceDetail?: (id: string) => void
  mapImage?: string
}) {
  const mapOpen   = useSettingsStore(s => s.mapOpen)
  const setOpen   = useSettingsStore(s => s.setMapOpen)
  const phase     = useWeekStore(s => s.phase)
  const currentWeek = useGameStore(s => s.currentWeek)

  const [hoveredId,  setHoveredId]  = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mousePos,   setMousePos]   = useState({ x: 0, y: 0 })

  const gameState  = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const militaryReadiness = useGameStore(s => s.nation.militaryReadiness)
  const refugeeCount      = useGameStore(s => s.refugeeCount)

  const statuses = new Map<string, ProvinceStatus>(
    PROVINCES.map(p => [p.id, computeStatus(p.id, gameState, activeFlags)])
  )

  const hoveredProvince  = hoveredId  ? PROVINCES.find(p => p.id === hoveredId)  ?? null : null
  const selectedProvince = selectedId ? PROVINCES.find(p => p.id === selectedId) ?? null : null

  const isGameplay = phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue'

  if (!isGameplay) return null

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id)
    onProvinceDetail?.(id)
  }

  // ── Background mode (map always visible as war-room backdrop) ──
  if (!mapOpen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#0c0a07',
        pointerEvents: 'none',
      }}>
        {mapImage ? (
          <img
            src={mapImage}
            alt="Veltria Map"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.7,
            }}
          />
        ) : (
          <MapSVG
            statuses={statuses}
            hoveredId={null} selectedId={null}
            onHover={() => {}} onSelect={() => {}} onMouseMove={() => {}}
            interactive={false}
            militaryReadiness={militaryReadiness}
            refugeeCount={refugeeCount}
          />
        )}
        {mapImage && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
            {PROVINCES.map(p => {
              const status = statuses.get(p.id)
              const crisisLevel = status?.crisisLevel ?? 0
              const hasEvent = crisisLevel > 0
              return (
                <div key={p.id} style={{ position: 'absolute', left: `${(p.cityX / 640) * 100}%`, top: `${(p.cityY / 480) * 100}%`, transform: 'translate(-50%, -50%)' }}>
                  <CityMedallion
                    cityName={p.name}
                    economy={p.economy}
                    isCapital={p.isCapital}
                    hasEvent={hasEvent}
                    onClick={() => onProvinceDetail?.(p.id)}
                  />
                </div>
              )
            })}
          </div>
        )}
        {mapImage && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.6 }} viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
            {PROVINCES.map(p => {
              const status = statuses.get(p.id)
              const score = status ? (gameState.factions[p.primaryFaction] ?? 40) : 40
              const opacity = 0.04 + (score / 100) * 0.08
              const color = p.primaryFaction === 'reformists' ? '58,90,124' :
                p.primaryFaction === 'workersCoalition' ? '139,46,46' :
                p.primaryFaction === 'halvekists' ? '100,100,100' :
                p.primaryFaction === 'ironCovenant' ? '74,107,58' :
                p.primaryFaction === 'church' ? '155,123,58' :
                p.primaryFaction === 'businessClass' ? '90,122,90' :
                '123,90,58'
              return (
                <path key={p.id} d={p.path} fill={`rgba(${color},${opacity})`} opacity={opacity * 10} />
              )
            })}
          </svg>
        )}
      </div>
    )
  }

  // ── Overlay / interactive mode ─────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,8,6,0.97)',
      zIndex: 9998,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'IBM Plex Mono', 'Special Elite', monospace",
    }}>
      {/* TEMP DEBUG — remove before release */}
      {(() => {
        return (
          <div style={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            color: '#c9a84c',
            padding: '12px 24px',
            borderRadius: 4,
            border: '1px solid #c9a84c',
            fontFamily: 'monospace',
            fontSize: 13,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}>
            <span>Phase: <strong>{phase}</strong></span>
            <button
              onClick={() => useWeekStore.setState({ phase: 'briefing' })}
              style={{ background: '#c9a84c', color: '#000', border: 'none',
                padding: '4px 12px', cursor: 'pointer', fontFamily: 'monospace' }}
            >
              → Briefing
            </button>
            <button
              onClick={() => useWeekStore.setState({ phase: 'press' })}
              style={{ background: '#c9a84c', color: '#000', border: 'none',
                padding: '4px 12px', cursor: 'pointer', fontFamily: 'monospace' }}
            >
              → Press
            </button>
            <button
              onClick={() => useWeekStore.setState({ phase: 'agenda' })}
              style={{ background: '#c9a84c', color: '#000', border: 'none',
                padding: '4px 12px', cursor: 'pointer', fontFamily: 'monospace' }}
            >
              → Agenda
            </button>
          </div>
        )
      })()}

      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0.6rem 2rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(12,10,8,0.95)',
      }}>
        <div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--amber)', fontStyle: 'italic' }}>
            Republic of Veltria — Provincial Overview
          </span>
          <span style={{ marginLeft: '2rem', fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>
            Week {currentWeek} · 1963
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            Click province for report · M to close
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.62rem', letterSpacing: '0.1em', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            CLOSE MAP
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SVG map area */}
        <div style={{ flex: 1, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: '840px', aspectRatio: '780 / 600', position: 'relative' }}>
            <MapSVG
              statuses={statuses}
              hoveredId={hoveredId} selectedId={selectedId}
              onHover={setHoveredId} onSelect={handleSelect}
              onMouseMove={(x, y) => setMousePos({ x, y })}
              interactive={true}
              militaryReadiness={militaryReadiness}
              refugeeCount={refugeeCount}
            />
            {hoveredId && (
              <div style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(10,8,4,0.9)',
                border: '1px solid rgba(201,168,76,0.5)',
                color: '#c9a84c',
                padding: '4px 14px',
                fontFamily: "'Special Elite', monospace",
                fontSize: 11,
                letterSpacing: '2px',
                pointerEvents: 'none',
                zIndex: 100,
              }}>
                {PROVINCES.find(p => p.id === hoveredId)?.name.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel (right side) */}
        {selectedProvince ? (
          <DetailPanel
            province={selectedProvince}
            status={statuses.get(selectedProvince.id)!}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div style={{
            width: '280px', flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem 1.5rem',
            background: 'rgba(12,10,8,0.9)',
          }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.8, textTransform: 'uppercase' }}>
              Select a province<br />for detailed report
            </p>
            <div style={{ marginTop: '2rem', width: '32px', height: '1px', background: 'var(--border)' }} />
            <div style={{ marginTop: '2rem', width: '100%' }}>
              {PROVINCES.map(p => {
                const s = statuses.get(p.id)!
                const dotColor = s.crisisLevel === 2 ? 'var(--accent-red)' : s.crisisLevel === 1 ? '#c47a3a' : 'var(--accent-green)'
                return (
                  <button key={p.id} onClick={() => handleSelect(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.32rem 0', marginBottom: '0.1rem' }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.64rem', color: 'var(--muted)', letterSpacing: '0.06em', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {p.name}{p.isCapital ? ' ★' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, display: 'flex', justifyContent: 'space-between',
        padding: '0.5rem 2rem', borderTop: '1px solid var(--border)',
        background: 'rgba(12,10,8,0.95)',
      }}>
        <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          Province data reflects current national conditions
        </span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--amber-dim)', fontStyle: 'italic' }}>
          Classified — Chancellor Eyes Only
        </span>
      </div>

      {/* Hover tooltip */}
      {hoveredProvince && (
        <HoverTooltip
          province={hoveredProvince}
          status={statuses.get(hoveredProvince.id)!}
          x={mousePos.x} y={mousePos.y}
        />
      )}
    </div>
  )
}
