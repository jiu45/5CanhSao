import * as THREE from 'three';
import { disposeSceneResources } from '../utils/disposeSceneResources';
import { IScene } from './BaseScene';
import { StarLantern } from '../props/StarLantern';
import { Moon } from '../props/Moon';
import { TextureGenerator } from '../utils/TextureGenerator';
import { audioManager } from '../audio/AudioManager';
import { StoryConfig } from '../config/StoryConfig';
import { StoryOverlay } from '../ui/StoryOverlay';
import { DistantFestivalVista } from '../props/DistantFestivalVista';
import { PapercraftFoliageKit } from '../props/papercraft/PapercraftFoliageKit';
import { PresentCrowdKit } from '../props/papercraft/PresentCrowdKit';
import { compileForComposer } from '../utils/prepareSceneForReveal';

export class ModernArrivalScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private overlay: StoryOverlay;
  private onComplete: () => void;

  // Scene props & isolated asset groups
  private moon: Moon;
  private lantern: StarLantern;
  private modernArrivalGroup: THREE.Group;
  private distantFestivalGroup: THREE.Group;
  private distantFestivalVista!: DistantFestivalVista;

  // Key visual actors & anchors
  private playerAnchor!: THREE.Object3D;
  private giantMoonRingMesh!: THREE.Mesh;
  private giantMoonCrescentMesh!: THREE.Mesh;
  private giantMoonLight!: THREE.PointLight;
  private distantFestivalBackdrop!: THREE.Mesh;
  private parkVisitorMeshes: THREE.Object3D[] = [];
  private parkLampLights: THREE.PointLight[] = [];
  private treeCanopies: THREE.Sprite[] = [];
  private readonly foliageKit = new PapercraftFoliageKit();
  private readonly crowdKit = new PresentCrowdKit();

  // Transition & visual veil
  private fadeCurtainEl: HTMLElement | null = null;
  private sceneTimer: number = 0;
  private stage: number = 0;
  private lanternEvolved: boolean = false;
  private motifPlayed: boolean = false;
  private buttonShown: boolean = false;
  private soundCueTriggered: boolean = false;
  private isTurningToVista: boolean = false;
  private turnTimer: number = 0;
  private isVistaRevealed: boolean = false;
  private vistaTimer: number = 0;
  private finalButtonShown: boolean = false;
  private visualsPrepared = false;

  // Phase 4C: Approach the Festival
  public isApproaching: boolean = false;
  public approachTimer: number = 0;
  public approachProgress: number = 0;
  public approachFootstepTimer: number = 0;
  public midApproachSubtitleShown: boolean = false;
  public approachCompleted: boolean = false;
  private boundOnKeyDown: ((e: KeyboardEvent) => void) | null = null;

  private readonly approachPathCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.15, 2.30, 4.30),  // P0: Player start on terrace knoll
    new THREE.Vector3(3.5, 1.25, 4.0),    // P1: Base of terrace steps
    new THREE.Vector3(16.0, 0.85, 6.2),   // P2: Right curve flank
    new THREE.Vector3(34.0, 0.50, 1.5),   // P3: Gentle curve across park
    new THREE.Vector3(52.0, 0.20, -7.5)   // P4: Pre-Phase-5 handoff threshold (~26m before gate)
  ]);

  // Saved renderer post-processing state for strict restoration (anti-regression)
  private prevBloomStrength: number = 0.52;
  private prevBloomRadius: number = 0.45;
  private prevBloomThreshold: number = 0.78;
  private prevCameraFar: number = 100;

  // Camera choreography anchors
  // 1. Exact match to Phase 3C handoff
  private readonly handoffCamPos = new THREE.Vector3(0, 10.0, 10.0);
  private readonly handoffLookAt = new THREE.Vector3(0, 16.5, -24.0);

  // 2. Player closeup on terrace knoll (Framing handheld star lantern and player)
  private readonly playerCamPos = new THREE.Vector3(-0.1, 2.6, 5.65);
  private readonly playerLookAt = new THREE.Vector3(0.8, 1.8, 2.9);

  // 3. Midground park sweep
  private readonly sweepCamPos = new THREE.Vector3(-1.6, 3.1, 4.0);
  private readonly sweepLookAt = new THREE.Vector3(-0.2, 1.6, -18.0);

  // 4. Master elevated overlook (Framing viewing terrace, all 4 cascading illuminated grand steps, and glowing Moon)
  private readonly masterCamPos = new THREE.Vector3(0.0, 3.25, 4.4);
  private readonly masterLookAt = new THREE.Vector3(0.0, 1.35, -22.0);

  // 5. Vista Reveal (~75° right of Moon axis)
  private readonly vistaCamPos = new THREE.Vector3(0.4, 3.4, 4.1);
  private readonly vistaLookAt = new THREE.Vector3(88.0, 1.5, -20.0);
  private readonly vistaDollyCamPos = new THREE.Vector3(1.35, 3.35, 3.8);
  private readonly vistaDollyLookAt = new THREE.Vector3(92.0, 1.4, -20.5);

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    onComplete: () => void
  ) {
    this.camera = camera;
    this.overlay = overlay;
    this.onComplete = onComplete;

    this.scene = new THREE.Scene();
    // Midnight navy urban night sky with deep purple-blue atmospheric night fog (#0d1326)
    this.scene.background = new THREE.Color(0x070d1e);
    this.scene.fog = new THREE.FogExp2(0x0d1326, 0.0072);

    this.modernArrivalGroup = new THREE.Group();
    this.scene.add(this.modernArrivalGroup);

    this.distantFestivalGroup = new THREE.Group();
    this.distantFestivalGroup.visible = false; // Guarded during Stage 0 (Moon Bridge)
    this.scene.add(this.distantFestivalGroup);

    // 1. Continuous Celestial Full Moon (Framed in the midnight sky above the festival)
    this.moon = new Moon();
    this.moon.group.position.set(0, 14.8, -24.0);
    this.moon.group.scale.setScalar(1.5);
    this.scene.add(this.moon.group);

    // 2. Handheld Star Lantern (Starts candlelit, scales down to 0.34 for elegant hand size)
    this.lantern = new StarLantern();
    this.lantern.setStep(4);
    this.lantern.group.scale.setScalar(0.34);
    this.scene.add(this.lantern.group);

  }

  public init() {
    // Keep the Phase 3 camera untouched while this scene is prepared in advance.
    this.camera.position.copy(this.handoffCamPos);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.handoffLookAt);
    // Dynamically extend camera far plane for distant vista sightlines (reverted in destroy)
    this.prevCameraFar = this.camera.far;
    this.camera.far = 350;
    this.camera.updateProjectionMatrix();

    this.tuneBloomSettings();
    this.prepareVisuals();
    this.createSoftTransitionVeil();

    // Start modern ambient audio: park night wind + distant festive drum beats
    audioManager.stopPastAmbience();
    audioManager.startModernAmbientAudio();
    audioManager.setScoreMood('present');

    // Opening subtitle: Moon as the timeless bridge
    this.overlay.setSubtitle(StoryConfig.modernArrival.moonTransition1, 4600);

    // Key shortcut to trigger approach ([W], ArrowUp, Space) once vista is revealed
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (this.isVistaRevealed && !this.isApproaching && !this.approachCompleted) {
          this.startApproach();
        }
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  /** Build once during Memory Ascent; init retains the same objects at handoff. */
  public prepareVisuals(): void {
    if (this.visualsPrepared) return;
    this.visualsPrepared = true;
    this.setupLighting();
    this.createElevatedTerraceKnoll();
    this.createPlayerAnchor();
    this.createMidgroundPark();
    this.createDistantFestival();
    this.distantFestivalVista = new DistantFestivalVista();
    this.scene.add(this.distantFestivalVista.group);
  }

  /** Precompile the illuminated park that becomes visible after the moon bridge. */
  public async prepareAlternateViews(renderer: THREE.WebGLRenderer): Promise<void> {
    this.prepareVisuals();
    const previousVisibility = this.distantFestivalGroup.visible;
    const warmCamera = this.camera.clone();
    warmCamera.far = 350;
    warmCamera.position.copy(this.playerCamPos);
    warmCamera.lookAt(this.playerLookAt);
    warmCamera.updateProjectionMatrix();
    try {
      this.distantFestivalGroup.visible = true;
      await compileForComposer(renderer, this.scene, warmCamera);
    } finally {
      this.distantFestivalGroup.visible = previousVisibility;
    }
  }

  private tuneBloomSettings() {
    // Dynamic bloom tuning scoped exclusively to Phase 4 (anti-regression: reverted in destroy)
    const g = (window as any).game;
    if (g?.renderer?.bloomPass) {
      this.prevBloomStrength = g.renderer.bloomPass.strength;
      this.prevBloomRadius = g.renderer.bloomPass.radius;
      this.prevBloomThreshold = g.renderer.bloomPass.threshold;

      // Soft controlled bloom (luminous warmth without erasing object shapes or overblowing LED bands)
      g.renderer.bloomPass.strength = 0.72;
      g.renderer.bloomPass.radius = 0.50;
      g.renderer.bloomPass.threshold = 0.65;
    }
  }

  private setupLighting() {
    // Ambient light: cool urban night base
    const ambient = new THREE.AmbientLight(0x1c2744, 1.35);
    this.modernArrivalGroup.add(ambient);

    // Soft sky hemisphere light: midnight navy above, warm golden ground reflection below
    const hemiLight = new THREE.HemisphereLight(0x2a3d66, 0x1f1912, 1.1);
    hemiLight.position.set(0, 25, 0);
    this.modernArrivalGroup.add(hemiLight);
  }

  private createSoftTransitionVeil() {
    // Match the silver-white moonlight veil from Phase 3C and dissolve it smoothly
    this.fadeCurtainEl = document.createElement('div');
    this.fadeCurtainEl.className = 'scene-fade-curtain';
    this.fadeCurtainEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at 50% 38%, rgba(244, 246, 250, 0.96) 0%, rgba(220, 230, 248, 0.98) 55%, rgba(180, 200, 230, 1.0) 100%);
      pointer-events: none;
      z-index: 25;
      opacity: 1;
      transition: opacity 3.5s cubic-bezier(0.25, 1, 0.5, 1);
    `;
    document.body.appendChild(this.fadeCurtainEl);

    requestAnimationFrame(() => {
      if (this.fadeCurtainEl) {
        this.fadeCurtainEl.style.opacity = '0';
      }
    });
  }

  private createElevatedTerraceKnoll() {
    // 1. Elevated Knoll Hillside Base (Solid foundational core under terrace)
    const knollGeo = new THREE.CylinderGeometry(2.25, 2.25, 1.5, 36);
    const knollMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.92,
      metalness: 0.05
    });
    const knollMesh = new THREE.Mesh(knollGeo, knollMat);
    knollMesh.position.set(0, 0.75, 4.2);
    knollMesh.receiveShadow = true;
    this.modernArrivalGroup.add(knollMesh);

    // 2. Viewing Terrace Paving with fine granite block texture
    const terraceWalkwayTex = TextureGenerator.createModernParkWalkwayTexture();
    terraceWalkwayTex.repeat.set(2, 2);
    terraceWalkwayTex.wrapS = THREE.RepeatWrapping;
    terraceWalkwayTex.wrapT = THREE.RepeatWrapping;

    const terracePavingGeo = new THREE.CylinderGeometry(2.25, 2.25, 0.12, 48);
    const terracePavingMat = new THREE.MeshStandardMaterial({
      map: terraceWalkwayTex,
      roughness: 0.72,
      metalness: 0.08
    });
    const terracePaving = new THREE.Mesh(terracePavingGeo, terracePavingMat);
    terracePaving.position.set(0, 1.50, 4.2);
    terracePaving.receiveShadow = true;
    this.modernArrivalGroup.add(terracePaving);

    // 3. Luxurious Modern Granite Balustrade / Parapet Walls flanking the terrace
    this.createGraniteParapetWall(false); // Left balustrade
    this.createGraniteParapetWall(true);  // Right balustrade

    // 4. Grand Terrace Steps (4 wide concentric semi-circular steps with recessed LED strips)
    this.createCurvedGrandSteps();

    // 5. Gentle Sloping Grassy Hill Embankments flanking the staircase (connecting knoll to ground)
    this.createFlankEmbankment(false); // Left slope
    this.createFlankEmbankment(true);  // Right slope

    // 6. Contemporary Park Bench
    this.createParkBench(-1.0, 1.56, 4.5, 0.45);

    // 7. Contemporary Park Lamp Posts on Terrace
    this.createModernLampPost(-1.6, 1.56, 3.6);
    this.createModernLampPost(2.0, 1.56, 4.85, false);

    // 8. Ornamental shrubbery along terrace rim
    this.createShrubCluster(-2.1, 1.55, 4.0);
    this.createShrubCluster(2.0, 1.55, 4.0);
  }

  private createCurvedGrandSteps() {
    // 4 Tiered concentric curved steps cascading gently from Y = 1.5m terrace down to Y = 0.02m promenade
    // 35cm comfortable risers and 1.2m broad treads create a glorious, fully visible step amphitheater!
    const stepTiers = [
      { outerR: 3.45, innerR: 2.15, topY: 1.15, riser: 0.35 },
      { outerR: 4.65, innerR: 3.35, topY: 0.80, riser: 0.35 },
      { outerR: 5.85, innerR: 4.55, topY: 0.45, riser: 0.35 },
      { outerR: 7.05, innerR: 5.75, topY: 0.12, riser: 0.12 }
    ];

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.70,
      metalness: 0.18
    });

    // Soft warm golden step LED light
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 1.0,
      roughness: 0.35
    });

    // Dedicated top terrace landing lip LED strip (soft golden edge, subtle ambient glow without aggressive glare)
    const topLipLedMat = new THREE.MeshStandardMaterial({
      color: 0xffe89e,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.4
    });

    // Opening arc: ~65 degrees total, widening from 3.6m at terrace to 7.8m at promenade base
    const angleSpan = Math.PI * 0.36;
    const halfAngle = angleSpan / 2;
    const numSegs = 36;

    // Top terrace landing lip LED strip (Step 0)
    const topLipPts: THREE.Vector3[] = [];
    for (let i = 0; i <= numSegs; i++) {
      const a = -halfAngle + (i / numSegs) * angleSpan;
      const lx = Math.sin(a) * 2.28;
      const lz = 4.2 - Math.cos(a) * 2.28;
      topLipPts.push(new THREE.Vector3(lx, 1.54, lz));
    }
    const topLipCurve = new THREE.CatmullRomCurve3(topLipPts);
    const topLipMesh = new THREE.Mesh(new THREE.TubeGeometry(topLipCurve, numSegs, 0.015, 8, false), topLipLedMat);
    this.modernArrivalGroup.add(topLipMesh);

    stepTiers.forEach((sd, index) => {
      // 1. Solid Curved Stone Step Slab via ExtrudeGeometry
      const shape = new THREE.Shape();
      for (let i = 0; i <= numSegs; i++) {
        const a = -halfAngle + (i / numSegs) * angleSpan;
        const x = Math.sin(a) * sd.outerR;
        const z = -Math.cos(a) * sd.outerR;
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
      }
      for (let i = numSegs; i >= 0; i--) {
        const a = -halfAngle + (i / numSegs) * angleSpan;
        const x = Math.sin(a) * sd.innerR;
        const z = -Math.cos(a) * sd.innerR;
        shape.lineTo(x, z);
      }
      shape.closePath();

      const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: sd.riser,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 2
      });
      extrudeGeo.rotateX(Math.PI / 2);

      const stepMesh = new THREE.Mesh(extrudeGeo, stepMat);
      stepMesh.position.set(0, sd.topY, 4.2);
      stepMesh.receiveShadow = true;
      this.modernArrivalGroup.add(stepMesh);

      // 2. Continuous Curved LED Strip Light crowning the outer step lip
      const curvePts: THREE.Vector3[] = [];
      for (let i = 0; i <= numSegs; i++) {
        const a = -halfAngle + (i / numSegs) * angleSpan;
        const lx = Math.sin(a) * (sd.outerR + 0.04);
        const lz = 4.2 - Math.cos(a) * (sd.outerR + 0.04);
        curvePts.push(new THREE.Vector3(lx, sd.topY + 0.035, lz));
      }
      const ledCurve = new THREE.CatmullRomCurve3(curvePts);
      const ledGeo = new THREE.TubeGeometry(ledCurve, numSegs, 0.018, 8, false);
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      this.modernArrivalGroup.add(ledMesh);

      // 3. Warm ambient step wash light
      // The luminous step lip supplies this small pool without a per-tier light.
    });
  }

  private createGraniteParapetWall(isRight: boolean) {
    const sign = isRight ? 1 : -1;
    const halfAngle = (Math.PI * 0.36) / 2; // staircase start
    const endAngle = Math.PI * 0.46; // parapet flanks coverage
    const numSegs = 20;
    const rWall = 2.28;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e2736,
      roughness: 0.42,
      metalness: 0.45
    });

    const copingMat = new THREE.MeshStandardMaterial({
      color: 0x2e3a4e,
      roughness: 0.25,
      metalness: 0.65
    });

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });

    // 1. Curved low granite parapet wall segments
    const wallHeight = 0.38;
    for (let i = 0; i < numSegs; i++) {
      const a1 = sign * (halfAngle + (i / numSegs) * (endAngle - halfAngle));
      const a2 = sign * (halfAngle + ((i + 1) / numSegs) * (endAngle - halfAngle));
      const p1 = new THREE.Vector3(Math.sin(a1) * rWall, 1.50 + wallHeight / 2, 4.2 - Math.cos(a1) * rWall);
      const p2 = new THREE.Vector3(Math.sin(a2) * rWall, 1.50 + wallHeight / 2, 4.2 - Math.cos(a2) * rWall);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const segLen = dir.length();
      const wallSeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, wallHeight, segLen * 1.05), wallMat);
      wallSeg.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
      wallSeg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
      this.modernArrivalGroup.add(wallSeg);
    }

    // 2. Rounded Bullnose Coping Top Rail
    const copingPts: THREE.Vector3[] = [];
    const ledPts: THREE.Vector3[] = [];
    for (let i = 0; i <= numSegs; i++) {
      const a = sign * (halfAngle + (i / numSegs) * (endAngle - halfAngle));
      const px = Math.sin(a) * rWall;
      const pz = 4.2 - Math.cos(a) * rWall;
      copingPts.push(new THREE.Vector3(px, 1.50 + wallHeight + 0.04, pz));
      ledPts.push(new THREE.Vector3(px, 1.50 + wallHeight - 0.02, pz));
    }
    const copingCurve = new THREE.CatmullRomCurve3(copingPts);
    const copingMesh = new THREE.Mesh(new THREE.TubeGeometry(copingCurve, numSegs, 0.05, 8, false), copingMat);
    this.modernArrivalGroup.add(copingMesh);

    // 3. Under-Coping Concealed Warm LED Strip Light
    const ledCurve = new THREE.CatmullRomCurve3(ledPts);
    const ledMesh = new THREE.Mesh(new THREE.TubeGeometry(ledCurve, numSegs, 0.016, 6, false), ledMat);
    this.modernArrivalGroup.add(ledMesh);

    // 4. Sturdy Granite Terminal Bollards with Glowing Luminaire Caps
    const terminalAngles = [sign * halfAngle, sign * endAngle];
    terminalAngles.forEach(ta => {
      const bx = Math.sin(ta) * rWall;
      const bz = 4.2 - Math.cos(ta) * rWall;

      const bollardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, wallHeight + 0.16, 0.32), copingMat);
      bollardMesh.position.set(bx, 1.50 + (wallHeight + 0.16) / 2, bz);
      this.modernArrivalGroup.add(bollardMesh);

      // Warm glowing cap on bollard
      const capMat = new THREE.MeshStandardMaterial({
        color: 0xfff08a,
        emissive: 0xfde047,
        emissiveIntensity: 1.3
      });
      const capMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), capMat);
      capMesh.position.set(bx, 1.50 + wallHeight + 0.17, bz);
      this.modernArrivalGroup.add(capMesh);
    });
  }

  private createFlankEmbankment(isRight: boolean) {
    const sign = isRight ? 1 : -1;
    const lawnTex = TextureGenerator.createModernParkLawnTexture();
    lawnTex.repeat.set(3, 3);
    lawnTex.wrapS = THREE.RepeatWrapping;
    lawnTex.wrapT = THREE.RepeatWrapping;

    const slopeMat = new THREE.MeshStandardMaterial({
      map: lawnTex,
      color: 0x1d442c,
      roughness: 0.88,
      metalness: 0.05
    });

    // 14x14 grid for smooth organic sloping curvature
    const w = 6.0;
    const d = 8.5;
    const geo = new THREE.PlaneGeometry(w, d, 14, 14);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const centerX = sign * 6.6;
    const centerZ = 0.5;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const wx = centerX + vx;
      const wz = centerZ + vz;

      const distFromKnoll = Math.sqrt(wx * wx + (wz - 4.2) * (wz - 4.2));
      const zProgress = Math.max(0, Math.min(1, (wz - (-3.2)) / 7.2));
      const rProgress = Math.max(0, Math.min(1, (9.0 - distFromKnoll) / 4.8));
      const elevation = zProgress * rProgress;
      const smoothElevation = elevation * elevation * (3 - 2 * elevation);

      // Keep central grand staircase corridor completely clear
      const innerClearance = Math.max(0, Math.min(1, (Math.abs(wx) - 3.6) / 0.8));
      pos.setY(i, smoothElevation * 1.50 * innerClearance);
    }
    geo.computeVertexNormals();

    const slopeMesh = new THREE.Mesh(geo, slopeMat);
    slopeMesh.position.set(centerX, 0, centerZ);
    slopeMesh.receiveShadow = true;
    this.modernArrivalGroup.add(slopeMesh);

    // Add clusters of colorful flowers and manicured shrubs on the hillside slope
    const flowerMats = [
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.6 }),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 1.6 }),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 1.6 })
    ];
    const flowerGeo = new THREE.DodecahedronGeometry(0.12);

    for (let s = 0; s < 4; s++) {
      const p = s / 3;
      const sx = sign * (3.8 + p * 1.8);
      const sz = 2.0 - p * 4.2;
      const sy = (1.0 - p) * 1.2 + 0.1;

      this.createShrubCluster(sx, sy, sz);

      for (let b = 0; b < 3; b++) {
        const blossom = new THREE.Mesh(flowerGeo, flowerMats[(s + b) % flowerMats.length]);
        blossom.position.set(sx + (b - 1) * 0.22, sy + 0.25, sz + (b % 2) * 0.18);
        this.modernArrivalGroup.add(blossom);
      }
    }
  }

  private createParkBench(x: number, y: number, z: number, rotationY: number) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(x, y, z);
    benchGroup.rotation.y = rotationY;

    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x6e4726,
      roughness: 0.7,
      metalness: 0.1
    });
    const seatGeo = new THREE.BoxGeometry(1.4, 0.06, 0.42);
    const seat = new THREE.Mesh(seatGeo, slatMat);
    seat.position.set(0, 0.42, 0);
    benchGroup.add(seat);

    const backGeo = new THREE.BoxGeometry(1.4, 0.35, 0.05);
    const back = new THREE.Mesh(backGeo, slatMat);
    back.position.set(0, 0.68, -0.19);
    back.rotation.x = -0.15;
    benchGroup.add(back);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.3,
      metalness: 0.8
    });
    const legGeo = new THREE.BoxGeometry(0.06, 0.42, 0.44);
    const legL = new THREE.Mesh(legGeo, metalMat);
    legL.position.set(-0.6, 0.21, 0);
    benchGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, metalMat);
    legR.position.set(0.6, 0.21, 0);
    benchGroup.add(legR);

    this.modernArrivalGroup.add(benchGroup);
  }

  private createModernLampPost(x: number, y: number, z: number, lit = true) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, y, z);

    // Sleek dark grey tapered pole
    const poleGeo = new THREE.CylinderGeometry(0.045, 0.07, 3.2, 12);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      roughness: 0.35,
      metalness: 0.75
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 1.6, 0);
    lampGroup.add(pole);

    // Luminaire head
    const headGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x181f2b,
      roughness: 0.4,
      metalness: 0.8
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 3.22, 0);
    lampGroup.add(head);

    // Warm luminous LED emitter disk (3000K warm gold)
    const emitterGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xffd485 });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.position.set(0, 3.16, 0);
    lampGroup.add(emitter);

    // PointLight casting warm golden illumination on the ground
    if (lit) {
      const lampLight = new THREE.PointLight(0xffbe6b, 2.6, 14, 1.4);
      lampLight.position.set(x, y + 3.1, z);
      this.modernArrivalGroup.add(lampLight);
      this.parkLampLights.push(lampLight);
    }

    this.modernArrivalGroup.add(lampGroup);
  }

  private createShrubCluster(x: number, y: number, z: number) {
    const shrubGeo = new THREE.SphereGeometry(0.48, 12, 10);
    shrubGeo.scale(1.2, 0.85, 1.0);
    const shrubMat = new THREE.MeshStandardMaterial({
      color: 0x1a3d2e,
      roughness: 0.82,
      metalness: 0.04
    });
    const shrub1 = new THREE.Mesh(shrubGeo, shrubMat);
    shrub1.position.set(x, y + 0.35, z);
    this.modernArrivalGroup.add(shrub1);

    const shrub2 = new THREE.Mesh(shrubGeo, shrubMat);
    shrub2.position.set(x + 0.4, y + 0.28, z + 0.2);
    shrub2.scale.setScalar(0.75);
    this.modernArrivalGroup.add(shrub2);
  }

  private createPlayerAnchor() {
    // Keep the walk path anchor for staging, while the lantern alone represents
    // the player on screen, as it does through the rest of the story.
    this.playerAnchor = new THREE.Object3D();

    // Handheld Star Lantern (held comfortably at waist/hip height)
    this.lantern.group.position.set(0.95, 1.90, 4.0);
    this.lantern.group.scale.setScalar(0.32); // Compact, handheld scale
  }

  private createMidgroundPark() {
    // 1. Lower Park Ground (Expanded across the entire park landscape toward the eastern festival)
    const parkGroundGeo = new THREE.PlaneGeometry(240, 180, 32, 32);
    const parkLawnTex = TextureGenerator.createModernParkLawnTexture();
    parkLawnTex.repeat.set(24, 18);
    parkLawnTex.wrapS = THREE.RepeatWrapping;
    parkLawnTex.wrapT = THREE.RepeatWrapping;

    const parkGroundMat = new THREE.MeshStandardMaterial({
      map: parkLawnTex,
      roughness: 0.88,
      metalness: 0.05
    });
    const parkGround = new THREE.Mesh(parkGroundGeo, parkGroundMat);
    parkGround.rotation.x = -Math.PI / 2;
    parkGround.position.set(50.0, -0.05, -22.0);
    parkGround.receiveShadow = true;
    this.modernArrivalGroup.add(parkGround);

    // 2. Wide Sweeping Pedestrian Promenade (seamless leading directly to Moon Installation)
    const walkwayTex = TextureGenerator.createModernParkWalkwayTexture();
    walkwayTex.repeat.set(4, 28);
    walkwayTex.wrapS = THREE.RepeatWrapping;
    walkwayTex.wrapT = THREE.RepeatWrapping;

    const pathGeo = new THREE.PlaneGeometry(6.6, 42.0);
    const pathMat = new THREE.MeshStandardMaterial({
      map: walkwayTex,
      roughness: 0.85, // Matte textured stone paver finish, zero river effect!
      metalness: 0.04
    });
    const mainPromenade = new THREE.Mesh(pathGeo, pathMat);
    mainPromenade.rotation.x = -Math.PI / 2;
    mainPromenade.position.set(0.0, 0.02, -23.95); // Near edge seamlessly meets bottom step at Z = -2.95
    mainPromenade.receiveShadow = true;
    this.modernArrivalGroup.add(mainPromenade);

    // 3. Vibrant Colorful Flowerbed Borders flanking both sides of the promenade
    this.createFlowerbedBorder(-3.7, -2.95, -44, false);
    this.createFlowerbedBorder(3.7, -2.95, -44, true);

    // 4. Sleek Modern Lamp Posts rhythmically placed along both sides of promenade
    const lampPositions = [
      { x: -3.8, y: 0.0, z: -6 },
      { x: 3.8, y: 0.0, z: -14 },
      { x: -3.8, y: 0.0, z: -22 },
      { x: 3.8, y: 0.0, z: -30 },
      { x: -3.8, y: 0.0, z: -38 }
    ];
    lampPositions.forEach((pos, index) => {
      this.createModernLampPost(pos.x, pos.y, pos.z, index === 2);
    });

    // 5. Landscaped Ornamental Trees with TRUE Base Uplighting (Warm amber & cyan)
    // Placed elegantly behind the flowerbeds along the park
    const treePositions = [
      { x: -6.4, z: -8, scale: 1.15 },
      { x: 6.4, z: -12, scale: 1.1 },
      { x: -7.2, z: -20, scale: 1.25 },
      { x: 7.0, z: -24, scale: 1.2 },
      { x: -7.5, z: -32, scale: 1.35 },
      { x: 7.4, z: -36, scale: 1.3 }
    ];
    treePositions.forEach((tp, index) => {
      this.createLandscapedParkTree(tp.x, tp.z, tp.scale, index);
    });

    // 6. Contemporary Park Visitors strolling peacefully along promenade (1.7m - 1.8m human scale)
    const visitorPlacements = [
      { x: -1.7, z: -9.0, scale: 1.0 },
      { x: 1.9, z: -16.0, scale: 0.96 },
      { x: -1.8, z: -25.0, scale: 0.90 },
      { x: 1.7, z: -34.0, scale: 0.85 }
    ];

    visitorPlacements.forEach((vp, index) => {
      const props = ['balloon', 'phone', 'round', 'none'] as const;
      const visitor = this.crowdKit.createActor(vp.x, vp.z, vp.scale,
        0x26364b, props[index], true);
      this.modernArrivalGroup.add(visitor);
      this.parkVisitorMeshes.push(visitor);
    });
  }

  private createFlowerbedBorder(x: number, zStart: number, zEnd: number, isRight: boolean) {
    const bedGroup = new THREE.Group();
    const length = Math.abs(zEnd - zStart);
    const centerZ = (zStart + zEnd) / 2;

    // Raised granite curb retaining wall
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x1f2636,
      roughness: 0.55,
      metalness: 0.35
    });
    const curbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, length), curbMat);
    curbMesh.position.set(x, 0.14, centerZ);
    bedGroup.add(curbMesh);

    // Soil/bed planter body
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x142018,
      roughness: 0.9
    });
    const soilX = isRight ? x + 0.6 : x - 0.6;
    const soilMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, length), soilMat);
    soilMesh.position.set(soilX, 0.1, centerZ);
    bedGroup.add(soilMesh);

    // Colorful Flower clusters along the planter
    // 4 vibrant festive colors:
    // Golden Marigolds (#F59E0B), Coral Salvias (#F43F5E), Violet Petunias (#A855F7), Pink Cosmos (#EC4899)
    const flowerMats = [
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 1.9, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 1.8, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 1.8, roughness: 0.4 })
    ];
    const flowerGeo = new THREE.DodecahedronGeometry(0.12);

    for (let z = zStart; z > zEnd; z -= 1.4) {
      const colIdx = Math.floor(Math.abs(z * 1.7)) % flowerMats.length;
      const mat = flowerMats[colIdx];
      // 3 small blossom nodes per cluster
      for (let k = 0; k < 3; k++) {
        const blossom = new THREE.Mesh(flowerGeo, mat);
        const offsetX = (Math.sin(z * 3.1 + k) * 0.25);
        const offsetZ = (Math.cos(z * 2.3 + k) * 0.25);
        blossom.position.set(soilX + offsetX, 0.25 + (k % 2) * 0.08, z + offsetZ);
        blossom.rotation.set(k * 0.4, k * 0.6, 0);
        bedGroup.add(blossom);
      }
    }

    // Blossom emissive color and bloom supply the repeated planter light rhythm.

    this.modernArrivalGroup.add(bedGroup);
  }

  private createLandscapedParkTree(x: number, z: number, scale: number, index: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    treeGroup.scale.setScalar(scale);

    // Natural stylized trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 3.8, 12);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x30241b,
      roughness: 0.88
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1.9, 0);
    treeGroup.add(trunk);

    // Fairy lights wrap around trunk (Đèn LED quấn quanh thân cây)
    const fairyMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 3.2,
      roughness: 0.18
    });
    const beadGeo = new THREE.SphereGeometry(0.038, 6, 6);
    const numWrapBeads = 32;
    for (let i = 0; i < numWrapBeads; i++) {
      const p = i / numWrapBeads;
      const by = 0.4 + p * 2.8;
      const bAngle = p * Math.PI * 9.0;
      const br = (0.28 - p * 0.08) + 0.018;
      const bx = Math.cos(bAngle) * br;
      const bz = Math.sin(bAngle) * br;
      const bead = new THREE.Mesh(beadGeo, fairyMat);
      bead.position.set(bx, by, bz);
      treeGroup.add(bead);
    }

    // Three staggered illustrated cut-paper layers retain the lit trunk as a 3D anchor.
    const clump1 = this.foliageKit.canopy(4.1, 2.65, 0);
    clump1.position.set(0, 3.7, 0);
    treeGroup.add(clump1);
    this.treeCanopies.push(clump1);

    const clump2 = this.foliageKit.canopy(3.4, 2.3, 2);
    clump2.position.set(0.35, 4.6, 0.2);
    treeGroup.add(clump2);
    this.treeCanopies.push(clump2);

    const clump3 = this.foliageKit.canopy(2.6, 1.9, 1);
    clump3.position.set(-0.4, 4.2, -0.25);
    treeGroup.add(clump3);
    this.treeCanopies.push(clump3);

    // Drooping fairy light strands hanging from canopy (Dải LED rủ từ tán cây)
    const strandAngles = [0.3, 1.5, 2.8, 4.1, 5.3];
    strandAngles.forEach((sa, sIdx) => {
      const dist = 1.1 + (sIdx % 2) * 0.25;
      const sx = Math.cos(sa) * dist;
      const sz = Math.sin(sa) * dist;
      const startY = 3.3 + (sIdx % 3) * 0.25;
      const strandLen = 1.0 + (sIdx % 3) * 0.35;
      const strandBeads = 6;
      for (let b = 0; b < strandBeads; b++) {
        const bp = b / strandBeads;
        const bead = new THREE.Mesh(beadGeo, fairyMat);
        const sway = Math.sin(b * 0.9) * 0.04;
        bead.position.set(sx + sway, startY - bp * strandLen, sz);
        bead.scale.setScalar(0.85);
        treeGroup.add(bead);
      }
    });

    // Landscaped granite tree ring, manicured lawn mound, and colorful flowerbed under each tree
    const treeRingGeo = new THREE.TorusGeometry(1.25, 0.07, 8, 24);
    const treeRingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2636,
      roughness: 0.5,
      metalness: 0.35
    });
    const treeRingMesh = new THREE.Mesh(treeRingGeo, treeRingMat);
    treeRingMesh.rotation.x = Math.PI / 2;
    treeRingMesh.position.set(0, 0.06, 0);
    treeGroup.add(treeRingMesh);

    const treeLawnTex = TextureGenerator.createModernParkLawnTexture();
    const treeMoundGeo = new THREE.CylinderGeometry(1.2, 1.24, 0.12, 24);
    const treeMoundMat = new THREE.MeshStandardMaterial({
      map: treeLawnTex,
      roughness: 0.88,
      metalness: 0.05
    });
    const treeMound = new THREE.Mesh(treeMoundGeo, treeMoundMat);
    treeMound.position.set(0, 0.06, 0);
    treeGroup.add(treeMound);

    // Colorful blossoms surrounding trunk base
    const treeBlossomMats = [
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8 }),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 1.8 }),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 1.8 })
    ];
    const treeBlossomGeo = new THREE.DodecahedronGeometry(0.09);
    for (let b = 0; b < 10; b++) {
      const bAngle = (b / 10) * Math.PI * 2;
      const bDist = 0.58 + (b % 3) * 0.18;
      const blossom = new THREE.Mesh(treeBlossomGeo, treeBlossomMats[b % treeBlossomMats.length]);
      blossom.position.set(Math.cos(bAngle) * bDist, 0.15, Math.sin(bAngle) * bDist);
      treeGroup.add(blossom);
    }

    // Ground spotlight (TRUE UPLIGHT): Warm amber beam illuminating underside of foliage
    if (index === 3) {
      const warmUplight = new THREE.PointLight(0xffbe40, 4.2, 11, 1.6);
      warmUplight.position.set(x + 0.2, 0.4, z + 0.2);
      this.modernArrivalGroup.add(warmUplight);
    }

    // Secondary subtle cyan accent uplight on opposite side
    // Cool foliage contrast remains in the layered canopy material.

    this.modernArrivalGroup.add(treeGroup);
  }

  private createDistantFestival() {
    // =========================================================================
    // THE DISTANT FESTIVAL: Horizon Light Dome & Grounded Giant Moon Installation
    // =========================================================================

    // 1. Atmospheric Horizon Light Dome Backdrop (Z = -58.0)
    // Warm golden-orange glow rising into sky, eliminating weird trapezoid & wires
    const festivalTex = TextureGenerator.createDistantFestivalCanopyTexture();
    const festivalGeo = new THREE.PlaneGeometry(110, 36);
    const festivalMat = new THREE.MeshBasicMaterial({
      map: festivalTex,
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide
    });
    this.distantFestivalBackdrop = new THREE.Mesh(festivalGeo, festivalMat);
    this.distantFestivalBackdrop.position.set(0, 15.0, -58.0);
    this.distantFestivalGroup.add(this.distantFestivalBackdrop);

    // 2. Giant Moon Art Installation: Architectural Pedestal on Plaza Floor (Z = -52.0)
    // Sits securely on circular water fountain / stepped flat stone pedestal resting on ground!
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -52.0);

    // Tier 1: Large circular flat dark granite plaza base
    const podiumGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.25, 48);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x141b29,
      roughness: 0.5,
      metalness: 0.4
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, 0.125, 0);
    pedestalGroup.add(podium);

    // Tier 2: Water mirror fountain basin with glowing golden LED perimeter ring
    const basinGeo = new THREE.CylinderGeometry(7.2, 7.2, 0.12, 48);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x091424,
      metalness: 0.95,
      roughness: 0.05
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(0, 0.22, 0);
    pedestalGroup.add(basin);

    const rimGeo = new THREE.TorusGeometry(7.2, 0.08, 10, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.5,
      roughness: 0.2
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.28, 0);
    pedestalGroup.add(rim);

    // Tier 3: Sleek circular pedestal mount on ground (NO mantis cradle arms!)
    const mountGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.45, 24);
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x1a2336,
      roughness: 0.35,
      metalness: 0.8
    });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(0, 0.42, 0);
    pedestalGroup.add(mount);

    // Glowing golden collar ring on pedestal mount
    const collarGeo = new THREE.TorusGeometry(1.65, 0.06, 8, 24);
    const collar = new THREE.Mesh(collarGeo, rimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.65, 0);
    pedestalGroup.add(collar);

    // 3. The Giant Moon Art Sculpture standing firmly on the pedestal mount
    // Outer golden constellation LED ring (center at Y = 3.8m, bottom touches mount at Y = 0.2m)
    const ringGeo = new THREE.TorusGeometry(3.6, 0.12, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.1,
      roughness: 0.15
    });
    this.giantMoonRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.giantMoonRingMesh.position.set(0, 3.8, 0);
    pedestalGroup.add(this.giantMoonRingMesh);

    // Luminous Crescent Moon disc with artistic jade rabbit motif
    const giantMoonTex = TextureGenerator.createGiantMoonSculptureTexture();
    const crescentGeo = new THREE.PlaneGeometry(6.8, 6.8);
    const crescentMat = new THREE.MeshBasicMaterial({
      map: giantMoonTex,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide
    });
    this.giantMoonCrescentMesh = new THREE.Mesh(crescentGeo, crescentMat);
    this.giantMoonCrescentMesh.position.set(0, 3.8, 0.05);
    pedestalGroup.add(this.giantMoonCrescentMesh);

    this.distantFestivalGroup.add(pedestalGroup);

    // 4. Basin Spotlight & Plaza Illumination
    this.giantMoonLight = new THREE.PointLight(0xffbe3b, 5.2, 55, 1.2);
    this.giantMoonLight.position.set(0, 1.8, -49.5);
    this.distantFestivalGroup.add(this.giantMoonLight);

    // Painted horizon and emissive architecture preserve the distant color field.
  }

  public update(delta: number, time: number) {
    this.sceneTimer += delta;
    const t = this.sceneTimer;

    // -------------------------------------------------------------------------
    // 1. CAMERA CHOREOGRAPHY & STORY PROGRESSION (0s -> 25s)
    // -------------------------------------------------------------------------
    // STAGE 0 (0s -> 3.5s): Moon Bridge Continuity
    // Holds steady at high altitude gazing at celestial Moon as veil dissolves.
    // Distant festival is hidden so celestial Moon reigns pristine in the night sky!
    if (t < 3.5) {
      this.distantFestivalGroup.visible = false;
      this.camera.position.copy(this.handoffCamPos);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.handoffLookAt);
    }
    // STAGE 1 (3.5s -> 9.5s): Descent from Sky to Elevated Terrace & Handheld Lantern Closeup
    else if (t < 9.5) {
      this.distantFestivalGroup.visible = true;
      const glideDuration = 3.2; // Camera reaches player OTS at t = 6.7s
      const p = Math.min(1.0, (t - 3.5) / glideDuration);
      const e = p * p * (3 - 2 * p); // smoothstep

      this.camera.position.lerpVectors(this.handoffCamPos, this.playerCamPos, e);

      const curLookAt = new THREE.Vector3().lerpVectors(this.handoffLookAt, this.playerLookAt, e);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(curLookAt);

      // Subtitle & Lantern Evolution trigger at t = 6.8s (framed in elegant handheld closeup)
      if (t >= 6.8 && !this.lanternEvolved) {
        this.lanternEvolved = true;
        this.lantern.setModernized(true);
        audioManager.playLanternModernizeChime();
        this.overlay.setSubtitle(StoryConfig.modernArrival.lanternEvolve, 5000);
      }
    }
    // STAGE 2 (9.5s -> 16.5s): Camera Sweeps Across Midground Modern Park
    else if (t < 16.5) {
      this.distantFestivalGroup.visible = true;
      const p = (t - 9.5) / 7.0;
      const e = p * p * (3 - 2 * p);

      this.camera.position.lerpVectors(this.playerCamPos, this.sweepCamPos, e);

      const curLookAt = new THREE.Vector3().lerpVectors(this.playerLookAt, this.sweepLookAt, e);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(curLookAt);

      if (t >= 10.0 && !this.motifPlayed) {
        this.motifPlayed = true;
        audioManager.playModernPentatonicMotif();
        this.overlay.setSubtitle(StoryConfig.modernArrival.parkDescent, 6500);
      }
    }
    // STAGE 3 (16.5s+): Master Elevated Overlook, Sound Cue & Festival Reveal
    else {
      this.distantFestivalGroup.visible = true;

      // SUB-STAGE 4B.A: Camera Turning toward distant festival vista (~75° right)
      if (this.isTurningToVista) {
        this.turnTimer += delta;
        const p = Math.min(1.0, this.turnTimer / 3.8);
        const e = p * p * (3 - 2 * p); // smoothstep

        // Audio Pan & Volume transition: smoothly pushes sound from right ear (0.8) to centered stereo (0.0)
        audioManager.updateFestivalVistaAudio(0.8 * (1.0 - e), 0.7 + e * 0.3);

        this.camera.position.lerpVectors(this.masterCamPos, this.vistaCamPos, e);
        const curLookAt = new THREE.Vector3().lerpVectors(this.masterLookAt, this.vistaLookAt, e);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(curLookAt);

        if (p >= 1.0) {
          this.isTurningToVista = false;
          this.isVistaRevealed = true;
          this.vistaTimer = 0;
          this.overlay.setSubtitle(StoryConfig.modernArrival.festivalVistaReveal, 5000);
        }
      }
      // SUB-STAGE 4C: Approach the Festival Walk (Phase 4C)
      else if (this.isApproaching) {
        this.approachTimer += delta;
        // 9.5s walk along the S-curve
        const ap = Math.min(1.0, this.approachTimer / 9.5);
        this.approachProgress = ap;
        const ae = ap * ap * (3 - 2 * ap); // smoothstep

        const pt = this.approachPathCurve.getPoint(ae);
        const tangent = this.approachPathCurve.getTangent(ae).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        // Player avatar movement with subtle walking bob
        const bob = Math.abs(Math.sin(this.approachTimer * 6.5)) * 0.045;
        this.playerAnchor.position.set(pt.x, pt.y + 0.92 + bob, pt.z);
        this.playerAnchor.rotation.y = Math.atan2(-tangent.z, tangent.x) - Math.PI / 2;

        // Frame the lantern as the walking character in the near paper layer.
        const handOffset = normal.clone().multiplyScalar(0.48)
          .addScaledVector(tangent, -0.85)
          .add(new THREE.Vector3(0, 1.82 + bob * 0.5, 0));
        this.lantern.group.position.copy(pt).add(handOffset);
        this.lantern.group.scale.setScalar(0.38);

        // Camera smooth third-person follow
        const camBack = tangent.clone().multiplyScalar(-4.4);
        const camSide = normal.clone().multiplyScalar(-0.55);
        const targetCamPos = pt.clone().add(camBack).add(camSide);
        targetCamPos.y = pt.y + 2.15;
        this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * 6.0));

        const lookAhead = pt.clone().add(tangent.clone().multiplyScalar(18.0));
        lookAhead.y = pt.y + 1.7;
        this.camera.lookAt(lookAhead);
        this.lantern.group.lookAt(this.camera.position);
        this.lantern.group.rotateZ(Math.sin(this.approachTimer * 4.0) * 0.08);

        // Footsteps sound
        this.approachFootstepTimer += delta;
        if (this.approachFootstepTimer >= 0.48) {
          this.approachFootstepTimer = 0;
          audioManager.playModernFootstep();
        }

        // Dynamic audio distance progression: volume and clarity rise steadily
        audioManager.updateFestivalVistaAudio(0.0, 1.0 + ae * 0.55);

        // Mid-approach subtitle
        if (ap >= 0.45 && !this.midApproachSubtitleShown) {
          this.midApproachSubtitleShown = true;
          this.overlay.setSubtitle(StoryConfig.modernArrival.midApproach, 4800);
        }

        // Final handoff stop
        if (ap >= 1.0) {
          this.isApproaching = false;
          this.approachCompleted = true;
          this.stage = 6;
          this.overlay.setSubtitle(StoryConfig.modernArrival.nearFestivalHandoff, 6000);
          this.overlay.showNextButton(StoryConfig.modernArrival.actionEnterFestival, () => {
            this.onComplete();
          });
        }
      }
      // SUB-STAGE 4C COMPLETED: Player stands before the gate (Pre-Phase-5 handoff state)
      else if (this.approachCompleted) {
        const pt = this.approachPathCurve.getPoint(1.0);
        const tangent = this.approachPathCurve.getTangent(1.0).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const breath = Math.sin(time * 1.5) * 0.015;
        this.playerAnchor.position.set(pt.x, pt.y + 0.92 + breath, pt.z);

        const handOffset = normal.clone().multiplyScalar(0.48)
          .addScaledVector(tangent, -0.85)
          .add(new THREE.Vector3(0, 1.82 + breath * 0.5, 0));
        this.lantern.group.position.copy(pt).add(handOffset);

        const camBack = tangent.clone().multiplyScalar(-4.4);
        const camSide = normal.clone().multiplyScalar(-0.55);
        this.camera.position.set(pt.x + camBack.x + camSide.x, pt.y + 2.15 + breath * 0.5, pt.z + camBack.z + camSide.z);

        const lookAhead = pt.clone().add(tangent.clone().multiplyScalar(18.0));
        lookAhead.y = pt.y + 1.7;
        this.camera.lookAt(lookAhead);
        this.lantern.group.lookAt(this.camera.position);
      }
      // SUB-STAGE 4B.B: Festival Vista Revealed — Anticipation, Slow Dolly & Atmosphere
      else if (this.isVistaRevealed) {
        this.vistaTimer += delta;

        // Slow, majestic push-in dolly (dramatic anticipation: LOOK, NOT ARRIVE)
        const dp = Math.min(1.0, this.vistaTimer / 12.0);
        const de = dp * (2 - dp); // easeOutQuad

        this.camera.position.lerpVectors(this.vistaCamPos, this.vistaDollyCamPos, de);
        // Gentle organic breathing motion
        const breath = Math.sin(time * 1.4) * 0.012;
        this.camera.position.y += breath;

        const curLookAt = new THREE.Vector3().lerpVectors(this.vistaLookAt, this.vistaDollyLookAt, de);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(curLookAt);

        if (this.vistaTimer >= 4.5 && this.stage < 4) {
          this.stage = 4;
          this.overlay.setSubtitle(StoryConfig.modernArrival.festivalVistaAnticipation, 6000);
        }

        if (this.vistaTimer >= 6.0 && !this.finalButtonShown) {
          this.finalButtonShown = true;
          this.overlay.showNextButton(StoryConfig.modernArrival.actionEnterPark, () => {
            this.startApproach();
          });
        }
      }
      // SUB-STAGE 4A: Master Elevated Overlook facing Moon Art Installation
      else {
        const p = Math.min(1.0, (t - 16.5) / 3.8);
        const e = p * p * (3 - 2 * p);

        this.camera.position.lerpVectors(this.sweepCamPos, this.masterCamPos, e);

        // Gentle floating breathing motion
        const breath = Math.sin(t * 1.4) * 0.02;
        this.camera.position.y += breath;

        const curLookAt = new THREE.Vector3().lerpVectors(this.sweepLookAt, this.masterLookAt, e);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(curLookAt);

        // 1. Initial overlook subtitle
        if (t >= 17.0 && this.stage < 3) {
          this.stage = 3;
          this.overlay.setSubtitle(StoryConfig.modernArrival.elevatedViewpoint, 4200);
        }

        // 2. Sound Cue Emerges from the right (+X direction across the hill)
        if (t >= 20.0 && !this.soundCueTriggered) {
          this.soundCueTriggered = true;
          audioManager.startFestivalVistaAmbience();
          this.overlay.setSubtitle(StoryConfig.modernArrival.soundCueArrival, 4600);
        }

        // 3. Action button prompts player to turn toward the sound
        if (t >= 21.0 && !this.buttonShown && !this.isTurningToVista) {
          this.buttonShown = true;
          this.overlay.showNextButton(StoryConfig.modernArrival.actionTurnToFestival, () => {
            this.triggerTurnToVista();
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. DYNAMIC ACTORS & ENVIRONMENT UPDATES
    // -------------------------------------------------------------------------
    // 1. Celestial Moon tracking
    this.moon.update(this.camera);

    // 2. Handheld Star Lantern gentle breathing LED pulse & sway
    this.lantern.update(delta, 0.05);
    // The close lantern should draw the eye without bleaching the stone terrace.
    this.lantern.candleLight.intensity *= 0.5;
    const lanternBob = Math.sin(time * 2.4) * 0.008;
    if (!this.isApproaching && !this.approachCompleted) {
      this.lantern.group.position.set(0.95, 1.90 + lanternBob, 4.0);
    }

    // 3. Contemporary visitors gentle strolling animation
    this.parkVisitorMeshes.forEach((mesh, idx) => {
      mesh.position.set(mesh.userData.baseX + Math.sin(time * .65 + idx * 1.5) * .10,
        Math.sin(time * 2.1 + idx) * .025,
        mesh.userData.baseZ + Math.cos(time * .55 + idx) * .06);
      this.crowdKit.animateActor(mesh as THREE.Group, time, idx * .8);
    });

    // 4. Giant Moon Sculpture radiant breathing pulse & gentle rotation
    if (this.giantMoonLight) {
      this.giantMoonLight.intensity = 5.2 + Math.sin(time * 2.0) * 0.4;
    }
    if (this.giantMoonRingMesh) {
      this.giantMoonRingMesh.rotation.z = Math.sin(time * 0.35) * 0.04;
    }

    // 5. Park lamp lights subtle steady electric hum
    this.parkLampLights.forEach((light, idx) => {
      light.intensity = 2.0 + Math.sin(time * 6.0 + idx * 2.0) * 0.08;
    });

    // 6. Tree canopies subtle breeze sway
    this.treeCanopies.forEach((canopy, idx) => {
      canopy.position.x += Math.sin(time * 1.5 + idx) * 0.0008;
    });

    // 7. Distant Festival Vista dynamic actors (Lion dance hops, stage moon pulse, canopy sway)
    if (this.distantFestivalVista) {
      this.distantFestivalVista.update(delta, time);
    }
  }

  public triggerTurnToVista() {
    if (this.isTurningToVista || this.isVistaRevealed) return;
    this.isTurningToVista = true;
    this.turnTimer = 0;
    this.overlay.hideNextButton();
    audioManager.playGrandSquarePivotAudio(0.85);
    this.overlay.setSubtitle(StoryConfig.modernArrival.pivotToGrandSquare, 3800);
  }

  public startApproach() {
    if (this.isApproaching || this.approachCompleted) return;
    this.isApproaching = true;
    this.isVistaRevealed = false;
    this.approachTimer = 0;
    this.approachProgress = 0;
    this.approachFootstepTimer = 0;
    this.stage = 5;
    this.overlay.hideNextButton();
    this.overlay.setSubtitle(StoryConfig.modernArrival.approachingFestival, 4600);
  }

  public destroy() {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
      this.boundOnKeyDown = null;
    }

    this.overlay.clearSubtitle();
    this.overlay.hideNextButton();

    // Stop modern ambient audio and festival vista loop
    audioManager.stopModernAmbientAudio();

    // Clean up fade curtain DOM
    if (this.fadeCurtainEl && this.fadeCurtainEl.parentNode) {
      this.fadeCurtainEl.parentNode.removeChild(this.fadeCurtainEl);
      this.fadeCurtainEl = null;
    }

    // Revert bloom post-processing settings strictly back to previous values (anti-regression)
    const g = (window as any).game;
    if (g?.renderer?.bloomPass) {
      g.renderer.bloomPass.strength = this.prevBloomStrength;
      g.renderer.bloomPass.radius = this.prevBloomRadius;
      g.renderer.bloomPass.threshold = this.prevBloomThreshold;
    }

    // Dispose all scene meshes, geometries, and materials safely
    if (this.modernArrivalGroup) {
      this.scene.remove(this.modernArrivalGroup);
      disposeSceneResources(this.modernArrivalGroup);
    }
    this.crowdKit.dispose();

    if (this.distantFestivalGroup) {
      this.scene.remove(this.distantFestivalGroup);
      disposeSceneResources(this.distantFestivalGroup);
    }

    if (this.distantFestivalVista) {
      this.scene.remove(this.distantFestivalVista.group);
      this.distantFestivalVista.dispose();
    }

    // Revert camera far plane safely (anti-regression)
    this.camera.far = this.prevCameraFar;
    this.camera.updateProjectionMatrix();

    // Revert fog and background safely
    this.scene.fog = null;
  }
}
