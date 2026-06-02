import { useState, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { calculateProjection, applySpending } from '../engine/VoteEngine'
import { SPEND_OPTIONS } from '../types/vote'
import type { SpendLevel } from '../types/vote'
import VoteTracker from './VoteTracker'
import { getCharacterPortrait, getCharacterColor } from './portraits/CharacterPortraits'

const mono: React.CSSProperties = {
  fontFamily: "'Special Elite', monospace",
}

function VyktorPortrait() {
  const VyktorSvg = getCharacterPortrait('vyktor_reznik')
  const color = getCharacterColor('vyktor_reznik')
  return (
    <div style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `2px solid ${color}`,
      flexShrink: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
    }}>
      {VyktorSvg ? <VyktorSvg /> : (
        <svg viewBox="0 0 100 100" width="56" height="56">
          <circle cx="50" cy="40" r="24" fill="rgba(255,255,255,0.15)" />
          <ellipse cx="50" cy="80" rx="34" ry="22" fill="rgba(255,255,255,0.1)" />
        </svg>
      )}
    </div>
  )
}

export default function LobbyingInterface() {
  const factions = useGameStore(s => s.factions)
  const personalWealth = useGameStore(s => s.personal.personalWealth)
  const voteConfig = useWeekStore(s => s.voteConfig)
  const { addFlags } = useNarrativeStore.getState()
  const set = useWeekStore.setState

  const threshold = voteConfig?.threshold ?? 126

  const [selectedSpend, setSelectedSpend] = useState<SpendLevel>(0)
  const [committed, setCommitted] = useState(false)

  const baseProjection = useMemo(
    () => calculateProjection(factions, threshold),
    [factions, threshold],
  )

  const spendResult = useMemo(
    () => applySpending(baseProjection, selectedSpend),
    [baseProjection, selectedSpend],
  )

  const finalProjection = spendResult.finalProjection

  const voteLabel = voteConfig?.voteType === 'no_confidence'
    ? 'MOTION OF NO CONFIDENCE'
    : voteConfig?.voteType === 'referendum'
    ? 'CONSTITUTIONAL REFERENDUM'
    : voteConfig?.voteType === 'impeachment'
    ? 'ARTICLES OF IMPEACHMENT'
    : 'ASSEMBLY DIVISION'

  function handleCommit() {
    if (committed) return
    setCommitted(true)

    const state = useGameStore.getState()
    const flags: string[] = []

    // Deduct wealth
    if (selectedSpend > 0) {
      state.applyModifiers([
        { stat: 'personal.personalWealth', operation: 'add', value: -selectedSpend },
        { stat: 'voteSpendingTotal', operation: 'add', value: selectedSpend },
      ])
    }

    // Set corruption flags
    if (spendResult.corruptionFlags.length > 0) {
      flags.push(...spendResult.corruptionFlags)
      addFlags(spendResult.corruptionFlags)
    }

    // Apply outcome flags from voteConfig
    if (voteConfig) {
      if (finalProjection.willPass) {
        flags.push(...voteConfig.successFlags)
        addFlags(voteConfig.successFlags)
      } else {
        flags.push(...voteConfig.failureFlags)
        addFlags(voteConfig.failureFlags)
      }
    }

    // Store assembly vote margin
    state.applyModifiers([
      { stat: 'nation.assemblyVoteMargin', operation: 'set', value: Math.abs(finalProjection.margin) },
    ])

    // Store result and advance to vote_result phase
    set({
      phase: 'vote_result',
      voteResult: {
        projection: baseProjection,
        spendLevel: selectedSpend,
        finalYesSeats: finalProjection.yesSeats,
        finalNoSeats: finalProjection.noSeats,
        finalUndecidedSeats: finalProjection.undecidedSeats,
        passed: finalProjection.willPass,
        margin: finalProjection.margin,
        corruptionFlagSet: spendResult.corruptionFlags.length > 0,
        personalWealthSpent: selectedSpend,
      },
    })
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ ...mono, fontSize: '0.6rem', letterSpacing: '0.28em', color: 'var(--amber-dim)', textTransform: 'uppercase' }}>
            ▸ ASSEMBLY WHIP COUNT
          </span>
          <span style={{ ...mono, fontSize: '0.5rem', letterSpacing: '0.15em', color: 'var(--muted)', marginTop: 4 }}>
            {voteLabel} — {voteConfig?.totalSeats ?? 250} SEATS — {threshold} NEEDED
          </span>
        </div>

        <div style={columnsStyle}>
          {/* LEFT — Vyktor's assessment + VoteTracker */}
          <div style={leftColStyle}>
            {/* Vyktor portrait + quote */}
            <div style={advisorRowStyle}>
              <VyktorPortrait />
              <div style={{ marginLeft: 14 }}>
                <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--text)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  VYKTOR REZNIK
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "I've been counting noses, Chancellor. Here's where we stand."
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }} />

            {/* VoteTracker */}
            <div style={{ marginBottom: '1.5rem' }}>
              <VoteTracker
                projection={finalProjection}
                showThreshold
                tension={Math.abs(finalProjection.yesSeats - threshold) <= 5 ? 0.8 : 0}
              />
            </div>

            {/* Summary */}
            <div style={summaryBoxStyle}>
              <p style={{ ...mono, fontSize: '0.58rem', color: 'var(--amber-dim)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                ▸ PROJECTION SUMMARY
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--accent-green)' }}>
                  YES: {finalProjection.yesSeats} {finalProjection.yesSeats !== baseProjection.yesSeats && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--amber-dim)' }}>
                      (+{finalProjection.yesSeats - baseProjection.yesSeats})
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>UNDECIDED: {finalProjection.undecidedSeats}</span>
                <span style={{ color: 'var(--accent-red)' }}>NO: {finalProjection.noSeats}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.68rem', textAlign: 'center' }}>
                {finalProjection.willPass ? (
                  <span style={{ color: 'var(--accent-green)', ...mono }}>
                    PROJECTED TO PASS BY {finalProjection.margin} SEATS
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-red)', ...mono }}>
                    PROJECTED TO FAIL BY {Math.abs(finalProjection.margin)} SEATS — {threshold - finalProjection.yesSeats} MORE NEEDED
                  </span>
                )}
              </div>
              {selectedSpend > 0 && (
                <div style={{ marginTop: 4, fontSize: '0.58rem', textAlign: 'center', color: 'var(--amber-dim)' }}>
                  After {selectedSpend.toLocaleString()} ₭ lobbying • {spendResult.corruptionFlags.length > 0 ? '⚠ CORRUPTION RISK' : 'Clean operation'}
                </div>
              )}
            </div>
          </div>

          {/* CENTER — Spend options */}
          <div style={centerColStyle}>
            <span style={{ ...mono, fontSize: '0.58rem', color: 'var(--amber-dim)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'block' }}>
              ▸ LOBBYING RESOURCES
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SPEND_OPTIONS.map((opt) => {
                const canAfford = personalWealth >= opt.level
                const isSelected = selectedSpend === opt.level
                const result = opt.level > 0 ? applySpending(baseProjection, opt.level) : null
                const swingRange = opt.level > 0 && result
                  ? `${result.finalProjection.yesSeats - baseProjection.yesSeats} seats`
                  : '0 seats'

                return (
                  <button
                    key={opt.level}
                    onClick={() => { if (canAfford && !committed) setSelectedSpend(opt.level) }}
                    disabled={!canAfford || committed}
                    style={{
                      ...spendCardStyle,
                      borderColor: isSelected ? 'var(--amber-dim)' : 'var(--border)',
                      backgroundColor: isSelected ? 'rgba(200,144,42,0.08)' : 'rgba(255,255,255,0.02)',
                      opacity: canAfford ? 1 : 0.35,
                      cursor: canAfford && !committed ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ ...mono, fontSize: '0.72rem', color: isSelected ? 'var(--amber-dim)' : 'var(--text)', letterSpacing: '0.05em' }}>
                        {opt.level === 0 ? 'NO SPENDING' : `${opt.level.toLocaleString()} ₭`}
                      </span>
                      <span style={{
                        ...mono,
                        fontSize: '0.55rem',
                        color: opt.riskLevel === 'high' ? 'var(--accent-red)' : opt.riskLevel === 'medium' ? 'var(--amber-dim)' : 'var(--accent-green)',
                        textTransform: 'uppercase',
                      }}>
                        {opt.riskLevel === 'none' ? 'CLEAN' : `${opt.riskLevel.toUpperCase()} RISK`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted)', margin: '4px 0', lineHeight: 1.4 }}>
                      {opt.label}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--accent-green)', ...mono }}>
                        SWING: +{swingRange}
                      </span>
                      {!canAfford && (
                        <span style={{ fontSize: '0.55rem', color: 'var(--accent-red)', ...mono }}>
                          INSUFFICIENT FUNDS
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Commit button */}
            <button
              onClick={handleCommit}
              disabled={committed}
              style={{
                ...commitBtnStyle,
                opacity: committed ? 0.5 : 1,
                cursor: committed ? 'default' : 'pointer',
              }}
            >
              {committed ? 'LOBBYING COMMITTED...' : selectedSpend === 0
                ? 'PROCEED WITHOUT SPENDING'
                : `COMMIT ${selectedSpend.toLocaleString()} ₭ TO LOBBYING`
              }
            </button>
          </div>

          {/* RIGHT — Faction breakdown */}
          <div style={rightColStyle}>
            <span style={{ ...mono, fontSize: '0.58rem', color: 'var(--amber-dim)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'block' }}>
              ▸ FACTION BREAKDOWN
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {baseProjection.breakdown.map((fb) => {
                const yesPct = (fb.yesVotes / fb.seats) * 100
                return (
                  <div key={fb.faction} style={factionRowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text)', ...mono }}>
                        {fb.displayName}
                      </span>
                      <span style={{ fontSize: '0.58rem', color: 'var(--muted)', ...mono }}>
                        {fb.seats} seats
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{
                        width: `${yesPct}%`,
                        height: '100%',
                        backgroundColor: yesPct >= 80 ? 'var(--accent-green)' : yesPct >= 50 ? 'var(--amber-dim)' : 'var(--accent-red)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                      <span style={{ fontSize: '0.52rem', color: 'var(--accent-green)', ...mono }}>
                        {fb.yesVotes} YES
                      </span>
                      {fb.undecided > 0 && (
                        <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', ...mono }}>
                          {fb.undecided} UND
                        </span>
                      )}
                      <span style={{ fontSize: '0.52rem', color: 'var(--accent-red)', ...mono }}>
                        {fb.noVotes} NO
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Personal wealth */}
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ ...mono, fontSize: '0.55rem', color: 'var(--amber-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                ▸ PERSONAL WEALTH
              </span>
              <p style={{ ...mono, fontSize: '0.75rem', color: 'var(--text)', marginTop: 4 }}>
                {personalWealth.toLocaleString()} ₭ available
              </p>
              {selectedSpend > 0 && (
                <p style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>
                  After spending: {(personalWealth - selectedSpend).toLocaleString()} ₭
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'rgba(12,10,8,0.94)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  paddingTop: '48px',
  paddingRight: '60px',
  paddingBottom: '80px',
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: 'rgba(20,16,12,0.95)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '2rem',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--border)',
}

const columnsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 280px 240px',
  gap: '1.5rem',
}

const leftColStyle: React.CSSProperties = {}

const centerColStyle: React.CSSProperties = {}

const rightColStyle: React.CSSProperties = {}

const advisorRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
}

const summaryBoxStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: 4,
}

const spendCardStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '0.75rem',
  border: '1px solid var(--border)',
  borderRadius: 4,
  backgroundColor: 'rgba(255,255,255,0.02)',
  transition: 'all 0.2s ease',
}

const commitBtnStyle: React.CSSProperties = {
  ...mono,
  width: '100%',
  marginTop: 16,
  padding: '0.75rem',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text)',
  backgroundColor: 'rgba(200,144,42,0.15)',
  border: '1px solid var(--amber-dim)',
  borderRadius: 4,
}

const factionRowStyle: React.CSSProperties = {}


