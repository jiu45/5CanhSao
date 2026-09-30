import * as THREE from 'three';

const labels = ['BÁNH TRUNG THU', 'TRÀ SEN', 'ĐÈN ÔNG SAO', 'ĐỒ CHƠI GIẤY'];
const fabricColors = ['#9e3044', '#b96b43', '#314e65', '#78465a'];

/** Thin modern festival façade: structural frame, lit paper, fabric and a readable counter. */
export class MarketStallKit {
  private readonly canvasMaterials = new Map<number, THREE.MeshBasicMaterial>();
  private readonly boxGeometries = new Map<string, THREE.BoxGeometry>();
  private readonly washGeometry = new THREE.PlaneGeometry(3.55, 2.05);
  private readonly frontGeometry = new THREE.PlaneGeometry(4.48, 1.28);
  private readonly lampGeometry = new THREE.SphereGeometry(0.2, 8, 6);
  private readonly frame = new THREE.MeshStandardMaterial({ color: 0x604344, roughness: 0.72 });
  private readonly warm = new THREE.MeshBasicMaterial({ color: 0xf5bf72 });
  private readonly dark = new THREE.MeshStandardMaterial({ color: 0x422e37, roughness: 0.92 });
  private readonly lantern = new THREE.MeshBasicMaterial({ color: 0xffd18b });
  private floorWash?: THREE.MeshBasicMaterial;

  create(variant: number): THREE.Group {
    const group = new THREE.Group();
    const beam = (w: number, h: number, d: number, x: number, y: number, z: number,
      mat: THREE.Material = this.frame) => {
      const mesh = new THREE.Mesh(this.boxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z); group.add(mesh); return mesh;
    };
    // Open sides keep this as a shallow illustrated façade, with a clear interior glow.
    beam(3.9, 2.55, 0.07, 0, 1.45, -0.8, this.dark);
    const wash = new THREE.Mesh(this.washGeometry,
      new THREE.MeshBasicMaterial({ color: 0xe8a460, transparent: true, opacity: 0.24,
        side: THREE.DoubleSide, depthWrite: false }));
    wash.position.set(0, 1.65, -0.74); group.add(wash);
    for (const x of [-1.95, 1.95]) beam(0.09, 2.75, 0.1, x, 1.45, 0.66);
    beam(4.15, 0.09, 1.65, 0, 2.82, -0.07);
    beam(3.85, 0.63, 0.73, 0, 0.87, 0.58, this.dark);
    beam(3.9, 0.09, 0.82, 0, 1.22, 0.63, this.frame);
    beam(3.75, 0.045, 0.06, 0, 1.31, 1.05, this.warm);
    const front = new THREE.Mesh(this.frontGeometry,
      this.getCanvasMaterial(variant));
    front.position.set(0, 2.83, 0.75); group.add(front);
    // Mooncake trays, tea jars and lantern craft packets are paper silhouettes.
    for (let i = 0; i < 5; i++) {
      const item = new THREE.Mesh(this.boxGeometry(0.36, 0.18 + (i % 2) * 0.08, 0.3),
        i % 2 ? this.warm : this.frame);
      item.position.set(-1.22 + i * 0.59, 1.41, 0.64);
      item.rotation.y = i % 2 ? 0.14 : -0.12;
      group.add(item);
    }
    for (const x of [-1.55, 1.55]) {
      const lamp = new THREE.Mesh(this.lampGeometry, this.lantern);
      lamp.position.set(x, 2.15, 0.84); lamp.scale.set(0.9, 1.13, 0.75);
      group.add(lamp);
      beam(0.018, 0.3, 0.018, x, 2.55, 0.84, this.warm);
    }
    // A soft painted spill reads as light on the paving without shadow-map cost.
    if (!this.floorWash) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const context = canvas.getContext('2d')!;
      const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 63);
      gradient.addColorStop(0, 'rgba(255,191,103,.58)');
      gradient.addColorStop(.5, 'rgba(240,124,62,.18)');
      gradient.addColorStop(1, 'rgba(240,124,62,0)');
      context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
      this.floorWash = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, toneMapped: false });
    }
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.1), this.floorWash);
    spill.rotation.x = -Math.PI / 2;
    spill.position.set(0, 0.055, 1.65);
    group.add(spill);
    const interior = new THREE.PointLight(0xffbd73, 0.85, 4.8, 2);
    interior.position.set(0, 1.85, 0.45);
    group.add(interior);
    return group;
  }

  private boxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w}:${h}:${d}`;
    let geometry = this.boxGeometries.get(key);
    if (!geometry) {
      geometry = new THREE.BoxGeometry(w, h, d);
      this.boxGeometries.set(key, geometry);
    }
    return geometry;
  }

  private getCanvasMaterial(variant: number): THREE.MeshBasicMaterial {
    const key = variant % labels.length;
    const cached = this.canvasMaterials.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 292;
    const c = canvas.getContext('2d')!;
    c.fillStyle = fabricColors[key];
    c.beginPath(); c.moveTo(20, 8); c.lineTo(1004, 8);
    c.lineTo(980, 199);
    for (let i = 9; i >= 0; i--) {
      const x = 20 + i * 98;
      c.quadraticCurveTo(x + 48, 278, x, 199);
    }
    c.closePath(); c.fill();
    c.strokeStyle = '#f2c78b'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(34, 21); c.lineTo(988, 21); c.stroke();
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = 'rgba(255,219,156,.23)'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(64 + i * 112, 27); c.lineTo(56 + i * 112, 215); c.stroke();
    }
    c.fillStyle = '#ffefc8';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 68px Arial, sans-serif';
    c.shadowColor = '#ffd183'; c.shadowBlur = 18;
    c.fillText(labels[key], 512, 129);
    c.shadowBlur = 0;
    c.font = '32px Arial, sans-serif';
    c.fillText('✦  TRĂNG RẰM  ✦', 512, 197);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, side: THREE.DoubleSide,
      alphaTest: 0.08, depthWrite: false
    });
    this.canvasMaterials.set(key, material);
    return material;
  }
}
