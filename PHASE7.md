# Phase 7 — Grand Festival Plaza

Phase 7 begins automatically after both lanterns activate the Inner Gate in Phase 6. It reuses the room, Three.js scene, gate, and lantern objects so the gate opens in one continuous shot. The sequence then holds on the plaza, follows the lanterns inward, narrows to their shared light and the personal wish, releases a few illustrated fireworks, rises to the real Moon, and fades to black.

The plaza is an authored modern Vietnamese Mid-Autumn papercraft vista. Layered illustrated façades, crowds, foliage, lantern canopy, and skyline create depth; the two lanterns and gate remain the close 3D elements. The final camera is scripted, with no new gameplay or Phase 7 network state.

## Add the final wish

Edit [src/content/final-wish.txt](src/content/final-wish.txt) as UTF-8 plain text, then rebuild the game. Put a blank line between paragraphs. The scene shows the two short lead-in lines first, then every paragraph in order. Long paragraphs are automatically split into shorter reading beats, and the fireworks wait until all beats finish. The current text is a replaceable draft.

Real personal photographs can be added separately through [public/assets/memories/manifest.json](public/assets/memories/manifest.json), which drives the Phase 6 Memory Cards. Phase 7 does not require photo assets.

## Review

- `npm run build`
- `node scripts/capture_phase7_reveal.js` saves the 17 visual checkpoints under `test-artifacts/phase7/`.
- `node scripts/test_phase6_multiplayer.js` checks the two-browser Phase 6 route and the Phase 7 handoff using the local mock room.
- In PowerShell, `$env:PHASE6_LIVE='1'; node scripts/test_phase6_multiplayer.js` repeats that check with Supabase. It uses the existing local anon key, without printing it.

For a direct visual preview, open `http://127.0.0.1:5173/?scene=8&mock=true&create=true`. The actual game enters Phase 7 only after both players complete the gate state in Phase 6.
