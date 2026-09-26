import * as THREE from 'three';

function burstTexture(color: string, core: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const glow = ctx.createRadialGradient(256, 256, 6, 256, 256, 210);
  glow.addColorStop(0, `${core}cc`);
  glow.addColorStop(0.25, `${color}66`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI * 2 / 18 + 0.08;
    const inner = 44 + (i % 3) * 10;
    const outer = 165 + (i % 4) * 12;
    const x1 = 256 + Math.cos(a) * inner;
    const y1 = 256 + Math.sin(a) * inner;
    const x2 = 256 + Math.cos(a) * outer;
    const y2 = 256 + Math.sin(a) * outer;
    ctx.strokeStyle = i % 4 === 0 ? core : color;
    ctx.lineWidth = i % 5 === 0 ? 5 : 3;
    ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.quadraticCurveTo(256 + Math.cos(a + 0.04) * 108,
      256 + Math.sin(a + 0.04) * 108, x2, y2); ctx.stroke();
    ctx.fillStyle = i % 4 === 0 ? core : color;
    ctx.beginPath(); ctx.arc(x2, y2, i % 3 === 0 ? 6 : 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(256, 256, 11, 0, Math.PI * 2); ctx.fill();
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  return result;
}

/** Small number of illustrated bursts and rising light flecks, never a particle wall. */
export class FinaleSky {
  public readonly group = new THREE.Group();
  private readonly bursts: { mesh: THREE.Mesh; start: number }[] = [];
  private readonly motes: THREE.Points;
  private readonly baseMotes: THREE.Vector3[] = [];

  constructor() {
    this.group.position.set(176, 0, -83);
    const specs = [
      { x: 72, y: 31, z: -24, color: '#f5b867', core: '#fff2b8', start: 1.2 },
      { x: 80, y: 27, z: 17, color: '#e97d76', core: '#ffd0ab', start: 3.4 },
      { x: 84, y: 35, z: -8, color: '#d8d4ae', core: '#fff4cf', start: 5.7 },
      { x: 70, y: 25, z: 29, color: '#abd6d3', core: '#e2f4e3', start: 7.4 },
      { x: 82, y: 34, z: -27, color: '#e99d88', core: '#ffe0b6', start: 13.5 },
      { x: 88, y: 39, z: -34, color: '#f2c777', core: '#fff2bb', start: 19.5 }
    ];
    for (const spec of specs) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 12.5),
        new THREE.MeshBasicMaterial({ map: burstTexture(spec.color, spec.core),
          transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      mesh.rotation.y = -Math.PI / 2;
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.scale.setScalar(0.3);
      this.group.add(mesh);
      this.bursts.push({ mesh, start: spec.start });
    }
    const positions: number[] = [];
    const colors: number[] = [];
    const palette = [new THREE.Color(0xffd494), new THREE.Color(0xf59278),
      new THREE.Color(0xe7e8cb)];
    for (let i = 0; i < 92; i++) {
      const p = new THREE.Vector3(18 + (i * 47) % 62,
        0.6 + (i % 5) * 0.48,
        Math.sin(i * 4.72) * (7 + (i * 11) % 30));
      this.baseMotes.push(p);
      positions.push(p.x, p.y, p.z);
      const c = palette[i % 3]; colors.push(c.r, c.g, c.b);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.motes = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.31, vertexColors: true, transparent: true, opacity: 0,
      depthWrite: false, sizeAttenuation: true
    }));
    this.group.add(this.motes);
    this.group.visible = false;
  }

  public update(sinceRelease: number): void {
    this.group.visible = sinceRelease >= 0;
    if (sinceRelease < 0) return;
    this.bursts.forEach(({ mesh, start }) => {
      const life = THREE.MathUtils.clamp((sinceRelease - start) / 3.2, 0, 1);
      const active = sinceRelease >= start && sinceRelease < start + 3.2;
      const alpha = active ? Math.sin(life * Math.PI) * 0.74 : 0;
      (mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      mesh.scale.setScalar(0.36 + life * 0.92);
    });
    const rise = Math.min(17, sinceRelease * 2.3);
    const attribute = this.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    this.baseMotes.forEach((base, i) => {
      const height = base.y + ((rise + i * 0.28) % 17);
      attribute.setXYZ(i, base.x + Math.sin(sinceRelease * 0.3 + i) * 0.25,
        height, base.z);
    });
    attribute.needsUpdate = true;
    (this.motes.material as THREE.PointsMaterial).opacity = Math.min(0.85, sinceRelease * 0.14);
  }

  public dispose(): void {
    this.group.traverse(object => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
      object.geometry.dispose();
      const material = object.material as THREE.MeshBasicMaterial | THREE.PointsMaterial;
      material.map?.dispose(); material.dispose();
    });
  }
}
