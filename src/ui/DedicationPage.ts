import { audioManager } from '../audio/AudioManager';

/** A brief dedication before the Moon opening; its clock runs only while this tab is in focus. */
export class DedicationPage {
  private readonly root: HTMLElement;
  private readonly line: HTMLElement;
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
    this.root.innerHTML = `<svg class="dedication-art" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="dedication-moon-glow"><stop stop-color="#f7dfaa" stop-opacity=".28"/><stop offset="1" stop-color="#f7dfaa" stop-opacity="0"/></radialGradient>
        <linearGradient id="dedication-paper-sky" x2="0" y2="1"><stop stop-color="#0b1e33"/><stop offset="1" stop-color="#071221"/></linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#dedication-paper-sky)"/>
      <circle cx="640" cy="211" r="177" fill="url(#dedication-moon-glow)"/>
      <circle cx="640" cy="211" r="65" fill="#f2e9d1" opacity=".87"/>
      <path d="M0 567 Q138 534 266 558 Q383 530 515 554 Q648 526 773 553 Q916 521 1049 557 Q1157 531 1280 563 V720 H0Z" fill="#10263b"/>
      <path d="M0 621 Q175 574 348 602 Q508 576 640 600 Q785 570 930 606 Q1095 573 1280 619 V720 H0Z" fill="#0a1d30"/>
      <path d="M0 667 Q214 612 417 647 Q622 608 826 650 Q1052 611 1280 660 V720 H0Z" fill="#061522"/>
      <g fill="none" stroke="#315267" stroke-linecap="round" opacity=".59">
        <path d="M42 0 Q106 223 41 573 M145 0 Q205 159 155 482 M1231 0 Q1163 211 1239 577 M1132 0 Q1081 178 1131 483" stroke-width="13"/>
        <path d="M58 182 l88 -64 M77 293 l124 -85 M1225 171 l-103 -72 M1207 302 l-115 -88" stroke-width="7"/>
      </g>
      <g fill="#426c78" opacity=".62">
        <path d="M60 179 l-32 -31 48 16 M116 139 l45 -38 -19 44 M78 286 l-40 -34 56 17 M163 234 l51 -40 -20 48"/>
        <path d="M1221 168 l33 -35 -48 20 M1157 120 l-42 -38 17 45 M1201 298 l40 -32 -55 14 M1126 235 l-51 -39 19 47"/>
      </g>
      <path d="M0 94 Q322 157 455 125 M825 125 Q986 159 1280 95" fill="none" stroke="#ac8765" stroke-width="2" opacity=".7"/>
      <g stroke="#cba879" stroke-width="2" opacity=".82">
        <path d="M195 128 v44 M337 135 v49 M1083 126 v46 M940 134 v48"/>
      </g>
      <g fill="#e4a562" stroke="#f0c887" stroke-width="2" opacity=".9">
        <path d="M195 173 l8 14 16 4 -13 11 2 17 -13 -8 -14 8 3 -17 -13 -11 16 -4Z"/>
        <path d="M1083 173 l8 14 16 4 -13 11 2 17 -13 -8 -14 8 3 -17 -13 -11 16 -4Z"/>
        <path d="M337 185 q-17 1 -17 18 q0 19 17 27 q17 -8 17 -27 q0 -17 -17 -18Z M940 183 q-17 1 -17 18 q0 19 17 27 q17 -8 17 -27 q0 -17 -17 -18Z"/>
      </g>
      <circle cx="195" cy="197" r="24" fill="#f3b972" opacity=".12"/><circle cx="1083" cy="197" r="24" fill="#f3b972" opacity=".12"/>
      <circle cx="337" cy="207" r="22" fill="#f3b972" opacity=".1"/><circle cx="940" cy="205" r="22" fill="#f3b972" opacity=".1"/>
    </svg>
    <svg class="dedication-art dedication-art-mobile" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="390" height="844" fill="#091a2c"/>
      <circle cx="195" cy="278" r="113" fill="#ddbd87" opacity=".075"/>
      <circle cx="195" cy="278" r="57" fill="#f2e9d1" opacity=".87"/>
      <path d="M0 163 Q195 189 390 162" fill="none" stroke="#a58564" stroke-width="2" opacity=".7"/>
      <path d="M62 169 v46 M327 169 v46" stroke="#cba879" stroke-width="2"/>
      <path d="M62 216 l7 13 15 4 -12 10 2 16 -12 -8 -13 8 3 -16 -12 -10 15 -4Z M327 216 l7 13 15 4 -12 10 2 16 -12 -8 -13 8 3 -16 -12 -10 15 -4Z" fill="#dc9d5f" stroke="#efc687" stroke-width="2"/>
      <circle cx="62" cy="237" r="27" fill="#efad65" opacity=".11"/><circle cx="327" cy="237" r="27" fill="#efad65" opacity=".11"/>
      <path d="M0 604 Q97 575 195 607 Q293 577 390 609 V844 H0Z" fill="#10263b"/>
      <path d="M0 680 Q105 634 195 675 Q289 638 390 680 V844 H0Z" fill="#071726"/>
      <g fill="none" stroke="#28485f" stroke-linecap="round" opacity=".62">
        <path d="M12 0 Q55 240 6 600 M45 0 Q86 176 45 411 M376 0 Q334 242 385 605 M344 0 Q309 174 345 414" stroke-width="9"/>
        <path d="M27 99 l63 -51 M31 338 l79 -64 M367 104 l-65 -55 M359 340 l-79 -64" stroke-width="5"/>
      </g>
    </svg>
    <div class="dedication-splash">
      <p class="dedication-splash-line">Dành tặng <span>maiixinh</span></p>
    </div>`;
    this.line = this.root.querySelector('.dedication-splash-line')!;
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

    if (this.activeMs >= 850 && this.activeMs < 5200 &&
        !this.line.classList.contains('visible')) {
      this.line.classList.add('visible');
      this.root.classList.add('art-visible');
      this.tryCue();
    }
    if (this.activeMs >= 5200) this.line.classList.remove('visible');
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
    this.root.classList.remove('art-visible');
    this.line.classList.remove('visible');
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
