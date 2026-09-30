import * as THREE from 'three';

export type VisitorProp = 'none' | 'star' | 'balloon' | 'round' | 'phone';

/** A small atlas of camera-facing cut-paper people. No lights or character rigs per NPC. */
export class PresentCrowdKit {
  private readonly materials = new Map<string, THREE.SpriteMaterial>();
  private readonly farTexture: THREE.CanvasTexture;
  private crossingMaterial?: THREE.SpriteMaterial;

  constructor() {
    this.farTexture = this.makeTexture(0, 'none', false, true, 0);
  }

  createActor(x: number, z: number, scale = 1, _color = 0x23344d,
    prop: VisitorProp = 'none', detailed = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    const variant = Math.abs(Math.floor(x * 7 + z * 11)) % 7;
    const card = new THREE.Sprite(this.material(variant, prop, detailed, 0));
    card.center.set(0.5, 0);
    card.scale.set(1.75, 2.72, 1);
    group.add(card);
    group.userData.baseX = x;
    group.userData.baseZ = z;
    group.userData.paperCard = card;
    if (detailed && [0, 2, 5, 6].includes(variant)) {
      group.userData.walkMaterials = [card.material, this.material(variant, prop, detailed, 1)];
    }
    return group;
  }

  animateActor(group: THREE.Group, time: number, phase: number): void {
    const card = group.userData.paperCard as THREE.Sprite;
    const frames = group.userData.walkMaterials as THREE.SpriteMaterial[] | undefined;
    if (frames) card.material = frames[Math.floor(time * 1.45 + phase) % 2];
  }

  private material(variant: number, prop: VisitorProp, detailed: boolean,
    frame: 0 | 1): THREE.SpriteMaterial {
    const key = `${variant}:${prop}:${detailed}:${frame}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.SpriteMaterial({
        map: this.makeTexture(variant, prop, detailed, false, frame),
        transparent: true, depthWrite: false, alphaTest: 0.025, fog: true
      });
      this.materials.set(key, material);
    }
    return material;
  }

  createFarMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      map: this.farTexture, transparent: true, alphaTest: 0.18,
      side: THREE.DoubleSide, depthWrite: false, fog: true
    });
  }

  dispose(): void {
    for (const material of this.materials.values()) {
      material.map?.dispose();
      material.dispose();
    }
    this.materials.clear();
    this.crossingMaterial?.map?.dispose();
    this.crossingMaterial?.dispose();
    this.farTexture.dispose();
  }

  createCrossingSheet(): THREE.Sprite {
    if (!this.crossingMaterial) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 380;
      const c = canvas.getContext('2d')!;
      for (let i = 0; i < 8; i++) {
        const props: VisitorProp[] = ['none', 'balloon', 'round', 'phone', 'none', 'star', 'none', 'balloon'];
        const figure = this.makeTexture(i % 7, props[i], false, false, 0);
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

  private makeTexture(variant: number, prop: VisitorProp,
    detailed: boolean, far: boolean, frame: 0 | 1): THREE.CanvasTexture {
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
    const glow = (x: number, y: number, coral = false, radius = 64) => {
      const g = c.createRadialGradient(x, y, 2, x, y, radius);
      g.addColorStop(0, coral ? 'rgba(255,221,190,.69)' : 'rgba(255,240,181,.69)');
      g.addColorStop(.38, coral ? 'rgba(246,114,93,.26)' : 'rgba(245,177,83,.24)');
      g.addColorStop(1, 'rgba(245,177,83,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
    };
    const arm = (x1: number, y1: number, x2: number, y2: number,
      color: string) => {
      c.strokeStyle = color; c.lineWidth = 19; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x1, y1);
      c.quadraticCurveTo((x1 + x2) / 2 + 5, (y1 + y2) / 2, x2, y2); c.stroke();
      c.fillStyle = '#bda07e'; c.beginPath(); c.arc(x2, y2, 6, 0, Math.PI * 2); c.fill();
    };
    const person = (cx: number, bottom: number, s: number, style: number,
      held: VisitorProp, linked = false) => {
      c.save(); c.translate(cx, bottom); c.scale(s, s);
      // Warm and coral light brush the paper edge without a costly light per actor.
      if (held !== 'none' && !far) glow(48, -272, held === 'round' || held === 'phone', 92);
      c.shadowColor = '#e9a45c'; c.shadowBlur = far ? 5 : 12;
      c.fillStyle = '#51444a';
      c.beginPath(); c.ellipse(0, -294, 37, 43, style % 2 ? 0.12 : -0.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#c68b65'; c.lineWidth = 3; c.stroke();
      if (!far && (held === 'star' || held === 'round')) {
        c.strokeStyle = 'rgba(255,211,142,.78)'; c.lineWidth = 6;
        c.beginPath(); c.ellipse(0, -294, 37, 43, 0, -.92, .58); c.stroke();
      }
      c.shadowBlur = 0;
      polygon([[-36, -326], [-9, -345], [27, -330], [43, -310], [25, -314], [-30, -308]], '#18253a');
      if (style % 3 === 2) polygon([[-41, -317], [-26, -344], [22, -339], [37, -317]], '#1d2b40');
      // Coat and gait remain legible as one cut-paper silhouette.
      if (style % 3 === 0) {
        // Contemporary áo dài silhouette, with two fluttering skirt panels.
        polygon([[-48, -249], [-18, -264], [27, -257], [52, -237],
          [39, -145], [68, -40], [17, -66], [2, -112], [-26, -64], [-67, -48], [-37, -156]], coat);
      } else if (style % 3 === 1) {
        polygon([[-52, -249], [-23, -260], [22, -260], [50, -246],
          [57, -119], [33, -101], [2, -112], [-30, -98], [-62, -117]], coat);
      } else {
        polygon([[-43, -250], [-18, -264], [29, -258], [47, -241],
          [64, -99], [27, -79], [4, -106], [-29, -84], [-59, -104]], coat);
      }
      const step = [0, 2, 5, 6].includes(style % 7) ? (frame ? 12 : -12) : 0;
      polygon([[-34, -89], [-11, -100], [-5 + step, -18], [-37 + step, -10]], '#17283a');
      polygon([[11, -102], [31, -88], [38 - step, -10], [5 - step, -19]], '#192a3d');
      polygon([[-42 + step, -13], [-8 + step, -20], [-7 + step, -2], [-47 + step, -2]], '#131e30');
      polygon([[5 - step, -20], [41 - step, -14], [45 - step, -2], [6 - step, -2]], '#141e2f');
      polygon([[-24, -257], [-5, -248], [17, -254], [7, -222], [-12, -223]], trim);
      polygon([[7, -230], [43, -243], [35, -218], [1, -204]], '#77808c');
      if (style % 3 === 0) polygon([[-37, -98], [-3, -104], [-8, -25], [-39, -11]], '#1a2b3d');
      arm(-42, -228, linked ? -69 : -58, linked ? -174 : style % 3 === 1 ? -156 : -128, coat);
      const handY = held === 'phone' ? -284 : held === 'balloon' ? -196 :
        held === 'star' || held === 'round' ? -260 :
        held === 'none' && linked ? -174 : -180;
      arm(42, -229, held === 'phone' ? 53 : 66, handY, coat);

      if (!far && held === 'balloon') {
        c.strokeStyle = '#ddc8a5'; c.lineWidth = 1.7;
        c.beginPath(); c.moveTo(66, -196); c.bezierCurveTo(86, -267, 34, -324, 61, -396); c.stroke();
        glow(61, -409, style % 2 === 1, 60);
        c.shadowColor = style % 2 === 1 ? '#ff8b83' : '#ffe5a0'; c.shadowBlur = 20;
        c.fillStyle = style % 2 === 1 ? '#f49b94' : '#f4d7a0';
        c.beginPath(); c.ellipse(61, -413, 23, 30, -.08, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff0d1'; c.lineWidth = 2; c.stroke(); c.shadowBlur = 0;
      } else if (!far && held === 'phone') {
        glow(61, -308, true, 48);
        c.save(); c.translate(61, -307); c.rotate(-.16);
        c.fillStyle = '#142435'; c.fillRect(-14, -21, 27, 43);
        c.fillStyle = '#dfebea'; c.fillRect(-10, -17, 19, 32);
        c.fillStyle = '#84b7be'; c.fillRect(-8, -14, 15, 22);
        c.restore();
      } else if (!far && (held === 'round' || held === 'star')) {
        const ly = held === 'round' ? -284 : -296;
        glow(84, ly, held === 'round', 76);
        c.strokeStyle = '#d8b991'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(66, -260); c.lineTo(79, ly + 12); c.stroke();
        c.shadowColor = '#ffc076'; c.shadowBlur = 18;
        if (held === 'star') {
          c.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5;
            const radius = i % 2 ? 11 : 23;
            if (i === 0) c.moveTo(84 + Math.cos(a) * radius, ly + Math.sin(a) * radius);
            else c.lineTo(84 + Math.cos(a) * radius, ly + Math.sin(a) * radius);
          }
          c.closePath(); c.fillStyle = '#ffbf5d'; c.fill();
          c.strokeStyle = '#fff0bc'; c.lineWidth = 2; c.stroke();
        } else {
          c.fillStyle = style % 2 ? '#ffb18e' : '#ffe0a2';
          c.beginPath(); c.ellipse(84, ly, 21, 24, -.12, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#fff0c5'; c.lineWidth = 2; c.stroke();
          c.strokeStyle = '#bd7861'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(71, ly - 13); c.lineTo(97, ly + 13); c.stroke();
        }
        c.shadowBlur = 0;
      }
      c.restore();
    };

    if (variant === 1 || variant === 4) {
      person(120, 490, 0.83, variant, prop);
      person(245, 499, 0.55, variant + 1, prop === 'none' ? 'round' : 'none');
    } else if (variant === 5) {
      person(105, 495, 0.76, variant, prop, true);
      person(232, 495, 0.72, variant + 2, 'none', true);
      c.strokeStyle = '#b89977'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(154, 364); c.quadraticCurveTo(174, 358, 184, 370); c.stroke();
    } else {
      person(158, 495, variant === 3 ? 0.74 : 0.88, variant, prop);
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
