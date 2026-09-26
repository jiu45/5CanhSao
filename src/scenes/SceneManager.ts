import * as THREE from 'three';
import { IScene } from './BaseScene';
import { TimeTravelScene } from './TimeTravelScene';
import { LanternCraftingScene } from './LanternCraftingScene';
import { DoorRevealScene } from './DoorRevealScene';
import { VillageWalkScene } from './VillageWalkScene';
import { FestivalSquareScene } from './FestivalSquareScene';
import { ModernArrivalScene } from './ModernArrivalScene';
import { CooperativeFestivalScene } from './CooperativeFestivalScene';
import { Phase6FestivalScene } from './Phase6FestivalScene';
import { GrandFestivalScene } from './GrandFestivalScene';
import type { Phase7GateHandoff } from './Phase6FestivalScene';
import { RoomManager } from '../multiplayer/RoomManager';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CraftingUI } from '../ui/CraftingUI';
import { prewarmScene } from '../utils/prewarmScene';
import { disposeSceneResources } from '../utils/disposeSceneResources';

export enum GameSceneId {
  TIME_TRAVEL = 0,
  LANTERN_CRAFTING = 1,
  DOOR_REVEAL = 2,
  VILLAGE_WALK = 3,
  FESTIVAL_SQUARE = 4,
  MODERN_ARRIVAL = 5,
  COOPERATIVE_FESTIVAL = 6,
  FESTIVAL_PROMENADE = 7,
  GRAND_FESTIVAL = 8
}

export class SceneManager {
  private camera: THREE.PerspectiveCamera;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  public currentScene: IScene | null = null;
  public currentSceneId: GameSceneId = GameSceneId.TIME_TRAVEL;
  private preparedModernArrival: ModernArrivalScene | null = null;
  private stopModernPrewarm: (() => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    craftingUI: CraftingUI
  ) {
    this.camera = camera;
    this.overlay = overlay;
    this.craftingUI = craftingUI;
  }

  public goToScene(sceneId: GameSceneId, existingRoom?: RoomManager,
    inheritedSwitches?: { local: boolean; remote: boolean },
    phase7Handoff?: Phase7GateHandoff) {
    console.log('[SCENE MANAGER] Switching from', this.currentSceneId, 'to', sceneId);
    if (sceneId === GameSceneId.MODERN_ARRIVAL) {
      this.stopModernPrewarm?.();
      this.stopModernPrewarm = null;
    }
    if (this.currentScene) {
      const retired = this.currentScene;
      retired.destroy();
      // Scenes 0–6 own their artwork. Phase 6 hands its scene to Phase 7.
      if (this.currentSceneId <= GameSceneId.COOPERATIVE_FESTIVAL) {
        disposeSceneResources(retired.scene);
      }
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
          },
          () => this.prepareModernArrival()
        );
        break;

      case GameSceneId.MODERN_ARRIVAL:
        this.currentScene = this.preparedModernArrival ?? new ModernArrivalScene(
          this.camera,
          this.overlay,
          () => {
            this.goToScene(GameSceneId.COOPERATIVE_FESTIVAL);
          }
        );
        this.preparedModernArrival = null;
        break;

      case GameSceneId.COOPERATIVE_FESTIVAL:
        const phase5 = new CooperativeFestivalScene(
          this.camera,
          this.overlay,
          () => {
            this.overlay.hideNextButton();
            this.goToScene(GameSceneId.FESTIVAL_PROMENADE,
              phase5.transferRoomManager(), phase5.getSwitchState());
          }
        );
        this.currentScene = phase5;
        break;

      case GameSceneId.FESTIVAL_PROMENADE:
        this.currentScene = new Phase6FestivalScene(this.camera, this.overlay, existingRoom,
          inheritedSwitches, handoff => {
            this.goToScene(GameSceneId.GRAND_FESTIVAL, handoff.roomManager, undefined, handoff);
          });
        break;

      case GameSceneId.GRAND_FESTIVAL:
        this.currentScene = new GrandFestivalScene(this.camera, this.overlay, phase7Handoff);
        break;
    }

    if (this.currentScene) {
      this.currentScene.init();
    }
  }

  private prepareModernArrival(): void {
    if (this.preparedModernArrival) return;
    const prepared = new ModernArrivalScene(this.camera, this.overlay, () => {
      this.goToScene(GameSceneId.COOPERATIVE_FESTIVAL);
    });
    prepared.prepareVisuals();
    this.preparedModernArrival = prepared;
    const renderer = (window as unknown as { game?: { renderer?: { renderer?: THREE.WebGLRenderer } } })
      .game?.renderer?.renderer;
    if (!renderer) return;
    this.stopModernPrewarm = prewarmScene(renderer, prepared.scene);
  }

  public update(delta: number, time: number) {
    if (this.currentScene) {
      this.currentScene.update(delta, time);
    }
  }

  public getActiveThreeScene(): THREE.Scene | null {
    if (this.currentScene instanceof GrandFestivalScene && this.currentScene.isFinished) return null;
    return this.currentScene ? this.currentScene.scene : null;
  }

  public isTerminal(): boolean {
    return this.currentScene instanceof GrandFestivalScene && this.currentScene.isFinished;
  }
}
