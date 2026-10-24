// Optional painted logos for the sidebar. Save src/assets/images/rail-icons/<key>.png (or .jpg) and the
// sidebar uses it in place of the drawn icon. Light glyphs on pure black work best: the image is
// drawn with mix-blend-mode: screen, so black falls away on the dark button.
import { pickArt } from './sealArt'
const RAIL_ART = import.meta.glob('./images/rail-icons/*.{png,jpg,jpeg}', { eager: true, import: 'default' }) as Record<string, string>
const EXTENSIONS = ['png', 'jpg', 'jpeg'] as const
// File names are lowercase (briefs.png); rail keys are labels ("Briefs"), so match case-insensitively.
export function getRailArt(key: string): string | null {
  const name = key.toLowerCase()
  for (const ext of EXTENSIONS) {
    const art = pickArt(RAIL_ART, `${name}.${ext}`)
    if (art !== null) return art
  }
  return null
}
