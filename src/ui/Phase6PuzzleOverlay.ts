import type { PlayerRole } from '../multiplayer/NetworkState';
import type { MemoryDeck } from '../multiplayer/MemoryCards';
import { getAudienceMode } from '../content/AudienceMode';
import type { Phase6SharedState } from '../multiplayer/Phase6State';

const elderAnswers = [
  ['lantern', 'Chiếc đèn'], ['drum', 'Tiếng trống'],
  ['moon', 'Mặt trăng'], ['feast', 'Mâm cỗ']
] as const;

export class Phase6PuzzleOverlay {
  private readonly root: HTMLDivElement;
  private readonly style: HTMLStyleElement;
  private lastRenderKey = '';
  private memoryLoadError = false;

  constructor(private onElderAnswer: (id: string) => void,
    private onMemoryChoice: (id: string) => void,
    private onMemoryIntroReady: () => void) {
    this.style = document.createElement('style');
    this.style.textContent = `
      .phase6-keepsake { position:fixed; z-index:45; bottom:16px; left:50%; transform:translateX(-50%);
        box-sizing:border-box; width:min(790px,calc(100vw - 24px)); max-height:74vh; overflow:auto; display:none;
        color:#fff0d3; background:linear-gradient(180deg,rgba(15,22,36,.83),rgba(29,29,43,.91));
        border:1px solid rgba(248,205,127,.43); border-radius:19px; padding:18px 22px;
        box-shadow:0 18px 58px rgba(0,0,0,.5),inset 0 1px rgba(255,240,201,.1);
        font-family:'Segoe UI',system-ui,Arial,sans-serif; text-align:center; }
      .phase6-keepsake h2 { margin:0 0 7px; font-size:21px; font-weight:400;
        letter-spacing:.035em; color:#ffe4ae; }
      .phase6-keepsake p { margin:5px 0 12px; line-height:1.42; font-size:15px; }
      .phase6-keepsake .world-voice { font-family:'Segoe UI',system-ui,Arial,sans-serif;
        font-size:clamp(16px,2.2vw,19px); font-style:normal; font-weight:500; color:#ffe4ae;
        border-left:2px solid #e8bb78; padding:5px 13px; margin:12px auto 18px;
        max-width:590px; text-align:left; }
      .phase6-keepsake .game-instruction { font-family:'Segoe UI',system-ui,Arial,sans-serif;
        font-size:14px; font-style:normal; color:#d9deea; }
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
      .phase6-keepsake .featured { width:min(280px,95%); margin:9px auto; padding:9px 9px 12px;
        background:#f3e9d5; color:#493f39; transform:rotate(-1.5deg);
        box-shadow:0 12px 28px rgba(0,0,0,.45); }
      .phase6-keepsake .featured img { width:100%; height:182px; object-fit:cover; display:block;
        background:#ddd1bb; }
      .phase6-keepsake small { display:block; margin-top:10px; color:#ebcf9c; }
      .phase6-keepsake.intro-mode { inset:0; left:0; bottom:0; transform:none;
        width:100%; max-height:none; max-width:none; overflow:auto; padding:20px;
        border:0; border-radius:0; box-shadow:none;
        background:radial-gradient(ellipse at center,rgba(5,14,29,.55),rgba(3,8,20,.82));
        place-items:center; }
      .phase6-intro-paper { box-sizing:border-box; width:min(610px,100%); padding:36px 42px 32px;
        background:linear-gradient(155deg,rgba(17,30,49,.96),rgba(16,25,42,.97));
        border:1px solid rgba(245,208,137,.55); border-radius:4px 30px 4px 30px;
        box-shadow:0 22px 65px #020713ac,inset 0 1px #fff3ce2b; }
      .phase6-intro-kicker { display:block; font:600 11px 'Segoe UI',sans-serif;
        letter-spacing:.3em; color:#e9bc76; margin-bottom:16px; }
      .phase6-intro-paper h2 { font:400 clamp(25px,4vw,34px) Georgia,serif;
        color:#fff2d2; margin:0 0 17px; letter-spacing:.01em; }
      .phase6-intro-paper p { font:400 clamp(16px,2.25vw,18px)/1.65 'Segoe UI',system-ui,sans-serif;
        color:#e9e4db; margin:0 auto 13px; max-width:510px; }
      .phase6-intro-paper .world-voice { font:500 clamp(17px,2.5vw,21px)/1.55 'Segoe UI',system-ui,sans-serif;
        color:#ffe4ae; padding:0; border:0; text-align:center; }
      .phase6-intro-paper .game-instruction { font:400 14px/1.55 'Segoe UI',system-ui,sans-serif;
        color:#d9deea; }
      .phase6-intro-divider { width:76px; height:1px; margin:21px auto;
        background:linear-gradient(90deg,transparent,#f5d796,transparent); }
      .phase6-keepsake.intro-mode .phase6-intro-button { margin-top:9px; padding:12px 28px;
        min-height:0; border:1px solid #f1c982; border-radius:999px;
        color:#1a2230; background:linear-gradient(110deg,#ffe9ad,#e9b775);
        box-shadow:0 5px 23px #ffcf7940; font:600 15px 'Segoe UI',sans-serif; }
      .phase6-keepsake.intro-mode .phase6-intro-button:hover,
      .phase6-keepsake.intro-mode .phase6-intro-button:focus-visible {
        outline:2px solid #fff4cf; outline-offset:3px; filter:brightness(1.07); }
      .phase6-intro-wait { font:400 14px Georgia,serif; color:#f1dbaa; }
      @media(max-width:680px) {
        .phase6-keepsake {padding:13px 15px;}
        .phase6-keepsake h2{font-size:18px;}
        .phase6-keepsake .choices{grid-template-columns:repeat(2,minmax(0,1fr));}
        .phase6-keepsake .memory-card img{height:100px;}
        .phase6-keepsake.memory-mode h2{top:75px;font-size:16px;}
        .phase6-keepsake.memory-mode p{top:108px;font-size:12px;}
        .phase6-keepsake.memory-mode p:nth-of-type(2){top:150px;}
        .phase6-intro-paper {padding:30px 24px 26px;}
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
    const key = `${state.revision}:${state.stage}:${role}:${!!deck}:${this.memoryLoadError}`;
    if (key === this.lastRenderKey) return;
    this.lastRenderKey = key;
    this.root.replaceChildren();
    const elder = state.stage === 'ELDER_PUZZLE';
    const memory = state.stage === 'MEMORY_PUZZLE';
    const intro = memory && !(state.memoryIntroReady?.host && state.memoryIntroReady?.guest);
    this.root.classList.toggle('memory-mode', memory && !intro);
    this.root.classList.toggle('intro-mode', intro);
    this.root.style.display = intro ? 'grid' : elder || memory ? 'block' : 'none';
    if (elder) this.renderElder(state, role);
    if (intro) this.renderMemoryIntro(state, role);
    else if (memory) this.renderMemory(state, role, deck);
  }

  public setMemoryLoadError(): void {
    this.memoryLoadError = true;
    this.lastRenderKey = '';
  }

  private heading(text: string): void {
    const heading = document.createElement('h2'); heading.textContent = text; this.root.appendChild(heading);
  }

  private paragraph(text: string, kind?: 'world-voice' | 'game-instruction'): void {
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    if (kind) paragraph.className = kind;
    this.root.appendChild(paragraph);
  }

  private renderElder(state: Phase6SharedState, role: PlayerRole): void {
    this.heading('Dưới mái hiên');
    this.paragraph('Dù đứng xa nhau, hai đứa vẫn nhìn thấy cùng một thứ. Là gì nhỉ?', 'world-voice');
    if (state.elderAnswers[role]) {
      this.paragraph('Đợi người kia chọn nhé.', 'game-instruction'); return;
    }
    if (state.elderFeedback) this.paragraph(state.elderFeedback, 'world-voice');
    const choices = document.createElement('div'); choices.className = 'choices';
    elderAnswers.forEach(([id, label]) => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = label; button.dataset.answer = id;
      button.addEventListener('click', () => this.onElderAnswer(id)); choices.appendChild(button);
    });
    this.root.appendChild(choices);
  }

  private renderMemoryIntro(state: Phase6SharedState, role: PlayerRole): void {
    const visitor = getAudienceMode() === 'guest';
    const paper = document.createElement('div'); paper.className = 'phase6-intro-paper';
    paper.innerHTML = `<span class="phase6-intro-kicker">NGƯỜI GIỮ TRĂNG</span>
      <h2>Kể cho nhau nghe</h2>
      <p class="world-voice">Có một lối về. Hãy kể cho nhau nghe điều mình đang thấy.</p>
      <div class="phase6-intro-divider" aria-hidden="true"></div>
      <p class="game-instruction">${visitor ? 'Mỗi lượt, một người nhìn tranh và kể. Người kia chọn bức tranh ấy. Rồi đổi vai.' :
        'Mỗi lượt, một người nhìn ảnh và kể. Người kia chọn ảnh ấy. Rồi đổi vai.'}</p>`;
    if (state.memoryIntroReady?.[role]) {
      const wait = document.createElement('small'); wait.className = 'phase6-intro-wait';
      wait.textContent = 'Đợi người kia...'; paper.appendChild(wait);
    } else {
      const button = document.createElement('button'); button.className = 'phase6-intro-button';
      button.type = 'button'; button.textContent = visitor ? 'Mở bức tranh đầu tiên' : 'Mở tấm ảnh đầu tiên';
      button.addEventListener('click', () => {
        button.disabled = true; button.textContent = visitor ? 'Đợi người kia mở tranh...' : 'Đợi người kia mở ảnh...';
        this.onMemoryIntroReady();
      });
      paper.appendChild(button);
    }
    this.root.appendChild(paper);
  }

  private renderMemory(state: Phase6SharedState, role: PlayerRole, deck: MemoryDeck | null): void {
    const visitor = getAudienceMode() === 'guest';
    this.heading(visitor ? 'Những bức tranh đêm rằm' : 'Những tấm ảnh của hai người');
    if (!deck) {
      this.paragraph(this.memoryLoadError ? 'Chưa mở được hình. Hãy tải lại trang rồi thử tiếp.' :
        'Đang mở hình...', 'game-instruction');
      return;
    }
    const round = deck.rounds[state.memoryRound];
    if (!round) return;
    const viewer = round.viewerRole === role;
    if (viewer) {
      this.paragraph(visitor ? 'Hãy kể cho người kia nghe những gì bạn thấy trong tranh.' :
        'Hãy kể cho người kia nghe những gì bạn thấy trong ảnh.', 'game-instruction');
      const card = deck.cards.find(item => item.id === round.targetCardId)!;
      const frame = document.createElement('div'); frame.className = 'featured';
      const img = document.createElement('img'); img.src = card.imageSrc; img.alt = card.alt || card.caption || '';
      frame.appendChild(img); this.root.appendChild(frame);
    } else {
      this.paragraph(visitor ? 'Nghe người kia kể, rồi chọn bức tranh đúng với lời kể.' :
        'Nghe người kia kể, rồi chọn tấm ảnh đúng với lời kể.', 'game-instruction');
      if (state.memoryFeedback) this.paragraph(state.memoryFeedback);
      const choices = document.createElement('div'); choices.className = 'choices';
      round.choiceCardIds.forEach(id => {
        const card = deck.cards.find(item => item.id === id)!;
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'memory-card'; button.dataset.cardId = id;
        const img = document.createElement('img'); img.src = card.imageSrc; img.alt = card.alt || card.caption || '';
        const label = document.createElement('span');
        label.textContent = card.caption?.trim() || (visitor ? 'Một bức tranh' : 'Một tấm ảnh');
        button.append(img, label);
        button.addEventListener('click', () => this.onMemoryChoice(id)); choices.appendChild(button);
      });
      this.root.appendChild(choices);
    }
    const roundLabel = document.createElement('small'); roundLabel.textContent = `Lượt ${state.memoryRound + 1}/2`;
    this.root.appendChild(roundLabel);
  }

  public destroy(): void { this.root.remove(); this.style.remove(); }
}
