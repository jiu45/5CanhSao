import puppeteer from 'puppeteer';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 0,
    { timeout: 30000 });
  const opening = await page.$('.cinematic-btn');
  if (!opening) throw new Error('Production opening button missing');
  await page.goto(`${base}/?scene=8&mock=true&create=true`,
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 8 &&
    window.sceneManager.currentScene.messageBeats.length >= 4,
  { timeout: 30000 });
  const before = await page.evaluate(() => window.sceneManager.currentScene.messageBeats);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.sceneManager?.currentSceneId === 8 &&
    window.sceneManager.currentScene.messageBeats.length >= 4,
  { timeout: 30000 });
  const after = await page.evaluate(() => window.sceneManager.currentScene.messageBeats);
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error('Phase 7 wish differs after refresh');
  const terminal = await page.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    // Release starts 2.1s after the letter, then the end card takes 31s to settle.
    scene.elapsed = scene.getMessageEndTime() + 34;
    scene.update(0.016, performance.now() / 1000);
    return scene.isFinished && scene.fadeLayer.style.opacity === '1' &&
      document.elementFromPoint(innerWidth / 2, innerHeight / 2) === scene.fadeLayer;
  });
  if (!terminal) throw new Error('Black ending does not block underlying controls');
  if (errors.length) throw new Error(`Production browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ opening: true, finale: true, wishStableOnRefresh: true,
    terminal,
    vietnamese: after.some(beat => /[ăâđêôơư]/i.test(beat)), errors }));
} finally { await browser.close(); }
