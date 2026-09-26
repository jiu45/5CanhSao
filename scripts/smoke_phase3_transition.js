import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/?scene=4', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 4);
  await page.evaluate(() => window.sceneManager.currentScene.triggerTransitionToLion());
  await page.waitForFunction(() => window.sceneManager.currentScene.sceneState === 2,
    { timeout: 20000 });
  await page.screenshot({ path: 'test-artifacts/release_phase3_lion_pov.png' });
  await page.evaluate(() => window.sceneManager.currentScene.triggerTransitionToSpectator());
  await page.waitForFunction(() => window.sceneManager.currentScene.sceneState === 4,
    { timeout: 20000 });
  await page.screenshot({ path: 'test-artifacts/release_phase3_spectator.png' });
  console.log(JSON.stringify({ lionPov: true, spectatorReturn: true, errors }));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
