import { useState, useCallback, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import {
  PROVISIONS,
  calculateReferendumForecast,
  getReferendumOutlook,
  calculateAssemblyVotes,
  type ConstitutionalProvision,
} from '../data/constitution/provisions'
import type { FactionState } from '../types/gameState'
import { usePageInsets } from '../hooks/usePageInsets'

const mono: React.CSSProperties = { fontFamily: "'Special Elite', monospace" }
const serif: React.CSSProperties = { fontFamily: "'IM Fell English', Georgia, serif" }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
      ▸ {children}
    </p>
  )
}

function Rule() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0 1rem' }} />
}

const FACTION_DISPLAY: Record<keyof FactionState, { short: string; full: string; color: string }> = {
  halvekists:       { short: 'Halvekists',      full: 'Halvekist Old Guard',              color: '#8a6a3a' },
  workersCoalition: { short: "Workers' Coal.",  full: "Workers' Unity Coalition",         color: 'var(--accent-red)' },
  reformists:       { short: 'Reformists',      full: 'Civic Renewal Movement',           color: 'var(--accent-blue)' },
  ironCovenant:     { short: 'Iron Covenant',   full: 'Iron Covenant (Military)',         color: '#6b6b6b' },
  church:           { short: 'Church',          full: 'Church of the Eternal Flame',      color: '#c8902a' },
  businessClass:    { short: 'Business',        full: 'Business Consortium',              color: '#4a8a4a' },
  dravenni:         { short: 'Dravenni',        full: 'Dravenni Liberation Front',        color: '#5a7a8a' },
  partyLoyalists:   { short: 'Loyalists',       full: 'Party Loyalists',                  color: '#7f8c8d' },
}

function ProvisionCard({
  provision,
  selectedVariantId,
  onSelect,
}: {
  provision: ConstitutionalProvision
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--paper-raised)', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0.55rem 0.7rem', gap: '0.6rem', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase' }}>
              {provision.name}
            </span>
            <button style={{ ...mono, fontSize: '0.48rem', letterSpacing: '0.12em', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              {expanded ? '▲' : '▼'}
            </button>
          </div>
          <p style={{ ...serif, fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: '0.15rem', fontStyle: 'italic' }}>
            {provision.description}
          </p>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(200,144,42,0.1)', padding: '0.5rem 0.7rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ ...mono, fontSize: '0.48rem', letterSpacing: '0.1em', color: 'var(--accent-red)', textTransform: 'uppercase' }}>Under Halvek:</span>
            <span style={{ ...serif, fontSize: '0.64rem', color: 'var(--muted)', fontStyle: 'italic', marginLeft: '0.4rem' }}>{provision.halvekStatus}</span>
          </div>
          <div style={{ marginBottom: '0.6rem' }}>
            <span style={{ ...mono, fontSize: '0.48rem', letterSpacing: '0.1em', color: 'var(--amber-dim)', textTransform: 'uppercase' }}>Theron:</span>
            <span style={{ ...serif, fontSize: '0.64rem', color: 'var(--cream)', fontStyle: 'italic', marginLeft: '0.4rem' }}>"{provision.theronArgument}"</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {provision.variants.map(variant => {
              const isSelected = selectedVariantId === variant.id
              return (
                <label
                  key={variant.id}
                  onClick={() => onSelect(variant.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.35rem 0.5rem',
                    cursor: 'pointer', background: isSelected ? 'var(--amber-glow)' : 'transparent',
                    border: isSelected ? '1px solid rgba(200,144,42,0.35)' : '1px solid transparent',
                    borderRadius: '1px', transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '14px', height: '14px', minWidth: '14px', borderRadius: '50%',
                    border: isSelected ? '2px solid var(--amber)' : '2px solid var(--muted)',
                    background: isSelected ? 'var(--amber)' : 'transparent',
                    marginTop: '1px', transition: 'all 0.15s ease',
                  }}>
                    {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ink)', margin: '2px' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: '0.56rem', letterSpacing: '0.06em', color: isSelected ? 'var(--amber)' : 'var(--cream)', textTransform: 'uppercase' }}>
                      {variant.label}
                      {variant.referendumModifier !== 0 && (
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.45rem', color: variant.referendumModifier > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {variant.referendumModifier > 0 ? '+' : ''}{variant.referendumModifier}% ref.
                        </span>
                      )}
                    </div>
                    <p style={{ ...serif, fontSize: '0.6rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4, marginTop: '1px' }}>
                      {variant.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function VotePredictor({ support, oppose, threshold }: { support: number; oppose: number; threshold: number }) {
  const total = 250
  const supportPct = Math.round((support / total) * 100)
  const passes = support >= threshold

  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
        <span style={{ ...mono, fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--amber)', textTransform: 'uppercase' }}>
          Assembly Support
        </span>
        <span style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.08em', color: passes ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {support} / 250 · {passes ? 'PASSES' : 'FAILS'}
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(200,144,42,0.06)', position: 'relative', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${supportPct}%`, background: passes ? '#5a8a4a' : 'var(--accent-red)',
          transition: 'width 0.3s',
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '-2px', bottom: '-2px',
          width: '2px', background: 'rgba(255,255,255,0.3)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
        <span style={{ ...mono, fontSize: '0.4rem', color: 'var(--muted)' }}>{support} seats</span>
        <span style={{ ...mono, fontSize: '0.4rem', color: 'var(--muted)' }}>Threshold: {threshold}</span>
        <span style={{ ...mono, fontSize: '0.4rem', color: 'var(--muted)' }}>{oppose} oppose</span>
      </div>
    </div>
  )
}

function FactionReactionRow({ display, netValue }: {
  display: { short: string; full: string; color: string }; netValue: number
}) {
  const barColor = netValue > 5 ? 'var(--accent-green)' : netValue < -15 ? 'var(--accent-red)' : netValue < -5 ? '#a05030' : 'var(--muted)'
  const barWidth = Math.min(100, Math.abs(netValue) * 2.5)

  return (
    <div style={{ marginBottom: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ ...mono, fontSize: '0.48rem', letterSpacing: '0.08em', color: display.color }}>{display.short}</span>
        <span style={{ ...mono, fontSize: '0.44rem', color: barColor }}>{netValue > 0 ? '+' : ''}{netValue}</span>
      </div>
      <div style={{ height: '2px', background: 'rgba(200,144,42,0.06)' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function ReferendumBar({ pct, outlook }: { pct: number; outlook: ReturnType<typeof getReferendumOutlook> }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
        <span style={{ ...mono, fontSize: '0.52rem', letterSpacing: '0.1em', color: 'var(--amber)', textTransform: 'uppercase' }}>Referendum Forecast</span>
        <span style={{ ...mono, fontSize: '0.65rem', color: outlook.color, fontWeight: 'bold' }}>{outlook.pct}%</span>
      </div>
      <div style={{ height: '8px', background: 'rgba(200,144,42,0.08)', position: 'relative', marginBottom: '0.2rem' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: outlook.color, transition: 'width 0.3s' }} />
        <div style={{ position: 'absolute', left: '50%', top: '-1px', bottom: '-1px', width: '2px', background: 'rgba(255,255,255,0.4)' }} />
        <span style={{ position: 'absolute', left: '50%', top: '10px', transform: 'translateX(-50%)', ...mono, fontSize: '0.38rem', color: 'rgba(255,255,255,0.35)' }}>
          PASS 50%
        </span>
      </div>
      <p style={{ ...serif, fontSize: '0.62rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4, marginTop: '0.6rem' }}>
        {outlook.label} — {outlook.detail}
      </p>
    </div>
  )
}

export default function ConstitutionalReform() {
  // Keep clear of the fixed HUD; phones stack columns and drop the rail gap
  const insets = usePageInsets()
  const factions = useGameStore(s => s.factions)
  const publicImage = useGameStore(s => s.personal.publicImage)
  const currentWeek = useGameStore(s => s.currentWeek)
  const applyModifiers = useGameStore(s => s.applyModifiers)
  const { advanceQueue, sceneQueue, currentQueueIndex, returnToMap } = useWeekStore()

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => ({}))
  const [finalized, setFinalized] = useState(false)

  const selectVariant = useCallback((provisionId: string, variantId: string) => {
    if (finalized) return
    setSelectedVariants(prev => ({ ...prev, [provisionId]: variantId }))
  }, [finalized])

  const selectionCount = Object.keys(selectedVariants).length

  const assemblyVotes = useMemo(() => calculateAssemblyVotes(factions, selectedVariants), [factions, selectedVariants])
  const forecast = useMemo(() => calculateReferendumForecast(factions, publicImage, selectedVariants), [factions, publicImage, selectedVariants])
  const outlook = useMemo(() => getReferendumOutlook(forecast), [forecast])

  const netFactionValues = useMemo(() => {
    const map = new Map<keyof FactionState, number>()
    for (const provision of PROVISIONS) {
      const variantId = selectedVariants[provision.id]
      const variant = provision.variants.find(v => v.id === variantId)
      if (!variant) continue
      for (const r of variant.reactions) {
        map.set(r.faction, (map.get(r.faction) ?? 0) + r.value)
      }
    }
    return map
  }, [selectedVariants])

  function handleFinalize() {
    if (finalized) return
    const allModifiers: { stat: string; operation: 'add'; value: number }[] = []
    const allFlags: string[] = []

    for (const provision of PROVISIONS) {
      const variantId = selectedVariants[provision.id]
      const variant = provision.variants.find(v => v.id === variantId)
      if (variant) {
        allFlags.push(`constitution_${provision.id}_${variantId}`)
        for (const r of variant.reactions) {
          allModifiers.push({ stat: `factions.${r.faction}`, operation: 'add', value: r.value })
        }
      } else {
        allFlags.push(`constitution_excluded_${provision.id}`)
      }
    }
    allFlags.push('constitutional_package_submitted')

    if (allModifiers.length > 0) applyModifiers(allModifiers)
    const narrativeStore = useNarrativeStore.getState()
    useNarrativeStore.setState({
      activeFlags: [...new Set([...narrativeStore.activeFlags, ...allFlags])],
    })
    setFinalized(true)
  }

  const isLastScene = currentQueueIndex >= sceneQueue.length - 1
  const continueLabel = isLastScene ? (returnToMap ? 'Continue →' : 'Proceed to Evening Review →') : `Continue →`

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[1]" style={{ background: 'rgba(15,13,10,0.94)', paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom }}>
      <div className={`shrink-0 flex items-center justify-between ${insets.isPhone ? 'px-4' : 'px-6'} py-3 border-b`} style={{ borderColor: 'var(--border)' }}>
        <span className="stamp">The Mandate — Week {currentWeek} · Constitutional Convention</span>
        <span className="stamp">12 Provisions to Address</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Vote Predictor + Faction Reactions */}
        <div className="hidden lg:flex flex-col shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border)', width: '210px', padding: '1.2rem 0.9rem' }}>
          <SectionLabel>Assembly Vote</SectionLabel>
          {selectionCount > 0 ? (
            <VotePredictor support={assemblyVotes.supportVotes} oppose={assemblyVotes.opposeVotes} threshold={assemblyVotes.threshold} />
          ) : (
            <p style={{ ...serif, fontSize: '0.62rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.8rem' }}>
              Select provisions to see estimated Assembly support.
            </p>
          )}

          <Rule />
          <SectionLabel>Faction Reaction</SectionLabel>
          {selectionCount === 0 ? (
            <p style={{ ...serif, fontSize: '0.62rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              Faction reactions update as you choose variants.
            </p>
          ) : (
            (Object.keys(FACTION_DISPLAY) as (keyof FactionState)[]).map(key => (
              <FactionReactionRow key={key} display={FACTION_DISPLAY[key]} netValue={netFactionValues.get(key) ?? 0} />
            ))
          )}
        </div>

        {/* Center — Provisions with Radio Buttons */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto" style={{ padding: '1rem 1.5rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
            <div style={{ marginBottom: '0.8rem' }}>
              {finalized ? (
                <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--amber)', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  Package finalized. Review and continue.
                </p>
              ) : (
                <p style={{ ...mono, fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: '1rem' }}>
                  Select one variant per provision. Each choice shapes faction reactions, Assembly support, and the referendum forecast.
                </p>
              )}
            </div>

            {PROVISIONS.map(prov => (
              <ProvisionCard key={prov.id} provision={prov} selectedVariantId={selectedVariants[prov.id] ?? null} onSelect={(vid) => selectVariant(prov.id, vid)} />
            ))}
          </div>

          <div className={`shrink-0 flex flex-wrap items-center justify-between ${insets.isPhone ? 'px-4' : 'px-6'} py-3 border-t`} style={{ borderColor: 'var(--border)', gap: '1rem' }}>
            <div style={{ flex: 1, maxWidth: '360px' }}>
              <ReferendumBar pct={forecast} outlook={outlook} />
            </div>
            <div>
              {!finalized ? (
                <button className="choice-btn" onClick={handleFinalize} disabled={selectionCount === 0}
                  style={{ width: 'auto', minWidth: insets.isPhone ? 0 : '220px', opacity: selectionCount === 0 ? 0.35 : 1 }}>
                  {selectionCount === 0 ? 'Select Provisions First' : `Finalize Package (${selectionCount}/12)`}
                </button>
              ) : (
                <button className="choice-btn" onClick={advanceQueue} style={{ width: 'auto', minWidth: insets.isPhone ? 0 : '220px' }}>
                  {continueLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div className="hidden xl:flex flex-col shrink-0 border-l overflow-y-auto" style={{ borderColor: 'var(--border)', width: '190px', padding: '1.2rem 0.9rem' }}>
          <SectionLabel>Package</SectionLabel>
          {selectionCount === 0 ? (
            <p style={{ ...serif, fontSize: '0.62rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              No provisions selected. Click a provision and choose a variant.
            </p>
          ) : (
            <>
              <p style={{ ...mono, fontSize: '0.5rem', letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {selectionCount} of 12 addressed
              </p>
              {PROVISIONS.filter(p => selectedVariants[p.id]).map(p => {
                const v = p.variants.find(v => v.id === selectedVariants[p.id])
                return (
                  <div key={p.id} style={{ marginBottom: '0.4rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(200,144,42,0.06)' }}>
                    <div style={{ ...mono, fontSize: '0.48rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.name}</div>
                    <div style={{ ...serif, fontSize: '0.55rem', color: 'var(--muted)', fontStyle: 'italic' }}>{v?.label ?? '...'}</div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className={`shrink-0 flex items-center justify-between ${insets.isPhone ? 'px-4' : 'px-6'} py-2 border-t`} style={{ borderColor: 'var(--border)' }}>
        <span className="stamp">Constitutional Convention · Week {currentWeek}</span>
        <span className="stamp">Referendum: Week 26</span>
      </div>
    </div>
  )
}
