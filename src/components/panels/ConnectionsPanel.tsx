import { useState, type JSX } from 'react'
import CharacterPortrait from '../portraits/CharacterPortrait'
import { useGameStore } from '../../stores/gameStore'
import { useCodexStore } from '../../stores/codexStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { Z } from '../../constants/zIndex'

type TabId = 'cabinet' | 'factions' | 'legislative' | 'judiciary' | 'favors' | 'trust'

const TABS: { id: TabId; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    id: 'cabinet', label: 'Cabinet',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="6" r="3" />
        <path d="M3,20 C3,15 6,13 9,13 C12,13 15,15 15,20" />
        <circle cx="18" cy="7" r="2.5" />
        <path d="M15,13 C17,13 21,14.5 21,19" />
      </svg>
    ),
  },
  {
    id: 'factions', label: 'Factions',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12,2 L15.5,8.5 L22,9.5 L17.5,14.5 L18.5,22 L12,18.5 L5.5,22 L6.5,14.5 L2,9.5 L8.5,8.5 Z" />
      </svg>
    ),
  },
  {
    id: 'legislative', label: 'Legislative',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <rect x="2" y="20" width="20" height="2" rx="0.5" />
        <rect x="2" y="8" width="20" height="2" rx="0.5" />
        <rect x="11" y="2" width="2" height="8" rx="0.5" />
        <rect x="4" y="10" width="2" height="10" rx="0.5" />
        <rect x="8" y="10" width="2" height="10" rx="0.5" />
        <rect x="14" y="10" width="2" height="10" rx="0.5" />
        <rect x="18" y="10" width="2" height="10" rx="0.5" />
      </svg>
    ),
  },
  {
    id: 'judiciary', label: 'Judiciary',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="2" width="4" height="8" rx="1" />
        <rect x="6" y="3" width="12" height="3" rx="1" />
        <path d="M12,10 L12,14" />
        <line x1="5" y1="22" x2="19" y2="22" strokeWidth="2" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    id: 'favors', label: 'Favors',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12,2 L15.5,8.5 L22,9.5 L17.5,14.5 L18.5,22 L12,18.5 L5.5,22 L6.5,14.5 L2,9.5 L8.5,8.5 Z" />
      </svg>
    ),
  },
  {
    id: 'trust', label: 'Trust',
    icon: (_a) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2 L4 6 V12 C4 17 8 21 12 22 C16 21 20 17 20 12 V6 Z" />
      </svg>
    ),
  },
]

const CABINET_MEMBERS: { id: string; name: string; role: string; flag?: string; sceneRequired?: string }[] = [
  { id: 'character_vyktor_reznik', name: 'Vyktor Reznik', role: 'Chief of Staff' },
  { id: 'character_elara_vostane', name: 'Elara Vostane', role: 'Minister of Finance' },
  { id: 'character_gregor_maric', name: 'Gregor Marić', role: 'Minister of Labor & Welfare' },
  { id: 'character_irina_dusek', name: 'Col. Irina Dusek', role: 'Minister of Defense' },
  { id: 'character_aldric_theron', name: 'Prof. Aldric Theron', role: 'Minister of Justice' },
  { id: 'character_danika_oberlin', name: 'Danika Oberlin', role: 'Minister of the Interior' },
  { id: 'character_stanislov_renek', name: 'Archbishop Renek', role: 'Religious Affairs Advisor', sceneRequired: 'act1_week10_church_education' },
  { id: 'character_lucan_vael', name: 'Lucan Vael', role: 'Trade & Industry Liaison', sceneRequired: 'act1_week8_vael_offer' },
  { id: 'character_stefan_morvec', name: 'Stefan Morvec', role: 'Patriarch — Morvec Holdings', flag: 'morvec_first_contact' },
  { id: 'character_maren_tovik', name: 'Maren Tovik', role: 'BCA Chief', flag: 'bca_created' },
  { id: 'character_viktor_dorne', name: 'Viktor Dorne', role: 'SSD Director', flag: 'ssd_created' },
]

interface FactionData {
  id: string; name: string; color: string; description: string
  leaderId: string; leaderName: string; leaderRole: string
}

const FACTIONS: FactionData[] = [
  {
    id: 'halvekists', name: 'The Halvekists', color: '#5a5a5a',
    description: 'The old guard who long for authoritarian stability and the supremacy of Veltrian identity.',
    leaderId: 'character_drazen_kolvar', leaderName: 'Dražen Kolvar', leaderRole: 'Opposition Leader',
  },
  {
    id: 'workersCoalition', name: "Workers' Unity Coalition", color: '#8b2e2e',
    description: "Democratic socialists demanding wealth redistribution, workers' rights, and dismantling the old regime.",
    leaderId: 'character_soraya_khaled', leaderName: 'Soraya Khaled', leaderRole: 'Union President',
  },
  {
    id: 'reformists', name: 'Civic Renewal Movement', color: '#3a5a7c',
    description: "Reformists pushing for a new constitution, free speech, and a complete break from Halvek's legacy.",
    leaderId: 'character_katerin_ashavel', leaderName: 'Katerin Ashavel', leaderRole: 'Chancellor & Party Leader',
  },
  {
    id: 'ironCovenant', name: 'The Iron Covenant', color: '#4a6b3a',
    description: 'Military nationalists demanding strong defense, closed borders, and ethnic Veltrian supremacy.',
    leaderId: 'character_oskar_brenner', leaderName: 'Gen. Oskar Brenner', leaderRole: 'Chief of General Staff',
  },
  {
    id: 'church', name: 'Church of the Eternal Flame', color: '#9b7b3a',
    description: 'The dominant religious institution, wielding enormous social influence over rural Veltria.',
    leaderId: 'character_stanislov_renek', leaderName: 'Archbishop Stanislov Renek', leaderRole: 'Primate of Veltria',
  },
  {
    id: 'businessClass', name: 'The Business Class', color: '#5a7a5a',
    description: 'Oligarchs and industrialists who want privatization, deregulation, and access to foreign markets.',
    leaderId: 'character_lucan_vael', leaderName: 'Margrave Lucan Vael', leaderRole: 'Industrialist & Oligarch',
  },
  {
    id: 'dravenni', name: 'Dravenni Liberation Front', color: '#7b5a3a',
    description: 'Ethnic minority seeking language rights, autonomy, and acknowledgment of Halvek-era ethnic cleansing.',
    leaderId: 'character_idris_kaelen', leaderName: 'Idris Kaelen', leaderRole: 'Dravenni Leader',
  },
]

const LEGISLATIVE_PARTIES = [
  { name: 'Civic Renewal', seats: 130, color: '#3a5a7c' },
  { name: 'Halvekist Front', seats: 70, color: '#5a5a5a' },
  { name: "Workers' Coalition", seats: 35, color: '#8b2e2e' },
  { name: 'Independents', seats: 15, color: '#d4c8b0' },
]

interface JusticeData {
  name: string; role: string; faction: string; dotColor: string; age: number
}

const JUSTICES: JusticeData[] = [
  { name: 'Marta Severin', role: 'Chief Justice', faction: 'Old Guard', dotColor: '#8b2e2e', age: 62 },
  { name: 'Teodor Grant', role: 'Associate Justice', faction: 'Centrist', dotColor: '#c8902a', age: 55 },
  { name: 'Anna Kovic', role: 'Associate Justice', faction: 'Reformist', dotColor: '#3a5a7c', age: 48 },
  { name: 'Helmut Draeger', role: 'Associate Justice', faction: 'Old Guard', dotColor: '#8b2e2e', age: 67 },
]

const JUDICIARY_COUNTS = { oldGuard: 5, centrist: 3, reformist: 3 }

function TabBar({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '8px 0 10px', borderBottom: '1px solid rgba(196,148,58,0.1)' }}>
      {TABS.map(tab => (
        <div key={tab.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={() => onSelect(tab.id)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active === tab.id ? 'rgba(196,148,58,0.14)' : 'transparent',
              border: `1.5px solid ${active === tab.id ? 'rgba(196,148,58,0.6)' : 'rgba(196,148,58,0.15)'}`,
              color: active === tab.id ? 'var(--amber)' : 'rgba(107,96,80,0.5)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.icon(active === tab.id)}
          </button>
          {active === tab.id && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.45rem', letterSpacing: '0.08em',
              color: 'var(--amber)', textTransform: 'uppercase',
            }}>
              {tab.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function CabinetTab({ flags, visitedSceneIds }: { flags: string[]; visitedSceneIds: string[] }) {
  const openCodex = useCodexStore(s => s.openCodex)
  const viewEntry = useCodexStore(s => s.viewEntry)

  const cabinetAppointed = visitedSceneIds.includes('act1_week2_cabinet_appointments')

  const visibleMembers = CABINET_MEMBERS.filter(m => {
    if (m.id === 'character_vyktor_reznik') return true
    if (!cabinetAppointed) return false
    if (m.flag && !flags.includes(m.flag)) return false
    if (m.sceneRequired && !visitedSceneIds.includes(m.sceneRequired)) return false
    return true
  })

  if (!cabinetAppointed) {
    return (
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          color: 'rgba(201,168,76,0.5)',
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          The cabinet has not yet been formally appointed. Your ministers await confirmation.
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {visibleMembers.map(m => (
        <div
          key={m.id}
          onClick={() => { viewEntry(m.id); openCodex(undefined, m.id) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
            borderBottom: '1px solid rgba(196,148,58,0.06)', cursor: 'pointer',
            transition: 'background 0.15s', borderLeft: '3px solid transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,148,58,0.04)'; e.currentTarget.style.borderLeftColor = 'rgba(196,148,58,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}
        >
          <CharacterPortrait characterId={m.id} isActive={false} size={48} showName={false} />
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.82rem', color: '#e8dcc8', margin: 0, lineHeight: 1.2 }}>
              {m.name}
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.52rem', color: 'var(--muted)', margin: '1px 0 0', letterSpacing: '0.06em' }}>
              {m.role}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FactionsTab() {
  const scores = useGameStore(s => s.factions)
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {FACTIONS.map(f => {
        const score = scores[f.id as keyof typeof scores] ?? 0
        return (
          <div key={f.id} style={{ marginBottom: '1px' }}>
            <div style={{
              background: f.color, height: '30px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 10px',
            }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.75rem', fontWeight: 600, color: '#f5f0e8' }}>
                {f.name}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)' }}>
                {score >= 70 ? 'Strongly Supportive' : score >= 55 ? 'Supportive' : score >= 40 ? 'Neutral' : score >= 25 ? 'Skeptical' : 'Hostile'}
              </span>
            </div>
            <p style={{
              fontFamily: "'Crimson Text', serif", fontSize: '0.7rem', fontStyle: 'italic',
              color: '#8a7d6a', margin: '6px 10px', lineHeight: 1.45,
            }}>
              {f.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px 8px' }}>
              <CharacterPortrait characterId={f.leaderId} isActive={false} size={36} showName={false} />
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.75rem', color: '#d4c8b0', margin: 0 }}>
                  {f.leaderName}
                </p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', margin: 0 }}>
                  {f.leaderRole}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LegislativeTab() {
  const seats = LEGISLATIVE_PARTIES.reduce((sum, p) => sum + p.seats, 0)
  const radius = 80; const cx = 150; const cy = 100
  const arcs = LEGISLATIVE_PARTIES.map((p, i) => {
    const totalBefore = LEGISLATIVE_PARTIES.slice(0, i).reduce((s, x) => s + x.seats, 0)
    const startAngle = Math.PI + (totalBefore / seats) * Math.PI
    const endAngle = startAngle + (p.seats / seats) * Math.PI
    return { ...p, startAngle, endAngle }
  })

  return (
    <div style={{ overflowY: 'auto', flex: 1, paddingTop: '10px' }}>
      <svg viewBox="0 0 300 120" style={{ width: '100%', height: 'auto' }}>
        {arcs.map((party, i) => {
          const dots: JSX.Element[] = []
          const dotCount = Math.max(1, Math.round(party.seats / 2))
          for (let j = 0; j < dotCount; j++) {
            const angle = party.startAngle + (j / dotCount) * (party.endAngle - party.startAngle)
            const rx = cx + radius * Math.cos(angle)
            const ry = cy + radius * Math.sin(angle)
            dots.push(<circle key={j} cx={rx} cy={ry} r="2.5" fill={party.color} />)
          }
          return <g key={i}>{dots}</g>
        })}
        <text x={cx} y={cy + 6} textAnchor="middle" fill="#d4c8b0" fontSize="11" fontFamily="'Playfair Display', serif" fontWeight={700}>
          {seats}
        </text>
      </svg>

      <div style={{ padding: '0 12px' }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '8px 0 4px' }}>
          Government
        </p>
        {LEGISLATIVE_PARTIES.filter(p => p.name === 'Civic Renewal').map(p => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: '#d4c8b0' }}>{p.name}</span>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)' }}>{p.seats}</span>
          </div>
        ))}
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '10px 0 4px' }}>
          Opposition
        </p>
        {LEGISLATIVE_PARTIES.filter(p => p.name !== 'Civic Renewal').map(p => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: '#d4c8b0' }}>{p.name}</span>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)' }}>{p.seats}</span>
          </div>
        ))}

        <div style={{ height: '1px', background: 'rgba(196,148,58,0.12)', margin: '10px 0' }} />
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Notable Members
        </p>

        {[
          { id: 'character_elena_braskov', name: 'Elena Braskov', role: 'Speaker of the Assembly' },
          { id: 'character_drazen_kolvar', name: 'Dražen Kolvar', role: 'Opposition Leader' },
          { id: 'character_soraya_khaled', name: 'Soraya Khaled', role: "Workers' Coalition Leader" },
        ].map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0',
            borderBottom: '1px solid rgba(196,148,58,0.05)',
          }}>
            <CharacterPortrait characterId={m.id} isActive={false} size={32} showName={false} />
            <div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.75rem', color: '#e8dcc8', display: 'block' }}>
                {m.name}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                {m.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JudiciaryTab() {
  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '10px 12px' }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#e8dcc8', textAlign: 'center', margin: '0 0 8px', fontWeight: 600 }}>
        The Supreme Court
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b2e2e' }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)' }}>Old Guard {JUDICIARY_COUNTS.oldGuard}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8902a' }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)' }}>Centrist {JUDICIARY_COUNTS.centrist}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3a5a7c' }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)' }}>Reformist {JUDICIARY_COUNTS.reformist}</span>
        </div>
      </div>
      <div style={{ height: '1px', background: 'rgba(196,148,58,0.12)', marginBottom: '10px' }} />
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Notable Members
      </p>
      {JUSTICES.map(j => (
        <div key={j.name} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
          borderBottom: '1px solid rgba(196,148,58,0.05)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--paper-raised)', border: `2px solid ${j.dotColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.7rem', color: j.dotColor, fontWeight: 700 }}>
              {j.name.charAt(0)}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.75rem', color: '#e8dcc8' }}>{j.name}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: j.dotColor, flexShrink: 0 }} />
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)', margin: '1px 0 0' }}>
              {j.role}, age {j.age} · {j.faction}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FavorsTab({ flags }: { flags: string[] }) {
  const favorsOwedToYou = [
    { id: 'favor_owed_by_morvec', name: 'Stefan Morvec', description: 'Morvec owes you a political favor. He can be called upon to influence industry or break a strike.' },
    { id: 'favor_owed_by_vael', name: 'Lucan Vael', description: 'Vael owes you a media favor. He can be called upon to suppress a story or spin a crisis.' },
  ]
  const favorsYouOwe = [
    { id: 'favor_owed_to_morvec', name: 'Stefan Morvec', description: 'You owe Morvec a favor. He will call it in when it suits him, and the price will be steep.' },
    { id: 'favor_owed_to_vael', name: 'Lucan Vael', description: 'You owe Vael a favor. He holds this debt over your head, ready to trade it for influence.' },
  ]

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
        Favors Owed To You
      </p>
      {favorsOwedToYou.filter(f => flags.includes(f.id)).length === 0 ? (
        <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.7rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.4)', margin: '0 0 16px' }}>No active favors.</p>
      ) : (
        favorsOwedToYou.filter(f => flags.includes(f.id)).map(f => (
          <div key={f.id} style={{ marginBottom: '12px', padding: '8px', background: 'rgba(127,166,90,0.05)', borderLeft: '3px solid #7fa65a' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.8rem', color: '#e8dcc8', margin: '0 0 4px' }}>{f.name}</p>
            <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.68rem', color: '#8a7d6a', margin: 0, lineHeight: 1.4 }}>{f.description}</p>
          </div>
        ))
      )}

      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '16px 0 8px' }}>
        Favors You Owe
      </p>
      {favorsYouOwe.filter(f => flags.includes(f.id)).length === 0 ? (
        <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.7rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.4)', margin: '0' }}>No active debts.</p>
      ) : (
        favorsYouOwe.filter(f => flags.includes(f.id)).map(f => (
          <div key={f.id} style={{ marginBottom: '12px', padding: '8px', background: 'rgba(224,92,74,0.05)', borderLeft: '3px solid #e05c4a' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.8rem', color: '#e8dcc8', margin: '0 0 4px' }}>{f.name}</p>
            <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.68rem', color: '#8a7d6a', margin: 0, lineHeight: 1.4 }}>{f.description}</p>
          </div>
        ))
      )}
    </div>
  )
}

function TrustTab() {
  const trust = useGameStore(s => s.advisorTrust)
  
  const advisors = [
    { id: 'vyktor', name: 'Vyktor Reznik', role: 'Chief of Staff' },
    { id: 'danika', name: 'Danika Oberlin', role: 'Minister of the Interior' },
    { id: 'theron', name: 'Prof. Aldric Theron', role: 'Minister of Justice' },
    { id: 'soraya', name: 'Soraya Metsk', role: 'Union Leader' },
    { id: 'dusek', name: 'Col. Irina Dusek', role: 'Minister of Defense' },
  ]

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        Inner Circle Trust
      </p>
      {advisors.map(a => {
        const score = trust[a.id as keyof typeof trust] ?? 50
        const color = score > 70 ? '#7fa65a' : score > 40 ? '#c9a84c' : '#e05c4a'
        return (
          <div key={a.id} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.8rem', color: '#e8dcc8' }}>{a.name}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: color }}>{score}%</span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem', color: 'var(--muted)', marginBottom: '6px' }}>{a.role}</div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                background: color,
                boxShadow: `0 0 6px ${color}80`,
                borderRadius: '2px',
                transition: 'width 0.5s ease, background 0.5s ease',
              }} />
            </div>
          </div>
        )
      })}
      <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.68rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.4)', marginTop: '16px', lineHeight: 1.4 }}>
        Trust determines how much information they share and whether they will follow your orders without question. Low trust may lead to betrayal.
      </p>
    </div>
  )
}

interface ConnectionsPanelProps {
  onClose: () => void
}

export default function ConnectionsPanel({ onClose }: ConnectionsPanelProps) {
  const [tab, setTab] = useState<TabId>('cabinet')
  const { activeFlags, visitedSceneIds } = useNarrativeStore()

  return (
    <div className="anim-slide-in-right" style={{
      position: 'fixed', right: '52px', top: '50px', width: '340px',
      height: 'calc(100vh - 110px)', zIndex: Z.panel,
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
          Connections
        </h2>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>

      <TabBar active={tab} onSelect={setTab} />

      {tab === 'cabinet' && <CabinetTab flags={activeFlags} visitedSceneIds={visitedSceneIds} />}
      {tab === 'factions' && <FactionsTab />}
      {tab === 'legislative' && <LegislativeTab />}
      {tab === 'judiciary' && <JudiciaryTab />}
      {tab === 'favors' && <FavorsTab flags={activeFlags} />}
      {tab === 'trust' && <TrustTab />}
    </div>
  )
}
