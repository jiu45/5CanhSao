import * as THREE from 'three';

type LanternProp = 'none' | 'star' | 'balloon' | 'round';

/** A small atlas of camera-facing cut-paper people. No lights or character rigs per NPC. */
export class PresentCrowdKit {
  private readonly materials = new Map<string, THREE.SpriteMaterial>();
  private readonly farTexture: THREE.CanvasTexture;
  private crossingMaterial?: THREE.SpriteMaterial;

  constructor() {
    this.farTexture = this.makeTexture(0, 'none', false, true);
  }

  createActor(x: number, z: number, scale = 1, _color = 0x23344d,
    prop: LanternProp = 'none', detailed = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    const variant = Math.abs(Math.floor(x * 7 + z * 11)) % 7;
    const key = `${variant}:${prop}:${detailed}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.SpriteMaterial({
        map: this.makeTexture(variant, prop, detailed, false),
        transparent: true, depthWrite: false, alphaTest: 0.025, fog: true
      });
      this.materials.set(key, material);
    }
    const card = new THREE.Sprite(material);
    card.center.set(0.5, 0);
    card.scale.set(1.75, 2.72, 1);
    group.add(card);
    group.userData.baseX = x;
    group.userData.baseZ = z;
    group.userData.paperCard = card;
    return group;
  }

  createFarMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      map: this.farTexture, transparent: true, alphaTest: 0.18,
      side: THREE.DoubleSide, depthWrite: false, fog: true
    });
  }

  createCrossingSheet(): THREE.Sprite {
    if (!this.crossingMaterial) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 380;
      const c = canvas.getContext('2d')!;
      for (let i = 0; i < 8; i++) {
        const prop: LanternProp = i % 3 === 0 ? 'star' : i % 3 === 1 ? 'round' : 'none';
        const figure = this.makeTexture(i % 7, prop, false, false);
        const width = i % 3 === 0 ? 172 : 152;
        const height = i % 4 === 0 ? 355 : 320;
        c.drawImage(figure.image as HTMLCanvasElement,
          i * 127 - 31, 380 - height, width, height);
        figure.dispose();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.crossingMaterial = new THREE.SpriteMaterial({
        map: texture, transparent: true, alphaTest: 0.025,
        depthWrite: false, fog: true
      });
    }
    const sheet = new THREE.Sprite(this.crossingMaterial);
    sheet.center.set(0.5, 0);
    sheet.scale.set(9.5, 3.5, 1);
    return sheet;
  }

  private makeTexture(variant: number, prop: LanternProp,
    detailed: boolean, far: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 512;
    const c = canvas.getContext('2d')!;
    const palette = ['#22384c', '#334458', '#563945', '#245157', '#61404f', '#343b5b', '#534757'];
    const coat = palette[variant];
    const trim = variant % 3 === 0 ? '#8d6060' : variant % 3 === 1 ? '#58818b' : '#aa866d';

    const polygon = (pts: number[][], fill: string) => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.closePath(); c.fillStyle = fill; c.fill();
    };
    const person = (cx: number, bottom: number, s: number, style: number) => {
      c.save(); c.translate(cx, bottom); c.scale(s, s);
      // Warm paper edge remains visible in the midnight scene.
      c.shadowColor = '#e9a45c'; c.shadowBlur = far ? 5 : 12;
      c.fillStyle = '#51444a';
      c.beginPath(); c.ellipse(0, -294, 37, 43, style % 2 ? 0.12 : -0.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#c68b65'; c.lineWidth = 3; c.stroke();
      c.shadowBlur = 0;
      polygon([[-36, -326], [-9, -345], [27, -330], [43, -310], [25, -314], [-30, -308]], '#18253a');
      if (style % 3 === 2) polygon([[-41, -317], [-26, -344], [22, -339], [37, -317]], '#1d2b40');
      // Coat is a purposeful tapered paper cut, with offset arms and open negative space.
      if (style % 3 === 0) {
        // Contemporary áo dài silhouette, with two fluttering skirt panels.
        polygon([[-48, -249], [-18, -264], [27, -257], [52, -237],
          [39, -145], [68, -40], [17, -66], [2, -112], [-26, -64], [-67, -48], [-37, -156]], coat);
        polygon([[-46, -237], [-72, -180], [-57, -158], [-29, -202]], coat);
        polygon([[46, -233], [73, -181], [56, -161], [31, -208]], coat);
      } else if (style % 3 === 1) {
        polygon([[-52, -249], [-23, -260], [22, -260], [50, -246],
          [57, -119], [33, -101], [2, -112], [-30, -98], [-62, -117]], coat);
        polygon([[-51, -234], [-80, -169], [-61, -154], [-35, -207]], coat);
        polygon([[45, -235], [73, -172], [57, -153], [38, -207]], coat);
      } else {
        polygon([[-43, -250], [-18, -264], [29, -258], [47, -241],
          [64, -99], [27, -79], [4, -106], [-29, -84], [-59, -104]], coat);
        polygon([[-43, -237], [-71, -188], [-57, -173], [-30, -211]], coat);
        polygon([[43, -234], [79, -186], [66, -171], [31, -212]], coat);
      }
      polygon([[-34, -89], [-11, -100], [-5, -18], [-37, -10]], '#17283a');
      polygon([[11, -102], [31, -88], [38, -10], [5, -19]], '#192a3d');
      polygon([[-42, -13], [-8, -20], [-7, -2], [-47, -2]], '#131e30');
      polygon([[5, -20], [41, -14], [45, -2], [6, -2]], '#141e2f');
      polygon([[-24, -257], [-5, -248], [17, -254], [7, -222], [-12, -223]], trim);
      polygon([[7, -230], [43, -243], [35, -218], [1, -204]], '#77808c');
      if (style % 3 === 0) polygon([[-37, -98], [-3, -104], [-8, -25], [-39, -11]], '#1a2b3d');
      if (style % 2 === 0) {
        c.strokeStyle = '#ad8664'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-44, -225); c.lineTo(-26, -118); c.stroke();
      }
      c.restore();
    };

    if (variant === 1 || variant === 4) {
      person(120, 490, 0.83, variant);
      person(245, 499, 0.55, variant + 1);
    } else if (variant === 5) {
      person(105, 495, 0.76, variant);
      person(232, 495, 0.72, variant + 2);
    } else {
      person(158, 495, variant === 3 ? 0.74 : 0.88, variant);
    }

    if (prop !== 'none' && !far) {
      const px = variant === 1 || variant === 4 ? 276 : 251;
      const py = prop === 'balloon' ? 116 : 266;
      c.strokeStyle = '#b59a70'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(px - 32, 319); c.lineTo(px, py + 18); c.stroke();
      const halo = c.createRadialGradient(px, py, 3, px, py, 67);
      halo.addColorStop(0, 'rgba(255,245,186,.62)');
      halo.addColorStop(0.4, 'rgba(249,171,75,.25)');
      halo.addColorStop(1, 'rgba(249,171,75,0)');
      c.fillStyle = halo; c.beginPath(); c.arc(px, py, 67, 0, Math.PI * 2); c.fill();
      c.shadowColor = '#ffad4a'; c.shadowBlur = 22;
      if (prop === 'star') {
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const r = i % 2 ? 16 : 35;
          const vx = px + Math.cos(a) * r, vy = py + Math.sin(a) * r;
          if (i === 0) c.moveTo(vx, vy); else c.lineTo(vx, vy);
        }
        c.closePath(); c.fillStyle = '#ffb940'; c.fill();
        c.strokeStyle = '#fff0b4'; c.lineWidth = 3; c.stroke();
      } else {
        c.beginPath(); c.ellipse(px, py, prop === 'balloon' ? 24 : 20,
          prop === 'balloon' ? 31 : 24, 0, 0, Math.PI * 2);
        c.fillStyle = prop === 'balloon' ? '#ffd494' : '#ef9970'; c.fill();
      }
      c.shadowBlur = 0;
    }

    if (detailed) {
      c.fillStyle = 'rgba(255,220,165,.35)';
      c.fillRect(39, 482, 212, 3);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
}
