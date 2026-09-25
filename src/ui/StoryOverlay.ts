export class StoryOverlay {
  private container: HTMLDivElement;
  private subtitleEl: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private promptBtn: HTMLButtonElement;
  private audioBtn: HTMLButtonElement;
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

  public setSubtitle(text: string, durationMs: number = 4000) {
    this.subtitleEl.style.opacity = '0';
    setTimeout(() => {
      this.subtitleEl.textContent = text;
      this.subtitleEl.style.opacity = '1';
    }, 300);

    if (durationMs > 0) {
      setTimeout(() => {
        if (this.subtitleEl.textContent === text) {
          this.subtitleEl.style.opacity = '0';
        }
      }, durationMs);
    }
  }

  public clearSubtitle() {
    this.subtitleEl.style.opacity = '0';
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
    this.container.querySelector('.film-grain-overlay')?.classList.add('active');
    this.container.querySelector('.sepia-vignette')?.classList.add('active');
  }

  public disableTimeTravelEffects() {
    this.container.querySelector('.film-grain-overlay')?.classList.remove('active');
    this.container.querySelector('.sepia-vignette')?.classList.remove('active');
  }

  public setLetterboxVisible(visible: boolean, durationMs: number = 2500) {
    const letterboxes = this.container.querySelectorAll<HTMLElement>('.letterbox');
    letterboxes.forEach(lb => {
      lb.style.transition = `opacity ${durationMs}ms ease`;
      lb.style.opacity = visible ? '1' : '0';
    });
  }
}
