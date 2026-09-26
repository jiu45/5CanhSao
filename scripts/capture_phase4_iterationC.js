import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve('test-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating directly to ModernArrivalScene (?scene=5)...');
  await page.goto('http://127.0.0.1:5173/?scene=5', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Moon View: Polished foreground terrace with softened warm gold LED strips (no overblown bloom)
  console.log('Setting scene to Stage 3 (Moon overlook with refined LED strip)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.sceneTimer = 18.5;
      scene.stage = 3;
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 1: phase4_c_01_moon_view.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_c_01_moon_view.png`
  });
  console.log('Captured 1: phase4_c_01_moon_view.png');

  // 2. Initial Vista Reveal: Revolving Shadow Lantern Tower pops against deep violet-navy fog
  console.log('Setting vista reveal state...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.isTurningToVista = false;
      scene.isVistaRevealed = true;
      scene.vistaTimer = 6.0;
      scene.stage = 4;
      scene.overlay.setSubtitle("Quay sang phía tiếng nhạc... Tháp Đèn Kéo Quân khổng lồ xoay chuyển rực rỡ giữa lòng đại quảng trường!", 5000);
      scene.overlay.showNextButton("Khám phá đại quảng trường 🏮", () => {});
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 2: phase4_c_02_first_reveal.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_c_02_first_reveal.png`
  });
  console.log('Captured 2: phase4_c_02_first_reveal.png');

  // 3. Mid-Approach: Descending S-curve, passing park bench & kiosk, crowd density builds
  console.log('Setting mid-approach state (approachProgress = 0.50)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.isVistaRevealed = false;
      scene.isApproaching = true;
      scene.approachCompleted = false;
      scene.approachTimer = 4.75; // ~50% along the 9.5s curve
      scene.approachProgress = 0.50;
      scene.midApproachSubtitleShown = true;
      scene.stage = 5;
      scene.overlay.hideNextButton();
      scene.overlay.setSubtitle("Dọc theo con đường rực rỡ, dòng người nô nức cùng những chiếc đèn lung linh hướng về cổng hội.", 5000);
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 3: phase4_c_03_mid_approach.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_c_03_mid_approach.png`
  });
  console.log('Captured 3: phase4_c_03_mid_approach.png');

  // 4. Final Handoff: Standing ~25m before gate, bustling crowd, illuminated Đèn Kéo Quân tower
  console.log('Setting final handoff state (approachCompleted = true)...');
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
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 4: phase4_c_04_near_festival_handoff.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_c_04_near_festival_handoff.png`
  });
  console.log('Captured 4: phase4_c_04_near_festival_handoff.png');

  await browser.close();
  console.log('Phase 4C capture complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
