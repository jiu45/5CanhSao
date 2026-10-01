import * as THREE from 'three';

export class Moon {
  public group: THREE.Group;
  public moonMesh: THREE.Mesh;
  public directionalLight: THREE.DirectionalLight;
  private haloMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // 1. A painted paper disc. Keep its silhouette perfectly round; only the
    // restrained colour wash suggests paper beneath the shared moonlight halo.
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = moonCanvas.height = 512;
    const moonCtx = moonCanvas.getContext('2d')!;
    const centre = 256;
    moonCtx.beginPath();
    moonCtx.arc(centre, centre, 236, 0, Math.PI * 2);
    const paperWash = moonCtx.createRadialGradient(centre, centre, 18, centre, centre, 236);
    paperWash.addColorStop(0, '#fffdf4');
    paperWash.addColorStop(.7, '#fbf9f1');
    paperWash.addColorStop(.92, '#eff2ef');
    paperWash.addColorStop(1, '#dce8ed');
    moonCtx.fillStyle = paperWash;
    moonCtx.fill();
    moonCtx.strokeStyle = 'rgba(112, 145, 169, .22)';
    moonCtx.lineWidth = 6;
    moonCtx.stroke();
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    const moonGeo = new THREE.PlaneGeometry(3.9, 3.9);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      color: new THREE.Color(0xffffff).multiplyScalar(1.18),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.renderOrder = 1;
    this.group.add(this.moonMesh);

    // 2. Luminous celestial halo glow
    const haloGeo = new THREE.PlaneGeometry(6.5, 6.5);
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const ctx = haloCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 250, 230, 0.85)');
    gradient.addColorStop(0.3, 'rgba(210, 235, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(160, 200, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(160, 200, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.76,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.renderOrder = 0;
    this.group.add(this.haloMesh);

    // 3. Directional moonlight beam
    this.directionalLight = new THREE.DirectionalLight(0xb0d8ff, 1.8);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 40;
    this.directionalLight.shadow.camera.left = -6;
    this.directionalLight.shadow.camera.right = 6;
    this.directionalLight.shadow.camera.top = 6;
    this.directionalLight.shadow.camera.bottom = -6;
    this.directionalLight.shadow.bias = -0.001;
    this.group.add(this.directionalLight);
  }

  public update(camera: THREE.Camera) {
    // The shallow paper layers turn together toward the viewer.
    this.moonMesh.quaternion.copy(camera.quaternion);
    this.haloMesh.quaternion.copy(camera.quaternion);
  }

  /** Scene-local light level; the village can keep its softer storytelling moon. */
  public setVisualLevel(discBrightness: number, haloOpacity: number,
    tint: THREE.ColorRepresentation = 0xffffff): void {
    (this.moonMesh.material as THREE.MeshBasicMaterial).color
      .set(tint).multiplyScalar(discBrightness);
    (this.haloMesh.material as THREE.MeshBasicMaterial).opacity = haloOpacity;
  }
}
