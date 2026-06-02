import type { Bill, VetoOverrideResult } from '../types/bills'
import type { StateModifier } from '../types/gameState'
import { evaluateAll } from './conditionEvaluator'
import { useGameStore } from '../stores/gameStore'

let billCache: Bill[] | null = null

export async function loadAllBills(): Promise<Bill[]> {
  if (billCache) return billCache

  const billModules = import.meta.glob('../data/bills/*.json', { eager: true }) as Record<string, { default: Bill }>
  billCache = Object.values(billModules).map(m => m.default)
  billCache.sort((a, b) => a.weekPresented - b.weekPresented)
  return billCache
}

export function getBillsSync(): Bill[] {
  return billCache ?? []
}

export function getPendingBillsForWeek(week: number): Bill[] {
  const all = billCache ?? []
  return all.filter(b => b.weekPresented === week)
}

export function getBillById(id: string): Bill | undefined {
  const all = billCache ?? []
  return all.find(b => b.id === id)
}

export function evaluateBillPrerequisites(
  bill: Bill,
  gameState: ReturnType<typeof useGameStore.getState>,
  activeFlags: string[],
): boolean {
  if (!bill.prerequisites || bill.prerequisites.length === 0) return true
  return evaluateAll(bill.prerequisites, gameState, activeFlags)
}

export function calculateVetoOverrideChance(
  bill: Bill,
  gameState: ReturnType<typeof useGameStore.getState>,
): VetoOverrideResult {
  const factions = gameState.factions
  let supportForOverride = 0

  // Factions that benefit from vetoing oppose override; factions hurt by vetoing support override
  for (const effect of bill.vetoEffects) {
    const parts = effect.stat.split('.')
    if (parts[0] === 'factions' && parts[1]) {
      const factionKey = parts[1] as keyof typeof factions
      if (effect.value < 0) {
        // Veto hurts this faction → they support override
        supportForOverride += factions[factionKey] * 0.3
      } else if (effect.value > 0) {
        // Veto helps this faction → they oppose override
        supportForOverride -= factions[factionKey] * 0.1
      }
    }
  }

  // Base override probability: 30-50% range based on assembly dynamics
  const baseChance = 0.30 + (supportForOverride / 500)
  const clampedChance = Math.max(0.30, Math.min(0.50, baseChance))
  const roll = Math.random()
  const overridden = roll < clampedChance

  return {
    overridden,
    assemblyVote: Math.round(clampedChance * 100),
    threshold: 50,
  }
}

export function executeBillSign(
  bill: Bill,
  gameState: ReturnType<typeof useGameStore.getState>,
  _activeFlags: string[],
): { modifiers: StateModifier[]; flags: string[] } {
  gameState.applyModifiers(bill.signEffects)
  return {
    modifiers: bill.signEffects,
    flags: bill.signFlags,
  }
}

export function executeBillVeto(
  bill: Bill,
  gameState: ReturnType<typeof useGameStore.getState>,
  _activeFlags: string[],
): { modifiers: StateModifier[]; flags: string[] } {
  gameState.applyModifiers(bill.vetoEffects)
  return {
    modifiers: bill.vetoEffects,
    flags: bill.vetoFlags,
  }
}

export function isVetoPowerRemoved(activeFlags: string[]): boolean {
  return activeFlags.includes('veto_removed')
}

export function canAssemblyOverride(activeFlags: string[]): boolean {
  return activeFlags.includes('constitution_assembly_override')
}

export function generateReactionText(
  bill: Bill,
  decision: 'signed' | 'vetoed' | 'overridden' | 'auto_passed',
  _activeFlags: string[],
): { speaker: string; text: string }[] {
  const reactions: { speaker: string; text: string }[] = []

  const factionReactions: Record<string, { name: string; signPositive: string; signNegative: string; vetoPositive: string; vetoNegative: string }> = {
    reformists: {
      name: 'Vyktor Reznik',
      signPositive: 'A victory for our mandate, Chancellor. The coalition will be pleased.',
      signNegative: 'Chancellor... our own base may not understand this decision.',
      vetoPositive: 'A wise restraint, Chancellor. Not every bill deserves ink.',
      vetoNegative: 'The reformist press is already drafting their editorials, Chancellor.',
    },
    halvekists: {
      name: 'Dražen Kolvar',
      signPositive: 'A sensible measure. Perhaps the new government understands governance after all.',
      signNegative: 'Another assault on tradition. The Halvekists will remember this.',
      vetoPositive: 'For once, the Chancellor shows prudence. We are... cautiously impressed.',
      vetoNegative: 'The opposition expected nothing less from this administration.',
    },
    workersCoalition: {
      name: 'Soraya Khaled',
      signPositive: 'The workers will remember this day, Chancellor. This is justice.',
      signNegative: "The workers' coalition expected better. Strikes may follow.",
      vetoPositive: 'You protected working families from bad legislation today.',
      vetoNegative: 'You turned your back on the workers who put you in office.',
    },
    ironCovenant: {
      name: 'General Brenner',
      signPositive: 'The military recognizes strength in this decision.',
      signNegative: 'Weakness. The Iron Covenant takes note.',
      vetoPositive: 'A strong Chancellor knows when to say no. Respect.',
      vetoNegative: 'The military establishment will not forget this slight.',
    },
    church: {
      name: 'Archbishop Renek',
      signPositive: 'A moral choice, blessed by the Flame. The Church is pleased.',
      signNegative: 'The faithful will pray for guidance... and for new leadership.',
      vetoPositive: 'The Church thanks the Chancellor for preserving our moral fabric.',
      vetoNegative: "The Archbishop's sermon this Sunday will address this... disappointment.",
    },
    businessClass: {
      name: 'Elara Vostane',
      signPositive: 'Sound fiscal policy, Chancellor. The markets will respond.',
      signNegative: 'This will cost us in investor confidence. I hope it was worth it.',
      vetoPositive: 'The business community breathes easier today.',
      vetoNegative: "Capital is already moving. You've spooked the markets.",
    },
    dravenni: {
      name: 'Idris Kaelen',
      signPositive: 'For the first time, the Dravenni people feel seen by their government.',
      signNegative: 'The Dravenni hoped for better. We have been disappointed before.',
      vetoPositive: 'At least the Chancellor did not make things worse today.',
      vetoNegative: 'Dravenhollow will not forget this. Every veto has a cost.',
    },
  }

  for (const effect of bill.signEffects) {
    const parts = effect.stat.split('.')
    if (parts[0] === 'factions' && parts[1]) {
      const factionKey = parts[1]
      const reaction = factionReactions[factionKey]
      if (reaction && Math.abs(effect.value) >= 10) {
        if (decision === 'signed') {
          reactions.push({
            speaker: reaction.name,
            text: effect.value > 0 ? reaction.signPositive : reaction.signNegative,
          })
        } else {
          reactions.push({
            speaker: reaction.name,
            text: effect.value > 0 ? reaction.vetoPositive : reaction.vetoNegative,
          })
        }
      }
    }
  }

  // Always include the proposer's reaction
  const proposerReactions: Record<string, { sign: string; veto: string }> = {
    'Vyktor Reznik': {
      sign: 'The party thanks you for your signature, Chancellor.',
      veto: 'A difficult choice, Chancellor. The party will need to recalibrate.',
    },
    'Gregor Marić': {
      sign: 'Thirty years I waited for this day. Thank you, Chancellor.',
      veto: 'I will not forget this. The workers will not forget this.',
    },
    'Independent MPs + journalist lobby': {
      sign: 'A free press is the guardian of democracy. You chose wisely.',
      veto: "The journalists' union has issued a statement condemning this veto.",
    },
    'Business-class MPs from Aldenmoor': {
      sign: 'Aldenmoor celebrates tonight, Chancellor. Prosperity follows.',
      veto: 'A missed opportunity. Our competitors will not wait for us.',
    },
    'Church-allied conservative MPs': {
      sign: 'The faithful nation thanks you. Morality has prevailed.',
      veto: 'The Church will not remain silent on this. Expect sermons.',
    },
    "Vostane's allies in business community": {
      sign: 'The markets are surging on the news, Chancellor.',
      veto: 'Disappointing. Capital will find friendlier shores.',
    },
    'Iron Covenant allied MPs': {
      sign: 'Strength. Finally, a Chancellor who understands security.',
      veto: 'You have shown your true colors to the military establishment.',
    },
    'Danika Oberlin': {
      sign: 'Transparency wins. The people have a right to know.',
      veto: 'A dark day for accountability. The journalists are watching.',
    },
    'Reform/progressive coalition': {
      sign: 'Humanity first. This is the Veltria we voted for.',
      veto: 'The refugees will not disappear because you vetoed a bill.',
    },
    'Dusek via defense committee': {
      sign: 'The armed forces are grateful, Chancellor. We will not waste this.',
      veto: 'The military is concerned. Readiness is a matter of national survival.',
    },
    'Reformists + Dravenni sympathizers': {
      sign: 'Today, Veltria chose equality over fear.',
      veto: 'The Dravenni community expected more from a reformist Chancellor.',
    },
    'Conservative rural MPs': {
      sign: 'Rural Veltria thanks the Chancellor for this lifeline.',
      veto: 'The farms will not forget this abandonment.',
    },
    'Reform coalition + Dravenni sympathizers': {
      sign: 'A historic day for civil rights in Veltria.',
      veto: 'History will record this veto. It will not be kind.',
    },
    'Progressive coalition inspired by Jonas': {
      sign: 'Jonas will be proud. This is the Veltria you both dreamed of.',
      veto: 'Jonas is asking why. The children are asking why.',
    },
  }

  const proposerReaction = proposerReactions[bill.proposer]
  if (proposerReaction && !reactions.some(r => r.speaker === bill.proposer)) {
    reactions.push({
      speaker: bill.proposer,
      text: decision === 'signed' ? proposerReaction.sign : proposerReaction.veto,
    })
  }

  // Deduplicate by speaker, keeping first
  const seen = new Set<string>()
  return reactions.filter(r => {
    if (seen.has(r.speaker)) return false
    seen.add(r.speaker)
    return true
  }).slice(0, 3)
}
