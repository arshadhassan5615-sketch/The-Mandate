// S5 — router analysis: lists whose every choice is gated. Enumerates the
// flag/stat space the gates read and evaluates each gate the way
// conditionEvaluator does (flag membership, loose ==, numeric compares).
import { asFlagTest, conditionShapeProblem, fmtConds } from './load.mjs'

const CONTINUE_RE = /^\s*[[(]|continue|proceed/i
const MAX_FLAGS = 12
const MAX_COMBOS = 20000

export function isContinueStyle(choices) {
  const texts = choices.map(c => c.text.trim())
  return texts.every(t => CONTINUE_RE.test(t)) || (texts.length > 1 && new Set(texts).size === 1)
}

function statCandidates(conds) {
  const byStat = new Map()
  for (const c of conds) {
    if (asFlagTest(c) || typeof c?.stat !== 'string') continue
    const vals = byStat.get(c.stat) ?? new Set()
    if (typeof c.value === 'number') [c.value - 1, c.value, c.value + 1].forEach(v => vals.add(v))
    else { vals.add(c.value); vals.add('__other__') }
    byStat.set(c.stat, vals)
  }
  return [...byStat.entries()].map(([stat, vals]) => [stat, [...vals]])
}

function compare(actual, op, expected) {
  switch (op) {
    case '>': return actual > expected
    case '<': return actual < expected
    case '>=': return actual >= expected
    case '<=': return actual <= expected
    case '==': return actual == expected
    case '!=': return actual != expected
    default: return false
  }
}

function evalCond(c, flags, stats, statPaths) {
  if (conditionShapeProblem(c, statPaths)) return false
  const f = asFlagTest(c)
  if (f) return flags.has(f.flag) === f.want
  return compare(stats.get(c.stat), c.operator, c.value)
}

function* assignments(flagNames, statSpace) {
  const flagCombos = 1 << flagNames.length
  const statCombos = statSpace.reduce((n, [, v]) => n * v.length, 1)
  const total = flagCombos * statCombos
  const step = total > MAX_COMBOS ? Math.ceil(total / MAX_COMBOS) : 1
  for (let i = 0; i < total; i += step) {
    const fm = i % flagCombos
    let si = Math.floor(i / flagCombos)
    const flags = new Set(flagNames.filter((_, b) => fm & (1 << b)))
    const stats = new Map()
    for (const [stat, vals] of statSpace) {
      stats.set(stat, vals[si % vals.length])
      si = Math.floor(si / vals.length)
    }
    yield { flags, stats }
  }
}

/**
 * Flags F and G are mutually exclusive when every setter of each is a choice
 * in one and the same list (picking one forecloses the other), no choice sets
 * both, and neither is a code literal.
 */
export function exclusiveFlags(f, g, idx) {
  const sf = idx.flagSetterLists.get(f)
  const sg = idx.flagSetterLists.get(g)
  if (!sf || !sg || idx.codeLits.has(f) || idx.codeLits.has(g)) return false
  if (sf.size !== 1 || sg.size !== 1) return false
  const [lf] = sf
  const [lg] = sg
  if (lf !== lg) return false
  return !idx.bothSet.has(`${f}|${g}`)
}

export function analyzeRouter(choices, statPaths, idx) {
  const allConds = choices.flatMap(c => c.conditions ?? [])
  const shapeProblems = []
  for (const c of choices) {
    for (const cond of c.conditions ?? []) {
      const p = conditionShapeProblem(cond, statPaths)
      if (p) shapeProblems.push({ choice: c.id, cond, problem: p })
    }
  }
  const flagNames = [...new Set(allConds.map(asFlagTest).filter(Boolean).map(f => f.flag))]
  const statSpace = statCandidates(allConds)
  const result = { flagCount: flagNames.length, shapeProblems, overlaps: [], hole: null }
  if (flagNames.length > MAX_FLAGS) {
    result.skipped = `too many flags (${flagNames.length})`
    return result
  }
  const seenPairs = new Set()
  for (const a of assignments(flagNames, statSpace)) {
    const truthy = choices.filter(c => (c.conditions ?? []).every(cond => evalCond(cond, a.flags, a.stats, statPaths)))
    if (truthy.length === 0 && !result.hole) {
      result.hole = { flags: [...a.flags], stats: Object.fromEntries(a.stats) }
    }
    for (let i = 0; i < truthy.length; i++) {
      for (let j = i + 1; j < truthy.length; j++) {
        const key = `${truthy[i].id}|${truthy[j].id}`
        if (seenPairs.has(key)) continue
        seenPairs.add(key)
        const needA = (truthy[i].conditions ?? []).map(asFlagTest).filter(f => f?.want).map(f => f.flag)
        const needB = (truthy[j].conditions ?? []).map(asFlagTest).filter(f => f?.want).map(f => f.flag)
        const blocker = needA.flatMap(f => needB.map(g => [f, g])).find(([f, g]) => f !== g && exclusiveFlags(f, g, idx))
        result.overlaps.push({
          a: truthy[i].id, b: truthy[j].id,
          gateA: fmtConds(truthy[i].conditions), gateB: fmtConds(truthy[j].conditions),
          example: [...a.flags],
          realistic: !blocker,
          blocker: blocker ? `${blocker[0]} / ${blocker[1]} are set only by sibling choices of one list` : null,
        })
      }
    }
  }
  return result
}
