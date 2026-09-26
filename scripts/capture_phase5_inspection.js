import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

    console.log('1. Capturing SHOT 1: Phase 4C final approved state immediately before Phase 5 begins');
    await page.goto('http://127.0.0.1:5173/?scene=5', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.sceneManager?.currentScene !== null, { timeout: 30000 });
    await page.evaluate(() => {
      const scene = window.sceneManager?.currentScene;
      if (scene) {
        scene.isApproaching = false;
        scene.approachCompleted = true;
        scene.approachProgress = 1.0;
        scene.stage = 6;
        scene.overlay.setSubtitle("Đêm hội đã ở ngay trước mắt... Ánh sáng rực rỡ và tiếng trống lân đón chào.", 6000);
        scene.overlay.showNextButton("Bước vào đêm hội 🏮", () => {});
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot01_phase4c_final_handoff.png') });
    console.log('Saved p5_shot01_phase4c_final_handoff.png');

    console.log('2. Navigating to Phase 5 (Host) - SHOT 2 & SHOT 3: Invitation UI & Waiting State');
    await page.goto('http://127.0.0.1:5173/?scene=6&create=true&mock=true', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.sceneManager?.currentScene?.routeId === 'festival_coop_main', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // SHOT 2: Invitation UI first appears
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot02_invitation_ui_appears.png') });
    console.log('Saved p5_shot02_invitation_ui_appears.png');

    // SHOT 3: Waiting-for-partner state (Host solitary lantern floating, waiting banner)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot03_waiting_for_partner.png') });
    console.log('Saved p5_shot03_waiting_for_partner.png');

    // SHOT 4: Second lantern first appears (guest arrival moment, scaling up + arrival glow)
    console.log('3. Triggering Companion Arrival - SHOT 4');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.remoteLanternVisible = true;
      scene.remoteLantern.group.visible = true;
      scene.arrivalTime = 0.8; // mid-arrival
      scene.arrivalDuration = 2.0;
      scene.remoteLantern.group.scale.setScalar(0.18);
      scene.arrivalGlow.intensity = 1.9;
      scene.updatePositions();
      if (scene.roomManager) {
        scene.roomManager.companionPresence = {
          clientId: 'guest-123',
          role: 'guest',
          lanternType: 'modern',
          joinedAt: Date.now(),
          isOnline: true
        };
      }
      scene.updateHudBadges();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot04_second_lantern_arrival.png') });
    console.log('Saved p5_shot04_second_lantern_arrival.png');

    // SHOT 5: Both lanterns together before movement (t = 0.0, floating idle, instructions visible)
    console.log('4. Both lanterns together before movement - SHOT 5');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.arrivalTime = scene.arrivalDuration;
      scene.remoteLantern.group.scale.setScalar(0.48);
      scene.arrivalGlow.intensity = 0;
      scene.progressT = 0.0;
      scene.companionProgressT = 0.0;
      scene.remoteInterpolator.currentProgressT = 0.0;
      scene.lanternHeld = false;
      scene.isMoving = false;
      scene.localHoldWeight = 0.0;
      scene.updatePositions();
      scene.updateCamera(0.016, true);
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot05_both_lanterns_together_idle.png') });
    console.log('Saved p5_shot05_both_lanterns_together_idle.png');

    // SHOT 6: Both lanterns moving along the route (t = 0.12, lanterns lifted to chest, walking forward)
    console.log('5. Both lanterns moving - SHOT 6');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = 0.12;
      scene.companionProgressT = 0.11;
      scene.remoteInterpolator.currentProgressT = 0.11;
      scene.lanternHeld = true;
      scene.isMoving = true;
      scene.localHoldWeight = 1.0;
      scene.updatePositions();
      scene.updateCamera(0.016, true);
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot06_both_lanterns_moving.png') });
    console.log('Saved p5_shot06_both_lanterns_moving.png');

    // SHOT 7: First entry into Dark Zone BEFORE activating electric light (t = 0.28, darkFactor ~1.0, isLit = false)
    console.log('6. Dark Zone before switch - SHOT 7');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = 0.28;
      scene.companionProgressT = 0.27;
      scene.remoteInterpolator.currentProgressT = 0.27;
      scene.lanternHeld = true;
      scene.isMoving = false;
      scene.localHoldWeight = 0.6;
      scene.applySwitchState(false, true);
      scene.updateDarkZoneCheck(0.1);
      scene.updatePositions();
      scene.updateCamera(0.016, true);
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot07_dark_zone_before_light.png') });
    console.log('Saved p5_shot07_dark_zone_before_light.png');

    // SHOT 8: Switch interaction visible (overlay panel active and centered/prominent)
    console.log('7. Switch interaction visible - SHOT 8');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.switchOverlay?.show();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot08_switch_interaction_visible.png') });
    console.log('Saved p5_shot08_switch_interaction_visible.png');

    // SHOT 9: Immediately AFTER electric lantern activation (switch flipped, LED surge active, beam forward)
    console.log('8. After electric activation - SHOT 9');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.applySwitchState(true, true);
      scene.ledSurgeTimer = scene.ledSurgeDuration * 0.8; // surge peak
      scene.updatePositions();
      scene.updateCamera(0.016, true);
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot09_after_electric_activation.png') });
    console.log('Saved p5_shot09_after_electric_activation.png');

    // SHOT 10: Mid-route cooperative walking after illumination (t = 0.65, past dark zone, moving through gates)
    console.log('9. Mid-route walking illuminated - SHOT 10');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = 0.65;
      scene.companionProgressT = 0.64;
      scene.remoteInterpolator.currentProgressT = 0.64;
      scene.lanternHeld = true;
      scene.isMoving = true;
      scene.localHoldWeight = 1.0;
      scene.updateDarkZoneCheck(0.1);
      scene.updatePositions();
      scene.updateCamera(0.016, true);
      scene.overlay.clearSubtitle();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot10_mid_route_walking_illuminated.png') });
    console.log('Saved p5_shot10_mid_route_walking_illuminated.png');

    // SHOT 11: Approach toward Tháp Đèn Kéo Quân (t = 0.86)
    console.log('10. Approach Tháp Đèn Kéo Quân - SHOT 11');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = 0.86;
      scene.companionProgressT = 0.85;
      scene.remoteInterpolator.currentProgressT = 0.85;
      scene.lanternHeld = true;
      scene.isMoving = true;
      scene.localHoldWeight = 1.0;
      scene.updateDarkZoneCheck(0.1);
      scene.updatePositions();
      scene.updateCamera(0.016, true);
      scene.overlay.clearSubtitle();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot11_approach_thap_den_keo_quan.png') });
    console.log('Saved p5_shot11_approach_thap_den_keo_quan.png');

    // SHOT 12: Final Phase 5A composition (t = 0.98, at base of Tháp Đèn Kéo Quân)
    console.log('11. Final Phase 5A composition - SHOT 12');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = 0.98;
      scene.companionProgressT = 0.98;
      scene.remoteInterpolator.currentProgressT = 0.98;
      scene.lanternHeld = false;
      scene.isMoving = false;
      scene.localHoldWeight = 0.0;
      scene.destinationReached = true;
      scene.updatePositions();
      scene.updateCamera(0.016, true);
      scene.overlay.clearSubtitle();
    });
    await new Promise(r => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot12_final_phase5a_composition.png') });
    console.log('Saved p5_shot12_final_phase5a_composition.png');

    // SHOT 13: Close-up inspection of the two lanterns side-by-side
    console.log('12. Dual lantern closeup - SHOT 13');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.overlay.clearSubtitle();
      scene.updateCamera = () => {};
      const pPos = scene.playerLantern.group.position;
      const rPos = scene.remoteLantern.group.position;
      const midX = (pPos.x + rPos.x) * 0.5;
      const midY = (pPos.y + rPos.y) * 0.5;
      const midZ = (pPos.z + rPos.z) * 0.5;
      scene.camera.position.set(midX, midY + 0.05, midZ + 1.35);
      scene.camera.lookAt(midX, midY, midZ);
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot13_dual_lantern_closeup.png') });
    console.log('Saved p5_shot13_dual_lantern_closeup.png');

    // SHOT 14: Close-up inspection of Switch Overlay UI chassis and typography
    console.log('13. Switch UI chassis detail - SHOT 14');
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      scene.switchOverlay?.show();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p5_shot14_switch_ui_chassis_detail.png') });
    console.log('Saved p5_shot14_switch_ui_chassis_detail.png');

    console.log('ALL 14 INSPECTION SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
