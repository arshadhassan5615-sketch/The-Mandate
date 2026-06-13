import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'

const defs = projectDefinitions as DevelopmentProject[]

interface Props {
  projectId: string
  onResolved: () => void
}

export default function ProjectMidpointModal({ projectId, onResolved }: Props) {
  const [resolved, setResolved] = useState(false)
  const project = useGameStore(s => s.activeProjects.find(p => p.projectId === projectId))
  const def = defs.find(d => d.id === projectId)
  if (!def || !project || project.midpointResolved) return null

  const handleChoice = (choiceId: string) => {
    useGameStore.getState().resolveMidpoint(projectId, choiceId)
    setResolved(true)
    setTimeout(onResolved, 1200)
  }

  return (
    <AnimatePresence>
      {!resolved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'var(--paper)',
              border: '2px solid var(--amber)',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
            }}
          >
            {/* Header */}
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              color: 'var(--accent-red)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '0.8rem',
              textAlign: 'center',
            }}>
              ▸ Project Midpoint Review — Decision Required
            </div>

            <h2 style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontSize: '1.4rem',
              color: 'var(--amber)',
              textAlign: 'center',
              marginBottom: '1rem',
              fontWeight: 400,
            }}>
              {def.title}
            </h2>

            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              color: 'var(--muted)',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}>
              Week {project.currentWeek} of {def.durationWeeks} · {project.totalCost}M ₭
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />

            <p style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontSize: '0.95rem',
              color: 'var(--cream)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}>
              The project has reached a critical decision point. The choice made here will affect the project's cost, timeline, and political consequences.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {def.midpointChoices.map(choice => (
                <button
                  key={choice.id}
                  className="choice-btn"
                  onClick={() => handleChoice(choice.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    padding: '0.9rem 1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', color: 'var(--amber-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {choice.id.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontFamily: "'IM Fell English', Georgia, serif" }}>{choice.text}</span>
                  {choice.costChange !== undefined && (
                    <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: choice.costChange > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {choice.costChange > 0 ? '+' : ''}{choice.costChange}M ₭
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
