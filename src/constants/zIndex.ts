// Global stacking order. Every fixed-position layer mounted under App or
// GameLayout compares against every other one, so new layers pick a named
// slot here instead of a raw number.
//
//   map / HUD  <  scene  <  panel  <  overlay  <  modal  <  transition  <  system  <  debug
//
// Rule: anything the player opens on purpose (panels, overlays, modals) sits
// above a running conversation, so it is never hidden behind the scene.
export const Z = {
  // HUD
  hudButtons: 100,
  hud: 200,
  topBar: 210,
  katerinHud: 250,

  // Running conversation
  sceneBackdrop: 90,
  scene: 600,
  sceneRaised: 601,
  sceneTop: 602,

  // Player-opened layers
  panel: 700,
  overlay: 800,
  newsOverlay: 800,
  overlayRaised: 810,
  inlineCodex: 810,
  modal: 900,
  modalRaised: 910,

  // Full-screen system layers
  transition: 9999,
  system: 10050,
  debug: 100000,
} as const;
