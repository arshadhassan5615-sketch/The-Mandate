import { describe, it, expect } from 'vitest'
import { SCENE_REGISTRY } from '../NarrativeEngine'
import { cutsceneVariants, getCutsceneArt } from '../../assets/cutscenes'

const CUTSCENE_SCENE_IDS = [
  'act1_week1_inauguration',
  'act1_week1_address_nation',
  'act1_week3_mine_collapse',
  'act1_week13_no_confidence',
  'act2_week26_referendum_decisive',
  'act2_week26_referendum_narrow',
  'act2_week26_referendum_rejected',
  'act3_assassination_sniper',
  'act3_assassination_bombing',
  'act3_assassination_poisoning',
  'act3_week37_coup_attempt',
  'act3_battle_gravenmark',
]

describe('scene cutscenes', () => {
  it('every panel of every scene cutscene references a registered cutscene image', () => {
    for (const [id, scene] of SCENE_REGISTRY) {
      if (!scene.cutscene) continue
      const { panels } = scene.cutscene
      expect(
        Array.isArray(panels) && panels.length > 0,
        `scene "${id}": cutscene.panels must be a non-empty array`,
      ).toBe(true)
      for (const panel of panels) {
        if (panel.variantBy) {
          expect(
            getCutsceneArt(panel.image) !== null || cutsceneVariants(panel.image).length > 0,
            `scene "${id}": variant panel "${panel.image}" has no base or variant image`,
          ).toBe(true)
          continue
        }
        expect(
          getCutsceneArt(panel.image),
          `scene "${id}": cutscene panel image "${panel.image}" is not in the cutscene art registry`,
        ).not.toBeNull()
      }
    }
  })

  it('the cutscene-bearing scenes each declare a cutscene', () => {
    for (const id of CUTSCENE_SCENE_IDS) {
      expect(SCENE_REGISTRY.get(id)?.cutscene?.panels.length, `scene "${id}" has no cutscene`).toBeGreaterThan(0)
    }
  })

  it('the inauguration scene declares the inauguration cutscene', () => {
    expect(SCENE_REGISTRY.get('act1_week1_inauguration')?.cutscene?.panels[0].image).toBe('inauguration')
  })
})
