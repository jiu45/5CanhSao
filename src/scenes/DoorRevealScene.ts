import * as THREE from 'three';
import { IScene } from './BaseScene';
import { RoomDiorama } from '../props/RoomDiorama';
import { StarLantern } from '../props/StarLantern';
import { readRecipientLanternStyle, THRESHOLD_HOLD } from '../props/LanternIdentity';
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

export class DoorRevealScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private room: RoomDiorama;
  private lantern: StarLantern;
  private moon: Moon;
  private overlay: StoryOverlay;
  private onComplete: () => void;

  private doorProgress: number = 0;
  private isDoorOpening: boolean = false;
  private isWalkingThroughThreshold: boolean = false;
  private walkTime: number = 0;
  private holdHeight = 1.22;
  private outsideWarmLight: THREE.PointLight;
  private templeCourtyardLight: THREE.PointLight;
  private outsideCourtyard: THREE.Group;
  private drumTimer: number = 0;
  private chantPlayed: boolean = false;

  // Atmospheric silhouettes & swaying elements
  private bambooGroves: THREE.Mesh[] = [];
  private distantLanterns: DistantLantern[] = [];
  private fireflies: Firefly[] = [];
  private mistPlanes: THREE.Mesh[] = [];
  private timerIds: number[] = [];

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    onComplete: () => void,
    private readonly onReadyToLeave?: () => void
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04091a);
    // Poetic night fog
    this.scene.fog = new THREE.FogExp2(0x0a1128, 0.025);
    this.camera = camera;
    this.overlay = overlay;
    this.onComplete = onComplete;

    // Room
    this.room = new RoomDiorama();
    // The crafting backdrop sits in front of the real doorway. Reveal the
    // physical doors and the held lantern for this threshold shot.
    this.room.illustratedBackdrop.visible = false;
    this.scene.add(this.room.group);

    // Star lantern held by player facing the door
    const lanternStyle = readRecipientLanternStyle();
    this.lantern = new StarLantern(lanternStyle);
    this.lantern.setStep(4);
    const hold = THRESHOLD_HOLD[lanternStyle];
    this.holdHeight = hold.height;
    this.lantern.group.scale.setScalar(hold.scale);
    this.lantern.group.position.set(lanternStyle === 'star' ? .48 : .34,
      this.holdHeight, -1.9);
    this.lantern.group.rotation.set(0, -Math.PI * 0.25, 0);
    this.scene.add(this.lantern.group);

    // Moon in the sky outside
    this.moon = new Moon();
    this.moon.group.position.set(0, 8.5, -22);
    this.moon.directionalLight.position.set(0, 12, -16);
    this.moon.directionalLight.target.position.set(0, 1.5, -4.5);
    this.scene.add(this.moon.directionalLight.target);
    this.scene.add(this.moon.group);

    // Soft moonlight ambience
    const ambient = new THREE.AmbientLight(0x1a2642, 0.75);
    this.scene.add(ambient);

    // Build outside village courtyard seen through doorway
    this.outsideCourtyard = new THREE.Group();
    this.buildOutsideCourtyard();
    this.scene.add(this.outsideCourtyard);

    // Warm festive festival light outside pouring through doorway
    this.outsideWarmLight = new THREE.PointLight(0xffa83b, 0, 18, 1.4);
    this.outsideWarmLight.position.set(0, 2.2, -7.5);
    this.scene.add(this.outsideWarmLight);

    // Distant communal temple courtyard gathering light burst
    this.templeCourtyardLight = new THREE.PointLight(0xff8822, 0, 26, 1.6);
    this.templeCourtyardLight.position.set(0, 2.6, -16.5);
    this.scene.add(this.templeCourtyardLight);

    // Camera initial framing: Behind player shoulder looking at wooden door
    this.camera.position.set(0.0, 1.85, -0.6);
    this.camera.lookAt(0, 2.0, -5.0);
  }

  private buildOutsideCourtyard() {
    // 1. Village courtyard ground with dirt path and moonlit grass
    const groundTex = TextureGenerator.createVillageGroundTexture();
    const groundGeo = new THREE.PlaneGeometry(42, 42);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      color: 0x243236
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -12);
    ground.receiveShadow = true;
    this.outsideCourtyard.add(ground);

    // Rustic wooden threshold step at the door (bậc thềm cửa gỗ)
    const woodTex = TextureGenerator.createWoodTexture('#3e2515', '#221308');
    const thresholdMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.75 });
    const threshold = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.12, 0.45),
      thresholdMat
    );
    threshold.position.set(0, 0.06, -4.9);
    threshold.receiveShadow = true;
    threshold.castShadow = true;
    this.outsideCourtyard.add(threshold);

    // 2. Wide Luminous Moon Glow Halo
    const haloTex = TextureGenerator.createMoonHaloTexture();
    const haloGeo = new THREE.PlaneGeometry(11, 11);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 8.5, -22.5);
    this.outsideCourtyard.add(halo);

    // 3. Layered 2D Silhouettes: Wide Traditional Vietnamese Village Panoramic Silhouette (Mái đình cong, rặng đa, đống rơm)
    const roofTex = TextureGenerator.createVillageRoofSilhouette();
    const roofGeo = new THREE.PlaneGeometry(28, 14);
    const roofMat = new THREE.MeshBasicMaterial({
      map: roofTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      fog: false
    });
    const villagePanorama = new THREE.Mesh(roofGeo, roofMat);
    villagePanorama.position.set(0, 3.8, -17);
    this.outsideCourtyard.add(villagePanorama);

    // 4. Layered 2D Silhouettes: Framing Organic Bamboo Groves (Bụi tre uốn cong hai bên hiên nhà)
    const bambooTex = TextureGenerator.createBambooGroveSilhouette();
    const bambooGeo = new THREE.PlaneGeometry(4.2, 6.8);
    const bambooMat = new THREE.MeshBasicMaterial({
      map: bambooTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      fog: false
    });

    this.bambooGroves = [];
    const groveConfigs = [
      { x: -3.8, z: -9.5, scaleX: 1.0, y: 3.1 },
      { x: -5.4, z: -11.5, scaleX: 1.2, y: 3.4 },
      { x: 3.8, z: -9.5, scaleX: -1.0, y: 3.1 },
      { x: 5.4, z: -11.5, scaleX: -1.2, y: 3.4 }
    ];

    groveConfigs.forEach((cfg) => {
      const grove = new THREE.Mesh(bambooGeo, bambooMat);
      grove.position.set(cfg.x, cfg.y, cfg.z);
      grove.scale.set(cfg.scaleX, 1, 1);
      this.outsideCourtyard.add(grove);
      this.bambooGroves.push(grove);
    });

    // 5. Low Ground Night Mist Layer (Làn sương đêm thu bảng lảng dưới chân tre)
    const mistTex = TextureGenerator.createNightMistTexture();
    const mistGeo = new THREE.PlaneGeometry(24, 2.4);
    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mistPlanes = [];
    [-8.5, -12.0].forEach((mz, idx) => {
      const mistMesh = new THREE.Mesh(mistGeo, mistMat.clone());
      mistMesh.position.set(0, 0.45 + idx * 0.25, mz);
      this.outsideCourtyard.add(mistMesh);
      this.mistPlanes.push(mistMesh);
    });

    // 6. Autumn Fireflies (Đom đóm mùa thu lơ lửng quanh sân đình)
    const fireflyTex = TextureGenerator.createFireflyTexture();
    const fireflyGeo = new THREE.PlaneGeometry(0.16, 0.16);
    this.fireflies = [];

    for (let i = 0; i < 28; i++) {
      const ffMat = new THREE.MeshBasicMaterial({
        map: fireflyTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ffMesh = new THREE.Mesh(fireflyGeo, ffMat);

      const bx = (Math.random() - 0.5) * 8.5;
      const by = 0.7 + Math.random() * 2.2;
      const bz = -5.5 - Math.random() * 9.0;

      ffMesh.position.set(bx, by, bz);
      this.outsideCourtyard.add(ffMesh);

      this.fireflies.push({
        mesh: ffMesh,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8
      });
    }

    // 7. Gathering of Distant Lanterns at the Communal Temple (Đốm sáng rước đèn tụ hội ở sân đình)
    this.distantLanterns = [];
    // Moving children along paths
    for (let i = 0; i < 10; i++) {
      const lanternGroup = new THREE.Group();
      const starGeo = new THREE.PlaneGeometry(0.26, 0.26);
      const starMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff4218 : 0xf59e0b,
        transparent: true,
        opacity: 0.95
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.rotation.z = Math.PI / 4;
      lanternGroup.add(star);

      const pLight = new THREE.PointLight(0xffaa33, 1.2, 5.0, 2);
      lanternGroup.add(pLight);

      const side = (i % 2 === 0 ? -1 : 1);
      const lx = side * (0.6 + (i * 0.45));
      const ly = 1.1 + (i % 3) * 0.15;
      const lz = -7.5 - i * 1.0;

      lanternGroup.position.set(lx, ly, lz);
      this.outsideCourtyard.add(lanternGroup);
      this.distantLanterns.push({
        group: lanternGroup,
        baseX: lx,
        baseY: ly,
        phase: i * 0.85
      });
    }

    // Lantern cluster gathered at the temple square (Sân đình lung linh ánh đèn)
    for (let j = 0; j < 18; j++) {
      const clusterGroup = new THREE.Group();
      const sGeo = new THREE.PlaneGeometry(0.28, 0.28);
      const colors = [0xff3a10, 0xf59e0b, 0xffcc33, 0xff4422];
      const sMat = new THREE.MeshBasicMaterial({
        color: colors[j % colors.length],
        transparent: true,
        opacity: 0.92
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.rotation.z = Math.PI / 4;
      clusterGroup.add(sMesh);

      const cx = (Math.random() - 0.5) * 5.2;
      const cy = 0.95 + Math.random() * 1.4;
      const cz = -15.2 - Math.random() * 2.2;

      clusterGroup.position.set(cx, cy, cz);
      this.outsideCourtyard.add(clusterGroup);
      this.distantLanterns.push({
        group: clusterGroup,
        baseX: cx,
        baseY: cy,
        phase: j * 0.45
      });
    }
  }

  public init() {
    this.doorProgress = 0;
    this.isDoorOpening = false;
    this.isWalkingThroughThreshold = false;
    this.walkTime = 0;
    this.chantPlayed = false;

    this.overlay.setSubtitle(StoryConfig.doorRevealSubtitles[0], 3500);

    const t1 = window.setTimeout(() => {
      this.isDoorOpening = true;
      audioManager.playDoorCreak();
    }, 800);

    const t2 = window.setTimeout(() => {
      this.overlay.setSubtitle(StoryConfig.doorRevealSubtitles[1], 5000);
    }, 2800);

    const t3 = window.setTimeout(() => {
      this.onReadyToLeave?.();
      this.overlay.showNextButton("Ra ngõ", () => {
        this.startThresholdWalk();
      });
    }, 3200);

    this.timerIds.push(t1, t2, t3);
  }

  // Smooth cinematic camera dolly through doorway past wooden threshold
  private startThresholdWalk() {
    audioManager.setScoreMood('village');
    this.overlay.hideNextButton();
    this.overlay.clearSubtitle();
    this.isWalkingThroughThreshold = true;
    audioManager.playLanternParadeCall(0.08);
    audioManager.playFrogDrum(2.2);
  }

  public update(delta: number, _time: number) {
    this.lantern.update(delta);
    this.moon.update(this.camera);

    // 1. Animate door opening
    if (this.isDoorOpening && this.doorProgress < 1) {
      this.doorProgress = Math.min(1, this.doorProgress + delta * 0.55);
      this.room.setDoorsOpenProgress(this.doorProgress);

      // Warm festival light swells as doors open
      this.outsideWarmLight.intensity = this.doorProgress * 4.5;
      this.templeCourtyardLight.intensity = this.doorProgress * 3.8;

      // Camera gently pushes forward through the door opening
      this.camera.position.z -= delta * 0.35;
      this.lantern.group.position.z -= delta * 0.35;

      // Trigger festive children chant when doors swing wide
      if (this.doorProgress > 0.5 && !this.chantPlayed) {
        this.chantPlayed = true;
        audioManager.playLanternParadeCall(0.06);
      }
    }

    // 2. Cinematic Threshold Dolly Choreography (Walking through the door)
    if (this.isWalkingThroughThreshold) {
      this.walkTime += delta * 2.2;
      const walkSpeed = delta * 1.75;

      this.camera.position.z -= walkSpeed;
      // Gentle walking bob
      this.camera.position.y = 1.85 + Math.sin(this.walkTime * 4.0) * 0.025;

      this.lantern.group.position.z -= walkSpeed;
      this.lantern.group.position.y = this.holdHeight + Math.sin(this.walkTime * 4.0) * 0.04;
      this.lantern.group.rotation.z = Math.sin(this.walkTime * 2.0) * 0.08;

      // When camera successfully glides past threshold step (z <= -5.8), complete scene
      if (this.camera.position.z <= -5.8) {
        this.isWalkingThroughThreshold = false;
        this.onComplete();
        return;
      }
    } else {
      // Idle lantern sway in hand
      this.lantern.group.rotation.z = Math.sin(_time * 2.2) * 0.04;
      this.lantern.group.position.y = this.holdHeight + Math.sin(_time * 3.0) * 0.015;
    }

    // 3. Sway bamboo groves softly in the breeze
    this.bambooGroves.forEach((grove, idx) => {
      grove.rotation.z = Math.sin(_time * 1.6 + idx * 1.2) * 0.035;
    });

    // 4. Bob distant lanterns (mimic walking children and festival crowd)
    this.distantLanterns.forEach(item => {
      item.group.position.y = item.baseY + Math.sin(_time * 3.2 + item.phase) * 0.045;
      item.group.position.x = item.baseX + Math.sin(_time * 1.8 + item.phase) * 0.025;
    });

    // 5. Autumn Fireflies float & rhythmically pulse glow
    this.fireflies.forEach(ff => {
      ff.mesh.position.x = ff.baseX + Math.sin(_time * ff.speed + ff.phase) * 0.35;
      ff.mesh.position.y = ff.baseY + Math.sin(_time * 1.6 + ff.phase * 2) * 0.22;
      ff.mesh.position.z = ff.baseZ + Math.cos(_time * 1.1 + ff.phase) * 0.3;

      const pulse = Math.pow(Math.sin(_time * 2.8 + ff.phase), 4);
      (ff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.75;
    });

    // 6. Slowly drift low ground night mist
    this.mistPlanes.forEach((mist, idx) => {
      if (mist.material && (mist.material as THREE.MeshBasicMaterial).map) {
        (mist.material as THREE.MeshBasicMaterial).map!.offset.x = (_time * 0.018 * (idx % 2 === 0 ? 1 : -0.8)) % 1;
      }
    });

    // 7. Periodic distant village frog drum pulse
    this.drumTimer += delta;
    if (this.drumTimer > 2.8) {
      this.drumTimer = 0;
      audioManager.playFrogDrum(1.0 + this.doorProgress * 1.2);
    }
  }

  public destroy() {
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    this.overlay.clearSubtitle();
  }
}
