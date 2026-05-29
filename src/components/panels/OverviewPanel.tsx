import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import type { NationState } from '../../types/gameState'

type DeptId = 'economy' | 'military' | 'judiciary' | 'welfare' | 'security' | 'diplomacy'
type SectionId = 'policies' | 'situations'

const DEPTS: { id: DeptId; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    id: 'economy', label: 'Economy',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="4" x2="12" y2="20" />
        <polyline points="8,8 12,4 16,8" />
        <polyline points="8,16 12,20 16,16" />
      </svg>
    ),
  },
  {
    id: 'military', label: 'Military',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12,2 L16,8 L22,9 L17.5,14 L18.5,20 L12,17 L5.5,20 L6.5,14 L2,9 L8,8 Z" />
      </svg>
    ),
  },
  {
    id: 'judiciary', label: 'Judiciary',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="2" width="4" height="8" rx="1" />
        <rect x="6" y="3" width="12" height="3" rx="1" />
        <line x1="5" y1="22" x2="19" y2="22" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'welfare', label: 'Welfare',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20,12 C20,16.5 16.5,20 12,20 C7.5,20 4,16.5 4,12 C4,7.5 7.5,4 12,4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'security', label: 'Security',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12,2 L20,6 L20,14 C20,18 16,21.5 12,23 C8,21.5 4,18 4,14 L4,6 Z" />
      </svg>
    ),
  },
  {
    id: 'diplomacy', label: 'Diplomacy',
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
]

function TabBar({ active, onSelect }: { active: DeptId; onSelect: (id: DeptId) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(196,148,58,0.1)' }}>
      {DEPTS.map(d => (
        <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={() => onSelect(d.id)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active === d.id ? 'rgba(196,148,58,0.14)' : 'transparent',
              border: `1.5px solid ${active === d.id ? 'rgba(196,148,58,0.6)' : 'rgba(196,148,58,0.12)'}`,
              color: active === d.id ? 'var(--amber)' : 'rgba(107,96,80,0.45)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {d.icon(active === d.id)}
          </button>
          {active === d.id && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.4rem', letterSpacing: '0.06em', color: 'var(--amber)', textTransform: 'uppercase' }}>
              {d.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionToggle({ section, onChange }: { section: SectionId; onChange: (s: SectionId) => void }) {
  return (
    <div style={{ display: 'flex', padding: '6px 10px', gap: '4px', borderBottom: '1px solid rgba(196,148,58,0.08)' }}>
      {(['policies', 'situations'] as SectionId[]).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            flex: 1, padding: '4px 0', textAlign: 'center',
            background: section === s ? 'rgba(196,148,58,0.1)' : 'transparent',
            border: `1px solid ${section === s ? 'rgba(196,148,58,0.35)' : 'transparent'}`,
            color: section === s ? 'var(--amber)' : 'rgba(107,96,80,0.5)',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem',
            letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {s === 'policies' ? 'Policies' : 'Situations'}
        </button>
      ))}
    </div>
  )
}

function PolicyCard({ label, active, description }: { label: string; active: boolean; description?: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      onClick={() => description && setExpanded(!expanded)}
      style={{
        padding: '6px 10px', borderBottom: '1px solid rgba(196,148,58,0.04)',
        cursor: description ? 'pointer' : 'default', transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,148,58,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'var(--accent-green)' : 'var(--muted)', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: active ? '#d4c8b0' : 'rgba(107,96,80,0.5)', textDecoration: active ? 'none' : 'line-through' }}>
          {label}
        </span>
      </div>
      {expanded && description && (
        <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '0.62rem', color: 'var(--muted)', margin: '4px 0 0 12px', lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </div>
  )
}

function StatRow({ label, value, trend, color }: { label: string; value: string; trend?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid rgba(196,148,58,0.04)' }}>
      <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: '#8a7d6a' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: color ?? '#d4c8b0', letterSpacing: '0.04em' }}>{value}</span>
        {trend && <span style={{ fontSize: '0.55rem', color: trend === '↑' ? 'var(--accent-red)' : 'var(--accent-green)' }}>{trend}</span>}
      </div>
    </div>
  )
}

function RelationBar({ label, level, color }: { label: string; level: number; color: string }) {
  const labels = ['Hostile', 'Tense', 'Cool', 'Neutral', 'Warm', 'Allied']
  const idx = Math.min(labels.length - 1, Math.max(0, Math.floor(level / 20)))
  const pct = Math.min(100, level)
  return (
    <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(196,148,58,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.68rem', color: '#8a7d6a' }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color }}>{labels[idx]}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(107,96,80,0.2)', borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function EconomyTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  const projects = useGameStore(s => s.activeProjects)
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="Free Market Direction" active={flags.includes('economy_free_market')} description="Privatization and deregulation of state-owned enterprises. Foreign investment encouraged." />
          <PolicyCard label="Planned Economy" active={flags.includes('economy_planned')} description="Centralized state control of production, distribution, and pricing." />
          <PolicyCard label="Mixed Economy" active={flags.includes('economy_mixed')} description="Strategic state ownership combined with private enterprise." />
          <PolicyCard label="State Enterprise Restructuring" active={flags.includes('economy_planned') || flags.includes('economy_mixed')} />
          <PolicyCard label="Amber Coast Free Trade Zone" active={flags.includes('amber_coast_trade')} description="Special economic zone in Aldenmoor offering tax incentives for foreign trade." />
          <PolicyCard label="IMA Aid Accepted" active={flags.includes('ima_aid_accepted')} description="International Monetary Accord economic assistance program active." />
          <PolicyCard label="Rural Electrification Program" active={flags.includes('project_electrification_started')} description="Expanding electrical infrastructure to rural provinces." />
          <PolicyCard label="Kravenstal Steel Modernization" active={flags.includes('project_kravenstal_started')} description="50M VK investment in state steel facility." />
          <PolicyCard label="Ashenmere Metro" active={flags.includes('project_metro_started')} description="Underground metro system for the capital." />
          <PolicyCard label="Amber Coast Highway" active={flags.includes('project_highway_started')} description="200km highway connecting Aldenmoor to Ashenmere." />
        </div>
      ) : (
        <div>
          <StatRow label="National Debt" value={`${n.nationalDebt}M VK`} color={n.nationalDebt > 300 ? 'var(--accent-red)' : '#d4c8b0'} />
          <StatRow label="Inflation" value={`${n.inflation.toFixed(1)}%`} trend={n.inflation > 10 ? '↑' : '↓'} color={n.inflation > 15 ? 'var(--accent-red)' : n.inflation > 8 ? '#c47a3a' : '#d4c8b0'} />
          <StatRow label="Unemployment" value={`${n.unemployment.toFixed(1)}%`} trend={n.unemployment > 20 ? '↑' : '↓'} color={n.unemployment > 25 ? 'var(--accent-red)' : n.unemployment > 15 ? '#c47a3a' : '#d4c8b0'} />
          <StatRow label="GDP Trend" value={n.economyHealth >= 20 ? 'Growing' : n.economyHealth >= 0 ? 'Stagnant' : n.economyHealth >= -35 ? 'Contracting' : 'In Crisis'} color={n.economyHealth >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
          <StatRow label="Tax Revenue" value={`${380}M VK`} />
          {projects.length > 0 && (
            <div style={{ padding: '8px 10px' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.45rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Active Projects
              </p>
              {projects.filter(p => p.phase === 'active').map(p => (
                <div key={p.projectId} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.62rem', color: '#8a7d6a' }}>
                      {p.projectId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)' }}>
                      Wk {p.currentWeek}
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(107,96,80,0.15)', borderRadius: 2 }}>
                    <div style={{ height: 3, width: `${Math.min(100, (p.currentWeek / 12) * 100)}%`, background: 'var(--amber)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MilitaryTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="Military Modernization Act" active={flags.includes('military_modernization')} description="Comprehensive upgrade of Veltrian armed forces equipment and training." />
          <PolicyCard label="Conscription Reform" active={flags.includes('conscription_reform')} description="Restructured military service terms and conditions." />
          <PolicyCard label="Tyvaren Non-Aggression Pact" active={flags.includes('tyvaren_pact')} description="Diplomatic agreement with Tyvaren Confederation reducing border tensions." />
          <PolicyCard label="Sevagrad Fortification" active={flags.includes('project_sevagrad_started')} description="Fortification of eastern border defenses." />
          <PolicyCard label="State of Emergency" active={flags.includes('state_of_emergency')} description="Military given expanded domestic authority under emergency decree." />
        </div>
      ) : (
        <div>
          <StatRow label="Military Readiness" value={n.militaryReadiness >= 65 ? 'Strong' : n.militaryReadiness >= 45 ? 'Adequate' : n.militaryReadiness >= 30 ? 'Low' : 'Critical'} color={n.militaryReadiness >= 45 ? 'var(--accent-green)' : 'var(--accent-red)'} />
          <StatRow label="Tyvaren Threat" value={n.internationalStanding < 30 ? 'High' : n.internationalStanding < 50 ? 'Medium' : 'Low'} color={n.internationalStanding < 30 ? 'var(--accent-red)' : '#d4c8b0'} />
          <StatRow label="Border Status" value={n.militaryReadiness < 35 ? 'Mobilized' : n.internationalStanding < 40 ? 'Tense' : 'Calm'} color={n.militaryReadiness < 35 ? 'var(--accent-red)' : n.internationalStanding < 40 ? '#c47a3a' : 'var(--accent-green)'} />
          <StatRow label="Defense Budget" value={`${45}M VK`} />
          <StatRow label="Iron Covenant Support" value={`${useGameStore.getState().factions.ironCovenant}%`} />
        </div>
      )}
    </div>
  )
}

function JudiciaryTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="Constitutional Reform" active={flags.includes('constitution_reform')} description="Process to replace the Halvek-era constitution with a new democratic framework." />
          <PolicyCard label="Judicial Independence Act" active={flags.includes('judicial_reform')} description="Established independent judicial appointments and removed executive control over courts." />
          <PolicyCard label="Soren Trial" active={flags.includes('soren_trial_public') || flags.includes('soren_trial_plea')} description="Prosecution of former Halvek regime chief of staff." />
          <PolicyCard label="Civil Liberties Restoration" active={n.civilLiberties > 50} description="Expanded legal protections for individual rights and freedoms." />
        </div>
      ) : (
        <div>
          <StatRow label="Civil Liberties" value={n.civilLiberties >= 50 ? 'Expanding' : n.civilLiberties >= 30 ? 'Restricted' : 'Severely Restricted'} color={n.civilLiberties >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'} />
          <StatRow label="Constitution Status" value={flags.includes('constitution_reform') ? 'Under Reform' : 'Halvek Constitution'} color={flags.includes('constitution_reform') ? 'var(--accent-green)' : '#c47a3a'} />
          <StatRow label="Supreme Court" value="Old Guard 5 · Centrist 3 · Reformist 3" />
          <StatRow label="Soren Prosecution" value={flags.includes('soren_trial_public') ? 'Public Trial' : flags.includes('soren_trial_plea') ? 'Plea Deal' : flags.includes('soren_left_alone') ? 'Not Prosecuted' : 'Pending'} />
        </div>
      )}
    </div>
  )
}

function WelfareTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  const refugeeCount = useGameStore(s => s.refugeeCount)
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="Worker Safety Standards" active={flags.includes('worker_safety')} description="Mandated workplace safety regulations and enforcement mechanisms." />
          <PolicyCard label="Refugee Resettlement Act" active={flags.includes('refugee_resettlement')} description="Formal program to integrate Morivask refugees into Veltrian society." />
          <PolicyCard label="Rural Electrification Program" active={flags.includes('project_electrification_started')} />
          <PolicyCard label="Healthcare System Reform" active={flags.includes('healthcare_reform')} description="Expanded public healthcare access and hospital modernization." />
          <PolicyCard label="Education Modernization" active={flags.includes('project_university_started')} description="University expansion and curriculum reform program." />
        </div>
      ) : (
        <div>
          <StatRow label="Public Health" value={n.unemployment > 20 ? 'Strained' : 'Good'} color={n.unemployment > 20 ? '#c47a3a' : 'var(--accent-green)'} />
          <StatRow label="Morivask Refugees" value={`${(refugeeCount / 1000).toFixed(0)}k`} />
          <StatRow label="Unemployment Rate" value={`${n.unemployment.toFixed(1)}%`} />
          <StatRow label="Civil Liberties" value={n.civilLiberties >= 50 ? 'Protecting' : 'Under Pressure'} />
          <StatRow label="Poverty Rate" value={n.economyHealth < -20 ? 'Elevated' : 'Moderate'} color={n.economyHealth < -20 ? 'var(--accent-red)' : '#d4c8b0'} />
        </div>
      )}
    </div>
  )
}

function SecurityTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="BNI Status" active={true} description={flags.includes('bni_dissolved') ? 'Bureau of National Integrity has been dissolved.' : flags.includes('bni_reformed') ? 'BNI has been reformed under civilian oversight.' : 'BNI remains active under its Halvek-era mandate.'} />
          <PolicyCard label="BCA Active" active={flags.includes('bca_created')} description="Bureau of Civic Accountability — independent anti-corruption agency." />
          <PolicyCard label="SSD Active" active={flags.includes('ssd_created')} description="State Security Directorate — successor intelligence agency." />
          <PolicyCard label="State of Emergency" active={flags.includes('state_of_emergency')} description="Executive emergency powers in effect. Civil liberties suspended." />
          <PolicyCard label="Press Freedom Decree" active={flags.includes('press_freedom_decree')} description="Executive order protecting journalistic independence." />
        </div>
      ) : (
        <div>
          <StatRow label="Public Order" value={n.publicOrder >= 65 ? 'Stable' : n.publicOrder >= 48 ? 'Restless' : n.publicOrder >= 32 ? 'Volatile' : 'Crisis'} color={n.publicOrder >= 48 ? '#d4c8b0' : 'var(--accent-red)'} />
          <StatRow label="Corruption Level" value={n.corruption >= 80 ? 'Systemic' : n.corruption >= 60 ? 'High' : n.corruption >= 40 ? 'Moderate' : 'Low'} color={n.corruption >= 60 ? 'var(--accent-red)' : '#d4c8b0'} />
          <StatRow label="Press Freedom" value={n.pressFreedom >= 60 ? 'Open' : n.pressFreedom >= 35 ? 'Partially Free' : 'Suppressed'} color={n.pressFreedom >= 35 ? '#d4c8b0' : 'var(--accent-red)'} />
          <StatRow label="Mole Investigation" value={flags.includes('mole_discovered') ? 'Resolved' : flags.includes('spy_clues_gathered_1') ? 'Active' : 'No Investigation'} />
        </div>
      )}
    </div>
  )
}

function DiplomacyTab({ n, flags }: { n: NationState; flags: string[] }) {
  const [section, setSection] = useState<SectionId>('situations')
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionToggle section={section} onChange={setSection} />
      {section === 'policies' ? (
        <div>
          <PolicyCard label="Arcturian Alliance" active={flags.includes('arcturian_alliance')} description="Defensive and economic partnership with the Arcturian Commonwealth." />
          <PolicyCard label="Orythian Partnership" active={flags.includes('orythian_partnership')} description="Trade agreement with the Orythian Dominion." />
          <PolicyCard label="Tyvaren Non-Aggression Pact" active={flags.includes('tyvaren_pact')} />
          <PolicyCard label="Open Borders" active={flags.includes('refugee_open_borders')} description="Unrestricted movement for Morivask refugees." />
          <PolicyCard label="Trade Liberalization" active={flags.includes('trade_liberalization')} description="Reduced tariffs and trade barriers with neighboring nations." />
        </div>
      ) : (
        <div>
          <RelationBar label="Tyvaren" level={n.internationalStanding < 20 ? 10 : n.internationalStanding < 35 ? 25 : n.internationalStanding < 50 ? 40 : 55} color="#8b2e2e" />
          <RelationBar label="Morivask" level={40} color="#c47a3a" />
          <RelationBar label="Lytheira" level={35} color="#7b6b4a" />
          <RelationBar label="Arcturians" level={60} color="#3a5a7c" />
          <RelationBar label="Orythians" level={45} color="#5a7a5a" />
          <div style={{ padding: '8px 10px' }}>
            <StatRow label="Intl. Standing" value={n.internationalStanding >= 60 ? 'Strong' : n.internationalStanding >= 40 ? 'Moderate' : 'Weak'} color={n.internationalStanding >= 40 ? '#d4c8b0' : 'var(--accent-red)'} />
            <StatRow label="Trade Balance" value={`${n.economyHealth > 0 ? '+' : ''}${n.economyHealth}M VK`} />
            <StatRow label="Alliances" value={flags.includes('arcturian_alliance') ? '1 Active' : '0'} />
          </div>
        </div>
      )}
    </div>
  )
}

interface OverviewPanelProps {
  onClose: () => void
}

export default function OverviewPanel({ onClose }: OverviewPanelProps) {
  const [dept, setDept] = useState<DeptId>('economy')
  const nation = useGameStore(s => s.nation)
  const { activeFlags } = useNarrativeStore()

  return (
    <div style={{
      position: 'fixed', right: '52px', top: '50px', width: '320px',
      height: 'calc(100vh - 110px)', zIndex: 155,
      background: 'rgba(12,10,8,0.96)',
      border: '1px solid rgba(196,148,58,0.25)', borderRight: 'none',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 4px 24px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid rgba(196,148,58,0.15)',
        flexShrink: 0,
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: '1.1rem',
          fontWeight: 600, color: 'var(--amber)', margin: 0, letterSpacing: '0.03em',
        }}>
          Overview
        </h2>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>

      <TabBar active={dept} onSelect={setDept} />

      {dept === 'economy' && <EconomyTab n={nation} flags={activeFlags} />}
      {dept === 'military' && <MilitaryTab n={nation} flags={activeFlags} />}
      {dept === 'judiciary' && <JudiciaryTab n={nation} flags={activeFlags} />}
      {dept === 'welfare' && <WelfareTab n={nation} flags={activeFlags} />}
      {dept === 'security' && <SecurityTab n={nation} flags={activeFlags} />}
      {dept === 'diplomacy' && <DiplomacyTab n={nation} flags={activeFlags} />}
    </div>
  )
}
