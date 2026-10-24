import { useGameStore } from '../stores/gameStore'
import { Z } from '../constants/zIndex'

// Placeholder Spy Master panel — scaffold for the espionage management UI.
// Reads the Spy Master stats initialized in gameStore INITIAL_STATE.
export default function SpyMasterPanel({ onClose }: { onClose: () => void }) {
  const activeAgents = useGameStore(s => s.activeAgents)
  const maxAgents = useGameStore(s => s.maxAgents)
  const activeOperations = useGameStore(s => s.activeOperations)

  return (
    <div className="anim-fade-in" style={{
      position: 'fixed',
      inset: 0,
      zIndex: Z.overlay,
      background: 'rgba(10,8,6,0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div
        className="anim-pop-in"
        style={{
          background: '#0a0806',
          border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: '2px',
          padding: '2rem 2.5rem',
          minWidth: '360px',
          maxWidth: '520px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '1rem',
          letterSpacing: '0.15em',
          color: '#c9a84c',
          marginBottom: '1.25rem',
          textShadow: '0 0 10px rgba(201,168,76,0.3)',
        }}>
          SPY MASTER
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: "'Crimson Text', serif", color: 'rgba(200,190,170,0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span>Active Agents</span>
            <span style={{ color: '#c9a84c' }}>{activeAgents} / {maxAgents}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span>Active Operations</span>
            <span style={{ color: '#c9a84c' }}>{activeOperations}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#c9a84c',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
