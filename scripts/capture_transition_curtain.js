import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve('test-artifacts');
fs.mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/?scene=5&mock=true&create=true',
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 5,
    { timeout: 60000 });
  await page.evaluate(() => {
    window.__transitionStarted = performance.now();
    window.__sceneSetupMs = null;
    const manager = window.sceneManager;
    window.__postRevealFrames = [];
    const appRenderer = window.game.renderer;
    const appRender = appRenderer.render.bind(appRenderer);
    appRenderer.render = scene => {
      const started = performance.now();
      const result = appRender(scene);
      if (manager.currentSceneId === 6 && !manager.renderPaused
        && window.__postRevealFrames.length < 12) {
        window.__postRevealFrames.push(Math.round(performance.now() - started));
      }
      return result;
    };
    const curtain = manager.curtain;
    const originalReveal = curtain.reveal.bind(curtain);
    curtain.reveal = async () => {
      window.__beforeReveal = performance.now();
      await originalReveal();
      window.__transitionFinished = performance.now();
    };
    const renderer = window.game.renderer.renderer;
    window.__uploadMs = 0;
    const originalUpload = renderer.initTexture.bind(renderer);
    renderer.initTexture = texture => {
      const started = performance.now();
      const result = originalUpload(texture);
      window.__uploadMs += performance.now() - started;
      return result;
    };
    const originalRender = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      const started = performance.now();
      const result = originalRender(...args);
      if (manager.renderPaused) window.__primeMs = performance.now() - started;
      return result;
    };
    const originalCompile = renderer.compileAsync.bind(renderer);
    renderer.compileAsync = async (...args) => {
      const started = performance.now();
      const result = await originalCompile(...args);
      window.__compileMs = performance.now() - started;
      return result;
    };
    const goToScene = manager.goToScene.bind(manager);
    manager.goToScene = (...args) => {
      const started = performance.now();
      const result = goToScene(...args);
      window.__sceneSetupMs = performance.now() - started;
      return result;
    };
    void manager.transitionToScene(6);
  });

  for (const [name, delay] of [['closing', 240], ['covered', 430]]) {
    await new Promise(resolve => setTimeout(resolve, delay));
    await page.screenshot({ path: path.join(output, `transition_${name}.png`) });
    const state = await page.evaluate(() => {
      const curtain = document.querySelector('.scene-transition-curtain');
      return { sceneId: window.sceneManager.currentSceneId,
        opacity: getComputedStyle(curtain).opacity,
        visibility: getComputedStyle(curtain).visibility };
    });
    console.log(JSON.stringify({ name, ...state }));
  }
  await page.waitForFunction(() => {
    const curtain = document.querySelector('.scene-transition-curtain');
    return window.sceneManager?.currentSceneId === 6
      && getComputedStyle(curtain).visibility === 'hidden';
  }, { timeout: 90000 });
  await page.screenshot({ path: path.join(output, 'transition_revealed.png') });
  const timings = await page.evaluate(() => ({
    setupMs: Math.round(window.__sceneSetupMs),
    compileMs: Math.round(window.__compileMs),
    uploadMs: Math.round(window.__uploadMs),
    primeMs: Math.round(window.__primeMs),
    beforeRevealMs: Math.round(window.__beforeReveal - window.__transitionStarted),
    totalMs: Math.round(window.__transitionFinished - window.__transitionStarted),
    postRevealFrames: window.__postRevealFrames,
    gpu: (() => {
      const gl = window.game.renderer.renderer.getContext();
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unavailable';
    })(),
    objects: (() => {
      let meshes = 0;
      const geometries = new Set();
      const materials = new Set();
      window.sceneManager.currentScene.scene.traverse(object => {
        if (object.isMesh || object.isLine || object.isPoints) meshes++;
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          const list = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of list) materials.add(material);
        }
      });
      return { meshes, geometries: geometries.size, materials: materials.size };
    })()
  }));
  console.log(JSON.stringify({ name: 'revealed', sceneId: 6, ...timings, errors }));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
