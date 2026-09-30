export interface CraftStep {
  id: number;
  name: string;
  icon: string;
  desc: string;
}

export class CraftingUI {
  private container: HTMLDivElement;
  private cards: HTMLDivElement[] = [];
  public currentStep: number = 0;
  public onStepCompleted?: (step: number) => void;
  public onBeforeAdvance?: (nextStep: number) => boolean;

  private steps: CraftStep[] = [
    { id: 1, name: "1. Khung nan tre", icon: "🎋", desc: "Chạm nan tre và chọn dáng đèn" },
    { id: 2, name: "2. Giấy kiếng màu", icon: "🏮", desc: "Dán lớp áo trong veo mùa thu" },
    { id: 3, name: "3. Dây kẽm và cán tre", icon: "✨", desc: "Buộc nút thắt và gắn cán cầm" },
    { id: 4, name: "4. Thắp nến đón trăng", icon: "🕯️", desc: "Thắp sáng ngọn lửa ấm áp" }
  ];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'crafting-ui-container';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="crafting-prompt-text">Chạm vào vật đang sáng trên chiếc chiếu để làm đèn</div>
      <div class="crafting-tray"></div>
    `;

    document.body.appendChild(this.container);
    this.buildTray();
  }

  private buildTray() {
    const tray = this.container.querySelector('.crafting-tray')!;

    this.steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = `craft-card ${idx === 0 ? 'active' : 'locked'}`;
      card.innerHTML = `
        <div class="craft-icon">${step.icon}</div>
        <div class="craft-info">
          <div class="craft-title">${step.name}</div>
          <div class="craft-desc">${step.desc}</div>
        </div>
        <div class="craft-check">✓</div>
      `;

      card.addEventListener('click', () => {
        if (this.currentStep === idx) {
          this.advanceStep();
        }
      });

      this.cards.push(card);
      tray.appendChild(card);
    });
  }

  public show() {
    this.container.style.display = 'flex';
    this.container.classList.add('fade-in');
    this.updateCardStates();
  }

  public hide() {
    this.container.classList.remove('fade-in');
    this.container.classList.add('fade-out');
    setTimeout(() => {
      this.container.style.display = 'none';
      this.container.classList.remove('fade-out');
    }, 600);
  }

  public advanceStep() {
    if (this.currentStep >= this.steps.length) return;
    if (this.onBeforeAdvance?.(this.currentStep + 1) === false) return;

    const completed = this.currentStep + 1;
    this.cards[this.currentStep].classList.remove('active');
    this.cards[this.currentStep].classList.add('completed');

    this.currentStep++;

    if (this.currentStep < this.steps.length) {
      this.cards[this.currentStep].classList.remove('locked');
      this.cards[this.currentStep].classList.add('active');
    }

    if (this.onStepCompleted) {
      this.onStepCompleted(completed);
    }

    if (this.currentStep >= this.steps.length) {
      // Completed all crafting!
      setTimeout(() => {
        this.hide();
      }, 1200);
    }
  }

  public setFrameDescription(description: string): void {
    this.steps[0].desc = description;
    const label = this.cards[0]?.querySelector('.craft-desc');
    if (label) label.textContent = description;
  }

  private updateCardStates() {
    this.cards.forEach((card, idx) => {
      card.classList.remove('active', 'locked', 'completed');
      if (idx < this.currentStep) card.classList.add('completed');
      else if (idx === this.currentStep) card.classList.add('active');
      else card.classList.add('locked');
    });
  }
}
