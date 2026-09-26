import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\3e507bca-0efa-4051-82db-870e761428c6';
const testDir = path.resolve('test-artifacts');
fs.mkdirSync(testDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:5173/?scene=5', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const shots = [
    {
      id: 'p4_shot01_first_present_reveal',
      desc: '01. First present reveal after Moon transition (Stage 0 handoff)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.sceneTimer = 0.2;
        scene.stage = 0;
        scene.camera.position.set(0, 10.0, 10.0);
        scene.camera.lookAt(0, 16.5, -24.0);
      }
    },
    {
      id: 'p4_shot02_moon_sculpture_hero',
      desc: '02. Moon sculpture hero shot (Stage 1 player closeup & glowing Moon ring)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.sceneTimer = 8.0;
        scene.stage = 1;
        scene.camera.position.set(0.55, 2.35, 4.20);
        scene.camera.lookAt(0.95, 1.95, 3.70);
      }
    },
    {
      id: 'p4_shot03_elevated_park_viewpoint',
      desc: '03. Elevated park viewpoint (Stage 3 master overlook framing terrace & illuminated steps)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.sceneTimer = 19.0;
        scene.stage = 3;
        scene.camera.position.set(0.0, 3.25, 4.4);
        scene.camera.lookAt(0.0, 1.35, -22.0);
      }
    },
    {
      id: 'p4_shot04_first_distant_festival_reveal',
      desc: '04. First distant festival reveal (Stage 4 revolving vista reveal)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.isTurningToVista = false;
        scene.isVistaRevealed = true;
        scene.vistaTimer = 6.0;
        scene.stage = 4;
        scene.camera.position.set(0.4, 3.4, 4.1);
        scene.camera.lookAt(88.0, 1.5, -20.0);
        scene.overlay.setSubtitle("Quay sang phía tiếng nhạc... Tháp Đèn Kéo Quân khổng lồ xoay chuyển rực rỡ giữa lòng đại quảng trường!", 5000);
      }
    },
    {
      id: 'p4_shot05_park_approach',
      desc: '05. Park approach (Phase 4C mid-approach walking along illuminated S-curve curve)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.isApproaching = true;
        scene.approachProgress = 0.50;
        const p = scene.approachPathCurve.getPointAt(0.50);
        const t = scene.approachPathCurve.getTangentAt(0.50).normalize();
        scene.playerMesh.position.copy(p);
        scene.lantern.group.position.copy(p).add(new THREE.Vector3(0.35, 0.45, 0.2));
        scene.camera.position.copy(p).addScaledVector(t, -4.2).add(new THREE.Vector3(0, 2.1, 0));
        scene.camera.lookAt(p.clone().addScaledVector(t, 12).add(new THREE.Vector3(0, 1.2, 0)));
        scene.overlay.setSubtitle("Từng bước tiến về phía đại quảng trường rộn rã...", 5000);
      }
    },
    {
      id: 'p4_shot06_phase4c_final_position',
      desc: '06. Phase 4C final position (Destination threshold ~26m before gate with invitation button)',
      setup: () => {
        const scene = window.sceneManager.currentScene;
        scene.isApproaching = true;
        scene.approachProgress = 1.0;
        const p = scene.approachPathCurve.getPointAt(1.0);
        const t = scene.approachPathCurve.getTangentAt(1.0).normalize();
        scene.playerMesh.position.copy(p);
        scene.lantern.group.position.copy(p).add(new THREE.Vector3(0.35, 0.45, 0.2));
        scene.camera.position.set(48.5, 2.2, -5.0);
        scene.camera.lookAt(88.0, 1.5, -20.0);
        scene.overlay.setSubtitle("Đã đến lối vào lễ hội. Đứng đây ngắm nhìn Tháp Đèn Kéo Quân rực rỡ phía trước...", 0);
        scene.overlay.showNextButton("Cùng bước vào lễ hội 🏮", () => {});
      }
    }
  ];

  for (const shot of shots) {
    await page.evaluate(shot.setup);
    await new Promise(r => setTimeout(r, 600));
    const brainPath = path.join(brainDir, `${shot.id}.png`);
    const testPath = path.join(testDir, `${shot.id}.png`);
    await page.screenshot({ path: brainPath });
    fs.copyFileSync(brainPath, testPath);
    console.log(`[Captured] ${shot.id}.png -> ${shot.desc}`);
  }

  await browser.close();
  console.log('Phase 4 audit captures complete!');
}

run().catch(console.error);
