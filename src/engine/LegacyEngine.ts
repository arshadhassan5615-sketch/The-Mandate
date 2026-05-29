import type { GameState } from '../types/gameState'

export type LegacyDimension = 'democratic' | 'economic' | 'social_justice' | 'security' | 'moral' | 'personal'
export type LegacyGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface DimensionScore {
  dimension: LegacyDimension
  label: string
  grade: LegacyGrade
  score: number
  maxScore: number
  description: string
  historianComment: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
}

export interface LegacyVerdict {
  overallGrade: string
  title: string
  paragraph1: string
  paragraph2: string
  dimensions: DimensionScore[]
  achievements: Achievement[]
  comparison: Record<string, 'better' | 'worse' | 'similar'>
}

const GRADE_THRESHOLDS: { grade: LegacyGrade; min: number }[] = [
  { grade: 'A', min: 85 },
  { grade: 'B', min: 70 },
  { grade: 'C', min: 50 },
  { grade: 'D', min: 30 },
  { grade: 'F', min: 0 },
]

function getGrade(score: number, max: number): LegacyGrade {
  const pct = (score / max) * 100
  return GRADE_THRESHOLDS.find(g => pct >= g.min)?.grade ?? 'F'
}

export function calculateLegacy(state: GameState, flags: string[]): LegacyVerdict {
  const { nation, factions, personal, initialSnapshot } = state
  const initial = initialSnapshot ?? state

  const economyDelta = nation.economyHealth - initial.nation.economyHealth
  const unempDelta = initial.nation.unemployment - nation.unemployment
  const debtDelta = initial.nation.nationalDebt - nation.nationalDebt

  // ── 1. Democratic Legacy ──────────────────────────────────────────────
  let demScore = 0
  const demMax = 100
  demScore += nation.civilLiberties * 0.25
  demScore += nation.pressFreedom * 0.20
  demScore += flags.includes('constitutional_package_submitted') ? 15 : 0
  demScore += flags.includes('constitution_in_force') ? 15 : 0
  demScore += flags.includes('soren_immunity_revoked') ? 10 : 0
  demScore += state.emergencyDecreesIssued > 3 ? -15 : 0
  demScore += state.stateOfEmergencyExtensions > 1 ? -10 : 0
  demScore += flags.includes('impeachment_vote_failed') ? 5 : 0
  demScore += flags.includes('soe_expired') ? 10 : 0

  const demGrade = getGrade(demScore, demMax)
  const demComments: Record<LegacyGrade, string> = {
    A: 'Ashavel\'s constitutional reforms fundamentally reshaped Veltrian democracy. Her government resisted authoritarian temptation even under existential threat, establishing precedents that endured for decades.',
    B: 'Ashavel strengthened democratic institutions significantly, though pragmatism sometimes compromised principle. The constitutional reforms were her greatest achievement.',
    C: 'Ashavel maintained democratic institutions without substantially improving them. Her government was competent rather than transformative.',
    D: 'Ashavel\'s democratic credentials were undermined by security measures that outlasted their necessity. The emergency powers she invoked became a precedent for successors.',
    F: 'Ashavel entered office promising democratic reform and left it an authoritarian state. The emergency powers she invoked were never fully surrendered.',
  }

  // ── 2. Economic Legacy ───────────────────────────────────────────────
  let econScore = 0
  const econMax = 100
  econScore += Math.max(0, economyDelta * 1.5)
  econScore += Math.max(0, unempDelta * 2)
  econScore += Math.min(debtDelta * 0.3, 20)
  econScore += nation.economyHealth > 0 ? 15 : nation.economyHealth > -10 ? 5 : -5
  econScore += nation.unemployment < 15 ? 10 : nation.unemployment > 25 ? -10 : 0
  econScore += flags.includes('arcturian_aid_received') ? 8 : 0
  econScore += flags.includes('orythian_loan_accepted') ? 5 : 0
  econScore += flags.includes('economy_free_market') ? 3 : 0

  const econGrade = getGrade(econScore, econMax)
  const econComments: Record<LegacyGrade, string> = {
    A: 'Ashavel inherited a stagnant economy and left it growing. Her policies attracted foreign investment while maintaining social protections, a balance few transitional governments achieved.',
    B: 'The economy improved measurably under Ashavel, though structural problems remained. Unemployment fell, growth returned, and the Krone stabilized.',
    C: 'Ashavel\'s economic record was mixed — some sectors grew, others stagnated. The crisis was managed rather than solved.',
    D: 'The economy worsened under Ashavel\'s tenure, hampered by political instability and inconsistent policy. Living standards declined for most Veltrians.',
    F: 'Ashavel presided over economic collapse. The Krone became worthless, factories closed, and unemployment reached catastrophic levels.',
  }

  // ── 3. Social Justice ─────────────────────────────────────────────────
  let socScore = 0
  const socMax = 100
  socScore += Math.max(0, factions.workersCoalition - 30) * 0.3
  socScore += Math.max(0, factions.dravenni - 20) * 0.4
  socScore += flags.includes('dravenni_language_recognition') ? 15 : 0
  socScore += flags.includes('dravenni_bilingual') ? 15 : 0
  socScore += flags.includes('land_reform') || flags.includes('land_limited') ? 12 : 0
  socScore += flags.includes('worker_protections_guaranteed') ? 10 : 0
  socScore += flags.includes('strike_postponed') ? 5 : 0
  socScore += flags.includes('refugees_accepted') ? 8 : 0
  socScore += flags.includes('dravenni_heritage_preserved') ? 8 : 0
  socScore += flags.includes('uni_mass_grave_memorialized') ? 10 : 0

  const socGrade = getGrade(socScore, socMax)
  const socComments: Record<LegacyGrade, string> = {
    A: 'Ashavel\'s social policies transformed the lives of ordinary Veltrians. Worker protections, minority rights, and land reform created a more equitable society.',
    B: 'Significant progress on social justice — particularly for the Dravenni minority — though economic constraints limited the scope of reform.',
    C: 'Modest social improvements. The Dravenni gained some recognition, workers received some protections, but structural inequality persisted.',
    D: 'Social justice was sacrificed to political expediency. The Dravenni remained marginalized and workers saw few of the protections they were promised.',
    F: 'Ashavel\'s government abandoned its social justice commitments entirely. The vulnerable were left more vulnerable than before her term began.',
  }

  // ── 4. National Security ─────────────────────────────────────────────
  let secScore = 0
  const secMax = 100
  secScore += nation.militaryReadiness * 0.3
  secScore += nation.publicOrder * 0.2
  secScore += flags.includes('mole_correct') ? 15 : 0
  secScore += flags.includes('mole_wrongly_accused') ? -15 : 0
  secScore += flags.includes('mole_unresolved') ? -10 : 0
  secScore += flags.includes('assassination_survived') ? 5 : 0
  secScore += flags.includes('tyvaren_tensions_escalated') ? -10 : 0
  secScore += flags.includes('coup_attempt_defeated') || flags.includes('coup_confront_directly') ? 10 : 0
  secScore += state.moleDiscovered ? 10 : 0

  const secGrade = getGrade(secScore, secMax)
  const secComments: Record<LegacyGrade, string> = {
    A: 'Ashavel kept Veltria secure during its most vulnerable period. The Tyvaren threat was managed, internal stability maintained, and foreign intelligence operations disrupted.',
    B: 'Veltria remained secure under Ashavel, though the Tyvaren situation was contained rather than resolved. Internal threats were managed competently.',
    C: 'National security was adequate — neither a triumph nor a failure. The military remained functional and the borders intact.',
    D: 'Security deteriorated under Ashavel. The Tyvaren situation worsened, internal threats were not adequately addressed, and military readiness declined.',
    F: 'Ashavel\'s government failed to protect Veltria. The nation suffered military defeat, internal collapse, or both.',
  }

  // ── 5. Moral Integrity ───────────────────────────────────────────────
  let morScore = 0
  const morMax = 100
  morScore += Math.max(-50, personal.moralCompass) + 50
  morScore += flags.includes('kickback_accepted') ? -15 : 0
  morScore += nation.corruption < 40 ? 10 : nation.corruption > 80 ? -15 : 0
  morScore += flags.includes('corruption_vael') ? -10 : 0
  morScore += state.corruptionDiscoveredCount > 0 ? -5 * state.corruptionDiscoveredCount : 0
  morScore += flags.includes('nadia_exclusive_granted') ? 8 : 0
  morScore += flags.includes('accountability_abandoned') ? -10 : 0

  const morGrade = getGrade(morScore, morMax)
  const morComments: Record<LegacyGrade, string> = {
    A: 'Ashavel governed with remarkable integrity. Her administration was transparent, accountable, and substantially free of the corruption that characterized previous regimes.',
    B: 'Ashavel maintained a generally clean administration, though political necessity occasionally compromised moral principle.',
    C: 'Ashavel\'s moral record was mixed — some compromises, some principled stands, the usual ledger of a transitional leader navigating impossible choices.',
    D: 'The moral cost of Ashavel\'s governance was significant. Corruption, cover-ups, and compromised principles eroded public trust.',
    F: 'Ashavel\'s administration was corrupt at its core. The promises of the reform movement were betrayed by the very leader who made them.',
  }

  // ── 6. Personal Cost ─────────────────────────────────────────────────
  let perScore = 0
  const perMax = 100
  perScore += personal.marriageHealth * 0.3
  perScore += personal.lioraRelationship * 0.2
  perScore += personal.tomasWellbeing * 0.2
  perScore += state.seridaAlive ? 15 : 0
  perScore += state.seridaMorale > 50 ? 10 : 0
  perScore += flags.includes('letter_father_written') ? 10 : 0
  perScore += flags.includes('jonas_leaving_veltria') ? -10 : 0
  perScore += flags.includes('family_miss_graduation') ? -5 : 0
  perScore += personal.publicImage * 0.1

  const perGrade = getGrade(perScore, perMax)
  const perComments: Record<LegacyGrade, string> = {
    A: 'Remarkably, Ashavel maintained strong family bonds throughout her chancellorship. Her marriage survived the extraordinary pressures of office, and her children emerged whole.',
    B: 'Ashavel\'s family bore the cost of her public service, but the bonds held. Strained but intact — the story of many political families.',
    C: 'The personal cost of Ashavel\'s chancellorship was considerable. Her marriage suffered, her children grew distant, and the job extracted a heavy toll.',
    D: 'Ashavel\'s family was broken by her time in office. The marriage crumbled, the children were lost, and the person who emerged was not the person who entered.',
    F: 'Ashavel sacrificed everything — family, relationships, self — to the Chancellorship. The office consumed her and left nothing behind.',
  }

  const dimensions: DimensionScore[] = [
    { dimension: 'democratic', label: 'Democratic Legacy', grade: demGrade, score: demScore, maxScore: demMax, description: 'Did you strengthen or weaken Veltrian democracy?', historianComment: demComments[demGrade] },
    { dimension: 'economic', label: 'Economic Legacy', grade: econGrade, score: econScore, maxScore: econMax, description: 'Did the economy improve or worsen?', historianComment: econComments[econGrade] },
    { dimension: 'social_justice', label: 'Social Justice', grade: socGrade, score: socScore, maxScore: socMax, description: 'Did you improve life for ordinary Veltrians?', historianComment: socComments[socGrade] },
    { dimension: 'security', label: 'National Security', grade: secGrade, score: secScore, maxScore: secMax, description: 'Did you keep the nation safe?', historianComment: secComments[secGrade] },
    { dimension: 'moral', label: 'Moral Integrity', grade: morGrade, score: morScore, maxScore: morMax, description: 'Did you govern honestly?', historianComment: morComments[morGrade] },
    { dimension: 'personal', label: 'Personal Cost', grade: perGrade, score: perScore, maxScore: perMax, description: 'What did you sacrifice?', historianComment: perComments[perGrade] },
  ]

  // ── Overall Verdict ──────────────────────────────────────────────────
  const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 }
  const overallScore = dimensions.reduce((s, d) => s + (gradeValues[d.grade] ?? 0), 0) / dimensions.length
  const overallGrade = overallScore >= 3.5 ? 'A' : overallScore >= 2.5 ? 'B' : overallScore >= 1.5 ? 'C' : overallScore >= 0.75 ? 'D' : 'F'

  const titles: Record<string, string> = {
    A: 'The Architect of Modern Veltria',
    B: 'The Steady Reformer',
    C: 'The Adequate Chancellor',
    D: 'The Disappointment',
    F: 'The Failed Promise',
  }

  // ── Achievements ─────────────────────────────────────────────────────
  const achievements: Achievement[] = [
    { id: 'reformer', name: 'The Reformer', description: 'A-grade Democratic Legacy.', unlocked: demGrade === 'A' },
    { id: 'iron_chancellor', name: 'The Iron Chancellor', description: 'A-grade Security but F-grade Democratic Legacy.', unlocked: secGrade === 'A' && demGrade === 'F' },
    { id: 'peoples_champion', name: "The People's Champion", description: 'A-grade Social Justice.', unlocked: socGrade === 'A' },
    { id: 'survivor', name: 'The Survivor', description: 'Completed the game without any crisis ending.', unlocked: !flags.includes('coup_succeeded') && !flags.includes('ending_assassination') && !flags.includes('government_fallen') },
    { id: 'compromiser', name: 'The Compromiser', description: 'All legacy grades are C — the true centrist.', unlocked: dimensions.every(d => d.grade === 'C') },
    { id: 'letter_never_sent', name: 'The Letter Never Sent', description: 'Wrote the letter to Mikhael.', unlocked: flags.includes('letter_father_written') },
    { id: 'mole_hunter', name: 'The Mole Hunter', description: 'Correctly identified the Tyvaren spy.', unlocked: flags.includes('mole_correct') },
    { id: 'family_first', name: 'Family First', description: 'A-grade Personal Cost score.', unlocked: perGrade === 'A' },
    { id: 'total_recall', name: 'Total Recall', description: 'Found the truth about Mikhael\'s death.', unlocked: flags.includes('soren_linked_to_mikhael') && flags.includes('mikhael_avenged') },
    { id: 'puppet', name: 'The Puppet', description: 'Vael influence reached 80+.', unlocked: state.vaelInfluence >= 80 },
    { id: 'clean_hands', name: 'Clean Hands', description: 'Zero corruption flags throughout the game.', unlocked: state.corruptionDiscoveredCount === 0 && !flags.some(f => f.startsWith('kickback_accepted')) },
  ]

  // ── Comparison ───────────────────────────────────────────────────────
  const comparison: Record<string, 'better' | 'worse' | 'similar'> = {
    'Economy': nation.economyHealth > 0 ? 'better' : nation.economyHealth < -20 ? 'worse' : 'similar',
    'Democracy': nation.civilLiberties > 50 ? 'better' : nation.civilLiberties < 15 ? 'worse' : 'similar',
    'Security': nation.militaryReadiness > 60 ? 'better' : nation.militaryReadiness < 35 ? 'worse' : 'similar',
    'Family': personal.marriageHealth > 55 ? 'better' : personal.marriageHealth < 25 ? 'worse' : 'similar',
  }

  // ── Verdict Paragraphs ───────────────────────────────────────────────
  const p1Map: Record<string, string> = {
    A: `Chancellor Ashavel's term represents one of the most consequential periods in Veltrian history. Her government navigated the impossible transition from authoritarian rule to democratic governance with a steadiness that few contemporaries believed possible. The constitutional reforms she shepherded into existence became the foundation of Veltrian democracy for the next half-century, and her personal courage during the assassination attempt and the Tyvaren crisis earned respect even from her political opponents.`,
    B: `Chancellor Ashavel governed during a period of extraordinary challenge and emerged with her reputation substantially intact. She did not achieve everything she promised — no transitional leader ever does — but she achieved enough to change the trajectory of Veltrian history. The Republic she left was more democratic, more stable, and more just than the one she inherited.`,
    C: `Chancellor Ashavel's tenure was competent but unexceptional. She managed crises without resolving them, advanced reforms without completing them, and governed without either the transformative vision her supporters hoped for or the catastrophic failures her opponents predicted. History remembers her as a transitional figure — necessary, adequate, and ultimately forgettable.`,
    D: `Chancellor Ashavel entered office with enormous promise and left it having disappointed most of those who believed in her. The democratic reforms were compromised by security measures, the economic promises were broken by fiscal reality, and the moral authority she claimed was eroded by the practical compromises of governance.`,
    F: `Chancellor Ashavel's government represents one of the great tragedies of Veltrian history. What began as a movement of genuine democratic renewal ended in failure — whether through collapse, corruption, or the slow erosion of the very principles that brought her to power. Her name became a caution in Veltrian political science textbooks: the reformer who could not sustain reform.`,
  }

  const p2Map: Record<string, string> = {
    A: perGrade === 'A'
      ? `Perhaps most remarkably, Ashavel achieved this while preserving her family and her humanity. She governed as a whole person — Chancellor, wife, mother, daughter of a dissident — and refused to let any one role consume the others. The letter she wrote to her father, found among her papers after her death, revealed a leader who never stopped being a daughter seeking her father's approval. It is difficult to read it without weeping.`
      : perGrade === 'D' || perGrade === 'F'
      ? `However, the personal cost was staggering. Her marriage ended publicly, her relationship with her children never fully recovered, and the loneliness of her post-chancellorship years became a cautionary tale about the price of public service. History remembers a leader who saved her nation but lost herself.`
      : `The personal cost was considerable but not catastrophic. Her family strained but did not break. Her moral compass wavered but did not shatter. She emerged from the Chancellorship changed — harder in some ways, softer in others — but still recognizably the woman who had taken the oath four years earlier.`,
  }

  return {
    overallGrade,
    title: titles[overallGrade] ?? 'The Chancellor',
    paragraph1: p1Map[overallGrade] ?? p1Map.C,
    paragraph2: p2Map[overallGrade] ?? p2Map.C,
    dimensions,
    achievements,
    comparison,
  }
}
