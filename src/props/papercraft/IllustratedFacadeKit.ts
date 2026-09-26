import * as THREE from 'three';

/** Shallow civic façades staged as paper scenery beyond stalls and trees. */
export class IllustratedFacadeKit {
  private readonly materials: THREE.MeshBasicMaterial[];

  constructor() {
    this.materials = [0, 1, 2, 3].map(i => new THREE.MeshBasicMaterial({
      map: this.makeTexture(i), transparent: true, alphaTest: 0.04,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      fog: true
    }));
  }

  create(variant: number): THREE.Group {
    const group = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 7.0),
      this.materials[variant % 4]);
    front.position.y = 3.5;
    group.add(front);
    const rear = new THREE.Mesh(new THREE.PlaneGeometry(6.3, 5.6),
      this.materials[(variant + 1) % 4]);
    rear.position.set(1.8, 2.8, -2.2);
    rear.scale.setScalar(0.85);
    group.add(rear);
    return group;
  }

  private makeTexture(variant: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const c = canvas.getContext('2d')!;
    const bases = ['#172839', '#1b293d', '#263046', '#152d3b'];
    c.fillStyle = bases[variant];
    c.beginPath(); c.moveTo(35, 510); c.lineTo(35, 95 + variant * 15);
    if (variant === 0) {
      c.lineTo(150, 81); c.lineTo(332, 81); c.lineTo(478, 100);
    } else if (variant === 1) {
      c.lineTo(105, 73); c.lineTo(314, 97); c.lineTo(478, 63);
    } else if (variant === 2) {
      c.quadraticCurveTo(250, 31, 478, 111);
    } else {
      c.lineTo(170, 113); c.lineTo(170, 66); c.lineTo(345, 66);
      c.lineTo(345, 97); c.lineTo(478, 97);
    }
    c.lineTo(478, 510); c.closePath(); c.fill();
    c.fillStyle = '#30425a'; c.fillRect(54, 129, 407, 3);
    c.fillStyle = '#111e30'; c.fillRect(58, 386, 399, 124);
    // Frosted window panes, spaced like designed façade cards, not a box grid.
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 75 + col * 64 + (row % 2) * 3;
        const y = 157 + row * 55;
        if ((row * 7 + col * 3 + variant) % 5 === 0) continue;
        c.fillStyle = (row + col + variant) % 3 === 0 ? '#aa866d' : '#887c76';
        c.fillRect(x, y, 25, 27);
        c.fillStyle = 'rgba(255,225,168,.22)'; c.fillRect(x + 2, y + 2, 21, 3);
        c.fillStyle = '#243447'; c.fillRect(x + 11, y, 2, 27);
      }
    }
    c.fillStyle = variant % 2 ? '#a8545a' : '#a68060';
    c.fillRect(103, 409, 303, 14);
    c.fillStyle = 'rgba(249,197,118,.45)'; c.fillRect(104, 409, 303, 3);
    c.strokeStyle = '#516074'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(40, 100); c.lineTo(40, 510);
    c.moveTo(474, 103); c.lineTo(474, 510); c.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
}
