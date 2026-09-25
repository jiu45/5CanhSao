import * as THREE from 'three';

export class Moon {
  public group: THREE.Group;
  public moonMesh: THREE.Mesh;
  public directionalLight: THREE.DirectionalLight;
  private haloMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // 1. Moon sphere / disc
    const moonGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfffae8
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
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
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
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
    // Keep halo facing the camera
    this.haloMesh.quaternion.copy(camera.quaternion);
  }
}
