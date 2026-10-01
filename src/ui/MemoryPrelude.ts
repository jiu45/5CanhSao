/** A short illustrated bridge from the moon to the child's first handmade lantern. */
export class MemoryPrelude {
  private root = document.createElement('section');
  private page = 0;
  private onDone: (() => void) | null = null;

  constructor() {
    this.root.className = 'memory-prelude';
    this.root.setAttribute('aria-label', 'Trang truyện mở đầu');
    this.root.innerHTML = `
      <svg class="memory-prelude-art" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="memory-sky"><stop stop-color="#314a67"/><stop offset=".52" stop-color="#182b48"/><stop offset="1" stop-color="#071224"/></radialGradient>
          <radialGradient id="memory-moonlight"><stop stop-color="#fff8d9"/><stop offset=".5" stop-color="#f4e6b9" stop-opacity=".45"/><stop offset="1" stop-color="#f4e6b9" stop-opacity="0"/></radialGradient>
          <linearGradient id="memory-paper"><stop stop-color="#b45b3b"/><stop offset="1" stop-color="#e0a96b"/></linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#memory-sky)"/>
        <circle cx="640" cy="186" r="164" fill="url(#memory-moonlight)"/>
        <circle cx="640" cy="186" r="77" fill="#f8f0d7"/>
        <circle cx="622" cy="168" r="13" fill="#e5dfd1" opacity=".38"/>
        <circle cx="668" cy="210" r="20" fill="#e5dfd1" opacity=".28"/>
        <g class="memory-village">
          <path d="M0 410 Q120 390 210 415 Q300 425 380 405 Q480 380 560 419 Q670 398 760 423 Q860 390 950 413 Q1080 385 1280 417 L1280 720 L0 720Z" fill="#19314b"/>
          <path d="M0 489 L85 463 L85 455 Q163 395 252 448 L330 468 L330 720 L0 720Z M895 475 L979 452 Q1073 386 1170 451 L1280 480 L1280 720 L895 720Z" fill="#0c1f34"/>
          <path d="M0 506 L85 478 L175 428 L253 478 L333 506 M894 492 L982 468 L1071 426 L1170 468 L1280 500" fill="none" stroke="#718193" stroke-opacity=".36" stroke-width="6"/>
          <path d="M0 516 L330 516 M895 505 L1280 505" stroke="#604b49" stroke-width="13"/>
          <path d="M506 720 L588 478 L695 478 L802 720Z" fill="#6c625e" opacity=".58"/>
          <path d="M0 720 Q285 581 506 604 M1280 720 Q1005 577 802 604" fill="none" stroke="#5f534b" stroke-width="4" opacity=".58"/>
          <rect x="91" y="528" width="48" height="54" fill="#f5bd70" opacity=".85"/>
          <rect x="1140" y="520" width="48" height="54" fill="#f5bd70" opacity=".85"/>
          <circle cx="638" cy="515" r="8" fill="#ffd270"/><circle cx="639" cy="514" r="28" fill="#ffd270" opacity=".15"/>
          <g class="memory-mobile-house">
            <path d="M482 492 L640 399 L798 492 V720 H482Z" fill="#0a1e31"/>
            <path d="M467 491 L640 389 L813 491" fill="none" stroke="#738698" stroke-width="10"/>
            <path d="M478 505 H802" stroke="#665045" stroke-width="16"/>
            <rect x="600" y="524" width="82" height="118" rx="3" fill="#f7bb73"/>
            <path d="M641 524 V642" stroke="#ae673b" stroke-width="7"/>
            <circle cx="642" cy="584" r="102" fill="#f7bb73" opacity=".12"/>
          </g>
          <path d="M36 0 Q160 229 65 570 M130 0 Q188 168 137 405 M1190 0 Q1116 185 1194 535 M1270 0 Q1130 238 1250 558" fill="none" stroke="#0a2132" stroke-width="17"/>
          <path d="M40 190 L183 112 M84 294 L225 226 M1230 176 L1108 118 M1190 290 L1038 220" fill="none" stroke="#16394a" stroke-width="9"/>
          <path d="M36 180 l-53 -27 37 42 M110 251 l84 -38 -73 56 M1198 174 l68 -28 -51 48 M1165 268 l-82 -31 69 54" fill="#24536a"/>
        </g>
        <g class="memory-room">
          <rect x="0" y="0" width="1280" height="720" fill="#111d31" opacity=".94"/>
          <path d="M0 0 H410 V545 H0Z M870 0 H1280 V545 H870Z" fill="#192b40"/>
          <path d="M395 0 V488 M885 0 V488" stroke="#523a35" stroke-width="29"/>
          <path d="M410 0 H870 V430 H410Z" fill="#243b54"/>
          <circle cx="640" cy="186" r="78" fill="#f7efda"/>
          <path d="M410 0 H870 M410 430 H870 M540 0 V430 M745 0 V430" stroke="#584435" stroke-width="18"/>
          <g class="memory-child">
            <path d="M946 525 Q965 459 1016 445 Q1075 440 1117 494 L1180 720 H914Z" fill="#10243b"/>
            <path d="M984 468 Q983 412 1027 395 Q1075 391 1092 432 Q1087 478 1048 485 Q1010 486 984 468Z" fill="#182f48" stroke="#b59568" stroke-opacity=".46" stroke-width="5"/>
            <path d="M981 432 Q1005 372 1058 385 Q1092 398 1090 435 Q1067 414 1042 416 Q1011 432 981 432Z" fill="#0a1a2e"/>
            <path d="M989 507 Q923 541 858 565 L750 579" fill="none" stroke="#132941" stroke-width="30" stroke-linecap="round"/>
            <path d="M751 577 q-25 -12 -47 -3 m47 3 q-17 13 -39 11" fill="none" stroke="#bf9b70" stroke-width="8" stroke-linecap="round"/>
            <path d="M1015 484 Q981 481 952 503" fill="none" stroke="#d7ab72" stroke-opacity=".5" stroke-width="5"/>
          </g>
          <path d="M0 547 Q335 494 640 510 Q956 490 1280 544 V720 H0Z" fill="#302b2b"/>
          <path d="M136 530 Q408 484 652 515 Q856 478 1120 529 L1150 720 H105Z" fill="#6c584a"/>
          <path d="M210 565 Q630 532 1050 568 M215 600 Q630 568 1065 604 M220 635 Q630 603 1070 640 M240 677 Q630 638 1050 682" fill="none" stroke="#caa978" stroke-opacity=".65" stroke-width="6"/>
          <path d="M350 565 l184 35 M377 610 l161 -51 M742 557 l180 60 M750 606 l155 -47" stroke="#e7bd73" stroke-width="11" stroke-linecap="round"/>
          <path d="M0 720 Q145 574 302 586 Q354 600 390 650 L459 720Z M1280 720 Q1123 574 980 588 Q923 610 887 660 L830 720Z" fill="#102036"/>
          <path d="M250 636 Q335 593 421 624 M1020 630 Q938 585 859 618" fill="none" stroke="#384a60" stroke-width="20"/>
          <path d="M655 544 l22 45 -22 18 -22 -18Z" fill="url(#memory-paper)" stroke="#e3b566" stroke-width="5"/>
          <circle cx="655" cy="585" r="65" fill="#ffc46a" opacity=".09"/>
        </g>
      </svg>
      <div class="memory-prelude-copy"><span class="memory-prelude-kicker">ĐÊM RẰM NĂM ẤY</span>
        <p class="memory-prelude-line"></p>
        <button class="memory-prelude-next" type="button"></button>
      </div>`;
    document.body.appendChild(this.root);
    this.root.querySelector<HTMLButtonElement>('.memory-prelude-next')!
      .addEventListener('click', () => this.next());
  }

  show(onDone: () => void): void {
    this.onDone = onDone;
    this.page = 0;
    this.render();
    this.root.classList.add('visible');
  }

  private render(): void {
    this.root.dataset.page = String(this.page);
    this.root.querySelector<HTMLElement>('.memory-prelude-line')!.textContent = this.page === 0
      ? 'Cuối con ngõ, một căn nhà vẫn còn sáng.'
      : 'Trên chiếu cói, mấy thanh nan tre đang chờ được uốn thành đèn.';
    this.root.querySelector<HTMLButtonElement>('.memory-prelude-next')!.textContent = this.page === 0
      ? 'Vào nhà →' : 'Cầm nan tre lên →';
  }

  private next(): void {
    if (this.page === 0) {
      this.page = 1;
      this.render();
      return;
    }
    this.root.classList.remove('visible');
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }

  destroy(): void {
    this.onDone = null;
    this.root.remove();
  }
}
