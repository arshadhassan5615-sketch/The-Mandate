/**
 * Motion system — single source of truth for every animation in the game.
 *
 * Usage rules:
 * - CSS transitions/animations use the *_CSS string forms.
 * - Framer Motion `ease` props take the tuple forms directly; Framer
 *   `duration` is in seconds — convert with msToS(DURATION_*).
 * - Components never hardcode a bezier or a duration. If a new speed or
 *   curve is genuinely needed, it gets added here first.
 *
 * Values are formalized from the curves already proven in the UI:
 * EASE_STANDARD is the map-zoom/panel curve, EASE_DECELERATE is the
 * conversation-panel entrance curve, DURATION_SLOW matches the map zoom.
 */

type BezierTuple = readonly [number, number, number, number];

const toCss = (bezier: BezierTuple): string =>
  `cubic-bezier(${bezier.join(', ')})`;

/** Default for most UI motion: hover, color shifts, small movement. */
export const EASE_STANDARD: BezierTuple = [0.4, 0, 0.2, 1];

/** Entrances — elements arriving on screen. Fast start, long settle. */
export const EASE_DECELERATE: BezierTuple = [0.16, 1, 0.3, 1];

/** Exits — elements leaving screen. Slow start, fast finish. */
export const EASE_ACCELERATE: BezierTuple = [0.4, 0, 1, 1];

export const EASE_STANDARD_CSS = toCss(EASE_STANDARD);
export const EASE_DECELERATE_CSS = toCss(EASE_DECELERATE);
export const EASE_ACCELERATE_CSS = toCss(EASE_ACCELERATE);

/** Hover/press feedback, color and border shifts. (ms) */
export const DURATION_FAST = 150;

/** Panel reveals, progress bars, small layout moves. (ms) */
export const DURATION_NORMAL = 300;

/** Screen-level choreographed moves, e.g. the map zoom. (ms) */
export const DURATION_SLOW = 480;

/** Framer Motion durations are in seconds; CSS is in ms. Convert once, here. */
export const msToS = (ms: number): number => ms / 1000;
