import * as THREE from 'three';
import { IScene } from './BaseScene';
import { RoomDiorama } from '../props/RoomDiorama';
import { StarLantern } from '../props/StarLantern';
import { Moon } from '../props/Moon';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CraftingUI } from '../ui/CraftingUI';
import { StoryConfig } from '../config/StoryConfig';
import { audioManager } from '../audio/AudioManager';
import { LanternFrameChoice } from '../ui/LanternFrameChoice';
import { LANTERN_NAMES, saveRecipientLanternStyle, type LanternStyle } from '../props/LanternIdentity';

export class LanternCraftingScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private room: RoomDiorama;
  public lantern: StarLantern;
  private moon: Moon;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  private onComplete: () => void;

  private currentStep: number = 0;
  private isIgnited: boolean = false;
  private selectedStyle: LanternStyle | null = null;
  private frameChoice: LanternFrameChoice | null = null;
  private targetCamPos: THREE.Vector3;
  private targetCamLookAt: THREE.Vector3;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private readonly onPropPointerDown = (event: PointerEvent) => {
    if (this.currentStep >= 4 || !(event.target instanceof HTMLCanvasElement)) return;
    this.pointer.set(event.clientX / window.innerWidth * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const target = this.room.craftTargets[this.currentStep];
    if (target && this.raycaster.intersectObject(target, false).length) {
      this.craftingUI.advanceStep();
    }
  };

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    craftingUI: CraftingUI,
    onComplete: () => void,
    private readonly onReadyToLeave?: () => void
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020409);
    this.scene.fog = new THREE.FogExp2(0x0a1128, 0.03);
    this.camera = camera;
    this.overlay = overlay;
    this.craftingUI = craftingUI;
    this.onComplete = onComplete;

    // Room environment
    this.room = new RoomDiorama();
    this.scene.add(this.room.group);

    // Star lantern sitting on the wooden workbench
    this.lantern = new StarLantern();
    this.lantern.group.scale.setScalar(0.62);
    this.lantern.group.position.set(0, 1.38, 0.1);
    this.lantern.group.rotation.x = -Math.PI * 0.04;
    this.scene.add(this.lantern.group);

    // Moon positioned outside the slatted window (-X direction)
    this.moon = new Moon();
    this.moon.group.position.set(-10, 4.5, 0);
    this.moon.directionalLight.position.set(-8, 5.0, 0);
    this.moon.directionalLight.target.position.set(0, 0.85, 0.1);
    this.scene.add(this.moon.directionalLight.target);
    this.scene.add(this.moon.group);

    // Soft midnight indigo ambient (#0a1128)
    const ambient = new THREE.AmbientLight(0x1a2640, 0.78);
    this.scene.add(ambient);
    const workLight = new THREE.SpotLight(0xffcd91, 1.45, 8, Math.PI / 3, 0.65, 1.1);
    workLight.position.set(1.1, 3.2, 2.2);
    workLight.target.position.set(0, 0.86, 0.1);
    this.scene.add(workLight, workLight.target);

    // Window light beam spot pointing onto the workbench
    const moonbeamSpot = new THREE.SpotLight(0xaad0ff, 3.8, 16, Math.PI / 5, 0.4, 1.2);
    moonbeamSpot.position.set(-4.8, 3.6, 0);
    moonbeamSpot.target.position.set(0, 0.85, 0.1);
    moonbeamSpot.castShadow = true;
    moonbeamSpot.shadow.mapSize.width = 1024;
    moonbeamSpot.shadow.mapSize.height = 1024;
    this.scene.add(moonbeamSpot.target);
    this.scene.add(moonbeamSpot);

    // Camera initial framing: intimate view of the rustic workbench
    const portrait = window.innerWidth / window.innerHeight < 0.8;
    this.camera.position.set(0.0, portrait ? 2.72 : 2.15, portrait ? 5.8 : 2.65);
    this.camera.lookAt(0, 1.07, 0.1);
    this.targetCamPos = this.camera.position.clone();
    this.targetCamLookAt = new THREE.Vector3(0, 1.07, 0.1);
  }

  public init() {
    audioManager.setScoreMood('craft');
    this.currentStep = 0;
    this.isIgnited = false;
    this.lantern.setStep(0);
    this.selectedStyle = null;
    this.room.setCraftStep(0);
    window.addEventListener('pointerdown', this.onPropPointerDown);

    this.overlay.setSubtitle(StoryConfig.craftingSubtitles.step0, 4500);

    setTimeout(() => {
      this.craftingUI.show();
    }, 1500);

    this.craftingUI.onStepCompleted = (step: number) => {
      this.handleStep(step);
    };
    this.craftingUI.onBeforeAdvance = nextStep => {
      if (nextStep !== 1 || this.selectedStyle) return true;
      if (!this.frameChoice) this.frameChoice = new LanternFrameChoice(style => this.chooseFrame(style));
      return false;
    };
  }

  private chooseFrame(style: LanternStyle): void {
    this.selectedStyle = style;
    saveRecipientLanternStyle(style);
    this.scene.remove(this.lantern.group);
    this.lantern.dispose();
    this.lantern = new StarLantern(style);
    this.lantern.group.scale.setScalar(0.62);
    this.lantern.group.position.set(0, 1.38, 0.1);
    this.lantern.group.rotation.x = -Math.PI * .04;
    this.scene.add(this.lantern.group);
    this.craftingUI.setFrameDescription(`Đang làm ${LANTERN_NAMES[style].toLowerCase()}`);
    this.frameChoice = null;
    this.craftingUI.advanceStep();
  }

  private handleStep(step: number) {
    this.currentStep = step;
    this.lantern.setStep(step);
    this.room.setCraftStep(step);

    switch (step) {
      case 1:
        audioManager.playBambooSnap();
        this.overlay.setSubtitle(this.selectedStyle === 'star'
          ? StoryConfig.craftingSubtitles.step1
          : `Nan tre đã thành hình ${LANTERN_NAMES[this.selectedStyle!].replace('Đèn ', '').toLowerCase()}.`, 4000);
        break;
      case 2:
        audioManager.playPaperRustle();
        this.overlay.setSubtitle(StoryConfig.craftingSubtitles.step2, 4000);
        break;
      case 3:
        audioManager.playStringTie();
        this.overlay.setSubtitle(StoryConfig.craftingSubtitles.step3, 4000);
        break;
      case 4:
        this.onIgnited();
        break;
    }
  }

  private timerIds: number[] = [];

  private onIgnited() {
    this.isIgnited = true;
    this.craftingUI.hide();
    this.onReadyToLeave?.();
    audioManager.playCandleIgnite();
    this.overlay.setSubtitle(StoryConfig.craftingSubtitles.completed, 5000);

    // Camera smooth glide towards the glowing hero star lantern on the workbench
    const portrait = window.innerWidth / window.innerHeight < 0.8;
    this.targetCamPos.set(0.0, portrait ? 2.45 : 1.94, portrait ? 5.0 : 2.35);
    this.targetCamLookAt.set(0, 1.38, 0.1);

    const t = window.setTimeout(() => {
      this.overlay.showNextButton("Mang đèn ra hiên", () => {
        this.overlay.hideNextButton();
        this.onComplete();
      });
    }, 5400);
    this.timerIds.push(t);
  }

  public update(delta: number, _time: number) {
    this.lantern.update(delta);
    this.room.update(delta);
    this.moon.update(this.camera);

    // Smooth camera lerp
    this.camera.position.lerp(this.targetCamPos, delta * 2.0);
    const currentLook = new THREE.Vector3();
    this.camera.getWorldDirection(currentLook);
    const targetDir = new THREE.Vector3().subVectors(this.targetCamLookAt, this.camera.position).normalize();
    currentLook.lerp(targetDir, delta * 2.0);
    this.camera.lookAt(this.camera.position.clone().add(currentLook));
  }

  public destroy() {
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    this.craftingUI.hide();
    this.craftingUI.onBeforeAdvance = undefined;
    this.frameChoice?.destroy();
    this.frameChoice = null;
    window.removeEventListener('pointerdown', this.onPropPointerDown);
    this.overlay.clearSubtitle();
  }
}
