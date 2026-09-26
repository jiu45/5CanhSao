# Phase 6 — Festival Promenade

Phase 6 begins after both players reach the Phase 5 tower and choose **Đi sâu vào hội trăng**. The tower is the Outer Lantern Court. The route ends at a closed Inner Festival Gate; the Grand Festival Plaza is reserved for Phase 7.

## Structure

- `src/scenes/Phase6FestivalScene.ts` owns route movement, camera, lantern presentation, checkpoints, and scene hooks. It inherits the connected `RoomManager` from Phase 5 so the handoff does not reconnect the room.
- `src/scenes/Phase6Routes.ts` defines the shared, split, reunion, and final gate curves. Each route junction shares a world point.
- `src/multiplayer/Phase6State.ts` owns host-authoritative cooperative puzzle, separation, reunion, and gate state. Snapshots carry semantic state; movement packets continue to carry `routeId` and `progressT`.
- `src/props/FestivalPromenadeSet.ts` provides the pavilion, stalls, crowd tiers, scripted crossing, guardians, and closed gate. These are Phase 6 placeholders for later art direction.
- `src/ui/Phase6PuzzleOverlay.ts` presents the elder question and two memory rounds.

## Memory images

The four SVG images in `public/assets/memories/` are original sample art. To use personal images, place them in that folder and edit `public/assets/memories/manifest.json`. Keep stable, unique card IDs; each round specifies its viewer, target card ID, and four choices. Both browsers load images locally. Realtime sends only card IDs and shared round state; it does not upload images.

## Visual handoff

The current Phase 6 polish pass establishes the intended emotional route, festival lighting rhythm, human-scale crowd tiers, Moon Guardian garden, paper photo frames, and a guarded Inner Gate reveal. The gate shows only luminous haze after activation; no Phase 7 architecture is visible. The existing crowd, foliage, pavilion and secondary structures still use simple 3D forms and should be treated as interim art. A future reconstruction can follow `PRESENT_VISUAL_IDENTITY.md` without changing the tested route, puzzle, separation, reunion or gate state logic. Keep the memory-card configuration ready for real personal photos; the current SVGs are samples only.

## Hooks

Later visual and audio work can listen for `trungthu:phase6-visual` and `trungthu:phase6-audio` window events. The visual event `detail` contains a semantic `name` such as `crowdDensity`, `separation`, `remoteLanternOccluded`, `guidance`, `reunion`, or `gateReady`. The audio event names are defined in `PHASE6_AUDIO_CUES`.

## Checks

With the Vite server running, `node scripts/test_phase6_multiplayer.js` runs the two-browser mock sequence. Set `PHASE6_LIVE=1` to use the local Supabase configuration. Set `PHASE6_FROM_PHASE5=1` to include the tower handoff. `node scripts/capture_phase6_visuals.js` captures review frames in ignored `test-artifacts/`. Both tests jump to later checkpoints after checking route movement; they do not replace a human-paced playthrough.
