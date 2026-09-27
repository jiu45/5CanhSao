import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const baseUrl = process.env.GAME_BASE_URL || 'http://127.0.0.1:5173/';
  await page.goto(new URL('?mock=true', baseUrl).toString(),
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.cinematic-btn');
  await page.click('.cinematic-btn');
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 1,
    { timeout: 45000 });
  await page.waitForSelector('.crafting-ui-container', { visible: true });
  for (let step = 0; step < 4; step++) {
    await page.evaluate(index => document.querySelectorAll('.craft-card')[index]?.click(), step);
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  await page.waitForFunction(() => {
    const button = document.querySelector('.cinematic-action-box .cinematic-btn');
    return button?.textContent.includes('Cầm đèn');
  }, { timeout: 15000 });
  await page.click('.cinematic-action-box .cinematic-btn');
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 2,
    { timeout: 30000 });
  await page.waitForFunction(() => {
    const button = document.querySelector('.cinematic-action-box .cinematic-btn');
    return button?.textContent.includes('ngưỡng cửa');
  }, { timeout: 15000 });
  await page.click('.cinematic-action-box .cinematic-btn');
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 3,
    { timeout: 30000 });
  await page.waitForFunction(() => {
    const curtain = document.querySelector('.scene-transition-curtain');
    return curtain && getComputedStyle(curtain).visibility === 'hidden';
  }, { timeout: 30000 });
  await page.screenshot({ path: 'test-artifacts/early_scene_live_flow.png' });
  await page.evaluate(() => window.sceneManager.preparedEarlyScene.ready);
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.playerZ = -39;
    scene.update(0.016, performance.now() / 1000);
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('.cinematic-action-box .cinematic-btn');
    return button?.textContent.includes('đêm hội');
  }, { timeout: 10000 });
  await page.click('.cinematic-action-box .cinematic-btn');
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 4,
    { timeout: 30000 });
  await page.waitForFunction(() => {
    const curtain = document.querySelector('.scene-transition-curtain');
    return curtain && getComputedStyle(curtain).visibility === 'hidden';
  }, { timeout: 30000 });
  await page.screenshot({ path: 'test-artifacts/early_scene_festival_square.png' });
  const result = await page.evaluate(() => ({
    sceneId: window.sceneManager.currentSceneId,
    liveCamera: window.sceneManager.currentScene.camera === window.game.renderer.camera,
    geometries: window.game.renderer.renderer.info.memory.geometries,
    textures: window.game.renderer.renderer.info.memory.textures
  }));
  console.log(JSON.stringify({ ...result, errors }));
  if (errors.length || result.sceneId !== 4 || !result.liveCamera) process.exitCode = 1;
} finally { await browser.close(); }
