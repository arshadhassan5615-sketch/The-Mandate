// A choice prints each news story once, even when its id or flags repeat a
// news trigger. Duplicate triggers would otherwise print the same headline twice.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { useNewsStore } from '../newsStore'
import { useProvinceNewsStore } from '../provinceNewsStore'
import { SCENE_REGISTRY } from '../../engine/NarrativeEngine'
import type { NarrativeNode } from '../../types/narrative'

const TEST_WEEK = 4
const TRIGGER = 'contractor_highway_state'

// The choice id equals its own flag, which is also a news trigger.
const SELF_FLAG_SCENE_ID = 'zz_news_dedupe'
const SELF_FLAG_SCENE: NarrativeNode = {
  id: SELF_FLAG_SCENE_ID,
  title: 'News Dedupe Self Flag Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene whose choice repeats a news trigger.' }],
  choices: [
    { id: TRIGGER, text: 'State Bureau.', flags: [TRIGGER] },
  ],
}

// The choice id differs, but the same flag is listed twice.
const DUPLICATE_FLAG_SCENE_ID = 'zz_news_dedupe_flags'
const DUPLICATE_FLAG_SCENE: NarrativeNode = {
  id: DUPLICATE_FLAG_SCENE_ID,
  title: 'News Dedupe Duplicate Flag Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene whose flags repeat a news trigger.' }],
  choices: [
    { id: 'zz_choice', text: 'x', flags: [TRIGGER, TRIGGER] },
  ],
}

// Two choices: one sets a news-trigger flag under a non-trigger id, the other
// uses the news trigger itself as its id and sets no flags.
const REPEAT_FLAG_SCENE_ID = 'zz_news_dedupe_repeat'
const REPEAT_CHOICE_ID = 'zz_repeat_choice'
const REPEAT_FLAG_SCENE: NarrativeNode = {
  id: REPEAT_FLAG_SCENE_ID,
  title: 'News Dedupe Repeat Flag Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene whose flag may already be active.' }],
  choices: [
    { id: REPEAT_CHOICE_ID, text: 'x', flags: [TRIGGER] },
    { id: TRIGGER, text: 'y', flags: [] },
  ],
}

function headlinesOfArticles(): string[] {
  return useNewsStore.getState().articles.map(a => a.headline)
}

describe('narrativeStore news dedupe', () => {
  beforeEach(async () => {
    SCENE_REGISTRY.set(SELF_FLAG_SCENE_ID, SELF_FLAG_SCENE)
    SCENE_REGISTRY.set(DUPLICATE_FLAG_SCENE_ID, DUPLICATE_FLAG_SCENE)
    SCENE_REGISTRY.set(REPEAT_FLAG_SCENE_ID, REPEAT_FLAG_SCENE)
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: TEST_WEEK })
    useNarrativeStore.getState().resetAll()
    useProvinceNewsStore.getState().reset()
    useNewsStore.setState({ articles: [] })
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(SELF_FLAG_SCENE_ID)
    SCENE_REGISTRY.delete(DUPLICATE_FLAG_SCENE_ID)
    SCENE_REGISTRY.delete(REPEAT_FLAG_SCENE_ID)
    vi.restoreAllMocks()
  })

  it('prints each story once when the choice id repeats its own flag', () => {
    useNarrativeStore.getState().loadScene(SELF_FLAG_SCENE_ID)

    useNarrativeStore.getState().processChoice(TRIGGER)

    const headlines = headlinesOfArticles()
    expect(new Set(headlines).size).toBe(headlines.length)
    expect(headlines.length).toBeGreaterThan(0)
  })

  it('prints each story once when a flag is listed twice', () => {
    useNarrativeStore.getState().loadScene(DUPLICATE_FLAG_SCENE_ID)

    useNarrativeStore.getState().processChoice('zz_choice')

    const headlines = headlinesOfArticles()
    expect(new Set(headlines).size).toBe(headlines.length)
    expect(headlines.length).toBeGreaterThan(0)
  })

  it('does not reprint a flag story that is already active', () => {
    useNarrativeStore.setState({ activeFlags: [TRIGGER] })
    useNarrativeStore.getState().loadScene(REPEAT_FLAG_SCENE_ID)

    useNarrativeStore.getState().processChoice(REPEAT_CHOICE_ID)

    expect(headlinesOfArticles()).toHaveLength(0)
  })

  it('prints a flag story when the flag is newly set', () => {
    useNarrativeStore.setState({ activeFlags: [] })
    useNarrativeStore.getState().loadScene(REPEAT_FLAG_SCENE_ID)

    useNarrativeStore.getState().processChoice(REPEAT_CHOICE_ID)

    expect(headlinesOfArticles().length).toBeGreaterThan(0)
  })

  it('prints a choice-id story even when its flag is already active', () => {
    useNarrativeStore.setState({ activeFlags: [TRIGGER] })
    useNarrativeStore.getState().loadScene(REPEAT_FLAG_SCENE_ID)

    useNarrativeStore.getState().processChoice(TRIGGER)

    expect(headlinesOfArticles().length).toBeGreaterThan(0)
  })
})
