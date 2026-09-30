# Lantern personalization — implementation and visual review

## Scope and story identity

Only the recipient's childhood lantern can change shape. The boyfriend's lantern remains the existing traditional five-point star in Phases 5–7. The four choices are **đèn ông sao**, **đèn cá chép**, **đèn bươm bướm**, and **đèn con thỏ**. The default and fallback are the original star.

After the player touches the bamboo rods in Phase 1, a sheet with four bent-bamboo silhouettes appears over the crafting mat. The prompt asks which lantern to bend tonight. A choice places that frame at the center, then the existing paper, binding, and candle interactions continue. There is no inventory, character editor, new minigame, or decoration system.

## Architecture and assets

- `src/props/LanternIdentity.ts` owns the canonical style type, Vietnamese names, storage validation, and close threshold shot anchors.
- `src/props/LanternSilhouetteArt.ts` paints all four styles as 2.5D paper and bamboo. The same drawing is used for the choice, lantern, HUD, light projection, and final card. All artwork is procedural and original.
- `src/props/StarLantern.ts` remains the common lantern implementation. Its original star geometry and candle behavior are retained. The other styles use lightweight two-sided canvas planes with a warm internal glow, shared handle and candle, wind response, and the existing electric light transformation.
- `src/ui/LanternFrameChoice.ts` is the small illustrated choice sheet. `src/ui/CraftingUI.ts` and `src/scenes/LanternCraftingScene.ts` insert it after the bamboo action and keep the remaining crafting flow.

The carp is long and orange with layered paper scales and a tail. The butterfly has four red-pink paper wings and visible ribs. The rabbit is a side profile with bent ears, tail, and bamboo ribs, avoiding a plastic-toy character look. The star stays first and uses its original 3D frame.

## Continuity through the game

The recipient choice is stored in `sessionStorage` as `trungthu.recipientLanternStyle`. Invalid or absent values resolve to `star`. This survives scene changes and refreshes in the same browser tab. No Supabase schema or persistent account state was added.

The selected style is constructed in the threshold, village walk, festival, present arrival, cooperative walk, separation/reunion, and finale scenes. The past-to-present change preserves its paper silhouette while changing the light treatment. The Phase 1/2 and Phase 4/5 visual references were inspected for scale and readability. The close threshold shot has per-style hold scale and height metadata, so broad wings and rabbit ears remain in frame.

In Phase 5, the host is the recipient and broadcasts the validated style through the existing `PLAYER_READY` event. The guest reconstructs that lantern locally. The guest's own lantern remains `ModernStarLantern`. Phase 5 passes the style into Phase 6, where the existing `PHASE6_READY` event also carries it for reconnects. Phase 6 state saves the style locally for recovery. The route, puzzle, separation, reunion, gate, and Supabase state machines were not changed. The existing Phase 6 → 7 scene handoff retains the same lantern instances.

The ending first places two distinct silhouette light pools under the chosen lantern and the boyfriend's star. Their light then dissolves into the existing irregular shared star. The final illustrated card also shows the recipient's chosen lantern beside his star. For the default star choice, its original artwork remains.

## Performance and disposal

Each non-star lantern adds two 512 × 512 canvas textures, one 128 × 128 soft glow texture, and a few planes. The four models are not kept alive in every scene; only the selected style is built. The choice sheet paints four small previews once when opened. Replaced lanterns dispose their own geometry, material, and texture resources. The shared renderer and composer defaults were not changed.

## Verification and visual review

- Production build (`tsc && vite build`) and `git diff --check` passed.
- Phase 1 and village screenshots were captured for all four styles; the mobile choice was inspected at 390 × 844. The first bamboo action, style selection, craft completion, and transfer into the village returned the chosen style with no page errors.
- Candle checks for all four styles confirmed wind light reduction, shielding, extinguish, and relight. The shared candle system remains active.
- Carp was inspected through the threshold, village, festival, and present. Rabbit was inspected through those scenes after its side-profile art revision. Butterfly and rabbit were also inspected in the two-player scene.
- Mock two-tab pairing confirmed carp, butterfly, rabbit, and default star on the recipient host and remote guest in Phases 5–6. In every case the boyfriend's local lantern stayed `ModernStarLantern` (star shape).
- A full two-tab carp route reached Phase 7 through the elder puzzle, separation, memory cards, reunion, and Inner Gate with no browser page errors. The original star route was also rerun after the changes.
- Finale screenshots were inspected for the individual silhouette pools, shared star, and final illustrated card. The rabbit was redrawn after review because the first version felt too much like a cartoon mascot.

The visual inspection images and local browser harnesses are under `test-artifacts/lantern_styles/` and `test-artifacts/final_validation_carp/`. These generated artifacts are ignored by Git.

## Limits

- A new browser tab without the earlier session choice falls back to the traditional star; refresh in the same tab preserves the choice.
- Far-away lanterns intentionally simplify to a silhouette. Fine paper details are meant for close views.
- The optional color and handmade decoration variants suggested in the brief were left out to keep the player's single meaningful decision clear and the scene light.
