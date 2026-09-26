import * as THREE from 'three';
import type { IScene } from './BaseScene';
import { StoryOverlay } from '../ui/StoryOverlay';
import { Phase6PuzzleOverlay } from '../ui/Phase6PuzzleOverlay';
import { StarLantern } from '../props/StarLantern';
import { ModernStarLantern } from '../props/ModernStarLantern';
import { DistantFestivalVista } from '../props/DistantFestivalVista';
import { FestivalPromenadeSet } from '../props/FestivalPromenadeSet';
import { audioManager } from '../audio/AudioManager';
import { RoomManager } from '../multiplayer/RoomManager';
import { MovementBroadcaster, NetworkEventType,
  type NetworkEventPacket, type PlayerMovementPacket, type PlayerRole } from '../multiplayer/NetworkState';
import { RemotePlayerInterpolator, TogetherModeHelper } from '../multiplayer/Interpolation';
import { Phase6StateController, PHASE6_AUDIO_CUES,
  type Phase6SharedState, type Phase6Stage } from '../multiplayer/Phase6State';
import { loadMemoryDeck, type MemoryDeck } from '../multiplayer/MemoryCards';
import { ELDER_PROGRESS, PHASE6_ROUTES, Phase6RouteId, SEPARATION_PROGRESS,
  splitRoute, rejoinRoute, type Phase6RouteId as RouteId } from './Phase6Routes';

type LocalSave = { routeId: RouteId; progressT: number; sharedState?: Phase6SharedState;
  localSwitchOn?: boolean; remoteSwitchOn?: boolean };

export type Phase7GateHandoff = {
  scene: THREE.Scene;
  roomManager: RoomManager;
  environment: FestivalPromenadeSet;
  playerLantern: StarLantern | ModernStarLantern;
  remoteLantern: StarLantern | ModernStarLantern;
  role: PlayerRole;
};

/** Phase 6 owns only the promenade, its story state, and its closed Inner Gate. */
export class Phase6FestivalScene implements IScene {
  public readonly scene = new THREE.Scene();
  public readonly roomManager: RoomManager;
  public readonly phase6State: Phase6StateController;
  public routeId: RouteId = Phase6RouteId.shared;
  public progressT = 0;
  public companionProgressT = 0;
  public remoteLanternVisible = false;
  public togetherMode: 'TOGETHER_MODE' | 'SEPARATED_MODE' = 'TOGETHER_MODE';
  public role: PlayerRole;
  public isMoving = false;
  public lanternHeld = false;
  public playerLantern!: StarLantern | ModernStarLantern;
  public remoteLantern!: StarLantern | ModernStarLantern;
  public memoryDeck: MemoryDeck | null = null;

  private readonly inheritedRoom: boolean;
  private readonly previousFov: number;
  private readonly festivalLight: THREE.HemisphereLight;
  private readonly moonlight: THREE.DirectionalLight;
  private readonly cameraLookAt = new THREE.Vector3();
  private readonly environment = new FestivalPromenadeSet();
  private readonly towerVista = new DistantFestivalVista();
  private readonly remoteInterpolator = new RemotePlayerInterpolator();
  private togetherHelper = new TogetherModeHelper({ curveLength: PHASE6_ROUTES.route_shared.getLength() });
  private broadcaster!: MovementBroadcaster;
  private puzzleOverlay!: Phase6PuzzleOverlay;
  private hud!: HTMLDivElement;
  private hudStyle!: HTMLStyleElement;
  private peerPhase6Ready = false;
  private localSwitchOn = true;
  private remoteSwitchOn = true;
  private readyBroadcastElapsed = 2;
  private localHold = false;
  private pointerHold = false;
  private keyHold = false;
  private separationElapsed = -1;
  private lastStage: Phase6Stage | null = null;
  private lastRevision = -1;
  private lastCrowdTier = -1;
  private elapsed = 0;
  private persistElapsed = 0;
  private audioFocusElapsed = 0;
  private destroyed = false;
  private handedOff = false;
  private gateHandoffElapsed = 0;
  private boundKeyDown = (event: KeyboardEvent) => this.onKey(event, true);
  private boundKeyUp = (event: KeyboardEvent) => this.onKey(event, false);
  private boundPointerDown = (event: PointerEvent) => this.onPointer(event, true);
  private boundPointerUp = (event: PointerEvent) => this.onPointer(event, false);

  constructor(private camera: THREE.PerspectiveCamera, private overlay: StoryOverlay,
    inheritedRoom?: RoomManager, inheritedSwitches?: { local: boolean; remote: boolean },
    private onGrandPlaza?: (handoff: Phase7GateHandoff) => void) {
    this.roomManager = inheritedRoom ?? new RoomManager();
    this.inheritedRoom = !!inheritedRoom;
    this.role = this.roomManager.role ?? 'host';
    this.previousFov = camera.fov;
    const saved = this.readSave();
    this.localSwitchOn = inheritedSwitches?.local ?? saved?.localSwitchOn ?? true;
    this.remoteSwitchOn = inheritedSwitches?.remote ?? saved?.remoteSwitchOn ?? true;
    this.phase6State = new Phase6StateController(saved?.sharedState);
    if (saved && saved.routeId in PHASE6_ROUTES && Number.isFinite(saved.progressT)) {
      this.routeId = saved.routeId;
      this.progressT = THREE.MathUtils.clamp(saved.progressT, 0, 1);
    }
    if (this.phase6State.state.separated) {
      this.togetherMode = 'SEPARATED_MODE';
      this.togetherHelper.setEnabled(false);
    }
    this.scene.background = new THREE.Color(0x0a1021);
    this.scene.fog = new THREE.FogExp2(0x101929, 0.0055);
    this.festivalLight = new THREE.HemisphereLight(0x92a6d2, 0x704232, 2.2);
    this.scene.add(this.festivalLight);
    this.moonlight = new THREE.DirectionalLight(0xb4c6ed, 1.25);
    this.moonlight.position.set(30, 42, 10); this.scene.add(this.moonlight);
    this.scene.add(this.environment.group);
    this.towerVista.clearPhase5LanternRoute();
    this.towerVista.setPhase5TowerFocus(1);
    this.towerVista.setSkylineVisible(false);
    this.towerVista.setPromenadeFloorMood();
    this.scene.add(this.towerVista.group);
  }

  public init(): void {
    audioManager.init();
    audioManager.startModernAmbientAudio();
    audioManager.startFestivalVistaAmbience();
    this.setupLanterns();
    this.setupNetwork();
    this.setupHud();
    this.puzzleOverlay = new Phase6PuzzleOverlay(
      id => this.submitElderAnswer(id), id => this.selectMemoryCard(id));
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
    void loadMemoryDeck().then(deck => { this.memoryDeck = deck; this.renderUi(); })
      .catch(error => {
        console.error('[Phase 6] Memory deck:', error);
        this.overlay.setSubtitle('Chưa tìm thấy những tấm ảnh ký ức.', 0);
      });
    const url = new URL(window.location.href);
    url.searchParams.set('scene', '7');
    history.replaceState({}, '', url);
    if (!this.inheritedRoom) void this.roomManager.init().catch(error => console.warn('[Phase 6] room:', error));
    else this.announceReady();
    this.syncStageFromState();
    this.updateTransforms();
    this.updateCamera(1, true);
    this.overlay.hideNextButton();
    this.overlay.setSubtitle('Rời sân đèn kéo quân, hai ngọn đèn bước sâu vào phố hội.', 5000);
  }

  private setupLanterns(): void {
    if (this.playerLantern) { this.scene.remove(this.playerLantern.group, this.remoteLantern.group); }
    if (this.role === 'host') {
      const local = new StarLantern(); local.setStep(4); local.setModernized(true);
      local.setElectricLit(this.localSwitchOn);
      this.playerLantern = local;
      const remote = new ModernStarLantern(); remote.setLit(this.remoteSwitchOn, true); this.remoteLantern = remote;
    } else {
      const local = new ModernStarLantern(); local.setLit(this.localSwitchOn, true); this.playerLantern = local;
      const remote = new StarLantern(); remote.setStep(4); remote.setModernized(true);
      remote.setElectricLit(this.remoteSwitchOn);
      this.remoteLantern = remote;
    }
    this.playerLantern.group.scale.setScalar(0.5);
    this.remoteLantern.group.scale.setScalar(0.5);
    this.scene.add(this.playerLantern.group, this.remoteLantern.group);
    this.broadcaster = new MovementBroadcaster({
      clientId: this.roomManager.clientId, role: this.role,
      routeId: this.routeId, movingHz: 14, idleHz: 1,
      sendCallback: packet => { void this.roomManager.sendMovement(packet); }
    });
  }

  private setupNetwork(): void {
    this.roomManager.onRoleAssigned = role => {
      if (role === this.role) return;
      this.role = role; this.setupLanterns(); this.updateHud();
    };
    this.roomManager.onCompanionJoined = () => {
      this.remoteInterpolator.reset();
      this.announceReady();
      this.requestSnapshot();
      this.updateHud();
    };
    this.roomManager.onCompanionLeft = () => {
      this.peerPhase6Ready = false;
      this.remoteLanternVisible = false;
      this.remoteLantern.group.visible = false;
      this.isMoving = false;
      this.updateHud();
      this.overlay.setSubtitle('Ngọn đèn kia tạm rời lối hội. Bạn có thể chờ họ quay lại.', 3500);
    };
    this.roomManager.onConnectionStatus = status => {
      if (status === 'SUBSCRIBED') { this.announceReady(); this.requestSnapshot(); }
    };
    this.roomManager.onRemoteMovement = packet => {
      if (!(packet.routeId in PHASE6_ROUTES)) return;
      this.remoteInterpolator.onPacketReceived(packet);
      this.companionProgressT = packet.progressT;
      if (!this.peerPhase6Ready) { this.peerPhase6Ready = true; this.announceReady(); }
    };
    this.roomManager.onRemoteEvent = event => this.handleRemoteEvent(event);
  }

  private announceReady(): void {
    if (!this.roomManager.isConnected) return;
    void this.roomManager.sendEvent(NetworkEventType.PHASE6_READY,
      { extra: { role: this.role, switchOn: this.localSwitchOn } });
    this.readyBroadcastElapsed = 0;
  }

  private requestSnapshot(): void {
    if (this.role === 'guest' && this.roomManager.isConnected) {
      void this.roomManager.sendEvent(NetworkEventType.PHASE6_STATE_REQUEST);
    }
    if (this.role === 'host') this.broadcastSnapshot();
  }

  private broadcastSnapshot(): void {
    if (this.role !== 'host') return;
    this.persistState();
    void this.roomManager.sendEvent(NetworkEventType.PHASE6_STATE_SNAPSHOT,
      { extra: { state: this.phase6State.state } });
    this.syncStageFromState();
  }

  private handleRemoteEvent(event: NetworkEventPacket): void {
    const role: PlayerRole = this.role === 'host' ? 'guest' : 'host';
    if (event.type === NetworkEventType.PHASE6_READY) {
      if (typeof event.payload?.extra?.switchOn === 'boolean') {
        this.remoteSwitchOn = event.payload.extra.switchOn;
        if (this.remoteLantern instanceof ModernStarLantern) this.remoteLantern.setLit(this.remoteSwitchOn, true);
        else (this.remoteLantern as StarLantern).setElectricLit(this.remoteSwitchOn);
      }
      const first = !this.peerPhase6Ready;
      this.peerPhase6Ready = true;
      if (first) { this.announceReady(); this.requestSnapshot(); }
      this.updateHud();
      return;
    }
    if (event.type === NetworkEventType.PHASE6_STATE_REQUEST && this.role === 'host') {
      this.broadcastSnapshot(); return;
    }
    if (event.type === NetworkEventType.PHASE6_STATE_SNAPSHOT && this.role === 'guest') {
      const snapshot = event.payload?.extra?.state as Phase6SharedState;
      if (this.phase6State.applySnapshot(snapshot)) this.syncStageFromState();
      return;
    }
    if (this.role !== 'host') return;
    const payload = event.payload;
    let changed = false;
    switch (event.type) {
      case NetworkEventType.ELDER_PUZZLE_ANSWER:
        changed = this.phase6State.answerElder(role, payload?.extra?.answer);
        break;
      case NetworkEventType.GATE_DISCOVERED:
        changed = this.phase6State.arriveAtSplitEnd(role);
        break;
      case NetworkEventType.MEMORY_CARD_SELECTED:
        changed = this.resolveMemorySelection(role, payload?.extra?.cardId);
        break;
      case NetworkEventType.REUNION_PLAYER_READY:
        changed = this.phase6State.arriveAtReunion(role);
        break;
      case NetworkEventType.INNER_GATE_PLAYER_READY:
        changed = this.phase6State.arriveAtGate(role);
        break;
    }
    if (changed) this.broadcastSnapshot();
  }

  private resolveMemorySelection(role: PlayerRole, cardId: unknown): boolean {
    const round = this.memoryDeck?.rounds[this.phase6State.state.memoryRound];
    if (!round || typeof cardId !== 'string' || !round.choiceCardIds.includes(cardId)) return false;
    return this.phase6State.selectMemory(role, cardId, round.targetCardId);
  }

  public submitElderAnswer(answer: string): void {
    if (this.phase6State.state.stage !== 'ELDER_PUZZLE') return;
    if (this.role === 'host') {
      if (this.phase6State.answerElder(this.role, answer)) this.broadcastSnapshot();
    } else {
      void this.roomManager.sendEvent(NetworkEventType.ELDER_PUZZLE_ANSWER, { extra: { answer } });
    }
  }

  public selectMemoryCard(cardId: string): void {
    if (this.phase6State.state.stage !== 'MEMORY_PUZZLE') return;
    if (this.role === 'host') {
      if (this.resolveMemorySelection(this.role, cardId)) this.broadcastSnapshot();
    } else {
      void this.roomManager.sendEvent(NetworkEventType.MEMORY_CARD_SELECTED, { extra: { cardId } });
    }
  }

  private emitHook(name: string, extra: Record<string, unknown> = {}): void {
    window.dispatchEvent(new CustomEvent('trungthu:phase6-visual', { detail: { name, ...extra } }));
    const audio = (PHASE6_AUDIO_CUES as Record<string, string>)[name];
    if (audio) window.dispatchEvent(new CustomEvent('trungthu:phase6-audio', { detail: { name: audio } }));
    if (name === 'separation') audioManager.playPhase6Cue('separation');
    if (name === 'memoryStart') audioManager.playPhase6Cue('memory');
    if (name === 'memorySuccess') audioManager.playPhase6Cue('hope');
    if (name === 'reunion') audioManager.playPhase6Cue('reunion');
    if (name === 'gateReady') audioManager.playPhase6Cue('gate');
  }

  private syncStageFromState(): void {
    const state = this.phase6State.state;
    if (this.lastRevision === state.revision && this.lastStage === state.stage) return;
    const previous = this.lastStage;
    this.lastStage = state.stage;
    this.lastRevision = state.revision;
    if (state.stage === 'ELDER_PUZZLE' && previous !== state.stage) {
      this.emitHook('elderEnter'); this.overlay.setSubtitle('Ông lão mời hai ngọn đèn dừng chân dưới mái hiên.', 4000);
    }
    if (state.elderResolved && previous === 'ELDER_PUZZLE') {
      this.emitHook('elderSuccess'); this.emitHook('crowdBuildup');
      this.overlay.setSubtitle('Ông gật đầu. Phía trước, tiếng hội dần đông hơn.', 4000);
    }
    if (state.separated && this.routeId === Phase6RouteId.shared && this.separationElapsed < 0) {
      this.beginSeparation();
    }
    if (state.stage === 'MEMORY_PUZZLE' && previous !== state.stage) {
      this.emitHook('memoryStart');
      this.overlay.setSubtitle('Người Giữ Trăng trao một ký ức cho mỗi bên.', 4000);
    }
    if (state.memorySolved && previous === 'MEMORY_PUZZLE') {
      this.emitHook('memorySuccess'); this.emitHook('guidance', { target: 'reunion' });
      this.overlay.setSubtitle('Một vệt sáng nhỏ dẫn bạn đi tìm ngọn đèn kia.', 4000);
    }
    if (state.memorySolved && (this.routeId === Phase6RouteId.host || this.routeId === Phase6RouteId.guest)) {
      this.changeRoute(rejoinRoute(this.role));
    }
    if (state.reunited && this.routeId !== Phase6RouteId.final) {
      this.changeRoute(Phase6RouteId.final);
      this.togetherMode = 'TOGETHER_MODE'; this.togetherHelper.setEnabled(true);
      this.remoteLanternVisible = this.roomManager.hasCompanion;
      this.emitHook('reunion');
      this.overlay.setSubtitle('Ánh đèn ấy đã trở lại. Cùng nhau đi nốt đoạn đường.', 5000);
    }
    this.environment.setGatePresence(state.gatePlayersReady.host, state.gatePlayersReady.guest, state.gateReady);
    if (state.gateReady) {
      if (previous !== 'PHASE6_COMPLETE') {
        this.emitHook('gateReady');
        this.overlay.setSubtitle('Hai ánh đèn chạm ngưỡng cửa. Những đường vàng bắt đầu sáng lên...', 0);
      }
    }
    this.renderUi(); this.updateHud(); this.persistState();
  }

  private beginSeparation(): void {
    this.separationElapsed = 0;
    this.isMoving = false;
    this.environment.beginSeparation();
    this.emitHook('separation');
    this.emitHook('separationCamera');
    this.overlay.setSubtitle('Dòng người qua trước mặt. Ngọn đèn kia khuất dần...', 4000);
  }

  private changeRoute(next: RouteId): void {
    if (this.routeId === next) return;
    this.routeId = next;
    this.progressT = 0;
    this.isMoving = false;
    this.togetherHelper = new TogetherModeHelper({ curveLength: PHASE6_ROUTES[next].getLength(),
      enabled: this.togetherMode === 'TOGETHER_MODE' });
    this.updateTransforms();
    this.broadcaster?.forceSend(this.movementState());
    this.persistState();
  }

  private onKey(event: KeyboardEvent, down: boolean): void {
    if (!['KeyW', 'KeyS', 'ArrowUp'].includes(event.code)) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    event.preventDefault(); this.keyHold = down; this.updateInput();
  }

  private onPointer(event: PointerEvent, down: boolean): void {
    if (down && event.button !== 0) return;
    if (down && event.target instanceof Element && event.target.closest('button,input,.phase6-keepsake')) return;
    this.pointerHold = down; this.updateInput();
  }

  private updateInput(): void {
    const next = (this.keyHold || this.pointerHold) && this.canMove();
    if (this.isMoving === next) return;
    this.isMoving = next; this.lanternHeld = next; this.localHold = next;
    void this.roomManager.sendEvent(next ? NetworkEventType.LANTERN_PICKUP : NetworkEventType.LANTERN_RELEASE);
    this.broadcaster?.forceSend(this.movementState());
  }

  private canMove(): boolean {
    if (!this.roomManager.hasCompanion || !this.peerPhase6Ready || this.separationElapsed >= 0 && this.separationElapsed < 1.55) return false;
    const state = this.phase6State.state;
    if (this.routeId === Phase6RouteId.shared) {
      if (state.stage === 'ELDER_PUZZLE' || state.separated) return false;
      if (!state.elderResolved && this.progressT >= ELDER_PROGRESS) return false;
      return this.progressT < SEPARATION_PROGRESS;
    }
    if (this.routeId === Phase6RouteId.host || this.routeId === Phase6RouteId.guest) {
      return this.progressT < 1 && !state.memorySolved;
    }
    if (this.routeId === Phase6RouteId.hostRejoin || this.routeId === Phase6RouteId.guestRejoin) {
      return this.progressT < 1 && !state.reunited;
    }
    return this.progressT < 1 && !state.gatePlayersReady[this.role];
  }

  private movementState() {
    return { routeId: this.routeId, progressT: this.progressT, isMoving: this.isMoving,
      lanternHeld: this.lanternHeld, position: this.playerLantern.group.position.clone(),
      rotation: new THREE.Quaternion().setFromEuler(this.playerLantern.group.rotation) };
  }

  public update(delta: number, time: number): void {
    if (this.destroyed) return;
    const dt = Math.min(delta, 0.1);
    this.elapsed = time;
    this.persistElapsed += dt;
    this.readyBroadcastElapsed += dt;
    if (!this.peerPhase6Ready && this.readyBroadcastElapsed >= 2) this.announceReady();
    if (this.persistElapsed > 0.5) { this.persistElapsed = 0; this.persistState(); }
    if (this.separationElapsed >= 0 && this.separationElapsed < 1.55) {
      this.separationElapsed += dt;
      if (this.separationElapsed >= 0.65) {
        this.remoteLanternVisible = false;
        this.remoteLantern.group.visible = false;
        this.emitHook('remoteLanternOccluded');
      }
      if (this.separationElapsed >= 1.55 && this.routeId === Phase6RouteId.shared) {
        this.togetherMode = 'SEPARATED_MODE'; this.togetherHelper.setEnabled(false);
        this.changeRoute(splitRoute(this.role));
        this.emitHook('separatedModeActive');
      }
    }
    if (!this.canMove() && this.isMoving) { this.isMoving = false; this.lanternHeld = false; }
    if (this.canMove() && (this.keyHold || this.pointerHold) && !this.isMoving) this.updateInput();
    if (this.isMoving) {
      const route = PHASE6_ROUTES[this.routeId];
      const together = this.togetherMode === 'TOGETHER_MODE' && this.remoteInterpolator.currentRouteId === this.routeId;
      const speedFactor = together ? this.togetherHelper.evaluate(this.progressT, this.companionProgressT).speedFactor : 1;
      this.progressT = Math.min(1, this.progressT + 2.1 * speedFactor * dt / route.getLength());
    }
    this.checkMilestones();
    this.remoteInterpolator.update(dt);
    this.companionProgressT = this.remoteInterpolator.currentProgressT;
    this.updateTransforms();
    this.broadcaster.update(dt, this.movementState());
    this.environment.setCrowdDensity(this.routeId === Phase6RouteId.shared ? this.progressT : 1,
      this.routeId === Phase6RouteId.shared);
    const crowdTier = this.routeId === Phase6RouteId.shared ? Math.floor(this.progressT * 4) : 4;
    if (crowdTier !== this.lastCrowdTier) { this.lastCrowdTier = crowdTier; this.emitHook('crowdDensity', { tier: crowdTier }); }
    this.environment.update(dt, time);
    this.updateEmotionalFocus(dt);
    // The old court's facade belongs behind the players once the promenade
    // bends away; keeping it visible here clips through the scripted crowd.
    this.towerVista.group.visible = this.routeId === Phase6RouteId.shared && this.progressT < 0.42;
    this.towerVista.update(dt, time);
    this.playerLantern.update(dt, 0.04);
    if (this.remoteLantern.group.visible) this.remoteLantern.update(dt, 0.04);
    this.updateCamera(dt);
    if (this.phase6State.state.gateReady && this.onGrandPlaza && !this.handedOff) {
      this.gateHandoffElapsed += dt;
      if (this.gateHandoffElapsed >= 1.35) {
        this.handedOff = true;
        this.onGrandPlaza({ scene: this.scene, roomManager: this.roomManager,
          environment: this.environment, playerLantern: this.playerLantern,
          remoteLantern: this.remoteLantern, role: this.role });
      }
    }
  }

  private checkMilestones(): void {
    const state = this.phase6State.state;
    if (this.role === 'host' && this.routeId === Phase6RouteId.shared) {
      if (!state.elderResolved && this.progressT >= ELDER_PROGRESS && this.companionProgressT >= ELDER_PROGRESS - 0.03) {
        if (this.phase6State.enterElder()) this.broadcastSnapshot();
      }
      if (state.elderResolved && !state.separated && this.progressT >= SEPARATION_PROGRESS &&
        this.companionProgressT >= SEPARATION_PROGRESS - 0.02) {
        if (this.phase6State.separate()) {
          void this.roomManager.sendEvent(NetworkEventType.SEPARATION_STARTED);
          this.broadcastSnapshot();
        }
      }
    }
    if ((this.routeId === Phase6RouteId.host || this.routeId === Phase6RouteId.guest) &&
      this.progressT >= 0.995 && !state.splitArrivals[this.role]) {
      this.progressT = 1; this.isMoving = false;
      if (this.role === 'host') {
        if (this.phase6State.arriveAtSplitEnd(this.role)) this.broadcastSnapshot();
      } else void this.roomManager.sendEvent(NetworkEventType.GATE_DISCOVERED);
      if (this.role === 'host') this.overlay.setSubtitle('Hai ánh đèn mới mở được lối vào đêm hội.', 5000);
      else this.overlay.setSubtitle('Người Giữ Trăng chờ bên một lối vắng.', 5000);
    }
    if ((this.routeId === Phase6RouteId.hostRejoin || this.routeId === Phase6RouteId.guestRejoin) &&
      this.progressT >= 0.995 && !state.rejoinArrivals[this.role]) {
      this.progressT = 1; this.isMoving = false;
      if (this.role === 'host') {
        if (this.phase6State.arriveAtReunion(this.role)) this.broadcastSnapshot();
      } else void this.roomManager.sendEvent(NetworkEventType.REUNION_PLAYER_READY);
    }
    if (this.routeId === Phase6RouteId.final && this.progressT >= 0.995 && !state.gatePlayersReady[this.role]) {
      this.progressT = 1; this.isMoving = false;
      if (this.role === 'host') {
        if (this.phase6State.arriveAtGate(this.role)) this.broadcastSnapshot();
      } else void this.roomManager.sendEvent(NetworkEventType.INNER_GATE_PLAYER_READY);
      if (!state.gateReady) this.overlay.setSubtitle('Hai ánh đèn mới mở được lối vào đêm hội.', 5000);
    }
  }

  public updateTransforms(): void {
    this.environment.setStoryVisibility(this.routeId);
    this.environment.setGuidance(this.routeId,
      this.phase6State.state.memorySolved && !this.phase6State.state.reunited,
      this.progressT);
    const localCurve = PHASE6_ROUTES[this.routeId];
    const p = localCurve.getPointAt(this.progressT);
    const tangent = localCurve.getTangentAt(this.progressT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    this.playerLantern.group.position.copy(p).addScaledVector(normal, this.role === 'host' ? -1.05 : 1.05);
    this.playerLantern.group.position.y += this.localHold ? 1.05 : 1.18 + Math.sin(this.elapsed * 2) * 0.04;
    this.playerLantern.group.rotation.y = Math.atan2(this.camera.position.x - p.x, this.camera.position.z - p.z);
    this.playerLantern.group.rotation.z = Math.sin(this.elapsed * 1.5) * 0.04;
    const remoteId = this.remoteInterpolator.currentRouteId as RouteId;
    const remoteCurve = PHASE6_ROUTES[remoteId];
    const visuallyOccluded = this.phase6State.state.separated &&
      (this.separationElapsed < 0 || this.separationElapsed >= 0.65);
    const allowRemote = this.roomManager.hasCompanion && this.peerPhase6Ready &&
      !visuallyOccluded && !!remoteCurve &&
      (this.routeId === Phase6RouteId.shared || remoteId === this.routeId);
    this.remoteLanternVisible = allowRemote;
    this.remoteLantern.group.visible = allowRemote;
    if (!allowRemote) return;
    const rp = remoteCurve.getPointAt(this.remoteInterpolator.currentProgressT);
    const rt = remoteCurve.getTangentAt(this.remoteInterpolator.currentProgressT);
    const rn = new THREE.Vector3(-rt.z, 0, rt.x).normalize();
    const otherRole = this.role === 'host' ? 'guest' : 'host';
    this.remoteLantern.group.position.copy(rp).addScaledVector(rn, otherRole === 'host' ? -1.05 : 1.05);
    this.remoteLantern.group.position.y += this.remoteInterpolator.currentLanternHeld ? 1.05 : 1.18;
    this.remoteLantern.group.rotation.y = Math.atan2(this.camera.position.x - rp.x, this.camera.position.z - rp.z);
  }

  private updateCamera(delta: number, snap = false): void {
    const curve = PHASE6_ROUTES[this.routeId];
    const p = curve.getPointAt(this.progressT);
    const tangent = curve.getTangentAt(this.progressT).normalize();
    const shared = this.routeId === Phase6RouteId.shared;
    const final = this.routeId === Phase6RouteId.final;
    const memory = this.phase6State.state.stage === 'MEMORY_PUZZLE';
    const elder = this.phase6State.state.stage === 'ELDER_PUZZLE';
    const crowded = shared && this.progressT > 0.72;
    const distance = final ? 9.2 : elder ? 7.5 : memory && this.role === 'guest' ? 5.6
      : crowded ? 6.0 : shared ? 7.0 : 6.6;
    const height = final ? 3.3 : elder ? 2.7 : memory ? 2.6 : 2.4;
    const target = p.clone().addScaledVector(tangent, -distance);
    target.y += height;
    const lookAt = p.clone().addScaledVector(tangent, final ? 8.2 : memory ? 5.0 : 7.5);
    lookAt.y += final ? 3.05 : memory ? 1.85 : 1.45;
    if (elder) lookAt.set(118.2, 1.55, -35.2);
    if (memory && this.role === 'guest') lookAt.set(130.55, 1.72, -98.4);
    if (snap) this.camera.position.copy(target);
    else this.camera.position.lerp(target, 1 - Math.exp(-4 * delta));
    if (snap) this.cameraLookAt.copy(lookAt);
    else this.cameraLookAt.lerp(lookAt, 1 - Math.exp(-3 * delta));
    this.camera.lookAt(this.cameraLookAt);
    const fov = final ? 62 : elder ? 55 : memory && this.role === 'guest' ? 50
      : crowded ? 55 : shared ? 61 : 56;
    const nextFov = snap ? fov : THREE.MathUtils.damp(this.camera.fov, fov, 2.5, delta);
    if (Math.abs(this.camera.fov - nextFov) > 0.01) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
  }

  private updateEmotionalFocus(delta: number): void {
    const state = this.phase6State.state;
    const shared = this.routeId === Phase6RouteId.shared;
    const final = this.routeId === Phase6RouteId.final;
    const memory = state.stage === 'MEMORY_PUZZLE';
    const rejoining = this.routeId === Phase6RouteId.hostRejoin ||
      this.routeId === Phase6RouteId.guestRejoin;
    const targetLight = final ? 2.18 : memory ? 1.18 : rejoining ? 1.68
      : shared ? state.separated ? 1.35 : 2.05 : 1.42;
    this.festivalLight.intensity = THREE.MathUtils.damp(
      this.festivalLight.intensity, targetLight, 1.1, delta);
    this.moonlight.intensity = THREE.MathUtils.damp(
      this.moonlight.intensity, memory ? 1.65 : 1.25, 1.1, delta);
    this.environment.setLightMood(final ? 0.84 : memory ? 0.23 :
      rejoining ? 0.48 : shared && !state.separated ? 0.75 : 0.28);
    this.audioFocusElapsed += delta;
    if (this.audioFocusElapsed < 0.2) return;
    this.audioFocusElapsed = 0;
    const focus = final ? 0.72 : memory ? 0.1 : rejoining ? 0.34 :
      shared ? state.separated ? 0.16 : 0.4 + this.progressT * 0.42 : 0.18;
    audioManager.updateFestivalVistaAudio(0, focus);
    audioManager.setModernFestivalFocus(focus);
    audioManager.setFestivalVistaMuffle(final ? 11000 : memory ? 1100 :
      rejoining ? 3700 : shared && !state.separated ? 10000 : 850);
  }

  private setupHud(): void {
    this.hudStyle = document.createElement('style');
    this.hudStyle.textContent = `.phase6-hud{position:fixed;z-index:28;top:20px;left:20px;max-width:min(360px,calc(100vw - 40px));
      padding:10px 16px;border:1px solid #bb8956;border-radius:12px;color:#ffdfad;background:rgba(15,19,36,.78);
      font:14px Georgia,serif;pointer-events:none}.phase6-hud small{display:block;color:#ddcbb4;margin-top:4px}`;
    document.head.appendChild(this.hudStyle);
    this.hud = document.createElement('div'); this.hud.className = 'phase6-hud';
    document.body.appendChild(this.hud); this.updateHud();
  }

  private updateHud(): void {
    if (!this.hud) return;
    const title = this.phase6State.state.reunited ? '🏮 Hai ngọn đèn lại bên nhau' :
      this.togetherMode === 'SEPARATED_MODE' ? '🏮 Tìm ánh đèn kia' : '🏮 Cùng đi sâu vào hội trăng';
    const status = this.roomManager.hasCompanion ? (this.peerPhase6Ready ? 'Giữ W hoặc chuột để đi' : 'Đang chờ bạn cùng bước tiếp...')
      : 'Đang chờ ngọn đèn kia trở lại...';
    this.hud.replaceChildren(document.createTextNode(title));
    const small = document.createElement('small'); small.textContent = status; this.hud.appendChild(small);
  }

  private renderUi(): void { this.puzzleOverlay?.render(this.phase6State.state, this.role, this.memoryDeck); }

  private saveKey(): string { return `trungthu_phase6_${this.roomManager.roomId}_${this.roomManager.clientId}`; }

  private readSave(): LocalSave | null {
    try { const raw = sessionStorage.getItem(this.saveKey()); return raw ? JSON.parse(raw) as LocalSave : null; }
    catch { return null; }
  }

  private persistState(): void {
    try {
      const save: LocalSave = { routeId: this.routeId, progressT: this.progressT,
        sharedState: this.role === 'host' ? this.phase6State.state : undefined,
        localSwitchOn: this.localSwitchOn, remoteSwitchOn: this.remoteSwitchOn };
      sessionStorage.setItem(this.saveKey(), JSON.stringify(save));
    } catch { /* The room remains playable when browser storage is disabled. */ }
  }

  public destroy(): void {
    this.destroyed = true; this.persistState();
    if (!this.handedOff) audioManager.stopModernAmbientAudio();
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    this.puzzleOverlay?.destroy(); this.hud?.remove(); this.hudStyle?.remove();
    this.scene.remove(this.towerVista.group);
    this.towerVista.dispose();
    if (!this.handedOff) {
      this.environment.dispose();
      (this.playerLantern as any)?.dispose?.(); (this.remoteLantern as any)?.dispose?.();
    }
    if (!this.handedOff) {
      this.camera.fov = this.previousFov; this.camera.updateProjectionMatrix();
    }
    if (!this.handedOff) this.roomManager.destroy();
  }
}
