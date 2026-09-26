import * as THREE from 'three';
import { ModernBatteryBox } from './ModernBatteryBox';

/**
 * ModernStarLantern
 * 
 * Represents the boyfriend's modernized star lantern:
 * - Champagne gold brass frame (roughness 0.22, metalness 0.78)
 * - Lucite optical acrylic wings (faceted crystal transmission 0.82, ruby crimson & radiant amber)
 * - Dedicated 3D ABS battery box subassembly with mechanical toggle switch bat lever
 * - Center hexagonal SMD LED core with warm-white PointLight (#fff4e0)
 * - Zero avatar representation: strictly represents Guest player in Phase 5
 * - Kinematics: smooth lighting surge on toggle, departure celestial fade-out
 */
export class ModernStarLantern {
  public readonly group: THREE.Group;
  public readonly batteryBox: ModernBatteryBox;
  public readonly lanternLight: THREE.PointLight;
  private readonly ledCoreLight: THREE.PointLight;

  public isModern: boolean = true;
  public isLit: boolean = false;

  // Convenient alias for code expecting candleLight (polymorphic compatibility with StarLantern)
  public get candleLight(): THREE.PointLight {
    return this.lanternLight;
  }

  // LED & Lighting dynamics
  private lightIntensity: number = 0.0;
  private targetIntensity: number = 0.0;
  private surgeIntensity: number = 0.0;
  private internalTime: number = 0;

  // Materials
  private brassFrameMat: THREE.MeshStandardMaterial;
  private acrylicRedMat: THREE.MeshPhysicalMaterial;
  private acrylicYellowMat: THREE.MeshPhysicalMaterial;
  private smdBoardMat: THREE.MeshStandardMaterial;
  private smdDieMat: THREE.MeshStandardMaterial;
  private handleRodMat: THREE.MeshStandardMaterial;

  // Departure state machine (graceful disconnect)
  public isDeparting: boolean = false;
  private departureElapsed: number = 0;
  public static readonly DEPARTURE_DURATION = 2.0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Materials
    this.brassFrameMat = new THREE.MeshStandardMaterial({
      color: 0xc82020, // Lacquered vermilion crimson red frame
      emissive: 0x3d0505, // Subtle ruby rim tone
      emissiveIntensity: 0.20,
      roughness: 0.32,
      metalness: 0.45
    });

    this.acrylicRedMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, // Radiant warm amber optical acrylic
      emissive: 0xd97706, // Bright golden amber
      emissiveIntensity: 0.25,
      roughness: 0.08,
      transmission: 0.80,
      thickness: 0.18,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });

    this.acrylicYellowMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316, // Deep honey amber-orange center
      emissive: 0xea580c, // Bright warm orange
      emissiveIntensity: 0.30,
      roughness: 0.08,
      transmission: 0.80,
      thickness: 0.18,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });

    this.smdBoardMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Dark green FR4 PCB substrate with gold traces
      roughness: 0.4,
      metalness: 0.4
    });

    this.smdDieMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfed7aa, // Soft warm-white LED phosphor
      emissiveIntensity: 0.0,
      roughness: 0.2
    });

    this.handleRodMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Rich deep vermilion handle rod
      roughness: 0.35,
      metalness: 0.55
    });

    // 2. Build 3D structure
    this.buildStarStructure();
    this.buildHandleAssembly();
    this.buildHexagonalSmdCore();

    // 3. Subassembly: Battery Box
    this.batteryBox = new ModernBatteryBox();
    this.batteryBox.group.position.set(0, -0.68, 0);
    this.group.add(this.batteryBox.group);

    // 4. Primary Clean Warm-White PointLight (#ffedd5, gentle 3500K)
    this.lanternLight = new THREE.PointLight(0xffedd5, 0.0, 14.0, 1.8);
    this.lanternLight.castShadow = true;
    this.lanternLight.shadow.bias = -0.002;
    this.lanternLight.position.set(0, 0.04, 0);
    this.group.add(this.lanternLight);

    // High intensity core bulb light
    this.ledCoreLight = new THREE.PointLight(0xffedd5, 0.0, 3.5, 2.0);
    this.ledCoreLight.position.set(0, 0.04, 0);
    this.group.add(this.ledCoreLight);
  }

  private getStarPoints(outerRadius: number, innerRadius: number): THREE.Vector2[] {
    const points: THREE.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 + Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
    }
    return points;
  }

  private buildStarStructure(): void {
    const outerR = 0.85;
    const innerR = 0.38;
    const zOffset = 0.08;
    const rodRadius = 0.010;
    const points = this.getStarPoints(outerR, innerR);

    // Champagne gold brass skeleton frames (front & back)
    [-zOffset, zOffset].forEach((zVal) => {
      for (let i = 0; i < 10; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 10];
        const start = new THREE.Vector3(p1.x, p1.y, zVal);
        const end = new THREE.Vector3(p2.x, p2.y, zVal);
        const rod = this.createRodBetweenPoints(start, end, rodRadius, this.brassFrameMat);
        this.group.add(rod);
      }
    });

    // Connecting brass cross-struts at star tips and inner vertices
    for (let i = 0; i < 10; i++) {
      const p = points[i];
      const start = new THREE.Vector3(p.x, p.y, -zOffset);
      const end = new THREE.Vector3(p.x, p.y, zOffset);
      const strut = this.createRodBetweenPoints(start, end, rodRadius * 0.85, this.brassFrameMat);
      this.group.add(strut);
    }

    // Outer circular brass stabilization hoop
    const hoopGeo = new THREE.TorusGeometry(outerR * 0.72, rodRadius * 0.95, 8, 36);
    const hoop = new THREE.Mesh(hoopGeo, this.brassFrameMat);
    this.group.add(hoop);

    // 5 Lucite optical acrylic wings (faceted crystal geometry)
    for (let i = 0; i < 5; i++) {
      const tipIdx = i * 2;
      const leftIdx = (tipIdx + 9) % 10;
      const rightIdx = (tipIdx + 1) % 10;

      const pTip = points[tipIdx];
      const pLeft = points[leftIdx];
      const pRight = points[rightIdx];

      [-zOffset, zOffset].forEach((zVal) => {
        const geom = new THREE.BufferGeometry();
        const verts = new Float32Array([
          pTip.x, pTip.y, zVal * 0.2,
          pLeft.x, pLeft.y, zVal,
          pRight.x, pRight.y, zVal
        ]);
        geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geom.computeVertexNormals();

        const wing = new THREE.Mesh(geom, this.acrylicRedMat);
        this.group.add(wing);
      });
    }

    // Center pentagon: Radiant amber optical acrylic
    const pentagonShape = new THREE.Shape();
    for (let i = 0; i < 5; i++) {
      const innerP = points[i * 2 + 1];
      if (i === 0) pentagonShape.moveTo(innerP.x, innerP.y);
      else pentagonShape.lineTo(innerP.x, innerP.y);
    }
    pentagonShape.closePath();

    [-zOffset, zOffset].forEach((zVal) => {
      const pentGeo = new THREE.ShapeGeometry(pentagonShape);
      const pentMesh = new THREE.Mesh(pentGeo, this.acrylicYellowMat);
      pentMesh.position.z = zVal;
      this.group.add(pentMesh);
    });
  }

  private buildHandleAssembly(): void {
    // Modern champagne brass handle rod (1.10m length)
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.10, 12);
    const rod = new THREE.Mesh(rodGeo, this.handleRodMat);
    rod.position.set(0, -0.75, 0);
    this.group.add(rod);

    // Metallic clamp collar at star hub junction
    const clampGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12);
    const clamp = new THREE.Mesh(clampGeo, this.brassFrameMat);
    clamp.position.set(0, -0.36, 0);
    this.group.add(clamp);
  }

  private buildHexagonalSmdCore(): void {
    // Hexagonal SMD carrier PCB: CylinderGeometry(0.028, 0.028, 0.006, 6)
    const pcbGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.006, 6);
    pcbGeo.rotateX(Math.PI / 2);
    const pcbMesh = new THREE.Mesh(pcbGeo, this.smdBoardMat);
    pcbMesh.position.set(0, 0.04, 0);
    this.group.add(pcbMesh);

    // High-power SMD LED phosphor die package (0.016 x 0.008 x 0.016m)
    const dieGeo = new THREE.BoxGeometry(0.016, 0.008, 0.016);
    const dieMesh = new THREE.Mesh(dieGeo, this.smdDieMat);
    dieMesh.position.set(0, 0.04, 0.005);
    this.group.add(dieMesh);
  }

  private createRodBetweenPoints(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    mat: THREE.Material
  ): THREE.Mesh {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
    geo.translate(0, len / 2, 0);
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    mesh.lookAt(end);
    return mesh;
  }

  /**
   * Turns the LED electric core ON or OFF
   * When turned ON, generates an initial burst surge (8.5 intensity) settling to 4.2
   */
  public setLit(lit: boolean, immediate: boolean = false): void {
    this.isLit = lit;
    this.batteryBox.setSwitchState(lit, immediate);
    this.targetIntensity = lit ? 2.2 : 0.0;
    this.surgeIntensity = lit && !immediate ? 0.9 : 0.0; // Gentle surge on flip without bloom washout

    if (immediate) {
      this.lightIntensity = this.targetIntensity;
      this.applyLighting(this.lightIntensity);
    }
  }

  public toggleSwitch(): boolean {
    this.setLit(!this.isLit);
    return this.isLit;
  }

  private applyLighting(val: number): void {
    this.lanternLight.intensity = val * 1.1;
    this.ledCoreLight.intensity = Math.min(val * 1.0, 2.2);
    this.smdDieMat.emissiveIntensity = Math.min(val * 0.45, 1.1);
    this.acrylicRedMat.emissiveIntensity = 0.25 + val * 0.18;
    this.acrylicYellowMat.emissiveIntensity = 0.30 + val * 0.20;
  }

  /**
   * Triggers the graceful remote departure sequence (2.0s upward drift & opacity fade)
   */
  public startDeparture(): void {
    this.isDeparting = true;
    this.departureElapsed = 0;
  }

  public update(delta: number, swayAmount: number = 0.04): void {
    this.internalTime += delta;
    this.batteryBox.update(delta);

    // 1. Graceful Remote Departure Animation (2.0s celestial ascent & fade)
    if (this.isDeparting) {
      this.departureElapsed += delta;
      const progress = Math.min(1.0, this.departureElapsed / ModernStarLantern.DEPARTURE_DURATION);

      // Upward drift (delta y = +2.5m with smooth acceleration)
      this.group.position.y += Math.pow(progress, 1.5) * delta * 2.2;

      // Opacity and light decay
      const alpha = Math.max(0.0, 1.0 - progress);
      const lightFactor = alpha * alpha;

      this.lanternLight.intensity = this.lightIntensity * lightFactor;
      this.ledCoreLight.intensity = this.lightIntensity * lightFactor;
      this.acrylicRedMat.opacity = 0.90 * alpha;
      this.acrylicYellowMat.opacity = 0.90 * alpha;
      this.brassFrameMat.opacity = alpha;
      this.brassFrameMat.transparent = true;

      if (progress >= 1.0) {
        this.group.visible = false;
      }
      return;
    }

    // 2. Surge decay
    if (this.surgeIntensity > 0) {
      this.surgeIntensity = Math.max(0.0, this.surgeIntensity - delta * 12.0);
    }

    // 3. Smooth lighting transition
    if (Math.abs(this.targetIntensity - this.lightIntensity) > 0.01) {
      this.lightIntensity += (this.targetIntensity - this.lightIntensity) * Math.min(1.0, delta * 14.0);
    }
    const currentTotalIntensity = this.lightIntensity + this.surgeIntensity;
    this.applyLighting(currentTotalIntensity);

    // 4. Subtle micro-electronic high-frequency pulse
    if (this.isLit) {
      const microPulse = Math.sin(this.internalTime * 20.0) * 0.03;
      this.lanternLight.intensity = Math.max(0, currentTotalIntensity + microPulse);
    }

    // 5. Physical gentle sway
    this.group.rotation.z = Math.sin(this.internalTime * 2.2) * swayAmount;
    this.group.rotation.x = Math.cos(this.internalTime * 1.6) * (swayAmount * 0.45);
  }

  public dispose(): void {
    this.batteryBox.dispose();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
