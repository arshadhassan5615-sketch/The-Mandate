import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useChainStore } from '../stores/chainStore'
import { useSettingsStore } from '../stores/settingsStore'

interface StatRowProps {
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  danger?: number   // below this → red
  warning?: number  // below this → amber
}

function bar(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

function StatRow({ label, value, min = 0, max = 100, unit = '', danger, warning }: StatRowProps) {
  const pct = bar(value, min, max)
  const isDanger  = danger  !== undefined && value <= danger
  const isWarning = warning !== undefined && value <= warning && !isDanger
  const barColor = isDanger ? '#8b2e2e' : isWarning ? '#c4943a' : '#4a6b3a'

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: isDanger ? '#c87070' : isWarning ? '#c4943a' : '#b8a890', marginBottom: '2px' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace' }}>
          {value.toFixed(unit === '₭' ? 0 : 1)}{unit}
        </span>
      </div>
      <div style={{ height: '4px', background: '#2a2520', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#c4943a', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid #3a332d', paddingBottom: '3px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function DebugPanel() {
  const open = useSettingsStore(s => s.debugOpen)
  const setOpen = useSettingsStore(s => s.setDebugOpen)
  const { currentWeek, currentAct, nation, factions, personal } = useGameStore()
  const { currentScene, visitedSceneIds, activeFlags, sceneDone } = useNarrativeStore()
  const { scheduled } = useChainStore()

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '260px',
        height: '100vh',
        background: 'rgba(15, 13, 10, 0.97)',
        borderLeft: '1px solid #4a4035',
        zIndex: 10000,
        overflowY: 'auto',
        padding: '14px 16px',
        fontFamily: "'Special Elite', monospace",
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a4035 transparent',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#c4943a', textTransform: 'uppercase' }}>
          Debug — State Inspector
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#7a6f62', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: '9px', color: '#7a6f62', marginBottom: '14px' }}>
        Week {currentWeek} · Act {currentAct} &nbsp;·&nbsp; Ctrl+D to close
      </div>

      <Section title="Nation">
        <StatRow label="Economy Health"         value={nation.economyHealth}         min={-100} max={100}  danger={-50} warning={-20} />
        <StatRow label="Unemployment"           value={nation.unemployment}          min={0}    max={40}   unit="%" danger={30} warning={20} />
        <StatRow label="Inflation"              value={nation.inflation}             min={0}    max={30}   unit="%" danger={20} warning={12} />
        <StatRow label="National Debt"          value={nation.nationalDebt}          min={0}    max={800}  unit=" M₭" danger={600} warning={450} />
        <StatRow label="Corruption"             value={nation.corruption}            min={0}    max={100}  danger={75} warning={55} />
        <StatRow label="Military Readiness"     value={nation.militaryReadiness}     min={0}    max={100}  danger={25} warning={40} />
        <StatRow label="Public Order"           value={nation.publicOrder}           min={0}    max={100}  danger={25} warning={40} />
        <StatRow label="Press Freedom"          value={nation.pressFreedom}          min={0}    max={100}  danger={15} warning={30} />
        <StatRow label="Civil Liberties"        value={nation.civilLiberties}        min={0}    max={100}  danger={15} warning={30} />
        <StatRow label="Intl. Standing"         value={nation.internationalStanding} min={0}    max={100}  danger={20} warning={35} />
      </Section>

      <Section title="Factions">
        <StatRow label="Halvekists"          value={factions.halvekists}       danger={10} warning={20} />
        <StatRow label="Workers' Coalition"  value={factions.workersCoalition} danger={10} warning={20} />
        <StatRow label="Reformists (Base)"   value={factions.reformists}       danger={15} warning={30} />
        <StatRow label="Iron Covenant"       value={factions.ironCovenant}     danger={25} warning={40} />
        <StatRow label="Church"              value={factions.church}           danger={10} warning={20} />
        <StatRow label="Business Class"      value={factions.businessClass}    danger={10} warning={20} />
        <StatRow label="Dravenni"            value={factions.dravenni}         danger={5}  warning={15} />
      </Section>

      <Section title="Personal">
        <StatRow label="Marriage Health"       value={personal.marriageHealth}    danger={10} warning={30} />
        <StatRow label="Liora Relationship"    value={personal.lioraRelationship} danger={15} warning={30} />
        <StatRow label="Tomas Wellbeing"       value={personal.tomasWellbeing}    danger={20} warning={35} />
        <StatRow label="Personal Wealth"       value={personal.personalWealth}    min={0} max={50000} unit=" ₭" />
        <StatRow label="Public Image"          value={personal.publicImage}       danger={20} warning={35} />
        <StatRow label="Moral Compass"         value={personal.moralCompass}      min={-100} max={100} danger={-60} warning={-20} />
      </Section>

      <Section title="Narrative Engine">
        <div style={{ fontSize: '10px', color: '#b8a890', marginBottom: '6px' }}>
          <span style={{ color: '#7a6f62' }}>Scene: </span>
          {currentScene ? currentScene.id : sceneDone ? '(done)' : '(none)'}
        </div>
        <div style={{ fontSize: '10px', color: '#b8a890', marginBottom: '6px' }}>
          <span style={{ color: '#7a6f62' }}>Visited: </span>
          {visitedSceneIds.length === 0 ? '—' : visitedSceneIds.join(', ')}
        </div>
        <div style={{ fontSize: '10px', color: '#b8a890' }}>
          <span style={{ color: '#7a6f62' }}>Flags: </span>
          {activeFlags.length === 0 ? '—' : (
            <span style={{ color: '#c4943a' }}>{activeFlags.join(', ')}</span>
          )}
        </div>
      </Section>

      <Section title="Chain Queue">
        {scheduled.length === 0 ? (
          <div style={{ fontSize: '10px', color: '#4a4035' }}>No pending chains.</div>
        ) : (
          scheduled.map(c => (
            <div key={c.id} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #2a2520' }}>
              <div style={{ fontSize: '9px', color: '#8b2e2e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                fires week {c.fireWeek}
                {c.probability !== undefined && ` · ${Math.round(c.probability * 100)}% prob`}
              </div>
              <div style={{ fontSize: '10px', color: '#b8a890' }}>{c.targetNodeId}</div>
              <div style={{ fontSize: '9px', color: '#7a6f62' }}>← {c.sourceId}</div>
              {c.conditions?.length ? (
                <div style={{ fontSize: '9px', color: '#5a5045', marginTop: '2px' }}>
                  {c.conditions.map((cond, i) => (
                    <span key={i}>{cond.stat} {cond.operator} {String(cond.value)} </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </Section>

      <div style={{ fontSize: '9px', color: '#4a4035', textAlign: 'center', marginTop: '8px' }}>
        Red bar = danger threshold reached
      </div>
    </div>
  )
}
