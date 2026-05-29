import type { FactionState } from '../../types/gameState'

export interface FactionOpinion {
  key: string
  faction: string
  approval: number
  sentiment: string
  issueLabel: string
}

function opinionLabel(approval: number): string {
  if (approval >= 80) return 'Enthusiastically supportive'
  if (approval >= 65) return 'Supportive'
  if (approval >= 50) return 'Cautiously optimistic'
  if (approval >= 35) return 'Neutral — waiting to see results'
  if (approval >= 20) return 'Growing concerned'
  if (approval >= 10) return 'Openly critical'
  return 'Hostile — actively opposing'
}

function issueLabel(key: string, approval: number): string {
  if (approval < 30) {
    const issues: Record<string, string> = {
      halvekists: 'Angry over loss of institutional power',
      workersCoalition: 'Angry over austerity and unemployment',
      reformists: 'Disappointed by slow pace of reforms',
      ironCovenant: 'Concerned about military funding cuts',
      church: 'Alarmed by secular reform proposals',
      businessClass: 'Worried about economic uncertainty',
      dravenni: 'Frustrated by lack of language protections',
    }
    return issues[key] ?? 'Growing discontent'
  }
  if (approval > 65) {
    const positives: Record<string, string> = {
      halvekists: 'Pleased with restrained reform pace',
      workersCoalition: 'Encouraged by labor protections',
      reformists: 'Energized by reform progress',
      ironCovenant: 'Confident in national defense posture',
      church: 'Satisfied with church-state relationship',
      businessClass: 'Optimistic about economic direction',
      dravenni: 'Hopeful about cultural recognition',
    }
    return positives[key] ?? 'Generally supportive'
  }
  return 'Watching developments closely'
}

const FACTION_DISPLAY: { key: keyof FactionState; faction: string }[] = [
  { key: 'halvekists', faction: 'Halvekist Bloc' },
  { key: 'workersCoalition', faction: "Workers' Coalition" },
  { key: 'reformists', faction: 'Reformist Bloc' },
  { key: 'ironCovenant', faction: 'Iron Covenant' },
  { key: 'church', faction: 'Church of Veltria' },
  { key: 'businessClass', faction: 'Business Class' },
  { key: 'dravenni', faction: 'Dravenni Community' },
]

export function getFactionOpinions(factions: FactionState): FactionOpinion[] {
  return FACTION_DISPLAY.map(({ key, faction }) => {
    const approval = factions[key]
    return {
      key,
      faction,
      approval,
      sentiment: opinionLabel(approval),
      issueLabel: issueLabel(key, approval),
    }
  })
}
