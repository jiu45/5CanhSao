/**
 * LionDanceGestureOverlay
 * Renders an artistic minimalist Vietnamese paper-mache lion head interior:
 * - Dark Crimson Barrel Vignette (intimate helmet cavity, no stage curtains)
 * - Rustic curved bamboo ribs & delicate red fringe silhouettes at the top
 * - Two bouncing brass bells with red tassels
 * - Solid double-strut bamboo jaw rim at the bottom
 * - Responsive spring-bounce roll & moonward pitch dynamics
 * - Luminous Mid-Autumn calligraphy gesture arcs with clean transition cleanup
 */
export interface GestureTemplate {
  id: number;
  title: string;
  sub: string;
  getPoint: (t: number) => { x: number; y: number };
  checkMatch: (points: { x: number; y: number }[]) => boolean;
}

export class LionDanceGestureOverlay {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bannerEl: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private subEl: HTMLDivElement;
  private feedbackEl: HTMLDivElement;

  // Screen resolution
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;
  private dpr: number = Math.min(window.devicePixelRatio || 1, 2);

  // Minigame State
  public isActive: boolean = false;
  private currentGestureIndex: number = 0;
  private gestures: GestureTemplate[] = [];
  private onGestureDone?: (index: number) => void;
  private onAllDone?: () => void;
  private onDragOffset?: (dx: number, dy: number) => void;
  public onCameraDynamics?: (roll: number, pitch: number, yaw: number) => void;

  // Pointer state
  private isPointerDown: boolean = false;
  private userPath: { x: number; y: number; time: number }[] = [];
  public currentDragOffset = { x: 0, y: 0 };

  // Physical dynamics of the lion mask
  public cameraRoll: number = 0;
  public cameraPitch: number = 0;
  public cameraYaw: number = 0;
  private rollVelocity: number = 0;
  private pitchVelocity: number = 0;
  private targetPitch: number = 0;
  private bellDisplacement: number = 0;
  private bellVelocity: number = 0;
  private tasselAngle: number = 0;

  // Visual effects (Sparks & Golden Glitter Flakes)
  private sparkParticles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    isGlitter?: boolean;
    swayPhase?: number;
  }[] = [];

  // Silk Cloth Transition wipe state
  private transitionActive: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 1.6;
  private transitionTimer: number = 0;
  private transitionOnPeak?: () => void;
  private transitionOnComplete?: () => void;
  private transitionPeakCalled: boolean = false;

  // Animation frame
  private animId: number = 0;
  private lastTime: number = performance.now();

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'lion-gesture-overlay-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 28;
      overflow: hidden;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    this.ctx = this.canvas.getContext('2d')!;
    this.container.appendChild(this.canvas);

    // Prompt & Title banner
    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'lion-gesture-banner';
    this.bannerEl.style.cssText = `
      position: absolute;
      top: 8%;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
      pointer-events: none;
      width: auto;
      max-width: 640px;
      background: rgba(14, 2, 2, 0.78);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(245, 158, 11, 0.38);
      border-radius: 28px;
      padding: 12px 32px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(220, 38, 38, 0.15);
      z-index: 30;
    `;
    this.bannerEl.innerHTML = `
      <div class="lion-gesture-title" style="
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 1.45rem;
        letter-spacing: 0.14em;
        color: #fef08a;
        text-shadow: 0 0 18px rgba(245, 158, 11, 0.9), 0 2px 10px rgba(0,0,0,0.95);
      "></div>
      <div class="lion-gesture-sub" style="
        font-family: 'Segoe UI', system-ui, Arial, sans-serif;
        font-size: 0.95rem;
        color: #fffaf0;
        margin-top: 5px;
        text-shadow: 0 2px 6px rgba(0,0,0,0.9);
      "></div>
    `;
    this.container.appendChild(this.bannerEl);
    this.titleEl = this.bannerEl.querySelector('.lion-gesture-title')!;
    this.subEl = this.bannerEl.querySelector('.lion-gesture-sub')!;

    // Popup feedback
    this.feedbackEl = document.createElement('div');
    this.feedbackEl.className = 'lion-gesture-feedback';
    this.feedbackEl.style.cssText = `
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 0;
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      font-size: 2.3rem;
      font-weight: 700;
      color: #ffd700;
      text-shadow: 0 0 28px rgba(255, 215, 0, 0.95), 0 0 50px rgba(220, 38, 38, 0.85);
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 32;
    `;
    this.container.appendChild(this.feedbackEl);

    document.body.appendChild(this.container);

    this.initGestures();
    this.setupListeners();
    this.resize();

    // Start render loop
    this.render = this.render.bind(this);
    this.render();
  }

  private initGestures() {
    // Gesture 1: Left to Right Arc (Lắc đầu sang phải)
    const gesture1: GestureTemplate = {
      id: 1,
      title: "Nhịp 1/3 · Sang phải",
      sub: "Vuốt một vòng cung sang phải",
      getPoint: (t: number) => {
        const x = 0.28 + t * 0.44; // 0.28 -> 0.72
        const y = 0.58 - Math.sin(t * Math.PI) * 0.12;
        return { x, y };
      },
      checkMatch: (points) => {
        if (points.length < 5) return false;
        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        return dx > 0.18 && start.x < 0.52;
      }
    };

    // Gesture 2: Right to Left Arc (Nghiêng đầu sang trái)
    const gesture2: GestureTemplate = {
      id: 2,
      title: "Nhịp 2/3 · Sang trái",
      sub: "Vuốt một vòng cung sang trái",
      getPoint: (t: number) => {
        const x = 0.72 - t * 0.44; // 0.72 -> 0.28
        const y = 0.56 - Math.sin(t * Math.PI) * 0.13;
        return { x, y };
      },
      checkMatch: (points) => {
        if (points.length < 5) return false;
        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        return dx < -0.18 && start.x > 0.48;
      }
    };

    // Gesture 3: Grand Upward Leap Arc (Chồm lân vút lên)
    const gesture3: GestureTemplate = {
      id: 3,
      title: "Nhịp 3/3 · Vút lên",
      sub: "Vuốt từ dưới lên",
      getPoint: (t: number) => {
        const x = 0.38 + t * 0.24; // 0.38 -> 0.62
        const y = 0.72 - t * 0.36; // 0.72 -> 0.36
        return { x, y };
      },
      checkMatch: (points) => {
        if (points.length < 5) return false;
        const start = points[0];
        const end = points[points.length - 1];
        const dy = start.y - end.y;
        return dy > 0.18 && start.y > 0.48;
      }
    };

    this.gestures = [gesture1, gesture2, gesture3];
  }

  private setupListeners() {
    window.addEventListener('resize', () => this.resize());

    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (!this.isActive) return;
      this.isPointerDown = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const normX = clientX / this.width;
      const normY = clientY / this.height;

      this.userPath = [{ x: normX, y: normY, time: performance.now() }];
      this.addTouchSparks(clientX, clientY, 6);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isActive || !this.isPointerDown) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const normX = clientX / this.width;
      const normY = clientY / this.height;

      this.userPath.push({ x: normX, y: normY, time: performance.now() });
      this.addTouchSparks(clientX, clientY, 2);

      // Realtime tactile tilt feedback
      if (this.userPath.length > 1) {
        const start = this.userPath[0];
        const dx = (normX - start.x) * 2.0;
        const dy = (normY - start.y) * 2.0;
        this.currentDragOffset = { x: dx, y: dy };

        // Dragging subtly biases roll and sway
        this.cameraRoll = dx * 0.05;
        this.tasselAngle = -dx * 0.35;
        this.bellVelocity += (Math.abs(dx) + Math.abs(dy)) * 6;

        if (this.onDragOffset) {
          this.onDragOffset(dx, dy);
        }
      }

      // Check for match
      const curGesture = this.gestures[this.currentGestureIndex];
      if (curGesture && curGesture.checkMatch(this.userPath)) {
        this.triggerGestureSuccess();
      }
    };

    const handleUp = () => {
      if (!this.isActive) return;
      this.isPointerDown = false;
      this.currentDragOffset = { x: 0, y: 0 };

      if (this.onDragOffset) {
        this.onDragOffset(0, 0);
      }

      const curGesture = this.gestures[this.currentGestureIndex];
      if (curGesture && curGesture.checkMatch(this.userPath)) {
        this.triggerGestureSuccess();
      }
      this.userPath = [];
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    window.addEventListener('touchstart', handleDown, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  public setOnDragOffset(cb: (dx: number, dy: number) => void) {
    this.onDragOffset = cb;
  }

  // ===========================================================================
  // TRANSITIONS: CINEMATIC SILK CLOTH SWEEPS (Cleanly bounded, no stray lines)
  // ===========================================================================
  public startTransitionIn(durationMs: number = 1800, onPeak?: () => void, onComplete?: () => void) {
    this.transitionActive = true;
    this.transitionTimer = 0;
    this.transitionDuration = durationMs / 1000;
    this.transitionProgress = 0;
    this.transitionOnPeak = onPeak;
    this.transitionOnComplete = onComplete;
    this.transitionPeakCalled = false;
    this.userPath = []; // Clean up any active gesture path
  }

  public startTransitionOut(durationMs: number = 1800, onPeak?: () => void, onComplete?: () => void) {
    this.userPath = []; // Clean up any remaining gesture artifacts
    this.startTransitionIn(durationMs, onPeak, onComplete);
  }

  // ===========================================================================
  // MINIGAME CONTROL
  // ===========================================================================
  public startMinigame(onGestureDone?: (index: number) => void, onAllDone?: () => void) {
    this.isActive = true;
    this.container.style.pointerEvents = 'auto';
    this.currentGestureIndex = 0;
    this.onGestureDone = onGestureDone;
    this.onAllDone = onAllDone;
    this.cameraRoll = 0;
    this.rollVelocity = 0;
    this.cameraPitch = 0;
    this.pitchVelocity = 0;
    this.targetPitch = 0;
    this.bellVelocity = 30; // initial cheerful chime
    this.userPath = [];
    this.showCurrentGesturePrompt();
  }

  public stopMinigame() {
    this.isActive = false;
    this.container.style.pointerEvents = 'none';
    this.bannerEl.style.opacity = '0';
    this.bannerEl.style.transform = 'translateX(-50%) translateY(-20px)';
    this.userPath = [];
  }

  private showCurrentGesturePrompt() {
    if (this.currentGestureIndex >= this.gestures.length) {
      this.stopMinigame();
      if (this.onAllDone) {
        this.onAllDone();
      }
      return;
    }

    const g = this.gestures[this.currentGestureIndex];
    this.titleEl.textContent = g.title;
    this.subEl.textContent = g.sub;

    this.bannerEl.style.opacity = '1';
    this.bannerEl.style.transform = 'translateX(-50%) translateY(0)';
  }

  private triggerGestureSuccess() {
    if (!this.isActive) return;
    const completedIndex = this.currentGestureIndex;

    // Show big celebration feedback text
    const cheers = ["Cắc–tùng!", "Xoèng!", "Tùng!"];
    this.feedbackEl.textContent = cheers[completedIndex % cheers.length];
    this.feedbackEl.style.opacity = '1';
    this.feedbackEl.style.transform = 'translate(-50%, -50%) scale(1.15)';

    // Dynamic Camera Shake & Spring Bounce
    if (completedIndex === 0) {
      // Swipe Right -> Snap right +5 deg (0.088 rad) then spring bounce back to center!
      this.cameraRoll = 0.088;
      this.rollVelocity = -1.8;
      this.tasselAngle = -0.55;
      this.bellVelocity = 45;
      this.addGlitterFlakes(30);
    } else if (completedIndex === 1) {
      // Swipe Left -> Snap left -5 deg (-0.088 rad) then spring bounce back to center!
      this.cameraRoll = -0.088;
      this.rollVelocity = 1.8;
      this.tasselAngle = 0.55;
      this.bellVelocity = 45;
      this.addGlitterFlakes(30);
    } else if (completedIndex === 2) {
      // Leap Up -> Camera swoops high up toward the moon!
      this.targetPitch = 0.38; // ~22 deg upward tilt toward moon
      this.pitchVelocity = 0.8;
      this.bellVelocity = 80;
      this.addGlitterFlakes(50);
    }

    // Spark burst at gesture center
    const curG = this.gestures[completedIndex];
    const centerPt = curG.getPoint(0.5);
    this.addTouchSparks(centerPt.x * this.width, centerPt.y * this.height, 45);

    setTimeout(() => {
      this.feedbackEl.style.opacity = '0';
      this.feedbackEl.style.transform = 'translate(-50%, -50%) scale(0.6)';
    }, 700);

    if (this.onGestureDone) {
      this.onGestureDone(completedIndex);
    }

    this.currentGestureIndex++;
    this.userPath = [];
    this.isPointerDown = false;

    setTimeout(() => {
      this.showCurrentGesturePrompt();
    }, 900);
  }

  private addTouchSparks(x: number, y: number, count: number) {
    const colors = ['#fde047', '#f59e0b', '#ef4444', '#fbbf24', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 50;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.45 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      });
    }
  }

  // Delicate falling golden glitter flakes drifting downward
  private addGlitterFlakes(count: number) {
    for (let i = 0; i < count; i++) {
      this.sparkParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.35),
        vx: (Math.random() - 0.5) * 45,
        vy: Math.random() * 60 + 35,
        life: 0,
        maxLife: Math.random() * 1.5 + 1.0,
        color: Math.random() > 0.4 ? '#fef08a' : '#fbbf24',
        size: Math.random() * 3 + 1.5,
        isGlitter: true,
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ===========================================================================
  // MAIN RENDER LOOP (CANVAS)
  // ===========================================================================
  private render() {
    this.animId = requestAnimationFrame(this.render);

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) * 0.001);
    this.lastTime = now;
    const time = now * 0.001;

    // Update physical dynamics (harmonic spring roll & bell physics)
    this.updatePhysics(dt, time);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Artistic Minimalist Dark Crimson Vignette & Rustic Bamboo Framework
    if (this.isActive) {
      this.renderLionMaskInterior(ctx, time);
    }

    // 2. Draw Interactive Gesture Arc Guide
    if (this.isActive && this.currentGestureIndex < this.gestures.length) {
      this.renderGestureGuide(ctx, time);
      this.renderUserDrawing(ctx);
    }

    // 3. Update & Render Spark Particles & Glitter Flakes
    this.renderSparks(ctx, dt, time);

    // 4. Render Silk Cloth Wipe (Clean, strictly bounded)
    if (this.transitionActive) {
      this.renderSilkClothTransition(ctx, dt);
    }
  }

  private updatePhysics(dt: number, time: number) {
    // Harmonic Spring Roll physics: tilts 5 deg then springs back to center smoothly
    const springK = 65; // spring tension
    const dampingC = 9; // smooth damping
    const rollForce = -springK * this.cameraRoll - dampingC * this.rollVelocity;
    this.rollVelocity += rollForce * dt;
    this.cameraRoll += this.rollVelocity * dt;

    // Subtle gentle breathing oscillation
    const breathRoll = Math.sin(time * 3.5) * 0.008;

    // Pitch physics (soars up on move 3, then gently relaxes)
    this.cameraPitch += (this.targetPitch - this.cameraPitch) * Math.min(1, dt * 4.5);
    this.targetPitch *= Math.max(0, 1 - dt * 1.5);

    // Tassel swing relaxation
    this.tasselAngle += (0 - this.tasselAngle) * Math.min(1, dt * 4.0);

    // Bell spring physics
    const bellK = 140;
    const bellDamp = 8;
    const bellForce = -bellK * this.bellDisplacement - bellDamp * this.bellVelocity;
    this.bellVelocity += bellForce * dt;
    this.bellDisplacement += this.bellVelocity * dt;

    // Notify scene camera of dynamics
    if (this.onCameraDynamics) {
      this.onCameraDynamics(this.cameraRoll + breathRoll, this.cameraPitch, this.cameraYaw);
    }
  }

  // ===========================================================================
  // ARTISTIC LION HEAD COCKPIT FRAME (Handcrafted Bamboo Inner Ribs & Folk Accents)
  // ===========================================================================
  private renderLionMaskInterior(ctx: CanvasRenderingContext2D, time: number) {
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Mask roll rotation around center
    ctx.translate(w / 2, h / 2);
    ctx.rotate(this.cameraRoll);
    ctx.translate(-w / 2, -h / 2);

    const bobY = Math.sin(time * 3.5) * 3.5;
    const swayX = Math.cos(time * 2.2) * 4.5;

    // -------------------------------------------------------------------------
    // 0. ATMOSPHERIC SOFT RADIAL VIGNETTE
    // -------------------------------------------------------------------------
    const grad = ctx.createRadialGradient(
      w / 2 + swayX, h / 2 + bobY, Math.min(w, h) * 0.38,
      w / 2, h / 2, Math.max(w, h) * 0.76
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.68, 'rgba(120, 20, 15, 0.10)');
    grad.addColorStop(0.90, 'rgba(50, 8, 8, 0.45)');
    grad.addColorStop(1, 'rgba(25, 4, 4, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // -------------------------------------------------------------------------
    // 1. VIỀN 2 BÊN (LION HEAD INNER RIBS - VÒM CONG NAN TRE & GẤM ĐỎ CHU SA)
    // -------------------------------------------------------------------------
    const sideW = Math.max(75, w * 0.095); // ~8-10% of screen width

    // LEFT INNER RIB (Vòm sườn trái ôm nhẹ vào trong)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sideW * 0.65 + swayX * 0.5, 0);
    ctx.quadraticCurveTo(sideW + swayX, h * 0.5, sideW * 0.65 + swayX * 0.5, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    // Deep cinnabar red (#8B0000) with dark inner shadow and rustic texture
    const leftGrad = ctx.createLinearGradient(0, 0, sideW, 0);
    leftGrad.addColorStop(0, '#380404');
    leftGrad.addColorStop(0.35, '#6b0a0a');
    leftGrad.addColorStop(0.75, '#8B0000');
    leftGrad.addColorStop(1, '#520606');
    ctx.fillStyle = leftGrad;
    ctx.fill();

    // Inner shadow edge
    ctx.strokeStyle = 'rgba(20, 2, 2, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Left Bamboo Rib 1 (Outer structural rib)
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sideW * 0.35 + swayX * 0.4, 0);
    ctx.quadraticCurveTo(sideW * 0.68 + swayX * 0.8, h * 0.5, sideW * 0.35 + swayX * 0.4, h);
    ctx.stroke();
    // Rib 1 Golden bark highlight
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sideW * 0.33 + swayX * 0.4, 0);
    ctx.quadraticCurveTo(sideW * 0.66 + swayX * 0.8, h * 0.5, sideW * 0.33 + swayX * 0.4, h);
    ctx.stroke();

    // Left Bamboo Rib 2 (Inner contour rib along the curve)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sideW * 0.62 + swayX * 0.5, 0);
    ctx.quadraticCurveTo(sideW * 0.98 + swayX, h * 0.5, sideW * 0.62 + swayX * 0.5, h);
    ctx.stroke();
    // Rib 2 Golden bark highlight
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(sideW * 0.60 + swayX * 0.5, 0);
    ctx.quadraticCurveTo(sideW * 0.96 + swayX, h * 0.5, sideW * 0.60 + swayX * 0.5, h);
    ctx.stroke();

    // Twine bindings (Mối lạt buộc tre thủ công)
    [0.22, 0.50, 0.78].forEach(fy => {
      const knotY = h * fy;
      const knotX = (sideW * 0.62) + (sideW * 0.36) * Math.sin(fy * Math.PI) + swayX * 0.8;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(knotX - 5, knotY - 4, 10, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(knotX - 3, knotY - 2, 6, 4);
    });
    ctx.restore();

    // RIGHT INNER RIB (Vòm sườn phải ôm nhẹ vào trong)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - (sideW * 0.65 + swayX * 0.5), 0);
    ctx.quadraticCurveTo(w - (sideW + swayX), h * 0.5, w - (sideW * 0.65 + swayX * 0.5), h);
    ctx.lineTo(w, h);
    ctx.closePath();

    const rightGrad = ctx.createLinearGradient(w, 0, w - sideW, 0);
    rightGrad.addColorStop(0, '#380404');
    rightGrad.addColorStop(0.35, '#6b0a0a');
    rightGrad.addColorStop(0.75, '#8B0000');
    rightGrad.addColorStop(1, '#520606');
    ctx.fillStyle = rightGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(20, 2, 2, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Right Bamboo Rib 1 (Outer structural rib)
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w - (sideW * 0.35 + swayX * 0.4), 0);
    ctx.quadraticCurveTo(w - (sideW * 0.68 + swayX * 0.8), h * 0.5, w - (sideW * 0.35 + swayX * 0.4), h);
    ctx.stroke();
    // Highlight
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(w - (sideW * 0.33 + swayX * 0.4), 0);
    ctx.quadraticCurveTo(w - (sideW * 0.66 + swayX * 0.8), h * 0.5, w - (sideW * 0.33 + swayX * 0.4), h);
    ctx.stroke();

    // Right Bamboo Rib 2 (Inner contour rib along the curve)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w - (sideW * 0.62 + swayX * 0.5), 0);
    ctx.quadraticCurveTo(w - (sideW * 0.98 + swayX), h * 0.5, w - (sideW * 0.62 + swayX * 0.5), h);
    ctx.stroke();
    // Highlight
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(w - (sideW * 0.60 + swayX * 0.5), 0);
    ctx.quadraticCurveTo(w - (sideW * 0.96 + swayX), h * 0.5, w - (sideW * 0.60 + swayX * 0.5), h);
    ctx.stroke();

    // Twine bindings
    [0.22, 0.50, 0.78].forEach(fy => {
      const knotY = h * fy;
      const knotX = w - ((sideW * 0.62) + (sideW * 0.36) * Math.sin(fy * Math.PI) + swayX * 0.8);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(knotX - 5, knotY - 4, 10, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(knotX - 3, knotY - 2, 6, 4);
    });
    ctx.restore();

    // -------------------------------------------------------------------------
    // 2. VIỀN MÉP TRÊN: TRÁN VÀ BỜM LÂN (LÔNG/TUA RUA ĐỎ RỦ THẲNG & NẸP TRE CONG VÀNG ĐỒNG)
    // -------------------------------------------------------------------------
    ctx.save();
    // Cinnabar brow base
    const topCapGrad = ctx.createLinearGradient(0, 0, 0, 42);
    topCapGrad.addColorStop(0, '#380404');
    topCapGrad.addColorStop(0.6, '#8B0000');
    topCapGrad.addColorStop(1, '#6b0a0a');
    ctx.fillStyle = topCapGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, 36 + bobY);
    ctx.quadraticCurveTo(w * 0.5, 46 + bobY, 0, 36 + bobY);
    ctx.closePath();
    ctx.fill();

    // Dải nẹp tre cong màu vàng đồng (Arched Brass/Bamboo Brow Molding)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(0, 36 + bobY);
    ctx.quadraticCurveTo(w * 0.5, 46 + bobY, w, 36 + bobY);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(0, 35 + bobY);
    ctx.quadraticCurveTo(w * 0.5, 45 + bobY, w, 35 + bobY);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 34 + bobY);
    ctx.quadraticCurveTo(w * 0.5, 44 + bobY, w, 34 + bobY);
    ctx.stroke();

    // Viền lông/tua rua đỏ rủ thẳng nhẹ nhàng xuống (Fur / Fringe Trim)
    const numFringes = 64;
    const fringeColors = ['#b91c1c', '#dc2626', '#991b1b', '#ef4444', '#7f1d1d'];
    ctx.lineCap = 'round';
    for (let i = 0; i < numFringes; i++) {
      const u = i / (numFringes - 1);
      const fx = u * w;
      const browBaseY = 36 + Math.sin(u * Math.PI) * 10 + bobY;
      const flen = 16 + (i % 4) * 3.5 + Math.sin(i * 1.5) * 4;
      const fsway = Math.sin(time * 3.2 + i * 0.3) * 2.2;
      const col = fringeColors[i % fringeColors.length];

      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(fx, browBaseY);
      ctx.quadraticCurveTo(fx + fsway * 0.4, browBaseY + flen * 0.5, fx + fsway, browBaseY + flen);
      ctx.stroke();

      // Occasional shimmering gold fur strands
      if (i % 7 === 3) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx + 1, browBaseY);
        ctx.quadraticCurveTo(fx + 1 + fsway * 0.4, browBaseY + (flen - 2) * 0.5, fx + 1 + fsway, browBaseY + flen - 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // 2B. HAI QUẢ CHUÔNG ĐỒNG NHỎ Ở HAI GÓC TRÊN (Nảy nhẹ theo nhịp múa)
    // -------------------------------------------------------------------------
    const bellYOffset = Math.max(-18, Math.min(22, this.bellDisplacement));
    [-1, 1].forEach(side => {
      const anchorX = side === -1 ? w * 0.11 + swayX : w * 0.89 + swayX;
      const anchorY = 34 + bobY;
      const bellSwing = (this.tasselAngle + Math.sin(time * 3.5 + (side === -1 ? 0 : 1.2)) * 0.12) * 28;

      const bellX = anchorX + bellSwing;
      const bellY = anchorY + 44 + bellYOffset;

      // Braided red cord
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(bellX, bellY);
      ctx.stroke();

      // Shiny Brass Bell Dome
      ctx.save();
      ctx.translate(bellX, bellY);
      ctx.rotate(bellSwing * 0.02);

      const bellGrad = ctx.createLinearGradient(-10, -12, 10, 10);
      bellGrad.addColorStop(0, '#fef08a');
      bellGrad.addColorStop(0.4, '#f59e0b');
      bellGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = bellGrad;

      ctx.beginPath();
      ctx.moveTo(-10, 3);
      ctx.quadraticCurveTo(-9, -11, 0, -12);
      ctx.quadraticCurveTo(9, -11, 10, 3);
      ctx.lineTo(12, 7);
      ctx.lineTo(-12, 7);
      ctx.closePath();
      ctx.fill();

      // Bell rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Clapper
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 9, 3, 0, Math.PI * 2);
      ctx.fill();

      // Dangling crimson silk tassel
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(4, 10);
      ctx.lineTo(6 + bellSwing * 0.25, 38);
      ctx.lineTo(-6 + bellSwing * 0.25, 38);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // -------------------------------------------------------------------------
    // 3. HOÀN THIỆN VIỀN DƯỚI: HÀM TRE ĐÔI VỮNG CHÃI & 2 CỤM RÂU LÂN VÀNG
    // -------------------------------------------------------------------------
    ctx.save();
    // Dark bottom shadow backing
    const bottomCapGrad = ctx.createLinearGradient(0, h, 0, h - 75);
    bottomCapGrad.addColorStop(0, 'rgba(18, 3, 3, 0.98)');
    bottomCapGrad.addColorStop(0.65, 'rgba(32, 5, 5, 0.75)');
    bottomCapGrad.addColorStop(1, 'rgba(32, 5, 5, 0)');
    ctx.fillStyle = bottomCapGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h - 28 - bobY);
    ctx.quadraticCurveTo(w * 0.5, h - 65 - bobY, 0, h - 28 - bobY);
    ctx.closePath();
    ctx.fill();

    // Upper Primary Bamboo Rim Rail (Thanh nan tre hàm trên)
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.03, h - 28 - bobY);
    ctx.quadraticCurveTo(w * 0.5, h - 65 - bobY, w * 0.97, h - 28 - bobY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, h - 29 - bobY);
    ctx.quadraticCurveTo(w * 0.5, h - 66 - bobY, w * 0.96, h - 29 - bobY);
    ctx.stroke();

    // Lower Parallel Bamboo Rim Rail (Thanh nan tre hàm dưới)
    ctx.strokeStyle = '#3e2010';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h - 14 - bobY);
    ctx.quadraticCurveTo(w * 0.5, h - 45 - bobY, w * 0.95, h - 14 - bobY);
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h - 15 - bobY);
    ctx.quadraticCurveTo(w * 0.5, h - 46 - bobY, w * 0.95, h - 15 - bobY);
    ctx.stroke();

    // Vertical bamboo tying struts linking the double rails (Các thanh giằng nan tre buộc lạt)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    for (let s = 2; s <= 8; s++) {
      const sx = (s / 10) * w;
      const upperY = h - 28 - Math.sin((s / 10) * Math.PI) * 37 - bobY;
      const lowerY = h - 14 - Math.sin((s / 10) * Math.PI) * 31 - bobY;
      ctx.beginPath();
      ctx.moveTo(sx, upperY);
      ctx.lineTo(sx, lowerY);
      ctx.stroke();

      // Binding twine knot (Mối buộc lạt vàng)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(sx - 3, upperY - 2, 6, 4);
    }

    // -------------------------------------------------------------------------
    // 3B. 2 CỤM RÂU LÂN VÀNG UỐN LƯỢN PHONG THÁI DÂN GIAN Ở HAI GÓC ĐÁY
    // (Traditional Golden Curled Lion Whiskers / Flame Cloud Swirls)
    // -------------------------------------------------------------------------
    // LEFT WHISKER CLUSTER (Góc đáy trái)
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Whisker 1: Grand sweeping upward spiral curl
    const wGradL = ctx.createLinearGradient(w * 0.04, h - 20, w * 0.12, h - 110);
    wGradL.addColorStop(0, '#d97706');
    wGradL.addColorStop(0.5, '#f59e0b');
    wGradL.addColorStop(1, '#fef08a');
    ctx.strokeStyle = wGradL;
    ctx.lineWidth = 4.2;

    ctx.beginPath();
    ctx.moveTo(w * 0.04, h - 20 - bobY);
    ctx.bezierCurveTo(w * 0.10, h - 60 - bobY, w * 0.13, h - 98 - bobY, w * 0.08, h - 108 - bobY);
    ctx.bezierCurveTo(w * 0.05, h - 114 - bobY, w * 0.035, h - 92 - bobY, w * 0.07, h - 84 - bobY);
    ctx.stroke();

    // Whisker 2: Middle outward flourish
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h - 30 - bobY);
    ctx.bezierCurveTo(w * 0.11, h - 48 - bobY, w * 0.14, h - 72 - bobY, w * 0.105, h - 86 - bobY);
    ctx.stroke();

    // Whisker 3: Lower curled tuft
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.07, h - 15 - bobY);
    ctx.bezierCurveTo(w * 0.12, h - 28 - bobY, w * 0.14, h - 46 - bobY, w * 0.11, h - 54 - bobY);
    ctx.stroke();
    ctx.restore();

    // RIGHT WHISKER CLUSTER (Góc đáy phải)
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const wGradR = ctx.createLinearGradient(w * 0.96, h - 20, w * 0.88, h - 110);
    wGradR.addColorStop(0, '#d97706');
    wGradR.addColorStop(0.5, '#f59e0b');
    wGradR.addColorStop(1, '#fef08a');
    ctx.strokeStyle = wGradR;
    ctx.lineWidth = 4.2;

    // Whisker 1: Grand sweeping upward spiral curl
    ctx.beginPath();
    ctx.moveTo(w * 0.96, h - 20 - bobY);
    ctx.bezierCurveTo(w * 0.90, h - 60 - bobY, w * 0.87, h - 98 - bobY, w * 0.92, h - 108 - bobY);
    ctx.bezierCurveTo(w * 0.95, h - 114 - bobY, w * 0.965, h - 92 - bobY, w * 0.93, h - 84 - bobY);
    ctx.stroke();

    // Whisker 2: Middle outward flourish
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.95, h - 30 - bobY);
    ctx.bezierCurveTo(w * 0.89, h - 48 - bobY, w * 0.86, h - 72 - bobY, w * 0.895, h - 86 - bobY);
    ctx.stroke();

    // Whisker 3: Lower curled tuft
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.93, h - 15 - bobY);
    ctx.bezierCurveTo(w * 0.88, h - 28 - bobY, w * 0.86, h - 46 - bobY, w * 0.89, h - 54 - bobY);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    ctx.restore();
  }

  // Renders the luminous golden calligraphy arc with guiding star
  private renderGestureGuide(ctx: CanvasRenderingContext2D, time: number) {
    const curG = this.gestures[this.currentGestureIndex];
    if (!curG) return;

    ctx.save();
    const w = this.width;
    const h = this.height;

    // Outer glow for the path
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.32)';

    ctx.beginPath();
    for (let t = 0; t <= 1.0; t += 0.02) {
      const pt = curG.getPoint(t);
      if (t === 0) ctx.moveTo(pt.x * w, pt.y * h);
      else ctx.lineTo(pt.x * w, pt.y * h);
    }
    ctx.stroke();

    // Core bright calligraphy path
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fef08a';
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.stroke();

    // Animated Golden Guide Star flowing along the curve
    const guideT = (time * 0.65) % 1.0;
    const guidePos = curG.getPoint(guideT);
    const gx = guidePos.x * w;
    const gy = guidePos.y * h;

    // Glowing guide orb
    const radGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 26);
    radGrad.addColorStop(0, '#ffffff');
    radGrad.addColorStop(0.35, '#fef08a');
    radGrad.addColorStop(0.7, '#f59e0b');
    radGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Tiny star sparkles around guide
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Renders the player's vibrant golden dragon trail
  private renderUserDrawing(ctx: CanvasRenderingContext2D) {
    if (this.userPath.length < 2) return;

    ctx.save();
    const w = this.width;
    const h = this.height;

    ctx.shadowBlur = 16;
    ctx.shadowColor = '#f97316';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fbbf24';

    ctx.beginPath();
    this.userPath.forEach((pt, idx) => {
      const px = pt.x * w;
      const py = pt.y * h;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Hot white inner core
    ctx.lineWidth = 3.8;
    ctx.strokeStyle = '#fffbeb';
    ctx.stroke();

    ctx.restore();
  }

  // Renders spark particles & drifting golden glitter flakes
  private renderSparks(ctx: CanvasRenderingContext2D, dt: number, time: number) {
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const p = this.sparkParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.sparkParticles.splice(i, 1);
        continue;
      }

      if (p.isGlitter) {
        // Floating gentle glitter drift
        p.x += Math.sin(time * 3.0 + (p.swayPhase || 0)) * 25 * dt;
        p.y += p.vy * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt; // gravity
      }

      const alpha = 1.0 - p.life / p.maxLife;
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowBlur = p.isGlitter ? 10 : 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Cinematic Silk Cloth Wipe (Clean, strictly bounded inside the silk polygon)
  private renderSilkClothTransition(ctx: CanvasRenderingContext2D, dt: number) {
    this.transitionTimer += dt;
    this.transitionProgress = Math.min(1.0, this.transitionTimer / this.transitionDuration);

    const t = this.transitionProgress;
    const w = this.width;
    const h = this.height;

    // Peak check (halfway when screen is fully covered by silk)
    if (t >= 0.5 && !this.transitionPeakCalled) {
      this.transitionPeakCalled = true;
      if (this.transitionOnPeak) {
        this.transitionOnPeak();
      }
    }

    const coverage = Math.sin(t * Math.PI);

    // Only render when coverage is meaningful (strictly prevents stray lines at edges!)
    if (coverage > 0.03) {
      ctx.save();
      const curtainX = (t - 0.5) * w * 2.2;
      const wave1 = Math.sin(t * 12.0) * 80;
      const wave2 = Math.cos(t * 9.0) * 60;

      // Primary Deep Red Brocade Silk Curtain Path
      ctx.beginPath();
      ctx.moveTo(curtainX - w * 0.8, 0);
      ctx.bezierCurveTo(curtainX + wave1, h * 0.35, curtainX - wave2, h * 0.65, curtainX + w * 0.8, h);
      ctx.lineTo(curtainX - w * 1.5, h);
      ctx.lineTo(curtainX - w * 1.5, 0);
      ctx.closePath();

      // Clip embroidery and gradient STRICTLY inside the silk curtain polygon!
      // This completely prevents any stray embroidery lines from extending onto the empty screen!
      ctx.save();
      ctx.clip();

      const silkGrad = ctx.createLinearGradient(curtainX - 300, 0, curtainX + 300, h);
      silkGrad.addColorStop(0, 'rgba(185, 28, 28, 0)');
      silkGrad.addColorStop(0.3, `rgba(185, 28, 28, ${0.98 * coverage})`);
      silkGrad.addColorStop(0.5, `rgba(220, 38, 38, ${1.0 * coverage})`);
      silkGrad.addColorStop(0.7, `rgba(185, 28, 28, ${0.98 * coverage})`);
      silkGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
      ctx.fillStyle = silkGrad;
      ctx.fillRect(0, 0, w, h);

      // Golden Embroidery Threads (safely clipped inside the silk cloth)
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.85 * coverage})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(curtainX - w * 0.6, 0);
      ctx.bezierCurveTo(curtainX + wave1 + 30, h * 0.35, curtainX - wave2 + 30, h * 0.65, curtainX + w * 0.9, h);
      ctx.stroke();

      ctx.restore(); // end clip
      ctx.restore(); // end canvas save
    }

    if (t >= 1.0) {
      this.transitionActive = false;
      this.userPath = []; // Clean up gesture path completely
      if (this.transitionOnComplete) {
        this.transitionOnComplete();
      }
    }
  }

  public destroy() {
    cancelAnimationFrame(this.animId);
    this.container.remove();
  }
}
