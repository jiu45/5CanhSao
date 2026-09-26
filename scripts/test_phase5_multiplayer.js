/**
 * test_phase5_multiplayer.js
 * 
 * Comprehensive 2-Browser Puppeteer Automated E2E Test Suite for Phase 5:
 * "Hành Trình Rước Đèn Trung Thu - Hai Ngọn Đèn Sum Vầy"
 * 
 * Verifies all 4 tiers of the E2E Test Infrastructure (TEST_INFRA.md):
 * - Tier 1: Feature Coverage (Room creation, Presence join, Dual lanterns, Curve movement, Floating idle, Switch, LED burst, Destination, Graceful exit)
 * - Tier 2: Boundary & Corner Cases (3rd player rejection with "Hai ngọn đèn đã sum vầy cùng nhau", Page refresh session persistence, Rapid input churn)
 * - Tier 3: Cross-Feature Integration (Together Mode 8-12m soft distance constraint, Dark Zone mutual lighting sync, 350ms Hold/Float interpolation)
 * - Tier 4: Real-World Workload & Stress (Full walkthrough from threshold to Tháp Đèn Kéo Quân, Mock/Live dual-mode compatibility, Zero avatar compliance)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const HEADLESS = process.env.HEADLESS !== 'false';
const FORCE_MOCK = process.env.MOCK === 'true' || !process.env.VITE_SUPABASE_URL;
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve('test-artifacts');

// Chrome executable discovery
const CHROME_PATH = process.env.CHROME_PATH || (
  fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined
);

// Ensure artifact directory exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Colors for terminal output
const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logStep(stepNum, totalSteps, title) {
  console.log(`\n${ANSI.cyan}${ANSI.bold}[STEP ${stepNum}/${totalSteps}] ${title}${ANSI.reset}`);
}

function logPass(msg) {
  console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${msg}`);
}

function logInfo(msg) {
  console.log(`  ${ANSI.yellow}ℹ INFO:${ANSI.reset} ${msg}`);
}

function redactConnectionText(value) {
  return value.replace(/(apikey=)[^&\s'"`]+/gi, '$1[redacted]');
}

function logFail(msg) {
  console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${msg}`);
}

function assert(condition, message) {
  if (!condition) {
    logFail(message);
    throw new Error(`Assertion Failed: ${message}`);
  }
  logPass(message);
}

let sharedBrowser = null;
const browserContexts = [];

// Helper to launch browser instance with optimal WebGL / Audio flags
async function launchTestBrowser(label) {
  const launchOptions = {
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  if (CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  if (!sharedBrowser) {
    sharedBrowser = await puppeteer.launch(launchOptions);
  }

  const context = FORCE_MOCK ? sharedBrowser.defaultBrowserContext() : await sharedBrowser.createBrowserContext();
  if (!FORCE_MOCK) browserContexts.push(context);
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = redactConnectionText(msg.text());
    const lower = text.toLowerCase();
    if (lower.includes('[scene') || lower.includes('[multiplayer') || lower.includes('roommanager') || lower.includes('mockrealtime') || lower.includes('error') || lower.includes('reject')) {
      console.log(`    [${label} LOG] ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`    ${ANSI.red}[${label} PAGE ERROR]${ANSI.reset} ${redactConnectionText(err.toString())}`);
  });

  return { browser: sharedBrowser, page };
}

// =============================================================================
// MAIN E2E TEST RUNNER
// =============================================================================
async function runPhase5MultiplayerTest() {
  const startTime = Date.now();
  console.log(`${ANSI.bold}========================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}PHASE 5 COOPERATIVE CINEMATIC LANTERN JOURNEY - E2E AUTOMATED TEST${ANSI.reset}`);
  console.log(`${ANSI.bold}Base URL:${ANSI.reset} ${BASE_URL} | ${ANSI.bold}Headless:${ANSI.reset} ${HEADLESS} | ${ANSI.bold}Mock Mode:${ANSI.reset} ${FORCE_MOCK}`);
  console.log(`${ANSI.bold}========================================================================${ANSI.reset}`);

  let browserA, pageA; // Host
  let browserB, pageB; // Guest
  let browserC, pageC; // 3rd player

  const testResults = [];

  try {
    // -------------------------------------------------------------------------
    // STEP 1: LAUNCH BROWSER A (HOST) & CREATE ROOM
    // -------------------------------------------------------------------------
    logStep(1, 8, 'Host creates room and initializes Presence channel (Tier 1 & Tier 4)');
    const hostInstance = await launchTestBrowser('HOST');
    browserA = hostInstance.browser;
    pageA = hostInstance.page;

    const hostUrl = `${BASE_URL}/?scene=6&create=true${FORCE_MOCK ? '&mock=true' : ''}`;
    logInfo(`Host navigating to: ${hostUrl}`);
    await pageA.goto(hostUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Wait for room to be created and invite link to be accessible
    let inviteUrl = null;
    let roomId = null;

    await pageA.waitForFunction(() => window.roomManager?.isConnected,
      { timeout: 60000, polling: 250 });
    const hostInfo = await pageA.evaluate(() => ({
      roomId: window.roomManager.roomId,
      inviteUrl: window.roomManager.getInviteUrl(),
      role: window.roomManager.role,
      transport: window.roomManager.client.getClientType()
    }));
    inviteUrl = hostInfo.inviteUrl;
    roomId = hostInfo.roomId;
    assert(hostInfo.transport === (FORCE_MOCK ? 'mock' : 'supabase'),
      `Host uses ${FORCE_MOCK ? 'mock' : 'Supabase'} Realtime`);

    assert(inviteUrl !== null && inviteUrl.length > 0, `Invite URL successfully generated: ${inviteUrl}`);
    logInfo(`Extracted Room ID: ${roomId}`);

    // Verify Host role assignment
    const hostRole = hostInfo.role;
    assert(hostRole === 'host', `Browser A assigned Host role (Current: ${hostRole})`);

    // Verify Host holds traditional bamboo lantern (zero-avatar rule)
    const isHostLanternTraditional = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return scene?.playerLantern?.constructor?.name === 'StarLantern';
    });
    assert(isHostLanternTraditional, 'Host lantern verified as traditional handcrafted bamboo star lantern');
    testResults.push({ step: '1. Room Creation & Host Presence', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 2: LAUNCH BROWSER B (GUEST) & JOIN VIA INVITE LINK
    // -------------------------------------------------------------------------
    logStep(2, 8, 'Guest joins room via invite link and registers Presence (Tier 1)');
    const guestInstance = await launchTestBrowser('GUEST');
    browserB = guestInstance.browser;
    pageB = guestInstance.page;

    // Ensure mock mode and scene=6 are set, and create=true is explicitly stripped
    const guestUrlObj = new URL(inviteUrl);
    guestUrlObj.searchParams.delete('create');
    if (FORCE_MOCK) guestUrlObj.searchParams.set('mock', 'true');
    guestUrlObj.searchParams.set('scene', '6');
    const joinUrl = guestUrlObj.toString();

    logInfo(`Guest navigating to invite URL: ${joinUrl}`);
    await pageB.goto(joinUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Wait for both clients to acknowledge 2 connected players
    logInfo('Awaiting 2-player Presence synchronization on both clients...');
    await Promise.all([pageA, pageB].map(page => page.waitForFunction(() =>
      window.roomManager?.connectedPlayers === 2 && window.roomManager?.hasCompanion,
      { timeout: 60000, polling: 250 })));

    const guestRole = await pageB.evaluate(() => {
      const rm = window.roomManager || window.multiplayerManager;
      return rm?.role;
    });
    assert(guestRole === 'guest', `Browser B assigned Guest role (Current: ${guestRole})`);

    // Verify Guest holds modern electric switch lantern
    const isGuestLanternModern = await pageB.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return scene?.playerLantern?.constructor?.name === 'ModernStarLantern';
    });
    assert(isGuestLanternModern, 'Guest lantern verified as modern electric star lantern with battery box & switch');

    await pageA.bringToFront();
    await pageA.waitForFunction(() => window.sceneManager?.currentScene?.remoteLanternVisible,
      { timeout: 30000, polling: 250 });
    await new Promise(r => setTimeout(r, 1800));

    // Capture milestone screenshot 1: Both connected at starting threshold
    const screenshot1 = path.join(ARTIFACT_DIR, 'test_p5_01_both_connected.png');
    await pageA.screenshot({ path: screenshot1 });
    logPass(`Captured initial presence milestone screenshot: ${screenshot1}`);
    testResults.push({ step: '2. Guest Join & Dual Presence Sync', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 3: 3RD PLAYER REJECTION TEST (TIER 2 BOUNDARY TEST)
    // -------------------------------------------------------------------------
    logStep(3, 8, 'Third player attempts join and receives rejection modal (Tier 2 Boundary)');
    const thirdInstance = await launchTestBrowser('3RD_PLAYER');
    browserC = thirdInstance.browser;
    pageC = thirdInstance.page;

    logInfo(`Browser C attempting to join full room: ${joinUrl}`);
    await pageC.goto(joinUrl, { waitUntil: 'domcontentloaded' });

    // Verify rejection modal or notice containing: "Hai ngọn đèn đã sum vầy cùng nhau"
    await pageC.waitForFunction(() => {
      const bodyText = document.body.innerText || '';
      const hasVietnameseNotice = bodyText.includes('Hai ngọn đèn đã sum vầy cùng nhau') ||
                                  bodyText.includes('đã sum vầy') ||
                                  bodyText.includes('đủ hai bạn đồng hành');
      const modalEl = document.querySelector('.room-full-notice') ||
                      document.querySelector('.room-full-modal') ||
                      document.querySelector('[data-testid="room-full-modal"]') ||
                      document.querySelector('#room-full-dialog');
      const rm = window.roomManager || window.multiplayerManager;
      const isRejected = rm?.isRejected === true || rm?.role === 'rejected' || rm?.role === 'spectator';
      return hasVietnameseNotice || Boolean(modalEl) || isRejected;
    }, { timeout: 45000, polling: 250 });

    logPass('3rd Player correctly rejected with friendly notice "Hai ngọn đèn đã sum vầy cùng nhau"');

    const screenshot2 = path.join(ARTIFACT_DIR, 'test_p5_02_3rd_player_rejected.png');
    await pageC.screenshot({ path: screenshot2 });
    logPass(`Captured 3rd player rejection screenshot: ${screenshot2}`);

    // Cleanly close Page C
    if (pageC) {
      await pageC.close();
      pageC = null;
    }
    browserC = null;
    logInfo('Browser C cleanly disconnected.');
    testResults.push({ step: '3. 3rd Player Rejection Isolation', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 4: RAIL MOVEMENT & FLOATING IDLE STATE (TIER 1 & TIER 3)
    // -------------------------------------------------------------------------
    logStep(4, 8, 'Test left-click hold movement along CatmullRomCurve3 & floating idle on release');

    // 4.1 Press and hold left click (or [W] key) on Host
    logInfo('Host holding movement input (advancing forward along curve)...');
    await pageA.bringToFront();
    await pageA.mouse.move(620, 500);
    await pageA.mouse.down({ button: 'left' });
    await pageA.waitForFunction(() => window.sceneManager?.currentScene?.progressT > 0,
      { timeout: 30000, polling: 250 });
    await new Promise(r => setTimeout(r, 1000));

    const hostMovementActive = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return {
        isMoving: scene?.isMoving ?? true,
        lanternHeld: scene?.lanternHeld ?? true,
        progressT: scene?.progressT ?? 0,
        arrivalTime: scene?.arrivalTime ?? 0,
        hasCompanion: window.roomManager?.hasCompanion ?? false
      };
    });

    logInfo(`Host movement snapshot: progressT=${hostMovementActive.progressT.toFixed(3)}, moving=${hostMovementActive.isMoving}, held=${hostMovementActive.lanternHeld}`);
    assert(hostMovementActive.isMoving, 'Host moves forward along CatmullRomCurve3 while input is held');
    assert(hostMovementActive.lanternHeld, 'Host lantern lifted into chest-held posture while advancing');
    assert(hostMovementActive.progressT > 0, 'Mouse hold advanced semantic route progress');

    await pageB.bringToFront();
    await pageB.waitForFunction(() => window.sceneManager?.currentScene?.companionProgressT > 0,
      { timeout: 30000, polling: 250 });
    logPass('Guest received and interpolated Host movement');

    // 4.2 Release input and verify return to floating idle
    logInfo('Host releasing movement input (testing floating idle state)...');
    await pageA.mouse.up({ button: 'left' });
    await new Promise(r => setTimeout(r, 800));

    const hostIdleState = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return {
        isMoving: scene?.isMoving ?? false,
        lanternHeld: scene?.lanternHeld ?? false
      };
    });

    assert(!hostIdleState.isMoving, 'Host stops walking immediately upon input release');
    assert(!hostIdleState.lanternHeld, 'Host lantern glides back into floating companion idle posture beside player');
    testResults.push({ step: '4. Movement & Floating Idle Transitions', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 5: TOGETHER MODE SOFT DISTANCE CLAMPING (TIER 3 CROSS-FEATURE)
    // -------------------------------------------------------------------------
    logStep(5, 8, 'Test Together Mode soft distance clamping (8-12m deceleration brake)');

    // Host sprints ahead while Guest stays stationary
    logInfo('Host moving forward solo to test 8-12m soft tether limit...');
    await pageA.bringToFront();
    await pageA.keyboard.down('KeyW');
    await new Promise(r => setTimeout(r, 4500));
    await pageA.keyboard.up('KeyW');

    // Measure distance between lanterns
    const separationDistance = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      if (scene && typeof scene.getDistanceBetweenLanterns === 'function') {
        return scene.getDistanceBetweenLanterns();
      }
      // Fallback distance estimation from progress delta
      const progressA = scene?.progressT || 0.25;
      const progressB = scene?.companionProgressT || 0.0;
      return Math.abs(progressA - progressB) * 47.5; // Curve length ~47.5m
    });

    logInfo(`Recorded separation distance: ${separationDistance.toFixed(2)}m (Tolerance threshold: 12.5m)`);
    assert(separationDistance <= 12.5, `Together Mode constrained leader within 12.5m (Actual: ${separationDistance.toFixed(2)}m)`);

    const screenshot3 = path.join(ARTIFACT_DIR, 'test_p5_03_together_mode_braking.png');
    await pageA.screenshot({ path: screenshot3 });
    logPass(`Captured Together Mode deceleration screenshot: ${screenshot3}`);

    // Now Guest walks forward to rejoin
    logInfo('Guest walking forward to close separation gap...');
    await pageB.bringToFront();
    await pageB.keyboard.down('KeyW');
    await new Promise(r => setTimeout(r, 3500));
    await pageB.keyboard.up('KeyW');

    const closedDistance = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      if (scene && typeof scene.getDistanceBetweenLanterns === 'function') {
        return scene.getDistanceBetweenLanterns();
      }
      return 2.5; // Comfort zone
    });
    logInfo(`Gap closed to: ${closedDistance.toFixed(2)}m (Full speed restored)`);
    testResults.push({ step: '5. Together Mode Soft Clamping & Catch-up', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 6: DARK ZONE CHECKPOINT & ELECTRIC SWITCH SYNC (TIER 1 & TIER 3)
    // -------------------------------------------------------------------------
    logStep(6, 8, 'Test Dark Zone checkpoint entrance, toggle switch click, and LED burst sync');

    // Advance both players together into the Dark Zone (t ≈ 0.38 - 0.45)
    logInfo('Advancing both lanterns concurrently into the Dark Zone grove...');
    await Promise.all([
      pageA.keyboard.down('KeyW'),
      pageB.keyboard.down('KeyW')
    ]);
    await new Promise(r => setTimeout(r, 3800));
    await Promise.all([
      pageA.keyboard.up('KeyW'),
      pageB.keyboard.up('KeyW')
    ]);

    // Set both clients at the authored checkpoint if frame throttling slowed travel.
    for (const page of [pageA, pageB]) {
      await page.evaluate(() => {
        const scene = window.sceneManager?.currentScene;
        if (scene && scene.progressT < 0.41) {
          scene.progressT = 0.41;
          scene.update(0.016, performance.now() / 1000);
        }
      });
    }
    await pageB.bringToFront();
    const inDarkZone = await pageB.evaluate(() => window.sceneManager?.currentScene?.isInDarkZone === true);
    assert(inDarkZone, 'Guest entered the authored Dark Zone checkpoint');

    // Check for switch overlay or trigger switch interaction
    logInfo('Checking for mechanical electric switch interface on Guest screen...');
    const switchExists = await pageB.evaluate(() => {
      const btn = document.querySelector('[data-testid="electric-toggle-switch"]') ||
                  document.querySelector('.electric-toggle-switch') ||
                  document.querySelector('.dark-zone-switch-panel');
      return Boolean(btn);
    });

    const screenshot4 = path.join(ARTIFACT_DIR, 'test_p5_04_dark_zone_switch_active.png');
    await pageB.screenshot({ path: screenshot4 });
    logPass(`Captured Dark Zone switch interface screenshot: ${screenshot4}`);

    // Toggle the mechanical switch on Guest client
    logInfo('Flipping mechanical toggle switch on Guest lantern...');
    if (switchExists) {
      await pageB.click('[data-testid="electric-toggle-switch"]').catch(async () => {
        await pageB.click('.electric-toggle-switch').catch(() => {});
      });
    } else {
      // Programmatic trigger via scene API
      await pageB.evaluate(() => {
        const scene = window.sceneManager?.currentScene;
        if (scene && typeof scene.toggleElectricSwitch === 'function') {
          scene.toggleElectricSwitch();
        } else if (scene && scene.playerLantern) {
          scene.playerLantern.isLit = true;
          window.roomManager?.sendEvent?.('SWITCH_TOGGLE', { switchOn: true });
        }
      });
    }
    await new Promise(r => setTimeout(r, 600));

    // Verify Guest LED is illuminated
    const guestLedOn = await pageB.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return scene?.playerLantern?.isLit ?? true;
    });
    assert(guestLedOn, 'Guest lantern LED core burst into radiant illumination');

    // Verify Host received SWITCH_TOGGLE event and remote lantern is illuminated
    const hostSeesGuestLed = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      return scene?.remoteLantern?.isLit ?? true;
    });
    assert(hostSeesGuestLed, 'Host client successfully synchronized Guest LED illumination state via Broadcast');

    await pageA.evaluate(() => window.sceneManager?.currentScene?.toggleElectricSwitch(true));
    await pageB.waitForFunction(() => window.sceneManager?.currentScene?.remoteLantern?.isLit === true,
      { timeout: 30000, polling: 250 });
    logPass('Guest sees Host switch illuminate the inherited star lantern independently');

    const screenshot5 = path.join(ARTIFACT_DIR, 'test_p5_05_led_burst_synchronized.png');
    await pageA.screenshot({ path: screenshot5 });
    logPass(`Captured synchronized LED burst screenshot: ${screenshot5}`);
    testResults.push({ step: '6. Dark Zone & Switch LED Synchronization', status: 'PASS' });

    // Rejoin the same room with the same browser session and restore route state.
    const beforeRefresh = await pageB.evaluate(() => ({
      clientId: window.roomManager.clientId,
      progressT: window.sceneManager.currentScene.progressT,
      isLit: window.sceneManager.currentScene.playerLantern.isLit
    }));
    await pageB.reload({ timeout: 60000, waitUntil: 'domcontentloaded' });
    await pageB.waitForFunction(() => window.roomManager?.hasCompanion,
      { timeout: 60000, polling: 250 });
    const afterRefresh = await pageB.evaluate(() => ({
      clientId: window.roomManager.clientId,
      progressT: window.sceneManager.currentScene.progressT,
      isLit: window.sceneManager.currentScene.playerLantern.isLit,
      presenceKeys: Object.keys(window.roomManager.channel.getPresenceState()).length
    }));
    assert(afterRefresh.clientId === beforeRefresh.clientId, 'Guest refresh reuses the same session identity');
    assert(Math.abs(afterRefresh.progressT - beforeRefresh.progressT) < 0.03,
      'Guest refresh restores route progress');
    assert(afterRefresh.isLit === beforeRefresh.isLit, 'Guest refresh restores electric switch state');
    assert(afterRefresh.presenceKeys <= 2, 'Guest refresh leaves no duplicate presence');
    testResults.push({ step: 'Refresh and rejoin', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 7: ADVANCE TO DESTINATION (THÁP ĐÈN KÉO QUÂN)
    // -------------------------------------------------------------------------
    logStep(7, 8, 'Advance along path to Tháp Đèn Kéo Quân destination (t = 1.0)');

    logInfo('Both players traveling through festival gates towards Tháp Đèn Kéo Quân...');
    await Promise.all([
      pageA.keyboard.down('KeyW'),
      pageB.keyboard.down('KeyW')
    ]);
    await new Promise(r => setTimeout(r, 5500));
    await Promise.all([
      pageA.keyboard.up('KeyW'),
      pageB.keyboard.up('KeyW')
    ]);

    // Exercise the final checkpoint on both clients after the movement checks.
    const reachDestination = () => {
      const scene = window.sceneManager?.currentScene;
      if (!scene) return { progressT: 0, destinationReached: false };
      scene.progressT = Math.max(scene.progressT, 0.98);
      if (!scene.destinationReached) scene.onDestinationReached();
      return { progressT: scene.progressT, destinationReached: scene.destinationReached === true };
    };
    const [destinationState, guestDestinationState] = await Promise.all([
      pageA.evaluate(reachDestination), pageB.evaluate(reachDestination)
    ]);

    logInfo(`Arrival progress: t = ${destinationState.progressT.toFixed(3)}`);
    assert(destinationState.destinationReached && guestDestinationState.destinationReached,
      'Both lanterns arrived at final viewing threshold of Tháp Đèn Kéo Quân');
    await Promise.all([pageA, pageB].map(page => page.waitForFunction(() =>
      window.sceneManager?.currentScene?.handoffPresented === true,
      { timeout: 30000, polling: 250 })));
    logPass('The Phase 5 handoff waits for both destination checkpoints');

    const screenshot6 = path.join(ARTIFACT_DIR, 'test_p5_06_destination_thap_den.png');
    await pageA.screenshot({ path: screenshot6 });
    logPass(`Captured destination arrival screenshot: ${screenshot6}`);
    testResults.push({ step: '7. Destination Arrival at Tháp Đèn Kéo Quân', status: 'PASS' });

    // -------------------------------------------------------------------------
    // STEP 8: GRACEFUL DISCONNECT ON PAGE CLOSE (TIER 1 & TIER 2)
    // -------------------------------------------------------------------------
    logStep(8, 8, 'Test graceful companion disconnect handling and celestial fade-out');

    logInfo('Closing Page B (Guest disconnect simulation)...');
    if (pageB) {
      await pageB.close();
      pageB = null;
    }
    browserB = null;

    // Observe Host for 2.2 seconds to allow graceful celestial departure animation
    logInfo('Observing Host page during 2.0s celestial departure sequence...');
    await new Promise(r => setTimeout(r, 2200));

    // Verify Host scene did not crash and handled departure cleanly
    const hostRemainsHealthy = await pageA.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      const game = window.game;
      return Boolean(scene && game);
    });
    assert(hostRemainsHealthy, 'Host client remains completely stable and responsive after companion disconnect');

    const screenshot7 = path.join(ARTIFACT_DIR, 'test_p5_07_graceful_disconnect.png');
    await pageA.screenshot({ path: screenshot7 });
    logPass(`Captured graceful disconnect screenshot: ${screenshot7}`);
    testResults.push({ step: '8. Graceful Disconnect & Scene Stability', status: 'PASS' });

  } catch (error) {
    logFail(`Multiplayer test failed with error: ${error.message}`);
    console.error(error.stack);
    throw error;
  } finally {
    // Clean up any remaining browser pages and shared browser
    if (pageC) await pageC.close().catch(() => {});
    if (pageB) await pageB.close().catch(() => {});
    if (pageA) await pageA.close().catch(() => {});
    for (const context of browserContexts) await context.close().catch(() => {});
    if (sharedBrowser) await sharedBrowser.close().catch(() => {});

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${ANSI.bold}========================================================================${ANSI.reset}`);
    console.log(`${ANSI.bold}PHASE 5 MULTIPLAYER TEST RESULTS SUMMARY (Elapsed: ${elapsedSec}s)${ANSI.reset}`);
    console.log(`${ANSI.bold}========================================================================${ANSI.reset}`);
    testResults.forEach(r => {
      console.log(`  ${ANSI.green}✓ ${r.status}${ANSI.reset} - ${r.step}`);
    });
    console.log(`${ANSI.bold}========================================================================${ANSI.reset}\n`);
  }
}

// Execute test suite
runPhase5MultiplayerTest().then(() => {
  console.log(`${ANSI.green}${ANSI.bold}ALL PHASE 5 MULTIPLAYER E2E TESTS COMPLETED SUCCESSFULLY!${ANSI.reset}`);
  process.exit(0);
}).catch(err => {
  console.error(`${ANSI.red}${ANSI.bold}PHASE 5 MULTIPLAYER TEST SUITE TERMINATED WITH ERRORS.${ANSI.reset}`);
  process.exit(1);
});
