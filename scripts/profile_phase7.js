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
  await page.evaluateOnNewDocument(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__frames = [];
    window.requestAnimationFrame = callback => raf(time => {
      const start = performance.now();
      callback(time);
      if (window.sceneManager?.currentSceneId === 8)
        window.__frames.push(performance.now() - start);
    });
  });
  await page.goto('http://127.0.0.1:5173/?scene=8&mock=true&create=true',
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__frames?.length >= 5, { timeout: 60000 });
  const result = await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    const game = window.game;
    const renderer = game.renderer.renderer;
    const firstFrames = window.__frames.slice(0, 5);
    const actualRender = game.renderer.render.bind(game.renderer);
    game.renderer.render = () => {};
    renderer.info.autoReset = false;
    const end = scene.getMessageEndTime();
    const moments = [
      ['gate', 2], ['plaza', 7.1], ['crowd', 17.5],
      ['message', 36], ['celebration', end + 7],
      ['moon', end + 23]
    ];
    const samples = moments.map(([name, moment]) => {
      const t = Number(moment);
      scene.elapsed = t - 0.016;
      const updateStart = performance.now();
      scene.update(0.016, t);
      const updateMs = performance.now() - updateStart;
      renderer.info.reset();
      const renderStart = performance.now();
      actualRender(scene.scene);
      const renderMs = performance.now() - renderStart;
      return { name, updateMs: +updateMs.toFixed(1), renderMs: +renderMs.toFixed(1),
        calls: renderer.info.render.calls,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures };
    });
    return { firstFrames, samples };
  });
  console.log(JSON.stringify({ ...result, errors }));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
