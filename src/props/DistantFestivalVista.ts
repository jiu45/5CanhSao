import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';
import { PapercraftFoliageKit } from './papercraft/PapercraftFoliageKit';
import { MarketStallKit } from './papercraft/MarketStallKit';
import { PresentCrowdKit } from './papercraft/PresentCrowdKit';
import { PresentFestivalLifeKit } from './papercraft/PresentFestivalLifeKit';
import { disposeSceneResources } from '../utils/disposeSceneResources';

/**
 * DistantFestivalVista — Modern Vietnamese Mid-Autumn Festival Plaza Reveal (Phase 4B)
 *
 * Implements Centerpiece Overhaul:
 * 1. Giant Revolving Shadow Lantern Tower (Tháp Đèn Kéo Quân Khổng Lồ, 17.5m, octagonal, rotating shadow drum)
 * 2. Slender welcoming Festival Gate with cloud crests & "LỄ HỘI TRĂNG RẰM" banner framing the tower
 * 3. Decorated roadside trees: dangling mini lanterns & overhead fairy lights connecting treetops
 * 4. Soft S-curving approach path with vibrant glowing flowerbeds & LED bollards
 *
 * Strict scope isolation (RULE[AGENTS.md]) — all assets encapsulated inside this.group.
 */
export class DistantFestivalVista {
  public group: THREE.Group;

  // Key animated visual actors
  private revolvingDrum!: THREE.Mesh;
  private canopyLanterns: THREE.Mesh[] = [];
  private danglingTreeLanterns: THREE.Mesh[] = [];
  private readonly foliageKit = new PapercraftFoliageKit();
  private readonly marketKit = new MarketStallKit();
  private readonly crowdKit = new PresentCrowdKit();
  private readonly festivalLife = new PresentFestivalLifeKit();
  private visitorMeshes: THREE.Object3D[] = [];
  private skylineMesh?: THREE.Mesh;
  private plazaFloorMaterial?: THREE.MeshStandardMaterial;
  private festivalWashLight!: THREE.PointLight;
  private gateSpotLight!: THREE.PointLight;
  private towerCoreLight!: THREE.PointLight;
  private phase5Darkness = 0;
  private phase5TowerFocus = 0;
  private wasPhase5Darkened = false;
  private wasPhase5MaterialAdjusted = false;
  private readonly baseLightIntensity = new Map<THREE.Light, number>();
  private readonly baseEmissiveIntensity = new Map<THREE.MeshStandardMaterial, number>();
  private readonly baseAdditiveOpacity = new Map<THREE.MeshBasicMaterial, number>();

  // Camera sightline rotation angle (facing camera along approach corridor)
  private readonly vistaRotationY = -Math.PI * 0.5 + 0.289;

  constructor() {
    this.group = new THREE.Group();
    this.buildVista();
    this.group.traverse(child => {
      if (child instanceof THREE.Light) this.baseLightIntensity.set(child, child.intensity);
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial) {
            this.baseEmissiveIntensity.set(material, material.emissiveIntensity);
          } else if (material instanceof THREE.MeshBasicMaterial && material.blending === THREE.AdditiveBlending) {
            this.baseAdditiveOpacity.set(material, material.opacity);
          }
        }
      }
    });
  }

  /** Phase 5 instance only: quiet the distant festival while the lanterns lead. */
  public setPhase5Darkness(amount: number): void {
    this.phase5Darkness = THREE.MathUtils.clamp(amount, 0, 1);
    this.festivalLife.setQuiet(this.phase5Darkness);
  }

  public setPhase5TowerFocus(amount: number): void {
    this.phase5TowerFocus = THREE.MathUtils.clamp(amount, 0, 1);
  }

  public clearPhase5LanternRoute(): void {
    // Phase 4 silhouettes occupy the exact rail used by the two lanterns.
    this.visitorMeshes.forEach(mesh => { mesh.visible = false; });
  }

  public setSkylineVisible(visible: boolean): void {
    if (this.skylineMesh) this.skylineMesh.visible = visible;
  }

  public setPromenadeFloorMood(): void {
    if (!this.plazaFloorMaterial) return;
    this.plazaFloorMaterial.color.setHex(0x5d595d);
    this.plazaFloorMaterial.emissive.setHex(0x39241d);
    this.plazaFloorMaterial.emissiveIntensity = 0.28;
    this.plazaFloorMaterial.roughness = 0.9;
    this.baseEmissiveIntensity.set(this.plazaFloorMaterial, 0.28);
  }

  private buildVista() {
    // 1. Soft S-Curving Approach Path with glowing flowerbeds & bollard lights
    this.createCurvingApproachPath();

    // 2. Decorated Roadside Framing Trees (Dangling mini lanterns & overhead fairy lights)
    this.createFramingTrees();

    // Cool paper bamboo holds the Dark Zone in the same illustrated world.
    this.createDarkZoneBamboo();

    // 3. Slender Modern Vietnamese Mid-Autumn Festival Gate
    this.createFestivalGate();

    // 4. Luminous Festival Plaza Basin ("One Large Luminous Organism")
    this.createPlazaBasin();

    // 5. Suspended Lantern Canopy across Plaza
    this.createLanternCanopy();

    // 6. Central Plaza Anchor: Giant Revolving Shadow Lantern Tower (Tháp Đèn Kéo Quân)
    this.createRevolvingLanternTower();

    // 7. Festival Stalls along perimeter
    this.createFestivalStalls();

    // 8. Far Background Modern Civic Skyline & Atmospheric Perspective
    this.createSkylineAndAtmosphere();
  }

  /**
   * 1. Soft S-Curving Approach Path with Vibrant Flowerbeds & LED Bollards
   */
  private createCurvingApproachPath() {
    // Elegant S-curve winding gently through park hill towards festival gate
    const curvePoints = [
      new THREE.Vector3(3.5, 1.25, 4.0),
      new THREE.Vector3(16.0, 0.85, 6.2),
      new THREE.Vector3(34.0, 0.50, 1.5),
      new THREE.Vector3(54.0, 0.20, -7.5),
      new THREE.Vector3(78.0, -0.05, -19.0)
    ];
    const pathCurve = new THREE.CatmullRomCurve3(curvePoints);

    // Segmented path ribbon
    const numSteps = 56;
    const pathWidth = 5.2;
    const pathGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const pt = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(-pathWidth * 0.5));
      const right = pt.clone().add(normal.clone().multiplyScalar(pathWidth * 0.5));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      uvs.push(0, t * 16);
      uvs.push(1, t * 16);

      if (i < numSteps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    pathGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    pathGeo.setIndex(indices);
    pathGeo.computeVertexNormals();

    const walkwayTex = TextureGenerator.createModernParkWalkwayTexture();
    walkwayTex.wrapS = THREE.RepeatWrapping;
    walkwayTex.wrapT = THREE.RepeatWrapping;
    const pathMat = new THREE.MeshStandardMaterial({
      map: walkwayTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.receiveShadow = true;
    this.group.add(pathMesh);

    // -------------------------------------------------------------------------
    // Bổ sung các khóm hoa nhỏ rực rỡ có ánh sáng hắt nhẹ dọc mép đường
    // -------------------------------------------------------------------------
    const marigoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.7
    });
    const salviaMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 0.85,
      roughness: 0.7
    });
    const daisyMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfde047,
      emissiveIntensity: 0.65,
      roughness: 0.6
    });

    const flowerClusterGeo = new THREE.SphereGeometry(0.24, 6, 5);
    flowerClusterGeo.scale(1.3, 0.7, 1.2);

    for (let i = 2; i <= numSteps - 2; i += 2) {
      const t = i / numSteps;
      const pt = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Flank both left and right edges with flower clusters
      [-1, 1].forEach((side, sIdx) => {
        const edgeOffset = side * (pathWidth * 0.5 + 0.35);
        const fPos = pt.clone().add(normal.clone().multiplyScalar(edgeOffset));

        // 3 flowers per small cluster
        for (let k = 0; k < 3; k++) {
          const mat = (i + k + sIdx) % 3 === 0 ? marigoldMat : ((i + k + sIdx) % 3 === 1 ? salviaMat : daisyMat);
          const fMesh = new THREE.Mesh(flowerClusterGeo, mat);
          const jx = (Math.sin(i * 3.7 + k * 1.9) * 0.28);
          const jz = (Math.cos(i * 2.3 + k * 2.1) * 0.28);
          fMesh.position.set(fPos.x + jx, fPos.y + 0.12, fPos.z + jz);
          fMesh.scale.setScalar(0.75 + ((i + k) % 3) * 0.2);
          this.group.add(fMesh);
        }

        // Emissive flower colors and nearby bollard washes provide the path rhythm.
      });
    }

    // Soft LED Bollard Path Lights along curve
    const bollardGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8);
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x1f2636, roughness: 0.4, metalness: 0.8 });
    const bollardLedMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 3.5,
      roughness: 0.2
    });
    const bollardHeadGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8);

    for (let i = 3; i <= numSteps - 3; i += 4) {
      const t = i / numSteps;
      const pt = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const side = (i % 8 === 3) ? 1 : -1;
      const bPos = pt.clone().add(normal.multiplyScalar(side * (pathWidth * 0.5 + 0.65)));

      const bollard = new THREE.Mesh(bollardGeo, bollardMat);
      bollard.position.set(bPos.x, bPos.y + 0.35, bPos.z);
      this.group.add(bollard);

      const bHead = new THREE.Mesh(bollardHeadGeo, bollardLedMat);
      bHead.position.set(bPos.x, bPos.y + 0.72, bPos.z);
      this.group.add(bHead);

      // The emissive LED head remains visible without a light per bollard.
    }

    // Strolling Visitor Silhouettes & Environmental Storytelling along approach path
    // Increasing Crowd Density: Sparse near viewpoint -> Moderate midway -> Clustered near gate
    const visitorPlacements = [
      { t: 0.18, sideOffset: -4.2, scale: 0.9, prop: 'round' },
      { t: 0.32, sideOffset: 4.9, scale: 0.85, prop: 'phone' },
      { t: 0.48, sideOffset: -3.8, scale: 0.8, prop: 'none' },
      { t: 0.59, sideOffset: 5.1, scale: 0.8, prop: 'balloon' },
      { t: 0.73, sideOffset: -4.6, scale: 0.75, prop: 'star' },
      { t: 0.84, sideOffset: 4.3, scale: 0.73, prop: 'round' },
      { t: 0.92, sideOffset: -4.1, scale: 0.7, prop: 'none' },
      { t: 0.96, sideOffset: 4.5, scale: 0.68, prop: 'phone' }
    ] as const;

    visitorPlacements.forEach((vp, index) => {
      const pt = pathCurve.getPoint(vp.t);
      const tangent = pathCurve.getTangent(vp.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const vPos = pt.clone().add(normal.multiplyScalar(vp.sideOffset));

      const visitor = this.crowdKit.createActor(vPos.x, vPos.z, vp.scale,
        0x26364b, vp.prop, index < 3);
      visitor.position.y = vPos.y;
      this.group.add(visitor);
      this.visitorMeshes.push(visitor);
    });

    // Lawn life sits beyond the route's flower rim, leaving both playable lanterns clear.
    for (const [t, side, variant] of [[.31, -8.5, 0], [.77, -8.5, 1],
      [.91, 8.4, 0]] as const) {
      const p = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const picnic = this.festivalLife.createPicnic(variant);
      picnic.position.copy(p).addScaledVector(normal, side);
      picnic.position.y = p.y;
      this.group.add(picnic);
    }
    for (const [t, side, variant] of [[.43, 6.7, 0], [.81, -6.7, 1]] as const) {
      const p = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const balloons = this.festivalLife.createBalloons(variant);
      balloons.position.copy(p).addScaledVector(normal, side);
      this.group.add(balloons);
    }

    // -------------------------------------------------------------------------
    // Environmental Storytelling Moments along Approach
    // -------------------------------------------------------------------------
    // 1. Storytelling Moment A (t = 0.24): Contemporary Park Bench with Warm Glowing Lantern
    const benchPt = pathCurve.getPoint(0.24);
    const benchTan = pathCurve.getTangent(0.24).normalize();
    const benchNorm = new THREE.Vector3(-benchTan.z, 0, benchTan.x).normalize();
    const benchPos = benchPt.clone().add(benchNorm.multiplyScalar(-pathWidth * 0.5 - 1.1));

    const benchGroup = new THREE.Group();
    benchGroup.position.set(benchPos.x, benchPos.y + 0.05, benchPos.z);
    benchGroup.rotation.y = Math.atan2(benchTan.x, benchTan.z) + Math.PI / 2;

    const benchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
    const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.55), woodMat);
    seatMesh.position.set(0, 0.42, 0);
    benchGroup.add(seatMesh);
    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.06), woodMat);
    backMesh.position.set(0, 0.72, -0.24);
    benchGroup.add(backMesh);
    [-0.85, 0.85].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), benchMat);
      leg.position.set(lx, 0.21, 0);
      benchGroup.add(leg);
    });

    // Bench lantern resting on side
    const benchLanternMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 3.5,
      roughness: 0.15
    });
    const benchLantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), benchLanternMat);
    benchLantern.position.set(0.65, 0.62, 0);
    benchGroup.add(benchLantern);
    this.group.add(benchGroup);

    // 2. Storytelling Moment B (t = 0.62): Mid-Autumn Traditional Lantern Kiosk Cart
    const cartPt = pathCurve.getPoint(0.62);
    const cartTan = pathCurve.getTangent(0.62).normalize();
    const cartNorm = new THREE.Vector3(-cartTan.z, 0, cartTan.x).normalize();
    const cartPos = cartPt.clone().add(cartNorm.multiplyScalar(pathWidth * 0.5 + 1.4));

    const cartGroup = new THREE.Group();
    cartGroup.position.set(cartPos.x, cartPos.y, cartPos.z);
    cartGroup.rotation.y = Math.atan2(cartTan.x, cartTan.z) - Math.PI / 2;

    const cartWood = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.2), cartWood);
    cartBody.position.set(0, 0.55, 0);
    cartGroup.add(cartBody);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, emissive: 0x9f1239, emissiveIntensity: 0.9 });
    const cartRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 4), canopyMat);
    cartRoof.position.set(0, 1.9, 0);
    cartRoof.rotation.y = Math.PI / 4;
    cartGroup.add(cartRoof);

    // 3 small hanging star lanterns under cart canopy
    [-0.6, 0.0, 0.6].forEach((cx, idx) => {
      const sMat = (idx % 2 === 0) ? benchLanternMat : new THREE.MeshStandardMaterial({ color: 0xffe4e6, emissive: 0xf43f5e, emissiveIntensity: 3.5 });
      const sMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), sMat);
      sMesh.scale.set(1.3, 1.3, 0.4);
      sMesh.position.set(cx, 1.5, 0.35);
      cartGroup.add(sMesh);
    });

    const cartLight = new THREE.PointLight(0xffaa33, 3.2, 10.0, 1.6);
    cartLight.position.set(0, 1.4, 0);
    cartGroup.add(cartLight);
    this.group.add(cartGroup);
  }

  /**
   * 2. Roadside Trees Decorated with Dangling Mini Lanterns & Overhead Fairy Light Swags
   */
  private createFramingTrees() {
    // Tree positions along left and right flanks of the avenue
    const leftTrees = [
      { x: 12.0, z: 9.5, scale: 1.45, wrapLed: true },
      { x: 26.0, z: 7.5, scale: 1.55, wrapLed: false },
      { x: 40.0, z: 5.0, scale: 1.65, wrapLed: true },
      { x: 56.0, z: -1.0, scale: 1.70, wrapLed: false }
    ];

    const rightTrees = [
      { x: 15.0, z: -8.0, scale: 1.35, wrapLed: false },
      { x: 28.0, z: -13.5, scale: 1.50, wrapLed: true },
      { x: 44.0, z: -19.5, scale: 1.65, wrapLed: false },
      { x: 60.0, z: -23.5, scale: 1.70, wrapLed: true }
    ];

    leftTrees.forEach(tp => this.createDecoratedTree(tp.x, tp.z, tp.scale, tp.wrapLed));
    rightTrees.forEach(tp => this.createDecoratedTree(tp.x, tp.z, tp.scale, tp.wrapLed));

    // -------------------------------------------------------------------------
    // Overhead Fairy Light Swags connecting tree tops across & along the avenue
    // -------------------------------------------------------------------------
    const fairyWireMat = new THREE.LineBasicMaterial({ color: 0x4a4030, transparent: true, opacity: 0.65 });
    const fairyBeadMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 3.8,
      roughness: 0.15
    });
    const beadGeo = new THREE.SphereGeometry(0.065, 6, 6);

    const stringCatenary = (p1: THREE.Vector3, p2: THREE.Vector3, sag: number, numBeads: number) => {
      const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
      mid.y -= sag;
      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const points = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, fairyWireMat);
      this.group.add(line);

      for (let i = 1; i < numBeads; i++) {
        const t = i / numBeads;
        const bpt = curve.getPoint(t);
        const bead = new THREE.Mesh(beadGeo, fairyBeadMat);
        bead.position.copy(bpt);
        this.group.add(bead);
      }
    };

    // Cross-avenue swags connecting left and right tree pairs
    for (let i = 0; i < 4; i++) {
      const lt = leftTrees[i];
      const rt = rightTrees[i];
      const pLeft = new THREE.Vector3(lt.x, 5.8 * lt.scale * 0.9, lt.z);
      const pRight = new THREE.Vector3(rt.x, 5.8 * rt.scale * 0.9, rt.z);
      stringCatenary(pLeft, pRight, 1.4, 18);
    }

    // Longitudinal swags connecting adjacent trees on left and right sides
    for (let i = 0; i < 3; i++) {
      const lt1 = leftTrees[i];
      const lt2 = leftTrees[i + 1];
      stringCatenary(
        new THREE.Vector3(lt1.x, 5.6 * lt1.scale * 0.9, lt1.z),
        new THREE.Vector3(lt2.x, 5.6 * lt2.scale * 0.9, lt2.z),
        0.8,
        14
      );

      const rt1 = rightTrees[i];
      const rt2 = rightTrees[i + 1];
      stringCatenary(
        new THREE.Vector3(rt1.x, 5.6 * rt1.scale * 0.9, rt1.z),
        new THREE.Vector3(rt2.x, 5.6 * rt2.scale * 0.9, rt2.z),
        0.8,
        14
      );
    }
  }

  private createDecoratedTree(x: number, z: number, scale: number, wrapLed: boolean) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    treeGroup.scale.setScalar(scale);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.36, 4.4, 10);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1f1914, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 2.2, 0);
    treeGroup.add(trunk);

    // Layered cut-paper canopy keeps the lantern strings visible through open edges.
    const clump1 = this.foliageKit.canopy(5.2, 3.25, 0);
    clump1.position.set(0, 4.4, 0);
    treeGroup.add(clump1);

    const clump2 = this.foliageKit.canopy(3.7, 2.5, 2);
    clump2.position.set(0.4, 5.4, 0.2);
    treeGroup.add(clump2);

    // -------------------------------------------------------------------------
    // Dangling Mini Lanterns hanging from branches
    // -------------------------------------------------------------------------
    const miniGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 3.6,
      roughness: 0.15
    });
    const miniRedMat = new THREE.MeshStandardMaterial({
      color: 0xffe4e6,
      emissive: 0xf43f5e,
      emissiveIntensity: 3.6,
      roughness: 0.15
    });
    const cordMat = new THREE.LineBasicMaterial({ color: 0xd97706 });

    const lanternDropOffsets = [
      { x: -1.2, y: 4.1, z: 0.8, isStar: true },
      { x: 1.1, y: 4.3, z: -0.7, isStar: false },
      { x: -0.6, y: 3.8, z: -1.1, isStar: false },
      { x: 1.3, y: 3.9, z: 0.9, isStar: true },
      { x: 0.2, y: 4.0, z: 1.4, isStar: false }
    ];

    lanternDropOffsets.forEach((drop, dIdx) => {
      // Cord hanging from branch
      const cordGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(drop.x, drop.y + 0.6, drop.z),
        new THREE.Vector3(drop.x, drop.y, drop.z)
      ]);
      const cordLine = new THREE.Line(cordGeo, cordMat);
      treeGroup.add(cordLine);

      // Mini lantern body
      const lMat = (dIdx % 2 === 0) ? miniGoldMat : miniRedMat;
      let lMesh: THREE.Mesh;
      if (drop.isStar) {
        // Mini star lantern
        lMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), lMat);
        lMesh.scale.set(1.4, 1.4, 0.5);
      } else {
        // Mini paper cylinder lantern
        lMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 10), lMat);
      }
      lMesh.position.set(drop.x, drop.y - 0.12, drop.z);
      treeGroup.add(lMesh);
      this.danglingTreeLanterns.push(lMesh);
    });

    if (wrapLed) {
      // Warm fairy light beads wrapping trunk
      const fairyMat = new THREE.MeshStandardMaterial({
        color: 0xfff08a,
        emissive: 0xfde047,
        emissiveIntensity: 3.4,
        roughness: 0.2
      });
      const beadGeo = new THREE.SphereGeometry(0.045, 6, 6);
      for (let i = 0; i < 28; i++) {
        const p = i / 28;
        const by = 0.5 + p * 3.4;
        const bAngle = p * Math.PI * 8.0;
        const br = 0.3 - p * 0.08;
        const bead = new THREE.Mesh(beadGeo, fairyMat);
        bead.position.set(Math.cos(bAngle) * br, by, Math.sin(bAngle) * br);
        treeGroup.add(bead);
      }

      // Trunk uplight
      if (x < 14) {
        const uplight = new THREE.PointLight(0xffbe44, 3.5, 9.5, 1.5);
        uplight.position.set(0, 0.5, 0);
        treeGroup.add(uplight);
      }
    }

    this.group.add(treeGroup);
  }

  private createDarkZoneBamboo() {
    for (const [x, z, width, height] of [
      [61.8, -18.8, 3.3, 5.1], [67.7, -21.2, 2.7, 4.7],
      [65.2, -5.9, 3.0, 4.9], [72.5, -9.4, 2.8, 5.2]
    ]) {
      const card = this.foliageKit.bamboo(width, height);
      card.position.set(x, -0.18, z);
      this.group.add(card);
    }
  }

  /**
   * 3. Slender Welcoming Modern Vietnamese Mid-Autumn Festival Gate
   * Clean arch aperture framing the Revolving Shadow Lantern Tower in the distance.
   */
  private createFestivalGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(78.0, -0.2, -19.0);
    gateGroup.rotation.y = this.vistaRotationY;

    // Slender Gate Silhouette Mesh with Cloud Fretwork & Welcome Banner
    const gateTex = TextureGenerator.createModernFestivalGateTexture();
    const gateGeo = new THREE.PlaneGeometry(24.0, 24.0);
    const gateMat = new THREE.MeshBasicMaterial({
      map: gateTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 11.5, 0);
    gateGroup.add(gateMesh);

    // 3D Twin Stone Pillars (Depth & Solid Mass)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x162030,
      roughness: 0.5,
      metalness: 0.4
    });
    const pillarLedMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.8,
      roughness: 0.25
    });

    [-8.8, 8.8].forEach(px => {
      // Solid pillar block
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 16.5, 1.6), pillarMat);
      pMesh.position.set(px, 8.25, 0);
      gateGroup.add(pMesh);

      // Embedded vertical gold LED slit
      const ledSlit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 14.5, 1.65), pillarLedMat);
      ledSlit.position.set(px, 8.25, 0);
      gateGroup.add(ledSlit);

      // Pillar base pedestal
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.2), pillarMat);
      baseMesh.position.set(px, 0.55, 0);
      gateGroup.add(baseMesh);
    });

    // Gate Warm Illumination Spotlight (Lighting threshold into plaza)
    this.gateSpotLight = new THREE.PointLight(0xffbe44, 4.2, 32.0, 1.4);
    this.gateSpotLight.position.set(0, 9.5, 3.0);
    gateGroup.add(this.gateSpotLight);

    // Crimson acrylic and emissive trim supply the red accent.

    this.group.add(gateGroup);
  }

  /**
   * 4. Luminous Festival Plaza Basin ("One Large Luminous Organism")
   */
  private createPlazaBasin() {
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(100.0, -0.3, -25.6);

    // Broad Elliptical Stone Plaza Floor (68m x 48m)
    const plazaFloorGeo = new THREE.CylinderGeometry(34.0, 34.0, 0.25, 48);
    plazaFloorGeo.scale(1.0, 1.0, 0.72);
    const plazaTex = TextureGenerator.createModernParkWalkwayTexture();
    plazaTex.repeat.set(16, 16);
    plazaTex.wrapS = THREE.RepeatWrapping;
    plazaTex.wrapT = THREE.RepeatWrapping;

    const plazaMat = new THREE.MeshStandardMaterial({
      map: plazaTex,
      color: 0x5a3e1b,
      emissive: 0x92400e,
      emissiveIntensity: 1.1,
      roughness: 0.55,
      metalness: 0.1
    });
    this.plazaFloorMaterial = plazaMat;
    const plazaFloor = new THREE.Mesh(plazaFloorGeo, plazaMat);
    plazaFloor.position.set(0, 0.125, 0);
    plazaFloor.receiveShadow = true;
    plazaGroup.add(plazaFloor);

    // Glowing Golden Perimeter Rim Ring (Outlining the luminous organism)
    const rimGeo = new THREE.TorusGeometry(34.1, 0.28, 8, 48);
    rimGeo.scale(1.0, 1.0, 0.72);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.5,
      roughness: 0.35
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 0.26, 0);
    plazaGroup.add(rimMesh);

    // A restrained illustrated audience gives the outer lantern court a human scale.
    // They stay behind the two playable lanterns and clear of the tower's silhouette.
    for (const [x, z, scale, prop, color] of [
      [-8, -10, 0.86, 'star', 0x273952], [-5, -14, 0.72, 'none', 0x48506a],
      [-8, 10, 0.88, 'round', 0x433a53], [-5, 14, 0.72, 'none', 0x26384a]
    ] as const) {
      plazaGroup.add(this.crowdKit.createActor(x, z, scale, color, prop));
    }

    // Warm Ambient Plaza Wash Lights (soft luminous glow without blowout)
    this.festivalWashLight = new THREE.PointLight(0xffa834, 6.5, 80.0, 1.2);
    this.festivalWashLight.position.set(0, 8.0, 0);
    plazaGroup.add(this.festivalWashLight);

    // The broad hero wash reaches the entrance; decorative lamps stay emissive.

    // Flanking 3D Glowing Lantern Towers around plaza perimeter
    const towerCoords = [
      { x: -28.0, z: -8.0 },
      { x: 28.0, z: -8.0 },
      { x: -22.0, z: 12.0 },
      { x: 22.0, z: 12.0 }
    ];
    const towerTrussMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.8 });
    const lanternGoldMat = new THREE.MeshStandardMaterial({ color: 0xfff08a, emissive: 0xfbbf24, emissiveIntensity: 2.0 });
    const lanternRedMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6, emissive: 0xf43f5e, emissiveIntensity: 2.0 });

    towerCoords.forEach(tc => {
      const tower = new THREE.Group();
      tower.position.set(tc.x, 0, tc.z);

      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 18.0, 8), towerTrussMat);
      spire.position.set(0, 9.0, 0);
      tower.add(spire);

      [4.5, 8.5, 12.5, 16.5].forEach((ly, tierIdx) => {
        const mat = (tierIdx % 2 === 0) ? lanternGoldMat : lanternRedMat;
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat);
        box.position.set(0, ly, 0);
        tower.add(box);
      });

      plazaGroup.add(tower);
    });

    this.group.add(plazaGroup);
  }

  /**
   * 5. Suspended Lantern Canopy across Plaza (Star Lanterns & Round Lanterns)
   */
  private createLanternCanopy() {
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(100.0, 0.0, -25.6);

    const goldStarMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfde047,
      emissiveIntensity: 1.8,
      roughness: 0.25
    });
    const redLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe4e6,
      emissive: 0xf43f5e,
      emissiveIntensity: 1.8,
      roughness: 0.25
    });
    const cableMat = new THREE.LineBasicMaterial({ color: 0x374151, transparent: true, opacity: 0.75 });

    const festoonConfigs = [
      { start: new THREE.Vector3(-26, 14.5, -6), end: new THREE.Vector3(0, 15.0, 14), sag: 2.2, count: 6 },
      { start: new THREE.Vector3(26, 14.5, -6), end: new THREE.Vector3(0, 15.0, 14), sag: 2.2, count: 6 },
      { start: new THREE.Vector3(-22, 14.0, 11), end: new THREE.Vector3(22, 14.0, 11), sag: 2.8, count: 8 },
      { start: new THREE.Vector3(-26, 14.5, -6), end: new THREE.Vector3(26, 14.5, -6), sag: 2.5, count: 8 }
    ];

    festoonConfigs.forEach((cfg) => {
      const mid = new THREE.Vector3().lerpVectors(cfg.start, cfg.end, 0.5);
      mid.y -= cfg.sag;

      const curve = new THREE.CatmullRomCurve3([cfg.start, mid, cfg.end]);
      const points = curve.getPoints(24);
      const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
      const cable = new THREE.Line(cableGeo, cableMat);
      canopyGroup.add(cable);

      for (let i = 1; i <= cfg.count; i++) {
        const t = i / (cfg.count + 1);
        const lPos = curve.getPoint(t);

        const isStar = i % 2 === 0;
        const mat = isStar ? goldStarMat : redLanternMat;
        let lantern: THREE.Mesh;
        if (isStar) {
          lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), mat);
          lantern.scale.set(1.4, 1.4, 0.45);
        } else {
          lantern = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), mat);
          lantern.scale.set(1.0, 1.3, 1.0);
        }
        lantern.position.set(lPos.x, lPos.y - 0.45, lPos.z);
        canopyGroup.add(lantern);
        this.canopyLanterns.push(lantern);
      }
    });

    this.group.add(canopyGroup);
  }

  /**
   * 6. Central Plaza Anchor: Giant Revolving Shadow Lantern Tower (Tháp Đèn Kéo Quân Khổng Lồ)
   * 17.5m tall octagonal architectural tower with revolving drum casting Mid-Autumn procession shadows.
   */
  private createRevolvingLanternTower() {
    this.revolvingTowerGroup = new THREE.Group();
    // Centered at plaza basin center
    this.revolvingTowerGroup.position.set(100.0, -0.3, -25.6);
    this.revolvingTowerGroup.rotation.y = this.vistaRotationY;

    // 1. Tiered Octagonal Stone Base Pedestal
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.55,
      metalness: 0.35
    });
    const stepGoldLedMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.8,
      roughness: 0.25
    });

    // Step Tier 1 (Broad Octagonal Base)
    const base1Geo = new THREE.CylinderGeometry(5.4, 5.6, 1.0, 8);
    const base1 = new THREE.Mesh(base1Geo, baseMat);
    base1.position.set(0, 0.5, 0);
    this.revolvingTowerGroup.add(base1);

    // Step Tier 2 (Upper Pedestal)
    const base2Geo = new THREE.CylinderGeometry(4.5, 4.7, 0.8, 8);
    const base2 = new THREE.Mesh(base2Geo, baseMat);
    base2.position.set(0, 1.4, 0);
    this.revolvingTowerGroup.add(base2);

    // Recessed Gold LED Rings on Pedestal Steps
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(5.42, 0.08, 6, 8), stepGoldLedMat);
    rim1.rotation.x = Math.PI / 2;
    rim1.position.set(0, 1.0, 0);
    this.revolvingTowerGroup.add(rim1);

    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(4.52, 0.08, 6, 8), stepGoldLedMat);
    rim2.rotation.x = Math.PI / 2;
    rim2.position.set(0, 1.8, 0);
    this.revolvingTowerGroup.add(rim2);

    // 2. Revolving Shadow Drum (Thân Đèn Kéo Quân Xoay Chuyển)
    // Translucent mica drum with authentic Vietnamese Mid-Autumn procession silhouettes
    const drumTex = TextureGenerator.createRevolvingShadowLanternTexture();
    const drumGeo = new THREE.CylinderGeometry(3.9, 3.9, 11.2, 32, 1, true);
    const drumMat = new THREE.MeshStandardMaterial({
      map: drumTex,
      emissiveMap: drumTex,
      emissive: 0xffedd5,
      emissiveIntensity: 1.05,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.revolvingDrum = new THREE.Mesh(drumGeo, drumMat);
    this.revolvingDrum.position.set(0, 7.8, 0);
    this.revolvingTowerGroup.add(this.revolvingDrum);

    // 3. 8 Slender Golden Architectural Columns (Khung Viền Vàng Kim #FBBF24)
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.85,
      roughness: 0.18
    });
    const colLedMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfde047,
      emissiveIntensity: 1.9,
      roughness: 0.2
    });

    const colRadius = 4.35;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8 + Math.PI / 8;
      const cx = Math.cos(ang) * colRadius;
      const cz = Math.sin(ang) * colRadius;

      // Outer gold column
      const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 14.5, 8), columnMat);
      colMesh.position.set(cx, 8.8, cz);
      this.revolvingTowerGroup.add(colMesh);

      // Embedded vertical gold LED slit
      const ledSlit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 12.0, 0.06), colLedMat);
      ledSlit.position.set(cx * 1.02, 8.2, cz * 1.02);
      this.revolvingTowerGroup.add(ledSlit);
    }

    // 4. Tiered Flared Pagoda / Pavilion Eaves (Mái Ngói Cong Thanh Thoát)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.4
    });

    // Mid-tier flared eave (Y = 8.0m)
    const midEaveGeo = new THREE.ConeGeometry(4.9, 1.2, 8);
    const midEave = new THREE.Mesh(midEaveGeo, roofMat);
    midEave.position.set(0, 8.2, 0);
    this.revolvingTowerGroup.add(midEave);

    const midEaveTrim = new THREE.Mesh(new THREE.TorusGeometry(4.92, 0.1, 6, 8), stepGoldLedMat);
    midEaveTrim.rotation.x = Math.PI / 2;
    midEaveTrim.position.set(0, 7.6, 0);
    this.revolvingTowerGroup.add(midEaveTrim);

    // Top grand eave (Y = 14.2m)
    const topEaveGeo = new THREE.ConeGeometry(5.4, 1.8, 8);
    const topEave = new THREE.Mesh(topEaveGeo, roofMat);
    topEave.position.set(0, 14.3, 0);
    this.revolvingTowerGroup.add(topEave);

    const topEaveTrim = new THREE.Mesh(new THREE.TorusGeometry(5.42, 0.12, 6, 8), stepGoldLedMat);
    topEaveTrim.rotation.x = Math.PI / 2;
    topEaveTrim.position.set(0, 13.4, 0);
    this.revolvingTowerGroup.add(topEaveTrim);

    // Crowning Lotus Spire & Flame Finial (Apex reaching Y = 17.5m)
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfde047,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    const spireMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), spireMat);
    spireMesh.scale.set(1.1, 1.8, 1.1);
    spireMesh.position.set(0, 16.5, 0);
    this.revolvingTowerGroup.add(spireMesh);

    // 5. Balanced Core Illumination (Inside the revolving drum)
    this.towerCoreLight = new THREE.PointLight(0xffbe3b, 5.5, 42.0, 1.3);
    this.towerCoreLight.position.set(0, 8.0, 0);
    this.revolvingTowerGroup.add(this.towerCoreLight);

    // Paper and LED surfaces paint the remaining warm and coral tower accents.

    this.group.add(this.revolvingTowerGroup);
  }

  private revolvingTowerGroup!: THREE.Group;

  /**
   * 7. Festival Stalls & Pavilions along outer plaza perimeter
   */
  private createFestivalStalls() {
    const stallsGroup = new THREE.Group();
    stallsGroup.position.set(100.0, -0.3, -25.6);

    const stallAngles = [0.55, 1.35, 2.15, 3.75, 4.55, 5.35];
    stallAngles.forEach((ang, index) => {
      const r = 31.0;
      const sx = Math.cos(ang) * r;
      const sz = Math.sin(ang) * (r * 0.72);

      const stall = this.marketKit.create(index);
      stall.position.set(sx, 0, sz);
      stall.rotation.y = -ang + Math.PI / 2;
      stallsGroup.add(stall);
    });

    this.group.add(stallsGroup);
  }

  /**
   * 8. Far Background Modern Civic Skyline & Atmospheric Horizon Glow
   */
  private createSkylineAndAtmosphere() {
    // Skyline Silhouette Billboard
    const skylineTex = TextureGenerator.createCivicSkylineTexture();
    const skylineGeo = new THREE.PlaneGeometry(160.0, 40.0);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(135.0, 15.0, -38.0);
    skylineMesh.rotation.y = this.vistaRotationY;
    this.group.add(skylineMesh);
    this.skylineMesh = skylineMesh;

    // Warm Atmospheric Horizon Light Dome with soft radial falloff (zero hard edges)
    const glowGeo = new THREE.PlaneGeometry(180.0, 60.0);
    const glowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createHorizonGlowTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const glowDome = new THREE.Mesh(glowGeo, glowMat);
    glowDome.position.set(132.0, 18.0, -37.0);
    glowDome.rotation.y = this.vistaRotationY;
    this.group.add(glowDome);
  }

  /**
   * Continuous animation loop update
   */
  public update(delta: number, time: number) {
    this.festivalLife.update(time);
    // 1. Giant Revolving Shadow Lantern Drum steady rotation
    if (this.revolvingDrum) {
      this.revolvingDrum.rotation.y += delta * 0.28;
    }

    // 2. Dangling tree mini lanterns swaying gently in the evening breeze
    this.danglingTreeLanterns.forEach((lantern, idx) => {
      lantern.rotation.z = Math.sin(time * 2.4 + idx * 1.1) * 0.08;
      lantern.rotation.x = Math.cos(time * 2.0 + idx * 0.9) * 0.06;
    });

    // 3. Hanging Lantern Canopy subtle breeze sway
    this.canopyLanterns.forEach((lantern, idx) => {
      lantern.position.y += Math.sin(time * 2.2 + idx * 0.8) * 0.0018;
    });

    // 4. Strolling visitor subtle movement
    this.visitorMeshes.forEach((mesh, idx) => {
      mesh.position.y += Math.sin(time * 3.0 + idx * 1.8) * 0.0014;
    });

    // 5. Festival wash light dynamic energy flicker
    if (this.festivalWashLight) {
      this.festivalWashLight.intensity = (15.0 + Math.sin(time * 4.0) * 0.8) *
        (1 - this.phase5TowerFocus * 0.4);
    }
    if (this.towerCoreLight) {
      this.towerCoreLight.intensity = (18.0 + Math.sin(time * 3.2) * 1.1) *
        (1 - this.phase5TowerFocus * 0.68);
    }

    const needsMaterialUpdate = this.phase5Darkness > 0 || this.phase5TowerFocus > 0 || this.wasPhase5MaterialAdjusted;
    if (this.phase5Darkness > 0) {
      this.wasPhase5Darkened = true;
      const lightFactor = 1 - this.phase5Darkness * 0.88;
      for (const [light, base] of this.baseLightIntensity) {
        const animated = light === this.festivalWashLight || light === this.towerCoreLight;
        light.intensity = (animated ? light.intensity : base) * lightFactor;
      }
    } else if (this.wasPhase5Darkened) {
      for (const [light, base] of this.baseLightIntensity) {
        if (light !== this.festivalWashLight && light !== this.towerCoreLight) light.intensity = base;
      }
      this.wasPhase5Darkened = false;
    }
    if (!needsMaterialUpdate) return;
    this.wasPhase5MaterialAdjusted = this.phase5Darkness > 0 || this.phase5TowerFocus > 0;
    const emissiveFactor = (1 - this.phase5Darkness * 0.82) * (1 - this.phase5TowerFocus * 0.68);
    for (const [material, base] of this.baseEmissiveIntensity) {
      const towerDrumFactor = material === this.revolvingDrum.material ? 1 - this.phase5TowerFocus * 0.52 : 1;
      material.emissiveIntensity = base * emissiveFactor * towerDrumFactor;
    }
    for (const [material, base] of this.baseAdditiveOpacity) material.opacity = base * emissiveFactor;
  }

  /**
   * Clean disposal of all Three.js resources
   */
  public dispose() {
    disposeSceneResources(this.group);
  }
}
