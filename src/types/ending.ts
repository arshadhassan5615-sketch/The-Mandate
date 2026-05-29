// Ending system type definitions

export type GovernanceOutcome =
  | 'democratic_triumph'
  | 'benevolent_autocrat'
  | 'war_survivor'
  | 'economic_survivor'
  | 'revolutionary'
  | 'collapse'

export type PersonalOutcome =
  | 'family_strong'
  | 'family_strained'
  | 'family_broken'

export interface CharacterVignette {
  characterId: string
  characterName: string
  text: string
}

export interface EpilogueVariant {
  id: string
  governanceOutcome: GovernanceOutcome
  personalOutcome: PersonalOutcome
  title: string
  subtitle: string
  nationSummary: string
  vignettes: CharacterVignette[]
  declassifiedNote: string
}

export interface EndingResult {
  governanceScore: number        // 0-100
  personalScore: number          // 0-100
  governanceOutcome: GovernanceOutcome
  personalOutcome: PersonalOutcome
  variantId: string
}

export const GOVERNANCE_LABELS: Record<GovernanceOutcome, string> = {
  democratic_triumph: 'Democratic Consolidation',
  benevolent_autocrat: 'Stable Authoritarianism',
  war_survivor: 'War & Its Aftermath',
  economic_survivor: 'Austerity & Survival',
  revolutionary: 'Socialist Transformation',
  collapse: 'State Failure',
}

export const PERSONAL_LABELS: Record<PersonalOutcome, string> = {
  family_strong: 'Family Endures',
  family_strained: 'Family Fractured',
  family_broken: 'Family Lost',
}
