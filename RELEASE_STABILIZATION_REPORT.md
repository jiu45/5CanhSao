# Release Stabilization Report

## 1. Baseline

**PASS** — Initial `npm run build` completed with zero TypeScript errors. It produced 1,217.67 kB JavaScript (312.40 kB gzip) and 5.24 kB CSS (1.86 kB gzip). Vite warned that the JavaScript chunk exceeds 500 kB. The Vite development server returned HTTP 200. The working tree already contained uncommitted Phase 5–7 work; this pass did not reset it.

## 2. QA Issues Addressed

| Issue | Status | Change |
| --- | --- | --- |
| R1 ModernArrival first frame | **PASS** for normal Phase 3C→4 handoff | Reused one prepared scene and warmed shader/material batches beneath the existing white moon transition. Reduced redundant dynamic PointLights while retaining emissive festival art. |
| R2 scene resource retention | **PASS** in continuous scene lifecycle check | Added owned-scene geometry, material, texture, and shadow-target disposal for retired scenes 0–6. Phase 6→7 transferred world and lanterns are excluded. |
| R3 curtain layering | **PASS** | ModernArrival transition veil now has z-index 25, below the cinematic action layer (30) and above the canvas. |
| Final wish loading | **PASS** | One UTF-8 `.txt` file is bundled at build time; no Phase 7 runtime fetch or mid-cinematic text change. |
| Final terminal state | **PASS** | Final fade stops ambient intervals and ends the game RAF/render loop. |

## 3. ModernArrival Hitch — Before / After

The pre-final QA measured approximately **5.8 s** on the Phase 4 first frame. A separate cold direct `?scene=5` Chrome headless measurement in this pass measured **14.6 s**; direct scene loading bypasses the intended transition. After the fix, the normal Phase 3C→4 handoff measured **34–50 ms** for the first ModernArrival RAF callback in two runs, with no frame above 50 ms in one run and two approximately 50 ms frames in the other. The scene switch itself measured **11–18 ms**. These before/after figures use different entry paths and should not be treated as an exact benchmark ratio. Preparation during the pre-existing white veil produced an approximately **559 ms** ascent callback in the measured run. No new loading screen was added.

The optimized Phase 4 moon and approach screenshots were visually inspected against the approved earlier captures. The first reveal composition, light strings, moon, path and lantern edges remained intact.
The Phase 3 lion POV and spectator return were rerun and visually inspected after resource cleanup; both transitions completed without browser errors.

## 4. Resource Lifecycle — Before / After

The earlier QA recorded geometry rising to **898** and remaining around **744** after Phase 5 entry. A new same-tab scene lifecycle run after cleanup recorded geometry checkpoints for scene IDs 0–6 of **4 → 39 → 100 → 200 → 64 → 55 → 172** with no browser exceptions. The harness advances each scene after a short render, so these numbers are not directly comparable with all artwork visited in the original QA. They demonstrate that obsolete scene resources are released rather than monotonically accumulated. Renderer textures were **15 → 22 → 35 → 45 → 46 → 44 → 54**; active scene and composer resources remain resident. Transferred Phase 6 resources stay alive through Phase 7 by design.

## 5. Phase 7 Verification

**PASS** — Visual captures were inspected at the gate opening, plaza reveal, two lanterns, personal wish, celebration, moon ascent, and fade. The normal Phase 6→7 handoff preserved the room, lantern UUID, and Three.js world. The first eight measured Phase 7 render calls on the host were **73.8, 36.4, 18.2, 16.1, 28.3, 37.9, 31.1, 21.7 ms** in Chrome headless. A separate cold direct `?scene=8` load had an approximately **12 s** first frame in software rendering, so direct scene loading is unsuitable as a normal user path; the real gate handoff did not show that render stall. A scripted direct-scene profile also showed a **1.1 s** render on an artificial time jump straight to the full plaza, which does not model the gradual authored reveal.

**PASS** — Both clients loaded identical Vietnamese message beats. Celebration stayed hidden before the wish; after the final fade, both reached a black terminal state with no active Three.js scene rendering. **PARTIAL** — Phase 7 refresh loads and renders the wish again, but precise cinematic beat recovery is unsupported. The visible sequence restarts.

## 6. Multiplayer Phase 5 → 7 Verification

**PASS** — Two-browser mock and live Supabase runs completed Phase 5 movement and switch transfer, Dark Zone handoff, Phase 6 elder disagreement/retry, split routes, memory puzzle, guest refresh/reconnect, reunion, guarded gate, and Phase 7 terminal state. The host-first and guest-first gate arrival orders were both checked in mock runs. Only one ready player did not open the gate. Live Supabase was tested outside the network sandbox using the existing local public anon key; the key was not printed. A single host tab also ran continuously from opening through Phase 7 without a reload, with accelerated authored sections; the guest joined at Phase 5. Browser runtime errors: none.

## 7. Audio Verification

**PASS** — At the terminal state, the modern drum and festival vista ambience intervals were null, and the four Phase 7 story cue IDs had each fired once. **PARTIAL** — Automated headless testing did not provide a reliable listening assessment of the mix or device speaker output; listen on the deployment URL before sharing.

## 8. Production Build Result

**PASS** — Final `npm run build`: TypeScript zero errors, Vite build successful, JavaScript **1,219.85 kB raw / 313.34 kB gzip**, CSS **5.24 kB / 1.86 kB gzip**. The sole build warning is the existing >500 kB chunk warning. `vite preview` returned HTTP 200 for `/` and `/assets/memories/manifest.json`. The production browser smoke verified the opening, Phase 7, UTF-8 wish, terminal fade, and Phase 7 refresh with no page errors.

## 9. Cloudflare Readiness

**PASS for configuration and local production smoke.** Pages settings are `npm run build` and `dist`; required public build variables are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The older anon-key fallback is retained for local testing. Invite links use `window.location.origin` and the current pathname. Production code has no hardcoded localhost, Windows path, or service-role key. Memory manifest paths match the on-disk filenames. The app uses `/` with query parameters, so no SPA path rewrite is required. See [DEPLOYMENT.md](DEPLOYMENT.md).

## 10. Deferred Low-Risk Issues

- `THREE.Clock` deprecation and the removed `PCFSoftShadowMap` warning remain. Shared renderer defaults were not changed under `AGENTS.md`; their migration needs a separate visual/timing regression check.
- The Vite chunk warning remains. The production bundle is approximately 313 kB gzip; no speculative scene import rewrite was introduced near release.
- The Phase 4–6 visual identity retrofit remains separate from stabilization.

## 11. Remaining Blockers

**No verified code blocker in local and live Supabase tests.** Actual Cloudflare Pages deployment and two physical device verification have not been performed here. A real device audio/visual acceptance pass is still recommended before sending the link. Phase 7 refresh restarts its cinematic instead of restoring an exact beat.

## 12. Recommended Next Step

Deploy the tested build using [DEPLOYMENT.md](DEPLOYMENT.md), then run a two device check on the HTTPS Pages URL, including invite, wish, audio, and terminal fade. After that acceptance pass, proceed with the separately planned Phase 4–6 art redesign.
