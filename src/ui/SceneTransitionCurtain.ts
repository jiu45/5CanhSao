type TransitionMood = 'memory' | 'moon' | 'gate';

/** A compositor-friendly cover for scene swaps; it owns no game state. */
export class SceneTransitionCurtain {
  private readonly element: HTMLDivElement;
  private readonly caption: HTMLSpanElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'scene-transition-curtain';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<span class="scene-transition-moon"></span>'
      + '<span class="scene-transition-caption"></span>';
    this.caption = this.element.querySelector('.scene-transition-caption')!;
    document.body.appendChild(this.element);
  }

  private waitForOpacity(fallbackMs: number): Promise<void> {
    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.element.removeEventListener('transitionend', onEnd);
        window.clearTimeout(timer);
        resolve();
      };
      const onEnd = (event: TransitionEvent) => {
        if (event.target === this.element && event.propertyName === 'opacity') finish();
      };
      const timer = window.setTimeout(finish, fallbackMs);
      this.element.addEventListener('transitionend', onEnd);
    });
  }

  public async cover(mood: TransitionMood): Promise<void> {
    this.element.dataset.mood = mood;
    this.caption.textContent = mood === 'gate' ? 'Cánh cổng đang hé sáng'
      : mood === 'memory' ? 'Một ký ức đang mở ra' : 'Ánh trăng đang mở lối';
    this.element.style.visibility = 'visible';
    // Flush the transparent state without depending on requestAnimationFrame:
    // a companion's browser tab may be hidden and its rAF callbacks suspended.
    void this.element.offsetWidth;
    const finished = this.waitForOpacity(650);
    this.element.classList.add('is-covered');
    await finished;
  }

  public async reveal(): Promise<void> {
    const finished = this.waitForOpacity(950);
    this.element.classList.remove('is-covered');
    await finished;
    this.element.style.visibility = 'hidden';
  }

  public hide(): void {
    this.element.classList.remove('is-covered');
    this.element.style.visibility = 'hidden';
  }
}
