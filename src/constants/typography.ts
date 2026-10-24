// Root font size at the "normal" text-size setting (settingsStore FONT_SIZE_CSS.normal).
// Sizes written with rem() look identical at normal and scale with the setting.
export const ROOT_FONT_PX = 18

/** Converts a design size in px (at the normal setting) to rem. */
export function rem(px: number): string {
  return `${Number((px / ROOT_FONT_PX).toFixed(4))}rem`
}
