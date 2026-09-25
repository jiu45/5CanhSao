import fs from 'fs';

let content = fs.readFileSync('src/utils/TextureGenerator.ts', 'utf8');

const additionalMethods = `
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
}
`;

const lastClosingBrace = content.lastIndexOf('}');
if (lastClosingBrace !== -1) {
  const updated = content.slice(0, lastClosingBrace) + additionalMethods;
  fs.writeFileSync('src/utils/TextureGenerator.ts', updated, 'utf8');
  console.log('Successfully added firefly and mist textures to TextureGenerator.ts!');
} else {
  console.error('Could not find closing brace');
}
