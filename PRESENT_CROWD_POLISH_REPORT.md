# Present festival crowd polish — 30/09/2026

## Visual result

- Phase 4 moon approach: lifted lanterns now light the face and shoulder; three small lawn picnics and two LED balloon gatherings fill both sides without taking focus from the recipient lantern or the moon.
- Phase 4 festival reveal and Phase 5 route: the papercraft lawn groups continue toward the tower. The designed Phase 5 dark interval quiets those groups; the two playable lanterns retain priority.
- Phase 6 shared promenade: visitors occupy staggered distances from the paving instead of a straight edge row. Three picnics, two balloon holders, and warm stall floor washes give the crowd a modern park setting. The split routes and reunion composition remain intact.
- A balloon holder is painted into each reusable balloon card. Midground paper figures and distant instanced figures remain shared assets; no unique character rig was added for each visitor.

## Visual inspection

Reviewed the moon overlook, Phase 4 festival reveal, Phase 5 dark-zone and approach frames, Phase 6 quiet entry, crowded approach, elder pavilion, separation, reunion, and guarded gate. Captures are in ignored `test-artifacts/` (including `polish_modern_lookout.png`, `polish_modern_reveal.png`, `lawn_early.png`, `lawn_crowded.png`, and `final-polish-full-journey/`). The lawn details form side pools of warm light while the two principal lanterns stay readable in the central shot.

## Technical check

- `npm run build` and `git diff --check` passed. Vite retains its existing bundle-size advisory.
- A two-browser journey progressed from dedication and lantern crafting through Phase 5, the elder puzzle, separation, memory cards, reunion, the gate, Phase 7, and the host end card. The guest tab remained paused in the background; a separate foreground check confirmed its timeline advances after focus returns.
- Phase 6 object counts remained constant between low and high crowd density: 250 sprites, 6 instanced meshes, 7 lights, and 396 meshes. The density change reveals prepared groups rather than creating new character rigs. A headless Chrome sample measured similar median frame intervals (33.4 ms early, 33.2 ms crowded); this is a comparative software-rendered check, not a device FPS guarantee.
- No gameplay, network, Supabase, route, puzzle, separation, reunion, gate-state, shared renderer, or composer configuration was changed by this crowd pass.
