/** Original, quiet leitmotifs for the illustrated Mid-Autumn journey.
 * No recording or melody from an existing song is embedded here. */
export type ScoreMood = 'memory' | 'craft' | 'village' | 'festival' | 'moon'
  | 'present' | 'together' | 'crowded' | 'lost' | 'hope' | 'reunion'
  | 'gate' | 'plaza' | 'letter' | 'release';

type Voice = 'pluck' | 'flute' | 'bell';
type Note = [frequency: number, at: number, duration: number, voice: Voice, pan?: number];

const P = {
  D4: 293.66, F4: 349.23, G4: 392, A4: 440, C5: 523.25,
  D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880, C6: 1046.5
};

// The first four notes keep their contour as the instruments and harmony change.
const memory: Note[] = [
  [P.D5, 0, 1.1, 'pluck'], [P.A4, 1.55, 1, 'pluck'],
  [P.C5, 3.2, 1.25, 'flute'], [P.G4, 5.4, 1.2, 'pluck']
];
const answering: Note[] = [
  [P.D5, 0.2, .8, 'pluck', -.36], [P.A4, 1.1, .8, 'pluck', -.36],
  [P.C5, 2.4, 1.1, 'flute', -.36], [P.G4, 3.7, .8, 'pluck', -.36],
  [P.A4, 4.1, .7, 'bell', .38], [P.C5, 5.0, .7, 'bell', .38],
  [P.D5, 5.9, 1.3, 'bell', .38]
];

const phrases: Record<ScoreMood, { notes: Note[]; level: number; cutoff: number; drums?: number[] }> = {
  memory: { notes: memory, level: .65, cutoff: 3300 },
  craft: { notes: [
    [P.D4, 0, .8, 'pluck'], [P.F4, 1.4, .9, 'pluck'],
    [P.A4, 3.6, 1.3, 'flute'], [P.G4, 5.5, .8, 'pluck']
  ], level: .52, cutoff: 2800 },
  village: { notes: [
    [P.D5, 0, 1.2, 'flute'], [P.F5, 1.3, .8, 'flute'],
    [P.G5, 2.5, .8, 'flute'], [P.A5, 3.7, 1, 'flute'],
    [P.G5, 5.1, .7, 'flute'], [P.D5, 6.0, 1, 'flute']
  ], level: .52, cutoff: 3400 },
  festival: { notes: [
    [P.D5, .2, .6, 'pluck'], [P.F5, 1.0, .6, 'flute'],
    [P.A5, 1.9, .8, 'flute'], [P.G5, 3.1, .5, 'pluck'],
    [P.F5, 4.1, .7, 'flute'], [P.D5, 5.3, 1, 'flute']
  ], level: .58, cutoff: 4800, drums: [0, 1.7, 3.6, 5.5] },
  moon: { notes: [
    [P.D5, .4, 2.4, 'flute'], [P.A4, 3.1, 2.2, 'flute'],
    [P.C5, 5.9, 1.4, 'bell']
  ], level: .44, cutoff: 3300 },
  present: { notes: memory.map(([f, t, d]) => [f, t, d, 'bell'] as Note),
    level: .56, cutoff: 5000 },
  together: { notes: answering, level: .59, cutoff: 4800 },
  crowded: { notes: [
    [P.D5, .2, .7, 'pluck'], [P.F5, 2.1, .6, 'flute'],
    [P.A4, 4.3, .8, 'pluck']
  ], level: .44, cutoff: 3000, drums: [0, .82, 1.65, 3.2, 4.05, 5.6] },
  lost: { notes: [
    [P.D5, .4, 1.6, 'flute'], [P.C5, 3.0, 1.3, 'pluck'],
    [P.A4, 5.7, 1.5, 'flute']
  ], level: .46, cutoff: 1300 },
  hope: { notes: [
    [P.A4, 0, 1, 'pluck'], [P.C5, 1.9, .9, 'flute'],
    [P.D5, 3.5, 1, 'flute'], [P.F5, 5.3, 1.5, 'bell']
  ], level: .54, cutoff: 3600 },
  reunion: { notes: answering, level: .68, cutoff: 5100 },
  gate: { notes: [
    [P.D4, 0, 1.2, 'pluck'], [P.A4, 1.6, 1, 'flute'],
    [P.C5, 3.2, 1, 'bell'], [P.D5, 5.2, 1.5, 'bell']
  ], level: .5, cutoff: 4100 },
  plaza: { notes: answering, level: .63, cutoff: 5700,
    drums: [0, 1.8, 3.6, 5.4] },
  letter: { notes: [
    [P.D4, .4, 2.1, 'flute'], [P.A4, 3.8, 1.8, 'pluck']
  ], level: .3, cutoff: 2800 },
  release: { notes: answering, level: .72, cutoff: 6300,
    drums: [0, .9, 1.8, 3.6, 4.5, 5.4] }
};

export class FestivalScore {
  private mood: ScoreMood | null = null;
  private bus: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: number | null = null;
  private paused = false;

  constructor(private readonly ctx: AudioContext) {}

  get currentMood(): ScoreMood | null { return this.mood; }

  setMood(mood: ScoreMood): void {
    if (this.mood === mood) return;
    this.stop();
    this.mood = mood;
    const settings = phrases[mood];
    const bus = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = settings.cutoff;
    bus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    bus.gain.setTargetAtTime(this.paused ? .0001 : settings.level,
      this.ctx.currentTime, .8);
    bus.connect(filter); filter.connect(this.ctx.destination);
    this.bus = bus; this.filter = filter;
    this.pulse();
    this.timer = window.setInterval(() => this.pulse(), 7800);
  }

  pulse(): void {
    if (!this.mood || !this.bus || this.paused || this.ctx.state !== 'running') return;
    const settings = phrases[this.mood];
    const start = this.ctx.currentTime + .08;
    for (const [frequency, at, duration, voice, pan] of settings.notes) {
      this.note(frequency, start + at, duration, voice, pan ?? 0);
    }
    for (const at of settings.drums ?? []) this.drum(start + at);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (!this.bus || !this.mood) return;
    this.bus.gain.setTargetAtTime(paused ? .0001 : phrases[this.mood].level,
      this.ctx.currentTime, paused ? .12 : .5);
    if (!paused) this.pulse();
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    if (this.bus) {
      const retired = this.bus;
      retired.gain.setTargetAtTime(.0001, this.ctx.currentTime, .2);
      window.setTimeout(() => retired.disconnect(), 1800);
    }
    this.bus = null; this.filter = null; this.mood = null;
  }

  private note(frequency: number, at: number, duration: number, voice: Voice, pan: number): void {
    if (!this.bus) return;
    const oscillator = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    const tone = this.ctx.createBiquadFilter();
    const stereo = this.ctx.createStereoPanner();
    stereo.pan.value = pan;
    oscillator.type = voice === 'bell' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, at);
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(voice === 'flute' ? frequency * 2.4 :
      voice === 'pluck' ? 3500 : frequency * 3.2, at);
    if (voice === 'pluck') tone.frequency.exponentialRampToValueAtTime(650, at + duration);
    const peak = voice === 'flute' ? .028 : voice === 'bell' ? .035 : .038;
    const attack = voice === 'flute' ? .19 : .025;
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(peak, at + attack);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(tone); tone.connect(envelope); envelope.connect(stereo);
    stereo.connect(this.bus);
    oscillator.start(at); oscillator.stop(at + duration + .03);
    oscillator.onended = () => { oscillator.disconnect(); tone.disconnect();
      envelope.disconnect(); stereo.disconnect(); };
  }

  private drum(at: number): void {
    if (!this.bus) return;
    const skin = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    skin.type = 'sine';
    skin.frequency.setValueAtTime(135, at);
    skin.frequency.exponentialRampToValueAtTime(58, at + .16);
    envelope.gain.setValueAtTime(.045, at);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + .22);
    skin.connect(envelope); envelope.connect(this.bus);
    skin.start(at); skin.stop(at + .23);
    skin.onended = () => { skin.disconnect(); envelope.disconnect(); };
  }
}
