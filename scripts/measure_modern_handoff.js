import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => {
    const native = window.requestAnimationFrame.bind(window);
    window.__handoffFrames = [];
    window.requestAnimationFrame = callback => native(time => {
      const start = performance.now();
      const scene = window.sceneManager?.currentSceneId;
      callback(time);
      window.__handoffFrames.push({ scene, duration: performance.now() - start,
        ascent: window.sceneManager?.currentScene?.ascentTimer ?? null });
    });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/?scene=4',
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 4);
  await page.evaluate(() => {
    window.__timings = [];
    const manager = window.sceneManager;
    const switchScene = manager.goToScene.bind(manager);
    manager.goToScene = (...args) => {
      const start = performance.now();
      const result = switchScene(...args);
      window.__timings.push({ kind: 'switch', scene: args[0], ms: performance.now() - start });
      return result;
    };
    const appRenderer = window.game.renderer;
    const render = appRenderer.render.bind(appRenderer);
    appRenderer.render = scene => {
      const start = performance.now();
      const result = render(scene);
      if (manager.currentSceneId === 5 && window.__timings.length < 8) {
        window.__timings.push({ kind: 'render', ms: performance.now() - start });
      }
      return result;
    };
  });
  await page.evaluate(() => window.sceneManager.currentScene.startMemoryAscent());
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 5,
    { timeout: 90000 });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const result = await page.evaluate(() => {
    const frames = window.__handoffFrames;
    const modern = frames.filter(frame => frame.scene === 5).map(frame => frame.duration);
    const ascentFrames = frames.filter(frame => frame.scene === 4);
    const ascent = ascentFrames.map(frame => frame.duration);
    return { ascentFirst: ascent.slice(0, 5), ascentMax: Math.max(...ascent),
      ascentLaterMax: Math.max(...ascent.slice(5)),
      ascentSlowest: ascentFrames.sort((a, b) => b.duration - a.duration).slice(0, 5),
      modernFirst: modern.slice(0, 5),
      modernMax: Math.max(...modern), modernOver50: modern.filter(n => n > 50).length,
      geometries: window.game.renderer.renderer.info.memory.geometries,
      textures: window.game.renderer.renderer.info.memory.textures,
      timings: window.__timings };
  });
  console.log(JSON.stringify({ ...result, errors }));
} finally { await browser.close(); }
