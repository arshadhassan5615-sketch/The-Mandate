import { useGameStore } from '../stores/gameStore'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'

const defs = projectDefinitions as DevelopmentProject[]

export default function ProjectsPanel() {
  const activeProjects = useGameStore(s => s.activeProjects)
  const completedProjects = useGameStore(s => s.completedProjects)
  const active = activeProjects.filter(p => p.phase === 'active')
  const failed = activeProjects.filter(p => p.phase === 'cancelled' || p.phase === 'failed')

  if (active.length === 0 && completedProjects.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '56px',
        right: '8px',
        zIndex: 140,
        background: 'rgba(15,13,10,0.92)',
        border: '1px solid var(--border)',
        padding: '0.6rem 0.7rem',
        borderRadius: '2px',
        width: '220px',
      }}
    >
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--amber-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
        ▸ Active Projects {active.length}/3
      </div>

      {active.length === 0 && (
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--muted)', textAlign: 'center', padding: '0.3rem 0' }}>
          No active projects
        </div>
      )}

      {active.map(p => {
        const def = defs.find(d => d.id === p.projectId)
        if (!def) return null
        const progress = Math.min(100, Math.round((p.currentWeek / def.durationWeeks) * 100))
        const isMidpoint = !p.midpointResolved && p.currentWeek >= def.midpointWeek

        return (
          <div key={p.projectId} style={{ marginBottom: '0.5rem', padding: '0.35rem', background: 'rgba(200,144,42,0.04)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--cream)', letterSpacing: '0.04em', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {def.title}
              </span>
              {isMidpoint && (
                <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: 'var(--accent-red)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ! DECISION
                </span>
              )}
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '1px', marginBottom: '0.15rem' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: isMidpoint ? 'var(--accent-red)' : 'var(--amber)', transition: 'width 0.8s ease-out', borderRadius: '1px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                Wk {p.currentWeek}/{def.durationWeeks}
              </span>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                {p.totalCost}M ₭
              </span>
            </div>
          </div>
        )
      })}

      {completedProjects.length > 0 && (
        <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: 'var(--amber-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Completed
          </div>
          {completedProjects.map(id => {
            const def = defs.find(d => d.id === id)
            if (!def) return null
            return (
              <div key={id} style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--accent-green)', marginBottom: '0.1rem' }}>
                ✓ {def.title}
              </div>
            )
          })}
        </div>
      )}

      {failed.length > 0 && (
        <div style={{ marginTop: '0.3rem' }}>
          {failed.map(p => {
            const def = defs.find(d => d.id === p.projectId)
            if (!def) return null
            return (
              <div key={p.projectId} style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: 'var(--accent-red)', marginBottom: '0.1rem' }}>
                ✗ {def.title} — FAILED
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
