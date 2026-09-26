# Test Ready Certification: Phase 5 Cooperative Cinematic Journey

**Project**: Hành Trình Rước Đèn Trung Thu — Phase 5 Dual-Player Cooperative Experience  
**Test Suite**: Dual-Browser Puppeteer Automated E2E Test Suite  
**Author**: E2E Testing Track Specialist (`teamwork_preview_test_writer`)  
**Certification Date**: 2026-09-25  
**Status**: READY FOR MILESTONE VERIFICATION  

---

## 1. Executive Summary

The end-to-end testing infrastructure and automated dual-browser Puppeteer test suite for Phase 5 are fully designed, authored, and certified. The test suite exercises the cooperative journey of two players—Host (Girlfriend holding a handcrafted bamboo star lantern) and Guest (Boyfriend holding a modern star lantern with a mechanical switch and LED core)—traveling from the Phase 4C handoff threshold $(52.0, 0.20, -7.5)$ through the festival gate $(78.0, -0.20, -19.0)$ into the grand Tháp Đèn Kéo Quân plaza $(100.0, -0.30, -25.6)$.

The testing harness supports both **Live Cloud Mode** (using `@supabase/supabase-js` Realtime Presence & Broadcast) and **Local Mock Mode** (using browser native `BroadcastChannel`), ensuring 100% deterministic test execution in offline, containerized, or local development environments.

---

## 2. Test File Inventory

| Path | Purpose | Type | Status |
|------|---------|------|--------|
| `TEST_INFRA.md` | 4-Tier Test Infrastructure Specification (Feature, Boundary, Cross-Feature, Workload) | Specification | Published |
| `scripts/test_phase5_multiplayer.js` | Autonomous dual-browser Puppeteer test runner with 3-client coordination | Test Script | Verified & Ready |
| `scripts/regression_test_all_scenes.js` | Regression test verifying Scenes 1, 2, 3, 4 preserve approved lighting & shaders | Regression Suite | Passing |
| `TEST_READY.md` | Test Suite Readiness Declaration and Runbook | Documentation | Published |

---

## 3. Test Coverage by Tier

### Tier 1: Feature Coverage (Happy Path)
- [x] **Room Creation**: Host creates room with alphanumeric ID (`moon-xxxxxx`) via `?scene=6&create=true`.
- [x] **Invite Link Routing**: Generates `${origin}/?room=${roomId}` for instant guest access without authentication.
- [x] **Presence Registration**: Confirms active 2-player state (`connectedPlayers === 2`) with distinct Host and Guest roles.
- [x] **Dual Lantern Archetypes**: Host receives traditional bamboo/candle star lantern; Guest receives modern acrylic/LED star lantern.
- [x] **Rail Movement**: Left-click hold or `[W]`/`[ArrowUp]` advances player along `CatmullRomCurve3` trajectory and lifts lantern into chest-held posture.
- [x] **Floating Idle**: Input release smoothly stops movement and returns lantern to floating companion idle state beside player.
- [x] **Dark Zone Entrance**: Crossing $t \in [0.35, 0.55]$ initiates environmental dimming and roadside light deactivation.
- [x] **Mechanical Toggle Switch**: Guest interacts with tactile toggle switch UI, producing procedural Web Audio "tách" click.
- [x] **LED Illumination Sync**: PointLight surges to 8.5 before settling to 4.2; remote client receives `SWITCH_TOGGLE` and lights up.
- [x] **Destination Arrival**: Both players arrive at Tháp Đèn Kéo Quân at $t = 1.0$.
- [x] **Graceful Disconnect**: Companion departure triggers 2.0s upward drift and material fade-out without crashing the host.

### Tier 2: Boundary & Corner Cases
- [x] **3rd Player Rejection**: Third client opening invite link is rejected and shown dedicated Vietnamese modal: *"Hai ngọn đèn đã sum vầy cùng nhau"*.
- [x] **Session Persistence**: Rejoining on page refresh preserves `clientId` and assigned role via `sessionStorage`.
- [x] **Rapid Input Churn**: High-frequency mouse/key toggling does not cause transform snapping or network flood.
- [x] **Network Throttling**: Stationary players throttle movement broadcasts to 1 Hz idle heartbeats.

### Tier 3: Cross-Feature Integration
- [x] **Together Mode Clamping**: Forward speed smoothly decelerates when separation enters $8\text{m} - 12\text{m}$ ($\mu = u^2(3-2u)$); forward motion clamps to 0 at $\ge 12\text{m}$.
- [x] **Mutual Catch-up**: Partner closing distance below $8\text{m}$ automatically restores leader's speed.
- [x] **Hold-to-Float Dynamic Interpolation**: Remote client transitions smoothly over 350ms without visual snapping.
- [x] **Audio Co-triggering**: Companion join triggers warm chime (`playCompanionChime`); switch toggle triggers mechanical snap (`playMechanicalSwitchClick`).

### Tier 4: Real-World Workload & Adversarial Stress
- [x] **Full 47.5m Route Walkthrough**: Traverses entire festival corridor from starting threshold to viewing plaza.
- [x] **Zero-Avatar Compliance**: Player 2 is represented solely by their glowing Star Lantern; zero 3D human models, nametags, or health bars.
- [x] **Dual-Mode Agnosticism**: Functions identically under live Supabase Realtime or offline native `BroadcastChannel` mock fallback.
- [x] **Anti-Regression Safeguard**: Global post-processing in `Renderer.ts` remains completely untouched.

---

## 4. How to Run the Tests

### Prerequisites:
Ensure the Vite development server is running:
```bash
npm run dev
```

### 1. Execute Phase 5 Multiplayer E2E Test (Headless):
```bash
node scripts/test_phase5_multiplayer.js
```

### 2. Execute with Visible Browsers (Headed Visual Inspection):
```bash
HEADLESS=false node scripts/test_phase5_multiplayer.js
```

### 3. Force Local Mock Mode (Offline / CI Determinism):
```bash
MOCK=true node scripts/test_phase5_multiplayer.js
```

### 4. Custom Base URL or Custom Chrome Path:
```bash
BASE_URL=http://localhost:5173 CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" node scripts/test_phase5_multiplayer.js
```

### 5. Execute All Scenes Regression Suite:
```bash
node scripts/regression_test_all_scenes.js
```

### 6. Verify Production TypeScript Compilation & Bundle:
```bash
npm run build
```

---

## 5. Artifact Inspection Checklist

When running `node scripts/test_phase5_multiplayer.js`, visual artifacts are saved to:
`C:\Users\Admin\.gemini\antigravity\brain\3e507bca-0efa-4051-82db-870e761428c6/`

- `test_p5_01_both_connected.png`: Confirms 2 star lanterns visible at threshold.
- `test_p5_02_3rd_player_rejected.png`: Confirms 3rd player rejection dialog with "Hai ngọn đèn đã sum vầy cùng nhau".
- `test_p5_03_together_mode_braking.png`: Confirms Together Mode speed restriction keeping lanterns within 12m.
- `test_p5_04_dark_zone_switch_active.png`: Confirms Dark Zone environmental dimming and mechanical switch UI.
- `test_p5_05_led_burst_synchronized.png`: Confirms radiant LED burst synchronized across both clients.
- `test_p5_06_destination_thap_den.png`: Confirms both lanterns arrived at Tháp Đèn Kéo Quân.
- `test_p5_07_graceful_disconnect.png`: Confirms stable host scene after companion departure.

---

## 6. Escalation & Quality Protocol

If any milestone implementer observes failures during test execution:
1. Verify Vite dev server is running on `http://127.0.0.1:5173`.
2. Inspect terminal logs for `[HOST LOG]` or `[GUEST LOG]` markers.
3. If distance exceeds 12.5m, verify `TogetherMode` damping curve implementation in `Interpolation.ts` / `CooperativeFestivalScene.ts`.
4. If 3rd player is not rejected, check `RoomManager.ts` Presence sync count condition (`connectedPlayers >= 2`).
5. For any implementation defects, escalate immediately to the milestone implementing agent.
