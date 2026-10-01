import { AudienceAccessError, chooseGuest, unlockPersonal } from '../content/AudienceMode';

/** A still, papercraft interlude between the dedication and the opening moon. */
export class AudienceGate {
  private readonly root = document.createElement('section');
  private readonly input: HTMLInputElement;
  private readonly submit: HTMLButtonElement;
  private readonly guest: HTMLButtonElement;
  private readonly error: HTMLElement;
  private onChosen: (() => void) | null = null;
  private done = false;
  private busy = false;
  private exitTimer = 0;

  constructor(private readonly joiningRoom = false) {
    this.root.className = 'audience-gate';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'audience-gate-title');
    this.root.innerHTML = `<svg class="audience-gate-art" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="gate-moonlight"><stop stop-color="#efd6a2" stop-opacity=".25"/><stop offset="1" stop-color="#efd6a2" stop-opacity="0"/></radialGradient>
        <linearGradient id="gate-sky" x2="0" y2="1"><stop stop-color="#071323"/><stop offset="1" stop-color="#10293a"/></linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#gate-sky)"/>
      <circle cx="640" cy="198" r="240" fill="url(#gate-moonlight)"/>
      <circle cx="640" cy="198" r="78" fill="#f2e9d4" opacity=".74"/>
      <path d="M0 570 Q155 527 320 564 Q502 517 640 563 Q826 516 990 562 Q1145 526 1280 565 V720 H0Z" fill="#0b1d30"/>
      <path d="M0 643 Q212 587 424 627 Q635 587 850 628 Q1073 584 1280 642 V720 H0Z" fill="#061523"/>
      <g fill="none" stroke="#24445b" stroke-linecap="round" opacity=".8">
        <path d="M65 0 Q127 196 77 603 M135 0 Q194 190 143 551 M1215 0 Q1153 196 1203 603 M1145 0 Q1086 190 1137 551" stroke-width="15"/>
        <path d="M87 160 l92 -65 M104 311 l97 -74 M1193 160 l-92 -65 M1176 311 l-97 -74" stroke-width="7"/>
      </g>
      <path d="M0 90 Q375 158 527 127 M753 127 Q905 158 1280 90" fill="none" stroke="#a9825c" stroke-width="2" opacity=".62"/>
      <g stroke="#d6aa70" stroke-width="2" opacity=".84"><path d="M280 136 v52 M1000 136 v52"/></g>
      <g fill="#cc6149" stroke="#f6c574" stroke-width="3"><path d="M280 183 l8 17 19 2 -14 12 4 19 -17-10 -17 10 4-19 -14-12 19-2Z"/><path d="M1000 183 l8 17 19 2 -14 12 4 19 -17-10 -17 10 4-19 -14-12 19-2Z"/></g>
      <circle cx="280" cy="208" r="32" fill="#ffc878" opacity=".12"/><circle cx="1000" cy="208" r="32" fill="#ffc878" opacity=".12"/>
    </svg>
    <div class="audience-gate-panel">
      <div class="audience-gate-rule" aria-hidden="true"><span>✦</span></div>
      <p class="audience-gate-kicker">ÁNH ĐÈN VÀ ĐÊM TRĂNG</p>
      <h1 id="audience-gate-title">Một lời nhắn dưới trăng</h1>
      <p class="audience-gate-copy">Nhập mã bốn số để mở phần dành riêng cho maiixinh.</p>
      <form class="audience-gate-form" novalidate>
        <label for="audience-pin">Mã dành riêng</label>
        <input id="audience-pin" type="password" inputmode="numeric" pattern="[0-9]{4}"
          maxlength="4" autocomplete="off" aria-describedby="audience-gate-error" required>
        <button class="audience-gate-open" type="submit">Mở ký ức</button>
      </form>
      <p id="audience-gate-error" class="audience-gate-error" role="status" aria-live="polite"></p>
      <div class="audience-gate-divider" aria-hidden="true"><span></span>✦<span></span></div>
      <button class="audience-gate-guest" type="button">Tôi không phải maiixinh</button>
      ${joiningRoom ? '<p class="audience-gate-room-note">Nếu chơi cùng nhau, hai người hãy chọn cùng một lối vào.</p>' : ''}
    </div>`;
    this.input = this.root.querySelector('#audience-pin')!;
    this.submit = this.root.querySelector('.audience-gate-open')!;
    this.guest = this.root.querySelector('.audience-gate-guest')!;
    this.error = this.root.querySelector('.audience-gate-error')!;
    this.input.addEventListener('input', () => {
      this.input.value = this.input.value.replace(/\D/g, '').slice(0, 4);
      this.error.textContent = '';
    });
    this.root.querySelector('form')!.addEventListener('submit', event => {
      event.preventDefault();
      void this.enterPersonal();
    });
    this.guest.addEventListener('click', () => {
      if (this.done || this.busy) return;
      chooseGuest();
      this.complete();
    });
  }

  public show(onChosen: () => void): void {
    this.onChosen = onChosen;
    document.body.appendChild(this.root);
    requestAnimationFrame(() => {
      this.root.classList.add('visible');
      if (!window.matchMedia('(pointer: coarse)').matches) {
        this.input.focus({ preventScroll: true });
      }
    });
  }

  private async enterPersonal(): Promise<void> {
    if (this.done || this.busy) return;
    if (!/^\d{4}$/.test(this.input.value)) {
      this.error.textContent = 'Hãy nhập đủ bốn chữ số.';
      this.input.focus();
      return;
    }
    this.busy = true;
    this.submit.disabled = true;
    this.guest.disabled = true;
    this.submit.textContent = 'Đang mở...';
    try {
      await unlockPersonal(this.input.value);
      this.input.value = '';
      this.complete();
    } catch (error) {
      this.error.textContent = error instanceof AudienceAccessError ? error.message :
        'Chưa kết nối được phần dành riêng. Bạn vẫn có thể vào chơi thử.';
      this.input.value = '';
      this.input.focus();
    } finally {
      this.busy = false;
      this.submit.disabled = false;
      this.guest.disabled = false;
      this.submit.textContent = 'Mở ký ức';
    }
  }

  private complete(): void {
    if (this.done) return;
    this.done = true;
    this.root.classList.add('leaving');
    this.exitTimer = window.setTimeout(() => {
      const callback = this.onChosen;
      this.destroy();
      callback?.();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
  }

  public destroy(): void {
    this.done = true;
    clearTimeout(this.exitTimer);
    this.onChosen = null;
    this.root.remove();
  }
}
