import * as THREE from 'three';
import { drawLanternSilhouette } from './LanternSilhouetteArt';
import type { LanternStyle } from './LanternIdentity';

function texture(size: number, paint: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  paint(ctx);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  return result;
}

function identityPool(style: LanternStyle, color: string): THREE.CanvasTexture {
  return texture(256, ctx => {
    const halo = ctx.createRadialGradient(128, 128, 4, 128, 128, 127);
    halo.addColorStop(0, `rgba(${color},.67)`);
    halo.addColorStop(.55, `rgba(${color},.19)`);
    halo.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 256, 256);
    const cutout = document.createElement('canvas');
    cutout.width = cutout.height = 256;
    const silhouette = cutout.getContext('2d')!;
    silhouette.drawImage(drawLanternSilhouette(style, true), 20, 20, 216, 216);
    silhouette.globalCompositeOperation = 'source-in';
    silhouette.fillStyle = 'rgba(255,229,154,.93)';
    silhouette.fillRect(0, 0, 256, 256);
    ctx.save(); ctx.globalAlpha = .88; ctx.filter = 'blur(3px)';
    ctx.drawImage(cutout, 0, 0);
    ctx.restore();
  });
}

function starLightTexture(): THREE.CanvasTexture {
  return texture(512, ctx => {
    const halo = ctx.createRadialGradient(256, 256, 12, 256, 256, 240);
    halo.addColorStop(0, 'rgba(255,245,184,.56)');
    halo.addColorStop(0.57, 'rgba(246,161,91,.17)');
    halo.addColorStop(1, 'rgba(246,161,91,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 512, 512);
    const irregular = [1, .94, 1.04, .91, 1.06];
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 82 : 187 * irregular[i / 2];
      const x = 256 + Math.cos(a) * r;
      const y = 256 + Math.sin(a) * r;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,218,133,.57)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,198,.62)'; ctx.lineWidth = 11; ctx.stroke();
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    // Keep punctuation with the preceding word even if the handwritten letter
    // happens to contain a space before it. A lone mark makes a bad film beat.
    if (/^[.,!?;:…]+$/.test(word)) {
      if (line) line += word;
      else if (lines.length) lines[lines.length - 1] += word;
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line); line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

/** Light pools and in-world typography for the intimate ending. */
export class FinaleMoment {
  public readonly group = new THREE.Group();
  public readonly message = new THREE.Mesh(new THREE.PlaneGeometry(23, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false,
      side: THREE.DoubleSide }));
  private readonly pools: THREE.Mesh[] = [];
  private readonly star: THREE.Mesh;
  private readonly messageTexture: THREE.CanvasTexture;
  private readonly messageCanvas: HTMLCanvasElement;
  private lastText = '';
  private compactText = false;

  constructor() {
    this.group.position.set(176, 0, -83);
    for (const [z, rgb] of [[-1.42, '255,173,80'], [1.42, '255,207,131']] as const) {
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2),
        new THREE.MeshBasicMaterial({ map: identityPool('star', rgb), transparent: true,
          opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(36, 0.11, z);
      this.group.add(pool); this.pools.push(pool);
    }
    this.star = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 6.8),
      new THREE.MeshBasicMaterial({ map: starLightTexture(), transparent: true,
        opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.star.rotation.x = -Math.PI / 2;
    this.star.rotation.z = 0.035;
    this.star.position.set(33, 0.13, 0);
    this.group.add(this.star);

    this.messageCanvas = document.createElement('canvas');
    this.messageCanvas.width = 1024; this.messageCanvas.height = 512;
    this.messageTexture = new THREE.CanvasTexture(this.messageCanvas);
    this.messageTexture.colorSpace = THREE.SRGBColorSpace;
    (this.message.material as THREE.MeshBasicMaterial).map = this.messageTexture;
    this.message.rotation.y = -Math.PI / 2;
    this.message.position.set(51, 5.3, 0);
    this.group.add(this.message);
    this.drawMessage('');
  }

  public setRecipientStyle(style: LanternStyle): void {
    const material = this.pools[0].material as THREE.MeshBasicMaterial;
    material.map?.dispose();
    material.map = identityPool(style, '255,173,80');
    material.needsUpdate = true;
    this.pools[0].rotation.set(-Math.PI / 2, 0, 0);
    if (style === 'carp' || style === 'butterfly') this.pools[0].rotateZ(Math.PI / 2);
  }

  public drawMessage(text: string): void {
    const compact = window.innerWidth / Math.max(1, window.innerHeight) < 0.85;
    if (text === this.lastText && compact === this.compactText) return;
    this.lastText = text;
    this.compactText = compact;
    const ctx = this.messageCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 512);
    if (text) {
      const backdrop = ctx.createRadialGradient(512, 260, 45, 512, 260, 515);
      backdrop.addColorStop(0, 'rgba(11,23,41,.98)');
      backdrop.addColorStop(0.65, 'rgba(13,26,44,.9)');
      backdrop.addColorStop(1, 'rgba(20,31,48,0)');
      ctx.fillStyle = backdrop; ctx.fillRect(0, 0, 1024, 512);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${compact ? 64 : 51}px "Segoe UI", Arial, sans-serif`;
      const lines = wrap(ctx, text, 790);
      const lineHeight = 73;
      const top = 256 - (lines.length - 1) * lineHeight / 2;
      ctx.shadowColor = '#90674d'; ctx.shadowBlur = 2;
      ctx.fillStyle = '#dfcfb4';
      lines.forEach((line, i) => ctx.fillText(line, 512, top + i * lineHeight));
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,207,145,.64)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(310, 430); ctx.lineTo(714, 430); ctx.stroke();
      ctx.fillStyle = '#ffe2a2';
      for (const x of [284, 740]) {
        ctx.beginPath(); ctx.arc(x, 430, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    this.messageTexture.needsUpdate = true;
  }

  public update(together: number, overlap: number, messageOpacity: number,
    text: string, time: number): void {
    // The in-world lettering is composed for a wide frame. Keep the entire
    // sentence inside a portrait viewport without altering the plaza camera.
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    this.message.scale.setScalar(Math.min(1, Math.max(0.49, aspect / 0.9)));
    this.drawMessage(text);
    this.pools.forEach((pool, i) => {
      pool.position.z = (i === 0 ? -1 : 1) * (1.42 - overlap * 0.85);
      (pool.material as THREE.MeshBasicMaterial).opacity = together * (1 - overlap * .88) *
        (0.78 + Math.sin(time * 1.5 + i) * 0.035);
    });
    this.star.scale.setScalar(0.62 + overlap * 0.55);
    (this.star.material as THREE.MeshBasicMaterial).opacity = overlap * overlap * 0.9;
    (this.message.material as THREE.MeshBasicMaterial).opacity = messageOpacity;
  }

  public dispose(): void {
    this.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const material = object.material as THREE.MeshBasicMaterial;
      material.map?.dispose(); material.dispose();
    });
  }
}
