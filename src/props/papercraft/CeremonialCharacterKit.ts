import * as THREE from 'three';

type Role = 'elder' | 'guardian';

/** Hand-cut festival characters. Their paper silhouette carries the expression. */
export class CeremonialCharacterKit {
  private readonly materials = new Map<Role, THREE.SpriteMaterial>();

  create(role: Role): THREE.Group {
    let material = this.materials.get(role);
    if (!material) {
      material = new THREE.SpriteMaterial({
        map: this.makeTexture(role), transparent: true, alphaTest: 0.035,
        depthWrite: false, fog: true
      });
      this.materials.set(role, material);
    }
    const group = new THREE.Group();
    const card = new THREE.Sprite(material);
    card.center.set(0.5, 0);
    card.scale.set(role === 'guardian' ? 2.05 : 1.72,
      role === 'guardian' ? 3.26 : 2.72, 1);
    group.add(card);
    return group;
  }

  private makeTexture(role: Role): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 512;
    const c = canvas.getContext('2d')!;
    const guardian = role === 'guardian';
    const stroke = guardian ? '#c9c4aa' : '#d2a778';
    const main = guardian ? '#3e5663' : '#684953';
    const shadow = guardian ? '#203549' : '#332f43';
    const polygon = (pts: number[][], color: string, outline = false) => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.closePath(); c.fillStyle = color; c.fill();
      if (outline) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); }
    };
    c.save();
    c.shadowColor = guardian ? '#d8e4d8' : '#ffc783';
    c.shadowBlur = guardian ? 20 : 14;
    // Flowing áo dài panels and a distinct, gentle shoulder line.
    polygon([[117, 215], [147, 207], [181, 214], [209, 230], [203, 334],
      [237, 489], [184, 469], [160, 383], [132, 467], [84, 489], [119, 332]], main, true);
    c.shadowBlur = 0;
    polygon([[119, 218], [87, 269], [104, 282], [139, 237]], main, true);
    polygon([[199, 224], [228, 270], [214, 284], [178, 240]], main, true);
    polygon([[130, 311], [158, 360], [156, 482], [107, 490]], shadow);
    polygon([[184, 316], [164, 365], [166, 482], [219, 491]], shadow);
    polygon([[135, 217], [158, 231], [181, 217], [166, 320], [154, 351]],
      guardian ? '#8ca4a5' : '#aa806f');
    c.strokeStyle = guardian ? '#d9ddca' : '#edbd81'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(159, 224); c.lineTo(159, 338); c.stroke();
    // Hair bun, long neck and a profile with a soft moonlit rim.
    polygon([[149, 220], [168, 220], [168, 192], [149, 192]], '#8d7469');
    c.fillStyle = '#9d8070'; c.strokeStyle = stroke; c.lineWidth = 3;
    c.beginPath(); c.ellipse(158, 157, guardian ? 36 : 41,
      guardian ? 50 : 45, guardian ? -0.12 : 0.08, 0, Math.PI * 2);
    c.fill(); c.stroke();
    if (guardian) {
      polygon([[120, 153], [131, 112], [173, 105], [195, 131],
        [187, 167], [178, 145], [149, 129], [126, 166]], '#172d41');
      c.fillStyle = '#1a2d40'; c.beginPath(); c.arc(188, 113, 21, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e7dbab'; c.lineWidth = 4;
      c.beginPath(); c.arc(204, 105, 27, -0.2, Math.PI * 0.85); c.stroke();
      polygon([[102, 249], [130, 225], [153, 310], [123, 369], [97, 311]], '#718c90');
    } else {
      c.fillStyle = '#d1c6bc';
      c.beginPath(); c.moveTo(116, 147); c.quadraticCurveTo(113, 100, 154, 100);
      c.quadraticCurveTo(206, 97, 201, 154); c.lineTo(184, 132);
      c.quadraticCurveTo(160, 149, 122, 135); c.closePath(); c.fill();
      c.strokeStyle = '#d8cbb7'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(133, 198); c.quadraticCurveTo(159, 217, 184, 195); c.stroke();
    }
    c.restore();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
}
