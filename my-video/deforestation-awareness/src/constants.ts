export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 11130;

// Scene timing: [from, durationInFrames]
export const SCENES = {
  S01: { from: 0,     dur: 150 },
  S02: { from: 150,   dur: 210 },
  S03: { from: 360,   dur: 270 },
  S04: { from: 630,   dur: 300 },
  S05: { from: 930,   dur: 330 },
  S06: { from: 1260,  dur: 300 },
  S07: { from: 1560,  dur: 360 },
  S08: { from: 1920,  dur: 300 },
  S09: { from: 2220,  dur: 300 },
  S10: { from: 2520,  dur: 330 },
  S11: { from: 2850,  dur: 150 },
  S12: { from: 3000,  dur: 300 },
  S13: { from: 3300,  dur: 300 },
  S14: { from: 3600,  dur: 330 },
  S15: { from: 3930,  dur: 420 },
  S16: { from: 4350,  dur: 300 },
  S17: { from: 4650,  dur: 270 },
  S18: { from: 4920,  dur: 270 },
  S19: { from: 5190,  dur: 150 },
  S20: { from: 5340,  dur: 360 },
  S21: { from: 5700,  dur: 390 },
  S22: { from: 6090,  dur: 390 },
  S23: { from: 6480,  dur: 390 },
  S24: { from: 6870,  dur: 120 },
  S25: { from: 6990,  dur: 300 },
  S26: { from: 7290,  dur: 300 },
  S27: { from: 7590,  dur: 300 },
  S28: { from: 7890,  dur: 300 },
  S29: { from: 8190,  dur: 360 },
  S30: { from: 8550,  dur: 120 },
  S31: { from: 8670,  dur: 300 },
  S32: { from: 8970,  dur: 300 },
  S33: { from: 9270,  dur: 300 },
  S34: { from: 9570,  dur: 300 },
  S35: { from: 9870,  dur: 420 },
  S36: { from: 10290, dur: 300 },
  S37: { from: 10590, dur: 540 },
} as const;

export type SceneKey = keyof typeof SCENES;

export type SceneTiming = (typeof SCENES)[SceneKey];

export const SCENE_KEYS = Object.keys(SCENES) as SceneKey[];
