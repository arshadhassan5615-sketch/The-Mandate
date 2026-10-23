import { afterEach, describe, expect, it } from 'vitest'
import { useProvinceNewsStore } from '../provinceNewsStore'

describe('useProvinceNewsStore', () => {
  afterEach(() => {
    useProvinceNewsStore.getState().reset()
  })

  describe('markSeen', () => {
    it('adds each id once, keeping first-seen order across overlapping calls', () => {
      useProvinceNewsStore.getState().markSeen(['a', 'b'])
      useProvinceNewsStore.getState().markSeen(['b', 'c', 'a'])

      expect(useProvinceNewsStore.getState().seenIds).toEqual(['a', 'b', 'c'])
    })

    it('keeps the same seenIds reference when given an empty list', () => {
      const before = useProvinceNewsStore.getState().seenIds

      useProvinceNewsStore.getState().markSeen([])

      expect(useProvinceNewsStore.getState().seenIds).toBe(before)
    })

    it('keeps the same seenIds reference when every id is already seen', () => {
      useProvinceNewsStore.getState().markSeen(['a'])
      const before = useProvinceNewsStore.getState().seenIds

      useProvinceNewsStore.getState().markSeen(['a'])

      expect(useProvinceNewsStore.getState().seenIds).toBe(before)
    })
  })

  describe('reset', () => {
    it('clears all seen ids', () => {
      useProvinceNewsStore.getState().markSeen(['a', 'b'])

      useProvinceNewsStore.getState().reset()

      expect(useProvinceNewsStore.getState().seenIds).toEqual([])
    })
  })
})
