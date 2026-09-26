/**
 * RealtimeClient.ts
 * Unified Realtime Client abstraction for Phase 5 Cooperative Multiplayer.
 * Supports Supabase Realtime v2 (WebSockets) with automatic fallback to native
 * browser BroadcastChannel (MockRealtimeClient) for local/offline multi-tab testing.
 */

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

// Connection / Subscription status
export type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

// Configuration interface
export interface RealtimeClientConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  roomId?: string;
  clientId?: string;
  useMock?: boolean;
}

// Presence payload representing a connected player
export interface PlayerPresence {
  clientId: string;
  role: 'host' | 'guest';
  lanternType: 'traditional' | 'modern';
  joinedAt: number;
  isOnline: boolean;
  knownPartnerId?: string;
  presence_ref?: string;
  [key: string]: any;
}

// Unified channel interface implemented by both Supabase and Mock
export interface IRealtimeChannel {
  /**
   * Subscribe to the channel and receive connection status updates
   */
  subscribe(onStatus?: (status: ChannelStatus) => void): void;

  /**
   * Unsubscribe from the channel and clean up listeners
   */
  unsubscribe(): Promise<void>;

  /**
   * Track current player presence in the room
   */
  trackPresence(payload: PlayerPresence | Record<string, any>): Promise<any>;

  /**
   * Stop tracking current player presence
   */
  untrackPresence(): Promise<any>;

  /**
   * Get current presence state dictionary keyed by client ID
   */
  getPresenceState<T = any>(): Record<string, T[]>;

  /**
   * Callback fired when presence state is synchronized
   */
  onPresenceSync(callback: () => void): void;

  /**
   * Callback fired when a player joins
   */
  onPresenceJoin(callback: (key: string, newPresences: any[]) => void): void;

  /**
   * Callback fired when a player leaves
   */
  onPresenceLeave(callback: (key: string, leftPresences: any[]) => void): void;

  /**
   * Broadcast an event to other players in the room
   */
  broadcast(event: string, payload: any): Promise<void>;

  /**
   * Listen for broadcast events
   */
  onBroadcast(event: string, callback: (payload: any) => void): void;

  /**
   * Unregister broadcast listener(s)
   */
  offBroadcast(event: string, callback?: (payload: any) => void): void;
}

// Unified client interface
export interface IRealtimeClient {
  /**
   * Get or create a channel for a specific room and client ID
   */
  channel(roomId: string, clientId: string): IRealtimeChannel;

  /**
   * Terminate all active channels and connections
   */
  disconnect(): Promise<void> | void;

  /**
   * Whether the client is operating in local mock mode
   */
  isMock(): boolean;

  /**
   * Return client driver type
   */
  getClientType(): 'supabase' | 'mock';
}

// ============================================================================
// Supabase Realtime v2 Implementation
// ============================================================================

export class SupabaseRealtimeChannel implements IRealtimeChannel {
  private rawChannel: RealtimeChannel;
  private broadcastCallbacks: Map<string, Set<(payload: any) => void>> = new Map();
  private presenceSyncCallbacks: Set<() => void> = new Set();
  private presenceJoinCallbacks: Set<(key: string, newPresences: any[]) => void> = new Set();
  private presenceLeaveCallbacks: Set<(key: string, leftPresences: any[]) => void> = new Set();

  constructor(
    private supabase: SupabaseClient,
    public readonly roomId: string,
    public readonly clientId: string
  ) {
    this.rawChannel = this.supabase.channel(`trungthu_room_${roomId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: clientId }
      }
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.rawChannel
      .on('presence', { event: 'sync' }, () => {
        this.presenceSyncCallbacks.forEach(cb => {
          try { cb(); } catch (err) { console.error('[SupabaseRealtime] presence:sync error', err); }
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.presenceJoinCallbacks.forEach(cb => {
          try { cb(key, newPresences); } catch (err) { console.error('[SupabaseRealtime] presence:join error', err); }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.presenceLeaveCallbacks.forEach(cb => {
          try { cb(key, leftPresences); } catch (err) { console.error('[SupabaseRealtime] presence:leave error', err); }
        });
      });
  }

  public subscribe(onStatus?: (status: ChannelStatus) => void): void {
    this.rawChannel.subscribe((status, error) => {
      if (error) {
        console.error(`[SupabaseRealtime] Channel error in room ${this.roomId}:`, error);
      }
      if (onStatus) {
        onStatus(status as ChannelStatus);
      }
    });
  }

  public async unsubscribe(): Promise<void> {
    await this.rawChannel.unsubscribe();
    this.broadcastCallbacks.clear();
    this.presenceSyncCallbacks.clear();
    this.presenceJoinCallbacks.clear();
    this.presenceLeaveCallbacks.clear();
  }

  public async trackPresence(payload: PlayerPresence | Record<string, any>): Promise<any> {
    const result = await this.rawChannel.track(payload);
    if (result === 'error') {
      throw new Error(`[SupabaseRealtime] Failed to track presence in room ${this.roomId}`);
    }
    return result;
  }

  public async untrackPresence(): Promise<any> {
    return await this.rawChannel.untrack();
  }

  public getPresenceState<T = any>(): Record<string, T[]> {
    return this.rawChannel.presenceState() as Record<string, T[]>;
  }

  public onPresenceSync(callback: () => void): void {
    this.presenceSyncCallbacks.add(callback);
  }

  public onPresenceJoin(callback: (key: string, newPresences: any[]) => void): void {
    this.presenceJoinCallbacks.add(callback);
  }

  public onPresenceLeave(callback: (key: string, leftPresences: any[]) => void): void {
    this.presenceLeaveCallbacks.add(callback);
  }

  public async broadcast(event: string, payload: any): Promise<void> {
    const result = await this.rawChannel.send({
      type: 'broadcast',
      event,
      payload
    });
    if (result === 'error') {
      throw new Error(`[SupabaseRealtime] Failed to broadcast event "${event}" in room ${this.roomId}`);
    }
  }

  public onBroadcast(event: string, callback: (payload: any) => void): void {
    let callbacks = this.broadcastCallbacks.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.broadcastCallbacks.set(event, callbacks);

      // Register underlying Supabase broadcast handler for this event
      this.rawChannel.on('broadcast', { event }, (response: any) => {
        const payload = response?.payload !== undefined ? response.payload : response;
        const currentCbs = this.broadcastCallbacks.get(event);
        if (currentCbs) {
          currentCbs.forEach(cb => {
            try { cb(payload); } catch (err) { console.error(`[SupabaseRealtime] broadcast:${event} handler error`, err); }
          });
        }
      });
    }
    callbacks.add(callback);
  }

  public offBroadcast(event: string, callback?: (payload: any) => void): void {
    if (!callback) {
      this.broadcastCallbacks.delete(event);
    } else {
      const callbacks = this.broadcastCallbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.broadcastCallbacks.delete(event);
        }
      }
    }
  }
}

export class SupabaseRealtimeClient implements IRealtimeClient {
  private supabase: SupabaseClient;
  private channels: Map<string, SupabaseRealtimeChannel> = new Map();

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  public channel(roomId: string, clientId: string): IRealtimeChannel {
    const key = `${roomId}::${clientId}`;
    let ch = this.channels.get(key);
    if (!ch) {
      ch = new SupabaseRealtimeChannel(this.supabase, roomId, clientId);
      this.channels.set(key, ch);
    }
    return ch;
  }

  public async disconnect(): Promise<void> {
    for (const ch of this.channels.values()) {
      await ch.unsubscribe();
    }
    this.channels.clear();
    await this.supabase.removeAllChannels();
  }

  public isMock(): boolean {
    return false;
  }

  public getClientType(): 'supabase' | 'mock' {
    return 'supabase';
  }
}

// ============================================================================
// Mock Realtime Implementation (Native Browser BroadcastChannel)
// ============================================================================

interface MockEnvelope {
  type: 'broadcast' | 'presence_join' | 'presence_leave' | 'presence_query' | 'presence_reply';
  senderId: string;
  roomId: string;
  event?: string;
  payload?: any;
  key?: string;
  presences?: any[];
  timestamp: number;
}

export class MockRealtimeChannel implements IRealtimeChannel {
  private bc: BroadcastChannel | null = null;
  private storageKey: string;
  private presenceStateMap: Map<string, any[]> = new Map();
  private myPresence: Record<string, any> | null = null;
  private heartbeatTimer: any = null;

  private broadcastCallbacks: Map<string, Set<(payload: any) => void>> = new Map();
  private presenceSyncCallbacks: Set<() => void> = new Set();
  private presenceJoinCallbacks: Set<(key: string, newPresences: any[]) => void> = new Set();
  private presenceLeaveCallbacks: Set<(key: string, leftPresences: any[]) => void> = new Set();

  constructor(
    public readonly roomId: string,
    public readonly clientId: string
  ) {
    this.storageKey = `trungthu_mock_presence_${this.roomId}`;

    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(`trungthu_mock_channel_${this.roomId}`);
      this.bc.onmessage = this.handleMessage.bind(this);
    } else {
      console.warn('[MockRealtime] Native BroadcastChannel not available in this environment. Operating in single-window mode.');
    }
  }

  private handleUnload = (): void => {
    this.untrackPresenceSync();
  };

  private safeGetStorage(): Record<string, { payload: any; updatedAt: number }> {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const now = Date.now();
      let changed = false;
      // Stale presence pruning (> 60 seconds without heartbeat)
      for (const [key, val] of Object.entries(parsed) as [string, { payload: any; updatedAt: number }][]) {
        if (now - val.updatedAt > 60000) {
          delete parsed[key];
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(this.storageKey, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return {};
    }
  }

  private safeSetStorage(data: Record<string, { payload: any; updatedAt: number }>): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch {}
  }

  private postEnvelope(env: MockEnvelope): void {
    if (this.bc) {
      try {
        this.bc.postMessage(env);
      } catch (err) {
        console.error('[MockRealtime] postMessage error:', err);
      }
    }
  }

  private handleMessage(event: MessageEvent<MockEnvelope>): void {
    const env = event.data;
    if (!env || env.senderId === this.clientId || env.roomId !== this.roomId) return;

    switch (env.type) {
      case 'broadcast':
        if (env.event) {
          const callbacks = this.broadcastCallbacks.get(env.event);
          if (callbacks) {
            callbacks.forEach(cb => {
              try { cb(env.payload); } catch (e) { console.error(`[MockRealtime] broadcast:${env.event} error:`, e); }
            });
          }
        }
        break;

      case 'presence_join':
        if (env.key && env.presences) {
          this.presenceStateMap.set(env.key, env.presences);
          this.presenceJoinCallbacks.forEach(cb => {
            try { cb(env.key!, env.presences!); } catch (e) { console.error(e); }
          });
          this.notifyPresenceSync();
        }
        break;

      case 'presence_leave':
        if (env.key) {
          const left = this.presenceStateMap.get(env.key) ?? env.presences ?? [];
          this.presenceStateMap.delete(env.key);
          this.presenceLeaveCallbacks.forEach(cb => {
            try { cb(env.key!, left); } catch (e) { console.error(e); }
          });
          this.notifyPresenceSync();
        }
        break;

      case 'presence_query':
        if (this.myPresence) {
          this.postEnvelope({
            type: 'presence_reply',
            senderId: this.clientId,
            roomId: this.roomId,
            key: this.clientId,
            presences: [this.myPresence],
            timestamp: Date.now()
          });
        }
        break;

      case 'presence_reply':
        if (env.key && env.presences) {
          this.presenceStateMap.set(env.key, env.presences);
          this.presenceJoinCallbacks.forEach(cb => {
            try { cb(env.key!, env.presences!); } catch (e) { console.error(e); }
          });
          this.notifyPresenceSync();
        }
        break;
    }
  }

  private notifyPresenceSync(): void {
    this.presenceSyncCallbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error('[MockRealtime] onPresenceSync error:', e); }
    });
  }

  public subscribe(onStatus?: (status: ChannelStatus) => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleUnload);
      window.addEventListener('pagehide', this.handleUnload);
    }

    // Sync initial presence state from shared storage
    const storageData = this.safeGetStorage();
    this.presenceStateMap.clear();
    for (const [key, val] of Object.entries(storageData)) {
      this.presenceStateMap.set(key, [val.payload]);
    }

    // Query active peers over BroadcastChannel
    this.postEnvelope({
      type: 'presence_query',
      senderId: this.clientId,
      roomId: this.roomId,
      timestamp: Date.now()
    });

    // Start periodic heartbeat (every 2.5s)
    this.heartbeatTimer = setInterval(() => {
      if (this.myPresence) {
        const data = this.safeGetStorage();
        data[this.clientId] = { payload: this.myPresence, updatedAt: Date.now() };
        this.safeSetStorage(data);
      }
    }, 2500);

    // Asynchronously notify status SUBSCRIBED
    setTimeout(() => {
      if (onStatus) {
        onStatus('SUBSCRIBED');
      }
      this.notifyPresenceSync();
    }, 20);
  }

  public async unsubscribe(): Promise<void> {
    this.untrackPresenceSync();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleUnload);
      window.removeEventListener('pagehide', this.handleUnload);
    }

    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }

    this.broadcastCallbacks.clear();
    this.presenceSyncCallbacks.clear();
    this.presenceJoinCallbacks.clear();
    this.presenceLeaveCallbacks.clear();
  }

  private untrackPresenceSync(): void {
    if (!this.myPresence) return;

    const left = [this.myPresence];
    this.myPresence = null;

    const data = this.safeGetStorage();
    delete data[this.clientId];
    this.safeSetStorage(data);

    this.presenceStateMap.delete(this.clientId);

    this.postEnvelope({
      type: 'presence_leave',
      senderId: this.clientId,
      roomId: this.roomId,
      key: this.clientId,
      presences: left,
      timestamp: Date.now()
    });

    this.notifyPresenceSync();
  }

  public async trackPresence(payload: PlayerPresence | Record<string, any>): Promise<any> {
    this.myPresence = payload;

    const data = this.safeGetStorage();
    data[this.clientId] = { payload, updatedAt: Date.now() };
    this.safeSetStorage(data);

    this.presenceStateMap.set(this.clientId, [payload]);

    this.postEnvelope({
      type: 'presence_join',
      senderId: this.clientId,
      roomId: this.roomId,
      key: this.clientId,
      presences: [payload],
      timestamp: Date.now()
    });

    this.notifyPresenceSync();
    return 'ok';
  }

  public async untrackPresence(): Promise<any> {
    this.untrackPresenceSync();
    return 'ok';
  }

  public getPresenceState<T = any>(): Record<string, T[]> {
    // Re-sync with shared storage to ensure background tabs and cross-tab state are always current
    const storageData = this.safeGetStorage();
    for (const [key, val] of Object.entries(storageData)) {
      if (!this.presenceStateMap.has(key)) {
        this.presenceStateMap.set(key, [val.payload]);
      }
    }

    const result: Record<string, T[]> = {};
    for (const [key, val] of this.presenceStateMap.entries()) {
      result[key] = val as T[];
    }
    return result;
  }

  public onPresenceSync(callback: () => void): void {
    this.presenceSyncCallbacks.add(callback);
  }

  public onPresenceJoin(callback: (key: string, newPresences: any[]) => void): void {
    this.presenceJoinCallbacks.add(callback);
  }

  public onPresenceLeave(callback: (key: string, leftPresences: any[]) => void): void {
    this.presenceLeaveCallbacks.add(callback);
  }

  public async broadcast(event: string, payload: any): Promise<void> {
    this.postEnvelope({
      type: 'broadcast',
      senderId: this.clientId,
      roomId: this.roomId,
      event,
      payload,
      timestamp: Date.now()
    });
  }

  public onBroadcast(event: string, callback: (payload: any) => void): void {
    let callbacks = this.broadcastCallbacks.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.broadcastCallbacks.set(event, callbacks);
    }
    callbacks.add(callback);
  }

  public offBroadcast(event: string, callback?: (payload: any) => void): void {
    if (!callback) {
      this.broadcastCallbacks.delete(event);
    } else {
      const callbacks = this.broadcastCallbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.broadcastCallbacks.delete(event);
        }
      }
    }
  }
}

export class MockRealtimeClient implements IRealtimeClient {
  private channels: Map<string, MockRealtimeChannel> = new Map();

  public channel(roomId: string, clientId: string): IRealtimeChannel {
    const key = `${roomId}::${clientId}`;
    let ch = this.channels.get(key);
    if (!ch) {
      ch = new MockRealtimeChannel(roomId, clientId);
      this.channels.set(key, ch);
    }
    return ch;
  }

  public async disconnect(): Promise<void> {
    for (const ch of this.channels.values()) {
      await ch.unsubscribe();
    }
    this.channels.clear();
  }

  public isMock(): boolean {
    return true;
  }

  public getClientType(): 'supabase' | 'mock' {
    return 'mock';
  }
}

// ============================================================================
// Auto-Detection & Factory Function
// ============================================================================

/**
 * Validates whether Supabase environment variables are present, non-empty,
 * and not default placeholder templates.
 */
export function isSupabaseConfigured(url?: string, anonKey?: string): boolean {
  if (!url || !anonKey) return false;
  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();
  if (trimmedUrl === '' || trimmedKey === '') return false;

  // Filter unreplaced placeholder strings
  if (
    trimmedUrl.includes('your-project') ||
    trimmedUrl.includes('example.com') ||
    trimmedUrl === 'https://your-project.supabase.co'
  ) {
    return false;
  }
  if (
    trimmedKey.includes('your-anon-key') ||
    trimmedKey.includes('placeholder') ||
    trimmedKey.length < 20
  ) {
    return false;
  }

  // Validate URL protocol
  try {
    const parsed = new URL(trimmedUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Creates an IRealtimeClient instance.
 * Automatically chooses SupabaseRealtimeClient if credentials are valid,
 * otherwise falls back seamlessly to MockRealtimeClient.
 */
export function createRealtimeClient(config?: Partial<RealtimeClientConfig>): IRealtimeClient {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const forceMock = config?.useMock ?? (urlParams?.get('mock') === 'true');

  const supabaseUrl = config?.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = config?.supabaseAnonKey ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  const hasValidSupabase = !forceMock && isSupabaseConfigured(supabaseUrl, supabaseAnonKey);

  if (hasValidSupabase && supabaseUrl && supabaseAnonKey) {
    try {
      console.log('[RealtimeClient] Initializing SupabaseRealtimeClient (Supabase Realtime v2 WebSocket)...');
      return new SupabaseRealtimeClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('[RealtimeClient] Failed to initialize SupabaseRealtimeClient, falling back to MockRealtimeClient:', err);
      return new MockRealtimeClient();
    }
  } else {
    const reason = forceMock ? 'forced by mock flag' : 'credentials missing or placeholder';
    console.log(`[RealtimeClient] Initializing MockRealtimeClient (Native BroadcastChannel fallback - ${reason}).`);
    return new MockRealtimeClient();
  }
}
