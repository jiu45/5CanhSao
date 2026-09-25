import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';

export class RoomDiorama {
  public group: THREE.Group;
  public tableGroup: THREE.Group;
  public doorLeft: THREE.Group;
  public doorRight: THREE.Group;
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
    this.buildWindow();
    this.buildWoodenWorkbench();
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
    }

    // 3. Spool of thin wire (cuộn dây kẽm mảnh)
    const spoolGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xb5945a, metalness: 0.6, roughness: 0.35 });
    const spool = new THREE.Mesh(spoolGeo, wireMat);
    spool.position.set(-0.55, 0.885, 0.5);
    spool.castShadow = true;
    this.tableGroup.add(spool);

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
    }

    this.group.add(this.tableGroup);
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
    const dummy = new THREE.Object3D();
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
