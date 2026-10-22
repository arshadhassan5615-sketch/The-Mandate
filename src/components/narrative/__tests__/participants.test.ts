import { describe, it, expect } from 'vitest'
import { sceneParticipants, MAX_PARTICIPANTS, PLAYER_ID } from '../participants'

describe('sceneParticipants', () => {
  it('returns no one and no current speaker for an empty scene', () => {
    expect(sceneParticipants([], null)).toEqual({ ids: [], currentId: null })
  })

  it('lists speakers in order of first appearance and makes the newest one current', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'dialogue', characterId: 'danika_oberlin' },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['vyktor_reznik', 'danika_oberlin'],
      currentId: 'danika_oberlin',
    })
  })

  it('moves a speaker who speaks again to the end (A speaks, B speaks, A speaks again gives [B, A])', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'dialogue', characterId: 'danika_oberlin' },
      { type: 'dialogue', characterId: 'vyktor_reznik' },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['danika_oberlin', 'vyktor_reznik'],
      currentId: 'vyktor_reznik',
    })
  })

  it('keeps first-appearance order when the player spoke last, with no current speaker', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'dialogue', characterId: 'danika_oberlin' },
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'player_spoken' },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['vyktor_reznik', 'danika_oberlin'],
      currentId: null,
    })
  })

  it('never lists the player, and reports no current speaker when the newest line is the player', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'player_spoken' },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['vyktor_reznik'],
      currentId: null,
    })
  })

  it('treats a dialogue line tagged with the player id as a player line', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'dialogue', characterId: PLAYER_ID },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['vyktor_reznik'],
      currentId: null,
    })
  })

  it('skips the player in the middle without losing the others', () => {
    const history = [
      { type: 'dialogue', characterId: 'vyktor_reznik' },
      { type: 'player_spoken' },
      { type: 'dialogue', characterId: 'danika_oberlin' },
    ]
    expect(sceneParticipants(history, null)).toEqual({
      ids: ['vyktor_reznik', 'danika_oberlin'],
      currentId: 'danika_oberlin',
    })
  })

  it('counts an active dialogue segment as the newest line', () => {
    const history = [{ type: 'dialogue', characterId: 'vyktor_reznik' }]
    const active = { type: 'dialogue', character: 'danika_oberlin' }
    expect(sceneParticipants(history, active)).toEqual({
      ids: ['vyktor_reznik', 'danika_oberlin'],
      currentId: 'danika_oberlin',
    })
  })

  it('treats an active dialogue segment from the player as the newest line', () => {
    const history = [{ type: 'dialogue', characterId: 'vyktor_reznik' }]
    const active = { type: 'dialogue', character: PLAYER_ID }
    expect(sceneParticipants(history, active)).toEqual({
      ids: ['vyktor_reznik'],
      currentId: null,
    })
  })

  it('does not add anyone for an active description segment', () => {
    expect(sceneParticipants([], { type: 'description' })).toEqual({ ids: [], currentId: null })
  })

  it('does not add anyone for an active monologue or thought segment', () => {
    expect(sceneParticipants([], { type: 'monologue', character: 'vyktor_reznik' })).toEqual({
      ids: [],
      currentId: null,
    })
    expect(sceneParticipants([], { type: 'internal_thought', character: 'vyktor_reznik' })).toEqual({
      ids: [],
      currentId: null,
    })
  })

  it('does not add anyone for description, narrative, or thought history entries', () => {
    const history = [
      { type: 'description' },
      { type: 'narrative' },
      { type: 'internal_thought', characterId: 'vyktor_reznik' },
      { type: 'monologue', characterId: 'vyktor_reznik' },
    ]
    expect(sceneParticipants(history, null)).toEqual({ ids: [], currentId: null })
  })

  it('ignores dialogue entries that have no speaker id', () => {
    const history = [{ type: 'dialogue' }, { type: 'dialogue', characterId: '' }]
    expect(sceneParticipants(history, null)).toEqual({ ids: [], currentId: null })
  })

  it('caps the list at MAX_PARTICIPANTS, keeping the most recent speakers in first-appearance order', () => {
    const history = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'].map(id => ({
      type: 'dialogue',
      characterId: id,
    }))
    const result = sceneParticipants(history, null)
    expect(MAX_PARTICIPANTS).toBe(6)
    expect(result.ids).toEqual(['s2', 's3', 's4', 's5', 's6', 's7'])
    expect(result.currentId).toBe('s7')
  })

  it('keeps the six most recently active speakers in first-appearance order, with the current speaker last', () => {
    const history = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'a'].map(id => ({
      type: 'dialogue',
      characterId: id,
    }))
    const result = sceneParticipants(history, null)
    expect(result.ids).toEqual(['c', 'd', 'e', 'f', 'g', 'a'])
    expect(result.currentId).toBe('a')
  })

  it('does not mutate the input history or active segment', () => {
    const history = Object.freeze([
      Object.freeze({ type: 'dialogue', characterId: 'vyktor_reznik' }),
      Object.freeze({ type: 'player_spoken' }),
    ])
    const active = Object.freeze({ type: 'dialogue', character: 'danika_oberlin' })

    const result = sceneParticipants(history, active)

    expect(history).toHaveLength(2)
    expect(result).toEqual({ ids: ['vyktor_reznik', 'danika_oberlin'], currentId: 'danika_oberlin' })
  })
})
