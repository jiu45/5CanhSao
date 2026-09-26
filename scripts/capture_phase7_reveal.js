import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve('test-artifacts', 'phase7');
fs.mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/?scene=8&mock=true&create=true',
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 8,
    { timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 1800));
  const releaseAt = await page.evaluate(() =>
    window.sceneManager.currentScene.getMessageEndTime() + 2.1);
  const shots = [
    ['01_gate_closed', 0.25],
    ['02_gate_activation', 1.8],
    ['03_first_gap', 3.0],
    ['04_partial_reveal', 4.6],
    ['05_full_reveal', 7.1],
    ['06_first_wide_hold', 9.4],
    ['07_walk_inside', 13.4],
    ['08_festival_inside', 17.5],
    ['09_two_lights', 21.7],
    ['10_shared_star', 23.7],
    ['11_message_lead', 26.1],
    ['12_personal_wish', 36.2],
    ['13_first_firework', releaseAt + 2.8],
    ['14_festival_celebration', releaseAt + 5.5],
    ['15_ascent', releaseAt + 13.5],
    ['16_moon_wide', releaseAt + 21.5],
    ['17_fade', releaseAt + 26.0]
  ];
  for (const [name, time] of shots) {
    if (process.argv[2] && !name.includes(process.argv[2])) continue;
    await page.evaluate(t => {
      const scene = window.sceneManager.currentScene;
      scene.elapsed = t;
      scene.update(0.016, t);
    }, time);
    await new Promise(resolve => setTimeout(resolve, 400));
    const file = path.join(output, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${name}: ${file}`);
  }
  const textures = await page.evaluate(() =>
    window.game.renderer.renderer.info.memory.textures);
  console.log('Resident textures:', textures);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
