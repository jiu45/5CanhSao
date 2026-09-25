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

  console.log('Navigating directly to FestivalSquareScene (?scene=4)...');
  await page.goto('http://127.0.0.1:5173/?scene=4', { waitUntil: 'networkidle0' });

  // 1. Fast-forward or wait until Lion leap & Action button appears
  console.log('Waiting for spectator intro to finish and action button to appear...');
  await page.waitForFunction(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    return btn && btn.style.display !== 'none' && btn.innerText.includes('Chăm chú');
  }, { timeout: 20000 });

  console.log('Action button appeared!');
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 1: Spectator view before transition
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_01_spectator_before_transition.png'
  });
  console.log('Captured 1: Spectator before transition');

  // 2. Click the button to trigger Transition into Lion POV
  await page.evaluate(() => {
    const btn = document.querySelector('.cinematic-action-box .cinematic-btn');
    if (btn) btn.click();
  });
  console.log('Clicked action button -> Triggered transition to Lion POV');

  // Screenshot 2: Silk cloth sweep during transition (~800ms)
  await new Promise(r => setTimeout(r, 850));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_02_silk_transition_in.png'
  });
  console.log('Captured 2: Silk cloth transition');

  // Screenshot 3: Inside Lion POV with minimalist dark crimson vignette & double bamboo jaw rim (~1400ms)
  await new Promise(r => setTimeout(r, 1400));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_03_lion_pov_gesture1.png'
  });
  console.log('Captured 3: Lion POV inside paper-mache mask with Gesture 1 guide');

  // 3. Perform Gesture 1: Left to Right swipe
  console.log('Performing Gesture 1 (Left-to-Right swipe)...');
  await page.mouse.move(1280 * 0.28, 720 * 0.58);
  await page.mouse.down();
  for (let step = 1; step <= 15; step++) {
    const t = step / 15;
    const x = 1280 * (0.28 + t * 0.44);
    const y = 720 * (0.58 - Math.sin(t * Math.PI) * 0.12);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, 30));
  }
  await page.mouse.up();

  // Screenshot 4: Gesture 1 Success burst & feedback with golden glitter flakes
  await new Promise(r => setTimeout(r, 220));
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_04_gesture1_success.png'
  });
  console.log('Captured 4: Gesture 1 success celebration burst');

  // Wait for Gesture 2 prompt to appear
  await new Promise(r => setTimeout(r, 1000));

  // 4. Perform Gesture 2: Right to Left swipe
  console.log('Performing Gesture 2 (Right-to-Left swipe)...');
  await page.mouse.move(1280 * 0.72, 720 * 0.56);
  await page.mouse.down();
  for (let step = 1; step <= 15; step++) {
    const t = step / 15;
    const x = 1280 * (0.72 - t * 0.44);
    const y = 720 * (0.56 - Math.sin(t * Math.PI) * 0.13);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, 30));
  }
  await page.mouse.up();
  console.log('Completed Gesture 2');

  // Wait for Gesture 3 prompt to appear
  await new Promise(r => setTimeout(r, 1100));

  // Screenshot 5: Gesture 3 prompt guide (Grand Upward Leap Arc)
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_05_lion_pov_gesture3.png'
  });
  console.log('Captured 5: Gesture 3 prompt guide');

  // 5. Perform Gesture 3: Grand Upward Leap swipe
  console.log('Performing Gesture 3 (Upward Leap swipe)...');
  await page.mouse.move(1280 * 0.38, 720 * 0.72);
  await page.mouse.down();
  for (let step = 1; step <= 15; step++) {
    const t = step / 15;
    const x = 1280 * (0.38 + t * 0.24);
    const y = 720 * (0.72 - t * 0.36);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, 30));
  }
  await page.mouse.up();
  console.log('Completed Gesture 3 -> All gestures done!');

  // Wait for camera to soar high up toward the moon (~600ms)
  await new Promise(r => setTimeout(r, 700));

  // Screenshot 6: Moonward soar before transition descends (~800ms)
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_06_moonward_soar.png'
  });
  console.log('Captured 6: Moonward leap soar');

  // Wait for transition out to start and finish (~2200ms)
  await new Promise(r => setTimeout(r, 2400));

  // Screenshot 7: Final Spectacle Payoff (Lion bowing, player star lantern in hand, moon glowing)
  await page.screenshot({
    path: 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6\\phase3_b_v9_07_spectator_payoff_bow.png'
  });
  console.log('Captured 7: Final Spectacle Payoff');

  await browser.close();
  console.log('All Phase 3 Iteration B v3 screenshots captured successfully!');
}

run().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});
