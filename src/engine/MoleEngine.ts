import type { MoleIdentity, Clue } from '../types/gameState'

export const MOLE_CHARACTERS: Record<Exclude<MoleIdentity, null>, {
  name: string
  title: string
  description: string
  factionKey: string
}> = {
  petrin_half: {
    name: 'Counselor Petrin Half',
    title: 'Foreign Ministry Intelligence Liaison',
    description: 'A quiet career diplomat who briefs the Chancellor on Tyvaren intelligence assessments. Always prepared, never memorable — which, you now realize, was the point.',
    factionKey: 'halvekists',
  },
  irina_dusek: {
    name: 'Colonel Irina Dusek',
    title: 'Minister of Defense',
    description: 'Your Defense Minister. Not a willing traitor — she was compromised. Tyvaren holds evidence of a wartime incident from 1941 that would destroy her career and send her to prison. She fed them just enough to keep them quiet. Just enough to betray you.',
    factionKey: 'ironCovenant',
  },
  karsten_volek: {
    name: 'Karsten Volek',
    title: 'Cabinet Secretary — Classified Documents',
    description: 'A mid-level functionary with access to everything. He handles the classified document registry. He was ideologically turned years ago — genuinely believes Veltrian independence was a historical mistake and that Tyvaren governance would be better. A true believer, not a mercenary.',
    factionKey: 'reformists',
  },
}

export const ALL_CLUES: Clue[] = [
  {
    id: 'mole_clue_1',
    description: 'Week 16: During a Church lobbying briefing, Vyktor mentioned the Tyvaren state newspaper published classified military readiness details — information only six offices had access to.',
    suspectPointer: null,
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_2',
    description: 'Week 20: A signal-intelligence intercept caught a Tyvaren handler using codename "Skylark." The SSD believes it rules out one suspect based on communication patterns.',
    suspectPointer: null,
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_3',
    description: 'Week 24: During a meeting with Brenner, you noticed a Tyvaren embassy cable on his desk. The ambassador referenced a negotiating position that had not yet been presented.',
    suspectPointer: null,
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_4',
    description: 'Week 28: Serida Valk saw a light in the Foreign Ministry annex at 11 PM. Someone was working after hours in an office that should have been empty.',
    suspectPointer: 'petrin_half',
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_5',
    description: 'Week 31: During the Tyvaren ultimatum briefing, Irina Dusek took a private phone call and returned visibly shaken. Unusual behavior for the Defense Minister.',
    suspectPointer: 'irina_dusek',
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_6',
    description: 'Week 34: The BCA investigation discovered a Tyvaren-made encrypted transmitter hidden in the palace. Its range covers three offices.',
    suspectPointer: null,
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_7',
    description: 'Week 38: A Tyvaren defector provided debriefing notes describing the mole as "a mid-ranking official with routine access to military and diplomatic documents."',
    suspectPointer: null,
    weekDiscovered: 0,
  },
  {
    id: 'mole_clue_8',
    description: 'Week 42: Orythian financial records show unexplained deposits matching the mole\'s identity. The evidence is conclusive.',
    suspectPointer: null,
    weekDiscovered: 0,
  },
]

export interface MoleConsequences {
  statChanges: { stat: string; operation: 'add' | 'set'; value: number }[]
  flags: string[]
  narrative: string
  factionImpact: { faction: string; value: number }
}

export function getMoleConsequences(identity: Exclude<MoleIdentity, null>, correct: boolean): MoleConsequences {
  if (correct) {
    switch (identity) {
      case 'petrin_half':
        return {
          statChanges: [
            { stat: 'nation.militaryReadiness', operation: 'add', value: 15 },
            { stat: 'nation.internationalStanding', operation: 'add', value: 5 },
            { stat: 'personal.publicImage', operation: 'add', value: 10 },
            { stat: 'factions.halvekists', operation: 'add', value: -5 },
          ],
          flags: ['mole_discovered', 'mole_petrin', 'mole_correct'],
          narrative: 'Petrin Half confessed within the hour. A quiet, unremarkable man who had been feeding Tyvaren intelligence for five years. The treason is devastating — but the damage is contained. He was a mid-level functionary, not a minister. The Foreign Ministry will need a thorough vetting. But the leak is stopped.',
          factionImpact: { faction: 'halvekists', value: -5 },
        }
      case 'irina_dusek':
        return {
          statChanges: [
            { stat: 'nation.militaryReadiness', operation: 'add', value: -15 },
            { stat: 'factions.ironCovenant', operation: 'add', value: -20 },
            { stat: 'personal.publicImage', operation: 'add', value: 5 },
            { stat: 'personal.moralCompass', operation: 'add', value: -8 },
            { stat: 'nation.corruption', operation: 'add', value: 10 },
          ],
          flags: ['mole_discovered', 'mole_dusek', 'mole_correct'],
          narrative: 'The Defense Minister. Your Defense Minister. The woman who swore an oath to the constitution, who you trusted with every military secret, who sat in your cabinet and advised you on how to defend against Tyvaren — was feeding them information the entire time. She was blackmailed, not bought. That makes it worse. She betrayed her country to protect her reputation. The military is shattered. Morale has collapsed. The Iron Covenant is in disarray. You have won a victory, but the cost feels more like a defeat.',
          factionImpact: { faction: 'ironCovenant', value: -20 },
        }
      case 'karsten_volek':
        return {
          statChanges: [
            { stat: 'nation.militaryReadiness', operation: 'add', value: 8 },
            { stat: 'nation.corruption', operation: 'add', value: 5 },
            { stat: 'personal.publicImage', operation: 'add', value: 8 },
            { stat: 'factions.reformists', operation: 'add', value: -3 },
            { stat: 'nation.internationalStanding', operation: 'add', value: 3 },
          ],
          flags: ['mole_discovered', 'mole_volek', 'mole_correct'],
          narrative: 'Karsten Volek. A functionary. A document clerk. A man with access to everything you signed, every memo you read, every classified assessment that crossed your desk. He was ideologically committed — a true believer in Tyvaren supremacy who thought he was helping. The intelligence damage is total. Every document from the past year must be considered compromised. But unlike Dusek, he was not someone you trusted personally. The betrayal is systemic, not intimate. The system failed. You are fixing it.',
          factionImpact: { faction: 'reformists', value: -3 },
        }
    }
  }

  // Wrong accusation
  return {
    statChanges: [
      { stat: 'nation.militaryReadiness', operation: 'add', value: -10 },
      { stat: 'personal.publicImage', operation: 'add', value: -12 },
      { stat: 'nation.internationalStanding', operation: 'add', value: -8 },
      { stat: 'factions.reformists', operation: 'add', value: -8 },
      { stat: 'nation.publicOrder', operation: 'add', value: -5 },
    ],
    flags: ['mole_wrongly_accused'],
    narrative: 'You accused the wrong person. An innocent official was arrested, questioned, destroyed — while the real mole remained in place, now aware that you are hunting for them. Tyvaren gained critical intelligence during the investigation and now knows your counterintelligence capabilities. The wrongly accused person\'s career is over. Their faction is hostile. The real mole continues feeding information. You have made the worst possible mistake.',
    factionImpact: { faction: 'reformists', value: -10 },
  }
}

export function getClueCountForSuspect(clues: Clue[], suspect: Exclude<MoleIdentity, null>): number {
  return clues.filter(c => c.suspectPointer === suspect).length
}

export function getTotalDiscoverableClues(): number {
  return ALL_CLUES.length
}
