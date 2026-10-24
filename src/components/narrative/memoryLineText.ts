import { memoryEchoFor } from '../../engine/memoryEcho'
import type { SceneChoice } from '../../types/narrative'

export const MEMORY_FADE_IN_S = 0.4
export const MEMORY_HOLD_MS = 3200
export const MEMORY_FADE_OUT_S = 0.6

/** The line to show for a choice, or null. Pure; exported for tests. */
export function memoryTextFor(
  choice: SceneChoice | undefined,
  sceneCharacters: readonly string[],
  enabled: boolean,
): string | null {
  if (!enabled || !choice) return null
  const echo = memoryEchoFor(choice, sceneCharacters)
  return echo ? `${echo.name} will remember that.` : null
}
