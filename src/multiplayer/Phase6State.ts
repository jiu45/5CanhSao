import type { PlayerRole } from './NetworkState';

export type Phase6Stage =
  | 'PHASE6_ENTER_PROMENADE' | 'ELDER_PUZZLE' | 'ELDER_PUZZLE_RESOLVED'
  | 'CROWD_ESCALATION' | 'SEPARATION_STARTED' | 'SEPARATED'
  | 'GATE_DISCOVERED' | 'MOON_GUARDIAN' | 'MEMORY_PUZZLE'
  | 'MEMORY_PUZZLE_RESOLVED' | 'REUNION_ROUTE' | 'PLAYERS_REUNITED'
  | 'INNER_GATE_READY' | 'PHASE6_COMPLETE';

export interface Phase6SharedState {
  revision: number;
  stage: Phase6Stage;
  elderAnswers: Record<PlayerRole, string | null>;
  elderResolved: boolean;
  elderFeedback: string | null;
  separated: boolean;
  splitArrivals: Record<PlayerRole, boolean>;
  gateDiscovered: boolean;
  memoryRound: number;
  memorySelections: Record<PlayerRole, string | null>;
  memoryFeedback: string | null;
  memorySolved: boolean;
  rejoinArrivals: Record<PlayerRole, boolean>;
  reunited: boolean;
  gatePlayersReady: Record<PlayerRole, boolean>;
  gateReady: boolean;
  gateOpening: boolean;
}

export const PHASE6_AUDIO_CUES = {
  elderEnter: 'ELDER_SCENE_ENTER', elderSuccess: 'ELDER_PUZZLE_SUCCESS',
  crowdBuildup: 'CROWD_BUILDUP', separation: 'SEPARATION',
  memoryStart: 'MEMORY_PUZZLE_START', memorySuccess: 'MEMORY_PUZZLE_SUCCESS',
  reunion: 'REUNION', gateReady: 'INNER_GATE_READY'
} as const;

export function initialPhase6State(): Phase6SharedState {
  return {
    revision: 0, stage: 'PHASE6_ENTER_PROMENADE',
    elderAnswers: { host: null, guest: null }, elderResolved: false, elderFeedback: null,
    separated: false, splitArrivals: { host: false, guest: false }, gateDiscovered: false,
    memoryRound: 0, memorySelections: { host: null, guest: null },
    memoryFeedback: null, memorySolved: false,
    rejoinArrivals: { host: false, guest: false }, reunited: false,
    gatePlayersReady: { host: false, guest: false }, gateReady: false,
    gateOpening: false
  };
}

/** Host-owned shared story decisions. UI and Three.js objects never enter this state. */
export class Phase6StateController {
  public state: Phase6SharedState;

  constructor(saved?: Phase6SharedState) {
    this.state = saved && Number.isInteger(saved.revision) ? saved : initialPhase6State();
  }

  private changed(): void { this.state.revision++; }

  public applySnapshot(next: Phase6SharedState): boolean {
    if (!next || !Number.isInteger(next.revision) || next.revision < this.state.revision) return false;
    this.state = structuredClone(next);
    return true;
  }

  public enterElder(): boolean {
    if (this.state.stage !== 'PHASE6_ENTER_PROMENADE') return false;
    this.state.stage = 'ELDER_PUZZLE'; this.changed(); return true;
  }

  public answerElder(role: PlayerRole, answer: string): boolean {
    if (this.state.stage !== 'ELDER_PUZZLE' || !['moon', 'lantern', 'drum', 'feast'].includes(answer)) return false;
    if (this.state.elderAnswers[role] === answer) return false;
    this.state.elderAnswers[role] = answer;
    const { host, guest } = this.state.elderAnswers;
    if (host && guest) {
      if (host === 'moon' && guest === 'moon') {
        this.state.elderResolved = true;
        this.state.stage = 'CROWD_ESCALATION';
        this.state.elderFeedback = null;
      } else {
        this.state.elderFeedback = 'Ông mỉm cười: Hãy cùng nghĩ về điều ở trên cao.';
        this.state.elderAnswers = { host: null, guest: null };
      }
    }
    this.changed(); return true;
  }

  public separate(): boolean {
    if (this.state.stage !== 'CROWD_ESCALATION') return false;
    this.state.stage = 'SEPARATED'; this.state.separated = true;
    this.changed(); return true;
  }

  public arriveAtSplitEnd(role: PlayerRole): boolean {
    if (!this.state.separated || this.state.splitArrivals[role]) return false;
    this.state.splitArrivals[role] = true;
    if (role === 'host') this.state.gateDiscovered = true;
    if (this.state.splitArrivals.host && this.state.splitArrivals.guest) {
      this.state.stage = 'MEMORY_PUZZLE';
    } else {
      this.state.stage = role === 'host' ? 'GATE_DISCOVERED' : 'MOON_GUARDIAN';
    }
    this.changed(); return true;
  }

  public selectMemory(role: PlayerRole, cardId: string, targetCardId: string): boolean {
    if (this.state.stage !== 'MEMORY_PUZZLE' || this.state.memorySolved) return false;
    const chooser: PlayerRole = this.state.memoryRound === 0 ? 'guest' : 'host';
    if (role !== chooser || this.state.memorySelections[role] === cardId) return false;
    this.state.memorySelections[role] = cardId;
    if (cardId === targetCardId) {
      this.state.memoryFeedback = null;
      if (this.state.memoryRound === 0) {
        this.state.memoryRound = 1;
        this.state.memorySelections = { host: null, guest: null };
      } else {
        this.state.memoryRound = 2;
        this.state.memorySolved = true;
        this.state.stage = 'REUNION_ROUTE';
      }
    } else {
      this.state.memoryFeedback = 'Chưa phải ký ức ấy. Hãy kể thêm cho nhau nghe.';
      this.state.memorySelections[role] = null;
    }
    this.changed(); return true;
  }

  public arriveAtReunion(role: PlayerRole): boolean {
    if (!this.state.memorySolved || this.state.rejoinArrivals[role]) return false;
    this.state.rejoinArrivals[role] = true;
    if (this.state.rejoinArrivals.host && this.state.rejoinArrivals.guest) {
      this.state.reunited = true;
      this.state.separated = false;
      this.state.stage = 'PLAYERS_REUNITED';
    }
    this.changed(); return true;
  }

  public arriveAtGate(role: PlayerRole): boolean {
    if (!this.state.reunited || this.state.gatePlayersReady[role]) return false;
    this.state.gatePlayersReady[role] = true;
    if (this.state.gatePlayersReady.host && this.state.gatePlayersReady.guest) {
      this.state.gateReady = true;
      this.state.gateOpening = true; // Only the first glow, never a Phase 7 reveal.
      this.state.stage = 'PHASE6_COMPLETE';
    }
    this.changed(); return true;
  }
}
