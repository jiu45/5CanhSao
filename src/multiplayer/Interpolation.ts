/**
 * src/multiplayer/Interpolation.ts
 * 
 * Provides client-side snapshot smoothing, exponential transform lerp/slerp,
 * smooth cubic hold/float transitions (350ms), Together Mode soft distance clamping (8-12m),
 * and remote companion disconnect watchdog.
 */

import * as THREE from 'three';
import { PlayerMovementPacket, PlayerRole } from './NetworkState';

/**
 * Snapshot stored in the ring buffer
 */
export interface MovementSnapshot {
  routeId: string;
  progressT: number;
  isMoving: boolean;
  lanternHeld: boolean;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  timestamp: number;
  receivedAt: number;
  seq: number;
}

/**
 * Circular ring buffer for smoothing incoming network snapshots
 */
export class SnapshotRingBuffer {
  private readonly buffer: MovementSnapshot[];
  private readonly capacity: number;
  private head: number = 0;
  private size: number = 0;
  private lastAcceptedSeq: number = -1;

  constructor(capacity: number = 32) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Pushes a new movement packet.
   * Handles sequence verification, out-of-order rejection, and client restart detection.
   */
  public push(packet: PlayerMovementPacket): boolean {
    const now = performance.now();

    // Check for sequence reset (e.g. remote refreshed page and started at seq 1)
    const isClientRestart = this.lastAcceptedSeq > 1000 && packet.seq < 50;

    if (!isClientRestart && this.lastAcceptedSeq !== -1 && packet.seq <= this.lastAcceptedSeq) {
      // Reject duplicate or late out-of-order packet
      return false;
    }

    this.lastAcceptedSeq = packet.seq;

    // Validate and sanitize quaternion
    const quat = new THREE.Quaternion(
      packet.rotation[0],
      packet.rotation[1],
      packet.rotation[2],
      packet.rotation[3]
    );
    if (quat.lengthSq() < 1e-6) {
      quat.identity();
    } else {
      quat.normalize();
    }

    const snapshot: MovementSnapshot = {
      routeId: packet.routeId || 'festival_coop_main',
      progressT: packet.progressT,
      isMoving: packet.isMoving,
      lanternHeld: packet.lanternHeld,
      position: new THREE.Vector3(packet.position[0], packet.position[1], packet.position[2]),
      rotation: quat,
      timestamp: packet.timestamp,
      receivedAt: now,
      seq: packet.seq
    };

    this.buffer[this.head] = snapshot;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }

    return true;
  }

  public getLatest(): MovementSnapshot | null {
    if (this.size === 0) return null;
    const latestIdx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[latestIdx];
  }

  public clear(): void {
    this.head = 0;
    this.size = 0;
    this.lastAcceptedSeq = -1;
  }

  public get count(): number {
    return this.size;
  }
}

export interface RemoteInterpolatorConfig {
  lambdaPos?: number;          // Exponential decay factor for position (default: 12.0)
  lambdaRot?: number;          // Exponential decay factor for rotation (default: 12.0)
  teleportDistance?: number;   // Snap threshold in meters (default: 5.0m)
  holdTransitionDuration?: number; // Duration of cubic hold/float blend (default: 0.35s = 350ms)
}

/**
 * Smooths remote player transforms and manages lantern kinematics
 */
export class RemotePlayerInterpolator {
  private readonly ringBuffer: SnapshotRingBuffer;
  private readonly lambdaPos: number;
  private readonly lambdaRot: number;
  private readonly teleportThresholdSq: number;
  private readonly holdTransitionDuration: number;

  // Current smoothed state
  public currentRouteId: string = 'festival_coop_main';
  public currentPosition = new THREE.Vector3();
  public currentRotation = new THREE.Quaternion();
  public currentProgressT: number = 0;
  public currentIsMoving: boolean = false;
  public currentLanternHeld: boolean = false;

  // Target values from latest network packet
  private targetPosition = new THREE.Vector3();
  private targetRotation = new THREE.Quaternion();
  private targetProgressT: number = 0;

  // Hold vs Floating state interpolation (350ms cubic transition)
  private holdWeight: number = 0.0;           // 0.0 = floating, 1.0 = handheld
  private targetHoldWeight: number = 0.0;
  private internalTime: number = 0;

  // Watchdog timer for connection drop
  private lastPacketReceivedTime: number = 0;
  private isInitialized: boolean = false;

  constructor(config: RemoteInterpolatorConfig = {}) {
    this.ringBuffer = new SnapshotRingBuffer(32);
    this.lambdaPos = config.lambdaPos ?? 12.0;
    this.lambdaRot = config.lambdaRot ?? 12.0;
    const teleportDist = config.teleportDistance ?? 5.0;
    this.teleportThresholdSq = teleportDist * teleportDist;
    this.holdTransitionDuration = config.holdTransitionDuration ?? 0.35;
  }

  /**
   * Receives incoming packet from network broadcast
   */
  public onPacketReceived(packet: PlayerMovementPacket): void {
    const accepted = this.ringBuffer.push(packet);
    if (!accepted) return;

    this.lastPacketReceivedTime = performance.now();
    this.currentRouteId = packet.routeId || 'festival_coop_main';
    this.targetProgressT = packet.progressT;
    this.targetPosition.set(packet.position[0], packet.position[1], packet.position[2]);
    this.targetRotation.set(
      packet.rotation[0],
      packet.rotation[1],
      packet.rotation[2],
      packet.rotation[3]
    ).normalize();
    this.currentIsMoving = packet.isMoving;
    this.currentLanternHeld = packet.lanternHeld;
    this.targetHoldWeight = packet.lanternHeld ? 1.0 : 0.0;

    // Instant snap on first packet to avoid flying from origin
    if (!this.isInitialized) {
      this.currentPosition.copy(this.targetPosition);
      this.currentRotation.copy(this.targetRotation);
      this.currentProgressT = this.targetProgressT;
      this.holdWeight = this.targetHoldWeight;
      this.isInitialized = true;
    }
  }

  public onLanternHeldChanged(held: boolean): void {
    this.currentLanternHeld = held;
    this.targetHoldWeight = held ? 1.0 : 0.0;
  }

  /**
   * Per-frame update (runs inside Three.js animation loop)
   */
  public update(delta: number): void {
    if (!this.isInitialized) return;

    // Guard against large frame delta spikes (e.g. background tab)
    const clampedDelta = Math.min(delta, 0.1);
    this.internalTime += clampedDelta;

    // 1. Teleport check: snap if remote moved drastically
    if (this.currentPosition.distanceToSquared(this.targetPosition) > this.teleportThresholdSq) {
      this.currentPosition.copy(this.targetPosition);
      this.currentRotation.copy(this.targetRotation);
      this.currentProgressT = this.targetProgressT;
    } else {
      // 2. Analytic exponential lerp & slerp (Frame-rate invariant)
      const factorPos = 1.0 - Math.exp(-this.lambdaPos * clampedDelta);
      const factorRot = 1.0 - Math.exp(-this.lambdaRot * clampedDelta);

      this.currentPosition.lerp(this.targetPosition, factorPos);
      this.currentRotation.slerp(this.targetRotation, factorRot);
      this.currentProgressT += (this.targetProgressT - this.currentProgressT) * factorPos;
    }

    // 3. Smooth cubic transition for hold/float state (over 350ms)
    if (Math.abs(this.targetHoldWeight - this.holdWeight) > 1e-4) {
      const step = clampedDelta / this.holdTransitionDuration;
      if (this.targetHoldWeight > this.holdWeight) {
        this.holdWeight = Math.min(1.0, this.holdWeight + step);
      } else {
        this.holdWeight = Math.max(0.0, this.holdWeight - step);
      }
    }
  }

  /**
   * Calculates the local offset and sway for the remote lantern based on hold weight
   * @param role Remote companion's role ('host' or 'guest')
   * @param normal Normalized horizontal normal vector to the spline curve
   */
  public computeLanternLocalOffset(role: PlayerRole, normal: THREE.Vector3): {
    offset: THREE.Vector3;
    rotationEuler: THREE.Euler;
  } {
    // Hermite cubic ease-in-out curve: 3p² - 2p³
    const w = this.holdWeight * this.holdWeight * (3.0 - 2.0 * this.holdWeight);

    // Floating breathing bob
    const hoverBob = Math.sin(this.internalTime * 2.2) * 0.035;
    const hoverSway = Math.sin(this.internalTime * 1.6) * 0.04;

    // Side orientation: host stays on left lane, guest stays on right lane
    const sideSign = role === 'host' ? -1.0 : 1.0;

    // Float offset (beside body): lateral ±0.55m, vertical +1.18m
    const floatLateral = 0.55 * sideSign;
    const floatVertical = 1.18 + hoverBob;

    // Handheld offset (chest-held): lateral ±0.35m, vertical +1.08m
    const heldLateral = 0.35 * sideSign;
    const heldVertical = 1.08;

    // Interpolate between float and held
    const currentLateral = floatLateral * (1.0 - w) + heldLateral * w;
    const currentVertical = floatVertical * (1.0 - w) + heldVertical * w;

    // Compute composite world offset vector
    const offset = normal.clone().multiplyScalar(currentLateral);
    offset.y += currentVertical;

    // Pitch tilt when held (+0.15 rad forward tilt), gentle sway when floating
    const pitch = 0.15 * w;
    const roll = hoverSway * (1.0 - w);
    const rotationEuler = new THREE.Euler(pitch, 0, roll, 'YXZ');

    return { offset, rotationEuler };
  }

  /**
   * Checks if companion packets have ceased (watchdog timeout)
   * @param timeoutMs Timeout threshold in ms (default: 4500ms)
   */
  public isCompanionStale(timeoutMs: number = 4500): boolean {
    if (!this.isInitialized) return false;
    return performance.now() - this.lastPacketReceivedTime > timeoutMs;
  }

  public reset(): void {
    this.ringBuffer.clear();
    this.isInitialized = false;
    this.holdWeight = 0.0;
    this.targetHoldWeight = 0.0;
    this.internalTime = 0;
    this.lastPacketReceivedTime = 0;
  }
}

/**
 * Result structure of Together Mode distance evaluation
 */
export interface TogetherDistanceResult {
  separationDistance: number;      // Distance in meters along path
  speedFactor: number;             // Multiplier [0.0 .. 1.0] for local player speed
  isLeading: boolean;              // True if local player is ahead of remote
  isTooFar: boolean;               // True if separation exceeds 12.0m
  promptMessage: string | null;    // Vietnamese subtitle cue if throttled
}

/**
 * Configuration options for Together Mode
 */
export interface TogetherModeConfig {
  enabled?: boolean;               // Toggle for TOGETHER_MODE vs SEPARATED_MODE
  comfortDistance?: number;        // Below this distance: full speed (default: 8.0m)
  maxDistance?: number;            // Above this distance: hard brake 0m/s (default: 12.0m)
  curveLength?: number;            // Total CatmullRomCurve3 arc length in meters (default: 47.5m)
}

/**
 * Helper to calculate soft distance clamping and speed throttling between two players
 */
export class TogetherModeHelper {
  public static readonly DEFAULT_CURVE_LENGTH = 47.5; // Phase 5 curve length
  public static readonly COMFORT_LIMIT = 8.0;         // 8m comfort zone
  public static readonly BRAKE_LIMIT = 12.0;          // 12m hard stop limit

  private enabled: boolean;
  private readonly comfortDistance: number;
  private readonly maxDistance: number;
  private readonly curveLength: number;

  constructor(config: TogetherModeConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.comfortDistance = config.comfortDistance ?? TogetherModeHelper.COMFORT_LIMIT;
    this.maxDistance = config.maxDistance ?? TogetherModeHelper.BRAKE_LIMIT;
    this.curveLength = config.curveLength ?? TogetherModeHelper.DEFAULT_CURVE_LENGTH;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Calculates Together Mode speed factor for local player
   * @param localProgressT Local curve parameter [0.0 .. 1.0]
   * @param remoteProgressT Remote companion curve parameter [0.0 .. 1.0]
   */
  public evaluate(localProgressT: number, remoteProgressT: number): TogetherDistanceResult {
    // If separated mode is configured (e.g. for Phase 6), allow uninhibited movement
    if (!this.enabled) {
      const dist = Math.abs(localProgressT - remoteProgressT) * this.curveLength;
      return {
        separationDistance: dist,
        speedFactor: 1.0,
        isLeading: localProgressT > remoteProgressT,
        isTooFar: false,
        promptMessage: null
      };
    }

    const deltaT = localProgressT - remoteProgressT;
    const separationDistance = Math.abs(deltaT) * this.curveLength;
    const isLeading = deltaT > 0;

    // If local player is trailing behind or at same progress: full speed
    if (!isLeading) {
      return {
        separationDistance,
        speedFactor: 1.0,
        isLeading: false,
        isTooFar: separationDistance >= this.maxDistance,
        promptMessage: null
      };
    }

    // Local player is leading ahead:
    if (separationDistance <= this.comfortDistance) {
      // Comfort zone: full speed
      return {
        separationDistance,
        speedFactor: 1.0,
        isLeading: true,
        isTooFar: false,
        promptMessage: null
      };
    }

    if (separationDistance >= this.maxDistance) {
      // Hard brake: partner is left too far behind
      return {
        separationDistance,
        speedFactor: 0.0,
        isLeading: true,
        isTooFar: true,
        promptMessage: 'Đợi người kia một chút.'
      };
    }

    // Deceleration zone (8.0m < distance < 12.0m):
    // Smoothstep transition down from 1.0 to 0.0
    const u = (this.maxDistance - separationDistance) / (this.maxDistance - this.comfortDistance);
    const speedFactor = u * u * (3.0 - 2.0 * u);

    return {
      separationDistance,
      speedFactor: Math.max(0.0, Math.min(1.0, speedFactor)),
      isLeading: true,
      isTooFar: false,
      promptMessage: 'Chậm lại để đi cạnh nhau nhé.'
    };
  }
}
