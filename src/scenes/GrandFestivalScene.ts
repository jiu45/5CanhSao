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
  private endCard!: HTMLDivElement;
  private pauseLetterButton!: HTMLButtonElement;
  private replayLetterButton!: HTMLButtonElement;
  private letterSheet!: HTMLDivElement;
  private messagePaused = false;
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
    audioManager.setScoreMood('gate');
    this.overlay.hideNextButton();
    this.overlay.clearSubtitle();
    this.overlay.setLetterboxVisible(false, 1000);
    this.fadeLayer = document.createElement('div');
    this.fadeLayer.setAttribute('aria-hidden', 'true');
    Object.assign(this.fadeLayer.style, { position: 'fixed', inset: '0',
      background: '#030610', zIndex: '1000', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(this.fadeLayer);
    this.endCard = document.createElement('div');
    this.endCard.className = 'final-end-card';
    this.endCard.setAttribute('role', 'img');
    this.endCard.setAttribute('aria-label', 'Hai chiếc đèn ông sao bên nhau dưới cùng một vầng trăng');
    this.endCard.innerHTML = `
      <svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="end-moon-glow"><stop stop-color="#f9f3dd" stop-opacity=".7"/>
            <stop offset=".45" stop-color="#b9c8d9" stop-opacity=".21"/>
            <stop offset="1" stop-color="#7c9ab9" stop-opacity="0"/></radialGradient>
          <radialGradient id="end-shared-light"><stop stop-color="#fff4ba" stop-opacity=".9"/>
            <stop offset=".46" stop-color="#f9bd68" stop-opacity=".34"/>
            <stop offset="1" stop-color="#f9bd68" stop-opacity="0"/></radialGradient>
          <linearGradient id="end-sky" x2="0" y2="1"><stop stop-color="#030916"/>
            <stop offset="1" stop-color="#11223b"/></linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#end-sky)"/>
        <circle cx="640" cy="169" r="189" fill="url(#end-moon-glow)"/>
        <circle cx="640" cy="169" r="68" fill="#faf4df"/>
        <path d="M0 478 Q145 442 294 477 Q457 434 640 472 Q835 431 1000 477 Q1132 446 1280 476 V720 H0Z"
          fill="#0b1b2e"/>
        <path d="M0 541 Q175 500 360 534 Q532 501 640 523 Q792 490 953 532 Q1120 506 1280 544 V720 H0Z"
          fill="#091725"/>
        <path d="M0 604 Q207 559 407 581 Q534 566 640 576 Q764 562 900 583 Q1092 551 1280 603 V720 H0Z"
          fill="#06111f"/>
        <path d="M77 0 Q168 203 131 484 M162 0 Q220 158 183 397 M1201 0 Q1110 222 1152 472
          M1114 0 Q1061 160 1097 365" fill="none" stroke="#102b43" stroke-width="22"/>
        <path d="M122 255 l-110 -62 90 83 M164 347 l96 -69 -79 88 M1159 235 l112 -66 -87 90
          M1115 337 l-101 -69 86 86" fill="#153955"/>
        <path d="M310 419 Q642 386 968 419" fill="none" stroke="#aa7a56" stroke-width="2" opacity=".55"/>
        <circle cx="422" cy="407" r="5" fill="#ffcf86"/><circle cx="512" cy="397" r="5" fill="#ffcf86"/>
        <circle cx="640" cy="393" r="5" fill="#ffcf86"/><circle cx="768" cy="397" r="5" fill="#ffcf86"/>
        <circle cx="858" cy="407" r="5" fill="#ffcf86"/>
        <ellipse cx="640" cy="606" rx="250" ry="92" fill="url(#end-shared-light)"/>
        <path d="M535 614 Q640 576 745 614" fill="none" stroke="#ffe8ab" stroke-width="3" opacity=".52"/>
        <g transform="translate(552 522)">
          <path d="M0 -67 L17 -23 L62 -22 L26 7 L39 52 L0 27 L-39 52 L-26 7 L-62 -22 L-17 -23Z"
            fill="#b94533" stroke="#ffce72" stroke-width="6" stroke-linejoin="round"/>
          <path d="M0 -51 L13 -17 L48 -16 L20 6 L29 39 L0 20 L-29 39 L-20 6 L-48 -16 L-13 -17Z"
            fill="#f48a43" stroke="#ffecaa" stroke-width="2"/>
          <circle r="14" fill="#fff1aa"/><path d="M0 52 V118" stroke="#8a5738" stroke-width="7"/>
        </g>
        <g transform="translate(728 522)">
          <path d="M0 -67 L17 -23 L62 -22 L26 7 L39 52 L0 27 L-39 52 L-26 7 L-62 -22 L-17 -23Z"
            fill="#315f70" stroke="#eac994" stroke-width="6" stroke-linejoin="round"/>
          <path d="M0 -51 L13 -17 L48 -16 L20 6 L29 39 L0 20 L-29 39 L-20 6 L-48 -16 L-13 -17Z"
            fill="#80afb3" stroke="#fff0bb" stroke-width="2"/>
          <circle r="14" fill="#e2f8eb"/><path d="M0 52 V118" stroke="#8a5738" stroke-width="7"/>
        </g>
      </svg>`;
    document.body.appendChild(this.endCard);
    this.pauseLetterButton = document.createElement('button');
    this.pauseLetterButton.className = 'final-letter-control';
    this.pauseLetterButton.type = 'button';
    this.pauseLetterButton.textContent = 'Tạm dừng lời chúc';
    this.pauseLetterButton.style.display = 'none';
    this.pauseLetterButton.addEventListener('click', () => {
      this.messagePaused = !this.messagePaused;
      audioManager.pauseScore(this.messagePaused);
      this.pauseLetterButton.textContent = this.messagePaused
        ? 'Tiếp tục lời chúc' : 'Tạm dừng lời chúc';
    });
    document.body.appendChild(this.pauseLetterButton);
    this.replayLetterButton = document.createElement('button');
    this.replayLetterButton.className = 'final-letter-replay';
    this.replayLetterButton.type = 'button';
    this.replayLetterButton.textContent = 'Đọc lại lời chúc ✉';
    this.replayLetterButton.style.display = 'none';
    this.replayLetterButton.addEventListener('click', () => {
      this.letterSheet.style.display = 'flex';
      scrollHint.hidden = paper.scrollHeight <= paper.clientHeight + 8;
    });
    document.body.appendChild(this.replayLetterButton);
    this.letterSheet = document.createElement('div');
    this.letterSheet.className = 'final-letter-sheet';
    this.letterSheet.style.display = 'none';
    const paper = document.createElement('article');
    const heading = document.createElement('h2');
    heading.textContent = 'Dưới cùng một vầng trăng';
    const scrollHint = document.createElement('div');
    scrollHint.className = 'final-letter-scroll-hint';
    scrollHint.textContent = 'Cuộn xuống để đọc trọn lá thư ↓';
    const message = document.createElement('p');
    message.textContent = finalWishText.trim();
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = 'Khép lá thư';
    close.addEventListener('click', () => { this.letterSheet.style.display = 'none'; });
    paper.append(heading, scrollHint, message, close);
    this.letterSheet.appendChild(paper);
    document.body.appendChild(this.letterSheet);
    const url = new URL(window.location.href);
    url.searchParams.set('scene', '8');
    history.replaceState({}, '', url);
    if (this.direct) void this.roomManager.init().catch(error =>
      console.warn('[Phase 7] room:', error));
  }

  public update(delta: number, time: number): void {
    if (this.destroyed) return;
    const dt = Math.min(delta, 0.1);
    if (!this.messagePaused) this.elapsed += dt;
    const messageEnd = this.getMessageEndTime();
    this.pauseLetterButton.style.display = this.elapsed >= 24.1 && this.elapsed < messageEnd
      ? 'block' : 'none';
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
    const endCardReveal = smooth(releaseAt + 27.5, releaseAt + 31.0, this.elapsed);
    this.endCard.style.opacity = endCardReveal.toFixed(3);
    this.fireCue('reveal', 6.3);
    this.fireCue('intimate', 18.2);
    this.fireCue('release', releaseAt + 0.2);
    this.fireCue('moon', releaseAt + 17.5);
    if (endCardReveal >= 1 && !this.isFinished) {
      this.fadeLayer.style.opacity = '1';
      this.fadeLayer.style.pointerEvents = 'auto';
      this.isFinished = true;
      this.replayLetterButton.style.display = 'block';
      audioManager.stopModernAmbientAudio();
      audioManager.stopScore();
    }
  }

  private fireCue(kind: 'reveal' | 'intimate' | 'release' | 'moon', at: number): void {
    if (this.elapsed < at || this.firedCues.has(kind)) return;
    this.firedCues.add(kind);
    if (kind === 'reveal') audioManager.setScoreMood('plaza');
    if (kind === 'intimate') audioManager.setScoreMood('letter');
    if (kind === 'release') audioManager.setScoreMood('release');
    audioManager.playPhase7Cue(kind);
  }

  private getMessageEndTime(): number {
    return this.messageBeats.reduce((end, beat) =>
      end + this.messageBeatDuration(beat), 24.1);
  }

  private messageBeatDuration(beat: string): number {
    // Leave the first and last second for the lettering to arrive and leave.
    // The fully visible interval must still be long enough to read the beat.
    return Math.min(15, Math.max(6, 2.3 + beat.split(/\s+/).length / 2.4));
  }

  private updateMessage(time: number, intimacy: number, overlap: number): void {
    const messageStart = 24.1;
    let cursor = messageStart;
    let current = '';
    let opacity = 0;
    for (const beat of this.messageBeats) {
      const duration = this.messageBeatDuration(beat);
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
    audioManager.stopScore();
    this.plaza.dispose();
    this.finale.dispose();
    this.finaleSky.dispose();
    this.endCard?.remove();
    this.fadeLayer?.remove();
    this.pauseLetterButton?.remove();
    this.replayLetterButton?.remove();
    this.letterSheet?.remove();
    this.environment.dispose();
    (this.playerLantern as any)?.dispose?.();
    (this.remoteLantern as any)?.dispose?.();
    this.roomManager.destroy();
    this.camera.fov = this.previousFov;
    this.camera.far = this.previousFar;
    this.camera.updateProjectionMatrix();
  }
}
