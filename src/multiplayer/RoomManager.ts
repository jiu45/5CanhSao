/**
 * RoomManager.ts
 * Manages multiplayer room lifecycle, URL routing, presence synchronization,
 * role arbitration (Host vs Guest), 3rd player rejection, and network event forwarding.
 *
 * Part of Phase 5: Cooperative Cinematic Lantern Journey.
 */

import {
  IRealtimeClient,
  IRealtimeChannel,
  PlayerPresence,
  createRealtimeClient
} from './RealtimeClient';
import {
  PlayerMovementPacket,
  NetworkEventPacket,
  NetworkEventType,
  PlayerRole,
  isValidMovementPacket,
  isValidEventPacket
} from './NetworkState';

export type { PlayerRole, PlayerPresence };
export type LanternType = 'traditional' | 'modern';
export type ConnectionStatus =
  | 'INITIALIZING'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CLOSED'
  | 'CHANNEL_ERROR'
  | 'REJECTED';

export interface RoomManagerOptions {
  client?: IRealtimeClient;
  roomId?: string;
  autoJoin?: boolean;
}

export class RoomManager {
  public static readonly MAX_PLAYERS = 2;
  private static readonly STORAGE_KEY_CLIENT_ID = 'trungthu_client_id';
  private static readonly STORAGE_KEY_ROLE_PREFIX = 'trungthu_role_';

  public readonly roomId: string;
  public readonly clientId: string;
  public role: PlayerRole | null = null;
  public companionPresence: PlayerPresence | null = null;
  public connectionStatus: ConnectionStatus = 'INITIALIZING';
  public isRejected: boolean = false;

  private client: IRealtimeClient;
  private channel: IRealtimeChannel | null = null;
  private joinedAt: number;
  private memoryStorage: Map<string, string> = new Map();
  private dialogOverlayEl: HTMLElement | null = null;
  private toastEl: HTMLElement | null = null;
  private isDestroyed: boolean = false;
  private registryHeartbeatTimer: any = null;

  // Event callbacks for scene integration
  public onRoleAssigned?: (role: PlayerRole) => void;
  public onCompanionJoined?: (presence: PlayerPresence) => void;
  public onCompanionLeft?: () => void;
  public onRoomFullRejected?: (message: string) => void;
  public onConnectionStatus?: (status: ConnectionStatus) => void;
  public onRemoteMovement?: (packet: PlayerMovementPacket) => void;
  public onRemoteEvent?: (event: NetworkEventPacket) => void;

  constructor(options?: RoomManagerOptions) {
    this.clientId = this.getOrCreateClientId();
    this.joinedAt = Date.now();

    // Determine room ID: explicit option -> URL query ?room= -> newly generated
    const urlRoom = RoomManager.getRoomIdFromUrl();
    this.roomId = options?.roomId || urlRoom || RoomManager.createRoomId();

    // Check if role was persisted in sessionStorage for this room (refresh rejoin)
    const cachedRole = this.safeStorageGet(`${RoomManager.STORAGE_KEY_ROLE_PREFIX}${this.roomId}`);
    if (cachedRole === 'host' || cachedRole === 'guest') {
      this.role = cachedRole as PlayerRole;
    } else {
      // If entering via invite link without create=true, default role to guest; otherwise host
      const isCreate = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('create') === 'true';
      if (urlRoom && !isCreate) {
        this.role = 'guest';
      } else {
        this.role = 'host';
      }
    }

    // Keep URL synchronized if not already present
    if (!urlRoom || urlRoom !== this.roomId) {
      RoomManager.updateUrlWithRoom(this.roomId);
    }

    // Initialize or adopt RealtimeClient
    this.client = options?.client || createRealtimeClient({
      roomId: this.roomId,
      clientId: this.clientId
    });
  }

  // =========================================================================
  // Room ID & URL Helpers
  // =========================================================================

  /**
   * Generates a short, elegant, festive room ID (e.g. "moon-7k9p2")
   */
  public static createRoomId(): string {
    const prefixes = ['moon', 'star', 'den', 'hoi', 'lantern'];
    const random = crypto.getRandomValues(new Uint8Array(7));
    const prefix = prefixes[random[0] % prefixes.length];
    const charset = '23456789abcdefghjkmnpqrstuvwxyz';
    let code = '';
    for (let i = 1; i < random.length; i++) {
      code += charset.charAt(random[i] % charset.length);
    }
    return `${prefix}-${code}`;
  }

  /**
   * Reads ?room=<roomId> from window.location.search
   */
  public static getRoomIdFromUrl(): string | null {
    if (typeof window === 'undefined' || !window.location) return null;
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')?.trim();
    if (!room) return null;
    // Sanitize: allow alphanumeric, hyphens, and underscores between 3 and 32 chars
    return /^[a-zA-Z0-9_-]{3,32}$/.test(room) ? room : null;
  }

  /**
   * Updates browser address bar with ?room=<roomId> without page reload
   */
  public static updateUrlWithRoom(roomId: string): void {
    if (typeof window === 'undefined' || !window.history) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.replaceState({ roomId }, '', url.toString());
    } catch (e) {
      console.warn('[RoomManager] Failed to update URL query params:', e);
    }
  }

  /**
   * Constructs the full shareable invite URL
   */
  public getInviteUrl(): string {
    if (typeof window === 'undefined') return `/?room=${this.roomId}`;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?room=${this.roomId}`;
  }

  /**
   * Copies invite URL to clipboard with fallback for non-secure / headless contexts.
   */
  public async copyInviteUrl(): Promise<boolean> {
    const url = this.getInviteUrl();
    let copied = false;

    // 1. Try modern navigator.clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch (err) {
        console.warn('[RoomManager] navigator.clipboard.writeText failed, trying fallback:', err);
      }
    }

    // 2. Fallback to execCommand('copy') via off-screen textarea
    if (!copied && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        console.error('[RoomManager] execCommand copy fallback failed:', fallbackErr);
      }
    }

    if (copied) {
      this.showToast('Đã sao chép link mời vào clipboard!');
    } else {
      this.showToast('Không thể sao chép tự động. Hãy sao chép link trên thanh địa chỉ.');
    }

    return copied;
  }

  // =========================================================================
  // Lifecycle & Connection Initialization
  // =========================================================================

  /**
   * Initializes channel connection, presence tracking, and broadcast listeners.
   */
  public async init(): Promise<void> {
    if (this.isDestroyed) return;

    this.updateStatus('CONNECTING');
    this.channel = this.client.channel(this.roomId, this.clientId);

    // Setup broadcast handlers
    this.channel.onBroadcast('movement', (payload: PlayerMovementPacket) => {
      if (this.isRejected || this.isDestroyed) return;
      if (isValidMovementPacket(payload) && payload.clientId === this.companionPresence?.clientId) {
        this.onRemoteMovement?.(payload);
      }
    });

    this.channel.onBroadcast('game_event', (payload: NetworkEventPacket) => {
      if (this.isRejected || this.isDestroyed) return;
      if (isValidEventPacket(payload) && payload.clientId === this.companionPresence?.clientId) {
        this.onRemoteEvent?.(payload);
      }
    });

    // Setup presence event handlers
    this.channel.onPresenceSync(() => {
      if (this.isRejected || this.isDestroyed) return;
      this.handlePresenceSync();
    });

    this.channel.onPresenceJoin((key: string, presences: PlayerPresence[]) => {
      if (this.isRejected || this.isDestroyed) return;
      console.log(`[RoomManager] Presence join event for key "${key}":`, presences);
      this.handlePresenceSync();
    });

    this.channel.onPresenceLeave((key: string, presences: PlayerPresence[]) => {
      if (this.isRejected || this.isDestroyed) return;
      console.log(`[RoomManager] Presence leave event for key "${key}":`, presences);
      this.handlePresenceSync();
    });

    // Subscribe to channel
    return new Promise<void>((resolve, reject) => {
      if (!this.channel) return reject(new Error('Channel was not initialized'));

      this.channel.subscribe(async (status) => {
        if (this.isDestroyed) return;

        if (status === 'SUBSCRIBED') {
          this.updateStatus('SUBSCRIBED');
          try {
            const existing = this.channel?.getPresenceState<PlayerPresence>() ?? {};
            const occupants = new Set(Object.values(existing).flat().map(p => p.clientId));
            if (occupants.size >= RoomManager.MAX_PLAYERS && !occupants.has(this.clientId)) {
              this.rejectRoomFull();
              resolve();
              return;
            }
            await this.trackSelfPresence();
            resolve();
          } catch (err) {
            console.error('[RoomManager] Failed to track presence:', err);
            resolve(); // do not block scene initialization
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          this.updateStatus(status);
        }
      });
    });
  }

  // =========================================================================
  // Presence Synchronization & Role Arbitration
  // =========================================================================

  private async trackSelfPresence(): Promise<void> {
    if (!this.channel || this.isRejected || this.isDestroyed) return;

    const payload: PlayerPresence = {
      clientId: this.clientId,
      role: this.role ?? 'host', // will be finalized in arbitrateRoles
      lanternType: (this.role === 'guest') ? 'modern' : 'traditional',
      joinedAt: this.joinedAt,
      isOnline: true,
      knownPartnerId: this.companionPresence?.clientId
    };

    await this.channel.trackPresence(payload);
  }

  private handlePresenceSync(): void {
    if (!this.channel || this.isRejected || this.isDestroyed) return;

    const presenceState = this.channel.getPresenceState<PlayerPresence>();
    const allPresences: PlayerPresence[] = [];

    // Flatten presence dictionary
    for (const key of Object.keys(presenceState)) {
      const list = presenceState[key];
      if (Array.isArray(list) && list.length > 0) {
        // Take the latest presence object for each key
        const latest = list[list.length - 1];
        if (latest && latest.clientId) {
          allPresences.push(latest);
        }
      }
    }

    this.arbitrateRoles(allPresences);
  }

  /**
   * Deterministically arbitrates Host vs Guest roles and enforces MAX_PLAYERS = 2.
   */
  private arbitrateRoles(presences: PlayerPresence[]): void {
    if (this.isRejected || this.isDestroyed) return;

    // Filter unique participants by clientId
    const uniqueClientsMap = new Map<string, PlayerPresence>();
    for (const p of presences) {
      if (!uniqueClientsMap.has(p.clientId)) {
        uniqueClientsMap.set(p.clientId, p);
      }
    }

    const uniquePlayers = Array.from(uniqueClientsMap.values());

    // Existing host slot wins; joinedAt and clientId resolve simultaneous joins.
    uniquePlayers.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'host' ? -1 : 1;
      if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
      return a.clientId.localeCompare(b.clientId);
    });

    const myIndex = uniquePlayers.findIndex(p => p.clientId === this.clientId);

    // -----------------------------------------------------------------------
    // Rule 1: Check 3rd Player Rejection (myIndex >= MAX_PLAYERS or room already full)
    // -----------------------------------------------------------------------
    const isRoomFull = myIndex >= RoomManager.MAX_PLAYERS ||
                       (myIndex === -1 && uniquePlayers.length >= RoomManager.MAX_PLAYERS);
    if (isRoomFull) {
      console.warn(`[RoomManager] Room "${this.roomId}" is full. Rejecting 3rd player.`);
      this.rejectRoomFull();
      return;
    }

    // -----------------------------------------------------------------------
    // Rule 2: Determine & Persist Local Role
    // -----------------------------------------------------------------------
    let newRole: PlayerRole;
    if (this.role !== null) {
      // Retain previously assigned or cached role (refresh rejoin)
      newRole = this.role;
    } else {
      // First player in room is Host; second is Guest
      newRole = (myIndex === 0) ? 'host' : 'guest';
    }

    const roleChanged = this.role !== newRole;
    this.role = newRole;
    this.safeStorageSet(`${RoomManager.STORAGE_KEY_ROLE_PREFIX}${this.roomId}`, newRole);

    if (roleChanged) {
      console.log(`[RoomManager] Assigned role: ${newRole} for client ${this.clientId}`);
      this.onRoleAssigned?.(newRole);
      // Re-broadcast presence payload with finalized role and lanternType
      this.trackSelfPresence().catch(err => console.warn('[RoomManager] Retrack presence err:', err));
    }

    // -----------------------------------------------------------------------
    // Rule 3: Companion Presence Tracking & Events
    // -----------------------------------------------------------------------
    const companion = uniquePlayers.find(p => p.clientId !== this.clientId && p.clientId);

    if (companion) {
      const wasNoCompanion = this.companionPresence === null;
      this.companionPresence = companion;

      if (wasNoCompanion) {
        console.log(`[RoomManager] Companion joined: ${companion.clientId} (${companion.role})`);
        this.onCompanionJoined?.(companion);
      }
    } else {
      const hadCompanion = this.companionPresence !== null;
      this.companionPresence = null;

      if (hadCompanion) {
        console.log('[RoomManager] Companion left the room');
        this.onCompanionLeft?.();
      }
    }
  }

  /**
   * Rejects client when room exceeds MAX_PLAYERS (2 players).
   */
  private rejectRoomFull(): void {
    if (this.isRejected) return;
    this.isRejected = true;
    this.role = 'rejected' as any;
    this.updateStatus('REJECTED');

    // Cleanly detach from channel to not interfere with active session
    if (this.channel) {
      this.channel.untrackPresence().catch(() => {});
      this.channel.unsubscribe().catch(() => {});
    }

    const rejectionMessage =
      'Hai ngọn đèn đã sum vầy cùng nhau. Cung đường hội này hiện đã có đủ hai bạn đồng hành. Hãy tạo một phòng mới để cùng thắp sáng hành trình của riêng bạn nhé.';

    this.onRoomFullRejected?.(rejectionMessage);
    this.showRoomFullDialog();
  }

  // =========================================================================
  // UI Dialogs & Toast Notifications
  // =========================================================================

  /**
   * Displays the 3rd player rejection modal dialog with Vietnamese narrative.
   */
  public showRoomFullDialog(onNewRoom?: () => void): void {
    if (typeof document === 'undefined') return;
    if (this.dialogOverlayEl) return; // Already visible

    this.injectModalStyles();

    const overlay = document.createElement('div');
    overlay.className = 'trungthu-dialog-overlay room-full-modal room-full-notice';
    overlay.id = 'room-full-dialog';
    overlay.setAttribute('data-testid', 'room-full-modal');

    overlay.innerHTML = `
      <div class="trungthu-dialog-box" role="dialog" aria-modal="true" aria-labelledby="dialog-title" data-testid="room-full-modal-box">
        <div class="trungthu-dialog-lanterns">
          <span class="dialog-lantern-icon">🏮</span>
          <span class="dialog-lantern-heart">✨</span>
          <span class="dialog-lantern-icon">🌟</span>
        </div>
        <h2 id="dialog-title" class="trungthu-dialog-title">Hai ngọn đèn đã sum vầy cùng nhau</h2>
        <p class="trungthu-dialog-desc">
          Cung đường hội này hiện đã có đủ hai bạn đồng hành (đèn nan tre truyền thống và đèn pin hiện đại).
          Hãy tạo một cung đường mới để cùng thắp sáng hành trình của riêng bạn nhé.
        </p>
        <div class="trungthu-dialog-actions">
          <button id="btn-create-new-room" class="cinematic-btn trungthu-dialog-btn">
            Tạo cung đường mới
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.dialogOverlayEl = overlay;

    // Trigger subtle fade-in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    const createBtn = overlay.querySelector<HTMLButtonElement>('#btn-create-new-room');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (onNewRoom) {
          onNewRoom();
        } else {
          this.createNewRoomAndNavigate();
        }
      });
    }
  }

  public hideRoomFullDialog(): void {
    if (this.dialogOverlayEl && this.dialogOverlayEl.parentNode) {
      this.dialogOverlayEl.classList.remove('visible');
      setTimeout(() => {
        if (this.dialogOverlayEl && this.dialogOverlayEl.parentNode) {
          this.dialogOverlayEl.parentNode.removeChild(this.dialogOverlayEl);
          this.dialogOverlayEl = null;
        }
      }, 300);
    }
  }

  /**
   * Navigates to a fresh room when requested from rejection dialog.
   */
  public createNewRoomAndNavigate(): void {
    this.hideRoomFullDialog();
    const newRoomId = RoomManager.createRoomId();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.location.href = url.toString();
    }
  }

  /**
   * Displays a transient, elegant floating toast notification.
   */
  public showToast(message: string, durationMs: number = 3000): void {
    if (typeof document === 'undefined') return;

    if (this.toastEl && this.toastEl.parentNode) {
      this.toastEl.parentNode.removeChild(this.toastEl);
      this.toastEl = null;
    }

    this.injectModalStyles();

    const toast = document.createElement('div');
    toast.className = 'trungthu-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    this.toastEl = toast;

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    setTimeout(() => {
      if (this.toastEl === toast) {
        toast.classList.remove('visible');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
          if (this.toastEl === toast) this.toastEl = null;
        }, 400);
      }
    }, durationMs);
  }

  private injectModalStyles(): void {
    if (document.getElementById('trungthu-room-manager-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'trungthu-room-manager-styles';
    styleEl.textContent = `
      .trungthu-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(5, 8, 17, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .trungthu-dialog-overlay.visible {
        opacity: 1;
      }
      .trungthu-dialog-box {
        background: radial-gradient(circle at center, rgba(22, 32, 54, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%);
        border: 1px solid rgba(244, 196, 102, 0.4);
        border-radius: 20px;
        padding: 36px 32px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        box-shadow: 0 0 45px rgba(244, 196, 102, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8);
        transform: translateY(12px);
        transition: transform 0.4s ease;
      }
      .trungthu-dialog-overlay.visible .trungthu-dialog-box {
        transform: translateY(0);
      }
      .trungthu-dialog-lanterns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        font-size: 2.2rem;
        margin-bottom: 16px;
      }
      .dialog-lantern-heart {
        font-size: 1.4rem;
        animation: pulseHeart 1.8s infinite ease-in-out;
      }
      @keyframes pulseHeart {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.25); opacity: 1; }
      }
      .trungthu-dialog-title {
        font-family: 'Cinzel', 'Playfair Display', serif;
        font-size: 1.55rem;
        color: #f4c466;
        letter-spacing: 0.08em;
        margin-bottom: 14px;
        text-shadow: 0 0 20px rgba(244, 196, 102, 0.5);
      }
      .trungthu-dialog-desc {
        font-family: 'Quicksand', sans-serif;
        font-size: 0.98rem;
        line-height: 1.65;
        color: #dce7f7;
        margin-bottom: 28px;
      }
      .trungthu-dialog-actions {
        display: flex;
        justify-content: center;
      }
      .trungthu-dialog-btn {
        min-width: 220px;
        cursor: pointer;
        background: linear-gradient(135deg, #d93829 0%, #b82618 100%);
        color: #fffaf0;
        border: 1px solid rgba(244, 196, 102, 0.6);
        border-radius: 30px;
        padding: 12px 28px;
        font-family: 'Cinzel', 'Playfair Display', serif;
        font-size: 1rem;
        letter-spacing: 0.05em;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(217, 56, 41, 0.4);
      }
      .trungthu-dialog-btn:hover {
        background: linear-gradient(135deg, #f04838 0%, #d93829 100%);
        box-shadow: 0 6px 20px rgba(244, 196, 102, 0.4), 0 0 15px rgba(217, 56, 41, 0.6);
        transform: translateY(-2px);
      }
      .trungthu-toast {
        position: fixed;
        top: 32px;
        left: 50%;
        transform: translate(-50%, -15px);
        background: rgba(14, 20, 36, 0.92);
        border: 1px solid rgba(244, 196, 102, 0.45);
        border-radius: 30px;
        padding: 10px 24px;
        color: #fffaf0;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.03em;
        backdrop-filter: blur(8px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(244, 196, 102, 0.2);
        z-index: 100000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .trungthu-toast.visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    `;
    document.head.appendChild(styleEl);
  }

  // =========================================================================
  // Movement & Event Broadcasting Facade
  // =========================================================================

  /**
   * Broadcasts high-frequency movement packet (10-15 Hz) to peer client.
   */
  public async sendMovement(packet: PlayerMovementPacket): Promise<void> {
    if (!this.channel || this.isRejected || this.isDestroyed) return;
    try {
      await this.channel.broadcast('movement', packet);
    } catch (err) {
      console.warn('[RoomManager] Failed to broadcast movement:', err);
    }
  }

  /**
   * Broadcasts immediate discrete event (PICKUP, RELEASE, SWITCH_TOGGLE, etc.)
   */
  public async sendEvent(type: NetworkEventType, payload: any = {}): Promise<void> {
    if (!this.channel || this.isRejected || this.isDestroyed) return;
    const packet: NetworkEventPacket = {
      clientId: this.clientId,
      type,
      payload,
      timestamp: Date.now()
    };
    try {
      await this.channel.broadcast('game_event', packet);
    } catch (err) {
      console.warn('[RoomManager] Failed to broadcast game event:', err);
    }
  }

  // =========================================================================
  // Client Identity & Session Storage Helpers
  // =========================================================================

  private getOrCreateClientId(): string {
    const cachedId = this.safeStorageGet(RoomManager.STORAGE_KEY_CLIENT_ID);
    if (cachedId) return cachedId;

    const newId = crypto.randomUUID?.() ??
      `tt_${Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')}`;

    this.safeStorageSet(RoomManager.STORAGE_KEY_CLIENT_ID, newId);
    return newId;
  }

  private safeStorageGet(key: string): string | null {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(key);
      }
    } catch {
      // In private browsing or restricted iframe
    }
    return this.memoryStorage.get(key) ?? null;
  }

  private safeStorageSet(key: string, value: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch {
      // In private browsing or restricted iframe
    }
    this.memoryStorage.set(key, value);
  }

  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onConnectionStatus?.(status);
  }

  // =========================================================================
  // Teardown & Cleanup
  // =========================================================================

  public async leaveRoom(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.untrackPresence();
        await this.channel.unsubscribe();
      } catch (err) {
        console.warn('[RoomManager] Error leaving room:', err);
      }
      this.channel = null;
    }
    this.companionPresence = null;
    this.updateStatus('CLOSED');
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.leaveRoom().catch(() => {});
    this.hideRoomFullDialog();
    if (this.toastEl && this.toastEl.parentNode) {
      this.toastEl.parentNode.removeChild(this.toastEl);
      this.toastEl = null;
    }
    this.onRoleAssigned = undefined;
    this.onCompanionJoined = undefined;
    this.onCompanionLeft = undefined;
    this.onRoomFullRejected = undefined;
    this.onConnectionStatus = undefined;
    this.onRemoteMovement = undefined;
    this.onRemoteEvent = undefined;
  }

  // Getters for convenience
  public get isHost(): boolean { return this.role === 'host'; }
  public get isGuest(): boolean { return this.role === 'guest'; }
  public get isConnected(): boolean { return this.connectionStatus === 'SUBSCRIBED'; }
  public get hasCompanion(): boolean { return this.companionPresence !== null; }
  public get connectedPlayers(): number { return this.hasCompanion ? 2 : 1; }
}
