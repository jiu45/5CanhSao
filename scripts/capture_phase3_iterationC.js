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

  console.log('Navigating directly to FestivalSquareScene (?scene=4)...');
  await page.goto('http://127.0.0.1:5173/?scene=4', { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 1500));

  // Set scene directly into FINAL_SPECTACLE with center-stage lion salute
  console.log('Setting scene to FINAL_SPECTACLE with center bowing lion...');
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    if (scene) {
      scene.sceneState = 4; // FINAL_SPECTACLE
      scene.camera.position.set(0, 1.18, 0.0);
      scene.camera.up.set(0, 1, 0);
      scene.camera.lookAt(0, 1.35, -4.8);
      scene.lion.performEncoreBow();
      scene.overlay.setSubtitle("Chiếc đèn ông sao trên tay bạn vẫn ấm áp lung linh, rực rỡ nhất giữa vòng tay bè bạn đêm rằm.", 6000);
      scene.overlay.showNextButton("Hòa vào vầng trăng ký ức 🌕", () => {
        scene.startMemoryAscent();
      });
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Stage 0: Ground Breathing Moment (Human scale)
  console.log('Capturing Stage 0: Spectator breathing moment before ascent...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase3_c_01_spectator_breathing.png`
  });
  console.log('Captured 1: phase3_c_01_spectator_breathing.png');

  // Trigger Memory Ascent
  console.log('Triggering startMemoryAscent()...');
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    if (scene && scene.startMemoryAscent) {
      scene.startMemoryAscent();
    }
  });

  // 2. Capture Stage 1: Camera ascending, Star Lantern anchored in child's hands on courtyard ground (t ~ 4s)
  console.log('Waiting for Stage 1 milestone (t >= 3.8s)...');
  await page.waitForFunction(() => {
    const textEl = document.querySelector('.cinematic-subtitle-text');
    return textEl && textEl.innerText.includes('tự tay làm');
  }, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing Stage 1: Camera ascent, lantern anchored on ground...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase3_c_02_lantern_farewell.png`
  });
  console.log('Captured 2: phase3_c_02_lantern_farewell.png');

  // 3. Capture Stage 2: Village scale courtyard oasis at ~40 deg pitch down (t ~ 10s)
  console.log('Waiting for Stage 2 milestone (t >= 9.0s)...');
  await page.waitForFunction(() => {
    const textEl = document.querySelector('.cinematic-subtitle-text');
    return textEl && textEl.innerText.includes('Tiếng trống lân');
  }, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 800));
  console.log('Capturing Stage 2: 40-deg pitch down courtyard oasis with bamboo silhouettes...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase3_c_03_village_scale_reveal.png`
  });
  console.log('Captured 3: phase3_c_03_village_scale_reveal.png');

  // 4. Capture Stage 3: Tilt-Up to pristine Full Moon dead center in sky (t ~ 16s)
  console.log('Waiting for Stage 3 milestone (tilt up to Moon)...');
  await page.waitForFunction(() => {
    const textEl = document.querySelector('.cinematic-subtitle-text');
    return textEl && textEl.innerText.includes('Vầng trăng năm ấy');
  }, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 2800));
  console.log('Capturing Stage 3: Camera tilted up to Full Moon dead center in sky...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase3_c_04_memory_scale_constellation.png`
  });
  console.log('Captured 4: phase3_c_04_memory_scale_constellation.png');

  // 5. Capture Stage 4: Soft silver-white moonlight veil (#f4f6fa) fading in (t ~ 19.5s)
  console.log('Waiting for soft white moonlight veil transition...');
  await new Promise(r => setTimeout(r, 3000));
  console.log('Capturing Stage 4: Soft white moonlight veil (#f4f6fa)...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase3_c_05_timeless_moon_veil.png`
  });
  console.log('Captured 5: phase3_c_05_timeless_moon_veil.png');

  await browser.close();
  console.log('Deterministic Iteration C cinematic captures completed successfully!');
}

run().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});
