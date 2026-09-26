import * as THREE from 'three';

/**
 * Procedural Texture Generator for Ghibli / Storybook Vietnamese Mid-Autumn style
 * Generates high-res textures without external file dependencies.
 */
export class TextureGenerator {
  // 1. Rustic Wood Grain Texture (Bàn gỗ mộc / Chõng tre)
  public static createWoodTexture(baseColor = '#5c3a21', grainColor = '#3a2213', width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Fine wood grain fibers
    ctx.strokeStyle = grainColor;
    ctx.globalAlpha = 0.25;
    for (let y = 0; y < height; y += 3) {
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 4);
      for (let x = 0; x < width; x += 30) {
        ctx.lineTo(x, y + Math.sin(x * 0.02) * 6 + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }

    // Wood planks separation lines
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#1d1109';
    ctx.lineWidth = 4;
    for (let x = 80; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 2. Animated Teardrop Candle Flame Texture
  public static createFlameTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Teardrop path
    ctx.beginPath();
    ctx.moveTo(64, 20); // Top tip
    ctx.bezierCurveTo(10, 100, 10, 190, 64, 240); // Left bulge to base
    ctx.bezierCurveTo(118, 190, 118, 100, 64, 20); // Right bulge to tip
    ctx.closePath();

    // Radial gradient: White core -> Golden amber -> Crimson outer glow
    const grad = ctx.createRadialGradient(64, 180, 10, 64, 160, 90);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#fff4a3');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(0.85, 'rgba(239, 68, 68, 0.6)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = grad;
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 3. Wide Luminous Moon Halo Glow
  public static createMoonHaloTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 250, 235, 0.95)');
    grad.addColorStop(0.18, 'rgba(225, 240, 255, 0.65)');
    grad.addColorStop(0.45, 'rgba(165, 205, 255, 0.28)');
    grad.addColorStop(0.75, 'rgba(120, 170, 255, 0.08)');
    grad.addColorStop(1, 'rgba(10, 20, 50, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 4. Layered Organic Bamboo Grove Silhouette (Bụi tre làng cong vút, tự nhiên)
  public static createBambooGroveSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Draw an organic clump of bending bamboo stalks
    // Bamboo culms arch outwards like a natural rural grove
    const stalks = [
      { startX: 180, cpX: 120, endX: 40, endY: 30, w: 7 },
      { startX: 210, cpX: 160, endX: 90, endY: 20, w: 9 },
      { startX: 250, cpX: 220, endX: 170, endY: 10, w: 10 },
      { startX: 280, cpX: 300, endX: 340, endY: 15, w: 9 },
      { startX: 320, cpX: 370, endX: 440, endY: 25, w: 8 },
      { startX: 350, cpX: 410, endX: 480, endY: 50, w: 6 }
    ];

    stalks.forEach(stalk => {
      // Main culm
      ctx.strokeStyle = '#050c18';
      ctx.lineWidth = stalk.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stalk.startX, 512);
      ctx.quadraticCurveTo(stalk.cpX, 260, stalk.endX, stalk.endY);
      ctx.stroke();

      // Bamboo nodes (đốt tre)
      for (let t = 0.15; t < 0.95; t += 0.1) {
        const nx = (1 - t) * (1 - t) * stalk.startX + 2 * (1 - t) * t * stalk.cpX + t * t * stalk.endX;
        const ny = (1 - t) * (1 - t) * 512 + 2 * (1 - t) * t * 260 + t * t * stalk.endY;
        ctx.fillStyle = '#091524';
        ctx.beginPath();
        ctx.arc(nx, ny, stalk.w * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Delicate side twigs & drooping leaf clusters (nhánh tre & chùm lá rủ)
        [-1, 1].forEach(side => {
          const twigLength = 35 + Math.random() * 30;
          const twigAngle = side * (0.4 + Math.random() * 0.3);
          const tx = nx + Math.cos(twigAngle) * twigLength;
          const ty = ny + Math.sin(twigAngle) * twigLength + 10;

          ctx.strokeStyle = '#06101c';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.quadraticCurveTo(nx + side * 15, ny + 5, tx, ty);
          ctx.stroke();

          // Leaf cluster at the twig tip (3-5 slender drooping leaves)
          for (let l = 0; l < 4; l++) {
            const leafAngle = twigAngle + (l - 1.5) * 0.22 + 0.3; // drooping downwards
            const leafLen = 22 + Math.random() * 12;
            const lx = tx + Math.cos(leafAngle) * leafLen;
            const ly = ty + Math.sin(leafAngle) * leafLen;

            ctx.fillStyle = l % 2 === 0 ? '#050d18' : '#081422';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.quadraticCurveTo(
              (tx + lx) / 2 + side * 4,
              (ty + ly) / 2 - 2,
              lx,
              ly
            );
            ctx.quadraticCurveTo(
              (tx + lx) / 2 - side * 4,
              (ty + ly) / 2 + 3,
              tx,
              ty
            );
            ctx.fill();
          }
        });
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 5. Authentic Vietnamese Village Rooftops & Landscape Silhouette (Mái đình làng, ngói cong, rặng cây)
  public static createVillageRoofSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep night silhouette tone
    const silColor = '#030812';
    const softTreeColor = '#040b17';

    // Layer 1: Distant village banyan trees on the FLANKS ONLY (Cây đa đầu làng bên rìa)
    ctx.fillStyle = softTreeColor;
    const flankTrees = [
      { x: 100, y: 360, r: 90 },
      { x: 180, y: 340, r: 80 },
      { x: 840, y: 350, r: 85 },
      { x: 930, y: 360, r: 75 }
    ];
    flankTrees.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Layer 2: Traditional Communal Temple / Đình Làng in center (Mái đình ngói cong Bắc Bộ)
    ctx.fillStyle = '#010306';
    ctx.beginPath();
    // Temple base / pillars
    ctx.moveTo(330, 512);
    ctx.lineTo(330, 360);
    // Left eave wing sweeping out and upturned (đầu đao cong vút)
    ctx.quadraticCurveTo(310, 355, 250, 335);
    ctx.quadraticCurveTo(240, 315, 270, 310);
    // Left roof slope ascending concavely to the ridge
    ctx.quadraticCurveTo(350, 305, 410, 270);
    // Horizontal ridge with slight concave sag (bờ nóc đình)
    ctx.quadraticCurveTo(512, 276, 614, 270);
    // Right roof slope descending concavely to the right eave
    ctx.quadraticCurveTo(674, 305, 754, 310);
    ctx.quadraticCurveTo(784, 315, 774, 335);
    ctx.quadraticCurveTo(714, 355, 694, 360);
    // Right base
    ctx.lineTo(694, 512);
    ctx.closePath();
    ctx.fill();

    // Ridge line & ornamental ridge caps (Bờ nóc kìm mái đình)
    ctx.strokeStyle = '#02060c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(250, 335);
    ctx.quadraticCurveTo(370, 290, 410, 270);
    ctx.quadraticCurveTo(512, 276, 614, 270);
    ctx.quadraticCurveTo(654, 290, 774, 335);
    ctx.stroke();

    // Central sun/moon emblem on ridge (Mặt nguyệt nóc đình)
    ctx.fillStyle = '#030810';
    ctx.beginPath();
    ctx.arc(512, 266, 8, 0, Math.PI * 2);
    ctx.fill();

    // Layer 3: Left traditional village house & haystack (Nhà ba gian & đống rơm)
    ctx.fillStyle = silColor;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(0, 420);
    ctx.quadraticCurveTo(80, 370, 190, 395);
    ctx.lineTo(210, 512);
    ctx.closePath();
    ctx.fill();

    // Haystack (Đống rơm vàng)
    ctx.beginPath();
    ctx.moveTo(200, 512);
    ctx.quadraticCurveTo(215, 430, 245, 420);
    ctx.quadraticCurveTo(275, 430, 290, 512);
    ctx.closePath();
    ctx.fill();

    // Layer 4: Right village house & gate (Nhà ngói & cổng ngõ)
    ctx.beginPath();
    ctx.moveTo(730, 512);
    ctx.lineTo(730, 420);
    ctx.quadraticCurveTo(840, 365, 960, 390);
    ctx.lineTo(1024, 400);
    ctx.lineTo(1024, 512);
    ctx.closePath();
    ctx.fill();

    // Tiny warm glowing oil lamp windows in village houses (Ánh đèn dầu ấm áp trong xóm)
    ctx.fillStyle = 'rgba(255, 180, 60, 0.75)';
    ctx.fillRect(80, 440, 16, 12);
    ctx.fillRect(140, 442, 14, 10);
    ctx.fillRect(860, 435, 15, 12);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 6. Moonlit Village Courtyard & Pathway Texture (Sân đình gạch đất, lối đi nhỏ)
  public static createVillageGroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Earthy moonlit grass base
    ctx.fillStyle = '#0d181c';
    ctx.fillRect(0, 0, 512, 512);

    // Dirt pathway in center (lối mòn giữa sân đình)
    const pathGrad = ctx.createLinearGradient(180, 0, 330, 0);
    pathGrad.addColorStop(0, '#0d181c');
    pathGrad.addColorStop(0.3, '#1c2628');
    pathGrad.addColorStop(0.5, '#223032');
    pathGrad.addColorStop(0.7, '#1c2628');
    pathGrad.addColorStop(1, '#0d181c');
    ctx.fillStyle = pathGrad;
    ctx.fillRect(160, 0, 190, 512);

    // Subtle stone slabs / earth grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2 + Math.random() * 4, 1 + Math.random() * 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  // 7. Firefly Soft Radial Glow Texture (Đom đóm mùa thu)
  public static createFireflyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 200, 1.0)');
    grad.addColorStop(0.2, 'rgba(210, 255, 100, 0.85)');
    grad.addColorStop(0.5, 'rgba(120, 230, 60, 0.35)');
    grad.addColorStop(0.8, 'rgba(80, 200, 40, 0.08)');
    grad.addColorStop(1, 'rgba(80, 200, 40, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // 8. Low Ground Night Mist Ribbon Texture (Làn sương đêm thu)
  public static createNightMistTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(160, 200, 240, 0)');
    grad.addColorStop(0.3, 'rgba(180, 215, 250, 0.18)');
    grad.addColorStop(0.6, 'rgba(160, 205, 245, 0.15)');
    grad.addColorStop(1, 'rgba(140, 180, 220, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

    // Soft organic puffs in mist
    ctx.fillStyle = 'rgba(200, 230, 255, 0.08)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.ellipse(
        32 + i * 30 + Math.random() * 20,
        64 + (Math.random() - 0.5) * 20,
        45 + Math.random() * 25,
        25 + Math.random() * 15,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // 9. Banana Palm Fronds Silhouette (Tàu lá chuối bờ ao làng quê)
  public static createBananaPalmSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = '#030811';

    // 3 large arching banana leaves
    const leaves = [
      { startX: 100, cp1X: 180, cp1Y: 100, endX: 450, endY: 280, w: 55 },
      { startX: 120, cp1X: 240, cp1Y: 60, endX: 490, endY: 180, w: 60 },
      { startX: 80, cp1X: 120, cp1Y: 140, endX: 380, endY: 380, w: 50 }
    ];

    leaves.forEach(l => {
      // Main rachis stem
      ctx.strokeStyle = '#05101f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(l.startX, 512);
      ctx.quadraticCurveTo(l.cp1X, l.cp1Y, l.endX, l.endY);
      ctx.stroke();

      // Broad paddle-shaped blade
      ctx.beginPath();
      ctx.moveTo(l.startX, 512);
      ctx.quadraticCurveTo(l.cp1X - l.w, l.cp1Y - 20, l.endX, l.endY);
      ctx.quadraticCurveTo(l.cp1X + l.w * 0.8, l.cp1Y + 30, l.startX, 512);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 10. Glowing Red Cellophane Carp Lantern (Đèn cá chép đỏ trông trăng)
  public static createCarpLanternTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 384);

    // Glowing fish body gradient
    const bodyGrad = ctx.createRadialGradient(250, 192, 30, 250, 192, 180);
    bodyGrad.addColorStop(0, 'rgba(255, 230, 120, 0.95)');
    bodyGrad.addColorStop(0.3, 'rgba(255, 80, 20, 0.9)');
    bodyGrad.addColorStop(0.7, 'rgba(220, 30, 20, 0.85)');
    bodyGrad.addColorStop(1, 'rgba(160, 15, 15, 0.7)');

    // Fish body outline
    ctx.beginPath();
    ctx.moveTo(80, 192); // Mouth
    ctx.bezierCurveTo(140, 70, 320, 70, 410, 160); // Back
    ctx.bezierCurveTo(450, 192, 450, 192, 410, 224); // Tail stem
    ctx.bezierCurveTo(320, 314, 140, 314, 80, 192); // Belly
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Bamboo frame lines on fish
    ctx.strokeStyle = '#ffe494';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Flowing fish tail
    ctx.beginPath();
    ctx.moveTo(410, 160);
    ctx.bezierCurveTo(480, 100, 505, 120, 500, 180);
    ctx.bezierCurveTo(470, 192, 470, 192, 500, 204);
    ctx.bezierCurveTo(505, 264, 480, 284, 410, 224);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 60, 20, 0.82)';
    ctx.fill();
    ctx.strokeStyle = '#ffe494';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dorsal and pectoral fins
    ctx.beginPath();
    ctx.moveTo(220, 95);
    ctx.bezierCurveTo(250, 40, 330, 50, 350, 100);
    ctx.fillStyle = 'rgba(255, 80, 20, 0.8)';
    ctx.fill();

    // Scales pattern
    ctx.strokeStyle = 'rgba(255, 240, 150, 0.65)';
    ctx.lineWidth = 3;
    for (let col = 160; col < 380; col += 40) {
      for (let row = 130; row < 260; row += 35) {
        ctx.beginPath();
        ctx.arc(col, row, 22, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }
    }

    // Big expressive fish eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(140, 160, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffe494';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#100a08';
    ctx.beginPath();
    ctx.arc(144, 160, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(148, 154, 5, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 11. Mid-Autumn Feast Tray (Mâm cỗ trông trăng: Bánh nướng bánh dẻo, chó bưởi, hồng chín)
  public static createMooncakePlatterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Round woven bamboo tray
    const trayGrad = ctx.createRadialGradient(256, 256, 120, 256, 256, 250);
    trayGrad.addColorStop(0, '#5a4228');
    trayGrad.addColorStop(0.85, '#3b2918');
    trayGrad.addColorStop(1, '#20150b');
    ctx.fillStyle = trayGrad;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();

    // Woven bamboo rim
    ctx.strokeStyle = '#8a6840';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Green banana / lotus leaf lining under fruits
    ctx.fillStyle = '#1b3b1e';
    ctx.beginPath();
    ctx.ellipse(256, 256, 205, 195, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Carved White Pomelo Dog (Chó bưởi trắng xù xì đáng yêu)
    ctx.fillStyle = '#f0ebe1';
    // Body & head
    ctx.beginPath();
    ctx.arc(256, 190, 58, 0, Math.PI * 2);
    ctx.arc(256, 255, 75, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy pomelo fur texture
    ctx.strokeStyle = '#ded5c5';
    ctx.lineWidth = 3;
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      ctx.beginPath();
      ctx.arc(256 + Math.cos(a) * 58, 190 + Math.sin(a) * 58, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Eyes & nose: Black custard apple seeds (Hạt na đen)
    ctx.fillStyle = '#151515';
    ctx.beginPath();
    ctx.arc(235, 178, 7, 0, Math.PI * 2);
    ctx.arc(277, 178, 7, 0, Math.PI * 2);
    ctx.arc(256, 198, 8, 0, Math.PI * 2);
    ctx.fill();
    // Red ribbon bow
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(256, 222, 10, 0, Math.PI * 2);
    ctx.fill();

    // Golden Baked Mooncake (Bánh nướng vàng ươm)
    const cakeGrad = ctx.createRadialGradient(165, 345, 10, 165, 345, 45);
    cakeGrad.addColorStop(0, '#e58e26');
    cakeGrad.addColorStop(0.7, '#b75b14');
    cakeGrad.addColorStop(1, '#783808');
    ctx.fillStyle = cakeGrad;
    ctx.beginPath();
    ctx.arc(165, 345, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a2504';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Flower pattern on top
    ctx.strokeStyle = '#fed330';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(165 + Math.cos(ang) * 20, 345 + Math.sin(ang) * 20, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Snowy White Mooncake (Bánh dẻo trắng tinh khôi)
    const snowGrad = ctx.createRadialGradient(345, 345, 10, 345, 345, 45);
    snowGrad.addColorStop(0, '#ffffff');
    snowGrad.addColorStop(0.8, '#e8ecef');
    snowGrad.addColorStop(1, '#ccd5dc');
    ctx.fillStyle = snowGrad;
    ctx.beginPath();
    ctx.arc(345, 345, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ripe Red Persimmons (Quả hồng đỏ mọng)
    [
      { x: 135, y: 220, r: 24 },
      { x: 375, y: 225, r: 25 },
      { x: 256, y: 380, r: 22 }
    ].forEach(p => {
      ctx.fillStyle = '#eb4d4b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // Green calyx
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.r + 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 12. Warm Porch & Rural Family Silhouette (Hiên nhà người bà/mẹ ngồi quạt nan, mâm cỗ nhỏ viền sáng vàng ấm)
  public static createFamilyPorchSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 384);

    // Warm ambient glow inside the veranda leaking from the oil lamp
    const porchGlow = ctx.createRadialGradient(230, 200, 15, 230, 200, 240);
    porchGlow.addColorStop(0, 'rgba(255, 180, 50, 0.95)');
    porchGlow.addColorStop(0.35, 'rgba(230, 120, 30, 0.65)');
    porchGlow.addColorStop(0.75, 'rgba(140, 50, 15, 0.25)');
    porchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = porchGlow;
    ctx.fillRect(0, 0, 512, 384);

    // Architectural framework: Roof eave beam & wooden pillars & bamboo chõng floor
    ctx.fillStyle = '#060a14';
    ctx.fillRect(30, 30, 452, 28);  // Eave beam
    ctx.fillRect(60, 30, 22, 354);   // Left pillar
    ctx.fillRect(430, 30, 22, 354);  // Right pillar
    ctx.fillRect(30, 310, 452, 74);  // Porch floor (chõng tre lát sàn)

    // Bamboo slats pattern on porch floor
    ctx.strokeStyle = '#03050a';
    ctx.lineWidth = 3;
    for (let x = 40; x < 480; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 310);
      ctx.lineTo(x, 384);
      ctx.stroke();
    }

    // Low wooden table / chõng tre nhỏ
    ctx.fillStyle = '#070c18';
    ctx.fillRect(180, 260, 120, 14); // Table top
    ctx.fillRect(195, 274, 10, 38);  // Table leg L
    ctx.fillRect(275, 274, 10, 38);  // Table leg R

    // 1. Teapot & small cups on table with golden rim highlights
    ctx.fillStyle = '#050a14';
    ctx.beginPath();
    ctx.arc(215, 248, 12, 0, Math.PI * 2); // Teapot body
    ctx.fill();
    ctx.fillRect(208, 234, 14, 5); // Teapot lid
    ctx.fillRect(238, 252, 9, 8);  // Cup 1
    ctx.fillRect(250, 252, 9, 8);  // Cup 2

    // Warm golden rim highlight on teapot
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(215, 248, 12, -Math.PI * 0.8, -Math.PI * 0.1);
    ctx.stroke();

    // 2. Small Mooncake with golden glowing rim on plate
    ctx.fillStyle = '#080d1a';
    ctx.beginPath();
    ctx.ellipse(268, 253, 14, 7, 0, 0, Math.PI * 2); // Mooncake plate
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(268, 251, 8, -Math.PI * 0.9, -Math.PI * 0.1); // Warm lit crust of mooncake
    ctx.stroke();

    // 3. Small ripe green pomelo (Quả bưởi xanh nhỏ) with golden backlight
    ctx.fillStyle = '#050a14';
    ctx.beginPath();
    ctx.arc(288, 248, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a3e635'; // Lime green golden rim
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(288, 248, 11, -Math.PI * 0.8, -Math.PI * 0.1);
    ctx.stroke();

    // 4. Traditional Vietnamese oil lamp (Đèn dầu hoa kỳ) hanging or sitting on table
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(200, 228, 4, 0, Math.PI * 2); // Flame dot
    ctx.fill();
    const lampGlow = ctx.createRadialGradient(200, 228, 2, 200, 228, 30);
    lampGlow.addColorStop(0, 'rgba(255, 240, 160, 0.9)');
    lampGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
    lampGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(170, 198, 60, 60);

    // 5. Silhouette of Mother or Grandmother (Bà/Mẹ ngồi phe phẩy quạt nan)
    ctx.fillStyle = '#050a14';
    // Head with neat Vietnamese hair bun (búi tóc củ hành)
    ctx.beginPath();
    ctx.arc(140, 190, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(122, 190, 8, 0, Math.PI * 2); // Hair bun behind
    ctx.fill();

    // Traditional áo bà ba torso leaning forward affectionately towards road
    ctx.beginPath();
    ctx.moveTo(130, 210);
    ctx.quadraticCurveTo(155, 205, 165, 220);
    ctx.lineTo(170, 280);
    ctx.lineTo(115, 280);
    ctx.closePath();
    ctx.fill();

    // Arm and palm-leaf fan (Quạt nan lá cọ) held in hand
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#050a14';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(148, 230);
    ctx.quadraticCurveTo(168, 240, 180, 220); // Hand holding fan
    ctx.stroke();

    // Heart-shaped woven palm-leaf fan (Quạt nan)
    ctx.fillStyle = '#091022';
    ctx.beginPath();
    ctx.moveTo(180, 220);
    ctx.bezierCurveTo(175, 175, 215, 170, 215, 200);
    ctx.bezierCurveTo(215, 215, 195, 235, 180, 220);
    ctx.closePath();
    ctx.fill();
    // Warm highlight edge on fan
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 6. Child leaning close to mother, hands on table
    ctx.fillStyle = '#050a14';
    ctx.beginPath();
    ctx.arc(330, 215, 15, 0, Math.PI * 2); // Child head
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(315, 230);
    ctx.quadraticCurveTo(330, 225, 345, 230);
    ctx.lineTo(348, 290);
    ctx.lineTo(312, 290);
    ctx.closePath();
    ctx.fill();

    // Hanging red festive lantern under roof eave
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(256, 58);
    ctx.lineTo(256, 95);
    ctx.stroke();

    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.ellipse(256, 116, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 12B. Delicate Curling Tea Steam Particle Texture (Làn khói trà sen bốc lên nhè nhẹ)
  public static createTeaSteamTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 128, 256);

    // Soft organic vertical steam plume
    const grad = ctx.createLinearGradient(64, 256, 64, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.2, 'rgba(255, 245, 220, 0.35)');
    grad.addColorStop(0.6, 'rgba(255, 240, 200, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(64, 256);
    ctx.bezierCurveTo(45, 180, 85, 120, 60, 60);
    ctx.bezierCurveTo(50, 30, 70, 10, 64, 0);
    ctx.bezierCurveTo(78, 10, 80, 40, 75, 70);
    ctx.bezierCurveTo(95, 130, 55, 190, 64, 256);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 12C. Curved Catenary Festival Bunting & Lantern String (Dây cờ hoa & đèn lồng uốn cong võng)
  public static createFestivalBuntingTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 256);

    // 2 gracefully sagging catenary ropes across columns
    const ropes = [
      { yStart: 40, ySag: 110, yEnd: 40, w: 3 },
      { yStart: 90, ySag: 165, yEnd: 90, w: 2.5 }
    ];

    ropes.forEach((r, rIdx) => {
      // Slender dark hanging twine
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.85)';
      ctx.lineWidth = r.w;
      ctx.beginPath();
      ctx.moveTo(0, r.yStart);
      ctx.quadraticCurveTo(512, r.ySag, 1024, r.yEnd);
      ctx.stroke();

      // Alternating pennant flags & round festive lanterns
      const numItems = 22;
      for (let i = 1; i < numItems; i++) {
        const t = i / numItems;
        const x = t * 1024;
        // Quadratic bezier equation: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
        const y = Math.pow(1 - t, 2) * r.yStart + 2 * (1 - t) * t * r.ySag + Math.pow(t, 2) * r.yEnd;

        if (i % 2 === 0) {
          // Colorful triangular pennant flag (Cờ đuôi nheo ngũ sắc)
          const flagColors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#eccc68'];
          ctx.fillStyle = flagColors[(i + rIdx * 2) % flagColors.length];
          ctx.beginPath();
          ctx.moveTo(x - 12, y);
          ctx.lineTo(x + 12, y);
          ctx.lineTo(x, y + 36);
          ctx.closePath();
          ctx.fill();
        } else {
          // Warm glowing paper festival lantern
          ctx.strokeStyle = '#ffeaa7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 10);
          ctx.stroke();

          // Lantern body
          const lanternColors = ['#ff3838', '#ff9f1a', '#ffb142', '#eb4d4b'];
          ctx.fillStyle = lanternColors[(i + rIdx) % lanternColors.length];
          ctx.beginPath();
          ctx.ellipse(x, y + 20, 10, 13, 0, 0, Math.PI * 2);
          ctx.fill();

          // Golden tassel
          ctx.strokeStyle = '#ffd32a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + 33);
          ctx.lineTo(x, y + 45);
          ctx.stroke();
        }
      }
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 13. Running Village Child Silhouette (Em bé tung tăng rước đèn)
  public static createRunningChildSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 384, 384);

    ctx.fillStyle = '#050c18';

    // Child head with topknot hairstyle (tóc trái đào)
    ctx.beginPath();
    ctx.arc(190, 110, 24, 0, Math.PI * 2);
    ctx.fill();
    // Topknot
    ctx.beginPath();
    ctx.arc(190, 80, 10, 0, Math.PI * 2);
    ctx.fill();

    // Slanted energetic body
    ctx.beginPath();
    ctx.moveTo(170, 134);
    ctx.lineTo(220, 142);
    ctx.lineTo(205, 230);
    ctx.lineTo(155, 220);
    ctx.closePath();
    ctx.fill();

    // Running legs
    // Front leg forward
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#050c18';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(195, 225);
    ctx.lineTo(240, 275);
    ctx.lineTo(275, 310);
    ctx.stroke();

    // Back leg kicking backwards
    ctx.beginPath();
    ctx.moveTo(165, 225);
    ctx.lineTo(125, 270);
    ctx.lineTo(90, 290);
    ctx.stroke();

    // Arms: Right hand holding lantern stick forward-up
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(205, 150);
    ctx.lineTo(250, 130);
    ctx.lineTo(285, 95);
    ctx.stroke();

    // Left arm trailing backward
    ctx.beginPath();
    ctx.moveTo(175, 150);
    ctx.lineTo(135, 175);
    ctx.stroke();

    // Slender bamboo stick held high
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(270, 115);
    ctx.lineTo(320, 45);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // 14. Temple Gate Curved Roof & Festoons (Mái ngói cong cổng đình làng)
  public static createTempleGateRoofTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);

    ctx.fillStyle = '#060a15';

    // Main sweeping central roof
    ctx.beginPath();
    ctx.moveTo(80, 140);
    ctx.quadraticCurveTo(256, 75, 432, 140);
    ctx.quadraticCurveTo(465, 110, 480, 85); // Wingtip curved R
    ctx.lineTo(435, 155);
    ctx.quadraticCurveTo(256, 100, 77, 155);
    ctx.lineTo(32, 85); // Wingtip curved L
    ctx.quadraticCurveTo(47, 110, 80, 140);
    ctx.closePath();
    ctx.fill();

    // Ornate ridge ornament / Moon crest (Lưỡng long chầu nguyệt)
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(256, 76, 12, 0, Math.PI * 2);
    ctx.fill();

    // Side lower roofs
    ctx.fillStyle = '#060a15';
    // Left tier
    ctx.beginPath();
    ctx.moveTo(20, 195);
    ctx.quadraticCurveTo(80, 170, 140, 195);
    ctx.lineTo(135, 210);
    ctx.quadraticCurveTo(80, 185, 25, 210);
    ctx.closePath();
    ctx.fill();

    // Right tier
    ctx.beginPath();
    ctx.moveTo(372, 195);
    ctx.quadraticCurveTo(432, 170, 492, 195);
    ctx.lineTo(487, 210);
    ctx.quadraticCurveTo(432, 185, 377, 210);
    ctx.closePath();
    ctx.fill();

    // Festive hanging lanterns under eaves
    for (let x = 110; x <= 400; x += 32) {
      const dropY = 160 + Math.sin(((x - 110) / 290) * Math.PI) * 16;
      ctx.strokeStyle = '#ffeaa7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, dropY - 14);
      ctx.lineTo(x, dropY);
      ctx.stroke();

      ctx.fillStyle = x % 64 === 0 ? '#ff3838' : '#ff9f1a';
      ctx.beginPath();
      ctx.ellipse(x, dropY + 8, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 15. Banyan Tree Silhouette (Cây đa cổ thụ đầu làng rủ rễ)
  public static createBanyanTreeSilhouette(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = '#050c18';

    // Massive gnarly trunk
    ctx.beginPath();
    ctx.moveTo(180, 512);
    ctx.quadraticCurveTo(150, 360, 120, 240);
    ctx.quadraticCurveTo(240, 150, 380, 220);
    ctx.quadraticCurveTo(340, 370, 300, 512);
    ctx.closePath();
    ctx.fill();

    // Spreading canopy cloud
    const canopyClusters = [
      { x: 120, y: 160, r: 90 },
      { x: 230, y: 110, r: 110 },
      { x: 350, y: 130, r: 100 },
      { x: 440, y: 190, r: 75 },
      { x: 70, y: 220, r: 65 }
    ];
    canopyClusters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hanging aerial roots (Rễ đa rủ phong trần)
    ctx.strokeStyle = '#050c18';
    ctx.lineWidth = 4;
    [110, 150, 200, 260, 320, 370, 420].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo(rx, 200 + Math.random() * 40);
      ctx.quadraticCurveTo(rx + (Math.random() - 0.5) * 30, 360, rx + (Math.random() - 0.5) * 20, 512);
      ctx.stroke();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 16. Cupped Hand Protecting Candle (Bàn tay che chở nến khi gió thổi)
  public static createHandShieldTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 256);

    // Warm translucent palm and fingers
    ctx.fillStyle = 'rgba(255, 175, 90, 0.65)';
    ctx.beginPath();
    ctx.moveTo(60, 240);
    ctx.bezierCurveTo(35, 160, 50, 95, 110, 35);
    ctx.bezierCurveTo(145, 15, 180, 25, 195, 55);
    ctx.bezierCurveTo(205, 95, 180, 175, 145, 240);
    ctx.closePath();
    ctx.fill();

    // Radiant outer golden rim highlight
    ctx.strokeStyle = 'rgba(255, 235, 160, 0.95)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Deep warm glow reflecting the flame on palm
    const palmGlow = ctx.createRadialGradient(130, 110, 5, 130, 110, 75);
    palmGlow.addColorStop(0, 'rgba(255, 245, 190, 0.95)');
    palmGlow.addColorStop(0.45, 'rgba(255, 140, 30, 0.7)');
    palmGlow.addColorStop(0.85, 'rgba(255, 60, 10, 0.25)');
    palmGlow.addColorStop(1, 'rgba(255, 60, 10, 0)');
    ctx.fillStyle = palmGlow;
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 17. Ancient Temple Courtyard Paving (Sân đình lát gạch Bát Tràng cổ kính)
  public static createCourtyardPavingTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base deep night stone earth tone
    ctx.fillStyle = '#0c1424';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered terracotta flagstone paving grid (gạch vuông cổ)
    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const offset = ((y / tileSize) % 2) * (tileSize / 2);
        const tileX = (x + offset) % 512;

        // Subtle stone hue variation
        const hueShift = (Math.sin(tileX * 12.3 + y * 7.7) * 0.5 + 0.5);
        const r = Math.floor(18 + hueShift * 8);
        const g = Math.floor(26 + hueShift * 10);
        const b = Math.floor(40 + hueShift * 12);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(tileX + 2, y + 2, tileSize - 4, tileSize - 4);

        // Stone bevel highlight on top edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tileX + 3, y + 3, tileSize - 6, tileSize - 6);
      }
    }

    // Inter-tile mossy mortar lines
    ctx.strokeStyle = '#060a14';
    ctx.lineWidth = 2.5;
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Warm lantern light reflection pooling in the center
    const reflection = ctx.createRadialGradient(256, 256, 20, 256, 256, 240);
    reflection.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
    reflection.addColorStop(0.5, 'rgba(239, 68, 68, 0.08)');
    reflection.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // 18. Đình Làng Communal Temple Background Silhouette (Đình làng Bắc Bộ ngói mũi hài, bờ nóc thẳng, đao đình cong vút & các cụ già ngồi hiên)
  public static createDinhFacadeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 360);

    // Warm veranda glow centered in the courtyard (fading to transparent well before edges)
    const eaveGlow = ctx.createRadialGradient(512, 240, 50, 512, 240, 420);
    eaveGlow.addColorStop(0, 'rgba(245, 158, 11, 0.42)');
    eaveGlow.addColorStop(0.45, 'rgba(220, 38, 38, 0.18)');
    eaveGlow.addColorStop(0.8, 'rgba(220, 38, 38, 0.03)');
    eaveGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = eaveGlow;
    ctx.fillRect(0, 110, 1024, 250);

    // =========================================================================
    // 1. Authentic Northern Vietnamese Communal Roof (Mái đình Bắc Bộ)
    // - Bờ nóc thẳng nằm ngang, đao đình hai đầu vút cong thanh thoát
    // =========================================================================
    // Main Roof Body (Ngói mũi hài rêu phong sẫm màu)
    ctx.fillStyle = '#060a14';
    ctx.beginPath();
    // Start at left flared eave tip (Đầu đao bên trái)
    ctx.moveTo(35, 110);
    ctx.quadraticCurveTo(80, 135, 160, 145);
    // Straight horizontal eave beam under roof
    ctx.lineTo(864, 145);
    // Right flared eave tip (Đầu đao bên phải)
    ctx.quadraticCurveTo(944, 135, 989, 110);
    ctx.lineTo(965, 165);
    ctx.lineTo(60, 165);
    ctx.closePath();
    ctx.fill();

    // Upper Roof Slope (Mái dốc thẳng truyền thống)
    ctx.fillStyle = '#080f1e';
    ctx.beginPath();
    ctx.moveTo(220, 68); // Left upper ridge
    ctx.lineTo(804, 68); // Right upper ridge (Straight horizontal!)
    ctx.lineTo(950, 148); // Sloping down to right eave
    ctx.lineTo(74, 148);  // Sloping down to left eave
    ctx.closePath();
    ctx.fill();

    // Dragon ridge crest & Moon disc in center (Lưỡng long chầu nguyệt trên bờ nóc thẳng)
    ctx.fillStyle = '#040710';
    ctx.fillRect(215, 62, 594, 8); // Straight horizontal ridge beam

    // Center Moon disc on ridge
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(512, 52, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Two dragons flanking the center moon disc
    [-1, 1].forEach(dir => {
      ctx.fillStyle = '#0a1428';
      ctx.beginPath();
      ctx.moveTo(512 + dir * 22, 60);
      ctx.quadraticCurveTo(512 + dir * 55, 38, 512 + dir * 90, 52);
      ctx.quadraticCurveTo(512 + dir * 140, 62, 512 + dir * 180, 56);
      ctx.lineTo(512 + dir * 175, 64);
      ctx.quadraticCurveTo(512 + dir * 130, 68, 512 + dir * 22, 64);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // Flared dragon tail eave tips (Đao đình cong vút tại 2 góc mái)
    [-1, 1].forEach((dir, i) => {
      const cornerX = i === 0 ? 55 : 969;
      ctx.fillStyle = '#091224';
      ctx.beginPath();
      ctx.moveTo(cornerX, 150);
      ctx.quadraticCurveTo(cornerX - dir * 35, 105, cornerX - dir * 15, 75);
      ctx.quadraticCurveTo(cornerX - dir * 5, 95, cornerX + dir * 8, 142);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });

    // Subtle fish-scale tile row highlights (Ngói mũi hài)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 80; y < 145; y += 12) {
      ctx.beginPath();
      const leftX = 220 - (y - 68) * 1.8;
      const rightX = 804 + (y - 68) * 1.8;
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();
    }

    // =========================================================================
    // 2. Ironwood Pillars & Veranda (Hàng cột gỗ lim & hiên thoáng)
    // =========================================================================
    const pillars = [160, 260, 360, 460, 564, 664, 764, 864];
    pillars.forEach(px => {
      ctx.fillStyle = '#040710';
      ctx.fillRect(px - 9, 165, 18, 145);

      // Warm amber rim reflection
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 7, 165);
      ctx.lineTo(px + 7, 310);
      ctx.stroke();
    });

    // Stone Steps / Bậc tam cấp đình làng
    ctx.fillStyle = '#060a14';
    ctx.fillRect(110, 310, 804, 16); // Upper step
    ctx.fillStyle = '#050912';
    ctx.fillRect(80, 326, 864, 16);  // Middle step
    ctx.fillStyle = '#040710';
    ctx.fillRect(50, 342, 924, 18);  // Lower step

    // Stone step highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    [310, 326, 342].forEach(sy => {
      ctx.beginPath();
      ctx.moveTo(70, sy);
      ctx.lineTo(954, sy);
      ctx.stroke();
    });

    // =========================================================================
    // 3. Village Elders Watching Lion Dance (Các cụ già ngồi hiên xem múa lân)
    // =========================================================================
    // Elder 1 & 2 sitting on left steps with tea set
    ctx.fillStyle = '#040710';
    // Head with traditional turban (khăn xếp)
    ctx.beginPath();
    ctx.arc(210, 265, 12, 0, Math.PI * 2);
    ctx.arc(208, 261, 13, 0, Math.PI * 2); // Turban wrap
    ctx.fill();
    // Sitting posture in áo dài
    ctx.beginPath();
    ctx.moveTo(200, 277);
    ctx.quadraticCurveTo(225, 275, 235, 290);
    ctx.lineTo(240, 320);
    ctx.lineTo(185, 320);
    ctx.closePath();
    ctx.fill();

    // Small teapot & tea cups on step
    ctx.fillStyle = '#081020';
    ctx.beginPath();
    ctx.arc(255, 305, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Elder 3 sitting on right steps smiling with wooden walking stick
    ctx.fillStyle = '#040710';
    ctx.beginPath();
    ctx.arc(815, 268, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(805, 280);
    ctx.quadraticCurveTo(830, 278, 838, 292);
    ctx.lineTo(842, 322);
    ctx.lineTo(790, 322);
    ctx.closePath();
    ctx.fill();
    // Walking stick
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(800, 278);
    ctx.lineTo(792, 326);
    ctx.stroke();

    // Red festive lanterns hanging along veranda
    const lanternX = [210, 310, 410, 512, 614, 714, 814];
    lanternX.forEach(lx => {
      // Wire
      ctx.strokeStyle = '#040710';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 165);
      ctx.lineTo(lx, 185);
      ctx.stroke();

      // Red glow halo
      const rGlow = ctx.createRadialGradient(lx, 195, 2, lx, 195, 24);
      rGlow.addColorStop(0, 'rgba(255, 230, 160, 0.95)');
      rGlow.addColorStop(0.4, 'rgba(239, 68, 68, 0.85)');
      rGlow.addColorStop(0.8, 'rgba(185, 28, 28, 0.2)');
      rGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGlow;
      ctx.beginPath();
      ctx.arc(lx, 195, 24, 0, Math.PI * 2);
      ctx.fill();

      // Oval lantern body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(lx, 195, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 18A. Soft Blur Contact Shadow Texture for Ground Contacts
  public static createSoftShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 256);

    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 118);
    grad.addColorStop(0, 'rgba(2, 4, 8, 0.75)');
    grad.addColorStop(0.35, 'rgba(2, 4, 8, 0.5)');
    grad.addColorStop(0.7, 'rgba(2, 4, 8, 0.15)');
    grad.addColorStop(1, 'rgba(2, 4, 8, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 18B. Foreground Children Silhouettes (Bóng lưng trẻ em ở tiền cảnh — Góc nhìn bờ vai ấm cúng)
  public static createForegroundKidsTexture(side: 'left' | 'right'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    if (side === 'left') {
      // =======================================================================
      // LEFT FOREGROUND: 2 children standing right in front/side of player
      // - Kid A: Shaved head with topknot (tóc ba chỏm), leaning into clearing
      // - Kid B: Holding a condensed milk-can lantern on wire with glowing candle holes
      // =======================================================================
      // Kid A (Foreground left, child back & shoulders in silhouette)
      const ax = 160;
      const ay = 280;
      ctx.fillStyle = '#03050a';

      ctx.beginPath();
      ctx.moveTo(ax - 100, 512);
      ctx.lineTo(ax - 85, ay + 65);
      ctx.quadraticCurveTo(ax, ay + 15, ax + 95, ay + 55);
      ctx.lineTo(ax + 115, 512);
      ctx.closePath();
      ctx.fill();

      // Child Head tilted slightly right watching the lion
      ctx.beginPath();
      ctx.arc(ax + 10, ay - 20, 56, 0, Math.PI * 2);
      ctx.fill();

      // Traditional side tufts & topknot (tóc ba chỏm / đào)
      ctx.beginPath();
      ctx.arc(ax + 10, ay - 80, 16, 0, Math.PI * 2); // Center topknot
      ctx.arc(ax - 35, ay - 38, 12, 0, Math.PI * 2); // Left side tuft
      ctx.fill();

      // Warm amber rim light on shoulders & topknot from arena torches
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(ax + 10, ay - 20, 56, -Math.PI * 0.7, -Math.PI * 0.1);
      ctx.stroke();

      // Kid B (Tiptoeing beside Kid A, holding milk-can lantern)
      const bx = 360;
      const by = 220;
      ctx.fillStyle = '#050914';

      // Torso & arm reaching down holding wire
      ctx.beginPath();
      ctx.moveTo(bx - 45, 512);
      ctx.lineTo(bx - 35, by + 65);
      ctx.quadraticCurveTo(bx + 15, by + 25, bx + 65, by + 65);
      ctx.lineTo(bx + 85, 512);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(bx + 15, by, 44, 0, Math.PI * 2);
      ctx.fill();

      // Hair bun
      ctx.beginPath();
      ctx.arc(bx + 20, by - 46, 14, 0, Math.PI * 2);
      ctx.fill();

      // Arm extending holding thin wire
      ctx.strokeStyle = '#050914';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx + 20, by + 45);
      ctx.lineTo(bx + 42, by + 90);
      ctx.stroke();

      // Wire cord hanging down to milk-can lantern
      const canX = bx + 45;
      const canY = by + 125;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 42, by + 90);
      ctx.lineTo(canX, canY);
      ctx.stroke();

      // Milk-can lantern body (Lon sữa bò đục lỗ)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(canX - 22, canY, 44, 50, 6);
      ctx.fill();

      // Golden light spilling from punched holes!
      const canGlow = ctx.createRadialGradient(canX, canY + 25, 3, canX, canY + 25, 55);
      canGlow.addColorStop(0, 'rgba(255, 240, 160, 0.95)');
      canGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.65)');
      canGlow.addColorStop(0.85, 'rgba(245, 158, 11, 0.15)');
      canGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = canGlow;
      ctx.beginPath();
      ctx.arc(canX, canY + 25, 55, 0, Math.PI * 2);
      ctx.fill();

      // Star-shaped punched holes on milk can
      ctx.fillStyle = '#ffedd5';
      const holeCoords = [
        [-10, 14], [0, 10], [10, 14],
        [-12, 25], [0, 25], [12, 25],
        [-10, 36], [0, 40], [10, 36]
      ];
      holeCoords.forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.arc(canX + hx, canY + hy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

    } else {
      // =======================================================================
      // RIGHT FOREGROUND: Friend sitting beside player's star lantern
      // - Kid crouching forward, hands on knees, admiring the lion
      // =======================================================================
      const rx = 330;
      const ry = 280;
      ctx.fillStyle = '#03050a';

      // Child back & shoulders
      ctx.beginPath();
      ctx.moveTo(rx + 110, 512);
      ctx.lineTo(rx + 90, ry + 65);
      ctx.quadraticCurveTo(rx, ry + 20, rx - 90, ry + 55);
      ctx.lineTo(rx - 110, 512);
      ctx.closePath();
      ctx.fill();

      // Head tilted eagerly toward center
      ctx.beginPath();
      ctx.arc(rx - 15, ry - 15, 52, 0, Math.PI * 2);
      ctx.fill();

      // Hair bun with chopstick / pin
      ctx.beginPath();
      ctx.arc(rx - 25, ry - 65, 16, 0, Math.PI * 2);
      ctx.fill();

      // Subtle warm rim glow from player's nearby star lantern
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx - 15, ry - 15, 52, Math.PI * 0.2, Math.PI * 0.9);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 19. Children Crowd Silhouettes (Lũ trẻ quây quần vòng bán nguyệt: ngồi xổm, kiễng chân, cầm đủ loại đèn)
  public static createFestivalCrowdTexture(side: 'left' | 'right' | 'front'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 384);

    // Warm backlight from the arena fire casting onto crowd silhouettes
    const crowdGlow = ctx.createLinearGradient(0, 384, 0, 140);
    crowdGlow.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
    crowdGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
    crowdGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = crowdGlow;
    ctx.fillRect(0, 0, 1024, 384);

    // Define 22 varied child/villager characters across the width
    const characters = [
      // 1. Sitting child hugging knees (Front row)
      { type: 'sit_knees', x: 55, h: 95 },
      // 2. Standing kid waving star lantern
      { type: 'star_lantern', x: 100, h: 145 },
      // 3. Crouching kid with milk-can lantern
      { type: 'milk_can', x: 145, h: 105 },
      // 4. Kid on tiptoes with arms raised
      { type: 'tiptoe_cheer', x: 195, h: 165 },
      // 5. Parent carrying toddler on shoulders (Back row)
      { type: 'parent_toddler', x: 245, h: 220 },
      // 6. Kid waving carp lantern
      { type: 'carp_lantern', x: 295, h: 140 },
      // 7. Sitting kid resting chin on hands (Front row)
      { type: 'sit_chin', x: 340, h: 90 },
      // 8. Kid playing frog clapper drum
      { type: 'frog_drum', x: 385, h: 135 },
      // 9. Jumping child waving two hands
      { type: 'jump_cheer', x: 435, h: 170 },
      // 10. Standing kid holding bright star lantern
      { type: 'star_lantern', x: 485, h: 150 },
      // 11. Crouching kid leaning forward (Front row)
      { type: 'crouch_lean', x: 535, h: 100 },
      // 12. Kid on tiptoes looking upward
      { type: 'tiptoe_look', x: 585, h: 160 },
      // 13. Kid holding milk-can lantern on stick
      { type: 'milk_can', x: 635, h: 125 },
      // 14. Elder standing with walking stick (Back row)
      { type: 'elder', x: 685, h: 195 },
      // 15. Sitting child clapping hands (Front row)
      { type: 'sit_clap', x: 730, h: 92 },
      // 16. Kid waving carp lantern
      { type: 'carp_lantern', x: 775, h: 145 },
      // 17. Cheering kid waving star lantern
      { type: 'star_lantern', x: 825, h: 155 },
      // 18. Kid on tiptoes jumping
      { type: 'jump_cheer', x: 875, h: 168 },
      // 19. Sitting child (Front row)
      { type: 'sit_knees', x: 920, h: 88 },
      // 20. Parent with little kid (Back row)
      { type: 'parent_toddler', x: 970, h: 215 }
    ];

    characters.forEach((char, i) => {
      const cx = char.x + (Math.sin(i * 4.1) * 8);
      const isFront = char.h < 115;
      const isBack = char.h > 185;
      const baseY = 384;
      const headRadius = isFront ? 14 : (isBack ? 19 : 16);
      const headY = baseY - char.h;

      ctx.fillStyle = isFront ? '#040710' : (isBack ? '#081022' : '#060b18');

      // 1. Body & Torso
      ctx.beginPath();
      if (char.type.startsWith('sit') || char.type.startsWith('crouch')) {
        // Compact squatting / sitting silhouette
        ctx.ellipse(cx, baseY - char.h * 0.45, char.h * 0.38, char.h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standing / jumping torso
        ctx.moveTo(cx - headRadius * 1.3, headY + headRadius * 0.9);
        ctx.quadraticCurveTo(cx, headY + headRadius * 0.7, cx + headRadius * 1.3, headY + headRadius * 0.9);
        ctx.lineTo(cx + headRadius * 1.8, baseY);
        ctx.lineTo(cx - headRadius * 1.8, baseY);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Head
      ctx.beginPath();
      ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Traditional Vietnamese hairstyle: hair bun or side tufts (búi củ hành / tóc ba chỏm)
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(cx + (side === 'left' ? 6 : -6), headY - headRadius * 0.85, headRadius * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else if (i % 3 === 0) {
        // Two side tufts (hai chỏm tóc trẻ con)
        ctx.beginPath();
        ctx.arc(cx - 8, headY - 10, 5, 0, Math.PI * 2);
        ctx.arc(cx + 8, headY - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Special Accessories & Handheld Lanterns
      if (char.type === 'star_lantern') {
        // Slender bamboo stick and 5-point star lantern
        const lX = cx + (side === 'left' ? 24 : -24);
        const lY = headY - 32;

        ctx.strokeStyle = '#050a14';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + (side === 'left' ? 10 : -10), headY + 12);
        ctx.lineTo(lX, lY);
        ctx.stroke();

        // Warm radial glow
        const lGlow = ctx.createRadialGradient(lX, lY, 2, lX, lY, 26);
        lGlow.addColorStop(0, 'rgba(255, 235, 140, 0.95)');
        lGlow.addColorStop(0.45, 'rgba(245, 158, 11, 0.6)');
        lGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = lGlow;
        ctx.beginPath();
        ctx.arc(lX, lY, 26, 0, Math.PI * 2);
        ctx.fill();

        // 5-point Star
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = (p * Math.PI * 2) / 5 - Math.PI / 2;
          const ia = a + Math.PI / 5;
          const ox = lX + Math.cos(a) * 12;
          const oy = lY + Math.sin(a) * 12;
          const ix = lX + Math.cos(ia) * 5;
          const iy = lY + Math.sin(ia) * 5;
          if (p === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
      } else if (char.type === 'milk_can') {
        // Condensed milk-can lantern on wheels (Đèn lon sữa bò đục lỗ)
        const canX = cx + 22;
        const canY = baseY - 20;

        // Pulling wire
        ctx.strokeStyle = '#060b18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 8, headY + 20);
        ctx.lineTo(canX, canY);
        ctx.stroke();

        // Cylinder can
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(canX - 8, canY - 14, 16, 18);

        // Wheels
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(canX - 6, canY + 5, 5, 0, Math.PI * 2);
        ctx.arc(canX + 6, canY + 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing punched holes spilling golden sparks
        const canGlow = ctx.createRadialGradient(canX, canY - 5, 1, canX, canY - 5, 18);
        canGlow.addColorStop(0, 'rgba(255, 240, 160, 0.95)');
        canGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
        canGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = canGlow;
        ctx.beginPath();
        ctx.arc(canX, canY - 5, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.type === 'carp_lantern') {
        // Glowing red fish/carp lantern
        const fX = cx + (side === 'left' ? 22 : -22);
        const fY = headY - 25;

        // Stick
        ctx.strokeStyle = '#050a14';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + (side === 'left' ? 8 : -8), headY + 14);
        ctx.lineTo(fX, fY);
        ctx.stroke();

        // Fish glow
        const fGlow = ctx.createRadialGradient(fX, fY, 2, fX, fY, 24);
        fGlow.addColorStop(0, 'rgba(255, 230, 160, 0.95)');
        fGlow.addColorStop(0.45, 'rgba(239, 68, 68, 0.6)');
        fGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = fGlow;
        ctx.beginPath();
        ctx.arc(fX, fY, 24, 0, Math.PI * 2);
        ctx.fill();

        // Carp silhouette
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(fX, fY, 14, 8, side === 'left' ? -0.2 : 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(fX + (side === 'left' ? -12 : 12), fY);
        ctx.lineTo(fX + (side === 'left' ? -20 : 20), fY - 7);
        ctx.lineTo(fX + (side === 'left' ? -20 : 20), fY + 7);
        ctx.closePath();
        ctx.fill();
      } else if (char.type === 'frog_drum') {
        // Clapper drum (Trống lắc tí tách)
        const dX = cx + 18;
        const dY = headY - 15;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(dX, dY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (char.type.includes('cheer')) {
        // Arms high in air shouting
        ctx.strokeStyle = '#050a14';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 8, headY + 12);
        ctx.lineTo(cx - 18, headY - 22);
        ctx.moveTo(cx + 8, headY + 12);
        ctx.lineTo(cx + 18, headY - 22);
        ctx.stroke();
      }

      // Warm rim lighting from festival fire on heads & shoulders
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, headY, headRadius, -Math.PI * 0.8, -Math.PI * 0.1);
      ctx.stroke();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 20. Authentic Vietnamese Traditional Lion Head (Đầu Lân Rực Rỡ Dân Gian)
  public static createLionHeadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;

    // 1. Layered Multi-color Fur Fringe (Bờm ngũ sắc uốn lượn)
    const maneLayers = [
      { r: 215, col: '#10b981', w: 26 }, // Ngọc lục bảo
      { r: 195, col: '#0284c7', w: 24 }, // Xanh lam
      { r: 175, col: '#f59e0b', w: 22 }, // Vàng hoàng kim
      { r: 155, col: '#ea580c', w: 20 }, // Cam lửa
      { r: 135, col: '#dc2626', w: 18 }  // Đỏ son
    ];
    maneLayers.forEach(layer => {
      ctx.fillStyle = layer.col;
      const count = 16;
      for (let i = 0; i <= count; i++) {
        const a = Math.PI * 0.85 + (i / count) * Math.PI * 1.3;
        const px = cx + Math.cos(a) * layer.r;
        const py = cy + Math.sin(a) * layer.r * 0.9;
        ctx.beginPath();
        ctx.arc(px, py, layer.w * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 2. Sculpted Dragon-Lion Face Base (Khuôn mặt lân truyền thống)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 15, 125, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Cheeks & Snout curvature (Má lân tròn bầu bĩnh)
    [-55, 55].forEach(mx => {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx + mx, cy + 35, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // 3. Golden Horn on Forehead with Luminous Jewel (Sừng lân thếp vàng & Gương bát quái)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 70);
    ctx.lineTo(cx, cy - 170);
    ctx.lineTo(cx + 20, cy - 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Round lucky mirror on forehead
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy - 65, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Jewel inner shine
    const jewelGlow = ctx.createRadialGradient(cx, cy - 65, 2, cx, cy - 65, 20);
    jewelGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    jewelGlow.addColorStop(0.5, 'rgba(254, 240, 138, 0.8)');
    jewelGlow.addColorStop(1, 'rgba(245, 158, 11, 0.3)');
    ctx.fillStyle = jewelGlow;
    ctx.fill();

    // 4. Soulful Traditional Almond Dragon-Lion Eyes (Đôi mắt lân đuôi phượng xếch kiêu hãnh)
    [-58, 58].forEach((ex, eyeIdx) => {
      const tilt = eyeIdx === 0 ? -0.14 : 0.14;

      // Golden ornate eye socket with upturned outer wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx + ex, cy - 12, 42, 32, tilt, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Almond white sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx + ex, cy - 12, 34, 25, tilt, 0, Math.PI * 2);
      ctx.fill();

      // Deep amber-gold lacquer iris
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx + ex, cy - 12, 21, 23, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shimmering gold inner ring
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx + ex, cy - 12, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Deep obsidian pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx + ex, cy - 12, 12, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Double sparkling catchlights (ánh mắt có hồn)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + ex - 5, cy - 17, 5.5, 0, Math.PI * 2);
      ctx.arc(cx + ex + 4, cy - 7, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Curving bushy white eyebrows (Lông mày trắng quý phái)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx + ex, cy - 32, 36, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();

      // Jade green accent line above eyebrow
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx + ex, cy - 36, 38, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    });

    // 5. Smiling Mouth & White Teeth (Miệng lân tươi vui ngậm lộc đỏ)
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 90, 85, 40, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // White teeth
    ctx.fillStyle = '#f8fafc';
    for (let t = -60; t <= 60; t += 24) {
      ctx.fillRect(cx + t - 8, cy + 85, 16, 12);
    }

    // Soft white beard flowing beneath chin (Râu lân trắng tinh)
    ctx.fillStyle = '#fef3c7';
    for (let b = -70; b <= 70; b += 16) {
      ctx.beginPath();
      ctx.ellipse(cx + b, cy + 128, 10, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Auspicious Red Ribbon Scroll (Liễn đỏ thắm thêu hoa văn)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 115);
    ctx.lineTo(cx + 24, cy + 115);
    ctx.quadraticCurveTo(cx + 32, cy + 180, cx + 20, cy + 235);
    ctx.lineTo(cx - 20, cy + 235);
    ctx.quadraticCurveTo(cx - 32, cy + 180, cx - 24, cy + 115);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // 20B. Traditional Lion Ear Texture (Tai lân hình lá quạt viền lông vàng)
  public static createLionEarTexture(side: 'left' | 'right'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 128, 160);

    // Leaf/fan curved ear outline
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(64, 150);
    if (side === 'left') {
      ctx.quadraticCurveTo(10, 120, 15, 60);
      ctx.quadraticCurveTo(20, 10, 64, 15);
      ctx.quadraticCurveTo(105, 30, 110, 80);
      ctx.quadraticCurveTo(115, 130, 64, 150);
    } else {
      ctx.quadraticCurveTo(118, 120, 113, 60);
      ctx.quadraticCurveTo(108, 10, 64, 15);
      ctx.quadraticCurveTo(23, 30, 18, 80);
      ctx.quadraticCurveTo(13, 130, 64, 150);
    }
    ctx.closePath();
    ctx.fill();

    // Inner ear warm orange shading
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(64, 75, 28, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy golden fur fringe along outer perimeter
    ctx.fillStyle = '#fef08a';
    const numTufts = 9;
    for (let i = 0; i <= numTufts; i++) {
      const a = (i / numTufts) * Math.PI * 1.2 + 0.3;
      const tx = 64 + Math.cos(a) * 48 * (side === 'left' ? -1 : 1);
      const ty = 75 - Math.sin(a) * 55;
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 21. Traditional Embroidered Silk Lion Body (Thân lân lụa đỏ thêu vảy rồng vàng gợn sóng)
  public static createLionBodyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Rich crimson silk gradient
    const silkGrad = ctx.createLinearGradient(0, 0, 512, 256);
    silkGrad.addColorStop(0, '#991b1b');
    silkGrad.addColorStop(0.5, '#dc2626');
    silkGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = silkGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Embroidered dragon scales (Vảy lân thêu chỉ kim tuyến vàng óng)
    const scaleW = 44;
    const scaleH = 32;
    for (let row = 0; row < 256; row += scaleH * 0.72) {
      const offset = ((row / (scaleH * 0.72)) % 2) * (scaleW / 2);
      for (let col = -scaleW; col < 512 + scaleW; col += scaleW) {
        const sx = col + offset;
        const sy = row;

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(sx, sy, scaleW * 0.45, 0, Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sx, sy + 3, scaleW * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }

    // Soft fluffy golden fur fringe along hem
    ctx.fillStyle = '#fef08a';
    for (let x = 0; x < 512; x += 16) {
      ctx.beginPath();
      ctx.arc(x, 248, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 22. Festival Sparkle Particle (Tia hạt sáng lấp lánh khi lân nhảy múa)
  public static createSparkTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 64, 64);

    const sparkGlow = ctx.createRadialGradient(32, 32, 1, 32, 32, 28);
    sparkGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sparkGlow.addColorStop(0.2, 'rgba(254, 240, 138, 0.9)');
    sparkGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
    sparkGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sparkGlow;
    ctx.fillRect(0, 0, 64, 64);

    // 4-point star spike
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.quadraticCurveTo(32, 32, 58, 32);
    ctx.quadraticCurveTo(32, 32, 32, 58);
    ctx.quadraticCurveTo(32, 32, 6, 32);
    ctx.quadraticCurveTo(32, 32, 32, 6);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 23. Festival Smoke / Dust Puff (Làn khói pháo mỏng nhẹ quanh chân lân)
  public static createFestivalSmokeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 128, 128);

    const smokeGlow = ctx.createRadialGradient(64, 64, 8, 64, 64, 58);
    smokeGlow.addColorStop(0, 'rgba(254, 243, 199, 0.65)');
    smokeGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
    smokeGlow.addColorStop(0.75, 'rgba(220, 38, 38, 0.12)');
    smokeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = smokeGlow;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 24. Player's Child Persona with Radiant Star Lantern (Vòng tròn bè bạn nhìn ngược lên đầu lân)
  public static createPlayerChildWithLanternTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 1024);

    // Warm atmospheric ground glow
    const groundGlow = ctx.createRadialGradient(512, 920, 20, 512, 920, 480);
    groundGlow.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
    groundGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.12)');
    groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = groundGlow;
    ctx.fillRect(0, 700, 1024, 324);

    // =========================================================================
    // 1. LEFT FRIEND: Holding spinning milk-can lantern (đèn lon sữa bò)
    // =========================================================================
    ctx.save();
    // Friend body
    ctx.fillStyle = '#17223b';
    ctx.beginPath();
    ctx.moveTo(210, 960);
    ctx.lineTo(235, 710);
    ctx.quadraticCurveTo(260, 640, 290, 650);
    ctx.lineTo(330, 710);
    ctx.lineTo(350, 960);
    ctx.closePath();
    ctx.fill();

    // Friend head (looking up to top-center)
    ctx.beginPath();
    ctx.arc(285, 605, 48, 0, Math.PI * 2);
    ctx.fill();
    // Topknot hair tuft (chỏm tóc)
    ctx.beginPath();
    ctx.arc(275, 550, 16, 0, Math.PI * 2);
    ctx.fill();

    // Arm holding cane
    ctx.strokeStyle = '#17223b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(310, 680);
    ctx.lineTo(365, 610);
    ctx.lineTo(380, 520);
    ctx.stroke();

    // Bamboo stick
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(380, 530);
    ctx.lineTo(385, 410);
    ctx.stroke();

    // Milk-can lantern with star-shaped light pinpricks
    const canGlow = ctx.createRadialGradient(385, 460, 5, 385, 460, 85);
    canGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    canGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.65)');
    canGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = canGlow;
    ctx.beginPath();
    ctx.arc(385, 460, 85, 0, Math.PI * 2);
    ctx.fill();

    // Cylindrical perforated tin can silhouette
    ctx.fillStyle = '#78350f';
    ctx.fillRect(368, 435, 34, 52);
    // Golden pinprick stars on can
    ctx.fillStyle = '#ffffff';
    [[376, 448], [385, 458], [394, 450], [380, 470], [390, 474]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // =========================================================================
    // 2. RIGHT SIBLING: Holding red carp lantern (đèn cá chép)
    // =========================================================================
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(680, 960);
    ctx.lineTo(700, 740);
    ctx.quadraticCurveTo(730, 675, 765, 685);
    ctx.lineTo(795, 740);
    ctx.lineTo(820, 960);
    ctx.closePath();
    ctx.fill();

    // Head looking up
    ctx.beginPath();
    ctx.arc(745, 635, 44, 0, Math.PI * 2);
    ctx.fill();

    // Arm holding carp lantern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(715, 710);
    ctx.lineTo(655, 640);
    ctx.stroke();

    // Red carp lantern
    const carpGlow = ctx.createRadialGradient(640, 600, 5, 640, 600, 75);
    carpGlow.addColorStop(0, 'rgba(254, 202, 202, 0.9)');
    carpGlow.addColorStop(0.4, 'rgba(239, 68, 68, 0.7)');
    carpGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = carpGlow;
    ctx.beginPath();
    ctx.arc(640, 600, 75, 0, Math.PI * 2);
    ctx.fill();

    // Carp fish silhouette
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(640, 600, 36, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Fin & tail
    ctx.beginPath();
    ctx.moveTo(670, 595);
    ctx.lineTo(695, 575);
    ctx.lineTo(685, 605);
    ctx.lineTo(698, 625);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // =========================================================================
    // 3. CENTER HERO: THE PLAYER'S CHILD PERSONA (Tuổi thơ của chính người chơi)
    // =========================================================================
    ctx.save();
    // Warm lantern rim light cast onto child body
    const heroGlow = ctx.createRadialGradient(512, 330, 10, 512, 540, 260);
    heroGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    heroGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
    heroGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = heroGlow;
    ctx.beginPath();
    ctx.arc(512, 540, 260, 0, Math.PI * 2);
    ctx.fill();

    // Child body (wearing traditional linen áo bà ba / áo cộc)
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(430, 960);
    ctx.lineTo(455, 680);
    ctx.quadraticCurveTo(512, 600, 565, 680);
    ctx.lineTo(595, 960);
    ctx.closePath();
    ctx.fill();

    // Warm amber rim highlight on child's shoulders and back
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(465, 675);
    ctx.quadraticCurveTo(512, 615, 555, 675);
    ctx.stroke();

    // Child head gazing up with wonder toward the lion
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(512, 565, 56, 0, Math.PI * 2);
    ctx.fill();

    // Soft face profile highlight
    ctx.fillStyle = 'rgba(254, 215, 170, 0.85)';
    ctx.beginPath();
    ctx.arc(500, 555, 18, 0, Math.PI * 2);
    ctx.fill();

    // Traditional folk topknot hair tuft (chỏm tóc quả đào)
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(500, 500, 20, 0, Math.PI * 2);
    ctx.fill();

    // Both hands raised holding the bamboo cane stick
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(475, 670);
    ctx.lineTo(512, 530);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(550, 670);
    ctx.lineTo(512, 530);
    ctx.stroke();

    // Slender golden bamboo cane stick pointing up to the Star Lantern
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(512, 550);
    ctx.lineTo(512, 330);
    ctx.stroke();

    // =========================================================================
    // 4. THE RADIANT STAR LANTERN (Chiếc đèn ông sao phát sáng rực rỡ nhất)
    // =========================================================================
    const starCenterX = 512;
    const starCenterY = 280;
    const starOuterR = 145;
    const starInnerR = 58;

    // Immense luminous golden glow bloom
    const starBloom = ctx.createRadialGradient(starCenterX, starCenterY, 15, starCenterX, starCenterY, 260);
    starBloom.addColorStop(0, 'rgba(255, 255, 255, 1)');
    starBloom.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)');
    starBloom.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)');
    starBloom.addColorStop(0.8, 'rgba(220, 38, 38, 0.3)');
    starBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = starBloom;
    ctx.beginPath();
    ctx.arc(starCenterX, starCenterY, 260, 0, Math.PI * 2);
    ctx.fill();

    // Outer bamboo hoop ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(starCenterX, starCenterY, starOuterR * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Five-pointed star body (Translucent Red Cellophane Paper with gold rim)
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? starOuterR : starInnerR;
      const x = starCenterX + Math.cos(angle) * r;
      const y = starCenterY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Red cellophane fill with warm gradient
    const starFill = ctx.createRadialGradient(starCenterX, starCenterY, 5, starCenterX, starCenterY, starOuterR);
    starFill.addColorStop(0, '#fef08a');
    starFill.addColorStop(0.28, '#f59e0b');
    starFill.addColorStop(0.7, '#dc2626');
    starFill.addColorStop(1, '#991b1b');
    ctx.fillStyle = starFill;
    ctx.fill();

    // Golden bamboo frame ribs
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Star internal bamboo struts
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(starCenterX, starCenterY);
      ctx.lineTo(starCenterX + Math.cos(angle) * starOuterR, starCenterY + Math.sin(angle) * starOuterR);
      ctx.stroke();
    }
    ctx.restore();

    // Central candle flame highlight spark
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(starCenterX, starCenterY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  // 25. Village Festival Entrance Arch & Hanging Lanterns (Hậu cảnh nhìn ngược ra đường làng)
  public static createVillageFestivalEntranceTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 512);

    // Distant nocturnal village gate silhouette
    ctx.fillStyle = '#060d1f';
    // Left pillar & arched gate
    ctx.fillRect(80, 200, 100, 312);
    ctx.fillRect(844, 200, 100, 312);

    // Curved gate tile roof
    ctx.beginPath();
    ctx.moveTo(40, 220);
    ctx.quadraticCurveTo(512, 140, 984, 220);
    ctx.lineTo(964, 180);
    ctx.quadraticCurveTo(512, 110, 60, 180);
    ctx.closePath();
    ctx.fill();

    // Swag strings of festival bunting & paper lanterns
    const lanternColors = ['#ef4444', '#f59e0b', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    for (let c = 0; c < 12; c++) {
      const lx = 140 + c * 64;
      const ly = 240 + Math.sin((c / 11) * Math.PI) * 45;
      const col = lanternColors[c % lanternColors.length];

      // Lantern glow
      const lGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 32);
      lGlow.addColorStop(0, '#ffffff');
      lGlow.addColorStop(0.35, col);
      lGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 32, 0, Math.PI * 2);
      ctx.fill();

      // Oval lantern body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 26. Traditional Village Rooftop Cluster with Glowing Windows (Mái nhà cổ & đốm sáng cửa sổ)
  public static createVillageRooftopClusterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);

    // House walls silhouette
    ctx.fillStyle = '#060b18';
    ctx.fillRect(40, 130, 200, 110);
    ctx.fillRect(260, 110, 210, 130);

    // Warm glowing oil lamp / candle windows
    const windowGlow = (x: number, y: number, w: number, h: number) => {
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, 24);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#fef08a');
      g.addColorStop(0.65, 'rgba(245, 158, 11, 0.7)');
      g.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x, y, w, h);
      // Window wooden mullions
      ctx.strokeStyle = '#381a07';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w / 2, y + h);
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
      ctx.stroke();
    };

    windowGlow(80, 160, 24, 28);
    windowGlow(160, 165, 20, 24);
    windowGlow(310, 145, 28, 32);
    windowGlow(390, 150, 22, 26);

    // Curved Terracotta Roof 1 (Left House)
    ctx.fillStyle = '#0a1024';
    ctx.beginPath();
    ctx.moveTo(20, 135);
    ctx.quadraticCurveTo(140, 65, 255, 135);
    ctx.quadraticCurveTo(265, 110, 275, 90);
    ctx.lineTo(245, 145);
    ctx.quadraticCurveTo(140, 85, 25, 145);
    ctx.closePath();
    ctx.fill();

    // Tile ridge highlight
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(25, 133);
    ctx.quadraticCurveTo(140, 67, 260, 133);
    ctx.stroke();

    // Curved Terracotta Roof 2 (Right Higher House)
    ctx.fillStyle = '#080d1e';
    ctx.beginPath();
    ctx.moveTo(240, 115);
    ctx.quadraticCurveTo(365, 45, 490, 115);
    ctx.quadraticCurveTo(500, 95, 510, 75);
    ctx.lineTo(480, 125);
    ctx.quadraticCurveTo(365, 65, 245, 125);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(245, 113);
    ctx.quadraticCurveTo(365, 47, 495, 113);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // 27. Broad Nocturnal Landscape Texture (Đất quê đêm rằm, vệt bờ ruộng & ao làng)
  public static createNocturnalLandscapeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep nocturnal earth tone
    ctx.fillStyle = '#040713';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle moonlit field dykes & paths (Bờ ruộng uốn lượn)
    ctx.strokeStyle = 'rgba(18, 32, 64, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    // Meandering rural road
    ctx.moveTo(512, 0);
    ctx.quadraticCurveTo(460, 300, 512, 512);
    ctx.quadraticCurveTo(580, 750, 480, 1024);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.quadraticCurveTo(300, 460, 512, 512);
    ctx.quadraticCurveTo(800, 560, 1024, 520);
    ctx.stroke();

    // Village ponds reflecting moonlit indigo sheen (Ao làng phẳng lặng)
    const drawPond = (cx: number, cy: number, rx: number, ry: number) => {
      const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
      g.addColorStop(0, 'rgba(25, 45, 85, 0.7)');
      g.addColorStop(0.7, 'rgba(12, 22, 45, 0.5)');
      g.addColorStop(1, 'rgba(4, 7, 19, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.1, 0, Math.PI * 2);
      ctx.fill();
    };

    drawPond(280, 320, 120, 80);
    drawPond(760, 700, 140, 95);
    drawPond(300, 760, 90, 60);

    return new THREE.CanvasTexture(canvas);
  }

  // 28. Soft Nocturnal Courtyard Fog Feathering Mask (Lớp sương mờ phủ 4 cạnh mép sân đình)
  public static createCourtyardFogFeatherTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // #050B14 in RGB: (5, 11, 20)
    const fogR = 5;
    const fogG = 11;
    const fogB = 20;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      const dv = Math.abs(v - 0.5) * 2.0; // 0 at center, 1.0 at top/bottom edges
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const du = Math.abs(u - 0.5) * 2.0; // 0 at center, 1.0 at left/right edges

        // Distance from center: inner core is transparent, edges ramp to solid fog
        const dMax = Math.max(du, dv);
        const dEuclid = Math.sqrt(du * du + dv * dv);
        // Rounded rectangular distance
        const dist = Math.max(dMax, dEuclid * 0.72);

        // Core 0..0.40: completely clear courtyard (alpha = 0)
        // Transition 0.40..0.88: smooth cubic fade to night fog
        // Perimeter >= 0.88: solid night fog (alpha = 1.0)
        let alpha = 0;
        if (dist <= 0.40) {
          alpha = 0;
        } else if (dist >= 0.88) {
          alpha = 1.0;
        } else {
          const t = (dist - 0.40) / (0.88 - 0.40);
          alpha = t * t * (3 - 2 * t);
        }

        const idx = (y * size + x) * 4;
        data[idx] = fogR;
        data[idx + 1] = fogG;
        data[idx + 2] = fogB;
        data[idx + 3] = Math.round(alpha * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // ===========================================================================
  // 29. PHASE 4: MODERN PRESENT ERA PROCEDURAL TEXTURES
  // ===========================================================================

  // Modern Park Polished Granite/Slate Walkway Texture (Lối đi bộ công viên lát đá granite hiện đại)
  public static createModernParkWalkwayTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dark mortar / joint substrate
    ctx.fillStyle = '#1c222e';
    ctx.fillRect(0, 0, 512, 512);

    // Staggered architectural stone paver slabs pattern
    const slabW = 64;
    const slabH = 32;

    for (let y = 0; y < 512; y += slabH) {
      const offsetX = ((y / slabH) % 2) * (slabW / 2);
      for (let x = -slabW; x < 512 + slabW; x += slabW) {
        // Individual paver block tone variation
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const seed = hash - Math.floor(hash);
        const toneVar = Math.floor(seed * 18) - 9;
        
        // Mid-tone stone colors (neutral granite/slate paver: rgb ~ 72-88)
        const r = 74 + toneVar;
        const g = 82 + toneVar;
        const b = 96 + toneVar;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        // Paver body with 3px mortar groove gap
        const px = x + offsetX + 2;
        const py = y + 2;
        const pw = slabW - 4;
        const ph = slabH - 4;
        ctx.fillRect(px, py, pw, ph);

        // Top & left bevel highlight (embossed stone block edge)
        ctx.fillStyle = `rgba(180, 195, 215, 0.25)`;
        ctx.fillRect(px, py, pw, 1.5);
        ctx.fillRect(px, py, 1.5, ph);

        // Bottom & right bevel shadow
        ctx.fillStyle = `rgba(20, 26, 36, 0.45)`;
        ctx.fillRect(px, py + ph - 1.5, pw, 1.5);
        ctx.fillRect(px + pw - 1.5, py, 1.5, ph);
      }
    }

    // Granite speckle grain (feldspar & quartz flecks)
    for (let i = 0; i < 3500; i++) {
      const sx = Math.floor(Math.random() * 512);
      const sy = Math.floor(Math.random() * 512);
      const isLight = Math.random() > 0.5;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 20, 30, 0.22)';
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Modern Landscaped Park Turf / Lawn Texture
  public static createModernParkLawnTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich nocturnal dark emerald lawn
    ctx.fillStyle = '#081710';
    ctx.fillRect(0, 0, 512, 512);

    // Soft organic grass blade texturing
    for (let i = 0; i < 2800; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      const len = 3 + Math.random() * 5;
      const colVar = Math.floor(Math.random() * 25);
      ctx.strokeStyle = `rgba(${12 + colVar * 0.4}, ${36 + colVar}, ${22 + colVar * 0.5}, 0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (Math.random() - 0.5) * 3, gy - len);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Giant Modern Illuminated Moon Installation (Điểm nhấn biểu tượng rực rỡ ở đường chân trời)
  public static createGiantMoonSculptureTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    const r = 180;

    // Immense luminous golden glow bloom
    const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 250);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.25, 'rgba(254, 240, 138, 0.95)');
    glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.6)');
    glow.addColorStop(0.85, 'rgba(244, 63, 94, 0.25)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 250, 0, Math.PI * 2);
    ctx.fill();

    // Giant Illuminated Crescent & Full Ring Architecture
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glowing crescent
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, -Math.PI * 0.4, Math.PI * 0.7);
    ctx.quadraticCurveTo(cx + 60, cy, cx + 55, cy - 140);
    ctx.closePath();
    ctx.fill();

    // Modern geometric latticework / rabbit silhouette under moon
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    // Stylized jade rabbit sitting on moon crescent
    ctx.ellipse(cx + 40, cy + 30, 24, 18, -0.2, 0, Math.PI * 2);
    ctx.arc(cx + 56, cy + 12, 12, 0, Math.PI * 2);
    // Ears
    ctx.ellipse(cx + 62, cy - 4, 4, 14, 0.3, 0, Math.PI * 2);
    ctx.ellipse(cx + 68, cy - 2, 4, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Subtle modern LED dot matrix lining the perimeter
    ctx.fillStyle = '#ffffff';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
      const px = cx + Math.cos(a) * (r + 14);
      const py = cy + Math.sin(a) * (r + 14);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // Modern Electric Mid-Autumn Lantern Cluster (Chùm đèn lồng hiện đại rực rỡ sắc màu)
  public static createModernFestiveLanternClusterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Multiple layered glowing modern lanterns (lotus, star, geometric cylinders)
    const lanterns = [
      { x: 120, y: 220, r: 48, col: '#f43f5e', core: '#ffe4e6', shape: 'star' },
      { x: 256, y: 160, r: 62, col: '#f59e0b', core: '#fef3c7', shape: 'lotus' },
      { x: 390, y: 210, r: 52, col: '#38bdf8', core: '#e0f2fe', shape: 'cylinder' },
      { x: 180, y: 340, r: 42, col: '#c084fc', core: '#fae8ff', shape: 'cylinder' },
      { x: 330, y: 330, r: 46, col: '#fbbf24', core: '#fef9c3', shape: 'star' }
    ];

    lanterns.forEach(l => {
      // Glow bloom
      const g = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r * 1.8);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, l.core);
      g.addColorStop(0.65, l.col);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Main lantern body
      ctx.fillStyle = l.col;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;

      if (l.shape === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const rad = i % 2 === 0 ? l.r : l.r * 0.44;
          const px = l.x + Math.cos(a) * rad;
          const py = l.y + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (l.shape === 'lotus') {
        ctx.beginPath();
        ctx.ellipse(l.x, l.y, l.r, l.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner petal arcs
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r * 0.5, 0, Math.PI);
        ctx.stroke();
      } else {
        // Geometric cylinder
        ctx.fillRect(l.x - l.r * 0.6, l.y - l.r * 0.8, l.r * 1.2, l.r * 1.6);
        ctx.strokeRect(l.x - l.r * 0.6, l.y - l.r * 0.8, l.r * 1.2, l.r * 1.6);
      }
    });

    return new THREE.CanvasTexture(canvas);
  }

  // Distant Festival Illumination & Horizon Light Dome (Vầng sáng lễ hội chân trời & Thiên đăng)
  public static createDistantFestivalCanopyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 512);

    // 1. Grand Atmospheric Horizon Light Dome (Vầng sáng ấm áp bốc lên từ quảng trường)
    // Core radial glow in center horizon
    const domeGlow = ctx.createRadialGradient(512, 512, 10, 512, 512, 420);
    domeGlow.addColorStop(0, 'rgba(251, 191, 36, 0.95)'); // Radiant warm gold
    domeGlow.addColorStop(0.25, 'rgba(245, 158, 11, 0.8)'); // Amber gold
    domeGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.45)');  // Orange sunset glow
    domeGlow.addColorStop(0.7, 'rgba(225, 29, 72, 0.15)'); // Coral crimson haze
    domeGlow.addColorStop(0.9, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = domeGlow;
    ctx.fillRect(0, 180, 1024, 332);

    // 2. Distant Festival Architecture Silhouettes (Framing left & right, keeping center open for Moon Installation)
    ctx.fillStyle = '#060a14';

    // Left modern festival pavilion & stage truss
    ctx.beginPath();
    ctx.moveTo(60, 512);
    ctx.lineTo(120, 360);
    ctx.lineTo(220, 320); // Arched festival gateway
    ctx.quadraticCurveTo(270, 300, 320, 320);
    ctx.lineTo(380, 440);
    ctx.lineTo(390, 512);
    ctx.closePath();
    ctx.fill();

    // Right modern festival pavilion & stage truss
    ctx.beginPath();
    ctx.moveTo(634, 512);
    ctx.lineTo(644, 440);
    ctx.lineTo(704, 320);
    ctx.quadraticCurveTo(754, 300, 804, 320);
    ctx.lineTo(904, 360);
    ctx.lineTo(964, 512);
    ctx.closePath();
    ctx.fill();



    // 4. Moving crowd silhouettes with tiny handheld lanterns across the festival base
    ctx.fillStyle = '#03050c';
    for (let x = 80; x < 944; x += 10 + Math.sin(x * 0.1) * 5) {
      const headY = 475 + Math.sin(x * 0.25) * 8;
      ctx.beginPath();
      ctx.arc(x, headY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 3, headY + 4, 6, 512 - headY);

      // Handheld glowing dots
      if (Math.sin(x * 1.8) > 0.15) {
        const glowCol = Math.sin(x) > 0 ? '#fbbf24' : '#f43f5e';
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.arc(x + 4, headY + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#03050c';
      }
    }

    // 5. Soft horizontal & vertical alpha feathering (Zero box borders!)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const horizMask = ctx.createLinearGradient(0, 0, 1024, 0);
    horizMask.addColorStop(0, 'rgba(0, 0, 0, 0)');
    horizMask.addColorStop(0.15, 'rgba(0, 0, 0, 1)');
    horizMask.addColorStop(0.85, 'rgba(0, 0, 0, 1)');
    horizMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = horizMask;
    ctx.fillRect(0, 0, 1024, 512);

    const vertMask = ctx.createLinearGradient(0, 0, 0, 512);
    vertMask.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vertMask.addColorStop(0.35, 'rgba(0, 0, 0, 1)');
    vertMask.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = vertMask;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  // Modern Park Visitors (Gia đình & bạn bè dạo công viên đèn lồng)
  public static createModernParkVisitorsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Stylized contemporary silhouettes with glowing electric lanterns (Full 1.8m height span)
    // 1. Family group (Left side of texture)
    ctx.fillStyle = '#0c1524';

    // Parent Adult (Head: y=70, total height: 410px -> ~80% of canvas)
    ctx.beginPath();
    ctx.arc(140, 75, 26, 0, Math.PI * 2);
    ctx.fill();
    // Torso / Jacket
    ctx.fillRect(110, 105, 60, 160);
    // Legs
    ctx.fillRect(116, 265, 22, 215);
    ctx.fillRect(144, 265, 22, 215);

    // Child (holding parent's hand)
    ctx.beginPath();
    ctx.arc(225, 210, 19, 0, Math.PI * 2);
    ctx.fill();
    // Child Torso / Dress
    ctx.fillRect(205, 232, 40, 110);
    // Child Legs
    ctx.fillRect(212, 342, 12, 138);
    ctx.fillRect(228, 342, 12, 138);

    // Child's glowing carp lantern
    const carpGlow = ctx.createRadialGradient(265, 290, 4, 265, 290, 45);
    carpGlow.addColorStop(0, '#ffffff');
    carpGlow.addColorStop(0.3, '#fef08a');
    carpGlow.addColorStop(0.7, '#f43f5e');
    carpGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = carpGlow;
    ctx.beginPath();
    ctx.arc(265, 290, 45, 0, Math.PI * 2);
    ctx.fill();

    // 2. Young couple strolling together (Right side of texture)
    ctx.fillStyle = '#0a1220';

    // Person A (Tall, athletic silhouette)
    ctx.beginPath();
    ctx.arc(365, 65, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(338, 93, 54, 172);
    ctx.fillRect(344, 265, 20, 215);
    ctx.fillRect(368, 265, 20, 215);

    // Person B (Slightly shorter silhouette)
    ctx.beginPath();
    ctx.arc(425, 85, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(402, 112, 48, 158);
    ctx.fillRect(408, 270, 18, 210);
    ctx.fillRect(428, 270, 18, 210);

    // Glowing cyan/gold electric rabbit lantern
    const cyanGlow = ctx.createRadialGradient(465, 230, 4, 465, 230, 42);
    cyanGlow.addColorStop(0, '#ffffff');
    cyanGlow.addColorStop(0.35, '#38bdf8');
    cyanGlow.addColorStop(0.7, '#0284c7');
    cyanGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cyanGlow;
    ctx.beginPath();
    ctx.arc(465, 230, 42, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Modern Player Character Avatar (Thanh niên hiện đại nâng cao chiếc đèn ông sao rực rỡ)
  public static createModernPlayerCharacterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Contemporary stylized figure seen from three-quarter back/side
    // Head / hair
    ctx.fillStyle = '#0d131f';
    ctx.beginPath();
    ctx.arc(235, 75, 26, 0, Math.PI * 2);
    ctx.fill();

    // Contemporary haircut fringe highlight (warm ambient rim)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(235, 75, 26, -Math.PI * 0.6, -Math.PI * 0.1);
    ctx.stroke();

    // Neck
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(228, 98, 16, 20);

    // Shoulders & contemporary jacket
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(175, 120);
    ctx.quadraticCurveTo(236, 114, 290, 128); // Shoulder curve
    ctx.lineTo(285, 290);
    ctx.lineTo(185, 290);
    ctx.closePath();
    ctx.fill();

    // Warm golden lamplight rim lighting along shoulders & collar
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(175, 120);
    ctx.quadraticCurveTo(236, 114, 290, 128);
    ctx.stroke();

    // Raised right arm holding lantern rod
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(275, 140);
    ctx.lineTo(330, 175);
    ctx.lineTo(370, 150); // Hand raised holding handle
    ctx.stroke();

    // Left arm relaxed at side
    ctx.beginPath();
    ctx.moveTo(185, 130);
    ctx.lineTo(170, 210);
    ctx.stroke();

    // Trousers / jeans
    ctx.fillStyle = '#0b1120';
    ctx.beginPath();
    ctx.moveTo(185, 288);
    ctx.lineTo(285, 288);
    ctx.lineTo(275, 475);
    ctx.lineTo(240, 475);
    ctx.lineTo(235, 340); // Inseam
    ctx.lineTo(230, 475);
    ctx.lineTo(195, 475);
    ctx.closePath();
    ctx.fill();

    // Contemporary white sneakers
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(210, 485, 16, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(258, 485, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Modern Vietnamese Mid-Autumn Festival Gate Texture (Cổng chào lễ hội Trung Thu hiện đại)
  public static createModernFestivalGateTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);

    // Twin Modern Pillars (Pillar Left: x=70 to 110, Pillar Right: x=402 to 442)
    ctx.fillStyle = '#182030';
    ctx.fillRect(75, 140, 40, 360);
    ctx.fillRect(397, 140, 40, 360);

    // Glowing Vertical LED Channels inside pillars
    const pillarLed = ctx.createLinearGradient(0, 150, 0, 490);
    pillarLed.addColorStop(0, '#fef08a');
    pillarLed.addColorStop(0.5, '#fbbf24');
    pillarLed.addColorStop(1, '#d97706');
    ctx.fillStyle = pillarLed;
    ctx.fillRect(91, 160, 8, 320);
    ctx.fillRect(413, 160, 8, 320);

    // Sweeping Modern Curved Arch Canopy
    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.quadraticCurveTo(256, 70, 452, 180);
    ctx.lineTo(440, 210);
    ctx.quadraticCurveTo(256, 115, 72, 210);
    ctx.closePath();
    ctx.fillStyle = '#1e283d';
    ctx.fill();

    // Curved LED Arch Ribbon (Warm Gold & Coral Red)
    ctx.beginPath();
    ctx.moveTo(68, 175);
    ctx.quadraticCurveTo(256, 76, 444, 175);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(76, 195);
    ctx.quadraticCurveTo(256, 102, 436, 195);
    ctx.strokeStyle = '#e11d48'; // Coral red mid-autumn accent
    ctx.lineWidth = 4;
    ctx.stroke();

    // Elegant Stylized Cloud Fretwork at Arch Apex
    const drawCloudMoc = (cx: number, cy: number, flip: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (flip) ctx.scale(-1, 1);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI * 0.5, Math.PI * 1.8);
      ctx.arc(14, -8, 12, Math.PI * 0.9, Math.PI * 2.1);
      ctx.arc(28, 0, 14, Math.PI * 1.2, Math.PI * 2.3);
      ctx.stroke();
      ctx.restore();
    };
    drawCloudMoc(180, 125, false);
    drawCloudMoc(332, 125, true);

    // Luminous Welcome Banner Sign on Arch Center: "LỄ HỘI TRĂNG RẰM"
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(148, 138, 216, 36, 18);
    ctx.fill();
    ctx.stroke();

    // Golden text glow
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fffbeb';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LỄ HỘI TRĂNG RẰM', 256, 156);
    ctx.restore();

    // Dangling Star Lanterns on cords from arch
    const lanternDrops = [
      { x: 135, y: 220, len: 45, col: '#f59e0b' },
      { x: 185, y: 195, len: 65, col: '#f43f5e' },
      { x: 327, y: 195, len: 65, col: '#f43f5e' },
      { x: 377, y: 220, len: 45, col: '#38bdf8' }
    ];
    lanternDrops.forEach(d => {
      // Cord
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.stroke();

      // Mini Star Lantern
      const lx = d.x;
      const ly = d.y + d.len + 14;
      ctx.fillStyle = d.col;
      ctx.beginPath();
      for (let s = 0; s < 5; s++) {
        const a = -Math.PI / 2 + (s * Math.PI * 2) / 5;
        const na = a + Math.PI / 5;
        const x1 = lx + Math.cos(a) * 14;
        const y1 = ly + Math.sin(a) * 14;
        const x2 = lx + Math.cos(na) * 6;
        const y2 = ly + Math.sin(na) * 6;
        if (s === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();

      // Warm glow around lantern
      const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 24);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      g.addColorStop(0.4, d.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, 24, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // Central Festival Stage & Luminous Anchor Texture
  public static createDistantFestivalStageTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);

    // 1. Curved Stage Pavilion Roof Canopy
    ctx.fillStyle = '#162238';
    ctx.beginPath();
    ctx.moveTo(80, 160);
    ctx.quadraticCurveTo(256, 85, 432, 160);
    ctx.lineTo(418, 175);
    ctx.quadraticCurveTo(256, 110, 94, 175);
    ctx.closePath();
    ctx.fill();

    // Stage Roof LED Edge
    ctx.beginPath();
    ctx.moveTo(85, 158);
    ctx.quadraticCurveTo(256, 88, 427, 158);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2. Giant Festival Crescent Moon Motif behind stage
    const moonGrad = ctx.createRadialGradient(256, 75, 10, 256, 75, 65);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.3, '#fef08a');
    moonGrad.addColorStop(0.7, '#f59e0b');
    moonGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(256, 75, 65, 0, Math.PI * 2);
    ctx.fill();

    // Crisp Golden Crescent Disc
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(256, 75, 36, 0, Math.PI * 2);
    ctx.fill();
    // Crescent shadow carve
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(270, 70, 31, 0, Math.PI * 2);
    ctx.fill();

    // 3. Stage Platform & Warm Lighting Wash
    const stageGlow = ctx.createLinearGradient(0, 160, 0, 256);
    stageGlow.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
    stageGlow.addColorStop(0.5, 'rgba(225, 29, 72, 0.4)');
    stageGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = stageGlow;
    ctx.fillRect(110, 165, 292, 85);

    // 4. Two Flanking Lantern Towers (x=60, x=452)
    [55, 445].forEach(tx => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(tx, 70, 16, 175);
      // 3 glowing lantern boxes per tower
      [85, 125, 165].forEach(ly => {
        const tg = ctx.createRadialGradient(tx + 8, ly, 2, tx + 8, ly, 18);
        tg.addColorStop(0, '#ffffff');
        tg.addColorStop(0.4, '#fbbf24');
        tg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(tx + 8, ly, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(tx + 2, ly - 8, 12, 16);
      });
    });

    return new THREE.CanvasTexture(canvas);
  }

  // Dynamic Distant Lion Dance Silhouette on Stage
  public static createLionDanceStageTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    // Vietnamese Mid-Autumn Lion Silhouette with Red & Gold Emissive Highlights
    // Raised stage pedestal base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 205, 176, 25);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 205, 176, 25);

    // Lion Head (Large, ornate curved head silhouette)
    ctx.fillStyle = '#e11d48'; // Festive crimson lion head
    ctx.beginPath();
    ctx.moveTo(110, 110);
    ctx.quadraticCurveTo(135, 75, 160, 95); // Forehead / brow
    ctx.quadraticCurveTo(180, 120, 165, 140); // Snout
    ctx.quadraticCurveTo(145, 155, 115, 145); // Lower jaw
    ctx.closePath();
    ctx.fill();

    // Golden Horn & Mirror Crest
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(140, 85);
    ctx.lineTo(146, 60);
    ctx.lineTo(154, 86);
    ctx.closePath();
    ctx.fill();

    // Radiant Glowing Lion Eye (Point of intense visual focus)
    ctx.save();
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(148, 112, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fluffy Lion Mane ruffles
    ctx.fillStyle = '#f59e0b';
    for (let m = 0; m < 5; m++) {
      ctx.beginPath();
      ctx.ellipse(115 - m * 8, 125 + m * 4, 12, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic Lion Body / Cloak Arching with 2 Performers
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.moveTo(115, 130);
    ctx.quadraticCurveTo(75, 105, 55, 155); // Back curve of rear dancer
    ctx.lineTo(65, 195); // Rear legs
    ctx.lineTo(82, 195);
    ctx.lineTo(88, 165);
    ctx.lineTo(112, 195); // Front legs raised
    ctx.lineTo(128, 195);
    ctx.lineTo(125, 145);
    ctx.closePath();
    ctx.fill();

    // Gold trim scales along lion cloak
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(112, 135);
    ctx.quadraticCurveTo(80, 120, 62, 160);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // Low-Rise Modern Civic Skyline Texture
  public static createCivicSkylineTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);

    // Three staggered façade depths; the warm paper windows read as a city,
    // while the cool roofs recede behind the festival rather than competing.
    const buildings = [
      { x: 12, w: 70, h: 47, roof: 'flat', shade: '#101d30' },
      { x: 72, w: 81, h: 67, roof: 'slanted', shade: '#0b1a2c' },
      { x: 145, w: 62, h: 43, roof: 'flat', shade: '#17253a' },
      { x: 198, w: 94, h: 76, roof: 'curved', shade: '#101c30' },
      { x: 281, w: 75, h: 51, roof: 'flat', shade: '#18263a' },
      { x: 344, w: 88, h: 69, roof: 'slanted', shade: '#0d1b2e' },
      { x: 422, w: 79, h: 48, roof: 'curved', shade: '#15243a' }
    ];

    buildings.forEach((b, index) => {
      ctx.fillStyle = b.shade;
      if (b.roof === 'slanted') {
        ctx.beginPath();
        ctx.moveTo(b.x, 128);
        ctx.lineTo(b.x, 128 - b.h + 8);
        ctx.lineTo(b.x + b.w, 128 - b.h - 3);
        ctx.lineTo(b.x + b.w, 128);
        ctx.closePath();
        ctx.fill();
      } else if (b.roof === 'curved') {
        ctx.beginPath();
        ctx.moveTo(b.x, 128);
        ctx.lineTo(b.x, 128 - b.h + 7);
        ctx.quadraticCurveTo(b.x + b.w * 0.5, 128 - b.h - 12, b.x + b.w, 128 - b.h + 7);
        ctx.lineTo(b.x + b.w, 128);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(b.x, 128 - b.h, b.w, b.h);
      }

      ctx.fillStyle = 'rgba(156,184,196,.18)';
      ctx.fillRect(b.x + 3, 128 - b.h + 9, b.w - 6, 2);
      ctx.fillStyle = 'rgba(255,214,145,.46)';
      const cols = Math.floor(b.w / 15);
      const rows = Math.floor((b.h - 15) / 13);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if ((row * 3 + col * 5 + index) % 4 === 0) continue;
          const wx = b.x + 8 + col * 14;
          const wy = 128 - b.h + 17 + row * 13;
          ctx.fillRect(wx, wy, 5, 7);
          if ((row + col) % 3 === 0) {
            ctx.fillStyle = 'rgba(255,238,191,.28)';
            ctx.fillRect(wx + 1, wy + 1, 3, 2);
            ctx.fillStyle = 'rgba(255,214,145,.46)';
          }
        }
      }
      // Thin lit parapet suggests a modern cultural-center frontage.
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(243,174,115,.32)';
        ctx.fillRect(b.x + 5, 128 - b.h + 4, b.w - 10, 1);
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * 15. Giant Revolving Shadow Lantern Panoramic Drum Texture (Đèn Kéo Quân Khổng Lồ)
   * Seamless 360° cylindrical panoramic texture featuring authentic Vietnamese Mid-Autumn procession:
   * Lion dance, Ông Địa, Star lantern, Carp lantern, Chú Cuội, Chị Hằng, Jade Rabbit, Drum troupe.
   */
  public static createRevolvingShadowLanternTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Translucent glowing mica parchment background (Warm amber honey & coral red)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#be123c');     // Deep crimson at top eave
    bgGrad.addColorStop(0.12, '#ea580c');  // Vibrant warm orange
    bgGrad.addColorStop(0.35, '#fef08a');  // Luminous amber gold
    bgGrad.addColorStop(0.50, '#ffffff');  // Bright core candle glow
    bgGrad.addColorStop(0.65, '#fef08a');
    bgGrad.addColorStop(0.88, '#ea580c');
    bgGrad.addColorStop(1, '#9f1239');     // Coral ruby at bottom rim
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle mica paper texture flakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 280; i++) {
      const rx = (i * 137.5) % 1024;
      const ry = (i * 93.7) % 512;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 6 + (i % 8), 3 + (i % 4), (i * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Top & Bottom Ornate Golden Geometric Fretwork Borders
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 0, 1024, 28);
    ctx.fillRect(0, 484, 1024, 28);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 28, 1024, 4);
    ctx.fillRect(0, 480, 1024, 4);

    // Golden wave scalloped lace
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 16) {
      ctx.arc(x + 8, 32, 6, Math.PI, 0, false);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 16) {
      ctx.arc(x + 8, 480, 6, 0, Math.PI, false);
    }
    ctx.stroke();

    // 8 Vertical Golden Panel Seams (Bát giác 8 mặt)
    for (let i = 0; i < 8; i++) {
      const px = i * 128;
      ctx.fillStyle = 'rgba(120, 53, 15, 0.7)';
      ctx.fillRect(px - 3, 32, 6, 448);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px - 1.5, 32, 3, 448);
    }

    // 3. Crisp Shadow Puppetry Silhouettes (Charcoal with delicate warm edge glow)
    ctx.save();
    ctx.shadowColor = 'rgba(234, 88, 12, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#090d16'; // Classic shadow puppet silhouette

    // Ground procession platform strip
    ctx.fillRect(0, 420, 1024, 60);

    // --- PANEL 1 (x: 0..128): Vietnamese Dancing Lion Head Leaping Up ---
    ctx.beginPath();
    ctx.moveTo(35, 390);
    ctx.quadraticCurveTo(20, 310, 65, 270); // Gáy và sừng lân
    ctx.lineTo(72, 230); // Sừng nhọn
    ctx.lineTo(82, 268);
    ctx.quadraticCurveTo(115, 275, 105, 320); // Mõm và hàm trên
    ctx.quadraticCurveTo(80, 335, 100, 355); // Miệng há to
    ctx.quadraticCurveTo(65, 370, 75, 415); // Râu cằm
    ctx.closePath();
    ctx.fill();

    // Lion eye cutout
    ctx.save();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(78, 292, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- PANEL 2 (x: 128..256): Ông Địa Smiling with Round Fan & Lion Tail ---
    // Tail dancer
    ctx.beginPath();
    ctx.moveTo(135, 420);
    ctx.quadraticCurveTo(145, 340, 180, 350);
    ctx.lineTo(190, 420);
    ctx.closePath();
    ctx.fill();
    // Ông Địa (Bụng tròn phệ, tay cầm quạt nan)
    ctx.beginPath();
    ctx.arc(220, 315, 18, 0, Math.PI * 2); // Đầu tròn
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(220, 365, 24, 32, 0.1, 0, Math.PI * 2); // Bụng phệ
    ctx.fill();
    // Legs
    ctx.fillRect(205, 395, 12, 25);
    ctx.fillRect(225, 395, 12, 25);
    // Quạt nan xòe tròn
    ctx.beginPath();
    ctx.arc(245, 335, 15, -0.6, Math.PI * 0.9);
    ctx.lineTo(235, 350);
    ctx.closePath();
    ctx.fill();

    // --- PANEL 3 (x: 256..384): Child with 5-pointed Star Lantern (Đèn Ông Sao) ---
    // Child running
    ctx.beginPath();
    ctx.arc(310, 330, 13, 0, Math.PI * 2); // Head with chỏm tóc
    ctx.fill();
    ctx.beginPath();
    ctx.arc(310, 316, 5, 0, Math.PI * 2); // Chỏm đào
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(310, 343);
    ctx.lineTo(295, 400); // Running torso
    ctx.lineTo(280, 420); // Front leg
    ctx.lineTo(292, 420);
    ctx.lineTo(306, 395);
    ctx.lineTo(325, 420); // Back leg
    ctx.lineTo(336, 420);
    ctx.lineTo(315, 385);
    ctx.closePath();
    ctx.fill();
    // Bamboo pole
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(300, 365);
    ctx.lineTo(355, 245);
    ctx.stroke();
    // Star lantern at apex
    const starX = 358;
    const starY = 240;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
      const na = a + Math.PI / 5;
      const x1 = starX + Math.cos(a) * 28;
      const y1 = starY + Math.sin(a) * 28;
      const x2 = starX + Math.cos(na) * 12;
      const y2 = starY + Math.sin(na) * 12;
      if (k === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    // Outer bamboo ring
    ctx.beginPath();
    ctx.arc(starX, starY, 20, 0, Math.PI * 2);
    ctx.stroke();

    // --- PANEL 4 (x: 384..512): Child pulling Rolling Carp Lantern (Đèn Cá Chép) ---
    // Child pulling string
    ctx.beginPath();
    ctx.arc(480, 335, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(472, 347, 16, 45);
    ctx.fillRect(468, 392, 10, 28);
    ctx.fillRect(482, 392, 10, 28);
    // String
    ctx.beginPath();
    ctx.moveTo(470, 360);
    ctx.lineTo(435, 385);
    ctx.stroke();
    // Rolling Carp Lantern
    ctx.beginPath();
    ctx.ellipse(415, 375, 26, 16, -0.15, 0, Math.PI * 2); // Thân cá
    ctx.fill();
    // Đuôi cá chép vểnh cao
    ctx.beginPath();
    ctx.moveTo(390, 375);
    ctx.quadraticCurveTo(370, 350, 375, 340);
    ctx.quadraticCurveTo(385, 365, 395, 370);
    ctx.closePath();
    ctx.fill();
    // Wheels under lantern
    ctx.beginPath();
    ctx.arc(405, 408, 9, 0, Math.PI * 2);
    ctx.arc(428, 408, 9, 0, Math.PI * 2);
    ctx.fill();

    // --- PANEL 5 (x: 512..640): Chú Cuội under the Ancient Banyan Tree (Cây Đa) ---
    // Ancient banyan tree trunk & winding roots
    ctx.beginPath();
    ctx.moveTo(525, 420);
    ctx.quadraticCurveTo(540, 280, 520, 180);
    ctx.quadraticCurveTo(555, 160, 580, 180);
    ctx.quadraticCurveTo(565, 290, 595, 420);
    ctx.closePath();
    ctx.fill();
    // Banyan lush foliage canopy
    [
      { cx: 535, cy: 160, r: 42 },
      { cx: 580, cy: 145, r: 46 },
      { cx: 615, cy: 175, r: 38 }
    ].forEach(c => {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Chú Cuội sitting relaxed playing bamboo flute (thổi sáo)
    ctx.beginPath();
    ctx.arc(605, 345, 13, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(600, 358);
    ctx.lineTo(595, 410);
    ctx.lineTo(625, 410);
    ctx.lineTo(615, 385);
    ctx.closePath();
    ctx.fill();
    // Sáo trúc
    ctx.beginPath();
    ctx.moveTo(605, 355);
    ctx.lineTo(635, 345);
    ctx.stroke();

    // --- PANEL 6 (x: 640..768): Chị Hằng Nga floating with flowing silk ribbons ---
    ctx.beginPath();
    ctx.arc(705, 255, 12, 0, Math.PI * 2); // Head with búi tóc trâm cài
    ctx.fill();
    ctx.fillRect(702, 240, 4, 12); // Trâm
    // Áo Tứ Thân & flowing celestial ribbons
    ctx.beginPath();
    ctx.moveTo(705, 267);
    ctx.quadraticCurveTo(685, 310, 675, 375); // Dress flow
    ctx.quadraticCurveTo(705, 395, 735, 375);
    ctx.quadraticCurveTo(720, 310, 705, 267);
    ctx.closePath();
    ctx.fill();
    // Dải lụa tiên uốn lượn bay bổng
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(685, 275);
    ctx.quadraticCurveTo(650, 260, 660, 315);
    ctx.quadraticCurveTo(670, 355, 650, 385);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(725, 275);
    ctx.quadraticCurveTo(760, 260, 750, 315);
    ctx.quadraticCurveTo(740, 355, 765, 385);
    ctx.stroke();

    // --- PANEL 7 (x: 768..896): Jade Rabbit (Thỏ Ngọc) pounding rice cake mortar ---
    // Full moon backdrop halo
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(832, 280, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Mortar (Cối giã)
    ctx.beginPath();
    ctx.moveTo(815, 370);
    ctx.lineTo(845, 370);
    ctx.lineTo(840, 415);
    ctx.lineTo(820, 415);
    ctx.closePath();
    ctx.fill();
    // Thỏ Ngọc
    ctx.beginPath();
    ctx.ellipse(800, 360, 16, 22, -0.3, 0, Math.PI * 2); // Thân thỏ
    ctx.fill();
    ctx.beginPath();
    ctx.arc(795, 335, 11, 0, Math.PI * 2); // Đầu thỏ
    ctx.fill();
    // Tai thỏ dài
    ctx.beginPath();
    ctx.ellipse(790, 310, 4, 16, -0.2, 0, Math.PI * 2);
    ctx.ellipse(800, 310, 4, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Chày giã cối
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(805, 345);
    ctx.lineTo(830, 360);
    ctx.lineTo(830, 385);
    ctx.stroke();

    // --- PANEL 8 (x: 896..1024): Village Children Drumming Procession (Đội Trống Ếch) ---
    // Child playing frog drum
    ctx.beginPath();
    ctx.arc(955, 335, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(948, 347, 16, 45);
    ctx.fillRect(943, 392, 10, 28);
    ctx.fillRect(958, 392, 10, 28);
    // Trống ếch đeo trước ngực
    ctx.beginPath();
    ctx.ellipse(970, 370, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Drumsticks
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(955, 355);
    ctx.lineTo(968, 368);
    ctx.moveTo(960, 352);
    ctx.lineTo(974, 366);
    ctx.stroke();

    // Child with cymbals (Chũm chọe)
    ctx.beginPath();
    ctx.arc(1005, 340, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(999, 351, 14, 42);
    ctx.fillRect(995, 393, 9, 27);
    ctx.fillRect(1007, 393, 9, 27);
    // Cymbals
    ctx.beginPath();
    ctx.arc(995, 365, 8, 0, Math.PI * 2);
    ctx.arc(1002, 365, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /**
   * 16. Soft Radial Horizon Glow Texture (Smooth atmospheric golden haze, zero hard edges)
   */
  public static createHorizonGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);

    const radGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
    radGrad.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
    radGrad.addColorStop(0.35, 'rgba(217, 119, 6, 0.22)');
    radGrad.addColorStop(0.70, 'rgba(180, 83, 9, 0.06)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 512, 256);

    return new THREE.CanvasTexture(canvas);
  }
}
