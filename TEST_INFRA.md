# Test Infrastructure Specification: Phase 5 Cooperative Cinematic Journey

**Project**: Hành Trình Rước Đèn Trung Thu — Phase 5 Dual-Player Cooperative Experience  
**Architecture Target**: Supabase Realtime (Presence & Broadcast) + Local Mock (`BroadcastChannel`) Fallback  
**Methodology**: 4-Tier Automated E2E Testing Framework (Dual-Browser Puppeteer)  
**Document Status**: ACTIVE  

---

## 1. Executive Overview & Testing Philosophy

Phase 5 introduces a synchronized, cinematic two-player journey where two players—Host (Girlfriend holding a handcrafted bamboo star lantern) and Guest (Boyfriend holding a modern star lantern with a mechanical switch and LED core)—walk together along a scenic festival curve to the giant Tháp Đèn Kéo Quân.

### Core Testing Tenets:
1. **Zero-Avatar Verification**: Strictly enforce [AGENTS.md] and Phase 5 R3: players are represented *solely* by their glowing star lanterns. No 3D human models, floating nametags, or health bars are permitted.
2. **Dual-Track Environment Agnosticism**: Tests must run with 100% determinism in both:
   - **Local Mock Mode**: Offline, zero-dependency mode using browser native `BroadcastChannel` (via `?mock=true` or automatic fallback when Supabase keys are missing).
   - **Live Cloud Mode**: Live Supabase Realtime v2 WebSockets (`@supabase/supabase-js`) when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
3. **Multi-Agent Puppeteer Choreography**: Real-time cooperation cannot be validated in a single tab. Tests run simultaneously across Browser A (Host), Browser B (Guest), and Browser C (Rejected 3rd Party).
4. **Cinematic & Architectural Anti-Regression**: Ensure shared post-processing (`Renderer.ts`) is untouched and Scenes 1–4 maintain 100% visual fidelity.

---

## 2. 4-Tier Test Infrastructure Specification

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 4: REAL-WORLD WORKLOAD & ADVERSARIAL STRESS         │
│  - Full E2E Cooperative Walkthrough (Threshold -> Gate -> Tháp)       │
│  - Dual-Mode Network (Live Supabase vs Offline BroadcastChannel Mock)  │
│  - Latency / Jitter Tolerance, Frame Delta Independence, Resource Leak │
├────────────────────────────────────────────────────────────────────────┤
│               TIER 3: CROSS-FEATURE INTEGRATION                        │
│  - Together Mode Clamping (8-12m leader deceleration, catch-up release)│
│  - Dark Zone Environmental Dimming + Remote LED Burst Synchronization  │
│  - Dynamic Interpolation: 350ms Hold/Float Blend on Remote Client      │
│  - Procedural Audio: Companion Chime + Mechanical "Tách" Switch Sound  │
├────────────────────────────────────────────────────────────────────────┤
│               TIER 2: BOUNDARY & CORNER CASES                          │
│  - 3rd Player Rejection Dialog ("Hai ngọn đèn đã sum vầy cùng nhau")   │
│  - Page Refresh Session Persistence (sessionStorage role & clientId)   │
│  - Rapid Input Churn (Mouse click spam / key toggling without desync)  │
│  - Stale & Out-of-Order Packet Rejection (Snapshot buffer seq tracking)│
│  - Malformed URL parameters (?room=, ?room=invalid-characters)         │
├────────────────────────────────────────────────────────────────────────┤
│               TIER 1: FEATURE COVERAGE (HAPPY PATH)                    │
│  - Room Creation & Invite Link Generation (?room=<id>)                 │
│  - Guest Join via Invite Link & Presence Registration (2 players)      │
│  - Dual Lantern 3D Archetypes (Traditional Bamboo vs Modern Electric)  │
│  - Left-Click Hold / [W] Movement along CatmullRomCurve3               │
│  - Floating Idle on Input Release & Graceful Disconnect Ascension Fade │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Feature Coverage (Core Functional Capabilities)

| Test ID | Feature Under Test | Expected Behavior | Verification Mechanism |
|---------|-------------------|-------------------|------------------------|
| **T1.1** | Room Creation (`?room=<id>`) | Accessing `/?scene=6&create=true` creates a room with unique alphanumeric ID (e.g., `moon-k9x2p1`), updates URL, and displays copyable invite link. | DOM query `[data-testid="room-invite-link"]` or `window.roomManager.getInviteUrl()`. |
| **T1.2** | Guest Join & Presence | Browser B opens invite URL. Supabase/Mock Presence registers 2 players: Host (`role: 'host'`) and Guest (`role: 'guest'`). | Assert `window.roomManager.connectedPlayers === 2` on both pages within 10s. |
| **T1.3** | Dual Lantern Archetypes | Host renders traditional bamboo lantern with candle flame. Guest renders modern acrylic star with battery box, mechanical toggle switch, and warm-white LED. | Inspect 3D scene: `scene.playerLantern.isModern === false` (Host) and `scene.remoteLantern.isModern === true` (Guest view). |
| **T1.4** | Rail Movement along Curve | Holding left mouse button or `[W]`/`[ArrowUp]` advances player along `CatmullRomCurve3` trajectory ($P_0 \to P_5$). `progressT` increases smoothly. | Assert `scene.progressT > 0.05` and `scene.isMoving === true` during held input. |
| **T1.5** | Floating Idle State | Releasing mouse/key halts movement (`isMoving: false`). Lantern glides from chest to lateral hovering position with gentle sinusoidal bobbing ($A=0.04\text{m}$). | Assert velocity decays to 0 and `scene.lanternHeld === false`. |
| **T1.6** | Broadcast Movement Sync | Movement packets (`progressT`, `position`, `rotation`, `isMoving`, `lanternHeld`) are broadcast at 10–15 Hz. Remote page receives and updates remote lantern. | Assert `scene.remoteLantern.position` matches broadcast coordinates within lerp tolerance. |
| **T1.7** | Dark Zone Entrance | Entering $t \in [0.35, 0.55]$ triggers environmental dimming (AmbientLight drops from 1.35 to 0.22, deep navy fog densifies). | Query `scene.isInDarkZone === true` and verify ambient light intensity. |
| **T1.8** | Electric Toggle Switch | Tactile UI switch appears in Dark Zone. Clicking switch plays procedural "tách" audio (`playMechanicalSwitchClick`) and flips mechanical switch. | Click `[data-testid="electric-toggle-switch"]`, assert switch state is ON. |
| **T1.9** | LED Burst Sync | Toggling switch surges PointLight to 8.5 intensity before settling to 4.2. Host receives `SWITCH_TOGGLE` event and sees Guest lantern illuminate. | Assert `scene.remoteLantern.isLit === true` on Host client. |
| **T1.10** | Destination Reached | Both players arrive at Tháp Đèn Kéo Quân ($t = 1.0$, coords $100.0, -0.30, -25.6$). Final festival celebration triggers. | Assert `scene.destinationReached === true` and cinematic completion banner displayed. |
| **T1.11** | Graceful Disconnect | Closing Browser B causes Host's companion lantern to drift upward ($+0.35\text{m/s}$) and fade opacity to 0 over 2.0s without crashing or throwing errors. | Close Browser B, observe Host page for 2.5s, verify 0 unhandled errors and clean removal. |

---

### Tier 2: Boundary & Corner Cases (Resilience & Edge Conditions)

| Test ID | Boundary Condition | Expected Behavior | Verification Mechanism |
|---------|-------------------|-------------------|------------------------|
| **T2.1** | 3rd Player Rejection | When 2 players are active, Browser C attempts to join via the same invite link. Server/Client rejects Player 3. Dedicated Vietnamese modal is displayed. | Query `.room-full-notice` containing verbatim text: *"Hai ngọn đèn đã sum vầy cùng nhau"*. Channel disconnects for Browser C. |
| **T2.2** | Page Refresh Rejoin | Host or Guest refreshes the page (`F5`). `sessionStorage` provides cached `clientId` and assigned `role`. The client rejoins the existing room without being rejected as a 3rd player. | Reload Browser B, wait for reconnect, verify `connectedPlayers === 2` and role remains `'guest'`. |
| **T2.3** | Rapid Input Churn (Mouse Spam) | Repeatedly clicking/releasing left-click or toggling `[W]` at 20 Hz. Animation smoothing must not snap or desync; network packets must throttle cleanly to max 15 Hz. | Synthetic rapid key events for 2.0s; assert no NaN in transforms and network packet count $\le 30$. |
| **T2.4** | Out-of-Order Packet Drop | Synthetic network injector delivers packet with `seq: 15` followed by `seq: 14`. Interpolation buffer must discard stale sequence numbers. | Check `interpolation.lastProcessedSeq` monotonically increases; discard count logged. |
| **T2.5** | Malformed URL Parameters | User opens `/?room=` (empty), `/?room=../../exploit`, or `/?room=###invalid`. System sanitizes or generates fallback valid room ID without crash. | Validate no uncaught exceptions; fallback creates valid alphanumeric room ID. |
| **T2.6** | Stationary Broadcast Throttling | When player remains stationary (`isMoving === false`, `lanternHeld === false`), broadcast frequency drops from 12 Hz to 1 Hz heartbeat. | Measure broadcast count over 3 seconds idle; assert packet count $\le 4$. |

---

### Tier 3: Cross-Feature Integration (Cooperative Mechanics)

| Test ID | Cross-Feature Interaction | Mechanics & Kinematic Invariants | Verification Mechanism |
|---------|--------------------------|----------------------------------|------------------------|
| **T3.1** | Together Mode Distance Clamping | Leader advances while partner stays at start. Arc length separation $\Delta s = (t_{\text{lead}} - t_{\text{follow}}) \cdot L_{\text{curve}}$.<br>• $\Delta s \le 8.0\text{m}$: Full speed ($\mu = 1.0$).<br>• $8.0\text{m} < \Delta s < 12.0\text{m}$: Smoothstep braking $\mu = u^2(3 - 2u)$ where $u = \frac{12 - \Delta s}{4}$.<br>• $\Delta s \ge 12.0\text{m}$: Forward speed hard-clamped to 0.0. Partner catching up restores speed. | Hold `[W]` on Host alone for 6s. Measure lantern separation: verify $\Delta s \le 12.05\text{m}$. Move Guest forward: verify Host automatically resumes motion. |
| **T3.2** | Dark Zone Entrance & Mutual Switch | Dark Zone barrier requires both players to enter ($t \ge 0.35$). Roadside bollards deactivate. Guest toggles electric switch; Host screen flashes with synchronized bloom pulse ($150\text{ms}$) and forward spotlight. | Coordinate both pages to $t=0.38$. Trigger switch on Browser B. Assert spotlight active in Browser A scene graph. |
| **T3.3** | Dynamic Interpolation & Hold-to-Float Transition | When remote player changes state (`lanternHeld: true` $\leftrightarrow$ `false`), remote lantern glides along cubic ease curve over $350\text{ms}$ between lateral hovering ($+0.75\text{m}$ offset) and chest-held ($+0.40\text{m}$ offset). | Capture remote lantern relative transform at $0\text{ms}$, $150\text{ms}$, and $400\text{ms}$. Verify monotonic smooth transition without step jumps. |
| **T3.4** | Audio-Visual Co-Triggering | Companion join triggers Web Audio pentatonic wind chime (`playCompanionChime()`). Switch toggle triggers mechanical "tách" (`playMechanicalSwitchClick()`). Neither requires external audio files. | Spy on `window.audioManager` procedural methods; assert zero 404 network requests for audio files. |

---

### Tier 4: Real-World Workload & Adversarial Stress

| Test ID | Workload / Stress Scenario | Operational Constraints | Verification Mechanism |
|---------|---------------------------|-------------------------|------------------------|
| **T4.1** | Full E2E Cooperative Walkthrough | Browser A and B travel full $47.5\text{m}$ route from Phase 4C handoff $(52.0, 0.20, -7.5)$ through Festival Gate $(78.0, -0.20, -19.0)$ into Plaza Center $(100.0, -0.30, -25.6)$. | Execute full autonomous walk script; assert milestone screenshots captured at each key checkpoint. |
| **T4.2** | Dual-Mode Protocol Fallback | Environment switch test: Run full test suite with Supabase credentials, then run again in Mock Mode (`?mock=true`). Both runs must pass 100%. | Test runner accepts `--mock` flag or detects absent credentials and exercises native `BroadcastChannel`. |
| **T4.3** | Simulated Latency & Packet Jitter | Inject $100\text{ms} \pm 40\text{ms}$ simulated artificial delay into `BroadcastChannel` messages. Interpolation buffer must absorb jitter without visual teleportation. | Inject simulated delay in Mock client; evaluate position variance metric $\sigma < 0.05\text{m}$. |
| **T4.4** | Frame Delta Independence | Run Browser A at 60 FPS and Browser B under artificial throttling (30 FPS via CPU throttle). Both lanterns must maintain synchronous travel speeds. | Assert $(|t_A - t_B| \cdot L_{\text{curve}}) < 1.5\text{m}$ under identical travel durations. |
| **T4.5** | Memory & Resource Leak Verification | Complete walkthrough and disconnect. Verify Three.js geometries, materials, and textures belonging to remote lantern and switch overlay are disposed. | Check `renderer.info.memory.geometries` and active event listener counts. |

---

## 3. Automated Test Suite Architecture (`scripts/test_phase5_multiplayer.js`)

The test suite is authored as an autonomous ES module executed via Node.js + Puppeteer:

```
scripts/
└── test_phase5_multiplayer.js
    ├── Environment Config (BASE_URL, HEADLESS, MOCK_MODE, ARTIFACT_DIR)
    ├── Browser Launcher (Chrome binary discovery, WebGL flags, audio autoplay)
    ├── Test Runner & Assertion Harness (assert, waitForState, captureMilestone)
    ├── Stage 1: Room Creation & Invite Generation (Browser A)
    ├── Stage 2: Guest Join & Presence Arbitration (Browser B)
    ├── Stage 3: 3rd Player Rejection Verification (Browser C)
    ├── Stage 4: Movement & Floating Idle Transitions (Browser A & B)
    ├── Stage 5: Together Mode Soft Distance Clamping (8-12m deceleration)
    ├── Stage 6: Dark Zone Checkpoint & Electric Switch Synchronization
    ├── Stage 7: Destination Arrival at Tháp Đèn Kéo Quân
    └── Stage 8: Companion Disconnect & Graceful Celestial Fade-out
```

### Execution Protocol:
```bash
# Run in default headless mode with automated mock fallback
node scripts/test_phase5_multiplayer.js

# Run with visible browser windows for visual inspection
HEADLESS=false node scripts/test_phase5_multiplayer.js

# Force mock mode
MOCK=true node scripts/test_phase5_multiplayer.js
```

---

## 4. Test Artifacts & Visual Inspection Matrix

| Step | Artifact Filename | Visual Inspection Criteria |
|------|-------------------|----------------------------|
| 1 | `test_p5_01_both_connected.png` | Both Host traditional star lantern and Guest modern star lantern visible at starting gate threshold. Presence shows 2 players. |
| 2 | `test_p5_02_3rd_player_rejected.png` | Modal overlay on Browser C with heading *"Hai ngọn đèn đã sum vầy cùng nhau"* and *"Tạo phòng mới"* action button. |
| 3 | `test_p5_03_together_mode_braking.png` | Host lantern halted at $\approx 10\text{m}$ ahead of Guest; Together Mode HUD alert *"Đợi bạn đồng hành cùng tiến bước nhé..."* visible. |
| 4 | `test_p5_04_dark_zone_switch_active.png` | Dark Zone environment dimming, tactile mechanical toggle switch overlay open on Guest screen. |
| 5 | `test_p5_05_led_burst_synchronized.png` | Guest star lantern glowing with radiant warm-white LED; Host client receives illumination sync and ground pool. |
| 6 | `test_p5_06_destination_thap_den.png` | Both lanterns standing at base of Tháp Đèn Kéo Quân $(100.0, -0.30, -25.6)$ with revolving shadow lantern silhouettes. |
| 7 | `test_p5_07_graceful_disconnect.png` | Host client after Browser B close; companion lantern ascending celestial path with transparency fade. Zero console errors. |

---

## 5. Pass/Fail Criteria & Acceptance Thresholds

1. **Test Suite Result**: 100% of Stages (1 through 8) must pass without assertion failures.
2. **Console Error Zero-Tolerance**: Zero unhandled exceptions (`PAGE ERROR`) or fatal Three.js / WebGL crashes across all browser instances.
3. **Together Mode Invariant**: Distance between lanterns must never exceed $12.5\text{m}$ under any single-player forward input.
4. **Anti-Regression Guarantee**: `scripts/regression_test_all_scenes.js` must continue to pass 100% on Scenes 1, 2, 3, and 4.
5. **Build Integrity**: `npm run build` (`tsc && vite build`) must succeed with 0 errors.
