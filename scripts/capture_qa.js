import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6';

async function run() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // 1. Start Screen: Click Start via DOM click
  await page.waitForSelector('.cinematic-btn', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked start button...');

  // 2. Wait for Crafting UI to appear (after time travel scene completes, ~13s)
  console.log('Waiting for Crafting UI container to become visible...');
  await page.waitForFunction(() => {
    const el = document.querySelector('.crafting-ui-container');
    return el && window.getComputedStyle(el).display !== 'none';
  }, { timeout: 30000 });
  console.log('Crafting UI is visible! Assembling lantern...');

  await new Promise(r => setTimeout(r, 1000));
  for (let i = 0; i < 4; i++) {
    await page.evaluate((stepIdx) => {
      const cards = document.querySelectorAll('.craft-card');
      if (cards[stepIdx]) cards[stepIdx].click();
    }, i);
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('Crafting steps 1-4 completed. Candle lit!');

  // 3. Wait for Door button to appear and click it
  console.log('Waiting for door reveal button...');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && window.getComputedStyle(btn).display !== 'none';
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked go to door button. Doors opening...');

  // 4. Wait for threshold walk button to appear ("Bước qua ngưỡng cửa rước đèn 🏮")
  console.log('Waiting for threshold walk button...');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && window.getComputedStyle(btn).display !== 'none' && btn.textContent && btn.textContent.includes('Bước qua');
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked walk through threshold. Camera dollying out into village...');

  // Wait for threshold walk dolly to complete into VillageWalkScene (~2.8s)
  await new Promise(r => setTimeout(r, 3800));

  // 5. Capture Phase 2 Iteration A Screenshot 1: Arrival on village dirt path
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_01_arrival_at_path.png') });
  console.log('Captured phase2_01_arrival_at_path.png');

  // 6. Hold KeyS to walk forward along the path
  console.log('Holding KeyS to walk forward...');
  await page.keyboard.down('KeyS');
  await new Promise(r => setTimeout(r, 2400));

  // Capture Phase 2 Iteration A Screenshot 2: Walking forward with bob & flame bend
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_02_walking_forward.png') });
  console.log('Captured phase2_02_walking_forward.png');

  // 7. Keep running forward towards the temple festival lights
  console.log('Running forward towards festival lights...');
  await new Promise(r => setTimeout(r, 3200));
  await page.keyboard.up('KeyS');

  // Capture Phase 2 Iteration A Screenshot 3: Approaching temple and festival crowd
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_03_running_temple_view.png') });
  console.log('Captured phase2_03_running_temple_view.png');

  await browser.close();
  console.log('Phase 2 Iteration A QA Capture Complete!');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
