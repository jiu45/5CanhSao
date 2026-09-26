import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const output = path.resolve('test-artifacts');
fs.mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:5173/?scene=6&create=true&mock=true', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentScene?.routeId === 'festival_coop_main',
    { timeout: 30000, polling: 250 });

  const captures = [
    ['phase5_dark_before_switch', 0.30, false],
    ['phase5_dark_after_switch', 0.30, true],
    ['phase5_final_vista', 0.98, true]
  ];
  for (const [name, t, lit] of (process.env.PHASE5_CAPTURE === 'final' ? captures.slice(-1) : captures)) {
    await page.evaluate(({ t, lit }) => {
      const scene = window.sceneManager.currentScene;
      scene.progressT = t;
      scene.remoteInterpolator.currentProgressT = t;
      scene.remoteLanternVisible = true;
      scene.remoteLantern.group.visible = true;
      scene.arrivalTime = scene.arrivalDuration;
      scene.remoteLantern.group.scale.setScalar(0.32);
      scene.applySwitchState(lit, true);
      scene.companionProgressT = t;
      scene.updateCamera(0.016, true);
      scene.updatePositions();
    }, { t, lit });
    await new Promise(resolve => setTimeout(resolve, 1800));
    const view = await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      return {
        progressT: scene.progressT,
        companionProgressT: scene.companionProgressT,
        camera: scene.camera.position.toArray(),
        lantern: scene.playerLantern.group.position.toArray(),
        companionLantern: scene.remoteLantern.group.position.toArray(),
        switchVisible: scene.switchOverlay?.isVisible
      };
    });
    console.log(`${name} view: ${JSON.stringify(view)}`);
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    console.log(`Captured ${name}.png`);
  }
} finally {
  await browser.close();
}
