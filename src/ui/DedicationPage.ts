import { audioManager } from '../audio/AudioManager';

/** A brief dedication before the Moon opening; its clock runs only while this tab is in focus. */
export class DedicationPage {
  private readonly root: HTMLElement;
  private readonly line: HTMLElement;
  private readonly name: HTMLElement;
  private onOpen: (() => void) | null = null;
  private frame = 0;
  private lastFrame = 0;
  private activeMs = 0;
  private wasFocused = false;
  private cueStarted = false;
  private moonStarted = false;
  private destroyed = false;

  constructor() {
    this.root = document.createElement('section');
    this.root.className = 'dedication-page';
    this.root.setAttribute('aria-label', 'Dành tặng maiixinh');
    this.root.innerHTML = `<div class="dedication-splash">
      <p class="dedication-splash-line">Dành tặng</p>
      <p class="dedication-splash-name">maiixinh</p>
    </div>`;
    this.line = this.root.querySelector('.dedication-splash-line')!;
    this.name = this.root.querySelector('.dedication-splash-name')!;
    document.body.appendChild(this.root);
    this.root.addEventListener('pointerdown', () => {
      // An early tap may satisfy browser autoplay policy before the words appear.
      void audioManager.unlockForOpening().then(() => this.tryCue());
    });
  }

  public show(onOpen: () => void): void {
    this.onOpen = onOpen;
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (stamp: number): void => {
    if (this.destroyed) return;
    const focused = document.visibilityState === 'visible' && document.hasFocus();
    if (!focused) {
      if (this.wasFocused && !this.moonStarted) this.restart();
      this.wasFocused = false;
      this.lastFrame = stamp;
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    if (!this.wasFocused) this.lastFrame = stamp;
    this.wasFocused = true;
    this.activeMs += Math.min(stamp - this.lastFrame, 100);
    this.lastFrame = stamp;

    if (this.activeMs >= 850 && !this.line.classList.contains('visible') &&
        !this.line.classList.contains('finished')) {
      this.line.classList.add('visible');
      this.tryCue();
    }
    if (this.activeMs >= 2200) {
      this.line.classList.remove('visible');
      this.line.classList.add('finished');
    }
    if (this.activeMs >= 2650 && this.activeMs < 5200) this.name.classList.add('visible');
    if (this.activeMs >= 5200) this.name.classList.remove('visible');
    if (this.activeMs >= 5650) this.root.classList.add('leaving');
    if (this.activeMs >= 6350 && !this.moonStarted) {
      this.moonStarted = true;
      this.onOpen?.();
      this.destroy();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private tryCue(): void {
    if (this.cueStarted || this.destroyed || this.activeMs < 800 || this.activeMs > 4200 ||
        document.visibilityState !== 'visible' || !document.hasFocus()) return;
    void audioManager.unlockForOpening().then(ready => {
      if (!ready || this.cueStarted || this.destroyed || this.activeMs > 4200 ||
          document.visibilityState !== 'visible' || !document.hasFocus()) return;
      this.cueStarted = audioManager.playDedicationCue();
    });
  }

  private restart(): void {
    this.activeMs = 0;
    this.cueStarted = false;
    audioManager.stopDedicationCue();
    this.root.classList.add('instant');
    this.root.classList.remove('leaving');
    this.line.classList.remove('visible', 'finished');
    this.name.classList.remove('visible');
    requestAnimationFrame(() => this.root.classList.remove('instant'));
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    audioManager.stopDedicationCue();
    this.onOpen = null;
    this.root.remove();
  }
}
