# Authoring: when flags apply

A choice's `flags` are recorded at `processChoice` time, but the three
transitions that follow read flags at three different moments. Write gates to
match the moment that will read them. No behavior change — this note pins the
existing engine semantics (spine proofs in `src/test/spine.test.ts`,
"flag timing (Phase B3 STEP 2)").

## The three moments

1. **Segment transitions (`nextSegment`) filter on PRE-choice flags.**
   `narrativeStore.ts:676` filters the arriving segment's nodes with the
   `activeFlags` (and game state) captured before the choice applies its own
   flags and modifiers. A node gated on the entering choice's own flag NEVER
   shows. Gate arriving segment nodes only on flags from EARLIER choices.
   Static proof: S7 scans 285 gated nodes — 0 gate on their entering choice's
   flag; D1 finds 0 suppressed clicks.

2. **`nextNodeId` targets filter on POST-choice flags.**
   `narrativeStore.ts:664` filters the swapped scene's nodes with `newFlags`
   (pre-choice flags + the choice's own flags + mole-consequence flags), in
   pre-modifier game state. The target is ABOUT the choice just made, so its
   nodes MAY gate on that choice's own flags. Example: the three
   `act2_week27_press_outcome` variant nodes each gate on their entering
   `press_followup_*` flag — under pre-choice flags none would show; each run
   shows exactly its own variant.

3. **Delay-0 chains load with THEN-current flags.**
   `narrativeStore.ts:493-497` injects delay-0 targets into the week queue
   unconditionally — trigger conditions and probability are NOT checked, and
   the target's prerequisites are NOT checked either. They are evaluated at
   load time (`loadScene`, when the queue advances to the item) against
   whatever flags are set THEN. A flag added or removed between the choice
   and the advance changes which scene (or exclusive fallback) plays.
   Example: `act3_week33_war_preparations` requires
   `tyvaren_ultimatum_rejected`; injected while it is absent, the exclusive
   `act3_week33_diplomatic_negotiation` plays instead.

## Rule of thumb

- Same-scene branch (`nextSegment`): look BACKWARD — gate on earlier choices.
- Follow-up scene (`nextNodeId`): may look AT the choice — gate on its flags.
- Chained scene (`chainTriggers`, any delay): look at LOAD time — anything
  true when the scene opens counts, including flags set after scheduling.
