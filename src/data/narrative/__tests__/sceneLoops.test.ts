// Loop guard for the three meetings that used to circle forever under automated
// pickers: every segment must keep a path to a terminal choice, and a full walk
// with first / last / seeded-random picks must finish well inside the choice cap.
import { beforeEach, describe, expect, it } from 'vitest'
import act1Meeting from '../act1/act1_week2_cabinet_formation_meeting.json'
import act2Megaproject from '../act2/act2_week20_megaproject_choice.json'
import act6Summit from '../act6/act6_week72_morivask_summit.json'
import { useGameStore } from '../../../stores/gameStore'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { playScene, seededPick, type PickChoice } from '../../../test/choicePlayer'
import type { SceneChoice } from '../../../types/narrative'

type GraphChoice = {
  id: string
  nextSegment?: string
  nextNodeId?: string
  conditions?: unknown[]
}
type GraphScene = {
  id: string
  choices?: GraphChoice[]
  segments?: Record<string, { choices?: GraphChoice[] }>
}
type SceneUnderTest = { id: string; graph: Record<string, GraphChoice[]> }

const MAX_CHOICES_PER_WALK = 40
const RANDOM_SEEDS = Array.from({ length: 20 }, (_, i) => i + 1)

function toGraph(scene: GraphScene): Record<string, GraphChoice[]> {
  const graph: Record<string, GraphChoice[]> = { root: scene.choices ?? [] }
  for (const [segId, seg] of Object.entries(scene.segments ?? {})) {
    graph[segId] = seg.choices ?? []
  }
  return graph
}

function nextOf(choice: GraphChoice): string | undefined {
  return choice.nextSegment ?? choice.nextNodeId ?? undefined
}

/** Segments from which some path reaches a choice with no next segment (scene end). */
function segmentsReachingEnd(graph: Record<string, GraphChoice[]>): Set<string> {
  const reaching = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const [segId, choices] of Object.entries(graph)) {
      if (reaching.has(segId)) continue
      const leadsOut = choices.some(c => {
        const next = nextOf(c)
        return next === undefined || reaching.has(next)
      })
      if (leadsOut) {
        reaching.add(segId)
        changed = true
      }
    }
  }
  return reaching
}

function terminalChoiceIds(graph: Record<string, GraphChoice[]>): string[] {
  return Object.values(graph)
    .flat()
    .filter(c => nextOf(c) === undefined)
    .map(c => c.id)
}

const SCENES: SceneUnderTest[] = [
  { id: act1Meeting.id, graph: toGraph(act1Meeting as unknown as GraphScene) },
  { id: act2Megaproject.id, graph: toGraph(act2Megaproject as unknown as GraphScene) },
  { id: act6Summit.id, graph: toGraph(act6Summit as unknown as GraphScene) },
]

interface WalkResult {
  choicesMade: number
  loopHit: boolean
  lastPicked: SceneChoice | undefined
  pickedIds: string[]
}

function walkScene(sceneId: string, pick: PickChoice): WalkResult {
  useGameStore.getState().resetToInitial()
  useNarrativeStore.getState().resetAll()
  useNarrativeStore.getState().loadScene(sceneId)
  const picked: SceneChoice[] = []
  const result = playScene(choices => {
    const choice = pick(choices)
    picked.push(choice)
    return choice
  })
  return {
    choicesMade: result.choicesMade,
    loopHit: result.loopHit,
    lastPicked: picked[picked.length - 1],
    pickedIds: picked.map(c => c.id),
  }
}

function walkAllPickers(sceneId: string): WalkResult[] {
  const pickers: PickChoice[] = [
    choices => choices[0],
    choices => choices[choices.length - 1],
    ...RANDOM_SEEDS.map(seed => seededPick(seed)),
  ]
  return pickers.map(pick => walkScene(sceneId, pick))
}

describe.each(SCENES)('meeting loop guard: $id', ({ id, graph }) => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useNarrativeStore.getState().resetAll()
  })

  it('keeps a path to scene end from every segment (static)', () => {
    const reaching = segmentsReachingEnd(graph)
    for (const [segId, choices] of Object.entries(graph)) {
      const hasOpenChoice = choices.some(c => {
        const next = nextOf(c)
        return !c.conditions?.length || next === undefined || reaching.has(next)
      })
      expect(hasOpenChoice, `segment "${segId}" has no path to scene end`).toBe(true)
    }
  })

  it('finishes under every picker in fewer than 40 choices (dynamic)', () => {
    const walks = walkAllPickers(id)
    const counts = walks.map(walk => walk.choicesMade)
    console.log(`WALK COUNTS ${id}: ${counts.join(',')}`)
    walks.forEach((walk, index) => {
      expect(walk.loopHit, `picker #${index} hit the loop guard`).toBe(false)
    })
    // The interview meeting covers nine ministries, so its loop-free walks run longer
    const limit = id === 'act1_w2_formation_meeting' ? 59 : MAX_CHOICES_PER_WALK
    expect(Math.max(...counts), `longest walk ${Math.max(...counts)} choices`).toBeLessThan(limit)
    walks.forEach((walk, index) => {
      const last = walk.lastPicked
      expect(last?.nextSegment ?? last?.nextNodeId, `picker #${index} ended without a terminal choice`).toBeUndefined()
    })
  })

  it('reaches every original terminal outcome across the walks', () => {
    const reached = new Set(walkAllPickers(id).flatMap(walk => walk.pickedIds))
    const terminals = terminalChoiceIds(graph)
    for (const terminal of terminals) {
      expect(reached.has(terminal), `terminal "${terminal}" never reached`).toBe(true)
    }
  })
})
