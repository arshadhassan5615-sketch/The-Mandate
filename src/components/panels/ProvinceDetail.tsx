import { useState, useMemo } from 'react'
import { PROVINCES, PROVINCE_ORDER, type ProvinceData } from '../../data/provinces'
import { useCodexStore } from '../../stores/codexStore'
import { useGameStore } from '../../stores/gameStore'
import { renderWithEntities } from '../news/EntityLinker'

import kravenstalBanner from '../../assets/images/provinces/kravenstal_banner.jpeg'
import ashenmereBanner from '../../assets/images/provinces/ashenmere_banner.jpeg'
import dravenhollowBanner from '../../assets/images/provinces/dravenhollow_banner.jpeg'
import thornfeldBanner from '../../assets/images/provinces/thornfeld_banner.jpeg'
import aldenmoorBanner from '../../assets/images/provinces/aldenmoor_banner.jpeg'
import sevagradBanner from '../../assets/images/provinces/sevagrad_banner.jpeg'
import sovarkaBanner from '../../assets/images/provinces/sovarka_banner.jpeg'

const PROVINCE_BANNERS: Record<string, string> = {
  ashenmere: ashenmereBanner,
  kravenstal: kravenstalBanner,
  dravenhollow: dravenhollowBanner,
  thornfeld: thornfeldBanner,
  aldenmoor: aldenmoorBanner,
  sevagrad: sevagradBanner,
  sovarka: sovarkaBanner,
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

const PROVINCE_FACTION_KEY: Record<string, string> = {
  ashenmere: 'reformists',
  kravenstal: 'workersCoalition',
  thornfeld: 'halvekists',
  sevagrad: 'ironCovenant',
  aldenmoor: 'businessClass',
  dravenhollow: 'dravenni',
}

const FACTION_DISPLAY_NAMES: Record<string, string> = {
  reformists: 'Reformists',
  workersCoalition: "Workers' Coalition",
  halvekists: 'Halvekists',
  ironCovenant: 'Iron Covenant',
  businessClass: 'Business Class',
  dravenni: 'Dravenni',
}

function computeProvinceUnrest(provinceId: string, state: import('../../types/gameState').GameState): { level: 'Stable' | 'Tense' | 'Crisis'; color: string; detail: string } {
  const { nation: n, factions: f } = state
  switch (provinceId) {
    case 'kravenstal':
      if (n.unemployment > 28 || f.workersCoalition < 22) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Unemployment ${n.unemployment}%, workers dissent` }
      if (n.unemployment > 22 || f.workersCoalition < 36) return { level: 'Tense', color: '#c47a3a', detail: `Unemployment ${n.unemployment}%, simmering unrest` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Unemployment ${n.unemployment}%, labor cooperative` }
    case 'dravenhollow':
      if (f.dravenni < 20) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Dravenni support ${f.dravenni}, separatist threat` }
      if (f.dravenni < 38 || n.civilLiberties < 28) return { level: 'Tense', color: '#c47a3a', detail: `Dravenni support ${f.dravenni}, civil liberties strained` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Dravenni support ${f.dravenni}, autonomy dialogue` }
    case 'ashenmere':
      if (n.corruption > 78 || n.publicOrder < 28) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Corruption ${n.corruption}, public order ${n.publicOrder}` }
      if (n.corruption > 60 || n.publicOrder < 44) return { level: 'Tense', color: '#c47a3a', detail: `Corruption ${n.corruption}, press scrutinizing` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Corruption ${n.corruption}, institutions functional` }
    case 'sevagrad':
      if (n.militaryReadiness < 28) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Military readiness ${n.militaryReadiness}, border vulnerable` }
      if (n.militaryReadiness < 44 || n.internationalStanding < 36) return { level: 'Tense', color: '#c47a3a', detail: `Military readiness ${n.militaryReadiness}, border watchful` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Military readiness ${n.militaryReadiness}, garrison loyal` }
    case 'thornfeld':
      if (f.halvekists < 18) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Halvekist support ${f.halvekists}, rural revolt` }
      if (f.church < 30 || n.publicOrder < 44) return { level: 'Tense', color: '#c47a3a', detail: `Church influence ${f.church}, traditionalists agitated` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Church influence ${f.church}, harvest proceeding` }
    case 'aldenmoor':
      if (f.businessClass < 18 || n.economyHealth < -62) return { level: 'Crisis', color: 'var(--accent-red)', detail: `Business support ${f.businessClass}, economy ${n.economyHealth}` }
      if (f.businessClass < 32 || n.economyHealth < -28) return { level: 'Tense', color: '#c47a3a', detail: `Business support ${f.businessClass}, trade slowing` }
      return { level: 'Stable', color: 'var(--accent-green)', detail: `Business support ${f.businessClass}, ports active` }
    default: return { level: 'Stable', color: 'var(--accent-green)', detail: 'Nominal conditions' }
  }
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

  // Live game state
  const factions = useGameStore(s => s.factions)
  const activeProjects = useGameStore(s => s.activeProjects)
  const gameState = useGameStore()

  const factionKey = PROVINCE_FACTION_KEY[province.id] ?? '' as keyof typeof factions
  const liveFactionScore = factionKey ? factions[factionKey as keyof typeof factions] ?? 40 : 40
  const unrest = useMemo(() => computeProvinceUnrest(province.id, gameState), [province.id, gameState])

  // Active projects relevant to this province
  const provinceProjects = useMemo(() => {
    const PROJECT_PROVINCE_MAP: Record<string, string> = {
      kravenstal_steel: 'kravenstal',
      amber_coast_highway: 'aldenmoor',
      university_expansion: 'ashenmere',
      sevagrad_fortification: 'sevagrad',
      rural_electrification: 'thornfeld',
      ashenmere_metro: 'ashenmere',
    }
    return activeProjects
      .filter(p => p.phase === 'active' && PROJECT_PROVINCE_MAP[p.projectId] === province.id)
      .map(p => {
        const def = p as import('../../types/projects').ActiveProject & { projectId: string; currentWeek: number }
        return def
      })
  }, [activeProjects, province.id])

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

        <div style={{ padding: '10px 28px 0' }}>
          <img
            src={PROVINCE_BANNERS[province.id] ?? ashenmereBanner}
            alt={province.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              borderBottom: '1px solid rgba(201,168,76,0.2)',
            }}
          />
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

        {/* ── Live Province Status ─────────────────────────── */}
        <div style={{ padding: '0 28px 12px' }}>
          <div style={{
            background: 'rgba(196,148,58,0.04)',
            border: '1px solid rgba(196,148,58,0.12)',
            borderRadius: '2px',
            padding: '10px 14px',
          }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.42rem',
              color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em',
              margin: '0 0 8px',
            }}>
              Live Conditions
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Faction support */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.38rem',
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {FACTION_DISPLAY_NAMES[factionKey] ?? factionKey}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <div style={{
                    flex: 1, height: '4px', background: 'rgba(196,148,58,0.1)',
                    borderRadius: '2px', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${liveFactionScore}%`, height: '100%',
                      background: liveFactionScore >= 60 ? 'var(--accent-green)' : liveFactionScore >= 40 ? '#c47a3a' : 'var(--accent-red)',
                      borderRadius: '2px',
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.42rem',
                    color: liveFactionScore >= 60 ? 'var(--accent-green)' : liveFactionScore >= 40 ? '#c47a3a' : 'var(--accent-red)',
                    fontWeight: 700,
                  }}>
                    {liveFactionScore}
                  </span>
                </div>
              </div>
              {/* Unrest */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.38rem',
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Province Status
                </span>
                <div style={{ marginTop: '3px' }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem',
                    color: unrest.color, fontWeight: 700,
                  }}>
                    {unrest.level}
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.36rem',
                    color: 'var(--muted)', marginLeft: '6px',
                  }}>
                    {unrest.detail}
                  </span>
                </div>
              </div>
            </div>
            {/* Active projects */}
            {provinceProjects.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(196,148,58,0.08)', paddingTop: '6px' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.38rem',
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Active Projects
                </span>
                {provinceProjects.map(p => (
                  <div key={p.projectId} style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--accent-green)', flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "'Crimson Text', serif", fontSize: '0.68rem',
                      color: '#d4c8b0',
                    }}>
                      {p.projectId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.36rem',
                      color: 'var(--muted)',
                    }}>
                      Week {p.currentWeek}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
