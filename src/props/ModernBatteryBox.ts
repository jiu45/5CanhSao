import * as THREE from 'three';

/**
 * ModernBatteryBox
 * 
 * High-fidelity 3D subassembly representing the boyfriend's lantern battery box:
 * - Injection-molded matte ABS polymer housing (BoxGeometry 0.09 x 0.14 x 0.06m)
 * - 4 miniature stainless steel corner screws with Phillips drive recesses
 * - Nickel-plated switch collar and knurled hex mounting nut
 * - Mechanical toggle switch bat lever (CylinderGeometry 0.003 x 0.004 x 0.025m)
 *   with exact physical OFF (-35° = -0.6108 rad) and ON (+35° = +0.6108 rad) tilt
 * - Top rubber strain-relief grommet and twin insulated flexible wiring
 *   (red positive and dark slate ground) leading into the star lantern hub
 */
export class ModernBatteryBox {
  public readonly group: THREE.Group;

  // Mechanical switch state
  private switchBatPivot: THREE.Group;
  private switchBatMesh!: THREE.Mesh;
  private switchTipCap!: THREE.Mesh;
  public static readonly ANGLE_OFF = -0.610865; // -35 degrees
  public static readonly ANGLE_ON  = +0.610865; // +35 degrees
  private currentAngle: number = ModernBatteryBox.ANGLE_OFF;
  private targetAngle: number = ModernBatteryBox.ANGLE_OFF;
  public isSwitchedOn: boolean = false;

  // Materials
  private absCaseMat: THREE.MeshStandardMaterial;
  private absLidMat: THREE.MeshStandardMaterial;
  private screwMat: THREE.MeshStandardMaterial;
  private screwSlotMat: THREE.MeshBasicMaterial;
  private chromeMat: THREE.MeshStandardMaterial;
  private rubberMat: THREE.MeshStandardMaterial;
  private wireRedMat: THREE.MeshStandardMaterial;
  private wireBlackMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    // 1. Materials
    this.absCaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark slate ABS polymer
      roughness: 0.55,
      metalness: 0.12
    });

    this.absLidMat = new THREE.MeshStandardMaterial({
      color: 0x18202f, // Slightly darker lid tone with molded seam
      roughness: 0.50,
      metalness: 0.15
    });

    this.screwMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Stainless steel / dark chrome
      metalness: 0.88,
      roughness: 0.22
    });

    this.screwSlotMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Polished chrome / nickel plating
      metalness: 0.95,
      roughness: 0.15
    });

    this.rubberMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Matte black neoprene rubber
      roughness: 0.92,
      metalness: 0.02
    });

    this.wireRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Insulated positive red wire
      roughness: 0.45,
      metalness: 0.08
    });

    this.wireBlackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Insulated ground black wire
      roughness: 0.45,
      metalness: 0.08
    });

    // 2. Build subassemblies
    this.buildHousing();
    this.buildMiniatureScrews();
    this.switchBatPivot = this.buildToggleSwitch();
    this.buildTopGrommetAndWiring();
  }

  private buildHousing(): void {
    // Main ABS box enclosure (0.09w x 0.14h x 0.05d)
    const bodyGeo = new THREE.BoxGeometry(0.09, 0.14, 0.05);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.absCaseMat);
    bodyMesh.position.set(0, 0, -0.005);
    this.group.add(bodyMesh);

    // Front access lid faceplate (0.09w x 0.14h x 0.01d) forming total depth of 0.06m
    const lidGeo = new THREE.BoxGeometry(0.088, 0.138, 0.01);
    const lidMesh = new THREE.Mesh(lidGeo, this.absLidMat);
    lidMesh.position.set(0, 0, 0.025);
    this.group.add(lidMesh);

    // Recessed faceplate brand inset
    const insetGeo = new THREE.BoxGeometry(0.05, 0.02, 0.001);
    const insetMesh = new THREE.Mesh(insetGeo, this.absCaseMat);
    insetMesh.position.set(0, 0.038, 0.0305);
    this.group.add(insetMesh);
  }

  private buildMiniatureScrews(): void {
    // 4 corner miniature screws with cross recesses
    const screwGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.001, 8);
    screwGeo.rotateX(Math.PI / 2);

    const slotGeo = new THREE.BoxGeometry(0.0035, 0.0008, 0.0012);

    const cornerOffsets = [
      { x: -0.035, y: +0.056 },
      { x: +0.035, y: +0.056 },
      { x: -0.035, y: -0.056 },
      { x: +0.035, y: -0.056 }
    ];

    cornerOffsets.forEach(({ x, y }) => {
      const screwGroup = new THREE.Group();
      screwGroup.position.set(x, y, 0.0305);

      const screwMesh = new THREE.Mesh(screwGeo, this.screwMat);
      const slot1 = new THREE.Mesh(slotGeo, this.screwSlotMat);
      const slot2 = new THREE.Mesh(slotGeo, this.screwSlotMat);
      slot2.rotation.z = Math.PI / 2;

      screwGroup.add(screwMesh, slot1, slot2);
      this.group.add(screwGroup);
    });
  }

  private buildToggleSwitch(): THREE.Group {
    const switchBaseGroup = new THREE.Group();
    switchBaseGroup.position.set(0, -0.01, 0.030);

    // Threaded nickel mounting boss
    const collarGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.006, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, this.chromeMat);
    collar.position.set(0, 0, 0.003);
    switchBaseGroup.add(collar);

    // Hexagonal lock nut
    const nutGeo = new THREE.CylinderGeometry(0.0095, 0.0095, 0.0025, 6);
    nutGeo.rotateX(Math.PI / 2);
    const nut = new THREE.Mesh(nutGeo, this.chromeMat);
    nut.position.set(0, 0, 0.0012);
    switchBaseGroup.add(nut);

    // Tilting pivot group for the bat lever
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0.006);

    // Cylindrical toggle switch bat lever: CylinderGeometry(0.003, 0.004, 0.025)
    // Offset along length so base is at pivot
    const batGeo = new THREE.CylinderGeometry(0.003, 0.004, 0.025, 12);
    batGeo.translate(0, 0.0125, 0);
    batGeo.rotateX(Math.PI / 2); // Extends outward along +Z
    this.switchBatMesh = new THREE.Mesh(batGeo, this.chromeMat);
    pivot.add(this.switchBatMesh);

    // Rounded tip cap
    const capGeo = new THREE.SphereGeometry(0.0038, 12, 10);
    this.switchTipCap = new THREE.Mesh(capGeo, this.chromeMat);
    this.switchTipCap.position.set(0, 0, 0.025);
    pivot.add(this.switchTipCap);

    pivot.rotation.x = this.currentAngle;
    switchBaseGroup.add(pivot);
    this.group.add(switchBaseGroup);

    return pivot;
  }

  private buildTopGrommetAndWiring(): void {
    // Top strain relief rubber grommet at y = +0.07m
    const grommetGeo = new THREE.CylinderGeometry(0.0065, 0.008, 0.006, 12);
    const grommet = new THREE.Mesh(grommetGeo, this.rubberMat);
    grommet.position.set(0, 0.073, 0);
    this.group.add(grommet);

    // Twin insulated flexible wires (Red = Positive, Black = Negative)
    // Running from top grommet up along the handle rod towards the star lantern hub
    const p0Red = new THREE.Vector3(-0.003, 0.075, 0.001);
    const p1Red = new THREE.Vector3(-0.005, 0.14, 0.008);
    const p2Red = new THREE.Vector3(-0.002, 0.22, 0.004);
    const p3Red = new THREE.Vector3(0.0, 0.32, 0.0);
    const curveRed = new THREE.CatmullRomCurve3([p0Red, p1Red, p2Red, p3Red]);
    const wireRedGeo = new THREE.TubeGeometry(curveRed, 16, 0.0018, 8, false);
    const wireRed = new THREE.Mesh(wireRedGeo, this.wireRedMat);
    this.group.add(wireRed);

    const p0Black = new THREE.Vector3(+0.003, 0.075, -0.001);
    const p1Black = new THREE.Vector3(+0.005, 0.14, -0.008);
    const p2Black = new THREE.Vector3(+0.002, 0.22, -0.004);
    const p3Black = new THREE.Vector3(0.0, 0.32, 0.0);
    const curveBlack = new THREE.CatmullRomCurve3([p0Black, p1Black, p2Black, p3Black]);
    const wireBlackGeo = new THREE.TubeGeometry(curveBlack, 16, 0.0018, 8, false);
    const wireBlack = new THREE.Mesh(wireBlackGeo, this.wireBlackMat);
    this.group.add(wireBlack);
  }

  public setSwitchState(on: boolean, immediate: boolean = false): void {
    this.isSwitchedOn = on;
    this.targetAngle = on ? ModernBatteryBox.ANGLE_ON : ModernBatteryBox.ANGLE_OFF;

    if (immediate) {
      this.currentAngle = this.targetAngle;
      this.switchBatPivot.rotation.x = this.currentAngle;
    }
  }

  public toggle(): boolean {
    this.setSwitchState(!this.isSwitchedOn);
    return this.isSwitchedOn;
  }

  public update(delta: number): void {
    // Fast mechanical snap interpolation (snappy toggle feel)
    if (Math.abs(this.targetAngle - this.currentAngle) > 0.005) {
      this.currentAngle += (this.targetAngle - this.currentAngle) * Math.min(1.0, delta * 28.0);
      this.switchBatPivot.rotation.x = this.currentAngle;
    }
  }

  public dispose(): void {
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
