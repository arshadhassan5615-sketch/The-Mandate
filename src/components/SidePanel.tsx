import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'

function getDravenniLabel(value: number): { text: string; color: string } {
  if (value >= 80) return { text: 'LOYAL', color: 'var(--accent-green)' }
  if (value >= 60) return { text: 'HOPEFUL', color: '#7a9e3f' }
  if (value >= 40) return { text: 'NEUTRAL', color: 'var(--amber-dim)' }
  if (value >= 20) return { text: 'RESTLESS', color: '#c4783b' }
  return { text: 'HOSTILE', color: 'var(--accent-red)' }
}

function getRefugeeLabel(count: number): { text: string; color: string } {
  if (count >= 15000) return { text: 'OVERWHELMED', color: 'var(--accent-red)' }
  if (count >= 8000) return { text: 'STRAINED', color: '#c4783b' }
  if (count >= 4000) return { text: 'MANAGEABLE', color: 'var(--amber-dim)' }
  return { text: 'LOW', color: 'var(--accent-green)' }
}

function getAdherenceLabel(value: number): { text: string; color: string } {
  if (value >= 80) return { text: 'DEVOUT', color: 'var(--amber)' }
  if (value >= 60) return { text: 'TRADITIONAL', color: '#b89a3d' }
  if (value >= 40) return { text: 'SECULARIZING', color: 'var(--amber-dim)' }
  return { text: 'SECULAR', color: 'var(--muted)' }
}

function SideStat({
  label,
  value,
  subtitle,
  barLevel,
  barColor,
  changed,
}: {
  label: string
  value: string
  subtitle: string
  barLevel: number
  barColor: string
  changed: boolean
}) {
  return (
    <div className={changed ? 'stat-changed' : ''} style={{ marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: barColor, letterSpacing: '0.06em', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', marginBottom: '0.1rem' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, barLevel))}%`, background: barColor, transition: 'width 1.2s ease-out', borderRadius: '1px' }} />
      </div>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>{subtitle}</div>
    </div>
  )
}

export default function SidePanel() {
  const factions = useGameStore(s => s.factions)
  const refugeeCount = useGameStore(s => s.refugeeCount)
  const religiousAdherence = useGameStore(s => s.religiousAdherence)

  const dravenniLabel = getDravenniLabel(factions.dravenni)
  const refugeeLabel = getRefugeeLabel(refugeeCount)
  const adherenceLabel = getAdherenceLabel(religiousAdherence)

  // Change detection
  const prevDravenni = useRef(factions.dravenni)
  const prevRefugees = useRef(refugeeCount)
  const prevAdherence = useRef(religiousAdherence)
  const [dravenniChanged, setDravenniChanged] = useState(false)
  const [refugeesChanged, setRefugeesChanged] = useState(false)
  const [adherenceChanged, setAdherenceChanged] = useState(false)

  useEffect(() => {
    if (prevDravenni.current !== factions.dravenni) {
      setDravenniChanged(true)
      prevDravenni.current = factions.dravenni
      const t = setTimeout(() => setDravenniChanged(false), 600)
      return () => clearTimeout(t)
    }
  }, [factions.dravenni])

  useEffect(() => {
    if (prevRefugees.current !== refugeeCount) {
      setRefugeesChanged(true)
      prevRefugees.current = refugeeCount
      const t = setTimeout(() => setRefugeesChanged(false), 600)
      return () => clearTimeout(t)
    }
  }, [refugeeCount])

  useEffect(() => {
    if (prevAdherence.current !== religiousAdherence) {
      setAdherenceChanged(true)
      prevAdherence.current = religiousAdherence
      const t = setTimeout(() => setAdherenceChanged(false), 600)
      return () => clearTimeout(t)
    }
  }, [religiousAdherence])

  return (
    <div
      style={{
        position: 'fixed',
        top: '52px',
        right: '52px',
        zIndex: 140,
        background: 'rgba(15,13,10,0.92)',
        border: '1px solid var(--border)',
        padding: '0.6rem 0.7rem',
        borderRadius: '2px',
        width: '200px',
      }}
    >
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--amber-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
        ▸ National Indicators
      </div>

      <SideStat
        label="Dravenni Mood"
        value={dravenniLabel.text}
        subtitle="8% of population"
        barLevel={factions.dravenni}
        barColor={dravenniLabel.color}
        changed={dravenniChanged}
      />

      <SideStat
        label="Morivask Refugees"
        value={`${refugeeCount.toLocaleString()}`}
        subtitle={refugeeLabel.text}
        barLevel={refugeeCount / 200}
        barColor={refugeeLabel.color}
        changed={refugeesChanged}
      />

      <SideStat
        label="Religious Adherence"
        value={`${religiousAdherence}%`}
        subtitle={adherenceLabel.text}
        barLevel={religiousAdherence}
        barColor={adherenceLabel.color}
        changed={adherenceChanged}
      />
    </div>
  )
}
