import * as THREE from 'three';
import { IScene } from './BaseScene';
import { TimeTravelScene } from './TimeTravelScene';
import { LanternCraftingScene } from './LanternCraftingScene';
import { DoorRevealScene } from './DoorRevealScene';
import { VillageWalkScene } from './VillageWalkScene';
import { FestivalSquareScene } from './FestivalSquareScene';
import { ModernArrivalScene } from './ModernArrivalScene';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CraftingUI } from '../ui/CraftingUI';

export enum GameSceneId {
  TIME_TRAVEL = 0,
  LANTERN_CRAFTING = 1,
  DOOR_REVEAL = 2,
  VILLAGE_WALK = 3,
  FESTIVAL_SQUARE = 4,
  MODERN_ARRIVAL = 5
}

export class SceneManager {
  private camera: THREE.PerspectiveCamera;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  public currentScene: IScene | null = null;
  public currentSceneId: GameSceneId = GameSceneId.TIME_TRAVEL;

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    craftingUI: CraftingUI
  ) {
    this.camera = camera;
    this.overlay = overlay;
    this.craftingUI = craftingUI;
  }

  public goToScene(sceneId: GameSceneId) {
    console.log('[SCENE MANAGER] Switching from', this.currentSceneId, 'to', sceneId);
    if (this.currentScene) {
      this.currentScene.destroy();
    }

    this.currentSceneId = sceneId;

    switch (sceneId) {
      case GameSceneId.TIME_TRAVEL:
        this.currentScene = new TimeTravelScene(this.camera, this.overlay, () => {
          this.goToScene(GameSceneId.LANTERN_CRAFTING);
        });
        break;

      case GameSceneId.LANTERN_CRAFTING:
        this.currentScene = new LanternCraftingScene(
          this.camera,
          this.overlay,
          this.craftingUI,
          () => {
            this.goToScene(GameSceneId.DOOR_REVEAL);
          }
        );
        break;

      case GameSceneId.DOOR_REVEAL:
        this.currentScene = new DoorRevealScene(
          this.camera,
          this.overlay,
          () => {
            this.goToScene(GameSceneId.VILLAGE_WALK);
          }
        );
        break;

      case GameSceneId.VILLAGE_WALK:
        this.currentScene = new VillageWalkScene(
          this.camera,
          this.overlay,
          () => {
            this.goToScene(GameSceneId.FESTIVAL_SQUARE);
          }
        );
        break;

      case GameSceneId.FESTIVAL_SQUARE:
        this.currentScene = new FestivalSquareScene(
          this.camera,
          this.overlay,
          () => {
            this.goToScene(GameSceneId.MODERN_ARRIVAL);
          }
        );
        break;

      case GameSceneId.MODERN_ARRIVAL:
        this.currentScene = new ModernArrivalScene(
          this.camera,
          this.overlay,
          () => {
            console.log('[SCENE MANAGER] Modern Arrival (Phase 4A) Complete! Ready for Iteration B.');
          }
        );
        break;
    }

    if (this.currentScene) {
      this.currentScene.init();
    }
  }

  public update(delta: number, time: number) {
    if (this.currentScene) {
      this.currentScene.update(delta, time);
    }
  }

  public getActiveThreeScene(): THREE.Scene | null {
    return this.currentScene ? this.currentScene.scene : null;
  }
}
