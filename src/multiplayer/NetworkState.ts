/**
 * src/multiplayer/NetworkState.ts
 * 
 * Defines network data schemas, packet serialization/validation,
 * and high-frequency movement throttling for Phase 5 Multiplayer.
 */

import * as THREE from 'three';

export type PlayerRole = 'host' | 'guest';

export enum NetworkEventType {
  LANTERN_PICKUP = 'LANTERN_PICKUP',
  LANTERN_RELEASE = 'LANTERN_RELEASE',
  SWITCH_TOGGLE = 'SWITCH_TOGGLE',
  CHECKPOINT_REACHED = 'CHECKPOINT_REACHED',
  TOGETHER_SYNC = 'TOGETHER_SYNC',
  PLAYER_READY = 'PLAYER_READY',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PHASE_STATE_CHANGED = 'PHASE_STATE_CHANGED',
  PHASE6_READY = 'PHASE6_READY',
  PHASE6_STATE_REQUEST = 'PHASE6_STATE_REQUEST',
  PHASE6_STATE_SNAPSHOT = 'PHASE6_STATE_SNAPSHOT',
  ELDER_PUZZLE_ANSWER = 'ELDER_PUZZLE_ANSWER',
  ELDER_PUZZLE_RESOLVED = 'ELDER_PUZZLE_RESOLVED',
  SEPARATION_STARTED = 'SEPARATION_STARTED',
  SEPARATED_MODE_ACTIVE = 'SEPARATED_MODE_ACTIVE',
  GATE_DISCOVERED = 'GATE_DISCOVERED',
  MEMORY_ROUND_STARTED = 'MEMORY_ROUND_STARTED',
  MEMORY_INTRO_READY = 'MEMORY_INTRO_READY',
  MEMORY_CARD_SELECTED = 'MEMORY_CARD_SELECTED',
  MEMORY_ROUND_RESOLVED = 'MEMORY_ROUND_RESOLVED',
  MEMORY_PUZZLE_SOLVED = 'MEMORY_PUZZLE_SOLVED',
  PLAYERS_REUNITED = 'PLAYERS_REUNITED',
  REUNION_PLAYER_READY = 'REUNION_PLAYER_READY',
  INNER_GATE_PLAYER_READY = 'INNER_GATE_PLAYER_READY',
  INNER_GATE_READY = 'INNER_GATE_READY'
}

export type RoomLifecycle = 'NO_ROOM' | 'ROOM_CREATING' | 'WAITING_FOR_PARTNER' |
  'PARTNER_JOINING' | 'PARTNER_CONNECTED' | 'READY_TO_START' | 'ACTIVE' |
  'PARTNER_DISCONNECTED' | 'ROOM_CLOSED';

export interface SharedRoomState {
  roomId: string;
  phase: 5;
  checkpoint: 'INVITATION' | 'PARTNER_JOINED' | 'WALK_START' | 'DARK_ZONE' | 'LIGHT_ON' | 'PHASE5_END';
  hostId: string;
  playerCount: number;
  status: RoomLifecycle;
}

/**
 * Continuous movement broadcast packet sent at 10-15 Hz
 */
export interface PlayerMovementPacket {
  clientId: string;
  role: PlayerRole;
  routeId: string;                          // Shared semantic route identifier
  progressT: number;                        // Spline curve progression [0.0 .. 1.0]
  isMoving: boolean;                        // Whether local player is actively walking
  lanternHeld: boolean;                     // Handheld before chest (true) vs floating beside (false)
  position: [number, number, number];       // Three.js world coordinates [x, y, z]
  rotation: [number, number, number, number];// Quaternion [x, y, z, w]
  timestamp: number;                        // Monotonic sender timestamp in ms
  seq: number;                              // Monotonically increasing sequence integer
}

/**
 * Discrete immediate event payload
 */
export interface NetworkEventPayload {
  switchOn?: boolean;
  checkpointId?: string;
  progressT?: number;
  distance?: number;
  leaderRole?: PlayerRole;
  extra?: Record<string, any>;
}

/**
 * Discrete immediate event packet (unthrottled)
 */
export interface NetworkEventPacket {
  clientId: string;
  type: NetworkEventType;
  payload: NetworkEventPayload;
  timestamp: number;
  seq?: number;
}

/**
 * Local movement snapshot used to feed the broadcaster
 */
export interface LocalMovementState {
  routeId?: string;
  progressT: number;
  isMoving: boolean;
  lanternHeld: boolean;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
}

/**
 * Validates that an incoming object conforms to the PlayerMovementPacket schema
 */
export function isValidMovementPacket(data: any): data is PlayerMovementPacket {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.clientId === 'string' &&
    (data.role === 'host' || data.role === 'guest') &&
    (typeof data.routeId === 'string' || data.routeId === undefined) &&
    typeof data.progressT === 'number' && Number.isFinite(data.progressT) &&
    typeof data.isMoving === 'boolean' &&
    typeof data.lanternHeld === 'boolean' &&
    Array.isArray(data.position) && data.position.length === 3 && data.position.every(Number.isFinite) &&
    Array.isArray(data.rotation) && data.rotation.length === 4 && data.rotation.every(Number.isFinite) &&
    typeof data.timestamp === 'number' && Number.isFinite(data.timestamp) &&
    typeof data.seq === 'number' && Number.isInteger(data.seq)
  );
}

/**
 * Validates that an incoming object conforms to the NetworkEventPacket schema
 */
export function isValidEventPacket(data: any): data is NetworkEventPacket {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.clientId === 'string' &&
    typeof data.type === 'string' &&
    Object.values(NetworkEventType).includes(data.type as NetworkEventType) &&
    data.payload !== undefined &&
    typeof data.timestamp === 'number'
  );
}

export interface BroadcasterConfig {
  clientId: string;
  role: PlayerRole;
  routeId?: string;     // Default: 'festival_coop_main'
  movingHz?: number;    // Default: 14 Hz (~71.4ms)
  idleHz?: number;      // Default: 1 Hz (1000ms)
  sendCallback: (packet: PlayerMovementPacket) => void;
}

/**
 * Manages rate-limiting and immediate event dispatch for local player movement.
 * - 14 Hz when actively moving
 * - 1 Hz heartbeat when stationary
 * - 0ms immediate dispatch on state changes (start moving, stop moving, lantern pickup/release)
 */
export class MovementBroadcaster {
  private readonly clientId: string;
  private readonly role: PlayerRole;
  private readonly routeId: string;
  private readonly movingIntervalMs: number;
  private readonly idleIntervalMs: number;
  private readonly sendCallback: (packet: PlayerMovementPacket) => void;

  private currentSeq: number = 0;
  private timeSinceLastSendMs: number = 0;
  private lastSentMoving: boolean = false;
  private lastSentHeld: boolean = false;
  private lastSentProgressT: number = -1;
  private lastSentPosition = new THREE.Vector3();

  constructor(config: BroadcasterConfig) {
    this.clientId = config.clientId;
    this.role = config.role;
    this.routeId = config.routeId ?? 'festival_coop_main';
    const movingHz = config.movingHz ?? 14;
    const idleHz = config.idleHz ?? 1;
    this.movingIntervalMs = 1000 / Math.max(1, movingHz);
    this.idleIntervalMs = 1000 / Math.max(0.1, idleHz);
    this.sendCallback = config.sendCallback;
  }

  /**
   * Evaluates state and sends packet if throttle interval or state-change condition is met
   */
  public update(delta: number, state: LocalMovementState): void {
    const deltaMs = delta * 1000;
    this.timeSinceLastSendMs += deltaMs;

    // Detect immediate state changes (Zero-latency dispatch)
    const movingChanged = state.isMoving !== this.lastSentMoving;
    const heldChanged = state.lanternHeld !== this.lastSentHeld;
    const isStateChange = movingChanged || heldChanged;

    const targetIntervalMs = state.isMoving ? this.movingIntervalMs : this.idleIntervalMs;

    if (isStateChange || this.timeSinceLastSendMs >= targetIntervalMs) {
      this.dispatch(state);
    }
  }

  /**
   * Forces an immediate broadcast, bypassing throttle timers
   */
  public forceSend(state: LocalMovementState): void {
    this.dispatch(state);
  }

  private dispatch(state: LocalMovementState): void {
    this.currentSeq = (this.currentSeq + 1) >>> 0; // Monotonic 32-bit unsigned
    this.timeSinceLastSendMs = 0;
    this.lastSentMoving = state.isMoving;
    this.lastSentHeld = state.lanternHeld;
    this.lastSentProgressT = state.progressT;
    this.lastSentPosition.copy(state.position);

    const packet: PlayerMovementPacket = {
      clientId: this.clientId,
      role: this.role,
      routeId: state.routeId ?? this.routeId,
      progressT: Math.min(1.0, Math.max(0.0, state.progressT)),
      isMoving: state.isMoving,
      lanternHeld: state.lanternHeld,
      position: [state.position.x, state.position.y, state.position.z],
      rotation: [state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w],
      timestamp: Date.now(),
      seq: this.currentSeq
    };

    this.sendCallback(packet);
  }

  public reset(): void {
    this.currentSeq = 0;
    this.timeSinceLastSendMs = 0;
    this.lastSentMoving = false;
    this.lastSentHeld = false;
    this.lastSentProgressT = -1;
  }
}
