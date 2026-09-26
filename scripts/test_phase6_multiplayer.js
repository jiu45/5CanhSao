import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PHASE6_BASE_URL || 'http://127.0.0.1:5173';
const live = process.env.PHASE6_LIVE === '1';
const output = path.resolve('test-artifacts');
fs.mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows'] });
const contexts = live ? [await browser.createBrowserContext(), await browser.createBrowserContext()] :
  [browser.defaultBrowserContext(), browser.defaultBrowserContext()];
const [host, guest] = await Promise.all(contexts.map(context => context.newPage()));
if (process.env.PHASE6_RENDER_HOST === '1') {
  await host.evaluateOnNewDocument(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__sceneFrames = [];
    window.requestAnimationFrame = callback => raf(time => {
      const id = window.sceneManager?.currentSceneId;
      const start = performance.now();
      callback(time);
      window.__sceneFrames.push({ id, ms: performance.now() - start });
    });
  });
}
const errors = [];
for (const [page, label] of [[host, 'host'], [guest, 'guest']]) {
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', error => { errors.push(`${label}: ${error.message}`); console.log(`${label} PAGE ERROR: ${error.message}`); });
  page.on('console', message => {
    const line = message.text();
    if (line.startsWith('[RoomManager]') || line.startsWith('[Phase 6]')) {
      console.log(`${label}: ${line.replace(/apikey=[^&\s]+/g, 'apikey=[redacted]')}`);
    }
  });
}

const wait = async (page, predicate, label, timeout = 20000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await page.evaluate(() => {
        if (window.sceneManager?.currentSceneId === 7) {
          window.sceneManager.currentScene.update(0.1, performance.now() / 1000);
        }
      }), await page.evaluate(predicate)) return;
    } catch { /* Navigation in progress. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  {
    const debug = await Promise.all([host, guest].map(p => p.evaluate(() => {
      const room = window.sceneManager?.currentScene?.roomManager;
      return room && { id: room.clientId, role: room.role, room: room.roomId,
        companion: room.companionPresence?.clientId, status: room.connectionStatus,
        rejected: room.isRejected, scene: window.sceneManager.currentSceneId,
        game: !!window.game, renderer: !!window.game?.renderer,
        route: window.sceneManager.currentScene.routeId,
        progress: window.sceneManager.currentScene.progressT,
        remoteProgress: window.sceneManager.currentScene.companionProgressT,
        stage: window.sceneManager.currentScene.phase6State?.state.stage,
        peerReady: window.sceneManager.currentScene.peerPhase6Ready };
    }).catch(() => null)));
    throw new Error(`Timed out: ${label}; room states ${JSON.stringify(debug)}; errors ${JSON.stringify(errors)}`);
  }
};
const inspect = (page, expression, ...args) => page.evaluate(expression, ...args);
const progress = async (page, t) => page.evaluate(value => {
  const scene = window.sceneManager.currentScene;
  scene.progressT = value;
  scene.updateTransforms();
  scene.broadcaster.forceSend(scene.movementState());
}, t);
const screenshot = (page, name) => process.env.PHASE6_SCREENSHOTS === '1' ?
  page.screenshot({ path: path.join(output, `phase6_${name}.png`) }) : Promise.resolve();
const click = (page, selector) => page.evaluate(query => {
  const button = document.querySelector(query);
  if (!button) throw new Error(`Missing button ${query}`);
  button.click();
}, selector);
const assert = (condition, message) => { if (!condition) throw new Error(message); console.log(`PASS ${message}`); };

async function advanceHostFromOpening() {
  await host.goto(`${base}/?create=true&mock=true`, { waitUntil: 'domcontentloaded' });
  await wait(host, () => !!document.querySelector('.cinematic-btn'), 'opening start');
  await click(host, '.cinematic-btn');
  await wait(host, () => window.sceneManager?.currentSceneId === 1, 'crafting scene', 40000);
  await wait(host, () => document.querySelectorAll('.craft-card').length >= 4, 'crafting cards');
  for (let i = 0; i < 4; i++) {
    await host.evaluate(index => document.querySelectorAll('.craft-card')[index].click(), i);
    await new Promise(resolve => setTimeout(resolve, 180));
  }
  await wait(host, () => document.querySelector('.cinematic-action-box .cinematic-btn')?.textContent?.includes('Cầm đèn'),
    'lit lantern handoff', 12000);
  await click(host, '.cinematic-action-box .cinematic-btn');
  await wait(host, () => window.sceneManager?.currentSceneId === 2, 'door scene');
  await wait(host, () => document.querySelector('.cinematic-action-box .cinematic-btn')?.textContent?.includes('Bước qua'),
    'door threshold', 15000);
  await click(host, '.cinematic-action-box .cinematic-btn');
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.camera.position.z = -5.7;
    scene.update(0.1, performance.now() / 1000);
  });
  await wait(host, () => window.sceneManager?.currentSceneId === 3, 'village walk');
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.playerZ = -39;
    scene.camera.position.z = -39;
    scene.update(0.016, performance.now() / 1000);
  });
  await wait(host, () => document.querySelector('.cinematic-action-box .cinematic-btn')?.textContent?.includes('Hòa vào'),
    'festival arrival');
  await click(host, '.cinematic-action-box .cinematic-btn');
  await wait(host, () => window.sceneManager?.currentSceneId === 4, 'lion festival');
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.startMemoryAscent();
    scene.ascentTimer = 17.4;
    scene.update(0.1, performance.now() / 1000);
  });
  await new Promise(resolve => setTimeout(resolve, 5500));
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.ascentTimer = 22.4;
    scene.update(0.1, performance.now() / 1000);
  });
  await wait(host, () => window.sceneManager?.currentSceneId === 5, 'modern arrival', 90000);
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.sceneTimer = 21;
    scene.startApproach();
    scene.approachTimer = 9.5;
    scene.update(0.016, performance.now() / 1000);
  });
  await wait(host, () => window.sceneManager.currentScene.approachCompleted, 'festival approach');
  await click(host, '.cinematic-action-box .cinematic-btn');
  await wait(host, () => window.sceneManager?.currentSceneId === 6, 'Phase 5', 40000);
  console.log('PASS Continuous host session: opening through Phase 5 without reload');
}

try {
  console.log(`Phase 6 ${live ? 'live Supabase' : 'mock BroadcastChannel'} two-browser test`);
  const fromPhase5 = process.env.PHASE6_FROM_PHASE5 === '1';
  if (process.env.PHASE6_FULL_HOST === '1') await advanceHostFromOpening();
  else await host.goto(`${base}/?scene=${fromPhase5 ? 6 : 7}&create=true${live ? '' : '&mock=true'}`, { waitUntil: 'domcontentloaded' });
  await wait(host, () => window.sceneManager?.currentScene?.roomManager?.isConnected, 'host room connection', live ? 60000 : 20000);
  if (process.env.PHASE6_RENDER_HOST !== '1')
    await host.evaluate(() => { window.game.renderer.render = () => {}; });
  else await host.evaluate(() => {
    const renderer = window.game.renderer;
    const render = renderer.render.bind(renderer);
    window.__renderSamples = [];
    renderer.render = scene => {
      const id = window.sceneManager.currentSceneId;
      const start = performance.now();
      render(scene);
      if (id >= 7) window.__renderSamples.push({ id, ms: performance.now() - start });
    };
  });
  const room = await inspect(host, () => window.sceneManager.currentScene.roomManager.roomId);
  await guest.goto(`${base}/?scene=${fromPhase5 ? 6 : 7}&room=${room}${live ? '' : '&mock=true'}`, { waitUntil: 'domcontentloaded' });
  await wait(guest, () => !!window.game?.renderer, 'guest renderer');
  await guest.evaluate(() => { window.game.renderer.render = () => {}; });
  await wait(host, () => window.sceneManager.currentScene.roomManager.hasCompanion, 'host pair', 90000);
  await wait(guest, () => window.sceneManager.currentScene.roomManager.hasCompanion, 'guest pair', 90000);
  assert(await inspect(host, () => window.sceneManager.currentScene.role) === 'host' &&
    await inspect(guest, () => window.sceneManager.currentScene.role) === 'guest', 'Host and guest roles assigned');

  if (fromPhase5) {
    await guest.evaluate(() => window.sceneManager.currentScene.applySwitchState(true, true));
    await wait(host, () => window.sceneManager.currentScene.isRemoteSwitchOn, 'Phase 5 switch sync');
    console.log('Advancing Phase 5 destination');
    for (const page of [host, guest]) {
      await page.evaluate(() => {
        const scene = window.sceneManager.currentScene;
        scene.progressT = 0.98; scene.updatePositions(); scene.onDestinationReached();
      });
    }
    await wait(host, () => window.sceneManager.currentScene.handoffPresented, 'host handoff');
    await wait(guest, () => window.sceneManager.currentScene.handoffPresented, 'guest handoff');
    console.log('Entering Phase 6 from both handoff buttons');
    await host.evaluate(() => document.querySelector('.cinematic-btn').click());
    await guest.evaluate(() => document.querySelector('.cinematic-btn').click());
  }
  await wait(host, () => window.sceneManager.currentScene?.routeId === 'route_shared', 'host Phase 6');
  await wait(guest, () => window.sceneManager.currentScene?.routeId === 'route_shared', 'guest Phase 6');
  await wait(host, () => window.sceneManager.currentScene.peerPhase6Ready, 'host Phase 6 peer');
  await wait(guest, () => window.sceneManager.currentScene.peerPhase6Ready, 'guest Phase 6 peer');
  if (fromPhase5) {
    assert(await inspect(host, () => !window.sceneManager.currentScene.playerLantern.isLit &&
      window.sceneManager.currentScene.remoteLantern.isLit) &&
      await inspect(guest, () => window.sceneManager.currentScene.playerLantern.isLit &&
        !window.sceneManager.currentScene.remoteLantern.isLit),
    'Both lantern switch states survive the Phase 5 to 6 handoff');
  }
  assert(await inspect(host, () => window.sceneManager.currentScene.roomManager.hasCompanion),
    'Both Phase 6 browsers retain room Presence');
  const routeGaps = await inspect(host, async () => {
    const { PHASE6_ROUTES } = await import('/src/scenes/Phase6Routes.ts');
    const distance = (a, b) => PHASE6_ROUTES[a].getPointAt(1).distanceTo(PHASE6_ROUTES[b].getPointAt(0));
    return [distance('route_shared', 'route_player_A'), distance('route_shared', 'route_player_B'),
      distance('route_player_A', 'route_player_A_rejoin'),
      distance('route_player_B', 'route_player_B_rejoin'),
      distance('route_player_A_rejoin', 'route_reunited_gate'),
      distance('route_player_B_rejoin', 'route_reunited_gate')];
  });
  assert(routeGaps.every(gap => gap < 0.01), 'Split and reunion routes meet without spatial jumps');
  await host.evaluate(() => {
    const scene = window.sceneManager.currentScene;
    scene.keyHold = true; scene.updateInput();
    for (let i = 0; i < 12; i++) scene.update(0.1, performance.now() / 1000);
    scene.keyHold = false; scene.updateInput();
  });
  assert(await inspect(host, () => window.sceneManager.currentScene.progressT) > 0.02,
    'Held movement advances semantic Phase 6 route progress');
  await progress(host, 0); await progress(guest, 0);
  await screenshot(host, '01_promenade');

  await progress(host, 0.58); await progress(guest, 0.58);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.stage === 'ELDER_PUZZLE', 'elder host');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.stage === 'ELDER_PUZZLE', 'elder guest');
  console.log('Both at elder puzzle');
  await screenshot(host, '02_elder');
  await click(guest, '[data-answer="lantern"]');
  await click(host, '[data-answer="moon"]');
  await wait(guest, () => !!window.sceneManager.currentScene.phase6State.state.elderFeedback, 'elder retry');
  assert(!await inspect(host, () => window.sceneManager.currentScene.phase6State.state.elderResolved),
    'Disagreement allows retry without room reset');
  await click(host, '[data-answer="moon"]'); await click(guest, '[data-answer="moon"]');
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.elderResolved, 'elder resolved');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.elderResolved, 'elder guest resolved');
  console.log('Elder puzzle resolved');
  assert(await inspect(guest, () => window.sceneManager.currentScene.roomManager.hasCompanion), 'Both remain connected after elder puzzle');

  await progress(host, 0.96); await progress(guest, 0.96);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.separated, 'separation host');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.separated, 'separation guest');
  await wait(host, () => window.sceneManager.currentScene.routeId === 'route_player_A', 'host split', 10000);
  await wait(guest, () => window.sceneManager.currentScene.routeId === 'route_player_B', 'guest split', 10000);
  console.log('Routes split');
  assert(await inspect(host, () => window.sceneManager.currentScene.togetherMode) === 'SEPARATED_MODE' &&
    !await inspect(guest, () => window.sceneManager.currentScene.remoteLanternVisible),
    'Distinct routeIds and hidden remote lantern with active Presence');
  await screenshot(guest, '03_separated');

  await progress(host, 1);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.gateDiscovered, 'one lantern at gate');
  assert(!await inspect(host, () => window.sceneManager.currentScene.phase6State.state.gateReady),
    'One lantern cannot ready or open Inner Gate');
  await progress(guest, 1);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.stage === 'MEMORY_PUZZLE', 'memory starts');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.stage === 'MEMORY_PUZZLE', 'memory guest starts');
  console.log('Memory puzzle started');
  assert(await inspect(host, () => !!document.querySelector('.featured img')) &&
    await inspect(guest, () => document.querySelectorAll('[data-card-id]').length === 4),
    'Viewer sees one memory; chooser sees four cards');
  await screenshot(guest, '04_memory_choices');

  // Refresh at a shared checkpoint: host snapshot restores the guest's story state.
  const guestId = await inspect(guest, () => window.sceneManager.currentScene.roomManager.clientId);
  await guest.reload({ waitUntil: 'domcontentloaded' });
  await wait(guest, () => window.sceneManager.currentScene?.routeId === 'route_player_B', 'guest route restored', 30000);
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.stage === 'MEMORY_PUZZLE', 'memory restored', 30000);
  assert(await inspect(guest, () => window.sceneManager.currentScene.roomManager.clientId) === guestId,
    'Refresh preserves identity, split route and memory checkpoint');
  await wait(host, () => window.sceneManager.currentScene.roomManager.hasCompanion, 'host rejoin', 30000);

  await click(guest, '[data-card-id="moon_bamboo"]');
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.memoryRound === 1, 'memory round 1');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.memoryRound === 1, 'memory round 1 guest');
  assert(await inspect(guest, () => !!document.querySelector('.featured img')) &&
    await inspect(host, () => document.querySelectorAll('[data-card-id]').length === 4),
    'Memory roles reverse in round two');
  await click(host, '[data-card-id="star_lantern"]');
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.memorySolved, 'memory solved');
  await wait(guest, () => window.sceneManager.currentScene.routeId === 'route_player_B_rejoin', 'guest reunion route');
  console.log('Memory puzzle resolved');
  assert(await inspect(host, () => window.sceneManager.currentScene.routeId) === 'route_player_A_rejoin',
    'Memory success starts independent reunion routes');

  await progress(host, 1); await progress(guest, 1);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.reunited, 'reunion host');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.reunited, 'reunion guest');
  console.log('Reunion resolved');
  await wait(host, () => window.sceneManager.currentScene.remoteLanternVisible, 'remote lantern returns');
  assert(await inspect(host, () => window.sceneManager.currentScene.togetherMode) === 'TOGETHER_MODE' &&
    await inspect(guest, () => window.sceneManager.currentScene.routeId) === 'route_reunited_gate',
    'Reunion restores Together Mode and shared gate route');
  await screenshot(host, '05_reunion');

  const firstGate = process.env.PHASE6_GATE_GUEST_FIRST === '1' ? guest : host;
  const secondGate = firstGate === host ? guest : host;
  await progress(firstGate, 1);
  await wait(firstGate, () => {
    const scene = window.sceneManager.currentScene;
    return scene.phase6State.state.gatePlayersReady[scene.role];
  }, 'first gate socket');
  assert(!await inspect(firstGate, () => window.sceneManager.currentScene.phase6State.state.gateReady),
    'Gate remains closed until second lantern arrives');
  await progress(secondGate, 1);
  await wait(host, () => window.sceneManager.currentScene.phase6State.state.gateReady, 'gate ready');
  await wait(guest, () => window.sceneManager.currentScene.phase6State.state.gateReady, 'guest gate ready');
  assert(await inspect(host, () => window.sceneManager.currentScene.phase6State.state.gateOpening) &&
    await inspect(guest, () => window.sceneManager.currentScene.environment.gatePanel.children.length > 0) &&
    await inspect(host, () => window.sceneManager.currentSceneId) === 7,
    'Both sockets activate while Phase 7 remains unrevealed');
  await screenshot(host, '06_gate_ready');
  if (process.env.PHASE6_RENDER_HOST === '1') await host.bringToFront();
  const handoffIdentity = await inspect(host, () => ({
    roomId: window.sceneManager.currentScene.roomManager.roomId,
    lantern: window.sceneManager.currentScene.playerLantern.group.uuid,
    world: window.sceneManager.currentScene.scene.uuid
  }));
  await wait(host, () => window.sceneManager.currentSceneId === 8, 'host Phase 7 handoff', 60000);
  await wait(guest, () => window.sceneManager.currentSceneId === 8, 'guest Phase 7 handoff', 60000);
  if (process.env.PHASE6_RENDER_HOST === '1') {
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log('Phase 7 entry frames (ms):', JSON.stringify(await inspect(host, () =>
      ({ frames: window.__renderSamples?.filter(frame => frame.id === 8).slice(0, 8),
        scene: window.sceneManager.currentSceneId,
        finished: window.sceneManager.currentScene.isFinished }))));
  }
  assert(await inspect(host, identity => {
    const scene = window.sceneManager.currentScene;
    return scene.roomManager.roomId === identity.roomId &&
      scene.playerLantern.group.uuid === identity.lantern &&
      scene.scene.uuid === identity.world && scene.roomManager.hasCompanion;
  }, handoffIdentity), 'Phase 7 preserves the room, lantern and Three.js world');
  assert(await inspect(guest, () => window.sceneManager.currentScene.roomManager.hasCompanion &&
    window.sceneManager.currentScene.playerLantern.group.visible &&
    window.sceneManager.currentScene.remoteLantern.group.visible),
    'Both lanterns remain present on the guest finale');
  await wait(host, () => window.sceneManager.currentScene.messageBeats.length >= 4,
    'final wish content loaded');
  assert(await inspect(host, () => window.sceneManager.currentScene.finaleSky.group.visible === false),
    'Fireworks stay hidden before the personal message');
  const messageStates = await Promise.all([host, guest].map(page => inspect(page, () => {
    const scene = window.sceneManager.currentScene;
    return { beats: scene.messageBeats, end: scene.getMessageEndTime() };
  })));
  assert(JSON.stringify(messageStates[0].beats) === JSON.stringify(messageStates[1].beats) &&
    messageStates[0].beats.some(beat => /[ăâđêôơư]/i.test(beat)),
  'Both clients load the same Vietnamese final wish');
  for (const page of [host, guest]) {
    await page.evaluate(() => {
      const scene = window.sceneManager.currentScene;
      const checkpoints = [6.3, 13.4, 21.7, 26.1, scene.getMessageEndTime() + 4,
        scene.getMessageEndTime() + 18, scene.getMessageEndTime() + 30.2];
      for (const t of checkpoints) {
        scene.elapsed = t - 0.016;
        scene.update(0.016, t);
      }
    });
  }
  assert(await inspect(host, () => window.sceneManager.currentScene.isFinished &&
    window.sceneManager.currentScene.fadeLayer.style.opacity === '1' &&
    window.sceneManager.currentScene.fadeLayer.style.pointerEvents === 'auto' &&
    window.sceneManager.getActiveThreeScene() === null) &&
    await inspect(guest, () => window.sceneManager.currentScene.isFinished &&
      window.sceneManager.currentScene.fadeLayer.style.opacity === '1'),
  'Both clients reach stable black ending without further scene rendering');
  assert(await inspect(host, async () => {
    const { audioManager } = await import('/src/audio/AudioManager.ts');
    return audioManager.modernDrumInterval === null &&
      audioManager.vistaAmbienceInterval === null &&
      window.sceneManager.currentScene.firedCues.size === 4;
  }), 'Final audio intervals stop and each story cue fires once');
  if (process.env.PHASE6_RENDER_HOST === '1') {
    const frames = await inspect(host, () => window.__renderSamples
      .filter(frame => frame.id === 8).slice(0, 8));
    console.log('Phase 7 rendered host frames (ms):', JSON.stringify(frames));
  }
  assert(errors.length === 0, `No browser runtime errors (${errors.join('; ')})`);
  console.log('ALL PHASE 6 AND PHASE 7 HANDOFF CHECKS PASSED');
} finally {
  await browser.close();
}
