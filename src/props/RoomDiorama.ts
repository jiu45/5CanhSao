import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';

export class RoomDiorama {
  public group: THREE.Group;
  public tableGroup: THREE.Group;
  public doorLeft: THREE.Group;
  public doorRight: THREE.Group;
  public illustratedBackdrop!: THREE.Mesh;
  public craftTargets: THREE.Mesh[] = [];
  private craftHalos: THREE.Mesh[] = [];
  private craftMaterials: THREE.Object3D[][] = [[], [], [], []];
  private craftOrigins: { object: THREE.Object3D; position: THREE.Vector3; scale: THREE.Vector3 }[] = [];
  private craftFlights: { object: THREE.Object3D; position: THREE.Vector3; scale: THREE.Vector3; elapsed: number }[] = [];
  private readonly craftArrival = new THREE.Vector3(0, 1.32, 0.1);
  private readonly dustDummy = new THREE.Object3D();
  public dustParticles!: THREE.InstancedMesh;
  private particleCount: number = 90;
  private particlePositions: THREE.Vector3[] = [];
  private particleSpeeds: THREE.Vector3[] = [];

  // Materials
  private woodMat: THREE.MeshStandardMaterial;
  private darkWoodMat: THREE.MeshStandardMaterial;
  private wallMat: THREE.MeshStandardMaterial;
  private floorMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.tableGroup = new THREE.Group();
    this.doorLeft = new THREE.Group();
    this.doorRight = new THREE.Group();

    // Stylized painterly materials
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x825430,
      roughness: 0.75
    });

    this.darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x482d1a,
      roughness: 0.8
    });

    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x162238, // Moody midnight blue-indigo adobe wall
      roughness: 0.9
    });

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x241812, // Dark rural earthen floor
      roughness: 0.85
    });

    this.buildRoomShell();
    this.buildIllustratedWall();
    this.buildWindow();
    this.buildWoodenWorkbench();
    this.buildCraftTargets();
    this.buildWoodenDoors();
    this.buildProps();
    this.buildDustMotes();
  }

  private buildRoomShell() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Back wall split with realistic doorway opening
    // Door opening: width 2.2 (-1.1 to 1.1), height 3.6 (0 to 3.6)
    const wallLeftGeo = new THREE.BoxGeometry(3.9, 6, 0.2);
    const wallLeft = new THREE.Mesh(wallLeftGeo, this.wallMat);
    wallLeft.position.set(-3.05, 3, -5);
    wallLeft.receiveShadow = true;
    this.group.add(wallLeft);

    const wallRightGeo = new THREE.BoxGeometry(3.9, 6, 0.2);
    const wallRight = new THREE.Mesh(wallRightGeo, this.wallMat);
    wallRight.position.set(3.05, 3, -5);
    wallRight.receiveShadow = true;
    this.group.add(wallRight);

    const wallTopGeo = new THREE.BoxGeometry(2.2, 2.4, 0.2);
    const wallTop = new THREE.Mesh(wallTopGeo, this.wallMat);
    wallTop.position.set(0, 4.8, -5);
    wallTop.receiveShadow = true;
    this.group.add(wallTop);

    // Left wall (with window)
    const leftWallGeo = new THREE.BoxGeometry(0.2, 6, 10);
    const leftWall = new THREE.Mesh(leftWallGeo, this.wallMat);
    leftWall.position.set(-5, 3, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right wall
    const rightWallGeo = new THREE.BoxGeometry(0.2, 6, 10);
    const rightWall = new THREE.Mesh(rightWallGeo, this.wallMat);
    rightWall.position.set(5, 3, 0);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Wooden ceiling rafters
    for (let z = -4; z <= 4; z += 1.6) {
      const rafterGeo = new THREE.BoxGeometry(10, 0.25, 0.25);
      const rafter = new THREE.Mesh(rafterGeo, this.darkWoodMat);
      rafter.position.set(0, 5.8, z);
      this.group.add(rafter);
    }
  }

  private buildIllustratedWall(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    const wall = ctx.createLinearGradient(0, 0, 0, 640);
    wall.addColorStop(0, '#152941'); wall.addColorStop(1, '#29344a');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#493a37';
    ctx.fillRect(0, 0, 1024, 35); ctx.fillRect(0, 560, 1024, 34);
    for (let x = 45; x < 1024; x += 110) {
      ctx.fillStyle = 'rgba(123,92,67,.24)'; ctx.fillRect(x, 0, 8, 640);
    }
    // A paper-cut window keeps the same moon visible from the opening pages.
    ctx.fillStyle = '#493b35'; ctx.fillRect(90, 90, 410, 360);
    ctx.fillStyle = '#294761'; ctx.fillRect(112, 110, 366, 315);
    ctx.fillStyle = '#dce6df'; ctx.beginPath(); ctx.arc(294, 230, 65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(239,236,205,.13)';
    ctx.beginPath(); ctx.moveTo(112, 425); ctx.lineTo(502, 425);
    ctx.lineTo(790, 640); ctx.lineTo(214, 640); ctx.fill();
    ctx.strokeStyle = '#584438'; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(294, 100); ctx.lineTo(294, 433);
    ctx.moveTo(104, 270); ctx.lineTo(486, 270); ctx.stroke();
    ctx.strokeStyle = '#122b3c'; ctx.lineWidth = 8;
    for (let x = 125; x < 485; x += 70) {
      ctx.beginPath(); ctx.moveTo(x, 435); ctx.quadraticCurveTo(x - 26, 280, x + 15, 112); ctx.stroke();
    }
    ctx.fillStyle = '#162d3b';
    for (let x = 154; x < 475; x += 88) {
      ctx.beginPath(); ctx.moveTo(x, 325); ctx.lineTo(x - 45, 305);
      ctx.lineTo(x - 4, 345); ctx.fill();
    }
    // Small ceramic vessels and a woven shelf provide human scale.
    ctx.fillStyle = '#745847'; ctx.fillRect(585, 395, 350, 20);
    ctx.fillStyle = '#493b36'; ctx.fillRect(605, 415, 15, 100); ctx.fillRect(916, 415, 15, 100);
    ctx.fillStyle = '#a28061';
    ctx.beginPath(); ctx.moveTo(650, 345); ctx.lineTo(710, 345);
    ctx.lineTo(700, 395); ctx.lineTo(660, 395); ctx.fill();
    ctx.fillStyle = '#79543e';
    ctx.beginPath(); ctx.moveTo(780, 325); ctx.lineTo(855, 325);
    ctx.lineTo(840, 397); ctx.lineTo(794, 397); ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 4.2),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    backdrop.position.set(0, 2.05, -1.6);
    this.illustratedBackdrop = backdrop;
    this.group.add(backdrop);
  }

  private buildWindow() {
    // Window frame on left wall
    const frameGeo = new THREE.BoxGeometry(0.3, 2.2, 2.2);
    const frame = new THREE.Mesh(frameGeo, this.darkWoodMat);
    frame.position.set(-4.9, 3.2, 0);
    this.group.add(frame);

    // Vertical wooden slats (song cửa sổ)
    for (let z = -0.8; z <= 0.8; z += 0.32) {
      const slatGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8);
      const slat = new THREE.Mesh(slatGeo, this.woodMat);
      slat.position.set(-4.9, 3.2, z);
      slat.castShadow = true;
      this.group.add(slat);
    }
  }

  private buildWoodenWorkbench() {
    // Tactile wood texture with bump map
    const woodTex = TextureGenerator.createWoodTexture('#4e321e', '#29180c');
    const woodBump = TextureGenerator.createWoodTexture('#888888', '#111111');
    const benchMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      bumpMap: woodBump,
      bumpScale: 0.04,
      roughness: 0.82
    });

    // 1. Rustic wooden tabletop / Chõng tre mặt gỗ (2.4m x 1.5m, height 0.82m)
    const topGeo = new THREE.BoxGeometry(2.4, 0.08, 1.5);
    const top = new THREE.Mesh(topGeo, benchMat);
    top.position.set(0, 0.82, 0.1);
    top.castShadow = true;
    top.receiveShadow = true;
    this.tableGroup.add(top);

    // A woven rush mat under the materials makes the handmade work legible.
    const matCanvas = document.createElement('canvas');
    matCanvas.width = matCanvas.height = 256;
    const ctx = matCanvas.getContext('2d')!;
    ctx.fillStyle = '#a88960'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 12) {
      ctx.fillStyle = y % 24 === 0 ? '#c9aa74' : '#9b7d55';
      ctx.fillRect(0, y, 256, 7);
      ctx.fillStyle = 'rgba(32,53,72,.43)';
      ctx.fillRect(0, y + 8, 256, 2);
    }
    for (let x = 0; x < 256; x += 8) {
      ctx.fillStyle = x % 16 === 0 ? 'rgba(239,209,152,.33)' : 'rgba(56,49,44,.23)';
      ctx.fillRect(x, 0, 2, 256);
    }
    const matTexture = new THREE.CanvasTexture(matCanvas);
    matTexture.colorSpace = THREE.SRGBColorSpace;
    const rushMat = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.36),
      new THREE.MeshStandardMaterial({ map: matTexture, roughness: 1, side: THREE.DoubleSide,
        emissive: 0x5b3924, emissiveIntensity: 0.16 }));
    rushMat.rotation.x = -Math.PI / 2;
    rushMat.position.set(0, 0.864, 0.1);
    rushMat.receiveShadow = true;
    this.tableGroup.add(rushMat);

    // Sturdy wooden/bamboo legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.82, 12);
    [[-1.05, 0.41, -0.6], [1.05, 0.41, -0.6], [-1.05, 0.41, 0.7], [1.05, 0.41, 0.7]].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, this.darkWoodMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.tableGroup.add(leg);
    });

    // 2. 10 whittled bamboo rods laid neatly on the left side of table
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xd4a762, roughness: 0.65 });
    for (let i = 0; i < 10; i++) {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 1.25, 8),
        rodMat
      );
      rod.rotation.x = Math.PI / 2;
      rod.position.set(-0.95 + (i % 5) * 0.07, 0.875, -0.3 + Math.floor(i / 5) * 0.65);
      rod.castShadow = true;
      this.tableGroup.add(rod);
      this.registerCraftMaterial(0, rod);
    }

    // 3. Spool of thin wire (cuộn dây kẽm mảnh)
    const spoolGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xb5945a, metalness: 0.6, roughness: 0.35 });
    const spool = new THREE.Mesh(spoolGeo, wireMat);
    spool.position.set(-0.55, 0.885, 0.5);
    spool.castShadow = true;
    this.tableGroup.add(spool);
    this.registerCraftMaterial(2, spool);

    // 4. Ceramic bowl of cold rice paste glue (bát sành Bát Tràng quết hồ dán cơm nguội)
    const bowlGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.08, 24);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x3d3228, // rustic dark glazed stoneware
      roughness: 0.45,
      metalness: 0.1
    });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(0.85, 0.895, 0.45);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    this.tableGroup.add(bowl);

    // White sticky rice paste inside bowl
    const glueGeo = new THREE.CircleGeometry(0.1, 24);
    const glueMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ea, roughness: 0.85 });
    const glue = new THREE.Mesh(glueGeo, glueMat);
    glue.rotation.x = -Math.PI / 2;
    glue.position.set(0.85, 0.93, 0.45);
    this.tableGroup.add(glue);

    // Whittled bamboo applicator stick resting across the bowl rim (que tre quết hồ)
    const stickGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xd4a762, roughness: 0.6 });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.rotation.z = Math.PI / 2;
    stick.rotation.y = 0.4;
    stick.position.set(0.85, 0.94, 0.45);
    stick.castShadow = true;
    this.tableGroup.add(stick);

    // 5. Pre-cut translucent red-orange cellophane sheets lying on the table
    const sheetGeo = new THREE.PlaneGeometry(0.3, 0.4);
    const sheetMat = new THREE.MeshPhysicalMaterial({
      color: 0xee3a12,
      roughness: 0.15,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85
    });
    for (let s = 0; s < 3; s++) {
      const sheet = new THREE.Mesh(sheetGeo, sheetMat);
      sheet.rotation.x = -Math.PI / 2;
      sheet.rotation.z = 0.2 * s;
      sheet.position.set(0.72 + s * 0.1, 0.865 + s * 0.005, -0.28);
      this.tableGroup.add(sheet);
      this.registerCraftMaterial(1, sheet);
    }

    this.group.add(this.tableGroup);
  }

  private buildCraftTargets(): void {
    // The fourth prop is a small matchbox; all four halo areas are tappable
    // directly in the diorama, including on a phone-sized screen.
    const matchbox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xae4932, roughness: 0.95 }));
    matchbox.position.set(0.34, 0.89, 0.52);
    this.tableGroup.add(matchbox);
    this.registerCraftMaterial(3, matchbox);
    const positions: [number, number][] = [[-0.82, -0.23], [0.83, -0.22],
      [-0.55, 0.49], [0.34, 0.52]];
    for (let i = 0; i < positions.length; i++) {
      const [x, z] = positions[i];
      const pick = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0,
          depthWrite: false, side: THREE.DoubleSide }));
      pick.rotation.x = -Math.PI / 2;
      pick.position.set(x, 0.925, z);
      pick.userData.craftStep = i + 1;
      this.tableGroup.add(pick);
      this.craftTargets.push(pick);

      const halo = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.3, 40),
        new THREE.MeshBasicMaterial({ color: 0xffd78c, transparent: true,
          opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(x, 0.927, z);
      this.tableGroup.add(halo);
      this.craftHalos.push(halo);
    }
    this.setCraftStep(0);
  }

  public setCraftStep(step: number): void {
    this.craftHalos.forEach((halo, index) => { halo.visible = index === step; });
    if (step === 0) {
      this.craftFlights = [];
      this.craftOrigins.forEach(({ object, position, scale }) => {
        object.position.copy(position);
        object.scale.copy(scale);
        object.visible = true;
      });
      return;
    }
    const materials = this.craftMaterials[step - 1] ?? [];
    materials.forEach(object => {
      this.craftFlights.push({
        object,
        position: object.position.clone(),
        scale: object.scale.clone(),
        elapsed: 0
      });
    });
  }

  private registerCraftMaterial(stepIndex: number, object: THREE.Object3D): void {
    this.craftMaterials[stepIndex].push(object);
    this.craftOrigins.push({
      object,
      position: object.position.clone(),
      scale: object.scale.clone()
    });
  }

  private buildWoodenDoors() {
    // Door opening frame in back wall
    const doorH = 3.6;
    const doorW = 1.1;

    // Door Left hinge
    this.doorLeft.position.set(-doorW, 0, -4.85);
    const doorLMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, doorH, 0.08),
      this.darkWoodMat
    );
    doorLMesh.position.set(doorW / 2, doorH / 2, 0);
    doorLMesh.castShadow = true;
    doorLMesh.receiveShadow = true;
    this.doorLeft.add(doorLMesh);

    // Door Right hinge
    this.doorRight.position.set(doorW, 0, -4.85);
    const doorRMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, doorH, 0.08),
      this.darkWoodMat
    );
    doorRMesh.position.set(-doorW / 2, doorH / 2, 0);
    doorRMesh.castShadow = true;
    doorRMesh.receiveShadow = true;
    this.doorRight.add(doorRMesh);

    this.group.add(this.doorLeft);
    this.group.add(this.doorRight);
  }

  private buildProps() {
    // Small wooden stool (ghế đẩu gỗ mộc cạnh chõng tre)
    const stoolTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), this.woodMat);
    stoolTop.position.set(0, 0.6, 1.1);
    stoolTop.castShadow = true;
    this.group.add(stoolTop);

    const stoolLeg = new THREE.BoxGeometry(0.06, 0.6, 0.06);
    [[-0.18, 0.3, 0.92], [0.18, 0.3, 0.92], [-0.18, 0.3, 1.28], [0.18, 0.3, 1.28]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(stoolLeg, this.darkWoodMat);
      leg.position.set(x, y, z);
      this.group.add(leg);
    });
  }

  private buildDustMotes() {
    const geo = new THREE.SphereGeometry(0.007, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe6f4ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustParticles = new THREE.InstancedMesh(geo, mat, this.particleCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.particleCount; i++) {
      const pos = new THREE.Vector3(
        -3.5 + Math.random() * 4.5,
        1.0 + Math.random() * 2.8,
        -1.5 + Math.random() * 3.0
      );
      this.particlePositions.push(pos);
      this.particleSpeeds.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.08
        )
      );

      dummy.position.copy(pos);
      dummy.updateMatrix();
      this.dustParticles.setMatrixAt(i, dummy.matrix);
    }
    this.dustParticles.instanceMatrix.needsUpdate = true;
    this.group.add(this.dustParticles);
  }

  public update(delta: number) {
    for (let i = this.craftFlights.length - 1; i >= 0; i--) {
      const flight = this.craftFlights[i];
      flight.elapsed = Math.min(0.62, flight.elapsed + delta);
      const t = flight.elapsed / 0.62;
      const eased = t * t * (3 - 2 * t);
      flight.object.position.lerpVectors(flight.position, this.craftArrival, eased);
      flight.object.scale.copy(flight.scale).multiplyScalar(1 - 0.84 * eased);
      if (t >= 1) {
        flight.object.visible = false;
        this.craftFlights.splice(i, 1);
      }
    }
    const dummy = this.dustDummy;
    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.particlePositions[i];
      const speed = this.particleSpeeds[i];

      pos.addScaledVector(speed, delta);

      // Boundaries inside the moonbeam cone
      if (pos.x > 1.5) pos.x = -3.5;
      if (pos.x < -3.5) pos.x = 1.5;
      if (pos.y > 3.8) pos.y = 1.0;
      if (pos.y < 1.0) pos.y = 3.8;
      if (pos.z > 2.0) pos.z = -1.5;
      if (pos.z < -1.5) pos.z = 2.0;

      dummy.position.copy(pos);
      dummy.updateMatrix();
      this.dustParticles.setMatrixAt(i, dummy.matrix);
    }
    this.dustParticles.instanceMatrix.needsUpdate = true;
  }

  public setDoorsOpenProgress(progress: number) {
    // 0 = closed, 1 = fully open
    const angle = progress * (Math.PI * 0.55);
    this.doorLeft.rotation.y = -angle;
    this.doorRight.rotation.y = angle;
  }
}
