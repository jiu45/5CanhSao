import * as THREE from 'three';

type Kind = 'star' | 'carp' | 'paper';

export class FestivalLanternDecorKit {
  private readonly materials = new Map<Kind, THREE.SpriteMaterial>();

  create(kind: Kind): THREE.Sprite {
    let material = this.materials.get(kind);
    if (!material) {
      material = new THREE.SpriteMaterial({
        map: this.makeTexture(kind), transparent: true, depthWrite: false,
        alphaTest: 0.025, fog: true
      });
      this.materials.set(kind, material);
    }
    const lamp = new THREE.Sprite(material);
    lamp.scale.set(kind === 'carp' ? 0.68 : 0.48,
      kind === 'carp' ? 0.47 : 0.54, 1);
    return lamp;
  }

  private makeTexture(kind: Kind): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d')!;
    const glow = c.createRadialGradient(64, 60, 3, 64, 60, 60);
    glow.addColorStop(0, 'rgba(255,235,171,.55)');
    glow.addColorStop(0.42, 'rgba(249,169,69,.16)');
    glow.addColorStop(1, 'rgba(249,169,69,0)');
    c.fillStyle = glow; c.fillRect(0, 0, 128, 128);
    c.shadowColor = '#ffac4d'; c.shadowBlur = 18;
    if (kind === 'star') {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? 19 : 40;
        const x = 64 + Math.cos(a) * r;
        const y = 61 + Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fillStyle = '#e78a47'; c.fill();
      c.strokeStyle = '#ffe3a0'; c.lineWidth = 5; c.stroke();
      c.beginPath(); c.arc(64, 61, 8, 0, Math.PI * 2);
      c.fillStyle = '#fff2c4'; c.fill();
    } else if (kind === 'carp') {
      c.fillStyle = '#e77e63';
      c.beginPath(); c.ellipse(63, 58, 29, 19, -0.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(34, 57); c.lineTo(13, 38); c.lineTo(17, 77);
      c.closePath(); c.fill();
      c.fillStyle = '#ffc27e';
      c.beginPath(); c.moveTo(55, 42); c.lineTo(69, 22); c.lineTo(75, 47); c.fill();
      c.beginPath(); c.moveTo(59, 72); c.lineTo(72, 92); c.lineTo(78, 70); c.fill();
      c.fillStyle = '#fff5c9'; c.beginPath(); c.arc(81, 54, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffe0a3'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.arc(55 + i * 10, 58, 9, -0.8, 0.8); c.stroke();
      }
    } else {
      c.fillStyle = '#ffbb78'; c.beginPath();
      c.ellipse(64, 61, 27, 34, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff0be'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(37, 61); c.lineTo(91, 61);
      c.moveTo(64, 28); c.lineTo(64, 95); c.stroke();
      c.fillStyle = '#a74550'; c.fillRect(56, 25, 16, 4);
      c.fillRect(57, 96, 14, 4);
    }
    c.shadowBlur = 0;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
