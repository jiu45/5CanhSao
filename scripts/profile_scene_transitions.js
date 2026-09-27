import puppeteer from 'puppeteer';

const startScene = Number(process.argv[2] ?? 0);
const endScene = Number(process.argv[3] ?? 4);
// Direct scene switches measure the covered fallback path; normal play also
// prepares the early scenes during the preceding story beats.
const baseUrl = process.env.GAME_BASE_URL || 'http://127.0.0.1:5173/';
const url = new URL(`?scene=${startScene}&mock=true&create=true`, baseUrl).toString();
const browser = await puppeteer.launch({
  headless: true,
  protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(sceneId => window.sceneManager?.currentSceneId === sceneId,
    { timeout: 60000 }, startScene);

  for (let next = startScene + 1; next <= endScene; next++) {
    const result = await page.evaluate(async sceneId => {
      const manager = window.sceneManager;
      const renderer = window.game.renderer.renderer;
      const measurements = {};
      const start = performance.now();
      const originalGo = manager.goToScene.bind(manager);
      const originalCompile = renderer.compileAsync.bind(renderer);
      const originalRender = renderer.render.bind(renderer);
      const originalReveal = manager.curtain.reveal.bind(manager.curtain);
      manager.goToScene = (...args) => {
        const t = performance.now();
        const value = originalGo(...args);
        measurements.setupMs = performance.now() - t;
        return value;
      };
      renderer.compileAsync = async (...args) => {
        const t = performance.now();
        const value = await originalCompile(...args);
        measurements.compileMs = performance.now() - t;
        return value;
      };
      renderer.render = (...args) => {
        const t = performance.now();
        const value = originalRender(...args);
        if (manager.renderPaused) {
          measurements.primeMs = (measurements.primeMs || 0) + performance.now() - t;
          measurements.maxPrimeFrameMs = Math.max(measurements.maxPrimeFrameMs || 0,
            performance.now() - t);
          measurements.primeFrames = (measurements.primeFrames || 0) + 1;
        }
        return value;
      };
      manager.curtain.reveal = async () => {
        measurements.beforeRevealMs = performance.now() - start;
        return originalReveal();
      };
      try {
        await manager.transitionToScene(sceneId);
      } finally {
        manager.goToScene = originalGo;
        renderer.compileAsync = originalCompile;
        renderer.render = originalRender;
        manager.curtain.reveal = originalReveal;
      }
      const geometries = new Set();
      let drawables = 0;
      manager.currentScene.scene.traverse(object => {
        if (object.geometry) { geometries.add(object.geometry); drawables++; }
      });
      return { from: sceneId - 1, to: sceneId,
        setupMs: Math.round(measurements.setupMs || 0),
        compileMs: Math.round(measurements.compileMs || 0),
        primeMs: Math.round(measurements.primeMs || 0),
        maxPrimeFrameMs: Math.round(measurements.maxPrimeFrameMs || 0),
        primeFrames: measurements.primeFrames || 0,
        beforeRevealMs: Math.round(measurements.beforeRevealMs || 0),
        totalMs: Math.round(performance.now() - start), drawables,
        geometries: geometries.size,
        textures: renderer.info.memory.textures };
    }, next);
    console.log(JSON.stringify(result));
  }
  if (errors.length) {
    console.error(JSON.stringify({ errors }));
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
