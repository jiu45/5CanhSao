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

  // 1. Capture Stage 0: Moon Bridge Continuity (t ~ 2.0s)
  console.log('Waiting for Stage 0 (t ~ 2.0s): Moon Bridge Continuity...');
  await page.waitForFunction(() => (window.sceneManager?.currentScene?.sceneTimer || 0) >= 1.8, { timeout: 25000 });
  console.log('Capturing 1: phase4_a_01_moon_continuity.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_01_moon_continuity.png`
  });
  console.log('Captured 1: phase4_a_01_moon_continuity.png');

  // 2. Capture Stage 1: Camera glides down to terrace knoll, lantern modernizes (t ~ 7.5s)
  console.log('Waiting for Stage 1 (t ~ 7.5s): Camera descent & lantern modernization...');
  await page.waitForFunction(() => (window.sceneManager?.currentScene?.sceneTimer || 0) >= 7.2, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing 2: phase4_a_02_lantern_modernize.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_02_lantern_modernize.png`
  });
  console.log('Captured 2: phase4_a_02_lantern_modernize.png');

  // 3. Capture Stage 2: Camera sweep across midground modern park (t ~ 13.0s)
  console.log('Waiting for Stage 2 (t ~ 13.0s): Park sweep & modern atmosphere...');
  await page.waitForFunction(() => (window.sceneManager?.currentScene?.sceneTimer || 0) >= 13.0, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing 3: phase4_a_03_park_descent.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_03_park_descent.png`
  });
  console.log('Captured 3: phase4_a_03_park_descent.png');

  // 4. Capture Stage 3: Elevated master viewpoint (t ~ 18.0s)
  console.log('Waiting for Stage 3 (t ~ 18.0s): Elevated viewpoint...');
  await page.waitForFunction(() => (window.sceneManager?.currentScene?.sceneTimer || 0) >= 18.0, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing 4: phase4_a_04_elevated_viewpoint.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_04_elevated_viewpoint.png`
  });
  console.log('Captured 4: phase4_a_04_elevated_viewpoint.png');

  // 5. Capture Stage 4: Distant Festival Promise & Action button (t ~ 21.0s)
  console.log('Waiting for Action button to appear (t ~ 21.0s)...');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-btn');
    return btn && btn.style.display !== 'none' && (window.sceneManager?.currentScene?.sceneTimer || 0) >= 20.0;
  }, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing 5: phase4_a_05_distant_festival_promise.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_05_distant_festival_promise.png`
  });
  console.log('Captured 5: phase4_a_05_distant_festival_promise.png');

  // 6. Capture Stage 5: Camera Pan Hook (Clicks button, camera pans 90 degrees toward Iteration B)
  console.log('Clicking "Tiến vào công viên rực rỡ" button to trigger Camera Pan Hook...');
  await page.click('.cinematic-btn');
  console.log('Waiting 1.4s for smooth camera pivot halfway through pan...');
  await new Promise(r => setTimeout(r, 1400));
  console.log('Capturing 6: phase4_a_06_camera_pivot_hook.png...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}\\phase4_a_06_camera_pivot_hook.png`
  });
  console.log('Captured 6: phase4_a_06_camera_pivot_hook.png');

  console.log('All 6 Phase 4 Iteration A verification screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error running Phase 4A capture:', err);
  process.exit(1);
});
