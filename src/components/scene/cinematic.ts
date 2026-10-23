// Shared timing for the game's cinematic images: cutscene stills, location
// establishing shots and ending paintings.
export const CINEMA_FADE_IN_S = 2.2
export const CINEMA_FADE_OUT_S = 1.8
export const CINEMA_SKIP_FADE_S = 0.6
export const CINEMA_ZOOM_SCALE = 1.06
export const CINEMA_EASE = [0.4, 0, 0.2, 1] as const

export function secondsToMs(seconds: number): number {
  return Math.round(seconds * 1000)
}

/** Time a card stays before the next one starts: its fade-in plus its authored hold. */
export function cardDwellMs(holdMs: number, reduceMotion: boolean): number {
  return reduceMotion ? holdMs : secondsToMs(CINEMA_FADE_IN_S) + holdMs
}

/** Seconds the slow zoom runs: the whole time the image is visible, fade-out included. */
export function zoomDurationS(holdMs: number): number {
  return CINEMA_FADE_IN_S + holdMs / 1000 + CINEMA_FADE_OUT_S
}
