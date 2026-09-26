import * as THREE from 'three';
import type { IScene } from './BaseScene';
import type { Phase7GateHandoff } from './Phase6FestivalScene';
import { StoryOverlay } from '../ui/StoryOverlay';
import { RoomManager } from '../multiplayer/RoomManager';
import { FestivalPromenadeSet } from '../props/FestivalPromenadeSet';
import { GrandPlazaSet } from '../props/GrandPlazaSet';
import { FinaleMoment } from '../props/FinaleMoment';
import { FinaleSky } from '../props/FinaleSky';
import { StarLantern } from '../props/StarLantern';
import { ModernStarLantern } from '../props/ModernStarLantern';
import { Phase6RouteId } from './Phase6Routes';
import { audioManager } from '../audio/AudioManager';
import finalWishText from '../content/final-wish.txt?raw';

const smooth = (start: number, end: number, value: number): number => {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

function splitWishParagraph(paragraph: string): string[] {
  // Split paragraph into natural sentences ending with . ! ?
  const rawSentences = paragraph.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [paragraph];
  const sentences = rawSentences.map(s => s.trim()).filter(Boolean);

  const beats: string[] = [];
  let currentBeat = '';

  for (const sentence of sentences) {
    const combined = currentBeat ? `${currentBeat} ${sentence}` : sentence;
    const wordCount = combined.split(/\s+/).filter(Boolean).length;
    // Allow up to ~22 words per beat if combining sentences
    if (currentBeat && wordCount > 22) {
      beats.push(currentBeat);
      currentBeat = sentence;
    } else {
      currentBeat = combined;
    }
  }
  if (currentBeat) {
    beats.push(currentBeat);
  }
  return beats;
}

/** The gate and the two lanterns are transferred from Phase 6 for an uncut reveal. */
export class GrandFestivalScene implements IScene {
  public readonly scene: THREE.Scene;
  public readonly roomManager: RoomManager;
  public readonly environment: FestivalPromenadeSet;
  public readonly playerLantern: StarLantern | ModernStarLantern;
  public readonly remoteLantern: StarLantern | ModernStarLantern;
  public readonly plaza = new GrandPlazaSet();
  public readonly finale = new FinaleMoment();
  public readonly finaleSky = new FinaleSky();
  public elapsed = 0;
  public messageBeats = [
    'Trung Thu năm nay...',
    'em không cần phải đi một mình nữa.',
    'Chúc em một mùa trăng rằm thật dịu dàng.'
  ];
  private readonly direct: boolean;
  private readonly previousFov: number;
  private readonly previousFar: number;
  private readonly startPosition = new THREE.Vector3();
  private readonly startLookAt = new THREE.Vector3();
  private readonly cameraLookAt = new THREE.Vector3();
  private destroyed = false;
  public isFinished = false;
  private readonly role: 'host' | 'guest';
  private fadeLayer!: HTMLDivElement;
  private readonly firedCues = new Set<string>();

  private loadFinalWish(): void {
    const paragraphs = finalWishText.replace(/\r/g, '').trim().split(/\n\s*\n/)
      .map(paragraph => paragraph.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean).flatMap(splitWishParagraph);
    if (paragraphs.length) this.messageBeats = [this.messageBeats[0],
      this.messageBeats[1], ...paragraphs];
  }

  constructor(private camera: THREE.PerspectiveCamera, private overlay: StoryOverlay,
    handoff?: Phase7GateHandoff) {
    this.direct = !handoff;
    this.role = handoff?.role ?? 'host';
    this.scene = handoff?.scene ?? new THREE.Scene();
    this.roomManager = handoff?.roomManager ?? new RoomManager();
    this.environment = handoff?.environment ?? new FestivalPromenadeSet();
    if (handoff) {
      this.playerLantern = handoff.playerLantern;
      this.remoteLantern = handoff.remoteLantern;
    } else {
      const handmade = new StarLantern();
      handmade.setStep(4); handmade.setModernized(true); handmade.setElectricLit(true);
      const electric = new ModernStarLantern(); electric.setLit(true, true);
      this.playerLantern = handmade; this.remoteLantern = electric;
      this.playerLantern.group.scale.setScalar(0.5);
      this.remoteLantern.group.scale.setScalar(0.5);
      this.playerLantern.group.position.set(173, 1.18, -84.05);
      this.remoteLantern.group.position.set(173, 1.18, -81.95);
      this.scene.add(this.environment.group, this.playerLantern.group, this.remoteLantern.group);
      this.scene.background = new THREE.Color(0x080f21);
      this.scene.fog = new THREE.FogExp2(0x111b2c, 0.0045);
      this.scene.add(new THREE.HemisphereLight(0x9db3d5, 0x6f4038, 2.1));
      const moonLight = new THREE.DirectionalLight(0xb6c8ee, 1.15);
      moonLight.position.set(30, 42, 12); this.scene.add(moonLight);
      this.camera.position.set(163.8, 3.3, -83);
      this.camera.lookAt(181.2, 3.05, -83);
      this.camera.fov = 62; this.camera.updateProjectionMatrix();
    }
    this.environment.setStoryVisibility(Phase6RouteId.final);
    this.environment.setGatePresence(true, true, true);
    this.remoteLantern.group.visible = true;
    this.previousFov = camera.fov;
    this.previousFar = camera.far;
    this.camera.far = 230;
    this.camera.updateProjectionMatrix();
    this.startPosition.copy(camera.position);
    this.startLookAt.set(0, 0, -1).applyQuaternion(camera.quaternion)
      .multiplyScalar(22).add(camera.position);
    this.cameraLookAt.copy(this.startLookAt);
    this.scene.add(this.plaza.group, this.finale.group, this.finaleSky.group);
  }

  public init(): void {
    this.loadFinalWish();
    audioManager.init();
    if (this.direct) {
      audioManager.startModernAmbientAudio();
      audioManager.startFestivalVistaAmbience();
    }
    audioManager.setModernFestivalFocus(0.3);
    audioManager.setFestivalVistaMuffle(4200);
    this.overlay.hideNextButton();
    this.overlay.clearSubtitle();
    this.overlay.setLetterboxVisible(false, 1000);
    this.fadeLayer = document.createElement('div');
    this.fadeLayer.setAttribute('aria-hidden', 'true');
    Object.assign(this.fadeLayer.style, { position: 'fixed', inset: '0',
      background: '#030610', zIndex: '1000', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(this.fadeLayer);
    const url = new URL(window.location.href);
    url.searchParams.set('scene', '8');
    history.replaceState({}, '', url);
    if (this.direct) void this.roomManager.init().catch(error =>
      console.warn('[Phase 7] room:', error));
  }

  public update(delta: number, time: number): void {
    if (this.destroyed) return;
    const dt = Math.min(delta, 0.1);
    this.elapsed += dt;
    const open = smooth(2.0, 6.3, this.elapsed);
    this.environment.setGateRevealProgress(open);
    this.environment.setGateCeremony(this.elapsed / 2.2);
    this.environment.update(dt, time);
    this.plaza.setReveal(open);
    this.plaza.update(time);
    this.playerLantern.update(dt, 0.04);
    this.remoteLantern.update(dt, 0.04);
    this.playerLantern.group.rotation.y = -Math.PI / 2;
    this.remoteLantern.group.rotation.y = -Math.PI / 2;

    const cameraDrift = smooth(2.0, 7.2, this.elapsed);
    const walk = smooth(10.0, 17.2, this.elapsed);
    const intimacy = smooth(17.2, 21.5, this.elapsed);
    const lightOverlap = smooth(20.0, 23.8, this.elapsed);
    const releaseAt = this.getMessageEndTime() + 2.1;
    const celebration = smooth(releaseAt, releaseAt + 6.5, this.elapsed);
    const reframe = smooth(releaseAt, releaseAt + 3.0, this.elapsed);
    const ascent = smooth(releaseAt + 7.0, releaseAt + 21.0, this.elapsed);
    const fade = smooth(releaseAt + 23.0, releaseAt + 28.0, this.elapsed);
    this.plaza.setIntimateFocus(intimacy * (1 - celebration));
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(0.0045, 0.0095, intimacy), 0.0053, celebration);
    }
    this.finaleSky.update(this.elapsed - releaseAt);
    const hostLantern = this.role === 'host' ? this.playerLantern : this.remoteLantern;
    const guestLantern = this.role === 'guest' ? this.playerLantern : this.remoteLantern;
    const lanternX = THREE.MathUtils.lerp(173, 209, walk);
    const spread = THREE.MathUtils.lerp(1.05, 0.57, intimacy);
    hostLantern.group.position.set(lanternX, 1.18 + Math.sin(time * 2.1) * 0.035,
      -83 - spread);
    guestLantern.group.position.set(lanternX, 1.18 + Math.sin(time * 2.1 + 1) * 0.035,
      -83 + spread);

    const revealCamera = new THREE.Vector3(166.3, 4.0, -83);
    const position = this.startPosition.clone().lerp(revealCamera, cameraDrift)
      .lerp(new THREE.Vector3(200.5, 3.7, -83), walk)
      .lerp(new THREE.Vector3(198.7, 6.4, -83), intimacy)
      .lerp(new THREE.Vector3(190, 10.5, -83), reframe)
      .lerp(new THREE.Vector3(169, 25, -83), ascent);
    const lookAt = this.startLookAt.clone().lerp(new THREE.Vector3(244, 10.7, -83), cameraDrift)
      .lerp(new THREE.Vector3(242, 9.0, -83), walk)
      .lerp(new THREE.Vector3(212, 2.2, -83), intimacy)
      .lerp(new THREE.Vector3(245, 17.2, -83), reframe)
      .lerp(new THREE.Vector3(239, 11, -77), ascent);
    this.camera.position.copy(position);
    this.cameraLookAt.copy(lookAt);
    this.camera.lookAt(this.cameraLookAt);
    const nextFov = THREE.MathUtils.lerp(THREE.MathUtils.lerp(THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(this.previousFov, 65, cameraDrift),
        58, walk), 55, intimacy), 65, reframe), 75, ascent);
    if (Math.abs(nextFov - this.camera.fov) > 0.01) {
      this.camera.fov = nextFov; this.camera.updateProjectionMatrix();
    }
    this.updateMessage(time, intimacy, lightOverlap);
    const focus = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.95, 0.11, intimacy),
      0.9, celebration) * (1 - fade * 0.9);
    audioManager.setModernFestivalFocus(focus);
    audioManager.setFestivalVistaMuffle(THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(12000, 1250, intimacy), 11000, celebration));
    this.fadeLayer.style.opacity = fade.toFixed(3);
    this.fireCue('reveal', 6.3);
    this.fireCue('intimate', 18.2);
    this.fireCue('release', releaseAt + 0.2);
    this.fireCue('moon', releaseAt + 17.5);
    if (fade >= 1) {
      this.fadeLayer.style.opacity = '1';
      this.fadeLayer.style.pointerEvents = 'auto';
      this.isFinished = true;
      audioManager.stopModernAmbientAudio();
    }
  }

  private fireCue(kind: 'reveal' | 'intimate' | 'release' | 'moon', at: number): void {
    if (this.elapsed < at || this.firedCues.has(kind)) return;
    this.firedCues.add(kind);
    audioManager.playPhase7Cue(kind);
  }

  private getMessageEndTime(): number {
    return this.messageBeats.reduce((end, beat) =>
      end + Math.min(12, Math.max(5.2, beat.split(/\s+/).length / 2.6)), 24.1);
  }

  private updateMessage(time: number, intimacy: number, overlap: number): void {
    const messageStart = 24.1;
    let cursor = messageStart;
    let current = '';
    let opacity = 0;
    for (const beat of this.messageBeats) {
      const duration = Math.min(12, Math.max(5.2, beat.split(/\s+/).length / 2.6));
      const end = cursor + duration;
      if (this.elapsed >= cursor && this.elapsed < end) {
        current = beat;
        opacity = smooth(cursor, cursor + 1.1, this.elapsed) *
          (1 - smooth(end - 1.1, end, this.elapsed));
        break;
      }
      cursor = end;
    }
    this.finale.update(intimacy, overlap, opacity, current, time);
  }

  public destroy(): void {
    this.destroyed = true;
    audioManager.stopModernAmbientAudio();
    this.plaza.dispose();
    this.finale.dispose();
    this.finaleSky.dispose();
    this.fadeLayer?.remove();
    this.environment.dispose();
    (this.playerLantern as any)?.dispose?.();
    (this.remoteLantern as any)?.dispose?.();
    this.roomManager.destroy();
    this.camera.fov = this.previousFov;
    this.camera.far = this.previousFar;
    this.camera.updateProjectionMatrix();
  }
}
