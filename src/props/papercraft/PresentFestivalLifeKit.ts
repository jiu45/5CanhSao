import * as THREE from 'three';

/** Small reusable paper vignettes for the present-day park. One painted card per family or balloon cluster. */
export class PresentFestivalLifeKit {
  private matMaterial?: THREE.MeshBasicMaterial;
  private sitterMaterials: THREE.SpriteMaterial[] = [];
  private balloonMaterials: THREE.SpriteMaterial[] = [];
  private haloMaterial?: THREE.MeshBasicMaterial;
  private readonly balloons: THREE.Sprite[] = [];
  private readonly accents: Array<THREE.MeshBasicMaterial | THREE.SpriteMaterial> = [];

  private texture(size: number, paint: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    paint(canvas.getContext('2d')!);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private halo(): THREE.MeshBasicMaterial {
    if (!this.haloMaterial) {
      const map = this.texture(128, c => {
        const gradient = c.createRadialGradient(64, 64, 4, 64, 64, 63);
        gradient.addColorStop(0, 'rgba(255,196,111,.48)');
        gradient.addColorStop(.45, 'rgba(248,146,76,.17)');
        gradient.addColorStop(1, 'rgba(248,146,76,0)');
        c.fillStyle = gradient; c.fillRect(0, 0, 128, 128);
      });
      this.haloMaterial = new THREE.MeshBasicMaterial({ map, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        toneMapped: false });
    }
    return this.haloMaterial;
  }

  private createGroundHalo(width: number, depth: number): THREE.Mesh {
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.halo());
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.035;
    return halo;
  }

  createPicnic(variant = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = 'present_picnic';
    if (!this.matMaterial) {
      const map = this.texture(256, c => {
        c.fillStyle = '#6f3544'; c.fillRect(0, 0, 256, 256);
        for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
          c.fillStyle = (row + col) % 2 ? '#d9a580' : '#b55d64';
          c.fillRect(col * 32, row * 32, 32, 32);
        }
        c.strokeStyle = '#f2d8aa'; c.lineWidth = 8; c.strokeRect(5, 5, 246, 246);
      });
      this.matMaterial = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide,
        transparent: true });
    }
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 2.35), this.matMaterial);
    mat.rotation.x = -Math.PI / 2; mat.rotation.z = variant * 0.13;
    mat.position.y = 0.045; group.add(mat);
    group.add(this.createGroundHalo(5, 4));

    for (let i = 0; i < 3; i++) {
      if (!this.sitterMaterials[i]) {
        const map = this.texture(256, c => {
          const coat = ['#334761', '#6a4154', '#26505b'][i];
          const light = c.createRadialGradient(143, 74, 0, 143, 74, 78);
          light.addColorStop(0, 'rgba(255,207,142,.37)');
          light.addColorStop(1, 'rgba(255,207,142,0)');
          c.fillStyle = light; c.fillRect(0, 0, 256, 200);
          c.fillStyle = coat;
          c.beginPath(); c.moveTo(58, 242); c.quadraticCurveTo(42, 173, 86, 131);
          c.lineTo(145, 125); c.quadraticCurveTo(184, 153, 203, 237); c.closePath(); c.fill();
          c.fillStyle = '#26364b';
          c.beginPath(); c.ellipse(117, 83, 38, 47, i === 2 ? -.18 : .12, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#e8ae81'; c.lineWidth = 4;
          c.beginPath(); c.ellipse(117, 83, 38, 47, 0, -.3, 1.1); c.stroke();
          c.fillStyle = '#17283d';
          c.beginPath(); c.ellipse(105, 231, 99, 17, 0, 0, Math.PI * 2); c.fill();
        });
        this.sitterMaterials[i] = new THREE.SpriteMaterial({ map, transparent: true,
          alphaTest: 0.025, depthWrite: false, fog: true });
      }
      const person = new THREE.Sprite(this.sitterMaterials[i]);
      person.center.set(.5, 0);
      person.scale.set(i === 2 ? 1.05 : 1.22, i === 2 ? 1.05 : 1.2, 1);
      person.position.set([-1.05, .98, -.12][i], 0.08, [-.26, .12, -.68][i]);
      group.add(person);
    }

    // A paper mooncake box, fruit dish and central lantern tell the story at a glance.
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xaa5045, transparent: true });
    this.accents.push(boxMaterial);
    const box = new THREE.Mesh(new THREE.BoxGeometry(.48, .12, .35), boxMaterial);
    box.position.set(-.42, .14, .56); group.add(box);
    const dishMaterial = new THREE.MeshBasicMaterial({ color: 0xe8c17e, side: THREE.DoubleSide,
      transparent: true });
    this.accents.push(dishMaterial);
    const dish = new THREE.Mesh(new THREE.CircleGeometry(.25, 16), dishMaterial);
    dish.rotation.x = -Math.PI / 2; dish.position.set(.37, .12, .46); group.add(dish);
    const lanternMaterial = new THREE.MeshBasicMaterial({ color: 0xffd57d, toneMapped: false,
      transparent: true });
    this.accents.push(lanternMaterial);
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), lanternMaterial);
    lantern.position.set(.08, .42, .12); group.add(lantern);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: 0xe5ad74, transparent: true });
    this.accents.push(stemMaterial);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .25, 5), stemMaterial);
    stem.position.set(.08, .18, .12); group.add(stem);
    const glowMaterial = new THREE.SpriteMaterial({ map: this.halo().map,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      toneMapped: false });
    this.accents.push(glowMaterial);
    const glow = new THREE.Sprite(glowMaterial);
    glow.position.set(.08, .49, .12); glow.scale.set(2, 1.8, 1); group.add(glow);
    return group;
  }

  createBalloons(variant = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = 'present_balloon_gathering';
    if (!this.balloonMaterials[variant]) {
      const map = this.texture(512, c => {
        const colors = variant % 2 ? ['#ffe3a2', '#83dbdf', '#ff9e9a'] :
          ['#ff9e9a', '#ffe3a2', '#83dbdf'];
        const positions = [[160, 135], [282, 80], [370, 158]];
        positions.forEach(([x, y], i) => {
          const gradient = c.createRadialGradient(x, y, 9, x, y, 89);
          gradient.addColorStop(0, colors[i]);
          gradient.addColorStop(.32, colors[i] + '9c');
          gradient.addColorStop(1, colors[i] + '00');
          c.fillStyle = gradient; c.beginPath(); c.arc(x, y, 89, 0, Math.PI * 2); c.fill();
          c.fillStyle = colors[i]; c.beginPath(); c.ellipse(x, y, 30, 37, -.13, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#fff3d7'; c.lineWidth = 3; c.stroke();
          c.strokeStyle = 'rgba(239,216,182,.76)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(x, y + 38); c.quadraticCurveTo(x + 18, 280, 287, 380); c.stroke();
        });
        // The balloon holder lives on the same paper card, so clusters never float unattended.
        c.fillStyle = '#263a50';
        c.beginPath(); c.ellipse(258, 323, 31, 37, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,214,163,.85)'; c.lineWidth = 4;
        c.beginPath(); c.ellipse(258, 323, 31, 37, 0, -1, .55); c.stroke();
        c.fillStyle = '#344a60';
        c.beginPath(); c.moveTo(232, 356); c.lineTo(283, 354);
        c.lineTo(302, 453); c.lineTo(282, 474); c.lineTo(227, 462); c.closePath(); c.fill();
        c.strokeStyle = '#344a60'; c.lineWidth = 16; c.lineCap = 'round';
        c.beginPath(); c.moveTo(282, 368); c.lineTo(287, 380); c.stroke();
        c.fillStyle = '#1c2d43'; c.fillRect(237, 462, 18, 45); c.fillRect(273, 462, 18, 45);
      });
      this.balloonMaterials[variant] = new THREE.SpriteMaterial({ map, transparent: true,
        depthWrite: false, fog: true });
    }
    const sprite = new THREE.Sprite(this.balloonMaterials[variant]);
    sprite.center.set(.5, 0);
    sprite.position.y = 0;
    sprite.scale.set(3.0, 3.48, 1);
    sprite.userData.restY = sprite.position.y;
    this.balloons.push(sprite);
    group.add(sprite);
    return group;
  }

  update(time: number): void {
    this.balloons.forEach((sprite, i) => {
      sprite.position.y = sprite.userData.restY + Math.sin(time * 1.2 + i * 1.9) * .07;
      sprite.rotation.z = Math.sin(time * .8 + i) * .025;
    });
  }

  setQuiet(amount: number): void {
    const opacity = 1 - THREE.MathUtils.clamp(amount, 0, 1) * .92;
    if (this.matMaterial) this.matMaterial.opacity = opacity;
    if (this.haloMaterial) this.haloMaterial.opacity = opacity;
    this.sitterMaterials.forEach(material => { material.opacity = opacity; });
    this.balloonMaterials.forEach(material => { material.opacity = opacity; });
    this.accents.forEach(material => { material.opacity = opacity; });
  }
}
