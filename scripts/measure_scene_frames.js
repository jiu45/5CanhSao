import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://127.0.0.1:5173/?scene=5';
const browser = await puppeteer.launch({ headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => {
    const native = window.requestAnimationFrame.bind(window);
    window.__frameDurations = [];
    window.requestAnimationFrame = callback => native(time => {
      const start = performance.now();
      callback(time);
      const duration = performance.now() - start;
      window.__frameDurations.push(duration);
    });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 5500));
  const result = await page.evaluate(() => ({
    sceneId: window.sceneManager?.currentSceneId,
    count: window.__frameDurations.length,
    first: window.__frameDurations.slice(0, 5),
    max: Math.max(...window.__frameDurations),
    over50: window.__frameDurations.filter(n => n > 50).length,
    geometries: window.game?.renderer.renderer.info.memory.geometries,
    textures: window.game?.renderer.renderer.info.memory.textures
  }));
  console.log(JSON.stringify({ ...result, errors }));
} finally { await browser.close(); }
