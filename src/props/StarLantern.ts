import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';

export class StarLantern {
  public group: THREE.Group;
  
  // Component groups for step-by-step assembly
  private bambooSkeletonGroup: THREE.Group;
  private paperSkinGroup: THREE.Group;
  private bindingsGroup: THREE.Group;
  private candleGroup: THREE.Group;
  private handShieldGroup: THREE.Group;
  private handShieldMesh!: THREE.Mesh;
  public isShielded: boolean = false;
  private shieldOpacity: number = 0;
  
  // Light and flame
  public candleLight: THREE.PointLight;
  private flameMesh: THREE.Group;
  public isLit: boolean = false;
  private flameTime: number = 0;
  public isModern: boolean = false;
  private modernGlowTime: number = 0;
  public isDeparting: boolean = false;
  private departureElapsed: number = 0;
  public static readonly DEPARTURE_DURATION = 2.0;

  public startDeparture(): void {
    this.isDeparting = true;
    this.departureElapsed = 0;
  }

  // Materials
  private bambooMat: THREE.MeshStandardMaterial;
  private paperRedMat: THREE.MeshPhysicalMaterial;
  private paperYellowMat: THREE.MeshPhysicalMaterial;
  private twineMat: THREE.MeshStandardMaterial;
  private candleWaxMat: THREE.MeshStandardMaterial;
  private flameMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.bambooSkeletonGroup = new THREE.Group();
    this.paperSkinGroup = new THREE.Group();
    this.bindingsGroup = new THREE.Group();
    this.candleGroup = new THREE.Group();
    this.handShieldGroup = new THREE.Group();

    this.group.add(this.bambooSkeletonGroup);
    this.group.add(this.paperSkinGroup);
    this.group.add(this.bindingsGroup);
    this.group.add(this.candleGroup);
    this.group.add(this.handShieldGroup);

    // Initial state: hide all components until assembled
    this.bambooSkeletonGroup.visible = false;
    this.paperSkinGroup.visible = false;
    this.bindingsGroup.visible = false;
    this.candleGroup.visible = false;

    // Materials
    this.bambooMat = new THREE.MeshStandardMaterial({
      color: 0xc89b53,
      roughness: 0.7,
      metalness: 0.05
    });

    // Translucent red-orange cellophane with subtle sheen and translucent depth
    this.paperRedMat = new THREE.MeshPhysicalMaterial({
      color: 0xee3a12, // Red-orange
      emissive: 0x330800,
      roughness: 0.15,
      transmission: 0.65,
      thickness: 0.1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // Center pentagon: warm translucent amber yellow
    this.paperYellowMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, // Golden amber yellow
      emissive: 0x442800,
      roughness: 0.15,
      transmission: 0.65,
      thickness: 0.1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    this.twineMat = new THREE.MeshStandardMaterial({
      color: 0xd4a762,
      roughness: 0.8
    });

    this.candleWaxMat = new THREE.MeshStandardMaterial({
      color: 0xdd2222,
      roughness: 0.4
    });

    // Animated teardrop flame texture
    const flameTex = TextureGenerator.createFlameTexture();
    this.flameMat = new THREE.MeshBasicMaterial({
      map: flameTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Create 3D geometry
    this.buildBambooSkeleton();
    this.buildPaperSkin();
    this.buildBindings();
    this.buildCandle();

    // Warm amber Point Light inside lantern (#f59e0b)
    this.candleLight = new THREE.PointLight(0xf59e0b, 0, 14, 1.8);
    this.candleLight.castShadow = true;
    this.candleLight.shadow.mapSize.width = 1024;
    this.candleLight.shadow.mapSize.height = 1024;
    this.candleLight.shadow.bias = -0.002;
    this.candleLight.position.set(0, 0, 0);
    this.candleGroup.add(this.candleLight);

    // Crossed teardrop flame billboard for 3D fullness
    this.flameMesh = new THREE.Group();
    const flameGeo = new THREE.PlaneGeometry(0.12, 0.22);
    flameGeo.translate(0, 0.11, 0);

    const flamePlane1 = new THREE.Mesh(flameGeo, this.flameMat);
    const flamePlane2 = new THREE.Mesh(flameGeo, this.flameMat);
    flamePlane2.rotation.y = Math.PI / 2;

    this.flameMesh.add(flamePlane1, flamePlane2);
    this.flameMesh.position.set(0, 0.0, 0);
    this.flameMesh.visible = false;
    this.candleGroup.add(this.flameMesh);
  }

  // Calculate 5 star vertices with top apex pointing up
  private getStarPoints(outerRadius: number, innerRadius: number): THREE.Vector2[] {
    const points: THREE.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      // i = 0 is apex point (angle = PI/2)
      const angle = (i * Math.PI) / 5 + Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
    }
    return points;
  }

  private buildBambooSkeleton() {
    const outerR = 0.85;
    const innerR = 0.38;
    const zOffset = 0.08;
    const rodRadius = 0.012;

    const points = this.getStarPoints(outerR, innerR);

    // Build front & back star frames
    [-zOffset, zOffset].forEach((z) => {
      for (let i = 0; i < 10; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 10];

        const start = new THREE.Vector3(p1.x, p1.y, z);
        const end = new THREE.Vector3(p2.x, p2.y, z);
        const rod = this.createCylinderBetweenPoints(start, end, rodRadius, this.bambooMat);
        this.bambooSkeletonGroup.add(rod);
      }
    });

    // Connecting spokes between front & back stars at vertices
    for (let i = 0; i < 10; i++) {
      const p = points[i];
      const start = new THREE.Vector3(p.x, p.y, -zOffset);
      const end = new THREE.Vector3(p.x, p.y, zOffset);
      const rod = this.createCylinderBetweenPoints(start, end, rodRadius * 0.9, this.bambooMat);
      this.bambooSkeletonGroup.add(rod);
    }

    // Circular bamboo hoop in the center keeping star puffed out
    const hoopGeo = new THREE.TorusGeometry(innerR * 1.15, rodRadius * 0.9, 8, 32);
    const hoop1 = new THREE.Mesh(hoopGeo, this.bambooMat);
    hoop1.position.z = -zOffset * 0.7;
    const hoop2 = new THREE.Mesh(hoopGeo, this.bambooMat);
    hoop2.position.z = zOffset * 0.7;
    this.bambooSkeletonGroup.add(hoop1, hoop2);
  }

  private buildPaperSkin() {
    const outerR = 0.85;
    const innerR = 0.38;
    const zOffset = 0.08;
    const points = this.getStarPoints(outerR, innerR);

    // 5 triangular wings: Red Cellophane
    for (let i = 0; i < 5; i++) {
      const tipIdx = i * 2;
      const leftIdx = (tipIdx + 9) % 10;
      const rightIdx = (tipIdx + 1) % 10;

      const pTip = points[tipIdx];
      const pLeft = points[leftIdx];
      const pRight = points[rightIdx];

      [-zOffset, zOffset].forEach((z) => {
        const geom = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          pLeft.x, pLeft.y, z,
          pTip.x, pTip.y, z,
          pRight.x, pRight.y, z
        ]);
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();

        const mesh = new THREE.Mesh(geom, this.paperRedMat);
        this.paperSkinGroup.add(mesh);
      });
    }

    // Center pentagon: Yellow Cellophane
    [-zOffset, zOffset].forEach((z) => {
      const shape = new THREE.Shape();
      for (let i = 0; i < 5; i++) {
        const innerPoint = points[i * 2 + 1];
        if (i === 0) shape.moveTo(innerPoint.x, innerPoint.y);
        else shape.lineTo(innerPoint.x, innerPoint.y);
      }
      shape.closePath();
      const geom = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geom, this.paperYellowMat);
      mesh.position.z = z;
      this.paperSkinGroup.add(mesh);
    });
  }

  private buildBindings() {
    // Bamboo handle stick
    const stickGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.25, 12);
    const stick = new THREE.Mesh(stickGeo, this.bambooMat);
    stick.position.set(0, -0.9, 0);
    this.bindingsGroup.add(stick);

    // Decorative twine wrapping at the junction
    const twineGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.12, 12);
    const twine = new THREE.Mesh(twineGeo, this.twineMat);
    twine.position.set(0, -0.38, 0);
    this.bindingsGroup.add(twine);
  }

  private buildCandle() {
    // Red traditional wax candle inside the star
    const waxGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16);
    const wax = new THREE.Mesh(waxGeo, this.candleWaxMat);
    wax.position.set(0, -0.14, 0);
    this.candleGroup.add(wax);

    // Wick
    const wickGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0, -0.02, 0);
    this.candleGroup.add(wick);

    // Cupped hand mesh shielding the candle
    const handTex = TextureGenerator.createHandShieldTexture();
    const handGeo = new THREE.PlaneGeometry(0.48, 0.48);
    const handMat = new THREE.MeshBasicMaterial({
      map: handTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.handShieldMesh = new THREE.Mesh(handGeo, handMat);
    this.handShieldMesh.position.set(0.08, 0.06, 0.12);
    this.handShieldMesh.rotation.y = 0.18;
    this.handShieldMesh.visible = false;
    this.handShieldGroup.add(this.handShieldMesh);
  }

  private createCylinderBetweenPoints(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    material: THREE.Material
  ): THREE.Mesh {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const geom = new THREE.CylinderGeometry(radius, radius, length, 8);
    geom.translate(0, length / 2, 0);
    geom.rotateX(Math.PI / 2);

    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(start);
    mesh.lookAt(end);
    return mesh;
  }

  public setStep(step: number) {
    // Step 0: Empty
    // Step 1: Bamboo skeleton
    // Step 2: Paper skin
    // Step 3: Handle & bindings
    // Step 4: Candle & lit
    this.bambooSkeletonGroup.visible = step >= 1;
    this.paperSkinGroup.visible = step >= 2;
    this.bindingsGroup.visible = step >= 3;
    this.candleGroup.visible = step >= 4;

    if (step >= 4) {
      this.ignite();
    }
  }

  public setShielded(shielded: boolean) {
    this.isShielded = shielded;
  }

  public getIsShielded(): boolean {
    return this.isShielded;
  }

  public ignite() {
    this.isLit = true;
    this.flameMesh.visible = true;
    this.candleLight.intensity = 3.6;
    
    // Boost paper translucency and warm golden bloom (#f59e0b)
    this.paperRedMat.emissive.setHex(0xff3d00);
    this.paperRedMat.emissiveIntensity = 1.1;
    this.paperYellowMat.emissive.setHex(0xf59e0b);
    this.paperYellowMat.emissiveIntensity = 1.6;
  }

  public extinguish(): void {
    if (this.isModern || !this.isLit) return;
    this.isLit = false;
    this.flameMesh.visible = false;
    this.candleLight.intensity = 0.03;
    this.paperRedMat.emissiveIntensity = 0.04;
    this.paperYellowMat.emissiveIntensity = 0.05;
  }

  public setModernized(modern: boolean) {
    this.isModern = modern;
    if (modern) {
      this.isLit = true;
      this.flameMesh.visible = false; // Candle flame replaced by internal warm LED electric core
      this.candleLight.intensity = 3.8;
      this.candleLight.color.setHex(0xffb833);
      this.candleLight.distance = 12;

      // Refined metallic golden brass bamboo skeleton
      this.bambooMat.color.setHex(0xeab308);
      this.bambooMat.roughness = 0.22;
      this.bambooMat.metalness = 0.42;

      // Modern translucent acrylic/lucite star wings with luminous electric glow
      this.paperRedMat.color.setHex(0xf43f5e); // vibrant coral crimson
      this.paperRedMat.emissive.setHex(0xe11d48);
      this.paperRedMat.emissiveIntensity = 1.35;
      this.paperRedMat.roughness = 0.08;
      this.paperRedMat.transmission = 0.78;

      this.paperYellowMat.color.setHex(0xfbbf24); // radiant warm gold
      this.paperYellowMat.emissive.setHex(0xf59e0b);
      this.paperYellowMat.emissiveIntensity = 1.65;
      this.paperYellowMat.roughness = 0.08;
      this.paperYellowMat.transmission = 0.78;
    }
  }

  public setElectricLit(lit: boolean): void {
    if (!this.isModern) return;
    this.isLit = lit;
    this.flameMesh.visible = false;
    this.candleLight.intensity = lit ? 3.8 : 0.12;
    this.paperRedMat.emissiveIntensity = lit ? 1.35 : 0.15;
    this.paperYellowMat.emissiveIntensity = lit ? 1.65 : 0.2;
  }

  public update(delta: number, windFactor: number = 0) {
    if (this.isDeparting) {
      this.departureElapsed += delta;
      const progress = Math.min(1.0, this.departureElapsed / StarLantern.DEPARTURE_DURATION);

      // Upward drift (delta y = +2.5m)
      this.group.position.y += Math.pow(progress, 1.5) * delta * 2.2;

      // Opacity and light decay
      const alpha = Math.max(0.0, 1.0 - progress);
      const lightFactor = alpha * alpha;

      this.candleLight.intensity = (2.8 * lightFactor);
      this.paperRedMat.opacity = 0.85 * alpha;
      this.paperYellowMat.opacity = 0.85 * alpha;
      this.bambooMat.opacity = alpha;
      this.bambooMat.transparent = true;
      (this.flameMat as THREE.MeshBasicMaterial).opacity = alpha;

      if (progress >= 1.0) {
        this.group.visible = false;
      }
      return;
    }

    if (!this.isLit) return;

    if (this.isModern) {
      this.modernGlowTime += delta * 2.2;
      const breathingPulse = Math.sin(this.modernGlowTime) * 0.12;
      this.candleLight.intensity = 3.8 + breathingPulse;
      return;
    }

    this.flameTime += delta * 8;

    // Smooth transition of hand shielding
    const targetOpacity = this.isShielded ? 0.95 : 0.0;
    this.shieldOpacity += (targetOpacity - this.shieldOpacity) * Math.min(1, delta * 12.0);
    if (this.handShieldMesh) {
      (this.handShieldMesh.material as THREE.MeshBasicMaterial).opacity = this.shieldOpacity;
      this.handShieldMesh.visible = this.shieldOpacity > 0.01;
    }

    // If shielded, hand dampens the wind effectively to near zero
    const effectiveWind = this.isShielded ? windFactor * 0.06 : windFactor;
    const clampedWind = Math.min(1.4, Math.max(0, effectiveWind));

    const flicker = Math.sin(this.flameTime * 1.8) * 0.18 + Math.cos(this.flameTime * 4.2) * 0.12;
    const windGlow = Math.max(0.12, 1 - clampedWind * 0.72);
    this.candleLight.intensity = (2.8 + flicker * 0.7) * Math.max(0.2, 1 - clampedWind * 0.62);
    this.paperRedMat.emissiveIntensity = 1.1 * windGlow;
    this.paperYellowMat.emissiveIntensity = 1.6 * windGlow;
    this.candleLight.position.x = Math.sin(this.flameTime * 2.2) * 0.012 - clampedWind * 0.03;
    this.candleLight.position.y = Math.cos(this.flameTime * 2.8) * 0.01 - clampedWind * 0.02;

    // Flame mesh flutter & realistic wind bending backwards
    this.flameMesh.scale.set(
      (1 + flicker * 0.25) * (1 + clampedWind * 0.25),
      (1 + Math.sin(this.flameTime * 3.5) * 0.18) * (1 - clampedWind * 0.42),
      (1 + flicker * 0.25)
    );
    this.flameMesh.rotation.z = Math.sin(this.flameTime * 2.0) * 0.05 - clampedWind * 0.62;
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
