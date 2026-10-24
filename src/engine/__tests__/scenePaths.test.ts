import { describe, it, expect } from 'vitest'
import { buildScenePath } from '../scenePaths'
import type { ChoiceRecord } from '../../stores/narrativeStore'
import type { NarrativeNode } from '../../types/narrative'

type SceneShape = Pick<NarrativeNode, 'id' | 'choices' | 'segments'>

// Opening: 3 choices. Taking "Take the bill" continues into seg_one (2 choices).
// Taking "Sign it" there ends the meeting. Total declared choices: 3 + 2 = 5.
const scene: SceneShape = {
  id: 'scene_bill',
  choices: [
    { id: 'o_take', text: 'Take the bill', nextSegment: 'seg_one' },
    { id: 'o_wait', text: 'Wait and see' },
    { id: 'o_send', text: 'Send for the minister', nextNodeId: 'scene_minister' },
  ],
  segments: {
    seg_one: {
      choices: [
        { id: 's_sign', text: 'Sign it' },
        { id: 's_veto', text: 'Veto it' },
      ],
    },
  },
}

const takenLog: ChoiceRecord[] = [
  { sceneId: 'scene_bill', segmentId: null, choiceId: 'o_take', week: 3 },
  { sceneId: 'scene_bill', segmentId: 'seg_one', choiceId: 's_sign', week: 3 },
]

describe('buildScenePath', () => {
  it('marks only the taken opening choice and the taken segment choice', () => {
    const { root } = buildScenePath(scene, takenLog)
    expect(root.segmentId).toBeNull()
    expect(root.choices.map(c => c.taken)).toEqual([true, false, false])
    const next = root.choices[0].next
    expect(next?.segmentId).toBe('seg_one')
    expect(next?.choices.map(c => c.taken)).toEqual([true, false])
  })

  it('builds next only under the taken segment choice', () => {
    const { root } = buildScenePath(scene, takenLog)
    expect(root.choices[0].next).not.toBeNull()
    expect(root.choices[1].next).toBeNull()
    expect(root.choices[2].next).toBeNull()
    const next = root.choices[0].next
    expect(next?.choices[0].next).toBeNull()
    expect(next?.choices[1].next).toBeNull()
  })

  it('resolves targets: segment, scene, and end', () => {
    const { root } = buildScenePath(scene, takenLog)
    expect(root.choices[0].target).toEqual({ kind: 'segment', id: 'seg_one' })
    expect(root.choices[1].target).toEqual({ kind: 'end' })
    expect(root.choices[2].target).toEqual({ kind: 'scene', id: 'scene_minister' })
    const next = root.choices[0].next
    expect(next?.choices[0].target).toEqual({ kind: 'end' })
    expect(next?.choices[1].target).toEqual({ kind: 'end' })
  })

  it('counts explored paths against all declared choices', () => {
    const summary = buildScenePath(scene, takenLog)
    expect(summary.explored).toBe(2)
    expect(summary.total).toBe(5)
  })

  it('does not build next for an untaken choice even when it targets a segment', () => {
    const withSegmentTarget: SceneShape = {
      id: 'scene_branching',
      choices: [{ id: 'o_look', text: 'Look closer', nextSegment: 'seg_look' }],
      segments: { seg_look: { choices: [{ id: 'l_nod', text: 'Nod' }] } },
    }
    const { root } = buildScenePath(withSegmentTarget, [])
    expect(root.choices[0].target).toEqual({ kind: 'segment', id: 'seg_look' })
    expect(root.choices[0].taken).toBe(false)
    expect(root.choices[0].next).toBeNull()
  })

  it('terminates when a taken segment choice points back to a segment on the path', () => {
    const looping: SceneShape = {
      id: 'scene_loop',
      choices: [{ id: 'o_loop', text: 'Begin the loop', nextSegment: 'seg_loop' }],
      segments: {
        seg_loop: { choices: [{ id: 'l_again', text: 'Go round again', nextSegment: 'seg_loop' }] },
      },
    }
    const log: ChoiceRecord[] = [
      { sceneId: 'scene_loop', segmentId: null, choiceId: 'o_loop', week: 1 },
      { sceneId: 'scene_loop', segmentId: 'seg_loop', choiceId: 'l_again', week: 1 },
    ]
    const summary = buildScenePath(looping, log)
    const loopNode = summary.root.choices[0].next
    expect(loopNode?.segmentId).toBe('seg_loop')
    const again = loopNode?.choices[0]
    expect(again?.taken).toBe(true)
    expect(again?.target).toEqual({ kind: 'segment', id: 'seg_loop' })
    expect(again?.next).toBeNull()
    expect(summary.explored).toBe(2)
    expect(summary.total).toBe(2)
  })

  it('ignores log records that belong to other scenes', () => {
    const log: ChoiceRecord[] = [
      ...takenLog,
      { sceneId: 'some_other_scene', segmentId: null, choiceId: 'o_wait', week: 2 },
    ]
    const summary = buildScenePath(scene, log)
    expect(summary.explored).toBe(2)
    expect(summary.root.choices[1].taken).toBe(false)
  })

  it('does not mutate the scene or the log', () => {
    const sceneCopy = structuredClone(scene)
    const logCopy = structuredClone(takenLog)
    buildScenePath(scene, takenLog)
    expect(scene).toEqual(sceneCopy)
    expect(takenLog).toEqual(logCopy)
  })
})
