import * as THREE from 'three';
import { IScene } from './BaseScene';
import { StarLantern } from '../props/StarLantern';
import { Moon } from '../props/Moon';
import { StoryOverlay } from '../ui/StoryOverlay';
import { StoryConfig } from '../config/StoryConfig';
import { audioManager } from '../audio/AudioManager';
import { TextureGenerator } from '../utils/TextureGenerator';

interface DistantLantern {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  phase: number;
}

interface Firefly {
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  speed: number;
}

export class VillageWalkScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lantern: StarLantern;
  private lanternGroundLight: THREE.PointLight;
  private moon: Moon;
  private overlay: StoryOverlay;
  private onComplete: () => void;

  // Player position & movement along path
  private playerZ: number = -5.8;
  private playerX: number = 0.0;
  private currentSpeed: number = 0.0;
  private maxSpeed: number = 2.4; // eager child running pace
  private isPressingForward: boolean = false;
  private isShielding: boolean = false;
  private footstepAccumulator: number = 0;
  private walkTime: number = 0;
  private speedTimer: number = 0;
  private warningShown: boolean = false;

  // Wind gust mechanics
  private windGustActive: boolean = false;
  private windGustTimer: number = 0;
  private windGustTriggered: boolean = false;
  private unshieldedWindExposure = 0;
  private flameNeedsRelight = false;
  private windLessonCompleted = false;

  // Vignette progression states
  private vignette1Triggered: boolean = false; // Family porch
  private vignette2Triggered: boolean = false; // Running kids
  private vignette3Triggered: boolean = false; // Feast table & frog drum
  private vignette4Triggered: boolean = false; // Temple gate
  private festivalArrived: boolean = false;

  // Environment elements
  private pathMesh!: THREE.Mesh;
  private bambooGroves: THREE.Mesh[] = [];
  private bananaPalms: THREE.Mesh[] = [];
  private distantLanterns: DistantLantern[] = [];
  private fireflies: Firefly[] = [];
  private mistPlanes: THREE.Mesh[] = [];
  private cottageInteriorLight: THREE.PointLight;
  private templeFestivalLight: THREE.PointLight;

  // Story vignettes 3D/2.5D objects
  private porchFamilyGroup!: THREE.Group;
  private runningKidsGroup!: THREE.Group;
  private kidsRunningActive: boolean = false;
  private kidsRunProgress: number = 0;
  private kidRunStartZ: number = 0;
  private teaSteamPlumes: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number; phase: number }[] = [];
  private feastTableGroup!: THREE.Group;
  private templeGateMesh!: THREE.Mesh;
  private festivalBuntingMesh!: THREE.Mesh;

  // Audio timers
  private drumTimer: number = 0;
  private chantTimer: number = 0;
  private whisperTimer: number = 0;
  private timerIds: number[] = [];

  // DOM controls for mobile/mouse shielding
  private shieldUiContainer: HTMLDivElement | null = null;

  // Key listeners
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundPointerDown: () => void;
  private boundPointerUp: () => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    onComplete: () => void
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04091a);
    this.scene.fog = new THREE.FogExp2(0x0a1128, 0.02);
    this.camera = camera;
    this.overlay = overlay;
    this.onComplete = onComplete;

    // 1. Hero Star Lantern (exact model & materials from Phase 1)
    this.lantern = new StarLantern();
    this.lantern.setStep(4);
    this.lantern.group.scale.set(0.56, 0.56, 0.56);
    this.lantern.group.position.set(0.60, 1.02, this.playerZ - 0.68);
    this.lantern.group.rotation.set(0, -Math.PI * 0.18, 0);

    // Warm local pool of light casting onto dirt path and fences
    this.lanternGroundLight = new THREE.PointLight(0xffa238, 2.2, 6.0, 1.8);
    this.lanternGroundLight.position.set(0, -0.65, 0.2);
    this.lantern.group.add(this.lanternGroundLight);

    this.scene.add(this.lantern.group);

    // 2. Large Moon overhead with celestial halo
    this.moon = new Moon();
    this.moon.group.position.set(0, 11.5, -34);
    this.moon.directionalLight.position.set(0, 18, -25);
    this.moon.directionalLight.target.position.set(0, 1.5, -15);
    this.scene.add(this.moon.directionalLight.target);
    this.scene.add(this.moon.group);

    // Soft moonlight ambience
    const ambient = new THREE.AmbientLight(0x1a2642, 0.82);
    this.scene.add(ambient);

    // 3. Warm light leaking from the cottage doorway behind the player
    this.cottageInteriorLight = new THREE.PointLight(0xff9933, 2.2, 10, 1.5);
    this.cottageInteriorLight.position.set(0, 1.8, -4.2);
    this.scene.add(this.cottageInteriorLight);

    // 4. Distant gathering festival light at the temple square
    this.templeFestivalLight = new THREE.PointLight(0xff8822, 4.5, 45, 1.2);
    this.templeFestivalLight.position.set(0, 3.2, -44.0);
    this.scene.add(this.templeFestivalLight);

    // Build the village environment & storytelling vignettes
    this.buildVillageEnvironment();
    this.buildVignettes();

    // Initial camera positioning: behind player looking down the path
    this.camera.position.set(0.0, 1.85, this.playerZ + 2.3);
    this.camera.lookAt(0, 1.9, this.playerZ - 8.5);

    // Bind controls
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundPointerDown = () => { this.isPressingForward = true; };
    this.boundPointerUp = () => { this.isPressingForward = false; };
  }

  private buildVillageEnvironment() {
    // 1. Long Winding Village Dirt Path & Earthy Courtyard
    const groundTex = TextureGenerator.createVillageGroundTexture();
    const groundGeo = new THREE.PlaneGeometry(36, 105);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      color: 0x223034
    });
    this.pathMesh = new THREE.Mesh(groundGeo, groundMat);
    this.pathMesh.rotation.x = -Math.PI / 2;
    this.pathMesh.position.set(0, 0, -42);
    this.pathMesh.receiveShadow = true;
    this.scene.add(this.pathMesh);

    // 2. Exterior facade of the cottage left behind
    this.buildCottageFacade();

    // 3. Bamboo Wattle Fences bordering the path
    this.buildBambooFences();

    // 4. Distant Layered 2D Village Silhouettes (Đình làng, mái ngói cong, rặng tre)
    const roofTex = TextureGenerator.createVillageRoofSilhouette();
    const roofGeo = new THREE.PlaneGeometry(42, 20);
    const roofMat = new THREE.MeshBasicMaterial({
      map: roofTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      fog: false
    });
    const villagePanorama = new THREE.Mesh(roofGeo, roofMat);
    villagePanorama.position.set(0, 5.2, -49);
    this.scene.add(villagePanorama);

    // 5. Framing Bamboo Groves along the path edges
    const bambooTex = TextureGenerator.createBambooGroveSilhouette();
    const bambooGeo = new THREE.PlaneGeometry(4.8, 7.6);
    const bambooMat = new THREE.MeshBasicMaterial({
      map: bambooTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      fog: false
    });

    this.bambooGroves = [];
    const groves = [
      { x: -3.6, z: -9.5, scaleX: 1.0, y: 3.2 },
      { x: -4.8, z: -17.0, scaleX: 1.15, y: 3.4 },
      { x: -3.8, z: -25.0, scaleX: 0.95, y: 3.2 },
      { x: -4.6, z: -33.0, scaleX: 1.1, y: 3.3 },
      { x: -4.2, z: -40.0, scaleX: 1.05, y: 3.3 },
      { x: 3.6, z: -10.0, scaleX: -1.0, y: 3.2 },
      { x: 4.8, z: -18.5, scaleX: -1.2, y: 3.5 },
      { x: 3.8, z: -26.5, scaleX: -0.9, y: 3.2 },
      { x: 4.6, z: -34.5, scaleX: -1.15, y: 3.4 },
      { x: 4.2, z: -41.0, scaleX: -1.0, y: 3.3 }
    ];
    groves.forEach(cfg => {
      const g = new THREE.Mesh(bambooGeo, bambooMat);
      g.position.set(cfg.x, cfg.y, cfg.z);
      g.scale.set(cfg.scaleX, 1, 1);
      this.scene.add(g);
      this.bambooGroves.push(g);
    });

    // 6. Banana Palm Leaves arching over fences
    const palmTex = TextureGenerator.createBananaPalmSilhouette();
    const palmGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const palmMat = new THREE.MeshBasicMaterial({
      map: palmTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      fog: false
    });

    this.bananaPalms = [];
    const palmConfigs = [
      { x: -2.7, z: -12.5, rotZ: 0.15, scaleX: 1.0 },
      { x: 2.7, z: -21.0, rotZ: -0.18, scaleX: -1.0 },
      { x: -2.8, z: -29.0, rotZ: 0.12, scaleX: 1.0 },
      { x: 2.9, z: -37.0, rotZ: -0.14, scaleX: -1.0 }
    ];
    palmConfigs.forEach(cfg => {
      const p = new THREE.Mesh(palmGeo, palmMat);
      p.position.set(cfg.x, 2.1, cfg.z);
      p.scale.set(cfg.scaleX, 1, 1);
      p.rotation.z = cfg.rotZ;
      this.scene.add(p);
      this.bananaPalms.push(p);
    });

    // 7. Floating Autumn Fireflies
    const fireflyTex = TextureGenerator.createFireflyTexture();
    const fireflyGeo = new THREE.PlaneGeometry(0.18, 0.18);
    this.fireflies = [];

    for (let i = 0; i < 48; i++) {
      const ffMat = new THREE.MeshBasicMaterial({
        map: fireflyTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ffMesh = new THREE.Mesh(fireflyGeo, ffMat);

      const bx = (Math.random() - 0.5) * 8.5;
      const by = 0.8 + Math.random() * 2.2;
      const bz = -6.0 - Math.random() * 38.0;

      ffMesh.position.set(bx, by, bz);
      this.scene.add(ffMesh);

      this.fireflies.push({
        mesh: ffMesh,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8
      });
    }

    // 8. Low Ground Night Mist Ribbons
    const mistTex = TextureGenerator.createNightMistTexture();
    const mistGeo = new THREE.PlaneGeometry(32, 2.5);
    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mistPlanes = [];
    [-9.0, -17.5, -26.0, -35.0, -42.0].forEach((mz, idx) => {
      const m = new THREE.Mesh(mistGeo, mistMat.clone());
      m.position.set(0, 0.45 + idx * 0.12, mz);
      this.scene.add(m);
      this.mistPlanes.push(m);
    });

    // 9. Distant Festival Lanterns gathering at the temple
    this.distantLanterns = [];
    for (let j = 0; j < 36; j++) {
      const clusterGroup = new THREE.Group();
      const sGeo = new THREE.PlaneGeometry(0.32, 0.32);
      const colors = [0xff3a10, 0xf59e0b, 0xffcc33, 0xff4422, 0xff7722];
      const sMat = new THREE.MeshBasicMaterial({
        color: colors[j % colors.length],
        transparent: true,
        opacity: 0.95
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.rotation.z = Math.PI / 4;
      clusterGroup.add(sMesh);

      const cx = (Math.random() - 0.5) * 8.5;
      const cy = 1.3 + Math.random() * 1.8;
      const cz = -47.0 - Math.random() * 4.0;

      clusterGroup.position.set(cx, cy, cz);
      this.scene.add(clusterGroup);
      this.distantLanterns.push({
        group: clusterGroup,
        baseX: cx,
        baseY: cy,
        phase: j * 0.45
      });
    }
  }

  private buildCottageFacade() {
    const woodTex = TextureGenerator.createWoodTexture('#3e2515', '#221308');
    const darkWoodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x162238, roughness: 0.9 });

    // Left and right walls flanking the door
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.5, 0.25), wallMat);
    wallL.position.set(-3.1, 2.75, -5.0);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.5, 0.25), wallMat);
    wallR.position.set(3.1, 2.75, -5.0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 0.25), wallMat);
    lintel.position.set(0, 4.55, -5.0);

    // Open wooden door panels
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.08, 3.6, 0.08), darkWoodMat);
    doorL.position.set(-1.15, 1.8, -4.5);
    doorL.rotation.y = -Math.PI * 0.45;

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.08, 3.6, 0.08), darkWoodMat);
    doorR.position.set(1.15, 1.8, -4.5);
    doorR.rotation.y = Math.PI * 0.45;

    // Wooden threshold step
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.45), darkWoodMat);
    threshold.position.set(0, 0.06, -4.9);

    this.scene.add(wallL, wallR, lintel, doorL, doorR, threshold);
  }

  private buildBambooFences() {
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x3d3020, roughness: 0.75 });
    // Left and right wattle fences bordering the path with courtyard entrance openings
    [-2.6, 2.6].forEach(fx => {
      for (let z = -6; z >= -44; z -= 3.2) {
        // Courtyard gate opening for left porch (Vignette 1)
        if (fx < 0 && z <= -12.5 && z >= -19.5) continue;
        // Courtyard gate opening for right feast table (Vignette 3)
        if (fx > 0 && z <= -26.5 && z >= -32.5) continue;

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), bambooMat);
        post.position.set(fx + (Math.random() - 0.5) * 0.1, 0.7, z);
        post.rotation.z = (Math.random() - 0.5) * 0.08;
        this.scene.add(post);

        [0.35, 0.7, 1.05].forEach(ry => {
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), bambooMat);
          rail.rotation.x = Math.PI / 2;
          rail.position.set(fx, ry, z - 1.6);
          this.scene.add(rail);
        });
      }
    });
  }

  private buildVignettes() {
    // -------------------------------------------------------------
    // VIGNETTE 1: Warm Porch & Rural Family (Hiên nhà thưởng trà phá cỗ)
    // Positioned at z = -16.0, framed through courtyard opening
    // -------------------------------------------------------------
    this.porchFamilyGroup = new THREE.Group();
    this.porchFamilyGroup.position.set(-2.2, 0, -16.0);

    const porchTex = TextureGenerator.createFamilyPorchSilhouette();
    const porchGeo = new THREE.PlaneGeometry(4.2, 3.2);
    const porchMat = new THREE.MeshBasicMaterial({
      map: porchTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    const porchMesh = new THREE.Mesh(porchGeo, porchMat);
    porchMesh.position.set(0, 1.6, 0);
    porchMesh.rotation.y = 0.28;
    this.porchFamilyGroup.add(porchMesh);

    // Floating curling tea steam plumes above the teapot on the table
    const steamTex = TextureGenerator.createTeaSteamTexture();
    const steamMat = new THREE.MeshBasicMaterial({
      map: steamTex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    for (let s = 0; s < 3; s++) {
      const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.7), steamMat.clone());
      const basePos = new THREE.Vector3(-0.15 + (s - 1) * 0.06, 1.02, 0.12);
      sMesh.position.copy(basePos);
      this.porchFamilyGroup.add(sMesh);
      this.teaSteamPlumes.push({
        mesh: sMesh,
        basePos: basePos.clone(),
        speed: 0.45 + s * 0.18,
        phase: s * 1.5
      });
    }

    // Warm lantern light leaking from family veranda
    const porchLight = new THREE.PointLight(0xffaa44, 2.8, 8.0, 1.4);
    porchLight.position.set(0.2, 1.8, 0.2);
    this.porchFamilyGroup.add(porchLight);

    // Hanging red porch lantern under eave
    const hangingLanternGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const hangingLanternMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
    const hangingLantern = new THREE.Mesh(hangingLanternGeo, hangingLanternMat);
    hangingLantern.position.set(0.2, 2.3, 0.4);
    this.porchFamilyGroup.add(hangingLantern);

    // Traditional glazed earthen water jars (Chum gốm sành) beside porch
    const jarGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.65, 12);
    const jarMat = new THREE.MeshStandardMaterial({ color: 0x422615, roughness: 0.6 });
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.set(1.0, 0.32, -0.3);
    this.porchFamilyGroup.add(jar);

    this.scene.add(this.porchFamilyGroup);

    // -------------------------------------------------------------
    // VIGNETTE 2: Village Children Running Past (Lũ trẻ rước đèn cá chép)
    // Sprints dynamically across path when triggered
    // -------------------------------------------------------------
    this.runningKidsGroup = new THREE.Group();
    this.runningKidsGroup.position.set(1.2, 0, -100.0);

    // Running child silhouette
    const childTex = TextureGenerator.createRunningChildSilhouette();
    const childGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const childMat = new THREE.MeshBasicMaterial({
      map: childTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const childMesh = new THREE.Mesh(childGeo, childMat);
    childMesh.position.set(0, 0.9, 0);
    this.runningKidsGroup.add(childMesh);

    // Glowing Carp Lantern held by child
    const carpTex = TextureGenerator.createCarpLanternTexture();
    const carpGeo = new THREE.PlaneGeometry(1.25, 0.95);
    const carpMat = new THREE.MeshBasicMaterial({
      map: carpTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    const carpMesh = new THREE.Mesh(carpGeo, carpMat);
    carpMesh.position.set(0.65, 1.4, 0.1);
    this.runningKidsGroup.add(carpMesh);

    // Warm glow radiating from carp lantern
    const carpLight = new THREE.PointLight(0xff4411, 2.4, 5.5, 1.5);
    carpLight.position.set(0.65, 1.4, 0.1);
    this.runningKidsGroup.add(carpLight);

    this.scene.add(this.runningKidsGroup);

    // -------------------------------------------------------------
    // VIGNETTE 3: Feast Platter & Frog Drum on Porch (Mâm cỗ trông trăng)
    // Positioned at z = -28.0, right beside the path
    // -------------------------------------------------------------
    this.feastTableGroup = new THREE.Group();
    this.feastTableGroup.position.set(1.9, 0, -28.0);
    this.feastTableGroup.rotation.y = -0.5;

    // Low wooden altar/table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.8 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), tableMat);
    tableTop.position.set(0, 0.72, 0);
    this.feastTableGroup.add(tableTop);

    // Table legs
    [-0.7, 0.7].forEach(tx => {
      [-0.5, 0.5].forEach(tz => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8), tableMat);
        leg.position.set(tx, 0.36, tz);
        this.feastTableGroup.add(leg);
      });
    });

    // Feast Platter on table (Chó bưởi, bánh nướng, bánh dẻo, hồng đỏ)
    const platterTex = TextureGenerator.createMooncakePlatterTexture();
    const platterGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const platterMat = new THREE.MeshBasicMaterial({
      map: platterTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    const platterMesh = new THREE.Mesh(platterGeo, platterMat);
    platterMesh.rotation.x = -Math.PI * 0.35;
    platterMesh.position.set(0, 0.86, 0.1);
    this.feastTableGroup.add(platterMesh);

    // Child silhouette sitting next to drum table
    const drumKidGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const drumKidMat = new THREE.MeshBasicMaterial({
      map: childTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const drumKidMesh = new THREE.Mesh(drumKidGeo, drumKidMat);
    drumKidMesh.position.set(-0.7, 0.7, 0.3);
    this.feastTableGroup.add(drumKidMesh);

    // Warm candle lantern hovering over table
    const feastLight = new THREE.PointLight(0xffbb44, 2.8, 7.0, 1.4);
    feastLight.position.set(0, 1.8, 0);
    this.feastTableGroup.add(feastLight);

    this.scene.add(this.feastTableGroup);

    // -------------------------------------------------------------
    // VIGNETTE 4: Temple Gate Arch & Festival Arrival (Cổng tam quan đình làng)
    // Positioned at z = -44.0 with authentic proportions
    // -------------------------------------------------------------
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x22303e, roughness: 0.9 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1f140c, roughness: 0.85 });

    // Central 3D stone columns flanking the path
    [-2.8, 2.8].forEach(px => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.45), stoneMat);
      col.position.set(px, 1.6, -44.0);
      this.scene.add(col);
    });

    // Outer 3D stone columns
    [-5.0, 5.0].forEach(px => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.8, 0.36), stoneMat);
      col.position.set(px, 1.4, -44.0);
      this.scene.add(col);
    });

    // Wooden lintel beam across columns
    const beam = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.28, 0.45), beamMat);
    beam.position.set(0, 3.2, -44.0);
    this.scene.add(beam);

    // Curved Temple Roof sitting on top of lintel beam
    const gateRoofTex = TextureGenerator.createTempleGateRoofTexture();
    const gateRoofGeo = new THREE.PlaneGeometry(13.5, 3.8);
    const gateRoofMat = new THREE.MeshBasicMaterial({
      map: gateRoofTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    this.templeGateMesh = new THREE.Mesh(gateRoofGeo, gateRoofMat);
    this.templeGateMesh.position.set(0, 4.8, -43.9);
    this.scene.add(this.templeGateMesh);

    // Catenary sagging festival bunting with colorful pennant flags and paper lanterns
    const buntingTex = TextureGenerator.createFestivalBuntingTexture();
    const buntingGeo = new THREE.PlaneGeometry(6.8, 2.0);
    const buntingMat = new THREE.MeshBasicMaterial({
      map: buntingTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    this.festivalBuntingMesh = new THREE.Mesh(buntingGeo, buntingMat);
    this.festivalBuntingMesh.position.set(0, 2.5, -43.8);
    this.scene.add(this.festivalBuntingMesh);

    // Secondary bunting layer slightly higher and deeper
    const buntingBackMesh = new THREE.Mesh(buntingGeo, buntingMat);
    buntingBackMesh.position.set(0, 2.7, -44.2);
    buntingBackMesh.scale.set(0.9, 0.85, 1);
    this.scene.add(buntingBackMesh);

    // Ancient Banyan Tree silhouette framing the gate on the left
    const banyanTex = TextureGenerator.createBanyanTreeSilhouette();
    const banyanGeo = new THREE.PlaneGeometry(13.0, 13.0);
    const banyanMat = new THREE.MeshBasicMaterial({
      map: banyanTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    const banyanTree = new THREE.Mesh(banyanGeo, banyanMat);
    banyanTree.position.set(-6.8, 5.5, -45.5);
    this.scene.add(banyanTree);

    // Distant gathering festival light relocated to central courtyard beyond gate
    this.templeFestivalLight.position.set(0, 3.5, -50.0);
  }

  public init() {
    audioManager.setScoreMood('village');
    this.playerZ = -5.8;
    this.currentSpeed = 0;
    this.warningShown = false;
    this.windGustActive = false;
    this.windGustTriggered = false;
    this.unshieldedWindExposure = 0;
    this.flameNeedsRelight = false;
    this.windLessonCompleted = false;
    this.vignette1Triggered = false;
    this.vignette2Triggered = false;
    this.vignette3Triggered = false;
    this.vignette4Triggered = false;
    this.festivalArrived = false;

    // Attach keyboard and pointer input
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointerup', this.boundPointerUp);

    // Setup floating UI button for shielding candle
    this.createShieldUi();

    // Initial Story & movement guidance
    this.overlay.setSubtitle(StoryConfig.villageWalk.arrivalHint, 3800);

    // Start background night atmosphere
    audioManager.startNightAmbience();
  }

  private createShieldUi() {
    this.shieldUiContainer = document.createElement('div');
    this.shieldUiContainer.className = 'cinematic-shield-ui';
    this.shieldUiContainer.innerHTML = `
      <div class="village-movement-hint">Giữ W / ↑ hoặc chạm giữ đường để bước</div>
      <button class="shield-lantern-btn" title="Giữ để lấy tay che chở ngọn nến">
        <span class="shield-icon">✋</span>
        <span class="shield-label">Che chở nến (Space)</span>
      </button>
    `;

    // Apply inline style for seamless floating HUD
    const btn = this.shieldUiContainer.querySelector('.shield-lantern-btn') as HTMLButtonElement;
    if (btn) {
      btn.style.position = 'fixed';
      btn.style.bottom = '85px';
      btn.style.right = '28px';
      btn.style.zIndex = '150';
      btn.style.padding = '10px 18px';
      btn.style.background = 'rgba(20, 30, 48, 0.75)';
      btn.style.backdropFilter = 'blur(8px)';
      btn.style.border = '1px solid rgba(245, 158, 11, 0.5)';
      btn.style.borderRadius = '30px';
      btn.style.color = '#fef3c7';
      btn.style.fontFamily = "'Segoe UI', system-ui, Arial, sans-serif";
      btn.style.fontSize = '14px';
      btn.style.letterSpacing = '0.5px';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
      btn.style.transition = 'all 0.25s ease';

      const activateShield = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.flameNeedsRelight) this.relightCandle();
        this.isShielding = true;
        this.lantern.setShielded(true);
        btn.style.background = 'rgba(245, 158, 11, 0.85)';
        btn.style.color = '#1f1305';
        audioManager.playHandShield();
      };

      const deactivateShield = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.isShielding = false;
        this.lantern.setShielded(false);
        btn.style.background = 'rgba(20, 30, 48, 0.75)';
        btn.style.color = '#fef3c7';
      };

      btn.addEventListener('mousedown', activateShield);
      btn.addEventListener('mouseup', deactivateShield);
      btn.addEventListener('mouseleave', deactivateShield);
      btn.addEventListener('touchstart', activateShield);
      btn.addEventListener('touchend', deactivateShield);
    }

    document.body.appendChild(this.shieldUiContainer);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (['KeyS', 'KeyW', 'ArrowDown', 'ArrowUp'].includes(e.code)) {
      this.isPressingForward = true;
    }
    if (e.code === 'Space' || e.code === 'KeyB') {
      if (this.flameNeedsRelight) this.relightCandle();
      if (!this.isShielding) {
        this.isShielding = true;
        this.lantern.setShielded(true);
        audioManager.playHandShield();
      }
    }
  }

  private relightCandle(): void {
    if (!this.flameNeedsRelight) return;
    this.flameNeedsRelight = false;
    this.windLessonCompleted = true;
    this.unshieldedWindExposure = 0;
    this.lantern.ignite();
    this.setShieldPrompt(false);
    this.overlay.hideNextButton();
    this.overlay.setSubtitle('Bạn châm lại ngọn nến. Ánh sao nhỏ trở về trong tay.', 3800, true);
    audioManager.playCandleIgnite();
  }

  private setShieldPrompt(relight: boolean): void {
    const button = this.shieldUiContainer?.querySelector('.shield-lantern-btn') as HTMLButtonElement | null;
    const label = button?.querySelector('.shield-label');
    if (label) label.textContent = relight ? 'Châm lại nến (Space)' : 'Che chở nến (Space)';
    if (button) button.title = relight ? 'Chạm để châm lại ngọn nến' : 'Giữ để lấy tay che chở ngọn nến';
  }

  private onKeyUp(e: KeyboardEvent) {
    if (['KeyS', 'KeyW', 'ArrowDown', 'ArrowUp'].includes(e.code)) {
      this.isPressingForward = false;
    }
    if (e.code === 'Space' || e.code === 'KeyB') {
      this.isShielding = false;
      this.lantern.setShielded(false);
    }
  }

  public update(delta: number, _time: number) {
    // 1. Acceleration / deceleration handling
    if (!this.festivalArrived && !this.flameNeedsRelight && this.isPressingForward) {
      this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + delta * 3.2);
      this.speedTimer += delta;

      // Show gentle candle warning if running continuously without shielding
      if (this.speedTimer > 2.8 && !this.warningShown && !this.isShielding) {
        this.warningShown = true;
        // Let the flame bend before the gust; the actionable warning belongs
        // at the gust itself, so the family vignette remains readable.
      }
    } else {
      this.currentSpeed = Math.max(0, this.currentSpeed - delta * 4.5);
      this.speedTimer = Math.max(0, this.speedTimer - delta * 2.0);
    }

    // 2. Advance player along path
    if (this.currentSpeed > 0.05) {
      const distanceMoved = this.currentSpeed * delta;
      this.playerZ -= distanceMoved;
      this.walkTime += delta * (this.currentSpeed * 2.5);

      // Footstep audio cadence
      this.footstepAccumulator += distanceMoved;
      if (this.footstepAccumulator >= 0.8) {
        this.footstepAccumulator = 0;
        audioManager.playFootstep('earth');
      }
    }

    // Slight organic path curve (đường làng uốn lượn nhẹ)
    this.playerX = Math.sin(this.playerZ * 0.12) * 0.35;

    // 3. Camera rail smooth tracking
    const walkBob = Math.sin(this.walkTime * 3.2);
    const targetCamZ = this.playerZ + 2.3;
    const targetCamX = this.playerX * 0.5;
    const targetCamY = 1.85 + (this.currentSpeed > 0.1 ? walkBob * 0.025 : 0);

    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, delta * 6.0);
    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, delta * 5.0);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, delta * 6.0);

    // Camera looks slightly ahead along the path toward the festival light
    this.camera.lookAt(this.playerX * 0.4, 1.9, this.playerZ - 8.5);

    // 4. Keep Moon high and proud as celestial anchor relative to camera
    this.moon.group.position.z = this.camera.position.z - 28.0;
    this.moon.group.position.y = 11.5;
    this.moon.update(this.camera);

    // 5. Autumn Wind Gust Mechanic (z between -18.5 and -22.5)
    let effectiveWindFactor = this.currentSpeed / this.maxSpeed;
    if (this.playerZ <= -18.5 && this.playerZ >= -23.0) {
      if (!this.windGustTriggered) {
        this.windGustTriggered = true;
        this.windGustActive = true;
        audioManager.playWindGust();
        this.overlay.setSubtitle(StoryConfig.villageWalk.windGustWarning, 5000, true);
      }
      this.windGustTimer += delta;
      // Gust profile
      const gustMagnitude = Math.sin(Math.min(1, this.windGustTimer / 3.5) * Math.PI) * 1.35;
      effectiveWindFactor = Math.max(effectiveWindFactor, gustMagnitude);
      if (!this.isShielding && !this.windLessonCompleted && !this.flameNeedsRelight) {
        this.unshieldedWindExposure += delta * Math.max(0, gustMagnitude - 0.3);
        if (this.unshieldedWindExposure > 0.72) {
          this.flameNeedsRelight = true;
          this.setShieldPrompt(true);
          this.currentSpeed = 0;
          this.lantern.extinguish();
          this.overlay.setSubtitle('Gió thổi tắt nến. Dừng lại một nhịp rồi châm lại ngọn lửa nhé.', 6000, true);
          this.overlay.showNextButton('Châm lại ngọn nến 🕯️', () => this.relightCandle());
        }
      }
    } else {
      this.windGustActive = false;
    }

    // Update Lantern with flame bending and shielding
    this.lantern.update(delta, effectiveWindFactor);
    this.lanternGroundLight.intensity += ((this.lantern.isLit ? 2.2 : 0.12) -
      this.lanternGroundLight.intensity) * Math.min(1, delta * 8);

    const lanternBob = Math.sin(this.walkTime * 3.2 + 0.5) * 0.03;
    const lanternSway = Math.sin(this.walkTime * 1.6) * 0.05;

    this.lantern.group.position.set(
      this.playerX + 0.60 + lanternSway * 0.15,
      1.02 + (this.currentSpeed > 0.1 ? lanternBob : Math.sin(_time * 2.8) * 0.012),
      this.playerZ - 0.68
    );
    this.lantern.group.rotation.z = lanternSway;

    // Drifting curling tea steam plumes on porch
    this.teaSteamPlumes.forEach(p => {
      const steamAge = (_time * p.speed + p.phase) % 1.0;
      p.mesh.position.y = p.basePos.y + steamAge * 0.55;
      p.mesh.position.x = p.basePos.x + Math.sin(_time * 2.2 + p.phase) * 0.035;
      const alpha = Math.sin(steamAge * Math.PI) * 0.6;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      const sScale = 1.0 + steamAge * 0.6;
      p.mesh.scale.set(sScale, sScale, 1.0);
    });

    // 6. Environmental animations: Swaying bamboo, banana palms & drifting mist
    const windSwayBonus = this.windGustActive ? 0.06 : 0.0;
    this.bambooGroves.forEach((grove, idx) => {
      grove.rotation.z = Math.sin(_time * 1.8 + idx * 1.2) * (0.035 + windSwayBonus);
    });

    this.bananaPalms.forEach((palm, idx) => {
      palm.rotation.z = Math.sin(_time * 1.5 + idx * 1.5) * (0.045 + windSwayBonus);
    });

    this.mistPlanes.forEach((mist, idx) => {
      if (mist.material && (mist.material as THREE.MeshBasicMaterial).map) {
        const mistSpeed = (this.windGustActive ? 0.035 : 0.016) * (idx % 2 === 0 ? 1 : -0.8);
        (mist.material as THREE.MeshBasicMaterial).map!.offset.x = (_time * mistSpeed) % 1;
      }
    });

    // 7. Autumn Fireflies float & pulse
    this.fireflies.forEach(ff => {
      ff.mesh.position.x = ff.baseX + Math.sin(_time * ff.speed + ff.phase) * 0.35;
      ff.mesh.position.y = ff.baseY + Math.sin(_time * 1.6 + ff.phase * 2) * 0.22;
      ff.mesh.position.z = ff.baseZ + Math.cos(_time * 1.1 + ff.phase) * 0.3;

      const pulse = Math.pow(Math.sin(_time * 2.8 + ff.phase), 4);
      (ff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.75;
    });

    // 8. Distant Festival Lanterns bobbing
    this.distantLanterns.forEach(item => {
      item.group.position.y = item.baseY + Math.sin(_time * 3.2 + item.phase) * 0.045;
      item.group.position.x = item.baseX + Math.sin(_time * 1.8 + item.phase) * 0.025;
    });

    // -------------------------------------------------------------
    // STORYTELLING VIGNETTE TRIGGERS ALONG THE PATH
    // -------------------------------------------------------------
    // Vignette 1: Family Porch (z <= -11.5)
    if (this.playerZ <= -11.5 && !this.vignette1Triggered) {
      this.vignette1Triggered = true;
      this.overlay.setSubtitle(StoryConfig.villageWalk.vignetteFamily, 5000);
    }

    // Porch warm whispers & tea-time murmurs
    if (this.playerZ <= -11.0 && this.playerZ >= -18.5) {
      this.whisperTimer += delta;
      if (this.whisperTimer > 3.4) {
        this.whisperTimer = 0;
        audioManager.playPorchWhispers(0.35);
      }
    }

    // Vignette 2: Running Kids with Carp Lantern (z <= -20.0)
    if (this.playerZ <= -20.0 && !this.vignette2Triggered) {
      this.vignette2Triggered = true;
      this.kidsRunningActive = true;
      this.kidsRunProgress = 0;
      this.kidRunStartZ = this.playerZ + 1.8; // Start from just behind player's right shoulder!
      audioManager.playLanternParadeCall(0.05);
      // The passing children and their laughter tell this beat without text.
    }

    // Vignette 2 animation: Kid sprints from behind player forward along the road
    if (this.kidsRunningActive) {
      this.kidsRunProgress += delta * 0.38; // ~2.6 seconds sprint duration
      const tNorm = Math.min(1.0, this.kidsRunProgress);
      // Sprint forward from behind player all the way into temple courtyard
      const kZ = this.kidRunStartZ - tNorm * 26.0;
      // Weave playfully along the right half of the path
      const kX = 1.15 - Math.sin(tNorm * Math.PI) * 0.7;
      // Rapid buoyant skipping footwork
      const kBob = Math.abs(Math.sin(this.kidsRunProgress * 22.0)) * 0.16;
      // Lantern swing
      const lanternSwing = Math.sin(this.kidsRunProgress * 14.0) * 0.25;

      this.runningKidsGroup.position.set(kX, kBob, kZ);
      this.runningKidsGroup.rotation.y = -0.15 + lanternSwing * 0.2;

      // Fade out as kid runs past gate into temple courtyard
      if (kZ <= -41.0) {
        const fade = Math.max(0, 1.0 - (-41.0 - kZ) / 4.0);
        this.runningKidsGroup.children.forEach(c => {
          if (c instanceof THREE.Mesh && c.material) {
            (c.material as THREE.Material).opacity = fade * 0.95;
          }
        });
      }

      if (this.kidsRunProgress >= 1.25) {
        this.kidsRunningActive = false;
        this.runningKidsGroup.position.set(0, 0, -100);
      }
    }

    // Vignette 3: Feast Table & Frog Drum (z <= -26.5)
    if (this.playerZ <= -26.5 && !this.vignette3Triggered) {
      this.vignette3Triggered = true;
      this.overlay.setSubtitle(StoryConfig.villageWalk.vignetteFeast, 5000);
    }

    // Vignette 4: Temple Gate Arch & Festival Arrival (z <= -34.5)
    if (this.playerZ <= -34.5 && !this.vignette4Triggered) {
      this.vignette4Triggered = true;
      this.overlay.setSubtitle(StoryConfig.villageWalk.vignetteTempleGate, 5500);
    }

    // Final Arrival at Temple Gate (z <= -38.5)
    if (this.playerZ <= -38.5 && !this.festivalArrived) {
      this.festivalArrived = true;
      this.currentSpeed = 0;
      this.isPressingForward = false;

      // Show Action Button to join the festival and transition to Phase 3
      this.overlay.showNextButton("Hòa vào đêm hội sân đình 🏮", () => {
        this.onComplete();
      });
    }

    // 9. Distance-based Audio Swell (frog drums & children chants intensify as player approaches festival)
    const progress = Math.min(1, Math.max(0, (-this.playerZ - 5.8) / 32.7));

    this.drumTimer += delta;
    const drumInterval = Math.max(1.4, 3.2 - progress * 1.6);
    if (this.drumTimer > drumInterval) {
      this.drumTimer = 0;
      if (progress > 0.45) {
        audioManager.playTraditionalFrogDrumRhythm(0.25 + progress * 0.75);
      } else {
        audioManager.playFrogDrum(0.8 + progress * 1.2);
      }
    }

    this.chantTimer += delta;
    if (this.chantTimer > 6.0) {
      this.chantTimer = 0;
      if (progress > 0.6) {
        audioManager.playFestivalCheer(0.3 + progress * 0.7);
      } else {
        audioManager.playLanternParadeCall(0.04 + progress * 0.06);
      }
    }
  }

  public destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointerup', this.boundPointerUp);

    if (this.shieldUiContainer && this.shieldUiContainer.parentNode) {
      this.shieldUiContainer.parentNode.removeChild(this.shieldUiContainer);
      this.shieldUiContainer = null;
    }

    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    this.overlay.clearSubtitle();
    this.overlay.hideNextButton();
  }
}
