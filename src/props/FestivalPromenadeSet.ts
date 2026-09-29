import * as THREE from 'three';
import { INNER_GATE_POSITION, PHASE6_ROUTES, Phase6RouteId } from '../scenes/Phase6Routes';
import { PresentCrowdKit, type VisitorProp } from './papercraft/PresentCrowdKit';
import { PapercraftFoliageKit } from './papercraft/PapercraftFoliageKit';
import { MarketStallKit } from './papercraft/MarketStallKit';
import { CeremonialCharacterKit } from './papercraft/CeremonialCharacterKit';
import { FestivalLanternDecorKit } from './papercraft/FestivalLanternDecorKit';
import { IllustratedFacadeKit } from './papercraft/IllustratedFacadeKit';

const gold = new THREE.MeshStandardMaterial({ color: 0xd99a47, roughness: 0.65, emissive: 0x5b2e0d, emissiveIntensity: 0.35 });
const wood = new THREE.MeshStandardMaterial({ color: 0x593b39, roughness: 0.85 });
const cloth = new THREE.MeshStandardMaterial({ color: 0xa82d41, roughness: 0.9 });
const stone = new THREE.MeshStandardMaterial({ color: 0x343c4c, roughness: 1 });

const box = (w: number, h: number, d: number, material: THREE.Material) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

const crestStar = (() => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? 0.13 : 0.29;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false });
})();

function pavingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#45434b';
  ctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 3; col++) {
      const x = col * 128 + (row % 2) * 64 + 3;
      const y = row * 64 + 3;
      ctx.fillStyle = (row + col) % 3 === 0 ? '#aaa4a4' : '#9c999f';
      ctx.fillRect(x, y, 122, 58);
      ctx.fillStyle = 'rgba(255, 236, 205, .12)';
      ctx.fillRect(x + 3, y + 3, 116, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function pathRibbon(curve: THREE.CatmullRomCurve3, width: number,
  material: THREE.Material, yOffset = 0.08): THREE.Mesh {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const seg = Math.max(64, Math.ceil(curve.getLength() * 2));
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const a = p.clone().addScaledVector(normal, width / 2);
    const b = p.clone().addScaledVector(normal, -width / 2);
    vertices.push(a.x, p.y + yOffset, a.z, b.x, p.y + yOffset, b.z);
    const distance = curve.getLength() * t;
    uvs.push(0, distance / 1.2, width / 1.2, distance / 1.2);
    if (i < seg) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function pavedJunction(x: number, z: number, radius: number,
  material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.055, 64);
  const uv = geometry.getAttribute('uv');
  const repeat = radius * 1.35;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * repeat, uv.getY(i) * repeat);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 0.105, z);
  return mesh;
}

/** Phase 6: Spatial promenade, secluded Moon Alcove, and guarded Inner Gate. */
export class FestivalPromenadeSet {
  private readonly crowdKit = new PresentCrowdKit();
  private readonly foliageKit = new PapercraftFoliageKit();
  private readonly marketKit = new MarketStallKit();
  private readonly characterKit = new CeremonialCharacterKit();
  private readonly lanternKit = new FestivalLanternDecorKit();
  private readonly facadeKit = new IllustratedFacadeKit();
  public readonly group = new THREE.Group();
  public readonly gateSockets: [THREE.Mesh, THREE.Mesh];
  public readonly gatePanel: THREE.Group;
  private readonly moonAlcove = new THREE.Group();
  private readonly hostScenery = new THREE.Group();
  private readonly guestScenery = new THREE.Group();
  private readonly ceremonialScenery = new THREE.Group();
  private readonly hostGuide = new THREE.Group();
  private readonly guestGuide = new THREE.Group();
  private reunionBeacon!: THREE.Sprite;
  private readonly crossingGroups: THREE.Group[] = [];
  private readonly nearCrowd: THREE.Group[] = [];
  private readonly midCrowd: THREE.Group[] = [];
  private readonly splitCrowd: THREE.Group[] = [];
  private readonly farCrowd: THREE.InstancedMesh;
  private crowdMotion = 0;
  private crowdApproach = 0;
  private separationElapsed = -1;
  private readonly memoryPetals: THREE.Group[] = [];
  private readonly flowerMaterials: THREE.MeshStandardMaterial[] = [];
  private readonly gateLeaves: THREE.Group[] = [];
  private readonly gateTraces: THREE.MeshStandardMaterial[] = [];
  private readonly gateSignals: THREE.Sprite[] = [];
  private gateHaze!: THREE.Mesh;
  private gateVeil!: THREE.Sprite;
  private gateGlass!: THREE.MeshPhysicalMaterial;
  private gateReady = false;
  private gateActivation = 0;
  private gateRevealProgress = 0;
  private readonly roadTexture = pavingTexture();

  private silhouette(x: number, z: number, scale = 1, color = 0x23344d,
    prop: VisitorProp = 'none', detailed = false): THREE.Group {
    return this.crowdKit.createActor(x, z, scale, color, prop, detailed);
  }

  constructor() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 240),
      new THREE.MeshStandardMaterial({ color: 0x141d2c, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(140, -0.34, -70);
    this.group.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0xbab4b2, map: this.roadTexture, side: THREE.DoubleSide, roughness: 0.93,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    const routeWidths: Record<string, number> = {
      [Phase6RouteId.shared]: 6.2,
      [Phase6RouteId.host]: 4,
      [Phase6RouteId.guest]: 4,
      [Phase6RouteId.hostRejoin]: 4,
      [Phase6RouteId.guestRejoin]: 4,
      [Phase6RouteId.final]: 5.6
    };

    for (const [id, curve] of Object.entries(PHASE6_ROUTES)) {
      this.group.add(pathRibbon(curve, routeWidths[id] ?? 4, roadMaterial));
    }

    // Paved junctions cover coincident route meshes, so branches meet cleanly.
    this.group.add(pavedJunction(136, -54, 4.4, roadMaterial));
    this.group.add(pavedJunction(160, -82, 10.8, roadMaterial));

    // Moon Alcove secluded garden terrace
    const moonTerrace = new THREE.Mesh(new THREE.CylinderGeometry(6.9, 6.9, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0x345342, roughness: 0.98 }));
    moonTerrace.position.set(132, 0.105, -94);
    this.group.add(moonTerrace);

    this.buildPavilion();
    this.buildStalls();
    this.buildBackgroundFacades();
    this.buildPromenadeTrees();
    this.buildLanternStrings();
    this.buildFlowerEdges();
    this.buildPromenadeOccluders();
    this.buildMoonAlcove();
    this.buildLaterRouteFraming();
    this.buildGuidanceLights();
    this.gatePanel = this.buildGate();
    this.gateSockets = [this.gatePanel.getObjectByName('socket_host') as THREE.Mesh,
      this.gatePanel.getObjectByName('socket_guest') as THREE.Mesh];

    // Mid silhouettes along shared promenade
    for (let i = 0; i < 22; i++) {
      const t = 0.3 + (i / 22) * 0.68;
      const p = PHASE6_ROUTES.route_shared.getPointAt(t);
      const side = i % 2 === 0 ? 5 + (i % 3) : -5 - (i % 3);
      const props: VisitorProp[] = ['none', 'phone', 'round', 'balloon', 'none', 'star', 'round'];
      const actor = this.silhouette(p.x + side * 0.4, p.z + side * 0.7,
        0.75 + (i % 4) * 0.1, i % 3 === 0 ? 0x483746 : 0x26364b,
        props[i % props.length], i % 5 === 0);
      actor.visible = false;
      this.midCrowd.push(actor); this.group.add(actor);
    }
    for (let i = 0; i < 8; i++) {
      const props: VisitorProp[] = ['balloon', 'phone', 'round', 'none', 'none', 'balloon', 'phone', 'round'];
      const actor = this.silhouette(130 + (i % 4) * 2.8, -48 - Math.floor(i / 4) * 8,
        i % 3 === 0 ? 0.72 : 1, i % 4 === 0 ? 0x4c3949 : 0x263449,
        props[i], true);
      actor.visible = false; this.nearCrowd.push(actor); this.group.add(actor);
    }

    // Split crowd along route A and route B
    for (const routeId of [Phase6RouteId.host, Phase6RouteId.guest]) {
      for (let i = 0; i < 14; i++) {
        const route = PHASE6_ROUTES[routeId];
        const t = 0.08 + i * 0.064;
        const p = route.getPointAt(t);
        const tangent = route.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        p.addScaledVector(normal, i % 2 ? -2.6 : 2.6);
        const props: VisitorProp[] = ['none', 'phone', 'round', 'none', 'balloon', 'star', 'none'];
        const actor = this.silhouette(p.x, p.z, 0.7 + (i % 4) * 0.13,
          i % 3 ? 0x27344b : 0x4a394b, props[i % props.length], i % 7 === 0);
        actor.visible = false; this.splitCrowd.push(actor); this.group.add(actor);
      }
    }

    const farMaterial = this.crowdKit.createFarMaterial();
    this.farCrowd = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.7, 2), farMaterial, 56);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 56; i++) {
      dummy.position.set(117 + (i % 14) * 2.5, 0.8, -63 - Math.floor(i / 14) * 2.8);
      dummy.rotation.y = Math.PI / 4;
      dummy.scale.setScalar(0.7 + (i % 4) * 0.1);
      dummy.updateMatrix(); this.farCrowd.setMatrixAt(i, dummy.matrix);
    }
    this.farCrowd.count = 0;
    this.group.add(this.farCrowd);

    // Occlusion band crossing at separation checkpoint (136, -54)
    for (let row = 0; row < 3; row++) {
      const band = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const props: VisitorProp[] = ['none', 'balloon', 'phone', 'none', 'round', 'star'];
        const visitor = this.silhouette((i % 2) * 0.65, (i - 2.5) * 1.1,
          i % 3 === 0 ? 0.76 : 0.96, i % 2 ? 0x222f43 : 0x433640,
          props[i]);
        band.add(visitor);
      }
      band.position.set(134 + row * 2.2, 0.02, -52 - row * 1.2);
      band.visible = false;
      this.crossingGroups.push(band); this.group.add(band);
    }
  }

  private buildPavilion(): void {
    const pavilion = new THREE.Group(); pavilion.position.set(119, 0, -34.5);
    const floor = box(6.8, 0.25, 5, stone); floor.position.y = 0.05; pavilion.add(floor);
    for (const x of [-2.7, 2.7]) for (const z of [-1.8, 1.8]) {
      const post = box(0.2, 3.1, 0.2, wood); post.position.set(x, 1.6, z); pavilion.add(post);
    }
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x493a43, roughness: 0.9 });
    for (const side of [-1, 1]) {
      const eave = box(3.65, 0.12, 5.5, roofMat);
      eave.position.set(side * 1.66, 3.48, 0);
      eave.rotation.z = side * -0.17;
      pavilion.add(eave);
      const edge = box(3.5, 0.055, 0.08, gold);
      edge.position.set(side * 1.68, 3.08, 2.74);
      edge.rotation.z = side * -0.17;
      pavilion.add(edge);
    }
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 0.48), cloth);
    valance.position.set(0, 2.98, 2.78); pavilion.add(valance);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.17, 12), wood);
    table.position.set(0, 0.85, 0); pavilion.add(table);
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.24, 8), gold);
    tea.position.set(0, 1.05, 0); pavilion.add(tea);
    const elder = this.characterKit.create('elder');
    elder.position.set(-1.55, 0.2, 0.2);
    pavilion.add(elder);
    const bench = box(2.2, 0.35, 0.55, wood); bench.position.set(-1.7, 0.45, 0.5); pavilion.add(bench);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffba68, emissive: 0xff9b29, emissiveIntensity: 1.5 }));
    lantern.position.set(0, 2.55, 0); pavilion.add(lantern);
    const light = new THREE.PointLight(0xffb568, 2.4, 10); light.position.set(0, 2.4, 0); pavilion.add(light);
    for (const sx of [-2.2, 2.2]) {
      const silk = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xd96059, emissive: 0x9e302b, emissiveIntensity: 0.8
        }));
      silk.position.set(sx, 2.47, -1.0);
      silk.scale.y = 1.2;
      pavilion.add(silk);
    }
    this.group.add(pavilion);
  }

  private buildStalls(): void {
    const route = PHASE6_ROUTES[Phase6RouteId.shared];
    for (const [t, side, variant] of [[0.27, -1, 0], [0.39, 1, 1],
      [0.72, -1, 2], [0.83, 1, 3]] as const) {
      const p = route.getPointAt(t);
      const tangent = route.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const stall = this.marketKit.create(variant);
      stall.position.copy(p).addScaledVector(normal, side * 8.2);
      stall.position.y = 0;
      stall.rotation.y = Math.atan2(-normal.x * side, -normal.z * side);
      this.group.add(stall);
    }
  }

  private buildBackgroundFacades(): void {
    const route = PHASE6_ROUTES[Phase6RouteId.shared];
    for (const [t, side, variant] of [[0.22, -1, 0], [0.34, 1, 1],
      [0.5, -1, 2], [0.63, 1, 3], [0.76, -1, 1], [0.87, 1, 0]] as const) {
      const p = route.getPointAt(t);
      const tangent = route.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const facade = this.facadeKit.create(variant);
      facade.position.copy(p).addScaledVector(normal, side * 14);
      facade.position.y = -0.12;
      facade.rotation.y = Math.atan2(-normal.x * side, -normal.z * side);
      facade.scale.setScalar(0.82 + (variant % 2) * 0.06);
      this.group.add(facade);
    }
  }

  private buildPromenadeTrees(): void {
    const route = PHASE6_ROUTES[Phase6RouteId.shared];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x302c2a, roughness: 1 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffe8aa, emissive: 0xffbc51, emissiveIntensity: 2
    });
    const bulbs: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
      const t = 0.11 + i * 0.087;
      if (t > 0.48 && t < 0.65) continue; // keep the elder's tea porch readable
      const p = route.getPointAt(t);
      const tangent = route.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      for (const side of [-1, 1]) {
        const center = p.clone().addScaledVector(normal, side * (5.8 + (i % 2) * 0.5));
        const tree = new THREE.Group();
        tree.position.set(center.x, 0, center.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.57, 4.7, 8), trunkMat);
        trunk.position.y = 2.35;
        tree.add(trunk);
        for (const [dx, dy, dz, width, height, tone] of [
          [0, 5.8, 0, 5.3, 3.5, 0], [-1.5, 5.0, 0.28, 3.5, 2.6, 1],
          [1.4, 5.15, -0.24, 3.8, 2.7, 2]
        ]) {
          const crown = this.foliageKit.canopy(width, height, tone);
          crown.position.set(dx, dy, dz);
          tree.add(crown);
        }
        this.group.add(tree);
        for (let b = 0; b < 11; b++) {
          const angle = b * 2.4 + i;
          const height = 0.65 + b * 0.35;
          bulbs.push(new THREE.Vector3(center.x + Math.cos(angle) * 0.48, height,
            center.z + Math.sin(angle) * 0.48));
        }
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5),
      bulbMat, bulbs.length);
    const dummy = new THREE.Object3D();
    bulbs.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
  }

  private buildLanternStrings(): void {
    const route = PHASE6_ROUTES[Phase6RouteId.shared];
    const wireMat = new THREE.LineBasicMaterial({ color: 0x705036 });
    for (let row = 0; row < 7; row++) {
      const t = 0.16 + row * 0.12;
      const p = route.getPointAt(t);
      const tangent = route.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const wirePoints: THREE.Vector3[] = [];
      for (let j = 0; j <= 12; j++) {
        const fraction = j / 12;
        const span = (fraction - 0.5) * 14.6;
        const sag = Math.sin(fraction * Math.PI) * 0.54;
        const lightPosition = p.clone().addScaledVector(normal, span);
        lightPosition.y = 4.85 - sag;
        wirePoints.push(lightPosition);
        if (j > 0 && j < 12 && j % 2 === 0) {
          const lamp = this.lanternKit.create((row + j) % 4 === 0 ? 'carp' :
            (row + j) % 3 === 0 ? 'star' : 'paper');
          lamp.position.copy(lightPosition);
          lamp.position.y -= 0.18;
          this.group.add(lamp);
        }
      }
      this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints), wireMat));
    }
  }

  private buildFlowerEdges(): void {
    const colors = [0xf26676, 0xffcf6f, 0xffe7ae];
    const positions: THREE.Vector3[][] = [[], [], []];
    for (const [routeId, width] of [
      [Phase6RouteId.shared, 6.2], [Phase6RouteId.host, 4],
      [Phase6RouteId.guest, 4], [Phase6RouteId.hostRejoin, 4],
      [Phase6RouteId.guestRejoin, 4], [Phase6RouteId.final, 5.6]
    ] as const) {
      const route = PHASE6_ROUTES[routeId];
      const count = Math.ceil(route.getLength() / 1.3);
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const p = route.getPointAt(t);
        const tangent = route.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        for (const side of [-1, 1]) {
          const point = p.clone().addScaledVector(normal, side * (width / 2 + 0.43));
          point.y = 0.06;
          positions[(i + (side === 1 ? 1 : 0)) % 3].push(point);
        }
      }
    }
    const geometry = new THREE.DodecahedronGeometry(0.25, 0);
    positions.forEach((points, colorIndex) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[colorIndex], emissive: colors[colorIndex], emissiveIntensity: 0.75
      });
      this.flowerMaterials.push(material);
      const mesh = new THREE.InstancedMesh(geometry, material, points.length);
      const dummy = new THREE.Object3D();
      points.forEach((p, i) => {
        dummy.position.copy(p);
        dummy.rotation.y = i * 2.399;
        dummy.scale.set(1.15, 0.62, 0.95);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.group.add(mesh);
    });
  }

  private buildLaterRouteFraming(): void {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x332e2b, roughness: 1 });
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe3a0, emissive: 0xffbb55, emissiveIntensity: 1.8
    });
    const trunkGeometry = new THREE.CylinderGeometry(0.35, 0.5, 4.2, 7);
    const bulbGeometry = new THREE.SphereGeometry(0.075, 6, 5);
    const addTree = (parent: THREE.Group, x: number, z: number, scale: number, bulbCount: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2.1;
      tree.add(trunk);
      for (const [dx, dy, dz, size, tone] of [[0, 5.25, 0, 1, 0], [-1.45, 4.75, 0.2, 0.72, 1],
        [1.4, 4.8, -0.3, 0.75, 2]] as const) {
        const crown = this.foliageKit.canopy(4.5 * size, 3.1 * size, tone);
          crown.position.set(dx, dy, dz);
        tree.add(crown);
      }
      for (let i = 0; i < bulbCount; i++) {
        const bulb = new THREE.Mesh(bulbGeometry, lightMaterial);
        const angle = i * 2.43;
        bulb.position.set(Math.cos(angle) * 0.41, 0.7 + i * 0.41,
          Math.sin(angle) * 0.41);
        tree.add(bulb);
      }
      parent.add(tree);
    };
    const placePairs = (routeId: Phase6RouteId, parent: THREE.Group,
      stops: number[], offset: number, bulbs: number) => {
      const route = PHASE6_ROUTES[routeId];
      for (const t of stops) {
        const p = route.getPointAt(t);
        const tangent = route.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        for (const side of [-1, 1]) {
          const center = p.clone().addScaledVector(normal, side * offset);
          addTree(parent, center.x, center.z, side === -1 ? 0.92 : 1.05, bulbs);
        }
      }
    };
    placePairs(Phase6RouteId.host, this.hostScenery, [0.27, 0.64], 6, 5);
    placePairs(Phase6RouteId.guest, this.guestScenery, [0.28, 0.62], 6.5, 3);
    placePairs(Phase6RouteId.final, this.ceremonialScenery, [0.24, 0.65], 6, 11);
    const addSwag = (routeId: Phase6RouteId, parent: THREE.Group, stops: number[], intensity: number) => {
      const route = PHASE6_ROUTES[routeId];
      const wire = new THREE.LineBasicMaterial({ color: 0x62452e });
      void intensity;
      for (const t of stops) {
        const p = route.getPointAt(t);
        const tangent = route.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= 10; i++) {
          const f = i / 10;
          const point = p.clone().addScaledVector(normal, (f - 0.5) * 12.8);
          point.y = 5.0 - Math.sin(f * Math.PI) * 0.5;
          points.push(point);
          if (i > 0 && i < 10 && i % 2 === 0) {
            const lamp = this.lanternKit.create(i % 4 === 0 ? 'star' : 'paper');
            lamp.position.copy(point);
            parent.add(lamp);
          }
        }
        parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wire));
      }
    };
    addSwag(Phase6RouteId.host, this.hostScenery, [0.45], 0.8);
    addSwag(Phase6RouteId.guest, this.guestScenery, [0.4], 0.42);
    addSwag(Phase6RouteId.final, this.ceremonialScenery, [0.3], 1.65);
    this.group.add(this.hostScenery, this.guestScenery, this.ceremonialScenery);
  }

  private buildGuidanceLights(): void {
    const material = new THREE.MeshBasicMaterial({ color: 0xffd27a });
    const geometry = new THREE.SphereGeometry(0.085, 7, 5);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 31);
    gradient.addColorStop(0, 'rgba(255,247,195,1)');
    gradient.addColorStop(0.23, 'rgba(255,206,112,.8)');
    gradient.addColorStop(1, 'rgba(255,185,80,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    for (const [routeId, group] of [
      [Phase6RouteId.hostRejoin, this.hostGuide],
      [Phase6RouteId.guestRejoin, this.guestGuide]
    ] as const) {
      const route = PHASE6_ROUTES[routeId];
      for (let i = 0; i < 7; i++) {
        const t = 0.17 + i * 0.115;
        const p = route.getPointAt(t);
        const mote = new THREE.Mesh(geometry, material);
        mote.position.set(p.x + Math.sin(i * 2) * 0.34,
          0.85 + (i % 3) * 0.17, p.z + Math.cos(i * 2) * 0.34);
        mote.userData.baseY = mote.position.y;
        group.add(mote);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture, transparent: true, opacity: 0.45, depthWrite: false
        }));
        halo.position.copy(mote.position);
        halo.scale.set(0.34, 0.34, 1);
        halo.userData.baseY = halo.position.y;
        group.add(halo);
      }
    }
    this.reunionBeacon = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, transparent: true, opacity: 0.43, depthWrite: false
    }));
    this.reunionBeacon.position.set(158, 1.45, -82);
    this.reunionBeacon.scale.set(1.25, 1.25, 1);
    this.group.add(this.hostGuide, this.guestGuide, this.reunionBeacon);
    this.hostGuide.visible = this.guestGuide.visible = this.reunionBeacon.visible = false;
  }

  /** A low festival island gives the two routes a believable point of divergence. */
  private buildPromenadeOccluders(): void {
    const island = new THREE.Group();
    island.position.set(139, 0, -63);
    const curb = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.45, 32), stone);
    curb.position.y = 0.05;
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(3.12, 3.12, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x31483e, roughness: 1 }));
    bed.position.y = 0.32;
    island.add(curb, bed);

    const flowerColors = [0xef786f, 0xf7ba6d, 0xf1d39c];
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 2 / 16;
      const radius = 2.15 + (i % 3) * 0.26;
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5),
        new THREE.MeshStandardMaterial({ color: flowerColors[i % 3],
          emissive: flowerColors[i % 3], emissiveIntensity: 0.25 }));
      bloom.position.set(Math.cos(angle) * radius, 0.48, Math.sin(angle) * radius);
      island.add(bloom);
    }

    // A small lantern-craft stall supplies a believable, open route divider.
    const splitStall = this.marketKit.create(2);
    splitStall.scale.setScalar(0.7);
    splitStall.position.y = 0.38;
    splitStall.rotation.y = -Math.PI / 2;
    island.add(splitStall);
    this.group.add(island);
  }

  /** Secluded Moon Alcove at the end of Route B for Player B and the Moon Guardian */
  private buildMoonAlcove(): void {
    const alcove = this.moonAlcove;
    alcove.position.set(132, 0, -96);

    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = moonCanvas.height = 128;
    const moonContext = moonCanvas.getContext('2d')!;
    const moonGradient = moonContext.createRadialGradient(64, 64, 5, 64, 64, 63);
    moonGradient.addColorStop(0, 'rgba(255,245,210,.56)');
    moonGradient.addColorStop(0.18, 'rgba(245,219,171,.38)');
    moonGradient.addColorStop(0.52, 'rgba(149,168,185,.16)');
    moonGradient.addColorStop(1, 'rgba(110,145,166,0)');
    moonContext.fillStyle = moonGradient;
    moonContext.fillRect(0, 0, 128, 128);
    const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(moonCanvas), transparent: true,
      depthWrite: false, opacity: 0.9
    }));
    moonHalo.position.set(0, 5.5, -10.5);
    moonHalo.scale.set(8.8, 8.8, 1);
    alcove.add(moonHalo);
    const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(0.64, 40),
      new THREE.MeshBasicMaterial({ color: 0xffebc6, side: THREE.DoubleSide }));
    moonDisc.position.set(0, 5.5, -10.4);
    alcove.add(moonDisc);

    // A Moon-lit áo dài cutout, staged beside tea instead of a fantasy statue.
    const guardian = this.characterKit.create('guardian');
    guardian.position.set(-1.45, 0, -2.2);
    alcove.add(guardian);

    const teaTable = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.78, 0.14, 16), stone);
    teaTable.position.set(0.8, 0.75, -2.5);
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.25, 0.65, 10), stone);
    tableBase.position.set(0.8, 0.38, -2.5);
    alcove.add(teaTable, tableBase);
    const teaGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffda9a, emissive: 0xffaa45, emissiveIntensity: 1.3
      }));
    teaGlow.position.set(0.8, 1.02, -2.5);
    alcove.add(teaGlow);
    for (const x of [0.54, 1.08]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.13, 10),
        new THREE.MeshStandardMaterial({ color: 0xd9b98b, roughness: 0.45 }));
      cup.position.set(x, 0.88, -2.5);
      alcove.add(cup);
    }
    const bench = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.20, 8, 24, Math.PI * 0.72),
      stone);
    bench.rotation.x = Math.PI / 2;
    bench.rotation.z = 0.35;
    bench.position.set(0.1, 0.55, -5.6);
    alcove.add(bench);

    const moonPool = new THREE.Mesh(new THREE.CircleGeometry(3.9, 40),
      new THREE.MeshBasicMaterial({
        color: 0x9fc4c1, transparent: true, opacity: 0.085, depthWrite: false
      }));
    moonPool.rotation.x = -Math.PI / 2;
    moonPool.position.set(0, 0.16, -3.1);
    alcove.add(moonPool);
    const moonRing = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.034, 5, 64),
      new THREE.MeshBasicMaterial({ color: 0x9cb4ae, transparent: true, opacity: 0.37 }));
    moonRing.rotation.x = -Math.PI / 2;
    moonRing.position.set(0, 0.185, -2.35);
    alcove.add(moonRing);
    const steppingStone = new THREE.CylinderGeometry(0.43, 0.48, 0.055, 9);
    const steppingStoneMat = new THREE.MeshStandardMaterial({ color: 0x69716b, roughness: 1 });
    for (let i = 0; i < 5; i++) {
      const step = new THREE.Mesh(steppingStone, steppingStoneMat);
      step.position.set(-0.7 + Math.sin(i * 1.7) * 0.26, 0.18, 3.4 - i * 1.12);
      step.scale.set(0.9 + i * 0.04, 1, 0.7);
      alcove.add(step);
    }

    const grass = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x49634f, roughness: 1 }), 36);
    const grassDummy = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      const a = i * 2.399;
      const radius = 3.7 + (i % 4) * 0.55;
      grassDummy.position.set(Math.cos(a) * radius, 0.22,
        -2.5 + Math.sin(a) * radius);
      grassDummy.rotation.y = a;
      const size = 0.7 + (i % 3) * 0.18;
      grassDummy.scale.set(size, 0.26, size * 0.82);
      grassDummy.updateMatrix();
      grass.setMatrixAt(i, grassDummy.matrix);
    }
    grass.instanceMatrix.needsUpdate = true;
    grass.frustumCulled = false;
    alcove.add(grass);

    // Small paper backs frame the garden; the actual photographs live in the deck UI.
    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = 128; paperCanvas.height = 160;
    const pc = paperCanvas.getContext('2d')!;
    pc.fillStyle = '#f1e5cb'; pc.fillRect(5, 5, 118, 150);
    pc.fillStyle = '#324456'; pc.fillRect(15, 15, 98, 111);
    pc.strokeStyle = '#c6b88f'; pc.lineWidth = 2; pc.strokeRect(15, 15, 98, 111);
    pc.strokeStyle = '#d7c489'; pc.lineWidth = 4;
    pc.beginPath(); pc.arc(64, 70, 22, -1.1, 1.2); pc.stroke();
    pc.fillStyle = '#baa882'; pc.fillRect(35, 139, 58, 2);
    const paper = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(paperCanvas), side: THREE.DoubleSide,
      transparent: true, depthWrite: false, toneMapped: false
    });
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.Group();
      petal.position.set([-3.2, -2.35, 2.25, 3.1][i],
        2.2 + (i % 2) * 0.32, -4.9 - (i % 2) * 0.3);
      petal.rotation.y = -0.28 + i * 0.14;
      petal.rotation.z = (i % 2 ? 1 : -1) * 0.075;
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.52), paper);
      petal.add(card);
      this.memoryPetals.push(petal);
      alcove.add(petal);
    }
    // Two low lotus lamps echo the children's lanterns without crowding the quiet garden.
    for (const [x, z] of [[-3.1, -0.15], [3.15, -0.65]] as const) {
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.38, 9, 6),
        new THREE.MeshStandardMaterial({ color: 0xb98b6e, roughness: 0.8 }));
      bowl.position.set(x, 0.47, z);
      bowl.scale.y = 0.34;
      alcove.add(bowl);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffdb9c, emissive: 0xffae51,
          emissiveIntensity: 1.15 }));
      flame.position.set(x, 0.68, z);
      alcove.add(flame);
    }

    // Warm stone lanterns flanking the terrace
    for (const sx of [-4.5, 4.5]) {
      const base = box(0.6, 0.9, 0.6, stone); base.position.set(sx, 0.45, -1);
      const cap = box(0.9, 0.2, 0.9, stone); cap.position.set(sx, 0.95, -1);
      const lightOrb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffe299, emissive: 0xffb84d, emissiveIntensity: 1.4 }));
      lightOrb.position.set(sx, 1.25, -1);
      alcove.add(base, cap, lightOrb);
    }

    // Soft moonlit point light in the alcove
    const alcoveLight = new THREE.PointLight(0xaec7f0, 1.6, 16);
    alcoveLight.position.set(0, 3.5, -2);
    alcove.add(alcoveLight);

    // A pair of broad trees frame the terrace without a pointed fence silhouette.
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x33352f, roughness: 1 });
    for (const [x, z, scale] of [[-6.2, -4.5, 1], [6.3, -5.1, 1.12]] as const) {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 5.4, 8), trunkMat);
      trunk.position.y = 2.7;
      tree.add(trunk);
      for (const [dx, dy, dz, size, tone] of [[0, 6.5, 0, 2.8, 0], [-1.8, 5.8, 0.2, 2.1, 1],
        [1.9, 5.7, 0.3, 2.3, 2]] as const) {
        const crown = this.foliageKit.canopy(size * 2.1, size * 1.45, tone);
        crown.position.set(dx, dy, dz);
        tree.add(crown);
      }
      for (let b = 0; b < 12; b++) {
        const angle = b * 2.43;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 5),
          new THREE.MeshStandardMaterial({
            color: 0xffe6ae, emissive: 0xffbb58, emissiveIntensity: 1.8
          }));
        bead.position.set(Math.cos(angle) * 0.55, 0.8 + b * 0.34,
          Math.sin(angle) * 0.55);
        tree.add(bead);
      }
      alcove.add(tree);
    }

    for (const x of [-6.5, 6.6]) {
      const bamboo = this.foliageKit.bamboo(3.0, 5.5);
      bamboo.position.set(x, 0.08, 1.8);
      alcove.add(bamboo);
    }
    this.group.add(alcove);
  }

  private buildGate(): THREE.Group {
    const gate = new THREE.Group(); gate.position.copy(INNER_GATE_POSITION);
    const frame = new THREE.MeshStandardMaterial({
      color: 0xfbbf5b, metalness: 0.38, roughness: 0.31,
      emissive: 0xe39837, emissiveIntensity: 0.78
    });
    const brightInlay = new THREE.MeshBasicMaterial({ color: 0xffdf93 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x283d4c, metalness: 0.25, roughness: 0.38,
      transparent: true, opacity: 0.88, side: THREE.DoubleSide
    });
    this.gateGlass = glass;
    for (const z of [-4.15, 4.15]) {
      const upright = box(0.58, 6.45, 0.55, frame);
      upright.position.set(0, 3.25, z);
      gate.add(upright);
      const inlay = box(0.035, 5.95, 0.065, brightInlay);
      inlay.position.set(-0.32, 3.12, z + (z < 0 ? 0.29 : -0.29));
      gate.add(inlay);
      const capital = box(0.8, 0.16, 0.92, frame);
      capital.position.set(0, 6.48, z);
      gate.add(capital);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.9, 0.34, 12), stone);
      foot.position.set(0, 0.16, z);
      gate.add(foot);
    }
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 6.25, -4.2), new THREE.Vector3(0, 7.35, -2.9),
      new THREE.Vector3(0, 8.15, 0), new THREE.Vector3(0, 7.35, 2.9),
      new THREE.Vector3(0, 6.25, 4.2)
    ]);
    gate.add(new THREE.Mesh(new THREE.TubeGeometry(archCurve, 48, 0.22, 8), frame));
    const outerInlay = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, 6.38, -4.08), new THREE.Vector3(-0.24, 7.48, -2.85),
      new THREE.Vector3(-0.24, 8.27, 0), new THREE.Vector3(-0.24, 7.48, 2.85),
      new THREE.Vector3(-0.24, 6.38, 4.08)
    ]);
    gate.add(new THREE.Mesh(new THREE.TubeGeometry(outerInlay, 48, 0.047, 6), brightInlay));
    const traceMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4c875, emissive: 0xf9b74d, emissiveIntensity: 0.12,
      metalness: 0.35, roughness: 0.3
    });
    this.gateTraces.push(traceMaterial);
    const innerArch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.17, 6.0, -3.75), new THREE.Vector3(-0.17, 7.04, -2.65),
      new THREE.Vector3(-0.17, 7.71, 0), new THREE.Vector3(-0.17, 7.04, 2.65),
      new THREE.Vector3(-0.17, 6.0, 3.75)
    ]);
    gate.add(new THREE.Mesh(new THREE.TubeGeometry(innerArch, 48, 0.055, 6), traceMaterial));
    const crest = new THREE.Mesh(crestStar, traceMaterial);
    crest.position.set(-0.22, 8.28, 0);
    crest.rotation.y = Math.PI / 2;
    crest.scale.setScalar(1.05);
    gate.add(crest);
    for (const side of [-1, 1]) {
      const cloud = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.24, 6.62, side * 0.9),
        new THREE.Vector3(-0.24, 6.86, side * 1.42),
        new THREE.Vector3(-0.24, 6.68, side * 2.05),
        new THREE.Vector3(-0.24, 6.83, side * 2.42),
        new THREE.Vector3(-0.24, 6.63, side * 2.76)
      ]);
      gate.add(new THREE.Mesh(new THREE.TubeGeometry(cloud, 24, 0.055, 6), brightInlay));
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xd85655, emissive: 0xb24536,
          emissiveIntensity: 0.8, roughness: 0.65 }));
      lantern.position.set(-0.3, 5.62, side * 2.8);
      lantern.scale.set(0.82, 1.15, 0.82);
      gate.add(lantern);
      const tassel = box(0.025, 0.28, 0.025, brightInlay);
      tassel.position.set(-0.3, 5.12, side * 2.8);
      gate.add(tassel);
    }
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(0, 0, side * 3.75);
      const leaf = box(0.16, 5.8, 3.65, glass);
      leaf.position.set(0, 3.0, -side * 1.825);
      hinge.add(leaf);
      const edging = box(0.08, 5.7, 0.07, frame);
      edging.position.set(-0.11, 3.0, -side * 0.08);
      hinge.add(edging);
      const goldLine = box(0.035, 5.1, 0.035, traceMaterial);
      goldLine.position.set(-0.15, 3.0, -side * 3.34);
      hinge.add(goldLine);
      for (const y of [1.48, 4.92]) {
        const panel = box(0.025, 0.035, 2.85, brightInlay);
        panel.position.set(-0.19, y, -side * 1.825);
        hinge.add(panel);
      }
      this.gateLeaves.push(hinge);
      gate.add(hinge);
    }

    const hazeCanvas = document.createElement('canvas');
    hazeCanvas.width = hazeCanvas.height = 256;
    const ctx = hazeCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 145, 10, 128, 145, 150);
    gradient.addColorStop(0, '#fff5bb');
    gradient.addColorStop(0.35, '#dba963');
    gradient.addColorStop(0.7, '#7b5368');
    gradient.addColorStop(1, '#18263f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const hazeTexture = new THREE.CanvasTexture(hazeCanvas);
    hazeTexture.colorSpace = THREE.SRGBColorSpace;
    this.gateHaze = new THREE.Mesh(new THREE.PlaneGeometry(7.55, 6.2),
      new THREE.MeshBasicMaterial({ map: hazeTexture, transparent: true, opacity: 0.2,
        side: THREE.DoubleSide, depthWrite: false }));
    this.gateHaze.rotation.y = Math.PI / 2;
    this.gateHaze.position.set(0.75, 3.1, 0);
    gate.add(this.gateHaze);
    const veilCanvas = document.createElement('canvas');
    veilCanvas.width = veilCanvas.height = 128;
    const veilContext = veilCanvas.getContext('2d')!;
    const veilGradient = veilContext.createRadialGradient(64, 73, 4, 64, 73, 62);
    veilGradient.addColorStop(0, 'rgba(255,242,185,.85)');
    veilGradient.addColorStop(0.32, 'rgba(244,190,111,.45)');
    veilGradient.addColorStop(0.72, 'rgba(169,118,135,.13)');
    veilGradient.addColorStop(1, 'rgba(169,118,135,0)');
    veilContext.fillStyle = veilGradient;
    veilContext.fillRect(0, 0, 128, 128);
    this.gateVeil = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(veilCanvas), transparent: true,
      opacity: 0, depthWrite: false
    }));
    this.gateVeil.position.set(-0.48, 3.0, 0);
    this.gateVeil.scale.set(7.2, 7.2, 1);
    gate.add(this.gateVeil);
    for (const side of [-1, 1]) {
      const signal = new THREE.Sprite(new THREE.SpriteMaterial({
        map: (this.gateVeil.material as THREE.SpriteMaterial).map,
        color: 0xffd48a, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      signal.position.set(-1.28, 1.55, side * 2.25);
      signal.scale.set(0.7, 0.7, 1);
      gate.add(signal);
      this.gateSignals.push(signal);
    }

    for (const [name, z] of [['socket_host', -2.25], ['socket_guest', 2.25]] as const) {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.57, 1.18, 12),
        new THREE.MeshStandardMaterial({ color: 0x786d68, roughness: 0.8 }));
      plinth.position.set(-1.18, 0.59, z);
      gate.add(plinth);
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.21, 7, 5), frame);
        petal.position.set(-1.18 + Math.cos(angle) * 0.36, 1.25,
          z + Math.sin(angle) * 0.36);
        petal.scale.set(0.55, 1.1, 0.72);
        gate.add(petal);
      }
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10),
        new THREE.MeshStandardMaterial({
          color: 0xe8c077, emissive: 0xb47732, emissiveIntensity: 0.25,
          roughness: 0.4
        }));
      socket.name = name;
      socket.position.set(-1.18, 1.43, z);
      gate.add(socket);
    }
    this.group.add(gate); return gate;
  }

  public setStoryVisibility(routeId: Phase6RouteId): void {
    this.gatePanel.visible = routeId === Phase6RouteId.host ||
      routeId === Phase6RouteId.hostRejoin || routeId === Phase6RouteId.final;
    this.moonAlcove.visible = routeId === Phase6RouteId.guest ||
      routeId === Phase6RouteId.guestRejoin;
    this.hostScenery.visible = routeId === Phase6RouteId.host ||
      routeId === Phase6RouteId.hostRejoin;
    this.guestScenery.visible = routeId === Phase6RouteId.guest ||
      routeId === Phase6RouteId.guestRejoin;
    this.ceremonialScenery.visible = routeId === Phase6RouteId.final;
  }

  public setCrowdDensity(progress: number, shared = true): void {
    const density = THREE.MathUtils.clamp((progress - 0.22) / 0.7, 0, 1);
    if (shared && this.separationElapsed < 0) {
      this.crowdApproach = THREE.MathUtils.clamp((progress - 0.77) / 0.19, 0, 1);
    }
    this.midCrowd.forEach((actor, i) => { actor.visible = shared && i < 4 + Math.floor(density * 18); });
    this.nearCrowd.forEach((actor, i) => { actor.visible = shared && i < Math.floor(density * 8); });
    this.splitCrowd.forEach((actor, i) => {
      actor.visible = shared ? density > 0.72 && i < Math.floor(density * 16) : true;
    });
    this.farCrowd.count = shared ? Math.floor(density * 56) : 0;
  }

  public setLightMood(glow: number): void {
    this.flowerMaterials.forEach(material => {
      material.emissiveIntensity = glow;
    });
  }

  public setGuidance(routeId: Phase6RouteId, active: boolean, progress: number): void {
    this.hostGuide.visible = active && routeId === Phase6RouteId.hostRejoin;
    this.guestGuide.visible = active && routeId === Phase6RouteId.guestRejoin;
    this.reunionBeacon.visible = this.hostGuide.visible || this.guestGuide.visible;
    if (this.reunionBeacon.visible) {
      const scale = 1.0 + progress * 0.8;
      this.reunionBeacon.scale.set(scale, scale, 1);
    }
  }

  public beginSeparation(): void { if (this.separationElapsed < 0) this.separationElapsed = 0; }

  public update(delta: number, time: number): void {
    this.crowdMotion += delta;
    this.gateActivation = THREE.MathUtils.damp(this.gateActivation,
      this.gateReady ? 1 : 0, 1.35, delta);
    this.gateLeaves.forEach((leaf, index) => {
      leaf.rotation.y = (index === 0 ? -1 : 1) *
        (this.gateActivation * 0.18 + this.gateRevealProgress * 1.25);
    });
    this.gateTraces.forEach(material => {
      material.emissiveIntensity = 0.12 + this.gateActivation * 1.3;
    });
    this.gateGlass.opacity = 0.88 - this.gateActivation * 0.5;
    const idleHaze = this.ceremonialScenery.visible ? 0.42 : 0.2;
    (this.gateHaze.material as THREE.MeshBasicMaterial).opacity =
      (idleHaze + this.gateActivation * (0.95 - idleHaze + Math.sin(time * 1.3) * 0.05)) *
      (1 - this.gateRevealProgress * 0.92);
    (this.gateVeil.material as THREE.SpriteMaterial).opacity =
      ((this.ceremonialScenery.visible ? 0.2 : 0) +
      this.gateActivation * (0.35 + Math.sin(time * 1.5) * 0.05)) *
      (1 - this.gateRevealProgress);
    this.memoryPetals.forEach((petal, i) => {
      petal.position.y = 2.3 + (i % 2) * 0.35 + Math.sin(time * 0.8 + i * 1.4) * 0.12;
      petal.rotation.z = Math.sin(time * 0.5 + i) * 0.08;
    });
    for (const guide of [this.hostGuide, this.guestGuide]) {
      guide.children.forEach((mote, i) => {
        mote.position.y = mote.userData.baseY + Math.sin(time * 1.3 + i * 1.6) * 0.15;
      });
    }
    for (const [crowd, pace] of [[this.nearCrowd, 0.65], [this.midCrowd, 0.4],
      [this.splitCrowd, 0.32]] as const) {
      crowd.forEach((actor, i) => {
        actor.position.x = actor.userData.baseX + Math.sin(time * pace + i * 2.4) * 0.32;
        actor.position.z = actor.userData.baseZ + Math.cos(time * pace * 0.7 + i) * 0.16;
        actor.position.y = Math.sin(time * 2.1 + i) * 0.035;
        this.crowdKit.animateActor(actor, time, i * 0.73);
      });
    }
    if (this.separationElapsed < 0) {
      // The same three paper crowd sheets drift across the sightline before
      // the route divides; the other lantern disappears only after this swell.
      this.crossingGroups.forEach((band, i) => {
        const u = THREE.MathUtils.clamp((this.crowdApproach - i * 0.13) / 0.74, 0, 1);
        band.visible = u > 0.02;
        band.position.x = 134 + i * 2.2 + (1 - u) * 2.5;
        band.position.z = -57 - i * 1.2 + u * 8;
        band.children.forEach((visitor, j) => this.crowdKit.animateActor(visitor as THREE.Group, time, i + j * .6));
      });
      return;
    }
    this.separationElapsed += delta;
    this.crossingGroups.forEach((band, i) => {
      const u = THREE.MathUtils.clamp((this.separationElapsed - i * 0.22) / 1.3, 0, 1);
      band.visible = u > 0 && u < 1;
      band.position.x = 134 + i * 2.2 - u * 7;
      band.position.z = -49 - i * 1.2 + u * 5;
    });
  }

  public setGatePresence(host: boolean, guest: boolean, ready: boolean): void {
    this.gateReady = ready;
    this.gateSockets.forEach((socket, index) => {
      const material = socket.material as THREE.MeshStandardMaterial;
      const present = index === 0 ? host : guest;
      material.emissive.setHex(ready ? 0xe9b65c : present ? 0xbd8241 : 0x543512);
      material.emissiveIntensity = ready ? 1.15 : present ? 0.72 : 0.25;
    });
  }

  public setGateRevealProgress(progress: number): void {
    this.gateRevealProgress = THREE.MathUtils.clamp(progress, 0, 1);
  }

  public setGateCeremony(progress: number): void {
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    this.gateSignals.forEach((signal, index) => {
      const travel = THREE.MathUtils.clamp((t - 0.16) / 0.67, 0, 1);
      const eased = travel * travel * (3 - 2 * travel);
      signal.position.set(-1.28 + eased * 0.84, 1.55 + eased * 2.0,
        (index === 0 ? -1 : 1) * 2.25 * (1 - eased));
      (signal.material as THREE.SpriteMaterial).opacity =
        Math.sin(travel * Math.PI) * 0.88;
    });
  }

  public dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        geometries.add(child.geometry);
        const list = Array.isArray(child.material) ? child.material : [child.material];
        list.forEach(material => materials.add(material));
      }
      if (child instanceof THREE.Sprite) materials.add(child.material);
    });
    materials.forEach(material => {
      if ('map' in material && material.map instanceof THREE.Texture) {
        textures.add(material.map);
      }
      material.dispose();
    });
    textures.add(this.roadTexture);
    geometries.forEach(geometry => geometry.dispose());
    textures.forEach(texture => texture.dispose());
    this.crowdKit.dispose();
  }
}
