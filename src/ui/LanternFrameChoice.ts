import { LANTERN_NAMES, LANTERN_STYLES, type LanternStyle } from '../props/LanternIdentity';
import { drawLanternSilhouette } from '../props/LanternSilhouetteArt';

/** Four bent-bamboo outlines appear as a page laid over the craft mat. */
export class LanternFrameChoice {
  private readonly root: HTMLDivElement;

  constructor(onChoose: (style: LanternStyle) => void) {
    this.root = document.createElement('div');
    this.root.className = 'lantern-frame-choice';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', 'Chọn khung đèn');
    const sheet = document.createElement('div'); sheet.className = 'lantern-frame-sheet';
    const prompt = document.createElement('p'); prompt.className = 'lantern-frame-prompt';
    prompt.textContent = 'Nan tre mềm trong tay. Đêm nay, bạn muốn uốn thành chiếc đèn nào?';
    const grid = document.createElement('div'); grid.className = 'lantern-frame-grid';
    LANTERN_STYLES.forEach(style => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'lantern-frame-option';
      button.dataset.lanternStyle = style;
      button.setAttribute('aria-label', LANTERN_NAMES[style]);
      const image = document.createElement('img');
      image.src = drawLanternSilhouette(style, false).toDataURL('image/png');
      image.alt = '';
      const name = document.createElement('span'); name.textContent = LANTERN_NAMES[style];
      button.append(image, name);
      button.addEventListener('click', () => { onChoose(style); this.destroy(); });
      grid.appendChild(button);
    });
    const hint = document.createElement('small');
    hint.textContent = 'Chạm vào một chiếc khung để bắt đầu làm đèn.';
    sheet.append(prompt, grid, hint); this.root.appendChild(sheet);
    document.body.appendChild(this.root);
    requestAnimationFrame(() => this.root.classList.add('visible'));
  }

  destroy(): void { this.root.remove(); }
}
