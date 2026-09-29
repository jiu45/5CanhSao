import type { ScoreMood } from './FestivalScore';

// Locally hosted licensed recordings. Keep the original score for intimate and
// transitional beats, so full-length tracks never drown out the story.
const TRACKS: Partial<Record<ScoreMood, string>> = {
  village: '/assets/music/hue-bamboo-flute.mp3',
  festival: '/assets/music/vietnamese-happy-melodies.mp3',
  together: '/assets/music/vietnamese-happy-melodies.mp3',
  crowded: '/assets/music/vietnamese-happy-melodies.mp3',
  plaza: '/assets/music/vietnamese-festival-vibe.mp3',
  release: '/assets/music/vietnamese-festival-vibe.mp3'
};

export class RecordedMusic {
  private audio = new Audio();
  private desired: string | null = null;
  private fadeTimer: number | null = null;
  private muted = false;
  private paused = false;
  private generation = 0;

  constructor(private readonly onPlaybackChange: (playing: boolean) => void) {
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = 0;
    this.audio.addEventListener('playing', () => this.onPlaybackChange(true));
    this.audio.addEventListener('pause', () => this.onPlaybackChange(false));
    this.audio.addEventListener('error', () => this.onPlaybackChange(false));
    window.addEventListener('pointerdown', () => this.tryPlay(), { passive: true });
    window.addEventListener('keydown', () => this.tryPlay(), { passive: true });
  }

  setMood(mood: ScoreMood): void {
    const next = TRACKS[mood] ?? null;
    if (next === this.desired) return;
    this.desired = next;
    const generation = ++this.generation;
    this.fadeTo(0, 350, () => {
      if (generation !== this.generation) return;
      this.audio.pause();
      if (!next) return;
      if (this.audio.getAttribute('src') !== next) {
        this.audio.src = next;
        this.audio.load();
      }
      this.audio.currentTime = 0;
      this.tryPlay();
    });
  }

  tryPlay(): void {
    if (!this.desired || this.muted || this.paused || !this.audio.paused ||
        this.audio.getAttribute('src') !== this.desired) return;
    void this.audio.play().then(() => this.fadeTo(0.25, 650)).catch(() => {
      // Browser autoplay protection: retry on the next player gesture.
      this.onPlaybackChange(false);
    });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.audio.pause();
      this.audio.volume = 0;
    } else this.tryPlay();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.audio.pause();
    else this.tryPlay();
  }

  stop(): void {
    this.desired = null;
    ++this.generation;
    this.clearFade();
    this.audio.pause();
    this.audio.volume = 0;
  }

  private fadeTo(target: number, duration: number, complete?: () => void): void {
    this.clearFade();
    const start = performance.now();
    const from = this.audio.volume;
    this.fadeTimer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / duration);
      this.audio.volume = from + (target - from) * t;
      if (t >= 1) {
        this.clearFade();
        complete?.();
      }
    }, 32);
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }
}
