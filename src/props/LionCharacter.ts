import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';
import { audioManager } from '../audio/AudioManager';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotationSpeed: number;
}

interface PerformerLeg {
  group: THREE.Group;
  thigh: THREE.Mesh;
  calf: THREE.Mesh;
  cuff: THREE.Mesh;
  shoe: THREE.Mesh;
  baseX: number;
  baseZ: number;
  isFront: boolean;
}

export class LionCharacter {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public bodySegments: THREE.Group[] = [];
  private eyelids: THREE.Mesh[] = [];
  private ears: THREE.Group[] = [];
  private tail: THREE.Mesh;
  private ribbon: THREE.Mesh;
  private performerLegs: PerformerLeg[] = [];
  private shadowMesh: THREE.Mesh;

  // Particle FX (Sparks & Stage Smoke)
  private particles: Particle[] = [];
  private sparkTex: THREE.Texture;
  private smokeTex: THREE.Texture;
  private sparkGeo: THREE.PlaneGeometry;
  private smokeGeo: THREE.PlaneGeometry;

  // Animation states
  public isPeeking: boolean = false;
  public isLeaping: boolean = false;
  public leapProgress: number = 0;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private blinkProgress: number = 0;
  private earTwitchTimer: number = 0;
  private stompTimer: number = 0;

  // Positions close to player inside intimate circle
  public hiddenPosition = new THREE.Vector3(-7.5, 0.0, -8.0);
  public peekPosition = new THREE.Vector3(-3.2, 0.0, -5.6);
  public centerPosition = new THREE.Vector3(0, 0.0, -4.8);

  // Bow & Gesture Reaction states
  public isBowing: boolean = false;
  private bowTimer: number = 0;
  private gestureReactionType: 'none' | 'nodRight' | 'rollLeft' | 'rearUp' = 'none';
  private gestureReactionTimer: number = 0;

  constructor() {
    this.group = new THREE.Group();

    this.sparkTex = TextureGenerator.createSparkTexture();
    this.smokeTex = TextureGenerator.createFestivalSmokeTexture();
    this.sparkGeo = new THREE.PlaneGeometry(0.35, 0.35);
    this.smokeGeo = new THREE.PlaneGeometry(0.85, 0.85);

    // =========================================================================
    // 0. Dynamic Courtyard Ground Shadow (Soft blurred contact shadow)
    // =========================================================================
    const shadowTex = TextureGenerator.createSoftShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(2.8, 2.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.set(0, 0.015, -0.6);
    this.group.add(this.shadowMesh);

    // =========================================================================
    // 1. Lion Head & Expressive Facial Features
    // =========================================================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.42, 0.65);

    const headTex = TextureGenerator.createLionHeadTexture();
    const headGeo = new THREE.PlaneGeometry(2.1, 2.1);
    const headMat = new THREE.MeshBasicMaterial({
      map: headTex,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    this.headGroup.add(headMesh);

    // Mechanical Eyelids that slide over almond eyes (Traditional Vietnamese Craft)
    // Eyelids slide down over the eye pupils and snap open to drum beats!
    const eyelidGeo = new THREE.PlaneGeometry(0.28, 0.18);
    const eyelidMat = new THREE.MeshBasicMaterial({
      color: 0x991b1b,
      transparent: true,
      opacity: 0.98
    });
    [-0.30, 0.30].forEach(ex => {
      const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat.clone());
      eyelid.position.set(ex, 0.14, 0.025);
      eyelid.scale.set(1.0, 0.001, 1.0);
      eyelid.visible = false; // Never render the red plane over an open eye.
      this.headGroup.add(eyelid);
      this.eyelids.push(eyelid);
    });

    // Traditional Fan/Leaf Shaped Ears with Golden Fur Trim
    [-0.70, 0.70].forEach((earX, idx) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(earX, 0.70, 0.02);

      const earGeo = new THREE.PlaneGeometry(0.48, 0.6);
      const earTex = TextureGenerator.createLionEarTexture(idx === 0 ? 'left' : 'right');
      const earMat = new THREE.MeshBasicMaterial({
        map: earTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const earMesh = new THREE.Mesh(earGeo, earMat);
      earMesh.rotation.z = idx === 0 ? -0.22 : 0.22;
      earGroup.add(earMesh);

      this.headGroup.add(earGroup);
      this.ears.push(earGroup);
    });

    // Auspicious Red Ribbon Scroll dangling from smiling mouth
    const ribbonGeo = new THREE.PlaneGeometry(0.38, 0.95);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    this.ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.ribbon.position.set(0, -0.78, 0.03);
    this.headGroup.add(this.ribbon);

    this.group.add(this.headGroup);

    // =========================================================================
    // 2. Multi-Segment Articulated Silk Spine (Undulating Wave Motion)
    // =========================================================================
    const bodyTex = TextureGenerator.createLionBodyTexture();
    const numSegments = 4;
    const segmentLengths = [0.85, 0.85, 0.8, 0.75];
    const segmentWidths = [2.2, 2.05, 1.85, 1.6];

    for (let i = 0; i < numSegments; i++) {
      const segGroup = new THREE.Group();
      const zOffset = -0.35 - i * 0.65;
      const yOffset = 1.22 - i * 0.12;
      segGroup.position.set(0, yOffset, zOffset);

      // Main arched back drape
      const segGeo = new THREE.PlaneGeometry(segmentWidths[i], segmentLengths[i]);
      const segMat = new THREE.MeshStandardMaterial({
        map: bodyTex,
        transparent: true,
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.rotation.x = -0.32;
      segGroup.add(segMesh);

      // Flank side silk drapes
      [-segmentWidths[i] * 0.38, segmentWidths[i] * 0.38].forEach((sx, fIdx) => {
        const flankGeo = new THREE.PlaneGeometry(segmentWidths[i] * 0.55, segmentLengths[i] * 0.9);
        const flankMesh = new THREE.Mesh(flankGeo, segMat.clone());
        flankMesh.position.set(sx, -0.22, 0);
        flankMesh.rotation.y = fIdx === 0 ? 0.38 : -0.38;
        flankMesh.rotation.x = -0.2;
        segGroup.add(flankMesh);
      });

      this.group.add(segGroup);
      this.bodySegments.push(segGroup);
    }

    // Lion Tail at back with golden fur tassel
    const tailGeo = new THREE.ConeGeometry(0.18, 0.85, 8);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    this.tail = new THREE.Mesh(tailGeo, tailMat);
    this.tail.position.set(0, 0.95, -2.4);
    this.tail.rotation.x = Math.PI * 0.42;
    this.group.add(this.tail);

    // =========================================================================
    // 3. Authentic Performer Martial Legs (2 Performers in Baggy Silk Trousers)
    // - Bent-knee martial stance (trung bình tấn), nhún nhảy theo nhịp trống
    // =========================================================================
    const trouserMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Rich saffron-gold silk martial trousers
      roughness: 0.75,
      metalness: 0.15
    });
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Red silk martial ankle wraps (xà cạp viền đỏ)
      roughness: 0.8
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Black cloth kung-fu shoes
      roughness: 0.9
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // White flexible sole
      roughness: 0.7
    });

    const legConfigs = [
      { x: -0.44, z: 0.22, isFront: true },   // Front Left
      { x: 0.44, z: 0.22, isFront: true },    // Front Right
      { x: -0.42, z: -1.65, isFront: false }, // Rear Left
      { x: 0.42, z: -1.65, isFront: false }   // Rear Right
    ];

    legConfigs.forEach(cfg => {
      const legGroup = new THREE.Group();
      legGroup.position.set(cfg.x, 0.0, cfg.z);

      // Thigh: Baggy folded silk trouser segment angled forward/outward
      const thighGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.38, 8);
      const thigh = new THREE.Mesh(thighGeo, trouserMat);
      thigh.position.set(0, 0.52, 0.06);
      thigh.rotation.x = 0.32; // Bent-knee forward angle
      thigh.rotation.z = cfg.x < 0 ? -0.14 : 0.14; // Outward martial stance
      legGroup.add(thigh);

      // Calf / Shin: Wrapped in martial ankle cuffs, angled down to ground
      const calfGeo = new THREE.CylinderGeometry(0.14, 0.10, 0.36, 8);
      const calf = new THREE.Mesh(calfGeo, trouserMat);
      calf.position.set(0, 0.22, -0.04);
      calf.rotation.x = -0.38; // Angled back down to the foot
      legGroup.add(calf);

      // Red martial ankle wrap cuff (xà cạp)
      const cuffGeo = new THREE.CylinderGeometry(0.105, 0.10, 0.10, 8);
      const cuff = new THREE.Mesh(cuffGeo, cuffMat);
      cuff.position.set(0, 0.10, -0.08);
      cuff.rotation.x = -0.38;
      legGroup.add(cuff);

      // Traditional cloth martial shoe with white sole
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, 0.04, -0.04);

      const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeMat);
      shoeUpper.position.set(0, 0.02, 0.04);
      shoeGroup.add(shoeUpper);

      const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.25), soleMat);
      shoeSole.position.set(0, -0.025, 0.04);
      shoeGroup.add(shoeSole);

      legGroup.add(shoeGroup);

      this.group.add(legGroup);
      this.performerLegs.push({
        group: legGroup,
        thigh,
        calf,
        cuff,
        shoe: shoeUpper,
        baseX: cfg.x,
        baseZ: cfg.z,
        isFront: cfg.isFront
      });
    });

    // Initial position: hidden off-stage
    this.group.position.copy(this.hiddenPosition);
    this.isPeeking = false;
  }

  // Set whether lion is peeking behind crowd or hidden
  public setPeeking(peeking: boolean) {
    this.isPeeking = peeking;
    if (peeking) {
      this.group.position.copy(this.peekPosition);
      this.headGroup.position.y = 1.42;
      audioManager.playLionDanceRhythm(1.0, 'roll');
      this.triggerDrumBlink();
    } else {
      this.group.position.copy(this.hiddenPosition);
    }
  }

  // Trigger rapid mechanical blinking synced to drum hits
  public triggerDrumBlink() {
    this.isBlinking = true;
    this.blinkProgress = 0;
    audioManager.playLionHeadBlink();
  }

  // Trigger grand entrance leap onto center ground
  public triggerLeap() {
    this.isPeeking = false;
    this.isLeaping = true;
    this.leapProgress = 0;
    this.group.position.copy(this.peekPosition);
    audioManager.playLionDanceRhythm(1.35, 'leap');
    audioManager.playCrowdCheerOoh(0.35);

    // Initial burst of sparks and smoke on takeoff
    this.emitPuff(this.peekPosition, 6, 4);
    this.triggerDrumBlink();
  }

  // Spawn celebratory sparks and subtle festive smoke
  public emitPuff(pos: THREE.Vector3, sparkCount = 4, smokeCount = 2) {
    // 1. Sparks
    for (let i = 0; i < sparkCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.sparkTex,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + Math.random() * 0.4 + 0.1,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      this.group.parent?.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          Math.random() * 2.8 + 0.8,
          (Math.random() - 0.5) * 2.2
        ),
        life: 0,
        maxLife: 0.65 + Math.random() * 0.45,
        rotationSpeed: (Math.random() - 0.5) * 8.0
      });
    }

    // 2. Smoke Puffs
    for (let j = 0; j < smokeCount; j++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.smokeTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.6,
        pos.y + 0.15,
        pos.z + (Math.random() - 0.5) * 0.6
      );
      this.group.parent?.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.7 + 0.25,
          (Math.random() - 0.5) * 0.5
        ),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.6,
        rotationSpeed: (Math.random() - 0.5) * 1.5
      });
    }
  }

  public update(delta: number, time: number) {
    // -------------------------------------------------------------------------
    // 1. Mechanical Eyelids (Blinking & twitching rhythmically to the drum beat)
    // -------------------------------------------------------------------------
    this.blinkTimer += delta;
    // An occasional blink leaves the printed eyes readable between drum cues.
    if (this.blinkTimer > 2.8) {
      this.blinkTimer = 0;
      this.triggerDrumBlink();
    }

    if (this.isBlinking) {
      this.blinkProgress += delta / 0.10;
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
    }

    // One 100 ms closing/opening gesture, with no residual red strip at rest.
    const blinkAmount = this.isBlinking ? Math.sin(this.blinkProgress * Math.PI) : 0;
    this.eyelids.forEach(lid => {
      lid.visible = blinkAmount > 0.01;
      lid.scale.y = Math.max(0.001, blinkAmount);
      lid.position.y = 0.08 - blinkAmount * 0.13;
    });

    // -------------------------------------------------------------------------
    // 2. Twitching Ears (Nhấp nháy tai theo nhịp trống)
    // -------------------------------------------------------------------------
    this.earTwitchTimer += delta;
    if (this.earTwitchTimer > 1.2) {
      if (this.earTwitchTimer > 1.6) {
        this.earTwitchTimer = 0;
      }
      const twitch = Math.sin(time * 26.0) * 0.24;
      this.ears[0].rotation.z = -0.22 + twitch;
      this.ears[1].rotation.z = 0.22 - twitch;
    } else {
      this.ears[0].rotation.z = -0.22;
      this.ears[1].rotation.z = 0.22;
    }

    // -------------------------------------------------------------------------
    // 3. State-Dependent Motion & Performer Martial Stance Animation
    // -------------------------------------------------------------------------
    if (this.isPeeking) {
      // Peeking behind crowd: rhythmic bobbing and curious head tilts
      const peekBob = Math.sin(time * 5.0) * 0.10;
      this.group.position.y = this.peekPosition.y + peekBob;
      this.headGroup.rotation.z = Math.sin(time * 3.5) * 0.15;
      this.headGroup.rotation.y = 0.32 + Math.sin(time * 2.8) * 0.15;
      this.tail.rotation.z = Math.sin(time * 6.0) * 0.25;

      this.bodySegments.forEach((seg, idx) => {
        seg.rotation.z = Math.sin(time * 4.0 - idx * 0.6) * 0.08;
      });

      // Subtle weight shifting of front performer
      this.performerLegs.forEach((leg, idx) => {
        if (leg.isFront) {
          leg.group.position.y = Math.max(0, Math.sin(time * 5.0 + (idx === 0 ? 0 : Math.PI)) * 0.06);
        }
      });
    } else if (this.isLeaping) {
      // Grand celebratory leap onto the courtyard ground
      this.leapProgress += delta * 1.15;
      const t = Math.min(1.0, this.leapProgress);

      this.group.position.x = THREE.MathUtils.lerp(this.peekPosition.x, this.centerPosition.x, t);
      this.group.position.z = THREE.MathUtils.lerp(this.peekPosition.z, this.centerPosition.z, t);

      const jumpArc = Math.sin(t * Math.PI) * 1.5;
      this.group.position.y = THREE.MathUtils.lerp(this.peekPosition.y, this.centerPosition.y, t) + jumpArc;

      this.headGroup.rotation.x = -Math.sin(t * Math.PI) * 0.55;
      this.headGroup.rotation.z = Math.sin(t * Math.PI * 2) * 0.25;
      this.group.rotation.y = THREE.MathUtils.lerp(0.32, 0, t);

      this.bodySegments.forEach((seg, idx) => {
        seg.rotation.x = -0.32 + Math.sin(t * Math.PI - idx * 0.5) * 0.35;
        seg.rotation.z = Math.sin(t * Math.PI * 2 - idx * 0.7) * 0.25;
      });

      // Tucked performer legs during air jump
      this.performerLegs.forEach(leg => {
        leg.thigh.rotation.x = 0.32 + Math.sin(t * Math.PI) * 0.4;
        leg.calf.rotation.x = -0.38 - Math.sin(t * Math.PI) * 0.3;
      });

      if (this.leapProgress >= 1.0) {
        this.isLeaping = false;
        this.emitPuff(this.centerPosition, 8, 4);
        this.triggerDrumBlink();
      }
    } else if (this.leapProgress >= 1.0) {
      // Full center-stage lion dance choreography directly on brick courtyard
      const drumGroove = Math.sin(time * 7.5);
      const headNod = Math.abs(drumGroove) * 0.20;
      const headSway = Math.sin(time * 3.8) * 0.26;

      this.group.position.y = this.centerPosition.y + Math.abs(Math.sin(time * 7.5)) * 0.08;
      this.headGroup.position.y = 1.42 + headNod;
      this.headGroup.rotation.z = headSway;
      this.headGroup.rotation.y = Math.sin(time * 2.2) * 0.35;

      // Multi-segmented undulating wave propagation along the silk spine
      this.bodySegments.forEach((seg, idx) => {
        const wavePhase = time * 7.5 - (idx + 1) * 0.85;
        seg.rotation.z = Math.sin(time * 3.8 - (idx + 1) * 0.7) * 0.25;
        seg.position.y = 1.22 - idx * 0.12 + Math.sin(wavePhase) * 0.08;
        seg.position.x = Math.sin(time * 3.8 - (idx + 1) * 0.5) * 0.14;
      });

      this.tail.rotation.z = Math.sin(time * 8.5) * 0.45;
      this.ribbon.rotation.z = Math.sin(time * 6.5) * 0.25;
      this.ribbon.rotation.x = Math.sin(time * 9.0) * 0.2;

      // =======================================================================
      // Dynamic Bent-Knee Bouncing & Martial Stepping (2 Performers)
      // =======================================================================
      const frontStepPhase = time * 7.5;
      const rearStepPhase = time * 7.5 + Math.PI * 0.5;

      this.performerLegs.forEach((leg, idx) => {
        const isLeft = idx % 2 === 0;
        const phase = leg.isFront ? frontStepPhase : rearStepPhase;
        const legPhase = phase + (isLeft ? 0 : Math.PI);

        // Bent-knee flexion (khuỵu gối nhún nhảy)
        const kneeFlex = Math.sin(legPhase);
        const stepLift = Math.max(0, kneeFlex) * 0.09;

        leg.group.position.y = stepLift;
        leg.thigh.rotation.x = 0.32 + Math.sin(legPhase) * 0.18;
        leg.calf.rotation.x = -0.38 - Math.sin(legPhase) * 0.16;
        leg.thigh.rotation.z = (leg.baseX < 0 ? -0.14 : 0.14) + Math.cos(legPhase) * 0.05;
      });

      // Dynamic ground shadow response
      const jumpHeight = this.group.position.y - this.centerPosition.y;
      this.shadowMesh.scale.set(1.0 - jumpHeight * 0.25, 1.0 - jumpHeight * 0.25, 1.0);
      (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.55 - jumpHeight * 0.2;

      // Bowing override (Auspicious Vietnamese Lion Salute)
      if (this.isBowing) {
        this.bowTimer += delta;
        const bowT = (Math.sin(this.bowTimer * 1.5 - Math.PI / 2) + 1) * 0.5; // 0..1..0 smooth oscillation
        this.headGroup.position.y = 1.42 - bowT * 0.55;
        this.headGroup.rotation.x = bowT * 0.45;
        this.headGroup.rotation.z = Math.sin(this.bowTimer * 3.0) * 0.12;

        this.bodySegments.forEach((seg, idx) => {
          seg.position.y = 1.22 - idx * 0.12 - bowT * 0.35;
          seg.rotation.x = bowT * 0.25;
        });

        this.performerLegs.forEach(leg => {
          leg.thigh.rotation.x = 0.32 + bowT * 0.45;
          leg.calf.rotation.x = -0.38 - bowT * 0.45;
        });
      }

      // Gesture Reaction overrides (during minigame)
      if (this.gestureReactionTimer > 0) {
        this.gestureReactionTimer -= delta;
        if (this.gestureReactionType === 'nodRight') {
          this.headGroup.rotation.z = -0.38;
          this.headGroup.rotation.y = 0.45;
          this.headGroup.position.y = 1.42 + Math.sin(this.gestureReactionTimer * 12.0) * 0.2;
        } else if (this.gestureReactionType === 'rollLeft') {
          this.headGroup.rotation.z = 0.40;
          this.headGroup.rotation.y = -0.42;
          this.headGroup.position.y = 1.42 + Math.sin(this.gestureReactionTimer * 12.0) * 0.2;
        } else if (this.gestureReactionType === 'rearUp') {
          this.group.position.y = this.centerPosition.y + 0.65;
          this.headGroup.position.y = 2.15;
          this.headGroup.rotation.x = -0.35;
        }
      }

      this.stompTimer += delta;
      if (this.stompTimer > 1.8 && !this.isBowing) {
        this.stompTimer = 0;
        this.emitPuff(this.centerPosition, 3, 1);
        this.triggerDrumBlink();
      }
    }

    // -------------------------------------------------------------------------
    // 4. Update Sparks & Smoke Particles
    // -------------------------------------------------------------------------
    for (let pIdx = this.particles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.particles[pIdx];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.group.parent?.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(pIdx, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 1.8 * delta;
      p.mesh.rotation.z += p.rotationSpeed * delta;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.85;
      p.mesh.scale.setScalar(1.0 + progress * 0.6);
    }
  }

  // Toggle first-person inside view (hides lion model so camera has clear POV)
  public setInsideView(inside: boolean) {
    this.group.visible = !inside;
  }

  // Perform dynamic gesture reaction during minigame
  public performGestureReaction(type: 'nodRight' | 'rollLeft' | 'rearUp') {
    this.gestureReactionType = type;
    this.triggerDrumBlink();

    if (type === 'nodRight') {
      this.gestureReactionTimer = 0.9;
      this.emitPuff(this.centerPosition, 5, 2);
      audioManager.playLionDanceRhythm(1.2, 'groove');
      audioManager.playCrowdCheerOoh(0.3);
    } else if (type === 'rollLeft') {
      this.gestureReactionTimer = 0.9;
      this.emitPuff(this.centerPosition, 6, 2);
      audioManager.playLionDanceRhythm(1.3, 'roll');
      audioManager.playCrowdCheerOoh(0.4);
    } else if (type === 'rearUp') {
      this.gestureReactionTimer = 1.4;
      this.emitPuff(this.centerPosition, 12, 5);
      audioManager.playLionDanceRhythm(1.5, 'leap');
      audioManager.playCrowdCheerOoh(0.55);
    }
  }

  // Graceful celebratory bow in front of the kids
  public performEncoreBow() {
    this.isBowing = true;
    this.bowTimer = 0;
    this.leapProgress = 1.0;
    this.isLeaping = false;
    this.isPeeking = false;
    this.group.position.copy(this.centerPosition);
    this.group.rotation.y = 0;
    audioManager.playLionDanceRhythm(0.9, 'groove');
    audioManager.playCrowdCheerOoh(0.35);
  }

  public destroy() {
    this.particles.forEach(p => {
      this.group.parent?.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}
