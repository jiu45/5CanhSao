import * as THREE from 'three';

type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

function paintTexture(width: number, height: number, paint: Painter): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  paint(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function facingCard(texture: THREE.Texture, width: number, height: number,
  x: number, y: number, z: number, opacity = 1): THREE.Mesh {
  const card = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity,
      depthWrite: false, side: THREE.DoubleSide }));
  card.rotation.y = -Math.PI / 2;
  card.position.set(x, y, z);
  return card;
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number,
  outer: number, inner = outer * 0.47, rotation = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = rotation + i * Math.PI / 5;
    const radius = i % 2 ? inner : outer;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function haloTexture(inner: string, middle: string): THREE.CanvasTexture {
  return paintTexture(128, 128, ctx => {
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, inner); g.addColorStop(0.28, middle);
    g.addColorStop(1, 'rgba(255,175,100,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}

function pavementTexture(): THREE.CanvasTexture {
  const texture = paintTexture(512, 512, ctx => {
    ctx.fillStyle = '#263447'; ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) {
      for (let col = -1; col < 7; col++) {
        const x = col * 86 + (row % 2) * 43 + 3;
        const y = row * 64 + 3;
        ctx.fillStyle = (row + col) % 4 === 0 ? '#66717c' : '#596675';
        ctx.fillRect(x, y, 80, 58);
        ctx.fillStyle = 'rgba(255,225,173,.13)';
        ctx.fillRect(x + 4, y + 4, 72, 2);
      }
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  return texture;
}

function skylineTexture(): THREE.CanvasTexture {
  return paintTexture(1024, 512, ctx => {
    const glow = ctx.createRadialGradient(512, 490, 12, 512, 470, 440);
    glow.addColorStop(0, 'rgba(236,145,89,.44)');
    glow.addColorStop(0.45, 'rgba(157,78,115,.18)');
    glow.addColorStop(1, 'rgba(20,33,58,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 1024, 512);
    const bands = [
      { y: 355, color: '#17283b', seed: 19 },
      { y: 402, color: '#112235', seed: 31 },
      { y: 452, color: '#0c1a2d', seed: 47 }
    ];
    for (const band of bands) {
      ctx.fillStyle = band.color;
      ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(0, band.y);
      for (let i = 0; i <= 16; i++) {
        const x = i * 64;
        const roof = band.y - (Math.sin(i * 2.31 + band.seed) + 1) * 16;
        ctx.lineTo(x, roof);
        ctx.lineTo(x + 24, roof - (i % 4 === 0 ? 16 : 2));
        ctx.lineTo(x + 48, roof);
      }
      ctx.lineTo(1024, 512); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(251,197,122,.45)';
      for (let i = 0; i < 35; i++) {
        const x = (i * 127 + band.seed * 23) % 1024;
        const y = band.y + 23 + (i % 3) * 19;
        ctx.fillRect(x, y, 4, 6);
      }
    }
  });
}

function foliageTexture(seed: number): THREE.CanvasTexture {
  return paintTexture(512, 640, ctx => {
    const trunk = ctx.createLinearGradient(250, 200, 300, 600);
    trunk.addColorStop(0, '#203f46'); trunk.addColorStop(1, '#14252f');
    ctx.strokeStyle = trunk; ctx.lineCap = 'round';
    ctx.lineWidth = 35; ctx.beginPath(); ctx.moveTo(256, 640);
    ctx.bezierCurveTo(250, 520, 240, 390, 260, 215); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(255, 390);
      ctx.quadraticCurveTo(255 + side * 70, 290, 255 + side * 145, 185);
      ctx.stroke();
    }
    const crowns = [
      { x: 256, y: 195, rx: 146, ry: 82, color: '#183941' },
      { x: 130, y: 260, rx: 110, ry: 69, color: '#17343c' },
      { x: 378, y: 245, rx: 108, ry: 76, color: '#1a4044' },
      { x: 270, y: 135, rx: 104, ry: 69, color: '#20434a' }
    ];
    for (const c of crowns) {
      ctx.fillStyle = c.color; ctx.strokeStyle = '#41676a'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = i * Math.PI * 2 / 16;
        const irregular = 0.88 + 0.12 * Math.sin(i * 3.1 + seed);
        const x = c.x + Math.cos(a) * c.rx * irregular;
        const y = c.y + Math.sin(a) * c.ry * irregular;
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4 + seed;
      const y = 300 + i * 15;
      const x = 258 + Math.sin(a) * 18;
      ctx.fillStyle = i % 3 === 0 ? '#ffe3a0' : '#ffb454';
      ctx.shadowColor = '#ffae48'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(x, y, 3.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  });
}

function crowdTexture(seed: number, distant: boolean): THREE.CanvasTexture {
  return paintTexture(distant ? 1024 : 768, 320, (ctx, width, height) => {
    const count = distant ? 34 : 7;
    const spacing = width / count;
    for (let i = 0; i < count; i++) {
      const x = spacing * (i + 0.5) + Math.sin(i * 3.19 + seed) * spacing * 0.2;
      const rise = distant ? 105 + (i % 5) * 10 : 148 + (i % 4) * 25;
      const headY = height - rise;
      const headR = distant ? 9 + (i % 3) : 19 + (i % 3) * 2;
      const hue = i % 4 === 0 ? '#27334b' : i % 4 === 1 ? '#23354b' :
        i % 4 === 2 ? '#493247' : '#253d47';
      ctx.fillStyle = hue;
      ctx.beginPath(); ctx.arc(x, headY, headR, 0, Math.PI * 2); ctx.fill();
      if ((i + seed) % 5 === 0) {
        ctx.beginPath(); ctx.arc(x + headR * 0.55, headY - headR * 0.75,
          headR * 0.43, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(x - headR * 1.18, headY + headR * 0.86);
      ctx.quadraticCurveTo(x, headY + headR * 0.55, x + headR * 1.25, headY + headR * 0.9);
      const hem = (i + seed) % 3 === 0 ? headR * 2.1 : headR * 1.3;
      ctx.lineTo(x + hem, height); ctx.lineTo(x - hem, height); ctx.closePath(); ctx.fill();
      if (!distant && i % 4 === 1) {
        ctx.fillStyle = hue;
        ctx.beginPath(); ctx.arc(x + headR * 2.0, headY + 45, headR * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + headR * 1.2, headY + 62);
        ctx.lineTo(x + headR * 2.8, headY + 62);
        ctx.lineTo(x + headR * 3.2, height);
        ctx.lineTo(x + headR * 0.7, height); ctx.closePath(); ctx.fill();
      }
      if (i % (distant ? 3 : 2) === 0) {
        const lx = x + headR * 1.55;
        const ly = headY + (distant ? 38 : 52);
        const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, distant ? 18 : 35);
        glow.addColorStop(0, 'rgba(255,242,195,1)');
        glow.addColorStop(0.3, 'rgba(255,179,80,.75)');
        glow.addColorStop(1, 'rgba(255,179,80,0)');
        ctx.fillStyle = glow; ctx.beginPath();
        ctx.arc(lx, ly, distant ? 18 : 35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = (i + seed) % 3 === 0 ? '#ffb96d' : '#ffe0a0';
        starPath(ctx, lx, ly, distant ? 6 : 11); ctx.fill();
      }
    }
  });
}

function foregroundFamilyTexture(variant: number): THREE.CanvasTexture {
  return paintTexture(512, 560, ctx => {
    const figures = variant === 0 ? [
      { x: 125, head: 205, radius: 32, hem: 498, color: '#273850' },
      { x: 259, head: 280, radius: 24, hem: 503, color: '#4c344b' },
      { x: 389, head: 230, radius: 30, hem: 500, color: '#263f49' }
    ] : [
      { x: 116, head: 243, radius: 28, hem: 502, color: '#4a354b' },
      { x: 271, head: 188, radius: 33, hem: 498, color: '#283a50' },
      { x: 400, head: 313, radius: 21, hem: 504, color: '#30475a' }
    ];
    figures.forEach((person, i) => {
      const { x, head, radius, hem, color } = person;
      ctx.fillStyle = color;
      ctx.strokeStyle = i === 1 ? '#a3716c' : '#526479';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, head, radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.75, head + radius * 0.8);
      ctx.quadraticCurveTo(x - radius * 1.7, head + radius * 1.2,
        x - radius * 1.55, head + radius * 2.7);
      ctx.lineTo(x - radius * 1.45, hem);
      ctx.quadraticCurveTo(x, hem + 18, x + radius * 1.55, hem);
      ctx.lineTo(x + radius * 1.35, head + radius * 2.5);
      ctx.quadraticCurveTo(x + radius * 1.45, head + radius * 1.1,
        x + radius * 0.75, head + radius * 0.8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#a78376'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + radius, head + radius * 1.8);
      ctx.quadraticCurveTo(x + radius * 1.9, head + radius * 2.0,
        x + radius * 2.45, head + radius * 2.7); ctx.stroke();
    });
    const lanternX = variant === 0 ? 349 : 188;
    const lanternY = variant === 0 ? 344 : 315;
    ctx.strokeStyle = '#b89070'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(lanternX, lanternY + 9);
    ctx.lineTo(lanternX, lanternY + 147); ctx.stroke();
    const glow = ctx.createRadialGradient(lanternX, lanternY, 8,
      lanternX, lanternY, 100);
    glow.addColorStop(0, 'rgba(255,243,185,.86)');
    glow.addColorStop(0.45, 'rgba(255,178,91,.3)');
    glow.addColorStop(1, 'rgba(255,178,91,0)');
    ctx.fillStyle = glow; ctx.fillRect(lanternX - 105, lanternY - 105, 210, 210);
    ctx.fillStyle = '#ffd68c'; ctx.strokeStyle = '#e99165'; ctx.lineWidth = 7;
    starPath(ctx, lanternX, lanternY, 39, 18, -Math.PI / 2 + 0.08);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(125,76,65,.85)'; ctx.lineWidth = 3;
    for (let ray = 0; ray < 5; ray++) {
      const a = -Math.PI / 2 + ray * Math.PI * 2 / 5 + 0.08;
      ctx.beginPath(); ctx.moveTo(lanternX, lanternY);
      ctx.lineTo(lanternX + Math.cos(a) * 36,
        lanternY + Math.sin(a) * 36); ctx.stroke();
    }
  });
}

function kioskTexture(seed: number): THREE.CanvasTexture {
  return paintTexture(512, 480, ctx => {
    const palette = seed % 2 ? ['#a73f55', '#f7c777'] : ['#35536b', '#f3b987'];
    ctx.fillStyle = 'rgba(22,35,51,.86)';
    ctx.beginPath(); ctx.moveTo(75, 160); ctx.lineTo(437, 160);
    ctx.lineTo(424, 450); ctx.lineTo(88, 450); ctx.closePath(); ctx.fill();
    const awning = ctx.createLinearGradient(0, 100, 0, 230);
    awning.addColorStop(0, palette[0]); awning.addColorStop(1, '#522a44');
    ctx.fillStyle = awning; ctx.beginPath();
    ctx.moveTo(50, 175); ctx.quadraticCurveTo(256, 45, 462, 175);
    ctx.lineTo(442, 222); ctx.quadraticCurveTo(256, 157, 70, 222);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f6bf75'; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = 'rgba(255,210,142,.76)';
    for (let i = 0; i < 4; i++) ctx.fillRect(112 + i * 77, 245, 51, 115);
    ctx.fillStyle = '#142638'; ctx.fillRect(55, 384, 402, 68);
    ctx.strokeStyle = '#d79d5f'; ctx.lineWidth = 8; ctx.strokeRect(55, 384, 402, 68);
    ctx.fillStyle = palette[1];
    for (let i = 0; i < 5; i++) {
      const x = 116 + i * 70;
      if (i % 2 === 0) starPath(ctx, x, 335, 17);
      else { ctx.beginPath(); ctx.ellipse(x, 335, 13, 18, 0, 0, Math.PI * 2); }
      ctx.fill();
    }
  });
}

function installationStarTexture(softCyan: boolean): THREE.CanvasTexture {
  return paintTexture(512, 512, ctx => {
    const x = 256, y = 256;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 245);
    g.addColorStop(0, 'rgba(255,250,212,.85)');
    g.addColorStop(0.35, softCyan ? 'rgba(140,211,213,.48)' : 'rgba(255,191,109,.56)');
    g.addColorStop(1, 'rgba(255,178,110,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = softCyan ? 'rgba(155,220,220,.57)' : 'rgba(255,189,115,.62)';
    ctx.strokeStyle = softCyan ? '#d2e8de' : '#ffd99e';
    ctx.lineWidth = 13; ctx.lineJoin = 'round';
    starPath(ctx, x, y, 172, 75, -Math.PI / 2 + 0.04);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = softCyan ? 'rgba(37,85,100,.8)' : 'rgba(130,67,69,.78)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + 0.04;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 169, y + Math.sin(a) * 169); ctx.stroke();
    }
    ctx.fillStyle = '#fff1c4';
    ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
  });
}

function stageTexture(): THREE.CanvasTexture {
  return paintTexture(1024, 512, ctx => {
    ctx.fillStyle = '#112b3a';
    ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(0, 220);
    ctx.quadraticCurveTo(125, 95, 360, 155);
    ctx.quadraticCurveTo(512, 184, 664, 155);
    ctx.quadraticCurveTo(899, 95, 1024, 220);
    ctx.lineTo(1024, 512); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd284'; ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = '#853c52';
    ctx.beginPath(); ctx.moveTo(0, 252); ctx.quadraticCurveTo(210, 158, 387, 205);
    ctx.lineTo(387, 512); ctx.lineTo(0, 512); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1024, 252); ctx.quadraticCurveTo(814, 158, 637, 205);
    ctx.lineTo(637, 512); ctx.lineTo(1024, 512); ctx.closePath(); ctx.fill();
    for (const side of [0, 1]) {
      for (let i = 0; i < 6; i++) {
        const x = side ? 665 + i * 58 : 75 + i * 58;
        ctx.fillStyle = i % 2 ? '#e6a96e' : '#f5d39d';
        ctx.fillRect(x, 265 + (i % 3) * 15, 17, 188);
        ctx.fillStyle = 'rgba(255,239,182,.62)';
        ctx.fillRect(x + 5, 270 + (i % 3) * 15, 5, 160);
      }
    }
    ctx.fillStyle = '#193647'; ctx.fillRect(350, 405, 324, 107);
    ctx.strokeStyle = '#dca761'; ctx.lineWidth = 7; ctx.strokeRect(350, 405, 324, 107);
    ctx.fillStyle = '#ffe4aa';
    for (const x of [430, 470, 512, 554, 594]) {
      starPath(ctx, x, 467, 9); ctx.fill();
    }
  });
}

/** Authored 2.5D festival vista: the gate and player lanterns remain the hero 3D layer. */
export class GrandPlazaSet {
  public readonly group = new THREE.Group();
  private readonly groundLayer = new THREE.Group();
  private readonly lightsLayer = new THREE.Group();
  private readonly crowdLayer = new THREE.Group();
  private readonly stageLayer = new THREE.Group();
  private readonly farLayer = new THREE.Group();
  private readonly movingCards: THREE.Object3D[] = [];
  private readonly focusCards: THREE.Mesh[] = [];
  private readonly artificialMoon: THREE.Group;
  public readonly realMoon: THREE.Group;

  constructor() {
    this.group.position.set(176, 0, -83);
    this.buildGround();
    this.buildSkyAndStage();
    this.buildCrowdAndStalls();
    this.buildLanternCanopy();
    this.buildLightField();
    this.group.add(this.groundLayer, this.farLayer, this.stageLayer,
      this.crowdLayer, this.lightsLayer);
    this.artificialMoon = this.stageLayer.getObjectByName('festival_moon') as THREE.Group;
    this.realMoon = this.farLayer.getObjectByName('real_moon') as THREE.Group;
    this.setReveal(0);
  }

  private buildGround(): void {
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(37, 80),
      new THREE.MeshBasicMaterial({ color: 0x1c3040, side: THREE.DoubleSide }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.scale.set(1.26, 0.97, 1);
    plaza.position.set(42, 0.015, 0);
    this.groundLayer.add(plaza);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(75, 12),
      new THREE.MeshStandardMaterial({ map: pavementTexture(), color: 0xb5b4b7,
        roughness: 0.95, side: THREE.DoubleSide }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(30, 0.035, 0);
    this.groundLayer.add(road);
    const ringMat = new THREE.LineBasicMaterial({ color: 0x9e7957, transparent: true, opacity: 0.54 });
    for (const [rx, rz] of [[22, 19], [31, 27]] as const) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const a = i * Math.PI * 2 / 80;
        pts.push(new THREE.Vector3(42 + Math.cos(a) * rx, 0.06,
          Math.sin(a) * rz));
      }
      this.groundLayer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
    }
    const edgeGlow = haloTexture('rgba(255,240,193,.8)', 'rgba(255,167,87,.32)');
    for (const side of [-1, 1]) {
      for (let i = 0; i < 20; i++) {
        const x = 4 + i * 2.7;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: edgeGlow,
          transparent: true, opacity: 0.64, depthWrite: false }));
        sprite.position.set(x, 0.36, side * (6.4 + Math.sin(i * 0.4) * 1.4));
        sprite.scale.set(0.85, 0.85, 1);
        this.groundLayer.add(sprite);
      }
    }
  }

  private buildSkyAndStage(): void {
    const skyline = facingCard(skylineTexture(), 100, 32, 88, 15, 0, 0.9);
    this.farLayer.add(skyline);
    const real = new THREE.Group(); real.name = 'real_moon';
    real.position.set(101, 44, 23);
    const realHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture('rgba(239,246,255,.6)', 'rgba(205,224,248,.28)'),
      transparent: true, depthWrite: false
    }));
    realHalo.scale.set(23, 23, 1); real.add(realHalo);
    const realDisc = new THREE.Mesh(new THREE.CircleGeometry(3.9, 48),
      new THREE.MeshBasicMaterial({ color: 0xf5f6ec, side: THREE.DoubleSide }));
    realDisc.rotation.y = Math.PI / 2;
    real.add(realDisc); this.farLayer.add(real);

    const festival = new THREE.Group(); festival.name = 'festival_moon';
    festival.position.set(73, 20, 0);
    const festivalHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture('rgba(255,232,151,.75)', 'rgba(248,158,87,.34)'),
      transparent: true, depthWrite: false
    }));
    festivalHalo.scale.set(35, 35, 1); festival.add(festivalHalo);
    const discTex = paintTexture(512, 512, ctx => {
      const g = ctx.createRadialGradient(246, 226, 35, 256, 256, 246);
      g.addColorStop(0, '#fff5c3'); g.addColorStop(0.55, '#f5cf7d');
      g.addColorStop(0.86, '#d7785c'); g.addColorStop(1, '#8d3d5a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffe6aa'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(256, 256, 228, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,223,.45)'; ctx.lineWidth = 3;
      for (const r of [174, 198]) {
        ctx.beginPath(); ctx.arc(256, 256, r, -Math.PI * 0.8, Math.PI * 0.68); ctx.stroke();
      }
    });
    festival.add(facingCard(discTex, 21, 21, 0, 0, 0));
    this.stageLayer.add(festival);
    this.stageLayer.add(facingCard(stageTexture(), 61, 22, 64, 9.2, 0));
    const warmStar = facingCard(installationStarTexture(false), 10.5, 10.5,
      40, 7.1, -13.5, 0.92);
    const coolStar = facingCard(installationStarTexture(true), 9.5, 9.5,
      44, 6.7, 14.3, 0.86);
    this.stageLayer.add(warmStar, coolStar);
    this.focusCards.push(warmStar, coolStar);
    // Two side wing cards add architectural depth without enclosing a walkable city.
    const wings = kioskTexture(1);
    this.stageLayer.add(facingCard(wings, 12, 11, 65, 5.1, -25, 0.75));
    this.stageLayer.add(facingCard(kioskTexture(2), 12, 11, 64, 5.1, 25, 0.75));
  }

  private buildCrowdAndStalls(): void {
    for (const side of [-1, 1]) {
      const family = facingCard(foregroundFamilyTexture(side < 0 ? 0 : 1),
        5.5, 5.9, 15.5, 2.85, side * 10.2, 0.95);
      this.crowdLayer.add(family);
      this.movingCards.push(family);
    }
    for (let row = 0; row < 3; row++) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const x = 18 + row * 15 + i * 4;
          const z = side * (11 + row * 5 + i * 3.0);
          const tex = crowdTexture(row * 7 + i * 3 + (side + 1), false);
          const card = facingCard(tex, 8.5 + row * 0.8, 3.7 + row * 0.3,
            x, 1.8, z, row === 0 ? 0.92 : 0.75);
          this.crowdLayer.add(card);
          this.movingCards.push(card);
        }
      }
    }
    const distantCrowd = crowdTexture(9, true);
    for (const [x, z] of [[59, -17], [60, 15], [66, 0]] as const) {
      this.crowdLayer.add(facingCard(distantCrowd, 25, 3.8, x, 1.8, z, 0.67));
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = 23 + i * 14;
        const z = side * (24 + (i % 2) * 3);
        this.stageLayer.add(facingCard(kioskTexture(i + (side + 1)),
          10, 8.5, x + 4, 3.9, z, 0.88));
      }
      for (let i = 0; i < 3; i++) {
        const x = 10 + i * 19;
        const z = side * (12 + i * 6);
        const tree = facingCard(foliageTexture(i + (side + 1) * 4),
          9.6 + i * 0.9, 11 + i, x, 5.2, z,
          i === 0 ? 0.92 : 0.72);
        this.stageLayer.add(tree);
        this.movingCards.push(tree);
      }
    }
  }

  private buildLanternCanopy(): void {
    const bulbPositions: THREE.Vector3[] = [];
    const starPositions: THREE.Vector3[] = [];
    const redPositions: THREE.Vector3[] = [];
    const wireMat = new THREE.LineBasicMaterial({ color: 0x87634e, transparent: true, opacity: 0.8 });
    for (let row = 0; row < 9; row++) {
      const x = 7 + row * 6.2;
      const span = 11 + row * 2.3;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 16; j++) {
        const f = j / 16;
        const z = (f - 0.5) * span * 2;
        const y = 9.7 + row * 0.23 - Math.sin(f * Math.PI) * 1.5;
        points.push(new THREE.Vector3(x, y, z));
        if (j > 0 && j < 16) {
          const p = new THREE.Vector3(x, y - 0.34, z);
          if ((j + row) % 5 === 0) starPositions.push(p);
          else if ((j + row) % 4 === 0) redPositions.push(p);
          else bulbPositions.push(p);
        }
      }
      this.lightsLayer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wireMat));
    }
    const bulbGeometry = new THREE.SphereGeometry(0.17, 7, 6);
    const bulb = new THREE.InstancedMesh(bulbGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffd792 }), bulbPositions.length);
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 - Math.PI / 2;
      const radius = i % 2 ? 0.22 : 0.48;
      const px = Math.cos(a) * radius, py = Math.sin(a) * radius;
      if (!i) starShape.moveTo(px, py); else starShape.lineTo(px, py);
    }
    starShape.closePath();
    const star = new THREE.InstancedMesh(new THREE.ShapeGeometry(starShape),
      new THREE.MeshBasicMaterial({ color: 0xffd47b, side: THREE.DoubleSide }), starPositions.length);
    const red = new THREE.InstancedMesh(new THREE.CircleGeometry(0.28, 12),
      new THREE.MeshBasicMaterial({ color: 0xe77b74, side: THREE.DoubleSide }), redPositions.length);
    const dummy = new THREE.Object3D();
    for (const [mesh, positions, flat] of [
      [bulb, bulbPositions, false], [star, starPositions, true],
      [red, redPositions, true]
    ] as const) {
      positions.forEach((p, i) => {
        dummy.position.copy(p);
        dummy.rotation.set(0, flat ? Math.PI / 2 : 0, 0);
        dummy.scale.setScalar(0.75 + (i % 4) * 0.11);
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.lightsLayer.add(mesh);
    }
  }

  private buildLightField(): void {
    const points: number[] = [];
    const colors: number[] = [];
    const palette = [new THREE.Color(0xffd488), new THREE.Color(0xf47b75),
      new THREE.Color(0x9ccdc6)];
    for (let i = 0; i < 310; i++) {
      const x = 23 + ((i * 67) % 61);
      const z = Math.sin(i * 37.2) * (14 + ((i * 17) % 25));
      const y = 1.3 + ((i * 13) % 7) * 0.48;
      points.push(x, y, z);
      const c = palette[i % palette.length]; colors.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const lights = new THREE.Points(geo, new THREE.PointsMaterial({
      vertexColors: true, size: 0.18, transparent: true,
      opacity: 0.74, sizeAttenuation: true, depthWrite: false
    }));
    this.lightsLayer.add(lights);
  }

  public setReveal(progress: number): void {
    this.groundLayer.visible = progress > 0.16;
    this.lightsLayer.visible = progress > 0.2;
    this.crowdLayer.visible = progress > 0.37;
    this.stageLayer.visible = progress > 0.46;
    this.farLayer.visible = progress > 0.55;
  }

  public setIntimateFocus(focus: number): void {
    this.focusCards.forEach((card, i) => {
      (card.material as THREE.MeshBasicMaterial).opacity =
        (i === 0 ? 0.92 : 0.86) * (1 - focus * 0.58);
    });
    this.artificialMoon.children.forEach((child, i) => {
      if (child instanceof THREE.Sprite || child instanceof THREE.Mesh) {
        (child.material as THREE.SpriteMaterial | THREE.MeshBasicMaterial).opacity =
          1 - focus * (i === 0 ? 0.55 : 0.3);
      }
    });
  }

  public update(time: number): void {
    this.movingCards.forEach((card, i) => {
      card.rotation.z = Math.sin(time * (i % 3 === 0 ? 0.36 : 0.25) + i) * 0.006;
      const baseY = card.userData.baseY ?? (card.userData.baseY = card.position.y);
      card.position.y = baseY + Math.sin(time * 0.4 + i) * 0.012;
    });
  }

  public dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.group.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line ||
        object instanceof THREE.Points) {
        geometries.add(object.geometry);
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach(material => materials.add(material));
      }
      if (object instanceof THREE.Sprite) materials.add(object.material);
    });
    materials.forEach(material => {
      if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map);
      material.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
    textures.forEach(texture => texture.dispose());
  }
}
