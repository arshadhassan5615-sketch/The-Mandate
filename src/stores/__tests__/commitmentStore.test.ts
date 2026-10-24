import { afterEach, describe, expect, it } from 'vitest'
import type { Commitment } from '../../engine/commitments'
import { useCommitmentStore } from '../commitmentStore'

function makeCommitment(id: string): Commitment {
  return {
    id,
    sceneId: 'scene_a',
    sceneTitle: 'Scene A',
    choiceId: id,
    week: 3,
    quote: 'I promise.',
    witnesses: [],
    flags: [],
  }
}

describe('useCommitmentStore', () => {
  afterEach(() => {
    useCommitmentStore.getState().reset()
  })

  describe('record', () => {
    it('appends a new commitment', () => {
      const first = makeCommitment('scene_a:one')

      useCommitmentStore.getState().record(first)

      expect(useCommitmentStore.getState().commitments).toEqual([first])
    })

    it('keeps one entry and the same array reference when the same id is recorded twice', () => {
      useCommitmentStore.getState().record(makeCommitment('scene_a:one'))
      const before = useCommitmentStore.getState().commitments

      useCommitmentStore.getState().record(makeCommitment('scene_a:one'))

      expect(useCommitmentStore.getState().commitments).toHaveLength(1)
      expect(useCommitmentStore.getState().commitments).toBe(before)
    })
  })

  describe('reset', () => {
    it('clears all commitments', () => {
      useCommitmentStore.getState().record(makeCommitment('scene_a:one'))
      useCommitmentStore.getState().record(makeCommitment('scene_b:two'))

      useCommitmentStore.getState().reset()

      expect(useCommitmentStore.getState().commitments).toEqual([])
    })
  })
})
