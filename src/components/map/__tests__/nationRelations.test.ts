import { describe, it, expect } from 'vitest'
import { relationFor } from '../nationRelations'

const tyv = (tyvarenHostility: number) => relationFor('tyvaren', { tyvarenHostility, sovarka_relation: 0 })
const sov = (sovarka_relation: number) => relationFor('sovarka', { tyvarenHostility: 0, sovarka_relation })

describe('relationFor', () => {
  it.each([
    [0, 'Strained'], [49, 'Strained'], [50, 'Hostile'], [100, 'Hostile'],
  ])('tyvaren hostility %i -> %s', (h, label) => {
    expect(tyv(h)).toBe(label)
  })

  it.each([
    [60, 'Allied'], [59, 'Friendly'], [20, 'Friendly'], [19, 'Neutral'],
    [-19, 'Neutral'], [-20, 'Strained'], [-59, 'Strained'], [-60, 'Hostile'],
  ])('sovarka relation %i -> %s', (r, label) => {
    expect(sov(r)).toBe(label)
  })

  it('morivask is always Hostile', () => {
    expect(relationFor('morivask', { tyvarenHostility: 0, sovarka_relation: 100 })).toBe('Hostile')
  })
  it('lytheira is always Neutral', () => {
    expect(relationFor('lytheira', { tyvarenHostility: 100, sovarka_relation: -100 })).toBe('Neutral')
  })
  it('unknown id is Neutral', () => {
    expect(relationFor('atlantis', { tyvarenHostility: 100, sovarka_relation: -100 })).toBe('Neutral')
  })
})
