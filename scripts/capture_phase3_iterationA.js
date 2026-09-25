import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to http://127.0.0.1:5173/...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // 1. Start game
  await page.waitForSelector('.cinematic-btn');
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Started intro');

  // 2. Complete crafting
  await page.waitForSelector('.crafting-ui-container', { visible: true, timeout: 25000 });
  for (let i = 0; i < 4; i++) {
    await page.evaluate((idx) => {
      const cards = document.querySelectorAll('.craft-card');
      if (cards[idx]) cards[idx].click();
    }, i);
    await new Promise(r => setTimeout(r, 650));
  }
  console.log('Crafting finished');

  // 3. Open door
  await page.waitForSelector('.cinematic-action-box .cinematic-btn', { visible: true, timeout: 10000 });
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked go to door');

  // Wait until threshold button appears
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && btn.style.display !== 'none' && btn.innerText.includes('ngưỡng cửa');
  }, { timeout: 15000 });

  // Click threshold button to enter VillageWalkScene
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Entered VillageWalkScene');
  await new Promise(r => setTimeout(r, 3200));

  // 4. Walk down village path all the way to temple gate arrival
  console.log('Walking down village lane to temple gate...');
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && btn.style.display !== 'none' && btn.innerText.includes('đêm hội');
  }, { timeout: 25000 });
  await page.keyboard.up('KeyS');
  console.log('Arrived at temple gate!');
  await new Promise(r => setTimeout(r, 600));

  // 5. Click "Hòa vào đêm hội sân đình 🏮" to trigger Phase 3 FestivalSquareScene
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Entered Phase 3: FestivalSquareScene!');

  // Capture Stage 1: Gate threshold passage (sceneTimer ~ 0.9s)
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_01_gate_threshold.png'
  });
  console.log('Captured Phase 3 Stage 1: Gate Threshold');

  // Capture Stage 2: Widening reveal of courtyard & crowds under Moon (sceneTimer ~ 5.4s)
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_02_square_widen_reveal.png'
  });
  console.log('Captured Phase 3 Stage 2: Square Widen Reveal');

  // Capture Stage 3: Lion peeking behind crowd with blinking eyes (sceneTimer ~ 9.4s)
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_03_lion_peeking_behind_crowd.png'
  });
  console.log('Captured Phase 3 Stage 3: Lion Peeking Behind Crowd');

  // Capture Stage 4: Full Lion Dance leap and center stage performance (sceneTimer ~ 14.5s)
  await new Promise(r => setTimeout(r, 5200));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_04_full_lion_dance_spectacle.png'
  });
  console.log('Captured Phase 3 Stage 4: Full Lion Dance Spectacle');

  await browser.close();
  console.log('Done capturing all Phase 3 Iteration A screenshots!');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
