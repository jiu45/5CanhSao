import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // Expose current scene ID from game
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked start button...');

  await page.waitForFunction(() => {
    const el = document.querySelector('.crafting-ui-container');
    return el && window.getComputedStyle(el).display !== 'none';
  }, { timeout: 30000 });

  await new Promise(r => setTimeout(r, 1000));
  for (let i = 0; i < 4; i++) {
    await page.evaluate((stepIdx) => {
      const cards = document.querySelectorAll('.craft-card');
      if (cards[stepIdx]) cards[stepIdx].click();
    }, i);
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('Crafted lantern');

  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && window.getComputedStyle(btn).display !== 'none';
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked door reveal button');

  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && window.getComputedStyle(btn).display !== 'none' && btn.textContent && btn.textContent.includes('Bước qua');
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked threshold button');

  for (let s = 0; s < 10; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const state = await page.evaluate(() => {
      return {
        subtitles: document.querySelector('.cinematic-subtitle-text')?.textContent,
        btn: document.querySelector('.cinematic-btn')?.textContent,
        btnDisplay: document.querySelector('.cinematic-btn') ? window.getComputedStyle(document.querySelector('.cinematic-btn')).display : 'none',
        titleVisible: document.querySelector('.cinematic-title-box')?.classList.contains('visible')
      };
    });
    console.log(`[Second ${s + 1}] State:`, JSON.stringify(state));
  }

  await browser.close();
}

run().catch(console.error);
