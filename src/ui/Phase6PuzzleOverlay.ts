import type { PlayerRole } from '../multiplayer/NetworkState';
import type { MemoryDeck } from '../multiplayer/MemoryCards';
import type { Phase6SharedState } from '../multiplayer/Phase6State';

const elderAnswers = [
  ['lantern', 'Ngọn đèn'], ['drum', 'Tiếng trống'],
  ['moon', 'Mặt Trăng'], ['feast', 'Mâm cỗ']
] as const;

export class Phase6PuzzleOverlay {
  private readonly root: HTMLDivElement;
  private readonly style: HTMLStyleElement;
  private lastRenderKey = '';

  constructor(private onElderAnswer: (id: string) => void,
    private onMemoryChoice: (id: string) => void) {
    this.style = document.createElement('style');
    this.style.textContent = `
      .phase6-keepsake { position:fixed; z-index:45; bottom:16px; left:50%; transform:translateX(-50%);
        box-sizing:border-box; width:min(790px,calc(100vw - 24px)); max-height:74vh; overflow:auto; display:none;
        color:#fff0d3; background:linear-gradient(180deg,rgba(15,22,36,.83),rgba(29,29,43,.91));
        border:1px solid rgba(248,205,127,.43); border-radius:19px; padding:18px 22px;
        box-shadow:0 18px 58px rgba(0,0,0,.5),inset 0 1px rgba(255,240,201,.1);
        font-family:Georgia,'Times New Roman',serif; text-align:center; }
      .phase6-keepsake h2 { margin:0 0 7px; font-size:21px; font-weight:400;
        letter-spacing:.035em; color:#ffe4ae; }
      .phase6-keepsake p { margin:5px 0 12px; line-height:1.42; font-size:15px; }
      .phase6-keepsake .choices { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:11px; }
      .phase6-keepsake button { cursor:pointer; font:inherit; }
      .phase6-keepsake:not(.memory-mode) button {
        min-height:63px; color:#fff1d5;
        background:radial-gradient(ellipse at 50% 0%,rgba(251,186,95,.42),rgba(91,49,62,.85));
        border:1px solid rgba(251,199,111,.75); border-radius:34px 34px 13px 13px;
        box-shadow:inset 0 1px rgba(255,243,208,.22),0 6px 18px rgba(0,0,0,.23);
      }
      .phase6-keepsake:not(.memory-mode) button:hover,
      .phase6-keepsake:not(.memory-mode) button:focus-visible {
        background:radial-gradient(ellipse at 50% 0%,rgba(255,212,125,.64),rgba(118,55,69,.92));
        outline:2px solid #f5cf83; outline-offset:2px;
      }
      .phase6-keepsake.memory-mode { left:0; transform:none; width:100%; max-width:none;
        background:transparent; border:0; box-shadow:none; overflow:visible; }
      .phase6-keepsake.memory-mode .choices { max-width:740px; margin:auto; }
      .phase6-keepsake.memory-mode h2,.phase6-keepsake.memory-mode p,
      .phase6-keepsake.memory-mode small { text-shadow:0 2px 11px #050812,0 1px 3px #050812; }
      .phase6-keepsake.memory-mode h2 { position:fixed; top:45px; left:50%;
        transform:translateX(-50%); box-sizing:border-box; width:min(650px,calc(100vw - 32px));
        padding:5px 14px; border-radius:16px; background:rgba(8,18,34,.78); }
      .phase6-keepsake.memory-mode p { position:fixed; top:84px; left:50%;
        transform:translateX(-50%); box-sizing:border-box; width:min(650px,calc(100vw - 32px));
        padding:4px 12px; border-radius:12px; background:rgba(8,18,34,.74);
        font-size:14px; }
      .phase6-keepsake.memory-mode p:nth-of-type(2) { top:119px; }
      .phase6-keepsake .memory-card { display:flex; flex-direction:column; align-items:center;
        gap:7px; min-width:0; padding:7px 7px 13px; color:#453d38;
        background:linear-gradient(135deg,#fff5df,#e9ddc4 82%,#d8c9aa);
        border:1px solid #d9c9a6; border-radius:2px;
        box-shadow:0 8px 21px rgba(0,0,0,.38),inset 1px 1px rgba(255,255,255,.75);
        transform:translateY(3px) rotate(-3deg);
        transition:transform .25s ease,box-shadow .25s ease; }
      .phase6-keepsake .memory-card:nth-child(2) { transform:translateY(-5px) rotate(2deg); }
      .phase6-keepsake .memory-card:nth-child(3) { transform:translateY(4px) rotate(-1deg); }
      .phase6-keepsake .memory-card:nth-child(4) { transform:translateY(-3px) rotate(3deg); }
      .phase6-keepsake .memory-card:hover,.phase6-keepsake .memory-card:focus-visible {
        transform:translateY(-8px) rotate(0); outline:2px solid #f6d587;
        box-shadow:0 15px 28px rgba(0,0,0,.44); }
      .phase6-keepsake .memory-card img { width:100%; height:122px; object-fit:cover;
        object-position:center; background:#ddd1bb; }
      .phase6-keepsake .memory-card span { font-size:14px; line-height:1.2; }
      .phase6-keepsake .featured { width:min(280px,95%); margin:9px auto; padding:9px 9px 17px;
        background:#f3e9d5; color:#493f39; transform:rotate(-1.5deg);
        box-shadow:0 12px 28px rgba(0,0,0,.45); }
      .phase6-keepsake .featured img { width:100%; height:182px; object-fit:cover; display:block;
        background:#ddd1bb; }
      .phase6-keepsake .featured small { color:#5b4b40; }
      .phase6-keepsake small { display:block; margin-top:10px; color:#ebcf9c; }
      @media(max-width:680px) {
        .phase6-keepsake {padding:13px 15px;}
        .phase6-keepsake h2{font-size:18px;}
        .phase6-keepsake .choices{grid-template-columns:repeat(2,minmax(0,1fr));}
        .phase6-keepsake .memory-card img{height:100px;}
        .phase6-keepsake.memory-mode h2{top:75px;font-size:16px;}
        .phase6-keepsake.memory-mode p{top:108px;font-size:12px;}
        .phase6-keepsake.memory-mode p:nth-of-type(2){top:150px;}
      }
      @media(prefers-reduced-motion:reduce) {
        .phase6-keepsake .memory-card{transition:none;}
      }
    `;
    document.head.appendChild(this.style);
    this.root = document.createElement('div');
    this.root.className = 'phase6-keepsake';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-live', 'polite');
    this.root.addEventListener('pointerdown', event => event.stopPropagation());
    this.root.addEventListener('pointerup', event => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  public render(state: Phase6SharedState, role: PlayerRole, deck: MemoryDeck | null): void {
    const key = `${state.revision}:${state.stage}:${role}:${!!deck}`;
    if (key === this.lastRenderKey) return;
    this.lastRenderKey = key;
    this.root.replaceChildren();
    const elder = state.stage === 'ELDER_PUZZLE';
    const memory = state.stage === 'MEMORY_PUZZLE';
    this.root.classList.toggle('memory-mode', memory);
    this.root.style.display = elder || memory ? 'block' : 'none';
    if (elder) this.renderElder(state, role);
    if (memory) this.renderMemory(state, role, deck);
  }

  private heading(text: string): void {
    const heading = document.createElement('h2'); heading.textContent = text; this.root.appendChild(heading);
  }

  private paragraph(text: string): void {
    const paragraph = document.createElement('p'); paragraph.textContent = text; this.root.appendChild(paragraph);
  }

  private renderElder(state: Phase6SharedState, role: PlayerRole): void {
    this.heading('Dưới mái hiên của ông');
    this.paragraph('Trong một đêm Trung Thu, thứ gì hai người cùng nhìn thấy dù đứng rất xa nhau?');
    if (state.elderAnswers[role]) {
      this.paragraph('Bạn đã chọn. Chờ ngọn đèn kia cùng trả lời...'); return;
    }
    if (state.elderFeedback) this.paragraph(state.elderFeedback);
    const choices = document.createElement('div'); choices.className = 'choices';
    elderAnswers.forEach(([id, label]) => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = label; button.dataset.answer = id;
      button.addEventListener('click', () => this.onElderAnswer(id)); choices.appendChild(button);
    });
    this.root.appendChild(choices);
  }

  private renderMemory(state: Phase6SharedState, role: PlayerRole, deck: MemoryDeck | null): void {
    this.heading('Người Giữ Trăng · Ký ức hai ngọn đèn');
    if (!deck) { this.paragraph('Đang mở những tấm ảnh ký ức...'); return; }
    const round = deck.rounds[state.memoryRound];
    if (!round) return;
    const viewer = round.viewerRole === role;
    if (viewer) {
      this.paragraph('Hãy kể cho bạn mình điều bạn nhìn thấy. Người ấy sẽ chọn tấm ảnh đúng.');
      const card = deck.cards.find(item => item.id === round.targetCardId)!;
      const frame = document.createElement('div'); frame.className = 'featured';
      const img = document.createElement('img'); img.src = card.imageSrc; img.alt = card.alt || card.caption || '';
      frame.appendChild(img);
      const caption = document.createElement('small'); caption.textContent = card.caption || '';
      frame.appendChild(caption); this.root.appendChild(frame);
    } else {
      this.paragraph('Lắng nghe người bên kia kể về tấm ảnh. Chọn ký ức mà bạn nghĩ người ấy đang thấy.');
      if (state.memoryFeedback) this.paragraph(state.memoryFeedback);
      const choices = document.createElement('div'); choices.className = 'choices';
      round.choiceCardIds.forEach(id => {
        const card = deck.cards.find(item => item.id === id)!;
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'memory-card'; button.dataset.cardId = id;
        const img = document.createElement('img'); img.src = card.imageSrc; img.alt = card.alt || card.caption || '';
        const label = document.createElement('span'); label.textContent = card.caption || 'Ký ức';
        button.append(img, label);
        button.addEventListener('click', () => this.onMemoryChoice(id)); choices.appendChild(button);
      });
      this.root.appendChild(choices);
    }
    const roundLabel = document.createElement('small'); roundLabel.textContent = `Ký ức ${state.memoryRound + 1} / 2`;
    this.root.appendChild(roundLabel);
  }

  public destroy(): void { this.root.remove(); this.style.remove(); }
}
