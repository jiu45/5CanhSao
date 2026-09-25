import puppeteer from 'puppeteer';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6';

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

  // A. Moon-facing view: Player at viewing terrace facing primary Moon landmark along -Z
  console.log('Setting scene to Stage 3 (Moon-facing overlook)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.sceneTimer = 18.5;
      scene.stage = 3;
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing A: phase4_b_01_moon_view.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_b_01_moon_view.png`
  });
  console.log('Captured A: phase4_b_01_moon_view.png');

  // B. Transition midpoint: Camera panning across tree silhouettes and descending park path
  console.log('Setting turn midpoint (turnTimer = 1.9s)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.triggerTurnToVista();
      scene.turnTimer = 1.9;
      scene._savedUpdate = scene.update;
      scene.update = function(delta, time) {
        this.turnTimer = 1.9;
        const p = 1.9 / 3.8;
        const e = p * p * (3 - 2 * p);
        this.camera.position.lerpVectors(this.masterCamPos, this.vistaCamPos, e);
        const curLookAt = this.masterLookAt.clone().lerp(this.vistaLookAt, e);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(curLookAt);
      };
      scene.overlay.setSubtitle("Từ phía bên kia triền đồi, tiếng nhạc rộn rã và ánh sáng đêm hội bừng lên gợi mời...", 4000);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  console.log('Capturing B: phase4_b_02_turn_midpoint.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_b_02_turn_midpoint.png`
  });
  console.log('Captured B: phase4_b_02_turn_midpoint.png');

  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene && scene._savedUpdate) {
      scene.update = scene._savedUpdate;
      delete scene._savedUpdate;
    }
  });

  // C. First festival reveal: Gate silhouette, glowing plaza & central stage appear
  console.log('Setting first festival reveal (turn complete, vistaTimer = 1.0s)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.isTurningToVista = false;
      scene.isVistaRevealed = true;
      scene.vistaTimer = 1.0;
      scene.overlay.setSubtitle("Quay sang phía tiếng nhạc... Tháp Đèn Kéo Quân khổng lồ xoay chuyển rực rỡ giữa lòng đại quảng trường!", 5000);
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing C: phase4_b_03_first_reveal.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_b_03_first_reveal.png`
  });
  console.log('Captured C: phase4_b_03_first_reveal.png');

  // D. Final Iteration B composition: Dolly push-in, lion dance, suspended lantern canopy, anticipation
  console.log('Setting final vista composition (vistaTimer = 6.5s)...');
  await page.evaluate(() => {
    const scene = window.sceneManager?.currentScene;
    if (scene) {
      scene.isTurningToVista = false;
      scene.isVistaRevealed = true;
      scene.vistaTimer = 6.5;
      scene.stage = 4;
      scene.finalButtonShown = true;
      scene.overlay.showNextButton("Khám phá đại quảng trường 🏮", () => {});
      scene.overlay.setSubtitle("Bóng lân rước đèn xoay vần lung linh, tiếng trống hội giục giã... Đêm hội Trung Thu rực rỡ đang chờ đón.", 6000);
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing D: phase4_b_04_final_vista_composition.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_b_04_final_vista_composition.png`
  });
  console.log('Captured D: phase4_b_04_final_vista_composition.png');

  console.log('All 4 Phase 4 Iteration B verification screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error running Phase 4B capture:', err);
  process.exit(1);
});
