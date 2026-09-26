import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/?mock=true', { waitUntil: 'domcontentloaded' });
  const checkpoints = [];
  for (let id = 0; id <= 6; id++) {
    if (id) await page.evaluate(sceneId => window.sceneManager.goToScene(sceneId), id);
    await new Promise(resolve => setTimeout(resolve, 750));
    checkpoints.push(await page.evaluate(() => ({
      scene: window.sceneManager.currentSceneId,
      geometries: window.game.renderer.renderer.info.memory.geometries,
      textures: window.game.renderer.renderer.info.memory.textures
    })));
  }
  console.log(JSON.stringify({ checkpoints, errors }));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
