# Present timeline visual retrofit — Phase 4–6

## Result

The present timeline now uses a shared **modern illuminated papercraft diorama** vocabulary. Layered illustrated people, foliage, façades, stalls and hanging lanterns surround the existing hero objects. The Moon sculpture, Tháp Đèn Kéo Quân, playable star lanterns, authored routes and cameras remain the focal points. Phase 7 source and global renderer/composer defaults were not changed.

This pass followed `PRESENT_VISUAL_IDENTITY.md` and `PRESENT_TIMELINE_VISUAL_AUDIT.md`. It changes the stage and presentation; it does not change Supabase, Presence/Broadcast, route synchronization, Dark Zone mechanics, puzzle rules, separation, reunion or gate state.

## Reusable art kits

| Kit | Use |
| --- | --- |
| `PresentCrowdKit` | Limited readable nearby groups; reusable illustrated parent/child and lantern silhouettes in the middle distance; instanced simplified figures far away; a temporary crossing sheet during separation. |
| `PapercraftFoliageKit` | Multi-layer canopy cards and illustrated bamboo sheets while keeping lit trunks in the foreground. |
| `MarketStallKit` | Shallow fabric stalls with Vietnamese Mid-Autumn signs and warm paper lanterns. |
| `IllustratedFacadeKit` | Dark civic façade layers with lit windows and varied rooflines. |
| `FestivalLanternDecorKit` | Small star, carp and paper lantern cards for suspended strings. |
| `CeremonialCharacterKit` | Designed paper silhouettes for the Elder and Moon Guardian. |

The six kits are in `src/props/papercraft/`. Their textures and materials are reused per scene instance and disposed with that scene. Decorative glow is mainly emissive art; it does not add a light for every visitor or bulb.

## Scene changes and visual judgment

| Scene | Changes | Inspection |
| --- | --- | --- |
| Phase 4 Moon park | Layered canopy trees and illustrated visitors with handheld lights replace the generic tree/people language around the Moon hero. | The Moon composition and illuminated path still lead the eye. |
| Phase 4 distant festival and approach | Roofline façades, festival stalls and people add depth beneath the existing light strings; camera pivot and tower reveal stay intact. | The tower remains the distant focal point, with warmer middle distance and dark foreground framing. |
| Phase 5 shared walk and Dark Zone | The shared kits continue through the approach, and bamboo cards provide silhouette in the darker passage. | Two lanterns remain the principal characters. |
| Phase 5 outer lantern court | The plaza surface is now dark stone rather than a flat orange field; a few illustrated festivalgoers give the tower human scale. | The tower remains full 3D and the court stays spacious. |
| Phase 6 promenade | Capsule-like placeholders gave way to tiered illustrated crowd, hanging star/carp lights, layered trees, façades, Vietnamese stalls and a cooler paved street. | Reads as an inhabited electric festival street with foreground, middle ground and background. |
| Phase 6 Elder | Paper silhouette and shallow pavilion eaves create a warmer, quieter stop. | Elder and tea setting remain visible behind the puzzle UI. |
| Phase 6 separation | Scripted crossing silhouettes and lanterns briefly fill the foreground, obscuring the companion without moving either player's route. | The visual peak is deliberately dense, then gives way to quieter branches. |
| Phase 6 Moon Alcove | Illustrated Guardian, layered bamboo/tree frame, warm lanterns and small floating paper card backs replace the earlier generic figure and foliage. | Personal photos remain in the existing data-driven memory deck and now sit in restrained Polaroid-style cards. |
| Phase 6 reunion and Inner Gate | Cleaner symmetrical paved approach, two star lanterns, sparse trees and a gentle gated light veil. | The gate appears only on the appropriate routes; beyond it remains unreadable luminous haze. Phase 7 architecture is not shown. |

## Visual evidence

Phase 6 has local **before/after** captures from the same screenshot tool:

| Moment | Before | After |
| --- | --- | --- |
| Promenade | [before](test-artifacts/baseline/phase6_promenade.png) | [after](test-artifacts/phase6_promenade.png) |
| Elder | [before](test-artifacts/baseline/phase6_elder.png) | [after](test-artifacts/phase6_elder.png) |
| Crossing crowd | [before](test-artifacts/baseline/phase6_crowd_crossing.png) | [after](test-artifacts/phase6_crowd_crossing.png) |
| Memory choice | [before](test-artifacts/baseline/phase6_memory_choices.png) | [after](test-artifacts/phase6_memory_choices.png) |
| Reunion | [before](test-artifacts/baseline/phase6_reunion.png) | [after](test-artifacts/phase6_reunion.png) |
| Gate | [before](test-artifacts/baseline/phase6_gate_ready.png) | [after](test-artifacts/phase6_gate_ready.png) |

Final Phase 4 captures: [Moon park](test-artifacts/p4_shot03_elevated_park_viewpoint.png), [distant festival](test-artifacts/p4_shot04_first_distant_festival_reveal.png), [approach](test-artifacts/p4_shot06_phase4c_final_position.png).

Final Phase 5 captures: [Dark Zone](test-artifacts/phase5_dark_before_switch.png), [electric light](test-artifacts/phase5_dark_after_switch.png), [outer lantern court](test-artifacts/phase5_final_vista.png).

Final Phase 6 captures also include [lonely branch](test-artifacts/phase6_separated.png), [Moon Alcove](test-artifacts/phase6_memory.png), and [rejoin route](test-artifacts/phase6_host_rejoin.png). Phase 4/5 had no saved matching baseline capture in the workspace; the audit and original screenshots were used for comparison.

## Build, interaction and performance checks

- `npm run build`: passed after the final visual changes. Vite still warns about the existing single JavaScript chunk over 500 kB; final bundle is about 1.235 MB (319 kB gzip).
- `node scripts/regression_test_all_scenes.js`: Phase 1–3 and festival spectator scene captured successfully, with no page errors reported by the test.
- `node scripts/measure_modern_handoff.js`: Phase 3 → Phase 4 transition completed without page errors. Headless Chrome had large intermittent frame stalls, so its timings are **not** a trustworthy device FPS measurement.
- `node scripts/test_phase5_multiplayer.js --two-player`: two real Supabase browser clients passed invitation/Presence, movement, Dark Zone, LED sync, refresh/rejoin, tower arrival and disconnect checks. The optional third-player boundary test was not included in this run.
- `node scripts/test_phase6_multiplayer.js`: two mock BroadcastChannel browsers passed split routes, memory puzzle, reunion, gate activation and Phase 7 handoff, including final wish/audio checks and no runtime errors.
- Phase 7 [full reveal screenshot](test-artifacts/phase7/05_full_reveal.png): visually intact; Phase 7 source was not edited.
- Phase 6 scene inspection reported roughly 43–72 resident textures across the sampled stages. These counts are not a before/after GPU benchmark. The crowd remains limited to nearby hero figures, reusable middle-distance cards and instanced far silhouettes; there is no per-NPC dynamic light.

## Deferred or limited

- A continuous live two-device playthrough from Phase 1 to the final fade was not run. The progression was covered by scene regression, the Phase 3 → 4 handoff, the live Phase 5 two-client test and the Phase 6 → 7 two-client test in segments.
- Headless software/WebGL frame timings were noisy and cannot establish real-device FPS. A device check remains useful before replacing the deployed build.
- Phase 4 and Phase 5 do not have saved identical-camera baseline captures; Phase 6 does.

## Git recovery point

The working Phase 1–7 build was committed before this pass as `566dc6b`, tagged locally `pre-present-retrofit-2026-09-26`. This report and retrofit live on `codex/present-visual-retrofit`. These local Git points are independent of Cloudflare deployment history and have not been pushed or deployed by this pass.
