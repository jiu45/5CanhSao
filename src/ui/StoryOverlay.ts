import { audioManager } from '../audio/AudioManager';

export class StoryOverlay {
  private container: HTMLDivElement;
  private subtitleEl: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private promptBtn: HTMLButtonElement;
  private audioBtn: HTMLButtonElement;
  private subtitleTimer: number | null = null;
  private revealTimer: number | null = null;
  private visibleUntil = 0;
  private pendingSubtitle: { text: string; durationMs: number; priority: boolean } | null = null;
  private activePriority = false;
  public onStartRequested?: () => void;
  public onNextRequested?: () => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'story-overlay-container';

    this.container.innerHTML = `
      <div class="letterbox top"></div>
      <div class="letterbox bottom"></div>
      <div class="film-grain-overlay"></div>
      <div class="sepia-vignette"></div>
      <svg class="opening-frame" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="opening-present">
          <path d="M0 557 H56 V466 L123 435 L201 467 V545 H343 V720 H0Z M1280 720 H925 V553 H1024 V474 L1127 430 L1234 480 V541 H1280Z" fill="#122b3d" opacity=".7"/>
          <path d="M16 467 L121 426 L217 467 M1010 474 L1127 421 L1250 479" fill="none" stroke="#36556a" stroke-width="5" opacity=".7"/>
          <path d="M0 478 H92 V411 H192 V497 H274 V720 H0Z M1280 720 H1000 V483 H1081 V407 H1179 V461 H1280Z" fill="#0b1d2e"/>
          <path d="M0 478 L87 453 L192 478 M1000 483 L1082 455 L1180 462" fill="none" stroke="#44637a" stroke-width="3" opacity=".7"/>
          <path d="M0 476 H274 M1000 483 H1280" stroke="#38546b" stroke-width="5"/>
          <path d="M35 520 h17 v23 h-17z M80 520 h17 v23 H80z M126 520 h17 v23 h-17z M180 549 h17 v23 h-17z M1060 516 h17 v23 h-17z M1110 515 h17 v23 h-17z M1160 536 h17 v23 h-17z M1215 525 h17 v23 h-17z" fill="#d7a86c" opacity=".56"/>
          <path d="M24 586 h23 v3 H24z M64 586 h23 v3 H64z M105 586 h23 v3 H105z M1052 582 h24 v3 h-24z M1095 582 h24 v3 h-24z M1138 582 h24 v3 h-24z" fill="#7091a4" opacity=".42"/>
          <path d="M294 720 V438 Q294 424 309 424 H342 M986 720 V443 Q986 429 972 429 H942" fill="none" stroke="#192e3d" stroke-width="9"/>
          <path d="M342 424 V459 M942 429 V468" fill="none" stroke="#a87b53" stroke-width="2" opacity=".7"/>
          <path d="M342 458 l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z M942 467 l5 10 11 2-8 8 2 11-10-6-10 6 2-11-8-8 11-2z" fill="#e7b36e" stroke="#ffe5a7" stroke-width="2" opacity=".9"/>
          <path d="M0 671 Q155 622 291 648 M1280 671 Q1135 619 987 648" fill="none" stroke="#cf965e" stroke-opacity=".35" stroke-width="3"/>
        </g>
        <g class="opening-past">
        <path d="M0 597 Q95 564 190 581 L287 607 L287 720 H0Z M993 603 Q1115 563 1280 604 V720 H993Z" fill="#071b29"/>
        <path d="M0 596 L104 570 L191 527 L290 597 M990 596 L1086 551 L1187 526 L1280 589" fill="none" stroke="#426070" stroke-width="7"/>
        <path d="M0 611 H290 M990 605 H1280" stroke="#6c554a" stroke-width="13"/>
        <path d="M45 -20 Q115 209 32 631 M137 -20 Q173 151 121 475 M1238 -20 Q1155 238 1235 638 M1135 -20 Q1095 166 1152 484" fill="none" stroke="#08202c" stroke-width="18"/>
        <path d="M45 211 L170 150 M86 343 L217 276 M1235 198 L1108 130 M1187 346 L1055 267" fill="none" stroke="#17394a" stroke-width="9"/>
        <path d="M43 214 l-52 -31 41 51 M134 315 l80 -50 -67 68 M1235 201 l56 -35 -36 57 M1141 325 l-74 -47 58 70" fill="#25526a"/>
        <path d="M0 690 Q138 636 284 648 M1280 690 Q1127 630 988 648" fill="none" stroke="#9f7b58" stroke-opacity=".3" stroke-width="3"/>
        </g>
      </svg>
      
      <div class="cinematic-title-box">
        <h1 class="cinematic-main-title"></h1>
        <p class="cinematic-sub-title"></p>
      </div>

      <div class="cinematic-subtitle-box">
        <p class="cinematic-subtitle-text"></p>
      </div>

      <div class="cinematic-action-box">
        <button class="cinematic-btn primary-btn" style="display:none;"></button>
      </div>

      <button class="audio-toggle-btn" title="Bật/Tắt âm thanh">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(this.container);

    this.titleEl = this.container.querySelector('.cinematic-main-title')!;
    this.subtitleEl = this.container.querySelector('.cinematic-subtitle-text')!;
    this.promptBtn = this.container.querySelector('.cinematic-btn')!;
    this.audioBtn = this.container.querySelector('.audio-toggle-btn')!;
    this.audioBtn.setAttribute('aria-label', 'Tắt âm thanh');
    this.audioBtn.setAttribute('aria-pressed', 'false');
    this.audioBtn.addEventListener('click', () => {
      audioManager.setMuted(!audioManager.muted);
      const muted = audioManager.muted;
      this.audioBtn.setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh');
      this.audioBtn.setAttribute('aria-pressed', String(muted));
      this.audioBtn.title = muted ? 'Bật âm thanh' : 'Tắt âm thanh';
      this.audioBtn.classList.toggle('muted', muted);
    });

    this.promptBtn.addEventListener('click', () => {
      if (this.onStartRequested) {
        const cb = this.onStartRequested;
        this.onStartRequested = undefined;
        cb();
      } else if (this.onNextRequested) {
        const cb = this.onNextRequested;
        this.onNextRequested = undefined;
        cb();
      }
    });
  }

  public showStartScreen(mainTitle: string, subTitle: string, buttonText: string, onStart: () => void) {
    this.onStartRequested = onStart;
    this.titleEl.textContent = mainTitle;
    const sub = this.container.querySelector('.cinematic-sub-title') as HTMLElement;
    sub.textContent = subTitle;
    this.promptBtn.textContent = buttonText;
    this.promptBtn.style.display = 'inline-block';
    
    const titleBox = this.container.querySelector('.cinematic-title-box') as HTMLElement;
    titleBox.classList.add('visible');
  }

  public hideStartScreen() {
    const titleBox = this.container.querySelector('.cinematic-title-box') as HTMLElement;
    titleBox.classList.remove('visible');
    this.promptBtn.style.display = 'none';
  }

  public setSubtitle(text: string, durationMs: number = 4000, priority = false,
    placement: 'default' | 'top' = 'default') {
    if (this.subtitleEl.textContent === text && this.subtitleEl.style.opacity === '1') return;
    const now = performance.now();
    // An urgent, actionable line must not vanish under the next location trigger.
    // Ordinary atmosphere lines may be superseded when a player walks quickly.
    if (!priority && this.activePriority && now < this.visibleUntil) {
      this.pendingSubtitle = { text, durationMs, priority };
      return;
    }
    this.pendingSubtitle = null;
    this.activePriority = priority;
    this.subtitleEl.parentElement?.classList.toggle('cinematic-subtitle-box--top', placement === 'top');
    if (this.subtitleTimer !== null) clearTimeout(this.subtitleTimer);
    if (this.revealTimer !== null) clearTimeout(this.revealTimer);
    this.subtitleEl.style.opacity = '0';
    this.revealTimer = window.setTimeout(() => {
      this.subtitleEl.textContent = text;
      this.subtitleEl.style.opacity = '1';
      this.revealTimer = null;
    }, 150);
    if (durationMs <= 0) {
      this.visibleUntil = Infinity;
      return;
    }
    const readingTime = Math.min(6500, Math.max(2600, text.trim().split(/\s+/).length * 285));
    const displayMs = priority ? Math.max(durationMs, readingTime) : Math.max(2600, Math.min(durationMs, readingTime));
    this.visibleUntil = now + displayMs;
    this.subtitleTimer = window.setTimeout(() => {
      this.subtitleEl.style.opacity = '0';
      this.subtitleTimer = null;
      this.activePriority = false;
      const next = this.pendingSubtitle;
      this.pendingSubtitle = null;
      if (next) this.setSubtitle(next.text, next.durationMs, next.priority);
    }, displayMs);
  }

  public clearSubtitle() {
    if (this.subtitleTimer !== null) clearTimeout(this.subtitleTimer);
    if (this.revealTimer !== null) clearTimeout(this.revealTimer);
    this.subtitleTimer = this.revealTimer = null;
    this.pendingSubtitle = null;
    this.activePriority = false;
    this.subtitleEl.parentElement?.classList.remove('cinematic-subtitle-box--top');
    this.subtitleEl.style.opacity = '0';
    this.subtitleEl.textContent = '';
  }

  public showNextButton(text: string, onClick: () => void) {
    this.onNextRequested = onClick;
    this.promptBtn.textContent = text;
    this.promptBtn.style.display = 'inline-block';
  }

  public hideNextButton() {
    this.promptBtn.style.display = 'none';
  }

  public enableTimeTravelEffects() {
    this.container.classList.add('time-travel-active');
    this.container.querySelector('.film-grain-overlay')?.classList.add('active');
    this.container.querySelector('.sepia-vignette')?.classList.add('active');
  }

  public disableTimeTravelEffects() {
    this.container.classList.remove('time-travel-active');
    this.container.classList.remove('rewinding');
    this.container.querySelector('.film-grain-overlay')?.classList.remove('active');
    this.container.querySelector('.sepia-vignette')?.classList.remove('active');
  }

  public beginTimeRewind(): void {
    this.container.classList.add('rewinding');
  }

  public setLetterboxVisible(visible: boolean, durationMs: number = 2500) {
    const letterboxes = this.container.querySelectorAll<HTMLElement>('.letterbox');
    letterboxes.forEach(lb => {
      lb.style.transition = `opacity ${durationMs}ms ease`;
      lb.style.opacity = visible ? '1' : '0';
    });
  }
}
