/**
 * Establishing-shot image key -> in-game week it last opened a scene.
 * Module-level so it survives scene changes within a session; tests clear it.
 */
export const establishingShownWeek = new Map<string, number>()
