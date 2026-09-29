/** A single flyleaf before the opening title, like a hand-written book dedication. */
export class DedicationPage {
  private readonly root: HTMLElement;
  private onOpen: (() => void) | null = null;
  private closeTimer: number | null = null;

  constructor() {
    this.root = document.createElement('section');
    this.root.className = 'dedication-page';
    this.root.setAttribute('aria-label', 'Trang đề tặng');
    this.root.innerHTML = `
      <div class="dedication-page-paper">
        <svg class="dedication-page-art" viewBox="0 0 520 580" aria-hidden="true">
          <defs>
            <radialGradient id="dedication-halo"><stop stop-color="#f4c56d" stop-opacity=".38"/><stop offset="1" stop-color="#f4c56d" stop-opacity="0"/></radialGradient>
            <linearGradient id="dedication-fold"><stop stop-color="#e6c188" stop-opacity="0"/><stop offset=".5" stop-color="#e6c188" stop-opacity=".26"/><stop offset="1" stop-color="#e6c188" stop-opacity="0"/></linearGradient>
          </defs>
          <path d="M66 52 Q260 31 454 52 L454 530 Q260 548 66 530Z" fill="none" stroke="#d9b57d" stroke-opacity=".45" stroke-width="2"/>
          <path d="M77 67 Q260 50 443 67 M77 514 Q260 531 443 514" fill="none" stroke="#e1bd85" stroke-opacity=".28" stroke-width="1"/>
          <path d="M260 50 V530" stroke="url(#dedication-fold)" stroke-width="38"/>
          <circle cx="260" cy="158" r="95" fill="url(#dedication-halo)"/>
          <circle cx="260" cy="151" r="40" fill="#ede4d2"/>
          <path d="M242 142 q9-8 17-4 M267 166 q9 4 16-4" fill="none" stroke="#aeb9bb" stroke-opacity=".5" stroke-width="3"/>
          <path d="M158 172 Q192 199 218 186 M362 172 Q330 199 302 186" fill="none" stroke="#d3af77" stroke-opacity=".44" stroke-width="2"/>
          <path d="M260 196 V256" stroke="#d8ad72" stroke-width="2"/>
          <path d="M260 245 l8 18 20 2-15 14 5 19-18-10-18 10 5-19-15-14 20-2z" fill="#f6bb66" fill-opacity=".64" stroke="#ffe5ab" stroke-width="2"/>
          <circle cx="260" cy="270" r="48" fill="url(#dedication-halo)"/>
          <path class="dedication-divider" d="M135 430 Q259 446 385 430" fill="none" stroke="#d8ad72" stroke-opacity=".4" stroke-width="2"/>
        </svg>
        <div class="dedication-page-copy">
          <span class="dedication-page-kicker">MỘT TRANG ĐẦU TIÊN</span>
          <p class="dedication-page-line">Dành tặng</p>
          <h1>maiixinh</h1>
          <p class="dedication-page-whisper">Cho em, trong một đêm trăng.</p>
        </div>
        <button class="dedication-page-open" type="button">Mở câu chuyện <span aria-hidden="true">→</span></button>
      </div>`;
    this.root.querySelector<HTMLButtonElement>('.dedication-page-open')!
      .addEventListener('click', () => this.open());
    document.body.appendChild(this.root);
  }

  show(onOpen: () => void): void {
    this.onOpen = onOpen;
    requestAnimationFrame(() => this.root.classList.add('visible'));
  }

  private open(): void {
    if (!this.onOpen) return;
    const callback = this.onOpen;
    this.onOpen = null;
    this.root.classList.add('turning');
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      this.root.remove();
      callback();
    }, 620);
  }

  destroy(): void {
    if (this.closeTimer !== null) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    this.onOpen = null;
    this.root.remove();
  }
}
