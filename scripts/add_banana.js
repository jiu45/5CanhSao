import fs from 'fs';

let content = fs.readFileSync('src/utils/TextureGenerator.ts', 'utf8');

const bananaMethod = `
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
}
`;

const lastClosingBrace = content.lastIndexOf('}');
if (lastClosingBrace !== -1) {
  const updated = content.slice(0, lastClosingBrace) + bananaMethod;
  fs.writeFileSync('src/utils/TextureGenerator.ts', updated, 'utf8');
  console.log('Added banana palm silhouette texture generator!');
} else {
  console.error('Closing brace not found');
}
