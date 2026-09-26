import * as THREE from 'three';

/** Camera-facing, layered paper foliage for the present-day park and promenade. */
export class PapercraftFoliageKit {
  private readonly materials: THREE.SpriteMaterial[];
  private bambooMaterial?: THREE.SpriteMaterial;

  constructor() {
    this.materials = [0, 1, 2].map(variant => new THREE.SpriteMaterial({
      map: this.makeTexture(variant), transparent: true, alphaTest: 0.035,
      depthWrite: false, fog: true
    }));
  }

  canopy(width: number, height: number, variant = 0): THREE.Sprite {
    const card = new THREE.Sprite(this.materials[variant % this.materials.length]);
    card.scale.set(width, height, 1);
    return card;
  }

  bamboo(width: number, height: number): THREE.Sprite {
    if (!this.bambooMaterial) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 512;
      const c = canvas.getContext('2d')!;
      c.lineCap = 'round';
      for (let stem = 0; stem < 7; stem++) {
        const x = 29 + stem * 32;
        const bend = Math.sin(stem * 1.8) * 20;
        c.strokeStyle = stem % 2 ? '#183847' : '#23484b';
        c.lineWidth = stem % 3 === 0 ? 9 : 6;
        c.beginPath(); c.moveTo(x, 509);
        c.quadraticCurveTo(x + bend * 0.7, 250, x + bend, 32 + stem * 11);
        c.stroke();
        for (let node = 0; node < 6; node++) {
          const y = 420 - node * 67 + (stem % 2) * 11;
          const sx = x + bend * (1 - y / 512);
          c.strokeStyle = '#638182'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(sx - 6, y); c.lineTo(sx + 6, y); c.stroke();
          for (const side of [-1, 1]) {
            c.strokeStyle = '#224553'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(sx, y);
            c.lineTo(sx + side * 28, y - 34); c.stroke();
            c.fillStyle = node % 2 ? '#1c3948' : '#2a4b4d';
            c.beginPath(); c.moveTo(sx + side * 22, y - 29);
            c.quadraticCurveTo(sx + side * 60, y - 54,
              sx + side * 71, y - 61);
            c.quadraticCurveTo(sx + side * 42, y - 22,
              sx + side * 22, y - 29);
            c.fill();
          }
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.bambooMaterial = new THREE.SpriteMaterial({
        map: texture, transparent: true, alphaTest: 0.035,
        depthWrite: false, fog: true
      });
    }
    const card = new THREE.Sprite(this.bambooMaterial);
    card.center.set(0.5, 0);
    card.scale.set(width, height, 1);
    return card;
  }

  private makeTexture(variant: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 320;
    const c = canvas.getContext('2d')!;
    const colors = [
      ['#0a1922', '#122b30', '#1b3837'],
      ['#0b1b29', '#142b39', '#203849'],
      ['#102025', '#1b3332', '#29443b']
    ][variant];
    // Three broad silhouette passes form one ragged, hand-cut mass, not round blobs.
    for (let layer = 0; layer < 3; layer++) {
      c.fillStyle = colors[layer];
      c.beginPath();
      c.moveTo(19, 226 + layer * 5);
      for (let i = 0; i <= 48; i++) {
        const x = 19 + i * 9.8;
        const dome = 105 * Math.sin(Math.PI * i / 48);
        const serration = Math.sin(i * 1.7 + layer) * 10 + Math.sin(i * 4.3) * 6;
        c.lineTo(x, 199 - dome + serration + layer * 14);
      }
      for (let i = 48; i >= 0; i--) {
        const x = 19 + i * 9.8;
        const scallop = Math.sin(i * 0.62 + layer) * 19 + Math.sin(i * 1.8) * 7;
        c.lineTo(x, 237 + scallop + layer * 12);
      }
      c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(149,174,145,.16)'; c.lineWidth = 1.5;
    for (let i = 0; i < 17; i++) {
      const x = 65 + (i * 73) % 385;
      const y = 155 + (i * 39) % 63;
      c.beginPath(); c.moveTo(x - 15, y + 6); c.lineTo(x, y - 3);
      c.lineTo(x + 11, y - 13); c.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
}
