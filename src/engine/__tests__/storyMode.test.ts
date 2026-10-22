import { afterEach, describe, expect, it } from 'vitest'
import { softenForStoryMode } from '../storyMode'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'

describe('softenForStoryMode', () => {
  const cases: Array<[string, string, 'add' | 'set' | 'multiply', number, string | undefined, number]> = [
    ['faction loss halved', 'factions.reformists', 'add', -10, 'scene_choice', -5],
    ['faction gain unchanged', 'factions.reformists', 'add', 10, 'scene_choice', 10],
    ['advisorTrust loss halved', 'advisorTrust.vyktor', 'add', -4, 'scene_choice', -2],
    ['stress increase halved', 'personal.stressLevel', 'add', 8, 'scene_choice', 4],
    ['stress decrease unchanged', 'personal.stressLevel', 'add', -8, 'scene_choice', -8],
    ['tyvarenHostility increase halved', 'tyvarenHostility', 'add', 6, 'scene_choice', 3],
    ['unlisted stat unchanged', 'personal.moralCompass', 'add', -10, 'scene_choice', -10],
    ['set unchanged', 'factions.reformists', 'set', -10, 'scene_choice', -10],
    ['multiply unchanged', 'factions.reformists', 'multiply', -10, 'scene_choice', -10],
    ['budget source unchanged', 'factions.reformists', 'add', -10, 'budget', -10],
    ['bill source unchanged', 'factions.reformists', 'add', -10, 'bill', -10],
    ['system source unchanged', 'factions.reformists', 'add', -10, 'system', -10],
    ['undefined source softened', 'factions.reformists', 'add', -10, undefined, -5],
    ['weekly tick softened', 'nation.economyHealth', 'add', -6, 'weekly_tick', -3],
    ['cabinet softened', 'playerPolling', 'add', -2, 'cabinet', -1],
  ]

  it.each(cases)('%s', (_name, stat, op, value, source, expected) => {
    expect(softenForStoryMode(stat, op, value, source)).toBe(expected)
  })
})

describe('applyModifiers integration', () => {
  afterEach(() => {
    useSettingsStore.setState({ storyMode: false })
    useGameStore.getState().resetToInitial()
  })

  function reformistsDelta(storyMode: boolean): number {
    useSettingsStore.setState({ storyMode })
    useGameStore.setState({
      factions: { ...useGameStore.getState().factions, reformists: 50 },
    })
    const before = useGameStore.getState().factions.reformists
    useGameStore.getState().applyModifiers([
      { stat: 'factions.reformists', operation: 'add', value: -10, sourceType: 'scene_choice' },
    ])
    return before - useGameStore.getState().factions.reformists
  }

  it('lowers reformists by exactly 5 with Story Mode on', () => {
    expect(reformistsDelta(true)).toBe(5)
  })

  it('lowers reformists by 10 with Story Mode off', () => {
    expect(reformistsDelta(false)).toBe(10)
  })
})
