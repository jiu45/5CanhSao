import * as THREE from 'three';
import { IScene } from './BaseScene';
import { StarLantern } from '../props/StarLantern';
import { Moon } from '../props/Moon';
import { LionCharacter } from '../props/LionCharacter';
import { TextureGenerator } from '../utils/TextureGenerator';
import { audioManager } from '../audio/AudioManager';
import { StoryConfig } from '../config/StoryConfig';
import { StoryOverlay } from '../ui/StoryOverlay';
import { LionDanceGestureOverlay } from '../ui/LionDanceGestureOverlay';

export enum SquareSceneState {
  SPECTATOR_INTRO = 0,
  TRANSITION_TO_LION = 1,
  LION_POV_MINIGAME = 2,
  TRANSITION_TO_SPECTATOR = 3,
  FINAL_SPECTACLE = 4,
  MEMORY_ASCENT = 5,
  PAST_ENDING_COMPLETE = 6
}

export class FestivalSquareScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private overlay: StoryOverlay;
  private gestureOverlay: LionDanceGestureOverlay;
  private onComplete: () => void;

  // Scene Props
  private lantern: StarLantern;
  private lanternLight: THREE.PointLight;
  private moon: Moon;
  private lion: LionCharacter;

  // Environment elements
  private courtyardPaving!: THREE.Mesh;
  private templeFacade!: THREE.Mesh;
  private banyanTree!: THREE.Mesh;

  // Foreground Over-the-Shoulder Children (Attached to camera rig in spectator mode)
  private fgKidsLeft!: THREE.Mesh;
  private fgKidsRight!: THREE.Mesh;

  // Encircling Arc Crowd
  private crowdPlanes: THREE.Mesh[] = [];
  private childLanterns: THREE.Group[] = [];
  private arenaLights: THREE.PointLight[] = [];
  private buntingMeshes: THREE.Mesh[] = [];

  // ===========================================================================
  // 180-DEGREE REVERSE AUDIENCE (Seen only in Lion POV when looking outwards toward +Z)
  // ===========================================================================
  private reverseAudienceGroup: THREE.Group = new THREE.Group();
  private playerChildMesh!: THREE.Mesh;
  private playerChildLight!: THREE.PointLight;

  // ===========================================================================
  // ISOLATED ASCENT TRANSITION GROUP (Phase 3 Iteration C: Scene-scoped Assets)
  // ===========================================================================
  private ascentTransitionGroup: THREE.Group = new THREE.Group();
  private groundHeroChildMesh!: THREE.Mesh;
  private groundHeroLanternLight!: THREE.PointLight;
  private spectacleTimer: number = 0;
  private ascentTimer: number = 0;
  private ascentStage: number = 0;
  private fadeCurtainEl: HTMLElement | null = null;
  private defaultFogDensity: number = 0.018;
  private defaultFogColor: number = 0x081024;
  private defaultBgColor: number = 0x040816;
  private defaultBloomThreshold: number = 0.78;
  private defaultBloomStrength: number = 0.52;

  // Scene Flow & Timers
  public sceneState: SquareSceneState = SquareSceneState.SPECTATOR_INTRO;
  private sceneTimer: number = 0;
  private revealPhase: number = 0;
  private drumTimer: number = 0;
  private cheerTimer: number = 0;

  // Camera Choreography Coordinates
  // 1. Spectator OTS child eye-level (~1.18m looking toward -Z at lion & temple)
  private camStartPos = new THREE.Vector3(0, 1.24, 1.2);
  private camCirclePos = new THREE.Vector3(0, 1.18, 0.0);
  private camTargetLookAt = new THREE.Vector3(0, 1.35, -4.8);

  // 2. Lion POV: 180-Degree Reverse Look inside the paper-mache head looking outwards toward the child & crowd (+Z)
  private camLionPovPos = new THREE.Vector3(0, 1.45, -4.15);
  private camLionPovLookAt = new THREE.Vector3(0, 1.25, 0.0);
  private tactileOffset = { x: 0, y: 0 };
  private povReactionOffset = { x: 0, y: 0, z: 0 };
  private povReactionTimer: number = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    onComplete: () => void,
    private readonly onAscentStart?: () => void
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040816);
    this.scene.fog = new THREE.FogExp2(0x081024, 0.018);
    this.camera = camera;
    this.overlay = overlay;
    this.onComplete = onComplete;

    // Attach camera to scene so child objects move in camera space
    this.scene.add(this.camera);

    // 1. Player's Hero Star Lantern (Attached to camera in lower-right corner in spectator view)
    this.lantern = new StarLantern();
    this.lantern.setStep(4);
    this.lantern.group.scale.set(0.33, 0.33, 0.33);
    this.lantern.group.position.set(0.55, -0.49, -0.80);
    this.lanternLight = new THREE.PointLight(0xffa238, 2.6, 4.8, 1.6);
    this.lanternLight.position.set(0, -0.4, 0.15);
    this.lantern.group.add(this.lanternLight);
    this.camera.add(this.lantern.group);

    // 2. Foreground Over-the-Shoulder Kids (Attached to camera, framing the left edge in spectator view)
    const fgLeftTex = TextureGenerator.createForegroundKidsTexture('left');
    const fgLeftGeo = new THREE.PlaneGeometry(1.35, 1.35);
    const fgLeftMat = new THREE.MeshBasicMaterial({
      map: fgLeftTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    this.fgKidsLeft = new THREE.Mesh(fgLeftGeo, fgLeftMat);
    this.fgKidsLeft.position.set(-0.64, -0.18, -0.88);
    this.fgKidsLeft.rotation.y = 0.18;
    this.camera.add(this.fgKidsLeft);

    // Right Foreground: Friend crouching beside player's lantern
    const fgRightTex = TextureGenerator.createForegroundKidsTexture('right');
    const fgRightGeo = new THREE.PlaneGeometry(1.15, 1.15);
    const fgRightMat = new THREE.MeshBasicMaterial({
      map: fgRightTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    this.fgKidsRight = new THREE.Mesh(fgRightGeo, fgRightMat);
    this.fgKidsRight.position.set(0.50, -0.22, -0.88);
    this.fgKidsRight.rotation.y = -0.16;
    this.camera.add(this.fgKidsRight);

    // 3. Full Moon placed in upper-right sky
    this.moon = new Moon();
    this.moon.group.position.set(4.8, 7.2, -14.0);
    this.moon.directionalLight.position.set(7.5, 15.0, -10.0);
    this.moon.directionalLight.target.position.set(0, 0.5, -4.8);
    this.scene.add(this.moon.directionalLight.target);
    this.scene.add(this.moon.group);

    // Moonlight ambient wash
    const ambient = new THREE.AmbientLight(0x1a284c, 0.95);
    this.scene.add(ambient);

    // 4. Central Traditional Lion Character (Dancing directly on ground, no pedestal!)
    this.lion = new LionCharacter();
    this.scene.add(this.lion.group);

    // Build the intimate, encircling village courtyard environment
    this.buildFestivalEnvironment();

    // 5. Interactive Lion Dance Gesture Minigame Overlay
    this.gestureOverlay = new LionDanceGestureOverlay();
    this.gestureOverlay.setOnDragOffset((dx, dy) => {
      this.tactileOffset.x = dx;
      this.tactileOffset.y = dy;
    });
  }

  private buildFestivalEnvironment() {
    // =========================================================================
    // 1. Seamless Terracotta Flagstone Courtyard Floor (Sân gạch Bát Tràng phẳng phiu)
    // =========================================================================
    const floorTex = TextureGenerator.createCourtyardPavingTexture();
    floorTex.repeat.set(16, 16);
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.08
    });
    this.courtyardPaving = new THREE.Mesh(floorGeo, floorMat);
    this.courtyardPaving.rotation.x = -Math.PI / 2;
    this.courtyardPaving.position.set(0, 0, -8);
    this.scene.add(this.courtyardPaving);

    // =========================================================================
    // 2. Encircling Arc of Spectator Children (Vòng tròn khép kín ấm cúng)
    // =========================================================================
    const crowdTexL = TextureGenerator.createFestivalCrowdTexture('left');
    const crowdTexR = TextureGenerator.createFestivalCrowdTexture('right');
    const crowdTexF = TextureGenerator.createFestivalCrowdTexture('front');

    const createCrowdMat = (tex: THREE.Texture) => new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });

    // Left Arc Flank
    const crowdL = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.8), createCrowdMat(crowdTexL));
    crowdL.position.set(-3.2, 1.15, -4.2);
    crowdL.rotation.y = Math.PI * 0.32;
    this.scene.add(crowdL);
    this.crowdPlanes.push(crowdL);

    // Right Arc Flank
    const crowdR = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.8), createCrowdMat(crowdTexR));
    crowdR.position.set(3.2, 1.15, -4.2);
    crowdR.rotation.y = -Math.PI * 0.32;
    this.scene.add(crowdR);
    this.crowdPlanes.push(crowdR);

    // Opposite Rear Arc (Kids across the circle facing inward toward camera & lion)
    const crowdBack = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 2.8), createCrowdMat(crowdTexF));
    crowdBack.position.set(0, 0.98, -8.2);
    this.scene.add(crowdBack);
    this.crowdPlanes.push(crowdBack);

    // Little glowing lanterns in the circle (using soft circular gradient to avoid square particle artifacts)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const gCtx = glowCanvas.getContext('2d')!;
    const radGlow = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGlow.addColorStop(0.35, 'rgba(255, 240, 180, 0.9)');
    radGlow.addColorStop(0.7, 'rgba(255, 180, 50, 0.4)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gCtx.fillStyle = radGlow;
    gCtx.fillRect(0, 0, 64, 64);
    const softGlowTex = new THREE.CanvasTexture(glowCanvas);

    for (let c = 0; c < 14; c++) {
      const cGroup = new THREE.Group();
      const sGeo = new THREE.PlaneGeometry(0.28, 0.28);
      const sMat = new THREE.MeshBasicMaterial({
        map: softGlowTex,
        color: [0xff4411, 0xf59e0b, 0xffbb22, 0xff6633, 0x10b981][c % 5],
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      cGroup.add(sMesh);

      const angle = (c / 14) * Math.PI + Math.PI;
      const radiusX = 3.6 + (c % 3) * 0.3;
      const radiusZ = 3.2 + (c % 2) * 0.4;
      const lx = Math.cos(angle) * radiusX;
      const lz = -4.8 + Math.sin(angle) * radiusZ;
      const ly = 0.95 + (c % 3) * 0.2;

      cGroup.position.set(lx, ly, lz);
      this.scene.add(cGroup);
      this.childLanterns.push(cGroup);
    }

    // =========================================================================
    // 3. Authentic Northern Vietnamese Communal Temple & Elders (Hậu cảnh phía -Z)
    // =========================================================================
    const dinhTex = TextureGenerator.createDinhFacadeTexture();
    const dinhGeo = new THREE.PlaneGeometry(28, 9.8);
    const dinhMat = new THREE.MeshBasicMaterial({
      map: dinhTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      fog: false
    });
    this.templeFacade = new THREE.Mesh(dinhGeo, dinhMat);
    this.templeFacade.position.set(0, 3.4, -14.0);
    this.scene.add(this.templeFacade);

    // Ancient Sacred Banyan Tree at rear left with hanging aerial roots
    const banyanTex = TextureGenerator.createBanyanTreeSilhouette();
    const banyanGeo = new THREE.PlaneGeometry(18, 18);
    const banyanMat = new THREE.MeshBasicMaterial({
      map: banyanTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    this.banyanTree = new THREE.Mesh(banyanGeo, banyanMat);
    this.banyanTree.position.set(-10.5, 7.5, -12.0);
    this.scene.add(this.banyanTree);

    // Diagonal overhead festival buntings strung gracefully across the circle
    const buntingTex = TextureGenerator.createFestivalBuntingTexture();
    const buntingGeo = new THREE.PlaneGeometry(12, 1.8);
    const buntingMat = new THREE.MeshBasicMaterial({
      map: buntingTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    const bunting1 = new THREE.Mesh(buntingGeo, buntingMat);
    bunting1.position.set(-2.0, 4.4, -9.0);
    bunting1.rotation.y = 0.18;
    bunting1.rotation.z = -0.04;
    this.scene.add(bunting1);
    this.buntingMeshes.push(bunting1);

    const bunting2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.6), buntingMat.clone());
    bunting2.position.set(1.5, 3.9, -6.5);
    bunting2.rotation.y = -0.14;
    bunting2.rotation.z = 0.03;
    this.scene.add(bunting2);
    this.buntingMeshes.push(bunting2);

    // =========================================================================
    // 4. Warm Festival Arena Torches
    // =========================================================================
    [-3.5, 3.5].forEach((tx, idx) => {
      const torchLight = new THREE.PointLight(idx === 0 ? 0xff6622 : 0xffaa33, 2.8, 10.0, 1.5);
      torchLight.position.set(tx, 1.6, -5.0);
      this.scene.add(torchLight);
      this.arenaLights.push(torchLight);
    });

    // Central ground warm wash
    const groundLight = new THREE.PointLight(0xff9933, 3.2, 12.0, 1.4);
    groundLight.position.set(0, 2.2, -4.8);
    this.scene.add(groundLight);
    this.arenaLights.push(groundLight);

    // =========================================================================
    // 5. 180-DEGREE REVERSE AUDIENCE: The Player's Child Persona & Friends
    //    (Seen when looking out through the lion's eyes at +Z!)
    // =========================================================================
    this.reverseAudienceGroup = new THREE.Group();

    // Center Hero: The Player's Child Persona holding the radiant Star Lantern!
    const heroTex = TextureGenerator.createPlayerChildWithLanternTexture();
    const heroGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const heroMat = new THREE.MeshBasicMaterial({
      map: heroTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    });
    this.playerChildMesh = new THREE.Mesh(heroGeo, heroMat);
    this.playerChildMesh.position.set(0, 1.25, -0.40);
    this.playerChildMesh.rotation.y = Math.PI; // Facing -Z towards the lion!
    this.reverseAudienceGroup.add(this.playerChildMesh);

    // Warm radial light cast from the player child's star lantern
    this.playerChildLight = new THREE.PointLight(0xffaa38, 3.8, 8.5, 1.3);
    this.playerChildLight.position.set(0, 1.55, -0.35);
    this.reverseAudienceGroup.add(this.playerChildLight);

    // Flanking Left & Right crowds in reverse view
    const crowdRevL = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.8), new THREE.MeshBasicMaterial({
      map: crowdTexL,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    }));
    crowdRevL.position.set(-3.4, 1.15, -0.6);
    crowdRevL.rotation.y = Math.PI - 0.28;
    this.reverseAudienceGroup.add(crowdRevL);

    const crowdRevR = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.8), new THREE.MeshBasicMaterial({
      map: crowdTexR,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    }));
    crowdRevR.position.set(3.4, 1.15, -0.6);
    crowdRevR.rotation.y = Math.PI + 0.28;
    this.reverseAudienceGroup.add(crowdRevR);

    // Distant nocturnal village festival gate & glowing lantern strings at +Z
    const gateTex = TextureGenerator.createVillageFestivalEntranceTexture();
    const gateGeo = new THREE.PlaneGeometry(26, 13);
    const gateMat = new THREE.MeshBasicMaterial({
      map: gateTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      fog: false
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 4.6, 8.0);
    gateMesh.rotation.y = Math.PI; // Facing -Z
    this.reverseAudienceGroup.add(gateMesh);

    this.reverseAudienceGroup.visible = false;
    this.scene.add(this.reverseAudienceGroup);

    // Build the nocturnal village landscape, rooftop clusters, and glowing constellation
    // Build the isolated nocturnal village landscape and ascent transition group
    this.buildAscentTransitionGroup();
  }

  private buildAscentTransitionGroup() {
    this.ascentTransitionGroup = new THREE.Group();

    // 1. Sprawling Nocturnal Village Landscape Plane (160m x 160m)
    const landscapeTex = TextureGenerator.createNocturnalLandscapeTexture();
    const landscapeGeo = new THREE.PlaneGeometry(160, 160);
    const landscapeMat = new THREE.MeshBasicMaterial({
      map: landscapeTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    const landscapeMesh = new THREE.Mesh(landscapeGeo, landscapeMat);
    landscapeMesh.rotation.x = -Math.PI / 2;
    landscapeMesh.position.set(0, -0.04, -4.0);
    this.ascentTransitionGroup.add(landscapeMesh);

    // 2. Encircling dark silhouette bamboo groves fading into the nocturnal fog (bóng rặng tre nghiêng ngả)
    const bambooTex = TextureGenerator.createBambooGroveSilhouette();
    const bambooMat = new THREE.MeshBasicMaterial({
      map: bambooTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    const bambooPositions = [
      { x: -14.0, y: 4.8, z: -3.0, w: 14, h: 11, rotY: 0.28 },
      { x: 14.0, y: 4.8, z: -4.0, w: 14, h: 11, rotY: -0.25 },
      { x: -17.5, y: 5.2, z: -11.0, w: 16, h: 12, rotY: 0.15 },
      { x: 17.5, y: 5.2, z: -12.0, w: 16, h: 12, rotY: -0.18 },
      { x: -11.0, y: 4.2, z: 6.5, w: 13, h: 10, rotY: Math.PI - 0.22 },
      { x: 11.5, y: 4.2, z: 7.0, w: 13, h: 10, rotY: Math.PI + 0.22 },
      { x: -6.0, y: 5.5, z: -17.0, w: 15, h: 12, rotY: 0.05 },
      { x: 6.0, y: 5.5, z: -17.0, w: 15, h: 12, rotY: -0.05 }
    ];

    bambooPositions.forEach(bp => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(bp.w, bp.h), bambooMat);
      mesh.position.set(bp.x, bp.y, bp.z);
      mesh.rotation.y = bp.rotY;
      this.ascentTransitionGroup.add(mesh);
    });

    // 3. Ground Hero Child (The player's ground avatar standing in the circle holding star lantern)
    // Encapsulated strictly inside ascentTransitionGroup
    const childTex = TextureGenerator.createPlayerChildWithLanternTexture();
    const childGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const childMat = new THREE.MeshBasicMaterial({
      map: childTex,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });
    this.groundHeroChildMesh = new THREE.Mesh(childGeo, childMat);
    this.groundHeroChildMesh.position.set(0.0, 1.15, -0.2);
    this.groundHeroChildMesh.visible = false;
    this.ascentTransitionGroup.add(this.groundHeroChildMesh);

    this.groundHeroLanternLight = new THREE.PointLight(0xffaa33, 2.6, 7.5, 1.4);
    this.groundHeroLanternLight.position.set(0.0, 1.35, -0.2);
    this.groundHeroLanternLight.visible = false;
    this.ascentTransitionGroup.add(this.groundHeroLanternLight);

    // 4. Soft Nocturnal Courtyard Fog Feathering Apron (Xóa bỏ mép vuông, hòa tan 4 cạnh sân vào sương đêm)
    const featherTex = TextureGenerator.createCourtyardFogFeatherTexture();
    const featherGeo = new THREE.PlaneGeometry(54, 54);
    const featherMat = new THREE.MeshBasicMaterial({
      map: featherTex,
      transparent: true,
      depthWrite: false
    });
    const courtyardFeatherMesh = new THREE.Mesh(featherGeo, featherMat);
    courtyardFeatherMesh.rotation.x = -Math.PI / 2;
    courtyardFeatherMesh.position.set(0, 0.006, -8.0);
    this.ascentTransitionGroup.add(courtyardFeatherMesh);

    // Initial state: hidden during spectator walk, crafting, and minigame
    this.ascentTransitionGroup.visible = false;
    this.scene.add(this.ascentTransitionGroup);
  }

  private createFadeCurtain() {
    if (this.fadeCurtainEl) return;
    this.fadeCurtainEl = document.createElement('div');
    this.fadeCurtainEl.id = 'memory-ascent-veil';
    this.fadeCurtainEl.style.position = 'fixed';
    this.fadeCurtainEl.style.inset = '0';
    this.fadeCurtainEl.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(244, 246, 250, 0.96) 65%, rgba(230, 236, 245, 0.92) 100%)';
    this.fadeCurtainEl.style.opacity = '0';
    this.fadeCurtainEl.style.pointerEvents = 'none';
    this.fadeCurtainEl.style.transition = 'opacity 3.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
    this.fadeCurtainEl.style.zIndex = '14';
    document.body.appendChild(this.fadeCurtainEl);
  }

  public startMemoryAscent() {
    if (this.sceneState === SquareSceneState.MEMORY_ASCENT || this.sceneState === SquareSceneState.PAST_ENDING_COMPLETE) {
      return;
    }

    this.sceneState = SquareSceneState.MEMORY_ASCENT;
    this.ascentTimer = 0;
    this.ascentStage = 0;
    this.overlay.hideNextButton();

    // Fast, absolute detachment of foreground camera attachments:
    // Star lantern stays firmly anchored in child's hands on the ground!
    this.lantern.group.visible = false;
    this.fgKidsLeft.visible = false;
    this.fgKidsRight.visible = false;

    // Hide low-hanging festival buntings so celestial sky & Moon are fully unobstructed
    this.buntingMeshes.forEach(b => { b.visible = false; });

    // Apply scene-scoped night fog & background
    this.scene.fog = new THREE.FogExp2('#050B14', 0.025);
    this.scene.background = new THREE.Color('#050B14');

    // Dynamically adjust bloom strictly for ascent sequence (Threshold = 0.85, Strength = 0.50)
    const g = (window as any).game;
    if (g?.renderer?.bloomPass) {
      g.renderer.bloomPass.threshold = 0.85;
      g.renderer.bloomPass.strength = 0.50;
    }

    // Make isolated ascent transition group visible
    this.ascentTransitionGroup.visible = true;

    // Reveal ground avatar of player child with glowing star lantern
    if (this.groundHeroChildMesh && this.groundHeroLanternLight) {
      this.groundHeroChildMesh.visible = true;
      this.groundHeroLanternLight.visible = true;
      this.groundHeroChildMesh.position.set(0.0, 1.15, -0.2);
      this.groundHeroLanternLight.position.set(0.0, 1.35, -0.2);
    }

    // Audio start: distant winds and opening chime
    audioManager.startMemoryAscentAudio();
    audioManager.playMemoryAscentPhrase(1);

    // Initial subtitle for stage 1
    this.overlay.setSubtitle(StoryConfig.festivalSquare.ascentStage1, 5000);

    // Setup fade veil ready for final resolution
    this.createFadeCurtain();
  }

  public init() {
    this.sceneTimer = 0;
    this.revealPhase = 0;
    this.drumTimer = 0;
    this.cheerTimer = 0;
    this.spectacleTimer = 0;
    this.ascentTimer = 0;
    this.ascentStage = 0;
    this.sceneState = SquareSceneState.SPECTATOR_INTRO;

    // Revert bloom and fog strictly back to default scene values
    const g = (window as any).game;
    if (g?.renderer?.bloomPass) {
      g.renderer.bloomPass.threshold = this.defaultBloomThreshold;
      g.renderer.bloomPass.strength = this.defaultBloomStrength;
    }
    this.scene.fog = new THREE.FogExp2(this.defaultFogColor, this.defaultFogDensity);
    this.scene.background = new THREE.Color(this.defaultBgColor);

    // Isolate ascent assets: strictly hidden during earlier phases
    this.ascentTransitionGroup.visible = false;

    // Reset camera space children
    this.fgKidsLeft.visible = true;
    (this.fgKidsLeft.material as THREE.MeshBasicMaterial).opacity = 0.98;
    this.fgKidsRight.visible = true;
    (this.fgKidsRight.material as THREE.MeshBasicMaterial).opacity = 0.98;
    this.lantern.group.visible = true;
    this.lantern.group.scale.set(0.33, 0.33, 0.33);
    this.lion.setInsideView(false);
    this.reverseAudienceGroup.visible = false;
    if (this.groundHeroChildMesh) this.groundHeroChildMesh.visible = false;
    if (this.groundHeroLanternLight) this.groundHeroLanternLight.visible = false;
    if (this.fadeCurtainEl) this.fadeCurtainEl.style.opacity = '0';
    this.buntingMeshes.forEach(b => { b.visible = true; });
    this.overlay.setLetterboxVisible(true, 1000);

    // Camera starts nestled inside the circle of kids, looking up at the lion & moon
    this.camera.position.copy(this.camStartPos);
    this.camera.lookAt(this.camTargetLookAt);
    this.camera.rotation.z = 0;

    // Initial subtitle
    this.overlay.setSubtitle(StoryConfig.festivalSquare.revealGateEntry, 4000);

    // Initial muffled drum cadence
    audioManager.playLionDanceRhythm(0.75, 'distant');
  }

  // ===========================================================================
  // CINEMATIC TRANSITIONS (ITERATION B: MIND-MELD INTO LION POV)
  // ===========================================================================
  public triggerTransitionToLion() {
    this.sceneState = SquareSceneState.TRANSITION_TO_LION;
    this.overlay.hideNextButton();
    this.overlay.setSubtitle(StoryConfig.festivalSquare.transitionToLion, 4500);

    // Dynamic drum crescendo & excitement sound
    audioManager.playLionDanceRhythm(1.35, 'roll');

    this.gestureOverlay.startTransitionIn(
      1800,
      () => {
        // Peak silk occlusion: switch to 180-degree Lion POV looking at +Z!
        this.fgKidsLeft.visible = false;
        this.fgKidsRight.visible = false;
        this.lantern.group.visible = false;
        this.lion.setInsideView(true);
        this.reverseAudienceGroup.visible = true;

        this.camera.position.copy(this.camLionPovPos);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.camLionPovLookAt);
      },
      () => {
        // Complete transition: begin gesture minigame
        this.sceneState = SquareSceneState.LION_POV_MINIGAME;
        this.overlay.clearSubtitle();
        this.gestureOverlay.startMinigame(
          (index) => this.handleGestureSuccess(index),
          () => this.triggerTransitionToSpectator()
        );
      }
    );
  }

  private handleGestureSuccess(index: number) {
    if (index === 0) {
      // Move 1: Swipe Right -> Drum "Cắc - Tùng!", head nod & swivel
      this.lion.performGestureReaction('nodRight');
      this.povReactionOffset.x = -0.32;
      this.povReactionTimer = 0.9;
    } else if (index === 1) {
      // Move 2: Swipe Left -> Cymbal "Xoèng!", head roll & swivel
      this.lion.performGestureReaction('rollLeft');
      this.povReactionOffset.x = 0.32;
      this.povReactionTimer = 0.9;
    } else if (index === 2) {
      // Move 3: Leap Up -> Camera swoops high up toward the moon!
      this.lion.performGestureReaction('rearUp');
      this.povReactionOffset.y = 1.35;
      this.povReactionTimer = 2.4;
    }
  }

  public triggerTransitionToSpectator() {
    // Linger at high altitude gazing up at the moon before descending back to crowd
    setTimeout(() => {
      this.sceneState = SquareSceneState.TRANSITION_TO_SPECTATOR;
      this.gestureOverlay.stopMinigame();
      this.overlay.setSubtitle(StoryConfig.festivalSquare.transitionToSpectator, 4000);

      audioManager.playLionDanceRhythm(1.2, 'groove');

      this.gestureOverlay.startTransitionOut(
        1800,
      () => {
        // Peak silk occlusion: return to Spectator crowd OTS looking at -Z
        this.reverseAudienceGroup.visible = false;
        this.fgKidsLeft.visible = true;
        this.fgKidsRight.visible = true;
        this.lantern.group.visible = true;
        this.lion.setInsideView(false);

        this.camera.position.copy(this.camCirclePos);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.camTargetLookAt);

        this.lion.performEncoreBow();
      },
      () => {
        // Complete transition: final spectacle payoff
        this.sceneState = SquareSceneState.FINAL_SPECTACLE;
        this.spectacleTimer = 0;
        this.overlay.setSubtitle(StoryConfig.festivalSquare.spectatorPayoff, 6000);
        this.overlay.showNextButton(StoryConfig.festivalSquare.actionStartMemoryAscent, () => {
          this.startMemoryAscent();
        });
      }
    );
    }, 1100);
  }

  public update(delta: number, time: number) {
    this.sceneTimer += delta;

    // -------------------------------------------------------------------------
    // 1. STATE-DEPENDENT CAMERA & TIMELINE LOGIC
    // -------------------------------------------------------------------------
    if (this.sceneState === SquareSceneState.SPECTATOR_INTRO) {
      // Phase 0 (0s - 3.4s): Stepping in between friends' shoulders into the front row
      if (this.sceneTimer < 3.4) {
        const t = this.sceneTimer / 3.4;
        this.camera.position.z = THREE.MathUtils.lerp(this.camStartPos.z, this.camCirclePos.z, t);
        this.camera.position.y = THREE.MathUtils.lerp(this.camStartPos.y, this.camCirclePos.y, t);
        this.camera.position.x = Math.sin(t * Math.PI) * 0.05;
        this.camera.lookAt(this.camTargetLookAt);

        this.drumTimer += delta;
        if (this.drumTimer > 1.3) {
          this.drumTimer = 0;
          audioManager.playLionDanceRhythm(0.9, 'distant');
        }
      }
      // Phase 1 (3.4s - 7.5s): Settled in front row, gazing at the moonlit clearing
      else if (this.sceneTimer < 7.5) {
        if (this.revealPhase < 1) {
          this.revealPhase = 1;
          this.overlay.setSubtitle(StoryConfig.festivalSquare.revealCrowdGathering, 4500);
          audioManager.playLionDanceRhythm(1.1, 'roll');
        }

        this.camera.position.copy(this.camCirclePos);
        this.camera.lookAt(this.camTargetLookAt);
      }
      // Phase 2 (7.5s - 12.0s): Lion peeks from behind the left arc of kids
      else if (this.sceneTimer < 12.0) {
        if (this.revealPhase < 2) {
          this.revealPhase = 2;
          this.overlay.setSubtitle(StoryConfig.festivalSquare.revealLionPeeking, 4600);
          this.lion.setPeeking(true);
        }

        const t = (this.sceneTimer - 7.5) / 4.5;
        const lookX = Math.sin(t * Math.PI) * -0.9;
        this.camera.lookAt(lookX, 1.35, -5.2);

        this.drumTimer += delta;
        if (this.drumTimer > 1.1) {
          this.drumTimer = 0;
          audioManager.playLionDanceRhythm(1.2, 'groove');
        }
      }
      // Phase 3 (12.0s+): Grand Leap directly onto the center ground & full dance!
      else {
        if (this.revealPhase < 3) {
          this.revealPhase = 3;
          this.lion.triggerLeap();
          this.overlay.setSubtitle(StoryConfig.festivalSquare.revealLionFullDance, 6000);

          this.overlay.showNextButton(StoryConfig.festivalSquare.actionJoinPerformance, () => {
            this.triggerTransitionToLion();
          });
        }

        // Camera centers back directly onto the dancing lion
        this.camera.position.x += (0 - this.camera.position.x) * Math.min(1, delta * 3.0);
        this.camera.position.y += (this.camCirclePos.y - this.camera.position.y) * Math.min(1, delta * 3.0);
        this.camera.position.z += (this.camCirclePos.z - this.camera.position.z) * Math.min(1, delta * 3.0);
        this.camera.lookAt(0, 1.35, -4.8);

        this.drumTimer += delta;
        if (this.drumTimer > 0.95) {
          this.drumTimer = 0;
          audioManager.playLionDanceRhythm(1.3, 'groove');
        }

        this.cheerTimer += delta;
        if (this.cheerTimer > 4.0) {
          this.cheerTimer = 0;
          audioManager.playCrowdCheerOoh(0.35);
        }
      }
    } else if (this.sceneState === SquareSceneState.TRANSITION_TO_LION) {
      // Smooth glide into lion head position
      this.camera.position.lerp(this.camLionPovPos, Math.min(1, delta * 3.5));
    } else if (this.sceneState === SquareSceneState.LION_POV_MINIGAME) {
      // 180-Degree Lion POV looking toward +Z (at the child holding the glowing star lantern!)
      const breathBob = Math.sin(time * 4.0) * 0.025;
      const breathSway = Math.cos(time * 2.8) * 0.03;
      const targetCamX = this.camLionPovPos.x + this.tactileOffset.x * 0.22 + breathSway;
      const targetCamY = this.camLionPovPos.y - this.tactileOffset.y * 0.14 + breathBob;
      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, delta * 8.0);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, delta * 8.0);
      this.camera.position.z = this.camLionPovPos.z;

      // LookAt target with pitch, yaw, and reaction offsets
      const targetLookX = this.camLionPovLookAt.x - this.tactileOffset.x * 0.65 + this.povReactionOffset.x;
      const targetLookY = this.camLionPovLookAt.y + this.gestureOverlay.cameraPitch * 3.2 - this.tactileOffset.y * 0.4 + this.povReactionOffset.y;
      
      // Set camera roll safely via up vector (prevents 180-deg Euler gimbal flip!)
      const roll = this.gestureOverlay.cameraRoll;
      this.camera.up.set(Math.sin(roll), Math.cos(roll), 0);
      this.camera.lookAt(targetLookX, targetLookY, this.camLionPovLookAt.z);

      if (this.povReactionTimer > 0) {
        this.povReactionTimer -= delta;
        this.povReactionOffset.x *= 0.90;
        this.povReactionOffset.y *= 0.90;
      }

      // Animate child's glowing lantern in front of the lion
      if (this.playerChildMesh) {
        this.playerChildMesh.position.y = 1.25 + Math.sin(time * 3.5) * 0.012;
        this.playerChildLight.intensity = 3.8 + Math.sin(time * 9.0) * 0.45;
      }
    } else if (this.sceneState === SquareSceneState.TRANSITION_TO_SPECTATOR) {
      // Smooth glide backward out of lion head
      this.camera.position.lerp(this.camCirclePos, Math.min(1, delta * 3.5));
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.camTargetLookAt);
    } else if (this.sceneState === SquareSceneState.FINAL_SPECTACLE) {
      // Peaceful payoff: OTS view with lantern, crowd clapping, lion bowing
      const breath = Math.sin(time * 2.5) * 0.005;
      this.camera.position.set(this.camCirclePos.x, this.camCirclePos.y + breath, this.camCirclePos.z);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.camTargetLookAt);

      this.spectacleTimer += delta;
      // Auto-start ascent after 7.5s if player hasn't clicked yet
      if (this.spectacleTimer > 7.5 && this.sceneState === SquareSceneState.FINAL_SPECTACLE) {
        this.startMemoryAscent();
      }

      this.cheerTimer += delta;
      if (this.cheerTimer > 3.2) {
        this.cheerTimer = 0;
        audioManager.playCrowdCheerOoh(0.35);
      }
    } else if (this.sceneState === SquareSceneState.MEMORY_ASCENT) {
      this.ascentTimer += delta;
      const t = this.ascentTimer;

      // -----------------------------------------------------------------------
      // -----------------------------------------------------------------------
      // STAGE 1 (0s -> 7.0s): Camera Ascends (Y: 1.2 -> 12.0, Z: 1.5 -> 10.0, Pitch ~40 deg)
      // Gazing down at child holding glowing star lantern amidst the courtyard
      // -----------------------------------------------------------------------
      if (t < 7.0) {
        const p = t / 7.0;
        const e = p * p * (3 - 2 * p); // Smoothstep

        this.camera.position.x = 0;
        this.camera.position.y = THREE.MathUtils.lerp(1.2, 12.0, e);
        this.camera.position.z = THREE.MathUtils.lerp(1.5, 10.0, e);

        // Pitch down ~40 to 45 deg targeting the child & courtyard center
        const lookTarget = new THREE.Vector3(0, 0.8, -0.6);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(lookTarget);

        // Smoothly increase night fog density as camera lifts up
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.density = THREE.MathUtils.lerp(0.018, 0.026, e);
        }

        // Sound attenuation & rising night wind
        audioManager.updateAscentWind(p);

        // Subtitle milestone
        if (t >= 3.2 && this.ascentStage < 1) {
          this.ascentStage = 1;
          this.overlay.setSubtitle(StoryConfig.festivalSquare.ascentStage1Lantern, 5000);
        }
      }
      // -----------------------------------------------------------------------
      // STAGE 2 (7.0s -> 12.0s): Village scale oasis amidst the dark night fog
      // -----------------------------------------------------------------------
      else if (t < 12.0) {
        // Gentle breathing float at high altitude
        this.camera.position.x = Math.sin(t * 0.4) * 0.15;
        this.camera.position.y = 12.0 + Math.sin(t * 0.8) * 0.08;
        this.camera.position.z = 10.0;

        const lookTarget = new THREE.Vector3(0, 0.8, -0.6);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(lookTarget);

        if (this.ascentStage < 2) {
          this.ascentStage = 2;
          this.overlay.setSubtitle(StoryConfig.festivalSquare.ascentStage2Village, 5000);
          audioManager.playMemoryAscentPhrase(2);
        }
      }
      // -----------------------------------------------------------------------
      // STAGE 3 & 4 (12.0s -> 22.5s): Tilt-Up to pristine Full Moon & Soft White Veil
      // -----------------------------------------------------------------------
      else {
        const p = Math.min(1.0, (t - 12.0) / 3.5);
        const e = p * p * (3 - 2 * p);

        // Camera holds high vantage point
        this.camera.position.set(0, 12.0, 10.0);

        // LookTarget tilts up from courtyard clearing directly to pristine Moon in sky
        const courtyardLook = new THREE.Vector3(0, 0.8, -0.6);
        const moonLook = new THREE.Vector3(0, 22.0, -22.0);
        const currentLook = new THREE.Vector3().lerpVectors(courtyardLook, moonLook, e);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(currentLook);

        if (t >= 13.0 && this.ascentStage < 3) {
          this.ascentStage = 3;
          this.overlay.setSubtitle(StoryConfig.festivalSquare.ascentStage4Moon, 5500);
          audioManager.playMemoryAscentPhrase(4);
        }

        // Trigger soft silver-white moonlight veil & dissolve top/bottom black letterbox vignette
        if (t >= 17.5 && this.ascentStage < 4) {
          this.ascentStage = 4;
          if (this.fadeCurtainEl) {
            this.fadeCurtainEl.style.opacity = '1';
          }
          this.overlay.setLetterboxVisible(false, 3000);
          // Compile the next scene beneath the existing white transition.
          this.onAscentStart?.();
        }

        if (t >= 22.5 && this.sceneState === SquareSceneState.MEMORY_ASCENT) {
          this.sceneState = SquareSceneState.PAST_ENDING_COMPLETE;
          this.onComplete();
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. CONTINUOUS ACTOR & OBJECT UPDATES
    // -------------------------------------------------------------------------
    // 1. Update Lion Character & particles
    this.lion.update(delta, time);

    // 2. Foreground Over-the-Shoulder Kids bobbing with excitement!
    if (this.fgKidsLeft.visible) {
      const kidBobL = Math.sin(time * 4.2) * 0.008;
      const kidSwayL = Math.sin(time * 2.8) * 0.012;
      this.fgKidsLeft.position.y = -0.18 + kidBobL;
      this.fgKidsLeft.rotation.z = kidSwayL;

      const kidBobR = Math.sin(time * 3.6 + 1.0) * 0.006;
      this.fgKidsRight.position.y = -0.22 + kidBobR;
    }

    // 3. Player's Star Lantern held in lower-right foreground (nestled in hand)
    if (this.lantern.group.visible) {
      const lanternBob = Math.sin(time * 3.0) * 0.008;
      const lanternSway = Math.sin(time * 1.8) * 0.02;
      this.lantern.group.position.set(0.55, -0.49 + lanternBob, -0.80);
      this.lantern.group.rotation.z = lanternSway;
      this.lantern.update(delta, 0.1);
    }

    // 4. Full Moon Tracking: Dominates the upper sky above the village
    if (this.sceneState === SquareSceneState.MEMORY_ASCENT || this.sceneState === SquareSceneState.PAST_ENDING_COMPLETE) {
      this.moon.group.position.set(0, 22.0, -22.0);
      this.moon.group.scale.setScalar(1.65);
    } else {
      this.moon.group.position.set(
        this.camera.position.x + 4.8,
        7.2,
        this.camera.position.z - 14.0
      );
      this.moon.group.scale.setScalar(1.0);
    }
    this.moon.update(this.camera);

    // 5. Ground hero lantern light flicker
    if (this.groundHeroLanternLight && this.groundHeroLanternLight.visible) {
      this.groundHeroLanternLight.intensity = 2.6 + Math.sin(time * 7.5) * 0.4;
    }

    // 6. Encircling children's lanterns bobbing
    this.childLanterns.forEach((cl, idx) => {
      cl.position.y += Math.sin(time * 3.5 + idx * 0.8) * 0.0025;
    });

    // 7. Arena torch flicker
    this.arenaLights.forEach((light, idx) => {
      light.intensity = 2.8 + Math.sin(time * 8.0 + idx * 2.0) * 0.3;
    });
  }

  public destroy() {
    this.gestureOverlay.destroy();
    this.overlay.clearSubtitle();
    this.overlay.hideNextButton();
    this.lion.destroy();

    // Revert bloom strictly back to default
    const g = (window as any).game;
    if (g?.renderer?.bloomPass) {
      g.renderer.bloomPass.threshold = this.defaultBloomThreshold;
      g.renderer.bloomPass.strength = this.defaultBloomStrength;
    }

    // Revert fog and background strictly back to default scene values
    this.scene.fog = new THREE.FogExp2(this.defaultFogColor, this.defaultFogDensity);
    this.scene.background = new THREE.Color(this.defaultBgColor);

    // Isolated Phase 3C asset cleanup: leaves zero leftover meshes or textures in scene
    if (this.ascentTransitionGroup) {
      this.scene.remove(this.ascentTransitionGroup);
      this.ascentTransitionGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

    this.overlay.setLetterboxVisible(true, 1000);
    if (this.fadeCurtainEl && this.fadeCurtainEl.parentNode) {
      this.fadeCurtainEl.parentNode.removeChild(this.fadeCurtainEl);
      this.fadeCurtainEl = null;
    }
  }
}
