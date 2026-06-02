import type { CliffhangerContext } from '../data/cliffhangers/cliffhangerTemplates'
import { CLIFFHANGER_TEMPLATES } from '../data/cliffhangers/cliffhangerTemplates'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

export function generateCliffhanger(week: number): string {
  const state = useGameStore.getState()
  const { activeFlags } = useNarrativeStore.getState()

  const ctx: CliffhangerContext = {
    week,
    flags: activeFlags,
    economyHealth: state.nation.economyHealth,
    corruption: state.nation.corruption,
    publicOrder: state.nation.publicOrder,
    militaryReadiness: state.nation.militaryReadiness,
    pressFreedom: state.nation.pressFreedom,
    marriageHealth: state.personal.marriageHealth,
    tomasWellbeing: state.personal.tomasWellbeing,
    halvekists: state.factions.halvekists,
    workersCoalition: state.factions.workersCoalition,
    reformists: state.factions.reformists,
    ironCovenant: state.factions.ironCovenant,
    businessClass: state.factions.businessClass,
    church: state.factions.church,
    dravenni: state.factions.dravenni,
    vaelInfluence: state.vaelInfluence,
    morvecInfluence: state.morvecInfluence,
    stateOfEmergency: state.stateOfEmergency,
    seridaAlive: state.seridaAlive,
  }

  const template = CLIFFHANGER_TEMPLATES[week]
  return template ? template(ctx) : `Week ${week} ends. The lights go out in the Chancellery. You are still at your desk.`
}

export type { CliffhangerContext } from '../data/cliffhangers/cliffhangerTemplates'
