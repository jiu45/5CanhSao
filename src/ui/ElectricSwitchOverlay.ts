/**
 * src/ui/ElectricSwitchOverlay.ts
 *
 * Skeuomorphic Brushed Metal Toggle Switch UI for Phase 5 Checkpoint Dark Zone.
 * Adheres strictly to E2E test selectors:
 * - Container: #dark-zone-switch-panel, .dark-zone-switch-panel, [data-testid="dark-zone-switch-panel"]
 * - Toggle button: #toggle-switch-lever, .electric-toggle-switch, [data-testid="electric-toggle-switch"]
 * - Indicator LED: #switch-indicator-led, .switch-indicator-led
 */

import { audioManager } from '../audio/AudioManager';

export interface ElectricSwitchOverlayOptions {
  onToggle?: (isOn: boolean) => void;
  initiallyOn?: boolean;
}

export class ElectricSwitchOverlay {
  private container: HTMLDivElement;
  private leverBtn: HTMLButtonElement;
  private ledEl: HTMLDivElement;
  private promptTextEl: HTMLParagraphElement;

  public isOn: boolean = false;
  public isVisible: boolean = false;
  public onToggle?: (isOn: boolean) => void;

  private boundOnKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private debounceTimer: number = 0;

  constructor(options?: ElectricSwitchOverlayOptions) {
    this.isOn = options?.initiallyOn ?? false;
    this.onToggle = options?.onToggle;

    this.injectStyles();

    this.container = document.createElement('div');
    this.container.id = 'dark-zone-switch-panel';
    this.container.className = 'dark-zone-switch-panel';
    this.container.setAttribute('data-testid', 'dark-zone-switch-panel');

    this.container.innerHTML = `
      <div class="switch-chassis">
        <!-- Elegant Header Typography -->
        <div class="switch-header">
          <div class="switch-title">CHIẾC ĐÈN CỦA BẠN</div>
          <div class="switch-subtitle">CÔNG TẮC BÓNG LED</div>
        </div>

        <!-- Center Mechanism Area -->
        <div class="switch-mechanism-row">
          <div class="switch-label-col">
            <span class="label-txt on-label">BẬT</span>
            <span class="label-txt off-label">TẮT</span>
          </div>

          <div class="switch-well">
            <button
              id="toggle-switch-lever"
              class="electric-toggle-switch ${this.isOn ? 'state-on' : 'state-off'}"
              data-testid="electric-toggle-switch"
              role="switch"
              aria-checked="${this.isOn ? 'true' : 'false'}"
              aria-label="Công tắc đèn lồng của bạn"
              title="Gạt công tắc đèn lồng [Phím E]"
            >
              <div class="lever-shaft">
                <div class="lever-knob"></div>
              </div>
            </button>
          </div>

          <div class="switch-indicator-col">
            <div
              id="switch-indicator-led"
              class="switch-indicator-led ${this.isOn ? 'led-on' : 'led-off'}"
              title="Trạng thái bóng LED"
            ></div>
            <span class="led-subtext">${this.isOn ? 'LED ON' : 'LED OFF'}</span>
          </div>
        </div>

        <!-- Hotkey Helper Prompt -->
        <p class="switch-prompt-helper">Nhấn <strong>[E]</strong> hoặc gạt cần công tắc</p>
      </div>
    `;

    document.body.appendChild(this.container);

    this.leverBtn = this.container.querySelector('#toggle-switch-lever')!;
    this.ledEl = this.container.querySelector('#switch-indicator-led')!;
    this.promptTextEl = this.container.querySelector('.switch-prompt-helper')!;

    this.setupEvents();
  }

  private setupEvents(): void {
    // Click on toggle lever
    this.leverBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleUserToggle();
    });

    // Keyboard shortcut [E] or [Space] (when panel visible)
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (!this.isVisible) return;
      if (e.code === 'KeyE') {
        e.preventDefault();
        this.handleUserToggle();
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  private handleUserToggle(): void {
    const now = Date.now();
    if (now - this.debounceTimer < 140) return; // 140ms debounce against jitter
    this.debounceTimer = now;

    const nextState = !this.isOn;
    this.setSwitchState(nextState, true /* triggerCallback */);
  }

  /**
   * Sets the physical switch state visually and triggers procedural audio
   */
  public setSwitchState(isOn: boolean, triggerCallback: boolean = false): void {
    this.isOn = isOn;

    // Update DOM classes & ARIA
    this.leverBtn.classList.remove('state-on', 'state-off');
    this.leverBtn.classList.add(isOn ? 'state-on' : 'state-off');
    this.leverBtn.setAttribute('aria-checked', isOn ? 'true' : 'false');

    this.ledEl.classList.remove('led-on', 'led-off');
    this.ledEl.classList.add(isOn ? 'led-on' : 'led-off');

    const ledSubtext = this.container.querySelector('.led-subtext');
    if (ledSubtext) {
      ledSubtext.textContent = isOn ? 'LED ON' : 'LED OFF';
    }

    // Play tactile mechanical switch "tách" audio
    audioManager.playMechanicalSwitchClick();

    if (triggerCallback && this.onToggle) {
      this.onToggle(this.isOn);
    }
  }

  /**
   * Smoothly slides the panel into the viewport
   */
  public show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.container.classList.add('visible');
  }

  /**
   * Smoothly hides the panel from the viewport
   */
  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.container.classList.remove('visible');
  }

  public destroy(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
      this.boundOnKeyDown = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  private injectStyles(): void {
    if (document.getElementById('electric-switch-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'electric-switch-styles';
    styleEl.textContent = `
      .dark-zone-switch-panel {
        position: fixed;
        bottom: 120px;
        right: 42px;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transform: translateY(24px) scale(0.95);
        transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        perspective: 800px;
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        user-select: none;
        -webkit-user-select: none;
      }

      .dark-zone-switch-panel.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }

      /* Refined Glassmorphic Mid-Autumn Switch Chassis */
      .switch-chassis {
        position: relative;
        width: 210px;
        padding: 16px 18px 12px 18px;
        background: radial-gradient(circle at center, rgba(20, 28, 48, 0.94) 0%, rgba(10, 15, 28, 0.96) 100%);
        border: 1px solid rgba(244, 196, 102, 0.45);
        border-radius: 16px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow:
          0 16px 36px rgba(0, 0, 0, 0.75),
          0 0 20px rgba(244, 196, 102, 0.15),
          inset 0 1px 1px rgba(255, 255, 255, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
      }

      /* Header Typography */
      .switch-header {
        text-align: center;
      }
      .switch-title {
        font-size: 0.92rem;
        letter-spacing: 0.14em;
        font-weight: 700;
        color: #f4c466;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.9), 0 0 10px rgba(244, 196, 102, 0.4);
      }
      .switch-subtitle {
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 0.68rem;
        letter-spacing: 0.08em;
        color: #9cb1d4;
        margin-top: 2px;
      }

      /* Mechanism Row */
      .switch-mechanism-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 4px 6px;
        box-sizing: border-box;
      }

      .switch-label-col {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 52px;
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        color: #8da2c0;
      }
      .on-label { color: #4ade80; }
      .off-label { color: #f87171; }

      /* Recessed Well */
      .switch-well {
        position: relative;
        width: 58px;
        height: 64px;
        background: #0d121c;
        border-radius: 29px;
        box-shadow:
          inset 0 4px 8px rgba(0, 0, 0, 0.95),
          inset 0 -2px 4px rgba(255, 255, 255, 0.08),
          0 1px 1px rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #232b3a;
      }

      /* Tactile Bat Lever */
      .electric-toggle-switch {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        width: 32px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        perspective: 200px;
      }

      .lever-shaft {
        position: relative;
        width: 12px;
        height: 38px;
        background: linear-gradient(to right, #cfd7e6 0%, #ffffff 45%, #94a3b8 100%);
        border-radius: 6px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
        transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.25, 1.25);
        transform-origin: 50% 85%;
      }

      .lever-knob {
        position: absolute;
        top: -6px;
        left: -3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #ffffff 0%, #cbd5e1 55%, #64748b 100%);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.9);
      }

      /* Lever 3D Rotations */
      .electric-toggle-switch.state-off .lever-shaft {
        transform: rotateX(28deg);
      }
      .electric-toggle-switch.state-on .lever-shaft {
        transform: rotateX(-28deg);
      }

      /* LED Indicator Column */
      .switch-indicator-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 52px;
      }

      .switch-indicator-led {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        transition: all 0.25s ease;
      }

      .switch-indicator-led.led-off {
        background: #3e0c0c;
        border: 1px solid #631717;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);
      }

      .switch-indicator-led.led-on {
        background: #22c55e;
        border: 1px solid #86efac;
        box-shadow:
          0 0 10px #22c55e,
          0 0 22px rgba(34, 197, 94, 0.7),
          inset 0 1px 2px rgba(255, 255, 255, 0.8);
      }

      .led-subtext {
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #8da2c0;
      }

      /* Helper Prompt */
      .switch-prompt-helper {
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 0.76rem;
        color: #cbd5e1;
        margin: 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
      }
      .switch-prompt-helper strong {
        color: #f4c466;
      }
    `;
    document.head.appendChild(styleEl);
  }
}
