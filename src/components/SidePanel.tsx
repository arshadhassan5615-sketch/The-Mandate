import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'

function getDravenniLabel(value: number): { text: string; color: string } {
  if (value >= 80) return { text: 'LOYAL', color: '#7fb069' }
  if (value >= 60) return { text: 'HOPEFUL', color: '#7fb069' }
  if (value >= 40) return { text: 'NEUTRAL', color: '#e8d5a3' }
  if (value >= 20) return { text: 'RESTLESS', color: '#e07050' }
  return { text: 'HOSTILE', color: '#e07050' }
}

function getRefugeeLabel(count: number): { text: string; color: string } {
  if (count >= 15000) return { text: 'OVERWHELMED', color: '#e07050' }
  if (count >= 8000) return { text: 'STRAINED', color: '#e07050' }
  if (count >= 4000) return { text: 'MANAGEABLE', color: '#e8d5a3' }
  return { text: 'LOW', color: '#7fb069' }
}

function getAdherenceLabel(value: number): { text: string; color: string } {
  if (value >= 80) return { text: 'DEVOUT', color: '#e8d5a3' }
  if (value >= 60) return { text: 'TRADITIONAL', color: '#e8d5a3' }
  if (value >= 40) return { text: 'SECULARIZING', color: '#e8d5a3' }
  return { text: 'SECULAR', color: '#e07050' }
}

function SideStat({
  icon,
  label,
  value,
  subtitle,
  barLevel,
  valueColor,
  changed,
}: {
  icon: string
  label: string
  value: string
  subtitle: string
  barLevel: number
  valueColor: string
  changed: boolean
}) {
  return (
    <div className={changed ? 'stat-changed' : ''} style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: '8px', lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontFamily: "'Georgia', serif",
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(200,185,155,0.6)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontFamily: "'Georgia', serif",
        fontSize: '13px',
        fontWeight: 700,
        color: valueColor,
        letterSpacing: '1px',
        display: 'block',
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: "'Georgia', serif",
        fontSize: '9px',
        color: 'rgba(200,185,155,0.4)',
        letterSpacing: '1px',
        fontStyle: 'italic',
        marginTop: '2px',
        display: 'block',
      }}>
        {subtitle}
      </span>
      <div style={{
        height: '3px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px',
        marginTop: '6px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, barLevel))}%`,
          borderRadius: '2px',
          background: 'linear-gradient(to right, rgba(201,168,76,0.4), #c9a84c)',
          boxShadow: '2px 0 6px rgba(201,168,76,0.4)',
          transition: 'width 1.2s ease-out',
        }} />
      </div>
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
        right: '52px',
        top: '40px',
        zIndex: 15,
        background: 'rgba(8,7,5,0.96)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderTop: '2px solid #c9a84c',
        borderRadius: '0 0 4px 4px',
        padding: 0,
        width: '220px',
        boxShadow: '-4px 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'rgba(201,168,76,0.08)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        padding: '8px 14px',
        fontFamily: "'Georgia', serif",
        fontSize: '9px',
        fontWeight: 700,
        color: '#c9a84c',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: '7px', lineHeight: 1 }}>
          ◆
        </span>
        National Indicators
      </div>

      {/* Rows */}
      <SideStat
        icon="◈"
        label="Dravenni Mood"
        value={dravenniLabel.text}
        subtitle="8% of population"
        barLevel={factions.dravenni}
        valueColor={dravenniLabel.color}
        changed={dravenniChanged}
      />

      <SideStat
        icon="►"
        label="Morivask Refugees"
        value={`${refugeeCount.toLocaleString()}`}
        subtitle={refugeeLabel.text}
        barLevel={refugeeCount / 200}
        valueColor={refugeeLabel.color}
        changed={refugeesChanged}
      />

      <SideStat
        icon="✦"
        label="Religious Adherence"
        value={`${religiousAdherence}%`}
        subtitle={adherenceLabel.text}
        barLevel={religiousAdherence}
        valueColor={adherenceLabel.color}
        changed={adherenceChanged}
      />
    </div>
  )
}
