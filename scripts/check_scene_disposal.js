import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
});

try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/?scene=5&mock=true&create=true',
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 5,
    { timeout: 60000 });
  const samples = await page.evaluate(() => {
    window.game.renderer.render = () => {};
    const renderer = window.game.renderer.renderer;
    const result = [];
    const firstSceneTextures = new Map();
    const firstModernTextures = new Map();
    for (const sceneId of [6, 5, 6, 5, 6]) {
      window.sceneManager.goToScene(sceneId);
      renderer.render(window.sceneManager.currentScene.scene,
        window.game.renderer.camera);
      if (sceneId === 6 && firstSceneTextures.size === 0) {
        window.sceneManager.currentScene.scene.traverse(object => {
          const materials = object.material
            ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
          for (const material of materials) {
            for (const [slot, value] of Object.entries(material)) {
              if (value?.isTexture && !firstSceneTextures.has(value)) {
                const record = { object: object.name || object.type,
                  material: material.type, slot, disposed: false };
                value.addEventListener('dispose', () => { record.disposed = true; });
                firstSceneTextures.set(value, record);
              }
            }
          }
        });
      }
      if (sceneId === 5 && firstModernTextures.size === 0) {
        window.sceneManager.currentScene.scene.traverse(object => {
          const materials = object.material
            ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
          for (const material of materials) {
            for (const [slot, value] of Object.entries(material)) {
              if (value?.isTexture && !firstModernTextures.has(value)) {
                const record = { object: object.name || object.type,
                  material: material.type, slot, disposed: false };
                value.addEventListener('dispose', () => { record.disposed = true; });
                firstModernTextures.set(value, record);
              }
            }
          }
        });
      }
      result.push({ sceneId, geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures });
    }
    return { result, undisposedFromFirstPhase6: [...firstSceneTextures.values()]
      .filter(record => !record.disposed),
      undisposedFromFirstModern: [...firstModernTextures.values()]
        .filter(record => !record.disposed) };
  });
  console.log(JSON.stringify(samples));
  const [, , second, , third] = samples.result;
  if (third.geometries > second.geometries + 8
    || third.textures > second.textures + 4) process.exitCode = 1;
} finally { await browser.close(); }
