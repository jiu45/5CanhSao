import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve('test-artifacts');
fs.mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await page.goto('http://127.0.0.1:5173/?scene=7&create=true&mock=true', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.sceneManager?.currentScene?.memoryDeck,
    { timeout: 60000, polling: 250 });
  const shots = [
    ['promenade', 'route_shared', 0.23, 'PHASE6_ENTER_PROMENADE', false, false],
    ['elder', 'route_shared', 0.58, 'ELDER_PUZZLE', false, false],
    ['crowd_crossing', 'route_shared', 0.96, 'SEPARATION_STARTED', true, false],
    ['separated', 'route_player_A', 0.48, 'GATE_DISCOVERED', true, false],
    ['memory', 'route_player_A', 1, 'MEMORY_PUZZLE', true, false],
    ['memory_choices', 'route_player_B', 1, 'MEMORY_PUZZLE', true, false],
    ['host_rejoin', 'route_player_A_rejoin', 0.4, 'REUNION_ROUTE', true, false],
    ['guest_rejoin', 'route_player_B_rejoin', 0.4, 'REUNION_ROUTE', true, false],
    ['reunion', 'route_reunited_gate', 0.23, 'PLAYERS_REUNITED', false, false],
    ['gate_ready', 'route_reunited_gate', 1, 'PHASE6_COMPLETE', false, true]
  ];
  for (const [name, routeId, t, stage, separated, gateReady] of shots) {
    const selected = process.argv[2] || process.env.PHASE6_CAPTURE;
    if (selected && selected !== name) continue;
    await page.evaluate(({ routeId, t, stage, separated, gateReady }) => {
      const scene = window.sceneManager.currentScene;
      scene.roomManager.companionPresence = {
        clientId: 'visual-partner', role: 'guest', lanternType: 'modern', joinedAt: 1, isOnline: true
      };
      scene.role = routeId.includes('player_B') ? 'guest' : 'host';
      scene.peerPhase6Ready = true;
      scene.routeId = routeId; scene.progressT = t;
      scene.remoteInterpolator.currentRouteId = routeId;
      scene.remoteInterpolator.currentProgressT = t;
      scene.phase6State.state.stage = stage;
      scene.phase6State.state.separated = separated;
      scene.phase6State.state.memorySolved = stage === 'REUNION_ROUTE' ||
        stage === 'PLAYERS_REUNITED' || gateReady;
      scene.phase6State.state.splitArrivals = { host: stage === 'MEMORY_PUZZLE', guest: stage === 'MEMORY_PUZZLE' };
      scene.phase6State.state.reunited = stage === 'PLAYERS_REUNITED' || gateReady;
      scene.phase6State.state.gateReady = gateReady;
      scene.phase6State.state.gatePlayersReady = { host: gateReady, guest: gateReady };
      scene.phase6State.state.revision++;
      scene.togetherMode = separated ? 'SEPARATED_MODE' : 'TOGETHER_MODE';
      if (stage === 'SEPARATION_STARTED') {
        scene.separationElapsed = 0.25;
        scene.environment.beginSeparation();
      } else {
        scene.separationElapsed = -1;
      }
      scene.environment.setCrowdDensity(routeId === 'route_shared' ? t : 1);
      scene.environment.setGatePresence(gateReady, gateReady, gateReady);
      scene.updateTransforms(); scene.updateCamera(1, true);
      scene.puzzleOverlay.render(scene.phase6State.state, scene.role, scene.memoryDeck);
    }, { routeId, t, stage, separated, gateReady });
    await new Promise(resolve => setTimeout(resolve, 700));
    await page.screenshot({ path: path.join(output, `phase6_${name}.png`) });
    const renderInfo = await page.evaluate(() => {
      const info = window.game?.renderer?.renderer?.info;
      return info ? { geometries: info.memory.geometries,
        textures: info.memory.textures } : null;
    });
    console.log(`Captured phase6_${name}.png`, renderInfo);
  }
} finally { await browser.close(); }
