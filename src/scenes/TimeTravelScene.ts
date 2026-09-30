import * as THREE from 'three';
import { IScene } from './BaseScene';
import { Moon } from '../props/Moon';
import { StoryOverlay } from '../ui/StoryOverlay';
import { StoryConfig } from '../config/StoryConfig';
import { audioManager } from '../audio/AudioManager';
import { MemoryPrelude } from '../ui/MemoryPrelude';
import { DedicationPage } from '../ui/DedicationPage';

export class TimeTravelScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private moon: Moon;
  private stars: THREE.Points;
  private overlay: StoryOverlay;
  private onComplete: () => void;

  private stateTime: number = 0;
  private isTransitioning: boolean = false;
  private starCount: number = 420;
  private angles: Float32Array;
  private radii: Float32Array;
  private radialSpeeds: Float32Array;
  private rotSpeeds: Float32Array;
  private timerIds: number[] = [];
  private prelude: MemoryPrelude | null = null;
  private dedication: DedicationPage | null = null;

  constructor(camera: THREE.PerspectiveCamera, overlay: StoryOverlay,
    onComplete: () => void, private readonly onSequenceStarted?: () => void) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060d);
    this.camera = camera;
    this.overlay = overlay;
    this.onComplete = onComplete;

    // Ambient light
    const amb = new THREE.AmbientLight(0x0e1424, 0.4);
    this.scene.add(amb);

    // Full Moon centered below title
    this.moon = new Moon();
    this.moon.group.position.set(0, -0.6, -14);
    // The opening moon is a painted paper disc, not an overexposed sphere.
    this.moon.moonMesh.visible = false;
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = moonCanvas.height = 512;
    const moonCtx = moonCanvas.getContext('2d')!;
    const disc = moonCtx.createRadialGradient(225, 210, 22, 256, 256, 231);
    disc.addColorStop(0, '#f4ebd8'); disc.addColorStop(0.75, '#d8dce0');
    disc.addColorStop(0.94, '#9eb4c7'); disc.addColorStop(1, 'rgba(112,143,170,0)');
    moonCtx.fillStyle = disc; moonCtx.beginPath(); moonCtx.arc(256, 256, 231, 0, Math.PI * 2); moonCtx.fill();
    for (const [x, y, radius, alpha] of [[172, 172, 24, .13], [307, 290, 32, .1],
      [214, 333, 18, .1], [359, 184, 13, .09]] as const) {
      moonCtx.fillStyle = `rgba(98,123,142,${alpha})`;
      moonCtx.beginPath(); moonCtx.arc(x, y, radius, 0, Math.PI * 2); moonCtx.fill();
    }
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.colorSpace = THREE.SRGBColorSpace;
    this.moon.group.add(new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8),
      new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false })));
    const halo = this.moon.group.children.find(child =>
      child instanceof THREE.Mesh && child !== this.moon.moonMesh);
    if (halo instanceof THREE.Mesh) {
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.38;
    }
    this.scene.add(this.moon.group);

    // Particle Trail / Inward Spiral Vortex (Temporal Rewind Effect)
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    this.angles = new Float32Array(this.starCount);
    this.radii = new Float32Array(this.starCount);
    this.radialSpeeds = new Float32Array(this.starCount);
    this.rotSpeeds = new Float32Array(this.starCount);

    for (let i = 0; i < this.starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 18.0;
      const z = -15 - Math.random() * 20;

      this.angles[i] = angle;
      this.radii[i] = radius;
      this.radialSpeeds[i] = 1.2 + Math.random() * 2.5;
      this.rotSpeeds[i] = (Math.random() * 0.8 + 0.3) * (Math.random() > 0.5 ? 1 : -1);

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius - 0.5;
      positions[i * 3 + 2] = z;

      // Sepia gold & silver star colors
      if (Math.random() > 0.4) {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.82;
        colors[i * 3 + 2] = 0.55; // Warm amber sepia
      } else {
        colors[i * 3] = 0.82;
        colors[i * 3 + 1] = 0.90;
        colors[i * 3 + 2] = 1.0; // Moonlight silver
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = dotCanvas.height = 64;
    const dotCtx = dotCanvas.getContext('2d')!;
    const glow = dotCtx.createRadialGradient(32, 32, 1, 32, 32, 31);
    glow.addColorStop(0, 'rgba(255,250,234,.9)');
    glow.addColorStop(.4, 'rgba(255,234,194,.38)');
    glow.addColorStop(1, 'rgba(255,234,194,0)');
    dotCtx.fillStyle = glow; dotCtx.fillRect(0, 0, 64, 64);
    const dotTexture = new THREE.CanvasTexture(dotCanvas);
    const starMat = new THREE.PointsMaterial({
      size: 0.09,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
      opacity: 0.68,
      blending: THREE.AdditiveBlending
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // Initial Camera
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, -0.6, -14);
  }

  public init() {
    this.stateTime = 0;
    this.isTransitioning = false;

    // The first leaf belongs to the recipient; the title follows its turn.
    this.overlay.enableTimeTravelEffects();
    this.dedication = new DedicationPage();
    this.dedication.show(() => this.showOpeningTitle());
  }

  private showOpeningTitle(): void {
    this.dedication = null;
    audioManager.startMoonOpeningSoundscape();
    this.overlay.showStartScreen(
      "KÝ ỨC ĐÈN ÔNG SAO",
      StoryConfig.cinematicPeriodTitle,
      "Tua ngược thời gian ⏳",
      () => {
        audioManager.init();
        this.overlay.hideStartScreen();
        this.startSequence();
      }
    );
  }

  private startSequence() {
    this.onSequenceStarted?.();
    this.overlay.beginTimeRewind();
    // Play accelerating then slowing clock tick-tock
    audioManager.playClockRewind();
    audioManager.setScoreMood('memory');

    this.overlay.setSubtitle(StoryConfig.openingSubtitles[0], 3500);

    const t1 = window.setTimeout(() => {
      this.overlay.setSubtitle(StoryConfig.openingSubtitles[1], 4000);
    }, 2800);

    const t2 = window.setTimeout(() => {
      this.overlay.setSubtitle(StoryConfig.openingSubtitles[2], 4200);
      this.isTransitioning = true;
    }, 5600);

    const t3 = window.setTimeout(() => {
      this.overlay.disableTimeTravelEffects();
      this.overlay.clearSubtitle();
      this.prelude = new MemoryPrelude();
      this.prelude.show(() => this.onComplete());
    }, 9000);

    this.timerIds.push(t1, t2, t3);
  }

  public update(delta: number, _time: number) {
    this.stateTime += delta;
    this.moon.update(this.camera);

    // Dynamic spiral particle trails pulling inward into screen center
    const pos = this.stars.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.starCount; i++) {
      this.angles[i] += this.rotSpeeds[i] * delta * 1.5;
      this.radii[i] -= this.radialSpeeds[i] * delta * (this.isTransitioning ? 3.5 : 1.2);

      // Loop particles back to outer rim when pulled into vortex center
      if (this.radii[i] < 0.4) {
        this.radii[i] = 16.0 + Math.random() * 4.0;
        this.angles[i] = Math.random() * Math.PI * 2;
      }

      pos[i * 3] = Math.cos(this.angles[i]) * this.radii[i];
      pos[i * 3 + 1] = Math.sin(this.angles[i]) * this.radii[i] - 0.5;

      // Z moves backwards towards camera
      pos[i * 3 + 2] += delta * (this.isTransitioning ? 12.0 : 4.0);
      // Keep idle stars behind the painted moon; foreground streaks are only
      // released after the player starts the rewind.
      if (pos[i * 3 + 2] > (this.isTransitioning ? 2 : -15)) {
        pos[i * 3 + 2] = -35;
      }
    }
    this.stars.geometry.attributes.position.needsUpdate = true;

    // Camera slow zoom / dive during time travel
    if (this.isTransitioning) {
      this.camera.position.z -= delta * 2.2;
    }
  }

  public destroy() {
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    this.overlay.disableTimeTravelEffects();
    this.overlay.clearSubtitle();
    this.prelude?.destroy();
    this.prelude = null;
    this.dedication?.destroy();
    this.dedication = null;
  }
}
