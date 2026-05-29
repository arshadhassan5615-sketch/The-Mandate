import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { calculateEnding } from '../engine/endingCalculator'
import { GOVERNANCE_LABELS, PERSONAL_LABELS } from '../types/ending'
import benchmarkData from '../data/benchmarks.json'

interface Benchmark {
  id: string
  label: string
  description: string
  nation: Record<string, number>
  factions: Record<string, number>
  personal: Record<string, number>
}

const benchmarks: Benchmark[] = benchmarkData as Benchmark[]

function arrow(val: number, invert?: boolean): string {
  if (val > 0) return invert ? '↓' : '↑'
  if (val < 0) return invert ? '↑' : '↓'
  return '→'
}

function arrowColor(val: number, invert?: boolean): string {
  const effective = invert ? -val : val
  if (effective > 0) return 'var(--accent-green)'
  if (effective < 0) return 'var(--accent-red)'
  return 'var(--muted)'
}

function factionLabel(val: number): string {
  if (val >= 80) return 'Enthusiastic'
  if (val >= 60) return 'Supportive'
  if (val >= 40) return 'Neutral'
  if (val >= 20) return 'Opposed'
  return 'Hostile'
}

function factionColor(val: number): string {
  if (val >= 60) return 'var(--accent-green)'
  if (val >= 40) return 'var(--amber)'
  return 'var(--accent-red)'
}

const FACTION_NAMES: Record<string, string> = {
  halvekists: 'Halvek Loyalists',
  workersCoalition: 'Workers\' Coalition',
  reformists: 'Reformist Bloc',
  ironCovenant: 'Iron Covenant',
  church: 'Church of Veltria',
  businessClass: 'Business & Industry',
  dravenni: 'Dravenni Minority',
}

const SCENE_DECISIONS: Record<string, string> = {
  'act1_opening_cabinet': 'First Cabinet Meeting',
  'act1_budget_review': 'First Budget Review',
  'act1_constitutional_convention': 'Constitutional Convention',
  'act1_minority_festival_request': 'Dravenni Festival Request',
  'act1_religious_parish_priest': 'Father Veren\'s Letter',
  'act2_minority_refugee_health': 'Refugee Health Crisis',
  'act2_minority_language_school': 'Dravenni Language School',
  'act2_minority_mixed_marriage': 'Interethnic Marriage',
  'act2_religious_hospital_threat': 'Church Hospital Ultimatum',
  'act2_religious_holiday_speech': 'Feast of Saint Aldric',
  'act3_minority_refugee_integration': 'Refugee Integration Program',
  'act3_minority_veteran_recognition': 'Dravenni Veteran Citizenship',
  'act3_religious_church_halvek_files': 'Church Halvek Scandal',
}

export default function TermReportScreen() {
  const gameState = useGameStore()
  const { visitedSceneIds } = useNarrativeStore()
  const initial = gameState.initialSnapshot

  const ending = useMemo(() => calculateEnding(gameState, useNarrativeStore.getState().activeFlags), [gameState])

  const historianVerdict = useMemo(() => {
    const gov = ending.governanceOutcome
    const per = ending.personalOutcome
    if (gov === 'democratic_reformer' && per === 'principled_leader') {
      return 'Katerin Ashavel governed as a genuine democrat in a nation still learning what democracy means. She made mistakes — all first chancellors do — but she made them in good faith, with the institutions of the Republic stronger at her departure than at her arrival. History will remember her as the chancellor who proved that Veltria could be governed without fear.'
    }
    if (gov === 'democratic_reformer') {
      return 'A flawed but genuine democrat. Ashavel expanded civil liberties and strengthened democratic institutions, though the compromises required to govern cost her some of the moral clarity she brought to office. Her chancellorship demonstrated that post-authoritarian governance could be both free and functional.'
    }
    if (gov === 'authoritarian_consolidator') {
      return 'What began as a promise of reform ended in the familiar patterns of Veltrian strongman politics. Ashavel consolidated power, marginalized opposition, and governed through decree rather than consensus. She became what she once opposed — not through malice, but through the grinding logic of political survival.'
    }
    if (gov === 'well_intentioned_autocrat') {
      return 'A well-intentioned autocrat who traded principle for power one compromise at a time. Ashavel genuinely wanted to reform Veltria, but each concession to pragmatism narrowed the path until the only way forward was through authority rather than persuasion. She left the Republic more stable but less free.'
    }
    if (gov === 'survivor') {
      return 'A survivor who navigated impossible pressures with skill and sacrificed ideological purity for the simple goal of keeping the government functioning. Not a transformative figure, but a steady one — and in Veltrian politics, steadiness is its own kind of achievement.'
    }
    return 'Katerin Ashavel\'s chancellorship defies simple categorization. She governed in extraordinary times, faced challenges no previous chancellor had confronted, and left behind a record as complex and contradictory as the nation she led. History\'s judgment will depend on what Veltria becomes next.'
  }, [ending])

  const familyVerdict = useMemo(() => {
    const m = gameState.personal.marriageHealth
    const l = gameState.personal.lioraRelationship
    const t = gameState.personal.tomasWellbeing
    return {
      marriage: m >= 70 ? 'Your marriage to Jonas endured the pressures of office and emerged stronger — a partnership of equals that the public never fully saw but that sustained you through the hardest days.' :
                m >= 40 ? 'Your marriage to Jonas survived, though not without cost. The late nights, the crises, the distance that power creates — all of it extracted a toll. The love remained, but it bore the scars of your chancellorship.' :
                'Your marriage to Jonas did not survive the chancellorship. The pressures of office, the public scrutiny, the endless demands on your time — they eroded what had once been a partnership until too little remained to save.',
      liora: l >= 70 ? 'Liora found her own path, independent of your shadow — a young woman who inherited her mother\'s conviction but charted her own course. She is proud of you, even when she disagrees with you.' :
             l >= 40 ? 'Liora navigated the strange experience of coming of age as the Chancellor\'s daughter with resilience and growing independence. She understands the weight you carried, even if she wishes some of it had not fallen on her as well.' :
             'Liora grew up in the harshest spotlight Veltria can cast. The chancellorship took more from her than it gave, and your relationship bears the marks of absences that no political achievement can repay.',
      tomas: t >= 70 ? 'Tomas weathered the storm of public attention with a grace beyond his years. He grew into a thoughtful young man who understood, perhaps earlier than he should have, that his mother belonged to the nation as much as to her family.' :
             t >= 40 ? 'Tomas coped with the peculiar childhood of being the Chancellor\'s son. There were moments of resentment and moments of pride, and both were earned. He turned out well — not because of the chancellorship, but in spite of it.' :
             'Tomas paid the highest price for your service. The attention, the isolation, the constant weight of being defined by his mother\'s office rather than his own identity — it left marks that will take years to fully understand.',
    }
  }, [gameState.personal])

  const timeline = useMemo(() => {
    const entries: { week: number; title: string; summary: string }[] = []
    for (const id of visitedSceneIds) {
      const title = SCENE_DECISIONS[id]
      if (title) {
        entries.push({ week: 0, title, summary: 'Decision rendered — see full scene record.' })
      }
    }
    return entries
  }, [visitedSceneIds])

  const handleExport = () => {
    const lines: string[] = []
    lines.push('='.repeat(68))
    lines.push('REPUBLIC OF VELTRIA — CHANCELLORSHIP ASSESSMENT')
    lines.push('Katerin Ashavel — Fiscal Year 1963-64')
    lines.push('='.repeat(68))
    lines.push('')

    lines.push('GOVERNANCE ASSESSMENT')
    lines.push(`  Governance Score: ${ending.governanceScore}/100 (${GOVERNANCE_LABELS[ending.governanceOutcome]})`)
    lines.push(`  Personal Score:   ${ending.personalScore}/100 (${PERSONAL_LABELS[ending.personalOutcome]})`)
    lines.push('')

    lines.push('FINAL STATE INDICATORS')
    const nationStats: [string, number][] = [
      ['Economy Health', gameState.nation.economyHealth],
      ['Unemployment', gameState.nation.unemployment],
      ['Inflation', gameState.nation.inflation],
      ['National Debt (M VK)', gameState.nation.nationalDebt],
      ['Corruption', gameState.nation.corruption],
      ['Military Readiness', gameState.nation.militaryReadiness],
      ['Public Order', gameState.nation.publicOrder],
      ['Press Freedom', gameState.nation.pressFreedom],
      ['Civil Liberties', gameState.nation.civilLiberties],
      ['International Standing', gameState.nation.internationalStanding],
    ]
    for (const [label, value] of nationStats) {
      lines.push(`  ${label.padEnd(24)} ${String(value).padStart(6)}`)
    }
    lines.push('')

    lines.push('FACTION STANDINGS')
    for (const [key, name] of Object.entries(FACTION_NAMES)) {
      const val = (gameState.factions as Record<string, number>)[key] ?? 0
      lines.push(`  ${name.padEnd(28)} ${String(val).padStart(3)}/100 — ${factionLabel(val)}`)
    }
    lines.push('')

    lines.push('FAMILY')
    lines.push(`  Marriage Health:      ${gameState.personal.marriageHealth}/100`)
    lines.push(`  Liora Relationship:   ${gameState.personal.lioraRelationship}/100`)
    lines.push(`  Tomas Wellbeing:      ${gameState.personal.tomasWellbeing}/100`)
    lines.push('')

    lines.push('HISTORIAN\'S VERDICT')
    lines.push(`  ${historianVerdict}`)
    lines.push('')

    lines.push('='.repeat(68))
    lines.push('END OF REPORT — DECLASSIFIED AFTER 30 YEARS')
    lines.push('='.repeat(68))

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'veltria_term_report_1964.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePlayAgain = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--paper)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
      <div className="max-w-3xl mx-auto px-6 py-10" style={{ paddingBottom: '4rem' }}>
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>
            ▸ Republic of Veltria · Chancellorship Assessment · Declassified After 30 Years
          </p>
          <h1 style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '2rem', color: 'var(--amber)', textAlign: 'center', fontWeight: 400, marginBottom: '0.5rem' }}>
            Term Performance Report
          </h1>
          <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--cream)', textAlign: 'center', marginBottom: '2rem', opacity: 0.8 }}>
            Katerin Ashavel, First Woman Chancellor of the Republic of Veltria · Fiscal Year 1963-64
          </p>
        </motion.div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2rem' }} />

        {/* SECTION 1: STAT COMPARISONS */}
        <Section title="State Indicators — Start vs End">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.15rem 2rem' }}>
            {([
              ['Economy Health', 'nation.economyHealth', false],
              ['Unemployment', 'nation.unemployment', true],
              ['Inflation', 'nation.inflation', true],
              ['National Debt', 'nation.nationalDebt', true],
              ['Corruption', 'nation.corruption', true],
              ['Military Readiness', 'nation.militaryReadiness', false],
              ['Public Order', 'nation.publicOrder', false],
              ['Press Freedom', 'nation.pressFreedom', false],
              ['Civil Liberties', 'nation.civilLiberties', false],
              ['International Standing', 'nation.internationalStanding', false],
            ] as [string, string, boolean][]).map(([label, path, invert]) => {
              const parts = path.split('.')
              const initialVal = initial ? (initial as Record<string, unknown>)[parts[0]] as Record<string, number> : null
              const currentVal = (gameState as Record<string, unknown>)[parts[0]] as Record<string, number>
              const start = initialVal ? initialVal[parts[1]] : null
              const end = currentVal[parts[1]]
              const diff = start !== null ? end - start : null
              return (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid rgba(200,144,42,0.06)' }}>
                  <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>{label}</span>
                  <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', letterSpacing: '0.06em', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {start !== null && <span style={{ color: 'var(--muted)' }}>{start}</span>}
                    {start !== null && <span style={{ color: 'var(--muted)' }}>→</span>}
                    <span style={{ color: 'var(--cream)' }}>{end}</span>
                    {diff !== null && diff !== 0 && (
                      <span style={{ color: arrowColor(diff, invert), fontSize: '0.7rem' }}>
                        {arrow(diff, invert)} {Math.abs(diff)}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* SECTION 2: FACTION STANDINGS */}
        <Section title="Faction Final Standings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {Object.entries(FACTION_NAMES).map(([key, name]) => {
              const val = (gameState.factions as Record<string, number>)[key] ?? 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                    <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.58rem', color: 'var(--cream)', letterSpacing: '0.06em' }}>{name}</span>
                    <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: factionColor(val), letterSpacing: '0.06em' }}>{val}/100 — {factionLabel(val)}</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--border)', borderRadius: '1px' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: factionColor(val), borderRadius: '1px', transition: 'width 1.2s ease-out' }} />
                  </div>
                </div>
              )
            })}
            <div key="dravenni-extra" style={{ marginTop: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>Refugee Count</span>
                <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--cream)', letterSpacing: '0.06em' }}>{gameState.refugeeCount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>Religious Adherence</span>
                <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--cream)', letterSpacing: '0.06em' }}>{gameState.religiousAdherence}%</span>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 3: KEY DECISIONS TIMELINE */}
        <Section title="Key Decisions Timeline">
          {timeline.length === 0 ? (
            <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              No major decisions were recorded during this chancellorship. The historical record is thin — perhaps the most consequential choice was the choice not to act.
            </p>
          ) : (
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
              {timeline.map((entry, i) => (
                <div key={i} style={{ marginBottom: '1rem', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-1.65rem',
                    top: '0.15rem',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--amber)',
                  }} />
                  <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    {entry.title}
                  </p>
                  <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.8rem', color: 'var(--cream)', opacity: 0.7, lineHeight: 1.5 }}>
                    {entry.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SECTION 4: FAMILY REPORT */}
        <Section title="Family Report">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Jonas Ashavel — Marriage Health: {gameState.personal.marriageHealth}/100
              </p>
              <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--cream)', lineHeight: 1.6, opacity: 0.85 }}>
                {familyVerdict.marriage}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Liora Ashavel — Relationship: {gameState.personal.lioraRelationship}/100
              </p>
              <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--cream)', lineHeight: 1.6, opacity: 0.85 }}>
                {familyVerdict.liora}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Tomas Ashavel — Wellbeing: {gameState.personal.tomasWellbeing}/100
              </p>
              <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--cream)', lineHeight: 1.6, opacity: 0.85 }}>
                {familyVerdict.tomas}
              </p>
            </div>
          </div>
        </Section>

        {/* SECTION 5: HISTORIAN'S VERDICT */}
        <Section title="Historian's Verdict">
          <div style={{ borderLeft: '3px solid var(--amber-dim)', paddingLeft: '1rem' }}>
            <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.95rem', color: 'var(--cream)', lineHeight: 1.8, fontStyle: 'italic' }}>
              {historianVerdict}
            </p>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--amber-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.8rem' }}>
              — Excerpt from "The Ashavel Years: A Reassessment" · University of Ashenmere Press, 1994
            </p>
          </div>
        </Section>

        {/* SECTION 6: GOVERNANCE SCORES */}
        <Section title="Governance & Personal Assessment">
          <div style={{ background: 'var(--paper-raised)', border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Governance Index</p>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '1px', marginBottom: '0.3rem' }}>
                  <div style={{ height: '100%', width: `${ending.governanceScore}%`, background: 'var(--amber)', borderRadius: '1px' }} />
                </div>
                <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--amber)' }}>{GOVERNANCE_LABELS[ending.governanceOutcome]}</p>
              </div>
              <div>
                <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Personal Resilience</p>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '1px', marginBottom: '0.3rem' }}>
                  <div style={{ height: '100%', width: `${ending.personalScore}%`, background: 'var(--accent-green)', borderRadius: '1px' }} />
                </div>
                <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.85rem', color: 'var(--accent-green)' }}>{PERSONAL_LABELS[ending.personalOutcome]}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 7: COMPARISON BENCHMARKS */}
        <Section title="Comparison Benchmarks">
          <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            How does your Veltria compare to historical averages?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {benchmarks.map(bm => {
              const ecoDiff = gameState.nation.economyHealth - bm.nation.economyHealth
              const corrDiff = bm.nation.corruption - gameState.nation.corruption // positive = less corrupt
              return (
                <div key={bm.id} style={{ background: 'var(--paper-raised)', border: '1px solid var(--border)', padding: '1rem' }}>
                  <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    {bm.label}
                  </p>
                  <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.6rem', fontStyle: 'italic' }}>
                    {bm.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.1rem 1.5rem' }}>
                    <CompareRow label="Economy" yours={gameState.nation.economyHealth} theirs={bm.nation.economyHealth} />
                    <CompareRow label="Corruption" yours={gameState.nation.corruption} theirs={bm.nation.corruption} invert />
                    <CompareRow label="Mil. Readiness" yours={gameState.nation.militaryReadiness} theirs={bm.nation.militaryReadiness} />
                    <CompareRow label="Press Freedom" yours={gameState.nation.pressFreedom} theirs={bm.nation.pressFreedom} />
                    <CompareRow label="Civil Liberties" yours={gameState.nation.civilLiberties} theirs={bm.nation.civilLiberties} />
                    <CompareRow label="Intl. Standing" yours={gameState.nation.internationalStanding} theirs={bm.nation.internationalStanding} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <div style={{ height: '1px', background: 'var(--border)', margin: '2.5rem 0' }} />

        {/* SECTION 8: EXPORT + PLAY AGAIN */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontStyle: 'italic', color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            The mandate is complete. The Republic endures — or falls, or transforms. The choices were yours. The consequences were theirs.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="choice-btn" onClick={handleExport} style={{ width: 'auto', minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem 2rem' }}>
              ▸ Export Report
            </button>
            <button className="choice-btn" onClick={handlePlayAgain} style={{ width: 'auto', minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem 2rem' }}>
              Play Again?
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ marginBottom: '2rem' }}
    >
      <p style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--amber-dim)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
        ▸ {title}
      </p>
      {children}
    </motion.div>
  )
}

function CompareRow({ label, yours, theirs, invert }: { label: string; yours: number; theirs: number; invert?: boolean }) {
  const diff = invert ? theirs - yours : yours - theirs
  const better = invert ? diff > 0 : diff > 0
  const worse = invert ? diff < 0 : diff < 0
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0', borderBottom: '1px solid rgba(200,144,42,0.04)' }}>
      <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.52rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', letterSpacing: '0.05em', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ color: 'var(--cream)' }}>{yours}</span>
        <span style={{ color: 'var(--muted)' }}>vs</span>
        <span style={{ color: 'var(--muted)' }}>{theirs}</span>
        {diff !== 0 && (
          <span style={{ color: better ? 'var(--accent-green)' : worse ? 'var(--accent-red)' : 'var(--muted)', fontSize: '0.65rem' }}>
            {better ? '↑' : '↓'}
          </span>
        )}
      </span>
    </div>
  )
}
