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

  // Click threshold button
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked Step through door threshold into VillageWalkScene');
  await new Promise(r => setTimeout(r, 3200));

  // 5. Walk forward to Vignette 1 (Family Porch, z ~ -16.0)
  console.log('Walking towards Vignette 1 (Family Porch)...');
  await page.keyboard.down('KeyS');
  await new Promise(r => setTimeout(r, 2600));
  await page.keyboard.up('KeyS');
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase2_vignette1_family_porch.png'
  });
  console.log('Captured Vignette 1');

  // 6. Walk forward into Wind Gust & Vignette 2 (Running Kids with Carp Lantern, z ~ -20.2)
  console.log('Walking towards Wind Gust & Vignette 2...');
  await page.keyboard.down('KeyS');
  await new Promise(r => setTimeout(r, 2900));
  // Activate shield while moving into wind gust as kid sprints past
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 850));

  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase2_vignette2_wind_carp_shield.png'
  });
  console.log('Captured Vignette 2 with wind and shield');
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyS');
  await new Promise(r => setTimeout(r, 400));

  // 7. Walk forward to Vignette 3 (Feast Table with Pomelo Dog & Mooncakes, z ~ -29.5)
  console.log('Walking towards Vignette 3 (Feast Table)...');
  await page.keyboard.down('KeyS');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('KeyS');
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase2_vignette3_feast_table.png'
  });
  console.log('Captured Vignette 3');

  // 8. Walk forward to Vignette 4 (Temple Gate Arch & Festival Arrival, z ~ -38.5)
  console.log('Walking towards Vignette 4 (Temple Gate Arrival)...');
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && btn.style.display !== 'none' && btn.innerText.includes('đêm hội');
  }, { timeout: 10000 });
  await page.keyboard.up('KeyS');
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase2_vignette4_temple_gate_arrival.png'
  });
  console.log('Captured Vignette 4');

  await browser.close();
  console.log('Done capturing all vignettes!');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
