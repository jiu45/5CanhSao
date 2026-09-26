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
  console.log('Navigating to Phase 6...');
  await page.goto('http://127.0.0.1:5173/?scene=7&create=true&mock=true', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.sceneManager?.currentScene?.memoryDeck, { timeout: 60000, polling: 250 });
  console.log('Phase 6 loaded.');

  const shots = [
    {
      id: 'p6_shot01_leaving_lantern_court',
      desc: '1. Leaving Lantern Court (Phase 5 Tháp Đèn Kéo Quân in background, entering promenade)',
      routeId: 'route_shared', t: 0.04, stage: 'PHASE6_ENTER_PROMENADE',
      role: 'host', separated: false, gateReady: false, elderResolved: false, memorySolved: false
    },
    {
      id: 'p6_shot02_early_promenade',
      desc: '2. Early promenade (Stalls, lantern strings, low crowd density)',
      routeId: 'route_shared', t: 0.25, stage: 'PHASE6_ENTER_PROMENADE',
      role: 'host', separated: false, gateReady: false, elderResolved: false, memorySolved: false
    },
    {
      id: 'p6_shot03_elder_pavilion',
      desc: '3. Approaching Elder pavilion (Island of calm, tea table, lantern, elder silhouette)',
      routeId: 'route_shared', t: 0.50, stage: 'PHASE6_ENTER_PROMENADE',
      role: 'host', separated: false, gateReady: false, elderResolved: false, memorySolved: false
    },
    {
      id: 'p6_shot04_puzzle_framing',
      desc: '4. Elder puzzle framing (Overlay with four choices, both lanterns present)',
      routeId: 'route_shared', t: 0.58, stage: 'ELDER_PUZZLE',
      role: 'host', separated: false, gateReady: false, elderResolved: false, memorySolved: false
    },
    {
      id: 'p6_shot05_crowd_buildup',
      desc: '5. Crowd buildup after Elder puzzle (Festival energy rising, more silhouettes)',
      routeId: 'route_shared', t: 0.76, stage: 'PHASE6_ENTER_PROMENADE',
      role: 'host', separated: false, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot06_pre_separation',
      desc: '6. Pre-separation crowd corridor (Narrowing corridor, dense pedestrian silhouettes)',
      routeId: 'route_shared', t: 0.92, stage: 'PHASE6_ENTER_PROMENADE',
      role: 'host', separated: false, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot07_separation_occlusion',
      desc: '7. Separation occlusion (Crossing crowd cuts between the two star lanterns)',
      routeId: 'route_shared', t: 0.96, stage: 'SEPARATION_STARTED',
      role: 'host', separated: true, separationElapsed: 0.35, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot08_post_separation_lonely_state',
      desc: '8. Post-separation lonely state (Host alone on route A, partner lantern gone)',
      routeId: 'route_player_A', t: 0.20, stage: 'GATE_DISCOVERED',
      role: 'host', separated: true, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot09_inner_gate_discovery',
      desc: '9. Inner Gate discovery (Single lantern at closed gate, cannot open without partner)',
      routeId: 'route_player_A', t: 0.98, stage: 'GATE_DISCOVERED',
      role: 'host', separated: true, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot10_moon_guardian_area',
      desc: '10. Moon Guardian area (Guest approaching Moon Guardian alcove on route B)',
      routeId: 'route_player_B', t: 0.85, stage: 'GATE_DISCOVERED',
      role: 'guest', separated: true, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot11_memory_card_presentation',
      desc: '11. Memory-card presentation (Guest selecting from 4 memory cards)',
      routeId: 'route_player_B', t: 1.0, stage: 'MEMORY_PUZZLE',
      role: 'guest', separated: true, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot12_correct_memory_response',
      desc: '12. Correct memory response / Featured card (Host viewing target memory card)',
      routeId: 'route_player_A', t: 1.0, stage: 'MEMORY_PUZZLE',
      role: 'host', separated: true, gateReady: false, elderResolved: true, memorySolved: false
    },
    {
      id: 'p6_shot13_first_remote_lantern_reappearance',
      desc: '13. First remote-lantern reappearance (Distant glow of partner lantern reappearing on reunion path)',
      routeId: 'route_player_A_rejoin', t: 0.72,
      stage: 'REUNION_ROUTE', role: 'host', separated: true, gateReady: false, elderResolved: true, memorySolved: true
    },
    {
      id: 'p6_shot14_reunion',
      desc: '14. Reunion (Both lanterns reunited together at start of final route)',
      routeId: 'route_reunited_gate', t: 0.20, remoteRouteId: 'route_reunited_gate', remoteT: 0.20,
      stage: 'PLAYERS_REUNITED', role: 'host', separated: false, gateReady: false, elderResolved: true, memorySolved: true
    },
    {
      id: 'p6_shot15_final_shared_route',
      desc: '15. Final shared route (Ceremonial walk toward Inner Gate together)',
      routeId: 'route_reunited_gate', t: 0.65, remoteRouteId: 'route_reunited_gate', remoteT: 0.65,
      stage: 'PLAYERS_REUNITED', role: 'host', separated: false, gateReady: false, elderResolved: true, memorySolved: true
    },
    {
      id: 'p6_shot16_inner_gate_activation',
      desc: '16. Inner Gate activation (Both lanterns in sockets, golden lines illuminating)',
      routeId: 'route_reunited_gate', t: 1.0, remoteRouteId: 'route_reunited_gate', remoteT: 1.0,
      stage: 'PHASE6_COMPLETE', role: 'host', separated: false, gateReady: true, elderResolved: true, memorySolved: true
    }
  ];

  let captured = 0;
  for (const shot of shots) {
    if (process.argv[2] && !shot.id.includes(process.argv[2])) continue;
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
      scene.remoteInterpolator.currentRouteId = s.remoteRouteId ?? s.routeId;
      scene.remoteInterpolator.currentProgressT = s.remoteT ?? s.t;
      scene.phase6State.state.stage = s.stage;
      scene.phase6State.state.separated = s.separated;
      scene.phase6State.state.elderResolved = s.elderResolved;
      scene.phase6State.state.memorySolved = s.memorySolved;
      scene.phase6State.state.splitArrivals = {
        host: s.stage === 'MEMORY_PUZZLE' || s.memorySolved,
        guest: s.stage === 'MEMORY_PUZZLE' || s.memorySolved
      };
      scene.phase6State.state.reunited = s.stage === 'PLAYERS_REUNITED' || s.gateReady;
      scene.phase6State.state.gateReady = s.gateReady;
      scene.phase6State.state.gatePlayersReady = { host: s.gateReady, guest: s.gateReady };
      scene.phase6State.state.revision++;
      scene.togetherMode = s.separated ? 'SEPARATED_MODE' : 'TOGETHER_MODE';

      if (s.stage === 'SEPARATION_STARTED') {
        scene.separationElapsed = s.separationElapsed ?? 0.35;
        scene.environment.beginSeparation();
      } else {
        scene.separationElapsed = -1;
      }

      const crowdProgress = s.routeId === 'route_shared' ? s.t : 1;
      scene.environment.setCrowdDensity(crowdProgress);
      scene.environment.setGatePresence(s.gateReady, s.gateReady, s.gateReady);
      if (s.gateReady) scene.environment.update(3, 3);
      scene.updateTransforms();
      scene.updateCamera(1, true);
      scene.puzzleOverlay.render(scene.phase6State.state, scene.role, scene.memoryDeck);
      scene.updateHud();
    }, shot);

    await new Promise(resolve => setTimeout(resolve, 800));

    const testPath = path.join(testDir, `${shot.id}.png`);
    await page.screenshot({ path: testPath });
    captured++;
    console.log(`[Captured] ${shot.id}.png -> ${shot.desc}`);
  }
  console.log(`${captured} inspection screenshots captured successfully!`);
} finally {
  await browser.close();
}
