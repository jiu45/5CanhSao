import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

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

  // ===========================================================================
  // 1. REGRESSION TEST: SCENE 1 (LANTERN CRAFTING TABLE)
  // ===========================================================================
  console.log('Testing Scene 1: Lantern Crafting Table (?scene=1)...');
  await page.goto('http://127.0.0.1:5173/?scene=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 1, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_01_lantern_crafting_start.png')
  });
  console.log('Captured: regression_01_lantern_crafting_start.png');

  // Trigger step 4 (finished lantern with lit candle)
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    if (scene && scene.lantern) {
      scene.lantern.setStep(4);
    }
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_01_lantern_crafting_candle_lit.png')
  });
  console.log('Captured: regression_01_lantern_crafting_candle_lit.png');

  // ===========================================================================
  // 2. REGRESSION TEST: SCENE 2 (DOOR REVEAL)
  // ===========================================================================
  console.log('Testing Scene 2: Door Reveal (?scene=2)...');
  await page.goto('http://127.0.0.1:5173/?scene=2', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 2, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_02_door_reveal.png')
  });
  console.log('Captured: regression_02_door_reveal.png');

  // ===========================================================================
  // 3. REGRESSION TEST: SCENE 3 (VILLAGE WALK & BAMBOO PATH)
  // ===========================================================================
  console.log('Testing Scene 3: Village Walk & Bamboo Path (?scene=3)...');
  await page.goto('http://127.0.0.1:5173/?scene=3', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 3, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  // Bamboo path start
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_03_village_walk_bamboo_start.png')
  });
  console.log('Captured: regression_03_village_walk_bamboo_start.png');

  // Move forward to Vignette 1 (Family yard)
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    if (scene) {
      // Advance player position along the path towards vignette 1
      scene.playerZ = -22.0;
      scene.camera.position.z = -22.0;
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_03_village_walk_vignette_family.png')
  });
  console.log('Captured: regression_03_village_walk_vignette_family.png');

  // ===========================================================================
  // 4. REGRESSION TEST: SCENE 4 (FESTIVAL SQUARE - SPECTATOR LIGHTING)
  // ===========================================================================
  console.log('Testing Scene 4: Festival Square Spectator Lighting (?scene=4)...');
  await page.goto('http://127.0.0.1:5173/?scene=4', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 4, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 3600));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'regression_04_festival_square_spectator_lighting.png')
  });
  console.log('Captured: regression_04_festival_square_spectator_lighting.png');

  await browser.close();
  console.log('All regression tests completed successfully!');
}

run().catch(err => {
  console.error('Regression test error:', err);
  process.exit(1);
});
