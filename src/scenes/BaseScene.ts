import * as THREE from 'three';

export interface IScene {
  init(): void;
  update(delta: number, time: number): void;
  destroy(): void;
  scene: THREE.Scene;
}
