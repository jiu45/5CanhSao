/**
 * src/scenes/CooperativeFestivalScene.ts
 * 
 * Phase 5 Milestone 2: Cooperative Cinematic Lantern Journey
 * Connects two star lanterns (Host's traditional bamboo candle lantern and Guest's modern electric switch lantern)
 * along a shared CatmullRomCurve3 towards Tháp Đèn Kéo Quân Khổng Lồ.
 * 
 * MOVEMENT SOURCE OF TRUTH:
 * Authoritative semantic state: (routeId, progressT, isMoving, lanternHeld).
 * Raw 3D position is derived locally from the shared curve definition.
 * Remote clients interpolate progressT and derive world position locally.
 */

import * as THREE from 'three';
import { IScene } from './BaseScene';
import { StarLantern } from '../props/StarLantern';
import { ModernStarLantern } from '../props/ModernStarLantern';
import { Moon } from '../props/Moon';
import { DistantFestivalVista } from '../props/DistantFestivalVista';
import { TextureGenerator } from '../utils/TextureGenerator';
import { StoryOverlay } from '../ui/StoryOverlay';
import { ElectricSwitchOverlay } from '../ui/ElectricSwitchOverlay';
import { audioManager } from '../audio/AudioManager';
import {
  RoomManager,
  PlayerRole,
  PlayerPresence
} from '../multiplayer/RoomManager';
import {
  PlayerMovementPacket,
  MovementBroadcaster,
  NetworkEventType,
  NetworkEventPacket
} from '../multiplayer/NetworkState';
import {
  RemotePlayerInterpolator,
  TogetherModeHelper
} from '../multiplayer/Interpolation';

// =============================================================================
// SHARED ROUTE DEFINITION (AUTHORITATIVE SEMANTIC PATH)
// =============================================================================
export const FESTIVAL_COOP_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(52.0, 0.20, -7.5),   // CP0: Phase 4C handoff threshold
  new THREE.Vector3(60.0, 0.10, -11.0),  // CP1: Approach flank
  new THREE.Vector3(69.0, 0.00, -15.2),  // CP2: Dark Zone entry
  new THREE.Vector3(78.0, -0.20, -19.0), // CP3: Slender Festival Gate arch
  new THREE.Vector3(86.0, -0.25, -22.2), // CP4: Illuminated Plaza entry
  new THREE.Vector3(90.0, -0.25, -23.2)  // CP5: Tower remains ahead as the Phase 5 vista
], false, 'catmullrom', 0.5);

export const ROUTE_REGISTRY: Record<string, THREE.CatmullRomCurve3> = {
  festival_coop_main: FESTIVAL_COOP_CURVE
};

export class CooperativeFestivalScene implements IScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private readonly originalCameraFov: number;
  private overlay: StoryOverlay;
  private onComplete: () => void;

  // Asset Groups
  private sceneGroup: THREE.Group;
  private environmentGroup: THREE.Group;
  private distantFestivalVista!: DistantFestivalVista;
  private moon!: Moon;

  // Multiplayer & Synchronization
  public roomManager: RoomManager;
  private broadcaster!: MovementBroadcaster;
  private remoteInterpolator: RemotePlayerInterpolator;
  private togetherHelper: TogetherModeHelper;
  public role: PlayerRole = 'host';
  public isHost: boolean = true;
  public isGuest: boolean = false;

  // Dual Lantern Representation (Strict Zero-Avatar Rule: NO humanoid meshes/avatars)
  public playerLantern!: StarLantern | ModernStarLantern;
  public remoteLantern!: StarLantern | ModernStarLantern;
  public remoteLanternVisible: boolean = false;
  private arrivalTime: number = 0;
  private arrivalStartedAt: number = 0;
  private readonly arrivalDuration: number = 1.5;
  private arrivalGlow: THREE.PointLight;
  private remoteDepartureTimer: number = 0;
  private isRemoteDeparting: boolean = false;

  // Movement & Semantic State (Public for Test Suite Inspection)
  public routeId: string = 'festival_coop_main';
  public progressT: number = 0.0;
  public companionProgressT: number = 0.0;
  public isMoving: boolean = false;
  public lanternHeld: boolean = false;
  public isInDarkZone: boolean = false;
  private _destinationReached: boolean = false;
  private remoteEndReached: boolean = false;
  private handoffPresented: boolean = false;
  private roomTransferred = false;
  public get destinationReached(): boolean {
    return this._destinationReached;
  }
  public set destinationReached(val: boolean) {
    this._destinationReached = val;
  }

  // Kinematic parameters
  public readonly curveLength: number;
  private readonly baseSpeed: number = 1.85; // m/s
  private localHoldWeight: number = 0.0;     // 0.0 = float, 1.0 = chest-held
  private currentSpeedFactor: number = 1.0;
  private footstepTimer: number = 0.0;
  private internalTime: number = 0.0;
  private persistenceElapsed: number = 0;

  // Lighting & Environment references for Dark Zone transition
  private ambientLight!: THREE.AmbientLight;
  private hemiLight!: THREE.HemisphereLight;
  private targetAmbientIntensity: number = 1.35;
  private currentAmbientIntensity: number = 1.35;
  private targetFogDensity: number = 0.0072;
  private currentFogDensity: number = 0.0072;
  private readonly baseFogColor = new THREE.Color(0x0d1326);
  private readonly darkFogColor = new THREE.Color(0x050814);

  // Modern Lantern Forward SpotLight beam in Dark Zone
  private modernSpotLight!: THREE.SpotLight;
  private modernSpotLightTarget!: THREE.Object3D;
  private ledSurgeTimer: number = 0;
  private readonly ledSurgeDuration: number = 0.65;
  private isElectricSwitchOn: boolean = false;
  private isRemoteSwitchOn: boolean = false;
  private darkZoneIntroShown: boolean = false;
  private switchMonologueTimers: number[] = [];

  // UI HUD Elements & Electric Switch Overlay
  private hudContainerEl: HTMLElement | null = null;
  private controlsHintEl: HTMLElement | null = null;
  private inviteInputEl: HTMLInputElement | null = null;
  private switchOverlay: ElectricSwitchOverlay | null = null;
  private hudFadeTimer: number | null = null;


  // Input Listeners
  private boundOnKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundOnKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private boundOnPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundOnPointerUp: ((e: PointerEvent) => void) | null = null;
  private isPointerDown: boolean = false;
  private isKeyMoveDown: boolean = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    onComplete: () => void
  ) {
    this.camera = camera;
    this.originalCameraFov = camera.fov;
    this.overlay = overlay;
    this.onComplete = onComplete;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070d1e);
    this.scene.fog = new THREE.FogExp2(0x0d1326, 0.0072);

    this.sceneGroup = new THREE.Group();
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);
    this.scene.add(this.environmentGroup);
    this.arrivalGlow = new THREE.PointLight(0xffc978, 0, 5, 2);
    this.scene.add(this.arrivalGlow);

    this.curveLength = FESTIVAL_COOP_CURVE.getLength();
    this.togetherHelper = new TogetherModeHelper({
      curveLength: this.curveLength,
      comfortDistance: 8.0,
      maxDistance: 12.0
    });
    this.remoteInterpolator = new RemotePlayerInterpolator();

    // Initialize RoomManager
    this.roomManager = new RoomManager();
    this.restoreSessionState();
    // Expose for automated browser inspection (scripts/test_phase5_multiplayer.js)
    (window as any).roomManager = this.roomManager;
    (window as any).multiplayerManager = this.roomManager;
  }

  // =========================================================================
  // INITIALIZATION & LIFECYCLE
  // =========================================================================

  public init(): void {
    this.setupLighting();
    this.setupEnvironment();
    this.setupLanterns();
    this.setupSpotLight();
    this.setupNetworkCallbacks();
    this.setupInputListeners();
    this.injectCoopHudStyles();
    this.createHudOverlay();

    // Initialize Tactile Electric Switch Overlay
    this.switchOverlay = new ElectricSwitchOverlay({
      onToggle: (isOn) => {
        this.toggleElectricSwitch(isOn);
      }
    });

    // Initialize RoomManager connection
    this.roomManager.init().catch(err => {
      console.warn('[CooperativeFestivalScene] RoomManager init non-blocking err:', err);
    });

    // Start audio ambience
    audioManager.startModernAmbientAudio();
    audioManager.startFestivalVistaAmbience();

    this.overlay.setSubtitle(
      this.isGuest ? 'Một ngọn đèn đang chờ bạn dưới ánh trăng...' : 'Một chiếc đèn thì hơi cô đơn cho một đêm Trung Thu.',
      5000
    );

    // Initial camera positioning at Phase 4C handoff threshold
    this.updateCamera(0.016, true);
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0x1c2744, 1.35);
    this.sceneGroup.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x2a3d66, 0x1f1912, 1.1);
    this.hemiLight.position.set(0, 25, 0);
    this.sceneGroup.add(this.hemiLight);
  }

  private setupSpotLight(): void {
    this.modernSpotLight = new THREE.SpotLight(0xfff8ee, 0, 32, Math.PI / 5.2, 0.55, 1.6);
    this.modernSpotLightTarget = new THREE.Object3D();
    this.sceneGroup.add(this.modernSpotLight);
    this.sceneGroup.add(this.modernSpotLightTarget);
    this.modernSpotLight.target = this.modernSpotLightTarget;
  }

  private setupEnvironment(): void {
    // 1. Celestial Full Moon
    this.moon = new Moon();
    this.moon.group.position.set(0, 14.8, -24.0);
    this.moon.group.scale.setScalar(1.5);
    this.sceneGroup.add(this.moon.group);

    // 2. Distant Festival Vista (Contains Slender Gate and Tháp Đèn Kéo Quân)
    this.distantFestivalVista = new DistantFestivalVista();
    this.distantFestivalVista.clearPhase5LanternRoute();
    this.sceneGroup.add(this.distantFestivalVista.group);

    // 3. Ground Terrain & Walkway along FESTIVAL_COOP_CURVE
    this.createPathRibbonMesh();
  }

  /**
   * Generates continuous stone paver walkway ribbon following FESTIVAL_COOP_CURVE
   */
  private createPathRibbonMesh(): void {
    const numSteps = 80;
    const pathWidth = 4.8;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const walkwayTex = TextureGenerator.createModernParkWalkwayTexture();
    walkwayTex.repeat.set(3, 32);
    walkwayTex.wrapS = THREE.RepeatWrapping;
    walkwayTex.wrapT = THREE.RepeatWrapping;

    const pathMat = new THREE.MeshStandardMaterial({
      map: walkwayTex,
      roughness: 0.82,
      metalness: 0.05
    });

    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const pt = FESTIVAL_COOP_CURVE.getPoint(t);
      const tangent = FESTIVAL_COOP_CURVE.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(-pathWidth * 0.5));
      const right = pt.clone().add(normal.clone().multiplyScalar(pathWidth * 0.5));

      vertices.push(left.x, left.y - 0.02, left.z);
      vertices.push(right.x, right.y - 0.02, right.z);

      uvs.push(0, t * 16);
      uvs.push(1, t * 16);

      if (i < numSteps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, pathMat);
    mesh.receiveShadow = true;
    this.environmentGroup.add(mesh);
  }

  private setupLanterns(): void {
    // Check initial cached role from RoomManager
    this.role = this.roomManager.role ?? 'host';
    this.isHost = this.role === 'host';
    this.isGuest = !this.isHost;

    if (this.isHost) {
      // Host: Traditional handcrafted bamboo candle lantern (Coral red wings, golden bamboo frame, warm core)
      this.playerLantern = new StarLantern();
      (this.playerLantern as StarLantern).setStep(4);
      (this.playerLantern as StarLantern).setModernized(true);
      (this.playerLantern as StarLantern).setElectricLit(false);
      this.configureTraditionalLanternBloom(this.playerLantern as StarLantern, false);
      this.playerLantern.group.scale.setScalar(0.48);

      // Companion: Modern electric switch lantern (Amber wings, vermilion red frame)
      this.remoteLantern = new ModernStarLantern();
      this.remoteLantern.group.scale.setScalar(0.48);
    } else {
      // Guest: Modern electric star lantern (Amber wings, vermilion red frame)
      this.playerLantern = new ModernStarLantern();
      this.playerLantern.setLit(this.isElectricSwitchOn, true);
      this.playerLantern.group.scale.setScalar(0.48);

      // Companion: Traditional handcrafted bamboo candle lantern (Coral red wings, golden bamboo frame)
      this.remoteLantern = new StarLantern();
      (this.remoteLantern as StarLantern).setStep(4);
      (this.remoteLantern as StarLantern).setModernized(true);
      (this.remoteLantern as StarLantern).setElectricLit(false);
      this.configureTraditionalLanternBloom(this.remoteLantern as StarLantern, false);
      this.remoteLantern.group.scale.setScalar(0.48);
    }

    this.scene.add(this.playerLantern.group);
    this.scene.add(this.remoteLantern.group);

    // Initial visibility: hide companion until joined
    this.remoteLantern.group.visible = false;
    this.remoteLanternVisible = false;

    // Movement broadcaster
    this.broadcaster = new MovementBroadcaster({
      clientId: this.roomManager.clientId,
      role: this.role,
      movingHz: 14,
      idleHz: 1,
      sendCallback: (pkt) => {
        this.roomManager.sendMovement(pkt);
      }
    });

    // Initial position evaluation
    this.updatePositions();
  }

  // =========================================================================
  // MULTIPLAYER NETWORKING & EVENT WIRING
  // =========================================================================

  private setupNetworkCallbacks(): void {
    // 1. Role Assigned Callback
    this.roomManager.onRoleAssigned = (newRole: PlayerRole) => {
      if (this.role !== newRole) {
        this.role = newRole;
        this.isHost = newRole === 'host';
        this.isGuest = !this.isHost;
        this.rebuildLanternAssignments();
        this.updateHudBadges();
      }
    };

    // 2. Companion Joined Callback
    this.roomManager.onCompanionJoined = (_presence: PlayerPresence) => {
      this.remoteInterpolator.reset();
      this.remoteLanternVisible = true;
      this.isRemoteDeparting = false;
      this.arrivalTime = 0;
      this.arrivalStartedAt = performance.now();
      this.remoteLantern.group.visible = true;
      this.remoteLantern.group.scale.setScalar(0.01);

      audioManager.playCompanionChime();
      this.overlay.setSubtitle('Một ngọn đèn nữa đã tìm đến bên bạn.', 4000);
      this.updateHudBadges();
      this.broadcastLocalState(1);
      if (this.isElectricSwitchOn) {
        void this.roomManager.sendEvent(NetworkEventType.SWITCH_TOGGLE, { switchOn: true });
      }
      if (this.destinationReached) {
        void this.roomManager.sendEvent(NetworkEventType.CHECKPOINT_REACHED, { checkpointId: 'PHASE5_END' });
      }
    };

    // 3. Companion Left Callback (Graceful Celestial Departure)
    this.roomManager.onCompanionLeft = () => {
      this.arrivalGlow.intensity = 0;
      this.remoteEndReached = false;
      this.isPointerDown = false;
      this.isKeyMoveDown = false;
      this.updateInputMovementState();
      this.startGracefulRemoteDisconnect();
      this.overlay.setSubtitle('Bạn đồng hành đã tạm rời cung đường hội...', 3500);
      this.updateHudBadges();
    };

    // 4. Remote Movement Packet Reception (AUTHORITATIVE SEMANTIC PATHING)
    this.roomManager.onRemoteMovement = (pkt: PlayerMovementPacket) => {
      this.remoteInterpolator.onPacketReceived(pkt);
      this.companionProgressT = pkt.progressT;
    };

    // 5. Remote Discrete Event Reception
    this.roomManager.onRemoteEvent = (event: NetworkEventPacket) => {
      if (event.type === NetworkEventType.LANTERN_PICKUP) {
        this.remoteInterpolator.onLanternHeldChanged(true);
      } else if (event.type === NetworkEventType.LANTERN_RELEASE) {
        this.remoteInterpolator.onLanternHeldChanged(false);
      } else if (event.type === NetworkEventType.SWITCH_TOGGLE) {
        const switchOn = event.payload?.switchOn ?? true;
        this.applySwitchState(switchOn, false /* isLocal */);
      } else if (event.type === NetworkEventType.CHECKPOINT_REACHED && event.payload?.checkpointId === 'PHASE5_END') {
        this.remoteEndReached = true;
        this.showPhase5HandoffIfReady();
      }
    };
  }

  private configureTraditionalLanternBloom(lantern: StarLantern, isLit: boolean): void {
    const l = lantern as any;
    if (l.paperRedMat) {
      l.paperRedMat.emissiveIntensity = isLit ? 0.62 : 0.40;
    }
    if (l.paperYellowMat) {
      l.paperYellowMat.emissiveIntensity = isLit ? 0.72 : 0.45;
    }
    if (lantern.candleLight) {
      lantern.candleLight.intensity = isLit ? 2.3 : 1.8;
    }
  }

  private rebuildLanternAssignments(): void {
    this.scene.remove(this.playerLantern.group);
    this.scene.remove(this.remoteLantern.group);

    if (this.isHost) {
      this.playerLantern = new StarLantern();
      (this.playerLantern as StarLantern).setStep(4);
      (this.playerLantern as StarLantern).setModernized(true);
      (this.playerLantern as StarLantern).setElectricLit(this.isElectricSwitchOn);
      this.configureTraditionalLanternBloom(this.playerLantern as StarLantern, this.isElectricSwitchOn);
      this.remoteLantern = new ModernStarLantern();
    } else {
      this.playerLantern = new ModernStarLantern();
      this.remoteLantern = new StarLantern();
      (this.remoteLantern as StarLantern).setStep(4);
      (this.remoteLantern as StarLantern).setModernized(true);
      (this.remoteLantern as StarLantern).setElectricLit(this.isRemoteSwitchOn);
      this.configureTraditionalLanternBloom(this.remoteLantern as StarLantern, this.isRemoteSwitchOn);
    }

    this.playerLantern.group.scale.setScalar(0.48);
    this.remoteLantern.group.scale.setScalar(this.remoteLanternVisible ? 0.48 : 0.01);
    this.scene.add(this.playerLantern.group);
    this.scene.add(this.remoteLantern.group);

    this.remoteLantern.group.visible = this.remoteLanternVisible;
  }

  private startGracefulRemoteDisconnect(): void {
    this.isRemoteDeparting = true;
    this.remoteDepartureTimer = 0.0;
    if (this.remoteLantern && typeof (this.remoteLantern as any).startDeparture === 'function') {
      (this.remoteLantern as any).startDeparture();
    }
  }

  // =========================================================================
  // INPUT HANDLING (MOUSE & KEYBOARD)
  // =========================================================================

  private setupInputListeners(): void {
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.isKeyMoveDown = true;
        this.updateInputMovementState();
      } else if (e.code === 'KeyF' || e.code === 'KeyE') {
        // Hotkey for electric switch in dark zone
        if (this.isInDarkZone) {
          this.toggleElectricSwitch();
        }
      }
    };

    this.boundOnKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.isKeyMoveDown = false;
        this.updateInputMovementState();
      }
    };

    this.boundOnPointerDown = (e: PointerEvent) => {
      // Ignore clicks on HUD interactive buttons
      if ((e.target as HTMLElement)?.closest('.coop-hud-container, .dark-zone-switch-panel, #dark-zone-switch-panel')) {
        return;
      }
      if (e.button === 0) { // Left click
        this.isPointerDown = true;
        this.updateInputMovementState();
      }
    };

    this.boundOnPointerUp = () => {
      this.isPointerDown = false;
      this.updateInputMovementState();
    };

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
    window.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointerup', this.boundOnPointerUp);
  }

  private updateInputMovementState(): void {
    const shouldMove = (this.isPointerDown || this.isKeyMoveDown) &&
      this.roomManager.hasCompanion &&
      !this.roomManager.isRejected && !this.destinationReached;
    if (shouldMove !== this.isMoving) {
      void this.roomManager.sendEvent(
        shouldMove ? NetworkEventType.LANTERN_PICKUP : NetworkEventType.LANTERN_RELEASE,
        { progressT: this.progressT }
      );
    }
    this.isMoving = shouldMove;
    this.lanternHeld = shouldMove;
  }

  // =========================================================================
  // SEMANTIC PATH & TRANSFORMATION DERIVATION
  // =========================================================================

  /**
   * Authoritative helper to compute 3D world transforms from spline progression and player role.
   */
  public static computeRailTransform(
    curve: THREE.CatmullRomCurve3,
    progressT: number,
    role: PlayerRole
  ): {
    center: THREE.Vector3;
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
    lanePosition: THREE.Vector3;
  } {
    const clampedT = Math.max(0.0, Math.min(1.0, progressT));
    const center = curve.getPoint(clampedT);
    const tangent = curve.getTangent(clampedT).normalize();
    // Horizontal 2D normal vector on the XZ plane
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Keep both lanterns in the central cinematic frame.
    const laneSign = role === 'host' ? -1.0 : 1.0;
    const laneOffset = normal.clone().multiplyScalar(laneSign * 0.65);
    const lanePosition = center.clone().add(laneOffset);

    return { center, tangent, normal, lanePosition };
  }

  /**
   * Computes lantern local kinematic offsets for local player based on hold weight
   */
  private computeLocalLanternOffset(role: PlayerRole, normal: THREE.Vector3): {
    offset: THREE.Vector3;
    rotationEuler: THREE.Euler;
  } {
    const w = this.localHoldWeight * this.localHoldWeight * (3.0 - 2.0 * this.localHoldWeight);
    const hoverBob = Math.sin(this.internalTime * 2.2) * 0.035;
    const hoverSway = Math.sin(this.internalTime * 1.6) * 0.04;
    const sideSign = role === 'host' ? -1.0 : 1.0;

    // Floating posture: lateral ±0.55m, vertical +1.18m + bob
    const floatLateral = 0.55 * sideSign;
    const floatVertical = 1.18 + hoverBob;

    // Handheld posture: lateral ±0.35m, vertical +1.08m
    const heldLateral = 0.35 * sideSign;
    const heldVertical = 1.08;

    const lateral = floatLateral * (1.0 - w) + heldLateral * w;
    const vertical = floatVertical * (1.0 - w) + heldVertical * w;

    const offset = normal.clone().multiplyScalar(lateral);
    offset.y += vertical;

    const pitch = 0.15 * w;
    const roll = hoverSway * (1.0 - w);
    const rotationEuler = new THREE.Euler(pitch, 0, roll, 'YXZ');

    return { offset, rotationEuler };
  }

  // =========================================================================
  // PER-FRAME UPDATE LOOP
  // =========================================================================

  public update(delta: number, time: number): void {
    const clampedDelta = Math.min(delta, 0.1);
    this.internalTime = time;
    this.persistenceElapsed += clampedDelta;
    if (this.persistenceElapsed >= 0.5) {
      this.persistenceElapsed = 0;
      this.persistSessionState();
    }

    if (this.remoteLanternVisible && !this.isRemoteDeparting && this.arrivalTime < this.arrivalDuration) {
      this.arrivalTime = Math.min(this.arrivalDuration, (performance.now() - this.arrivalStartedAt) / 1000);
      const u = THREE.MathUtils.smoothstep(this.arrivalTime / this.arrivalDuration, 0, 1);
      this.remoteLantern.group.scale.setScalar(0.01 + 0.47 * u);
      this.arrivalGlow.intensity = Math.sin(Math.PI * u) * 2.1;
      if (this.arrivalTime >= this.arrivalDuration) {
        void this.roomManager.sendEvent(NetworkEventType.PLAYER_READY);
        this.updateInputMovementState();
      }
    }

    // Auto-fade controls hint once walking starts or destination is reached
    if (this.controlsHintEl && (this.progressT > 0.03 || this.destinationReached)) {
      if (this.controlsHintEl.style.opacity !== '0' && this.controlsHintEl.style.display !== 'none') {
        this.controlsHintEl.style.transition = 'opacity 1.2s ease';
        this.controlsHintEl.style.opacity = '0';
        window.setTimeout(() => {
          if (this.controlsHintEl && (this.progressT > 0.03 || this.destinationReached)) {
            this.controlsHintEl.style.display = 'none';
          }
        }, 1200);
      }
    }

    // 1. Advance Local Player along CatmullRomCurve3
    if (this.isMoving && !this.destinationReached) {
      // Evaluate Together Mode distance constraint
      if (this.remoteLanternVisible) {
        const tetherResult = this.togetherHelper.evaluate(this.progressT, this.companionProgressT);
        this.currentSpeedFactor = tetherResult.speedFactor;

        if (tetherResult.promptMessage && tetherResult.isLeading) {
          this.overlay.setSubtitle(tetherResult.promptMessage, 1500);
        }
      } else {
        this.currentSpeedFactor = 1.0;
      }

      const advanceDist = this.baseSpeed * this.currentSpeedFactor * clampedDelta;
      const advanceDeltaT = advanceDist / this.curveLength;
      this.progressT = Math.min(1.0, this.progressT + advanceDeltaT);

      // Footstep sound progression
      this.footstepTimer += clampedDelta;
      if (this.footstepTimer >= 0.46) {
        this.footstepTimer = 0.0;
        audioManager.playModernFootstep();
      }

      // Check arrival at destination
      if (this.progressT >= 0.98 && !this.destinationReached) {
        this.onDestinationReached();
      }
    }

    // 2. Smooth cubic blend for local hold/float weight (350ms duration)
    const targetWeight = this.lanternHeld ? 1.0 : 0.0;
    if (Math.abs(targetWeight - this.localHoldWeight) > 1e-4) {
      const step = clampedDelta / 0.35;
      if (targetWeight > this.localHoldWeight) {
        this.localHoldWeight = Math.min(1.0, this.localHoldWeight + step);
      } else {
        this.localHoldWeight = Math.max(0.0, this.localHoldWeight - step);
      }
    }

    // 3. Update Remote Player Interpolator
    this.remoteInterpolator.update(clampedDelta);
    this.companionProgressT = this.remoteInterpolator.currentProgressT;

    // 4. Update 3D Positions of Both Lanterns (Authoritative Semantic Derivation)
    this.updatePositions();

    // 5. Broadcast Local Movement Packet
    this.broadcastLocalState(clampedDelta);

    // 6. Checkpoint Dark Zone Environment & UI
    this.updateDarkZoneCheck(clampedDelta);

    // 7. Update LED surge decay & SpotLight alignment
    this.updateLedBurst(clampedDelta);

    // 8. Handle Graceful Remote Departure Animation (if departing)
    this.updateRemoteDeparture(clampedDelta);

    // 9. Update Camera Choreography
    this.updateCamera(clampedDelta, false);

    // 10. Update Scene Actors
    this.moon.update(this.camera);
    if (this.distantFestivalVista) {
      this.distantFestivalVista.update(clampedDelta, time);
    }
    if (this.playerLantern) {
      this.playerLantern.update(clampedDelta, 0.04);
    }
    if (this.remoteLantern && this.remoteLanternVisible) {
      this.remoteLantern.update(clampedDelta, 0.04);
    }
  }

  /**
   * Applies the authoritative mathematical curve position to both lanterns
   */
  public updatePositions(): void {
    // 1. Local Lantern Position (Derived from routeId + progressT)
    const localCurve = ROUTE_REGISTRY[this.routeId] || FESTIVAL_COOP_CURVE;
    const localRail = CooperativeFestivalScene.computeRailTransform(
      localCurve,
      this.progressT,
      this.role
    );
    const localLanternOffset = this.computeLocalLanternOffset(this.role, localRail.normal);

    this.playerLantern.group.position.copy(localRail.lanePosition).add(localLanternOffset.offset);
    const localFinale = THREE.MathUtils.smoothstep(this.progressT, 0.72, 0.98);
    this.playerLantern.group.position.y += localFinale * 0.25;
    this.playerLantern.group.position.addScaledVector(localRail.normal,
      localFinale * (this.role === 'host' ? -0.35 : 0.35));
    this.playerLantern.group.scale.setScalar(0.48 + localFinale * 0.08);
    this.playerLantern.group.rotation.copy(localLanternOffset.rotationEuler);
    this.faceLanternTowardCamera(this.playerLantern.group);

    // 2. Remote Lantern Position (Derived from remote routeId + interpolatedProgressT)
    if (this.remoteLanternVisible && !this.isRemoteDeparting) {
      const companionRole: PlayerRole = this.isHost ? 'guest' : 'host';
      const remoteCurve = ROUTE_REGISTRY[this.remoteInterpolator.currentRouteId] || FESTIVAL_COOP_CURVE;
      const remoteRail = CooperativeFestivalScene.computeRailTransform(
        remoteCurve,
        this.remoteInterpolator.currentProgressT,
        companionRole
      );
      const remoteLanternOffset = this.remoteInterpolator.computeLanternLocalOffset(
        companionRole,
        remoteRail.normal
      );

      this.remoteLantern.group.position.copy(remoteRail.lanePosition).add(remoteLanternOffset.offset);
      const remoteFinale = THREE.MathUtils.smoothstep(this.remoteInterpolator.currentProgressT, 0.72, 0.98);
      this.remoteLantern.group.position.y += remoteFinale * 0.25;
      this.remoteLantern.group.position.addScaledVector(remoteRail.normal,
        remoteFinale * (companionRole === 'host' ? -0.35 : 0.35));
      if (this.arrivalTime >= this.arrivalDuration) {
        this.remoteLantern.group.scale.setScalar(0.48 + remoteFinale * 0.08);
      }
      if (this.arrivalTime < this.arrivalDuration) {
        const remaining = 1 - THREE.MathUtils.smoothstep(this.arrivalTime / this.arrivalDuration, 0, 1);
        this.remoteLantern.group.position.addScaledVector(remoteRail.normal, remaining * 0.8);
        this.remoteLantern.group.position.y += remaining * 0.45;
      }
      this.remoteLantern.group.rotation.copy(remoteLanternOffset.rotationEuler);
      this.faceLanternTowardCamera(this.remoteLantern.group);
      this.arrivalGlow.position.copy(this.remoteLantern.group.position);
    }
  }

  private faceLanternTowardCamera(group: THREE.Group): void {
    // Both stars are shallow 2.5D objects; preserve their readable silhouette with subtle organic 3D float.
    const camAngle = Math.atan2(
      this.camera.position.x - group.position.x,
      this.camera.position.z - group.position.z
    );
    group.rotation.y = camAngle + Math.sin(this.internalTime * 1.5) * 0.06;
    group.rotation.x = 0.06 + (this.lanternHeld ? 0.12 : 0.0);
    group.rotation.z = Math.sin(this.internalTime * 1.2) * 0.04;
  }

  private broadcastLocalState(delta: number): void {
    const quat = new THREE.Quaternion().setFromEuler(this.playerLantern.group.rotation);
    this.broadcaster.update(delta, {
      routeId: this.routeId,
      progressT: this.progressT,
      isMoving: this.isMoving,
      lanternHeld: this.lanternHeld,
      position: this.playerLantern.group.position,
      rotation: quat
    });
  }

  // =========================================================================
  // TOGETHER MODE & DISTANCE ACCESSORS (FOR TEST SUITE)
  // =========================================================================

  /**
   * Returns distance between the two lanterns in meters (Tested in test_phase5_multiplayer.js)
   */
  public getDistanceBetweenLanterns(): number {
    if (!this.remoteLanternVisible) return 0.0;
    const deltaT = Math.abs(this.progressT - this.companionProgressT);
    return deltaT * this.curveLength;
  }

  // =========================================================================
  // CHECKPOINT DARK ZONE & ELECTRIC TOGGLE SWITCH
  // =========================================================================

  private updateDarkZoneCheck(delta: number): void {
    // The quiet grove lies before the bright gate, not inside the plaza.
    let darkFactor = 0;
    if (this.progressT < 0.16) {
      darkFactor = 0;
    } else if (this.progressT < 0.22) {
      darkFactor = THREE.MathUtils.smoothstep(this.progressT, 0.16, 0.22);
    } else if (this.progressT <= 0.37) {
      darkFactor = 1.0;
    } else if (this.progressT <= 0.50) {
      darkFactor = 1.0 - THREE.MathUtils.smoothstep(this.progressT, 0.37, 0.50);
    } else {
      darkFactor = 0;
    }

    this.isInDarkZone = darkFactor > 0.4;

    if (this.isInDarkZone) {
      this.targetAmbientIntensity = THREE.MathUtils.lerp(1.35, 0.48, darkFactor);
      this.targetFogDensity = THREE.MathUtils.lerp(0.0072, 0.016, darkFactor);

      if (this.progressT >= 0.22 && !this.darkZoneIntroShown) {
        this.darkZoneIntroShown = true;
        void this.roomManager.sendEvent(NetworkEventType.CHECKPOINT_REACHED, { checkpointId: 'DARK_ZONE' });
        this.overlay.setSubtitle(
          'Con đường râm mát dưới rặng cây... Hãy thắp sáng bóng LED trên chiếc đèn ông sao hiện đại.',
          4800
        );
        this.switchOverlay?.show();
      }
    } else {
      this.targetAmbientIntensity = 1.35;
      this.targetFogDensity = 0.0072;
      if (this.progressT > 0.52 && this.switchOverlay?.isVisible) {
        this.switchOverlay.hide();
      }
    }
    this.distantFestivalVista.setPhase5Darkness(darkFactor * 0.60);
    audioManager.updateFestivalVistaAudio(0, THREE.MathUtils.lerp(1.0, 0.45, darkFactor));

    // Smooth lighting tweening
    this.currentAmbientIntensity += (this.targetAmbientIntensity - this.currentAmbientIntensity) * Math.min(1.0, delta * 3.0);
    this.ambientLight.intensity = this.currentAmbientIntensity;
    this.hemiLight.intensity = this.currentAmbientIntensity * 0.8;

    this.currentFogDensity += (this.targetFogDensity - this.currentFogDensity) * Math.min(1.0, delta * 3.0);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = this.currentFogDensity;
      this.scene.fog.color.lerpColors(this.baseFogColor, this.darkFogColor, darkFactor);
    }
  }

  /**
   * Toggles the mechanical switch on the modern lantern (Callable via UI or test script)
   */
  public toggleElectricSwitch(forceState?: boolean): void {
    const nextState = forceState !== undefined ? forceState : !this.isElectricSwitchOn;
    this.applySwitchState(nextState, true /* isLocal */);
  }

  /**
   * Applies switch state, lighting surge, sound, subtitles, and network broadcast
   */
  public applySwitchState(switchOn: boolean, isLocal: boolean): void {
    if (isLocal) {
      this.isElectricSwitchOn = switchOn;
      this.switchOverlay?.setSwitchState(switchOn, false);
      this.persistSessionState();
    } else {
      this.isRemoteSwitchOn = switchOn;
    }

    // The electric switch specifically illuminates the ModernStarLantern (battery-powered LED)
    const modernLantern = (this.playerLantern instanceof ModernStarLantern)
      ? this.playerLantern
      : (this.remoteLantern instanceof ModernStarLantern ? this.remoteLantern : null);

    if (modernLantern) {
      modernLantern.setLit(switchOn);
    }

    // For StarLantern (traditional), also respond to switch activation by enhancing warmth and updating lit state
    const traditionalLantern = (this.playerLantern instanceof StarLantern)
      ? this.playerLantern
      : (this.remoteLantern instanceof StarLantern ? this.remoteLantern : null);
    if (traditionalLantern) {
      traditionalLantern.isLit = switchOn;
      if (typeof (traditionalLantern as any).setElectricLit === 'function') {
        (traditionalLantern as any).setElectricLit(switchOn);
      }
      this.configureTraditionalLanternBloom(traditionalLantern as StarLantern, switchOn);
    }

    if (switchOn) {
      this.ledSurgeTimer = this.ledSurgeDuration;
      this.modernSpotLight.visible = true;
      this.modernSpotLight.intensity = 2.4;

      if (isLocal) this.triggerSwitchMonologue();
    } else {
      this.modernSpotLight.visible = this.isElectricSwitchOn || this.isRemoteSwitchOn;
      if (!this.modernSpotLight.visible) this.modernSpotLight.intensity = 0.0;
      if (isLocal) this.clearSwitchMonologue();
    }

    // Broadcast discrete event immediately to companion if triggered locally
    if (isLocal) {
      this.roomManager.sendEvent(NetworkEventType.SWITCH_TOGGLE, {
        switchOn,
        progressT: this.progressT,
        timestamp: Date.now()
      });
      if (switchOn) void this.roomManager.sendEvent(NetworkEventType.CHECKPOINT_REACHED, { checkpointId: 'LIGHT_ON' });
    }
  }

  private updateLedBurst(delta: number): void {
    const modernLantern = (this.playerLantern instanceof ModernStarLantern)
      ? this.playerLantern
      : (this.remoteLantern instanceof ModernStarLantern ? this.remoteLantern : null);
    if ((!this.isElectricSwitchOn && !this.isRemoteSwitchOn) || !modernLantern) return;

    if (this.ledSurgeTimer > 0) {
      this.ledSurgeTimer = Math.max(0, this.ledSurgeTimer - delta);
      const p = 1.0 - (this.ledSurgeTimer / this.ledSurgeDuration);
      const cubicEaseOut = 1.0 - Math.pow(1.0 - p, 3);

      this.modernSpotLight.intensity = THREE.MathUtils.lerp(2.4, 1.6, cubicEaseOut);
    }

    // Align forward spotlight slightly ahead of modern lantern position to avoid self-illumination glare
    const clampedT = Math.max(0.0, Math.min(1.0, this.progressT));
    const tangent = FESTIVAL_COOP_CURVE.getTangent(clampedT).normalize();
    this.modernSpotLight.position.copy(modernLantern.group.position).add(tangent.clone().multiplyScalar(0.35));
    this.modernSpotLight.position.y += 0.15;
    this.modernSpotLightTarget.position.copy(modernLantern.group.position).add(tangent.clone().multiplyScalar(14.0));
  }

  private triggerSwitchMonologue(): void {
    this.clearSwitchMonologue();
    this.overlay.setSubtitle('Tách! Ánh đèn pin bừng sáng, giao hòa giữa nến xưa mộc mạc và sắc màu hôm nay.', 4800);
    const t = window.setTimeout(() => {
      this.overlay.clearSubtitle();
    }, 4800);
    this.switchMonologueTimers.push(t);
  }

  private clearSwitchMonologue(): void {
    for (const timer of this.switchMonologueTimers) {
      clearTimeout(timer);
    }
    this.switchMonologueTimers = [];
  }

  // =========================================================================
  // DESTINATION ARRIVAL SEQUENCE
  // =========================================================================

  private onDestinationReached(): void {
    this.destinationReached = true;
    this.isMoving = false;
    this.lanternHeld = false;
    this.persistSessionState();
    void this.roomManager.sendEvent(NetworkEventType.CHECKPOINT_REACHED, { checkpointId: 'PHASE5_END' });

    this.showPhase5HandoffIfReady();
  }

  private showPhase5HandoffIfReady(): void {
    if (!this.destinationReached || this.handoffPresented) return;
    if (!this.remoteEndReached || !this.roomManager.hasCompanion) {
      this.overlay.setSubtitle('Dừng lại một chút, chờ ngọn đèn bên cạnh.', 4000);
      return;
    }
    this.handoffPresented = true;
    this.overlay.setSubtitle('Hai ngọn đèn cùng đến dưới chân Tháp Đèn Kéo Quân.', 5500);
    this.overlay.showNextButton('Đi sâu vào hội trăng', () => this.onComplete());
  }

  public transferRoomManager(): RoomManager {
    this.roomTransferred = true;
    return this.roomManager;
  }

  public getSwitchState(): { local: boolean; remote: boolean } {
    return { local: this.isElectricSwitchOn, remote: this.isRemoteSwitchOn };
  }

  // =========================================================================
  // GRACEFUL REMOTE DEPARTURE ANIMATION
  // =========================================================================

  private updateRemoteDeparture(delta: number): void {
    if (!this.isRemoteDeparting) return;

    this.remoteDepartureTimer += delta;
    const progress = Math.min(1.0, this.remoteDepartureTimer / 2.0);

    // Gently drift upwards (+1.4m) and fade out scale
    this.remoteLantern.group.position.y += delta * 0.7;
    this.remoteLantern.group.rotation.y += delta * 0.8;
    this.remoteLantern.group.scale.setScalar(0.48 * (1.0 - progress));

    if (progress >= 1.0) {
      this.isRemoteDeparting = false;
      this.remoteLanternVisible = false;
      this.remoteLantern.group.visible = false;
    }
  }

  // =========================================================================
  // CINEMATIC CAMERA CHOREOGRAPHY
  // =========================================================================

  private updateCamera(delta: number, snap: boolean = false): void {
    const midT = this.remoteLanternVisible
      ? (this.progressT + this.companionProgressT) * 0.5
      : this.progressT;

    const clampedMidT = Math.max(0.0, Math.min(1.0, midT));
    const midPt = FESTIVAL_COOP_CURVE.getPoint(clampedMidT);
    const tangent = FESTIVAL_COOP_CURVE.getTangent(clampedMidT).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Pull back for the final tableau so both lanterns and the tower fit together.
    const vistaReveal = THREE.MathUtils.smoothstep(clampedMidT, 0.72, 0.98);
    this.distantFestivalVista.setPhase5TowerFocus(vistaReveal);

    // Walking camera: 5.2m back, eye-level 1.68m.
    // Destination arrival: pulls back 10.8m, height 1.55m for low-angle heroic perspective of 17.5m tower with lanterns in frame.
    const camBackDist = THREE.MathUtils.lerp(5.2, 10.8, vistaReveal);
    const camHeight = THREE.MathUtils.lerp(1.68, 1.55, vistaReveal);
    const camSideDist = THREE.MathUtils.lerp(0.18, 0.0, vistaReveal);

    const camBack = tangent.clone().multiplyScalar(-camBackDist);
    const camSide = normal.clone().multiplyScalar(camSideDist);

    const targetCamPos = new THREE.Vector3(
      midPt.x + camBack.x + camSide.x,
      midPt.y + camHeight,
      midPt.z + camBack.z + camSide.z
    );

    // Frame the carried lanterns in the lower third while keeping the gate and path ahead in view.
    const walkLookTarget = midPt.clone().add(tangent.clone().multiplyScalar(8.2));
    walkLookTarget.y = midPt.y + 1.45;

    // At destination, look toward the illuminated mid-tier of Tháp Đèn Kéo Quân while framing both lanterns clearly
    const towerLookTarget = new THREE.Vector3(100.0, 5.6, -25.6);
    const lookTarget = walkLookTarget.clone().lerp(towerLookTarget, vistaReveal);

    const targetFov = THREE.MathUtils.lerp(this.originalCameraFov, 64, vistaReveal);
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    if (snap) {
      this.camera.position.copy(targetCamPos);
      this.camera.lookAt(lookTarget);
    } else {
      const camLerpFactor = 1.0 - Math.exp(-6.0 * delta);
      this.camera.position.lerp(targetCamPos, camLerpFactor);
      this.camera.lookAt(lookTarget);
    }
  }

  // =========================================================================
  // UI HUD, INVITE BADGE & TOGGLE OVERLAY
  // =========================================================================

  private injectCoopHudStyles(): void {
    if (document.getElementById('coop-festival-hud-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'coop-festival-hud-styles';
    styleEl.textContent = `
      .coop-hud-container {
        position: fixed;
        top: 20px;
        right: 24px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        z-index: 10000;
        pointer-events: none;
      }
      .coop-badge-card {
        background: rgba(14, 20, 36, 0.88);
        border: 1px solid rgba(244, 196, 102, 0.45);
        border-radius: 16px;
        padding: 10px 18px;
        color: #fffaf0;
        font-family: 'Quicksand', sans-serif;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10px);
        pointer-events: auto;
      }
      .coop-room-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.92rem;
      }
      .coop-btn-copy {
        background: #d93829;
        color: #fffaf0;
        border: 1px solid rgba(244, 196, 102, 0.6);
        border-radius: 20px;
        padding: 5px 12px;
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.25s ease;
      }
      .coop-btn-copy:hover {
        background: #f04838;
        transform: translateY(-1px);
      }
      .coop-status-text {
        font-size: 0.82rem;
        color: #f4c466;
        margin-top: 4px;
      }
      .coop-invite-input {
        display: none;
        width: min(300px, 72vw);
        margin-top: 8px;
        padding: 7px 9px;
        border-radius: 8px;
        border: 1px solid rgba(244, 196, 102, 0.55);
        background: rgba(4, 8, 18, 0.8);
        color: #fffaf0;
      }
      .coop-invite-input.visible { display: block; }
      .coop-controls-hint {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(14, 20, 36, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 6px 18px;
        color: #e2e8f0;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.85rem;
        pointer-events: none;
        z-index: 10000;
      }
    `;
    document.head.appendChild(styleEl);
  }

  private createHudOverlay(): void {
    this.hudContainerEl = document.createElement('div');
    this.hudContainerEl.className = 'coop-hud-container';
    this.hudContainerEl.innerHTML = `
      <div class="coop-badge-card">
        <div class="coop-room-row" id="coop-invite-actions">
          <span>🏮 Một chiếc đèn đang chờ chiếc thứ hai</span>
          <button class="coop-btn-copy coop-btn-share">Mời người cùng rước đèn</button>
          <button class="coop-btn-copy room-invite-link" data-testid="room-invite-link">Sao chép liên kết</button>
        </div>
        <input class="coop-invite-input" aria-label="Liên kết mời" readonly>
        <div class="coop-status-text" id="coop-presence-status">Đang chờ một ngọn đèn khác...</div>
      </div>
    `;
    document.body.appendChild(this.hudContainerEl);

    const copyBtn = this.hudContainerEl.querySelector<HTMLButtonElement>('.coop-btn-copy');
    const directCopyBtn = this.hudContainerEl.querySelector<HTMLButtonElement>('.room-invite-link');
    this.inviteInputEl = this.hudContainerEl.querySelector<HTMLInputElement>('.coop-invite-input');
    const inviteUrl = this.roomManager.getInviteUrl();
    if (directCopyBtn) {
      directCopyBtn.value = inviteUrl;
      directCopyBtn.addEventListener('click', async () => {
        if (!(await this.roomManager.copyInviteUrl())) this.showManualInviteLink();
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Cùng rước đèn Trung Thu', url: inviteUrl });
            return;
          } catch { /* Share cancelled or unavailable; copy below. */ }
        }
        if (!(await this.roomManager.copyInviteUrl())) this.showManualInviteLink();
      });
    }

    this.controlsHintEl = document.createElement('div');
    this.controlsHintEl.className = 'coop-controls-hint';
    this.controlsHintEl.textContent = 'Nhấn giữ Chuột trái / Phím [W] để nhấc đèn và cùng sánh bước';
    document.body.appendChild(this.controlsHintEl);

    this.updateHudBadges();
  }

  private showManualInviteLink(): void {
    if (!this.inviteInputEl) return;
    this.inviteInputEl.value = this.roomManager.getInviteUrl();
    this.inviteInputEl.classList.add('visible');
    this.inviteInputEl.select();
  }

  private updateHudBadges(): void {
    if (!this.hudContainerEl) return;
    const statusEl = this.hudContainerEl.querySelector('#coop-presence-status');
    const actionsEl = this.hudContainerEl.querySelector<HTMLElement>('#coop-invite-actions');
    if (actionsEl) actionsEl.style.display = this.isGuest || this.remoteLanternVisible ? 'none' : 'flex';
    if (this.inviteInputEl && this.remoteLanternVisible) this.inviteInputEl.classList.remove('visible');
    if (this.controlsHintEl) this.controlsHintEl.style.display = this.remoteLanternVisible ? 'block' : 'none';
    if (statusEl) {
      if (this.remoteLanternVisible) {
        statusEl.textContent = 'Hai ngọn đèn đã tìm thấy nhau.';
        if (!this.hudFadeTimer) {
          this.hudFadeTimer = window.setTimeout(() => {
            if (this.hudContainerEl && this.remoteLanternVisible) {
              this.hudContainerEl.style.transition = 'opacity 1.5s ease';
              this.hudContainerEl.style.opacity = '0';
              window.setTimeout(() => {
                if (this.hudContainerEl && this.remoteLanternVisible) {
                  this.hudContainerEl.style.display = 'none';
                }
              }, 1500);
            }
          }, 3000);
        }
      } else {
        if (this.hudFadeTimer) {
          clearTimeout(this.hudFadeTimer);
          this.hudFadeTimer = null;
        }
        this.hudContainerEl.style.display = 'flex';
        this.hudContainerEl.style.opacity = '1';
        statusEl.textContent = 'Đang chờ một ngọn đèn khác...';
      }
    }
  }

  // =========================================================================
  // TEARDOWN & CLEANUP (ANTI-REGRESSION)
  // =========================================================================

  public destroy(): void {
    if (this.hudFadeTimer) {
      clearTimeout(this.hudFadeTimer);
      this.hudFadeTimer = null;
    }
    this.persistSessionState();
    this.camera.fov = this.originalCameraFov;
    this.camera.updateProjectionMatrix();
    this.clearSwitchMonologue();

    // 1. Remove input event listeners
    if (this.boundOnKeyDown) window.removeEventListener('keydown', this.boundOnKeyDown);
    if (this.boundOnKeyUp) window.removeEventListener('keyup', this.boundOnKeyUp);
    if (this.boundOnPointerDown) window.removeEventListener('pointerdown', this.boundOnPointerDown);
    if (this.boundOnPointerUp) window.removeEventListener('pointerup', this.boundOnPointerUp);

    // 2. Remove DOM overlays
    if (this.hudContainerEl?.parentNode) {
      this.hudContainerEl.parentNode.removeChild(this.hudContainerEl);
      this.hudContainerEl = null;
      this.inviteInputEl = null;
    }
    if (this.controlsHintEl?.parentNode) {
      this.controlsHintEl.parentNode.removeChild(this.controlsHintEl);
      this.controlsHintEl = null;
    }
    if (this.switchOverlay) {
      this.switchOverlay.destroy();
      this.switchOverlay = null;
    }

    // 3. Stop audio
    audioManager.stopModernAmbientAudio();

    // 4. Dispose props & scene meshes safely
    if (this.distantFestivalVista) {
      this.distantFestivalVista.dispose();
    }
    if (this.playerLantern) {
      (this.playerLantern as any).dispose?.();
    }
    if (this.remoteLantern) {
      (this.remoteLantern as any).dispose?.();
    }

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.scene.fog = null;
    if (!this.roomTransferred) this.roomManager.leaveRoom().catch(() => {});
  }

  private getSessionStateKey(): string {
    return `trungthu_phase5_${this.roomManager.roomId}_${this.roomManager.clientId}`;
  }

  private restoreSessionState(): void {
    try {
      const raw = sessionStorage.getItem(this.getSessionStateKey());
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Number.isFinite(saved.progressT) && saved.progressT >= 0 && saved.progressT <= 1) {
        this.progressT = saved.progressT;
        this._destinationReached = saved.progressT >= 0.98;
      }
      this.isElectricSwitchOn = saved.switchOn === true;
    } catch { /* Storage can be unavailable in restricted browser contexts. */ }
  }

  private persistSessionState(): void {
    try {
      sessionStorage.setItem(this.getSessionStateKey(), JSON.stringify({
        progressT: this.progressT,
        switchOn: this.isElectricSwitchOn
      }));
    } catch { /* Scene remains playable without session storage. */ }
  }
}
