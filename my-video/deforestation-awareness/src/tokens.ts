export const COLORS = {
  // Primary palette — forest editorial
  forestDeep:    '#1A3A0F',   // darkest green, main backgrounds
  forestMid:     '#2D5016',   // primary green
  forestSage:    '#4A7C2F',   // accent green
  forestLight:   '#8FAF6E',   // light sage
  forestPale:    '#C5D9A8',   // very light sage for text on dark
  cream:         '#F5F0E8',   // warm off-white body text
  creamDark:     '#E8DFD0',   // slightly darker cream for cards
  gold:          '#C9A84C',   // accent gold for stats and callouts
  goldLight:     '#E8C96E',   // lighter gold
  charcoal:      '#1C1C1C',   // near-black for dark slides
  white:         '#FFFFFF',
  danger:        '#C0392B',   // deforestation loss red
  dangerLight:   '#E74C3C',
  // Overlay tints
  darkOverlay:   'rgba(10, 20, 5, 0.75)',
  greenOverlay:  'rgba(26, 58, 15, 0.85)',
};

export const FONTS = {
  display:  '"Playfair Display", Georgia, serif',    // dramatic headlines
  heading:  '"Inter", "Helvetica Neue", sans-serif', // clean section heads
  body:     '"Inter", "Helvetica Neue", sans-serif', // body copy
  data:     '"JetBrains Mono", monospace',           // stats and data
  eyebrow:  '"Inter", sans-serif',                   // small caps labels
};

export const EASING = {
  // For useCurrentFrame interpolation
  easeOut:     [0, 0, 0.2, 1]    as [number,number,number,number],
  easeInOut:   [0.4, 0, 0.2, 1]  as [number,number,number,number],
  spring:      [0.34, 1.56, 0.64, 1] as [number,number,number,number], // slight overshoot
  cinematic:   [0.25, 0.46, 0.45, 0.94] as [number,number,number,number],
};

export const SPACING = {
  xs: 12,
  sm: 24,
  md: 48,
  lg: 80,
  xl: 120,
  xxl: 180,
};
