import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const testDir = path.resolve('test-artifacts');
fs.mkdirSync(testDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  protocolTimeout: 120000,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await page.goto('http://127.0.0.1:5173/?scene=7&create=true&mock=true', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.sceneManager?.currentScene?.memoryDeck, { timeout: 60000, polling: 250 });

  const shots = [
    {
      id: 'step1_after_promenade_sightline',
      desc: 'Promenade sightline at t=0.76 (Inner Gate completely hidden behind festival partition and bamboo)',
      routeId: 'route_shared', t: 0.76, role: 'host', stage: 'PHASE6_ENTER_PROMENADE',
      separated: false, gateReady: false, elderResolved: true
    },
    {
      id: 'step1_after_pre_separation_corridor',
      desc: 'Corridor at t=0.92 before separation (Guarded reveal preserved, gate not visible)',
      routeId: 'route_shared', t: 0.92, role: 'host', stage: 'PHASE6_ENTER_PROMENADE',
      separated: false, gateReady: false, elderResolved: true
    },
    {
      id: 'step1_after_moon_alcove',
      desc: 'Player B in Moon Alcove (Secluded garden terrace, serene Moon Guardian, crescent arch, bamboo grove)',
      routeId: 'route_player_B', t: 0.98, role: 'guest', stage: 'GATE_DISCOVERED',
      separated: true, gateReady: false, elderResolved: true
    },
    {
      id: 'step1_after_player_a_gate_discovery',
      desc: 'Player A Inner Gate Discovery (Single lantern discovering closed gate, clean ground, NO z-fighting)',
      routeId: 'route_player_A', t: 0.98, role: 'host', stage: 'GATE_DISCOVERED',
      separated: true, gateReady: false, elderResolved: true
    },
    {
      id: 'step1_after_zfighting_fix_closeup',
      desc: 'Rendezvous plaza and path junction (Polished stone disk, tiered elevations, zero z-fighting/clipping)',
      routeId: 'route_reunited_gate', t: 0.05, role: 'host', stage: 'PLAYERS_REUNITED',
      separated: false, gateReady: false, elderResolved: true, memorySolved: true
    },
    {
      id: 'step1_after_reunion_route',
      desc: 'Reunion route together (Both lanterns together on shared path toward Inner Gate)',
      routeId: 'route_reunited_gate', t: 0.35, role: 'host', stage: 'PLAYERS_REUNITED',
      separated: false, gateReady: false, elderResolved: true, memorySolved: true
    }
  ];

  for (const shot of shots) {
    await page.evaluate((s) => {
      const scene = window.sceneManager.currentScene;
      scene.roomManager.companionPresence = {
        clientId: 'visual-partner',
        role: s.role === 'host' ? 'guest' : 'host',
        lanternType: s.role === 'host' ? 'modern' : 'traditional',
        joinedAt: 1,
        isOnline: true
      };
      scene.role = s.role;
      scene.peerPhase6Ready = true;
      scene.routeId = s.routeId;
      scene.progressT = s.t;
      scene.remoteInterpolator.currentRouteId = s.routeId;
      scene.remoteInterpolator.currentProgressT = s.t;
      scene.phase6State.state.stage = s.stage;
      scene.phase6State.state.separated = s.separated;
      scene.phase6State.state.elderResolved = s.elderResolved;
      scene.phase6State.state.memorySolved = s.memorySolved ?? false;
      scene.phase6State.state.reunited = s.stage === 'PLAYERS_REUNITED';
      scene.phase6State.state.gateReady = s.gateReady;
      scene.phase6State.state.splitArrivals = { host: s.separated, guest: s.separated };
      scene.phase6State.state.revision++;
      scene.togetherMode = s.separated ? 'SEPARATED_MODE' : 'TOGETHER_MODE';

      const crowdProgress = s.routeId === 'route_shared' ? s.t : 1;
      scene.environment.setCrowdDensity(crowdProgress);
      scene.environment.setGatePresence(s.gateReady, s.gateReady, s.gateReady);
      scene.environment.setStoryVisibility(s.routeId);
      scene.updateTransforms();
      scene.updateCamera(1, true);
    }, shot);

    await new Promise(r => setTimeout(r, 700));

    const testPath = path.join(testDir, `${shot.id}.png`);
    await page.screenshot({ path: testPath });
    console.log(`[Captured] ${shot.id}.png -> ${shot.desc}`);
  }
  console.log('Step 1 verification captures complete!');
} finally {
  await browser.close();
}
