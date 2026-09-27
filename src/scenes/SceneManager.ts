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
import { disposeSceneResources } from '../utils/disposeSceneResources';
import { prepareSceneForReveal, primeSceneFirstFrame } from '../utils/prepareSceneForReveal';
import { SceneTransitionCurtain } from '../ui/SceneTransitionCurtain';
import type { AppRenderer } from '../core/Renderer';

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

interface PreparedEarlyScene {
  id: GameSceneId;
  scene: IScene;
  cameraPose: THREE.PerspectiveCamera;
  ready: Promise<void>;
}

export class SceneManager {
  private camera: THREE.PerspectiveCamera;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  public currentScene: IScene | null = null;
  public currentSceneId: GameSceneId = GameSceneId.TIME_TRAVEL;
  private preparedModernArrival: ModernArrivalScene | null = null;
  private modernPreparation: Promise<void> | null = null;
  private preparedEarlyScene: PreparedEarlyScene | null = null;
  private pastHandoffPending = false;
  private transitionPending = false;
  private renderPaused = false;
  private readonly curtain = new SceneTransitionCurtain();

  constructor(
    camera: THREE.PerspectiveCamera,
    overlay: StoryOverlay,
    craftingUI: CraftingUI,
    private readonly appRenderer: AppRenderer
  ) {
    this.camera = camera;
    this.overlay = overlay;
    this.craftingUI = craftingUI;
  }

  public goToScene(sceneId: GameSceneId, existingRoom?: RoomManager,
    inheritedSwitches?: { local: boolean; remote: boolean },
    phase7Handoff?: Phase7GateHandoff) {
    console.log('[SCENE MANAGER] Switching from', this.currentSceneId, 'to', sceneId);
    if (this.currentScene) {
      const retired = this.currentScene;
      retired.destroy();
      // Phase 6 alone transfers its Three.js world into Phase 7.
      const worldTransferred = this.currentSceneId === GameSceneId.FESTIVAL_PROMENADE
        && sceneId === GameSceneId.GRAND_FESTIVAL && !!phase7Handoff;
      if (!worldTransferred) {
        disposeSceneResources(retired.scene);
      }
    }

    const earlyScene = this.preparedEarlyScene?.id === sceneId
      ? this.preparedEarlyScene : null;
    if (earlyScene) {
      this.restoreCameraPose(earlyScene.cameraPose);
      this.preparedEarlyScene = null;
      if (earlyScene.scene instanceof FestivalSquareScene) {
        earlyScene.scene.adoptCamera(this.camera);
      }
    }

    this.currentSceneId = sceneId;

    switch (sceneId) {
      case GameSceneId.TIME_TRAVEL:
        this.currentScene = new TimeTravelScene(this.camera, this.overlay, () => {
          void this.transitionToScene(GameSceneId.LANTERN_CRAFTING);
        }, () => this.prepareEarlyScene(GameSceneId.LANTERN_CRAFTING));
        break;

      case GameSceneId.LANTERN_CRAFTING:
        this.currentScene = earlyScene?.scene ?? new LanternCraftingScene(
          this.camera,
          this.overlay,
          this.craftingUI,
          () => {
            void this.transitionToScene(GameSceneId.DOOR_REVEAL);
          },
          () => this.prepareEarlyScene(GameSceneId.DOOR_REVEAL)
        );
        break;

      case GameSceneId.DOOR_REVEAL:
        this.currentScene = earlyScene?.scene ?? new DoorRevealScene(
          this.camera,
          this.overlay,
          () => {
            void this.transitionToScene(GameSceneId.VILLAGE_WALK);
          },
          () => this.prepareEarlyScene(GameSceneId.VILLAGE_WALK)
        );
        break;

      case GameSceneId.VILLAGE_WALK:
        this.currentScene = earlyScene?.scene ?? new VillageWalkScene(
          this.camera,
          this.overlay,
          () => {
            void this.transitionToScene(GameSceneId.FESTIVAL_SQUARE);
          }
        );
        break;

      case GameSceneId.FESTIVAL_SQUARE:
        this.currentScene = earlyScene?.scene ?? new FestivalSquareScene(
          this.camera,
          this.overlay,
          () => {
            void this.finishPastToPresent();
          },
          () => this.prepareModernArrival()
        );
        break;

      case GameSceneId.MODERN_ARRIVAL:
        this.currentScene = this.preparedModernArrival ?? new ModernArrivalScene(
          this.camera,
          this.overlay,
          () => {
            void this.transitionToScene(GameSceneId.COOPERATIVE_FESTIVAL);
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
            void this.transitionToScene(GameSceneId.FESTIVAL_PROMENADE,
              phase5.transferRoomManager(), phase5.getSwitchState());
          }
        );
        this.currentScene = phase5;
        break;

      case GameSceneId.FESTIVAL_PROMENADE:
        this.currentScene = new Phase6FestivalScene(this.camera, this.overlay, existingRoom,
          inheritedSwitches, handoff => {
            void this.transitionToScene(GameSceneId.GRAND_FESTIVAL,
              handoff.roomManager, undefined, handoff);
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

  private restoreCameraPose(pose: THREE.PerspectiveCamera): void {
    this.camera.position.copy(pose.position);
    this.camera.quaternion.copy(pose.quaternion);
    this.camera.up.copy(pose.up);
    this.camera.near = pose.near;
    this.camera.far = pose.far;
    this.camera.fov = pose.fov;
    this.camera.aspect = pose.aspect;
    this.camera.zoom = pose.zoom;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /** Build the next memory during an existing story beat, without starting its UI. */
  private prepareEarlyScene(id: GameSceneId): void {
    if (this.preparedEarlyScene?.id === id || id < GameSceneId.LANTERN_CRAFTING ||
      id > GameSceneId.FESTIVAL_SQUARE) return;
    const playingPose = this.camera.clone();
    let scene: IScene;
    let cameraPose: THREE.PerspectiveCamera;
    let stagingCamera: THREE.PerspectiveCamera | null = null;
    try {
      if (id === GameSceneId.LANTERN_CRAFTING) {
        scene = new LanternCraftingScene(this.camera, this.overlay, this.craftingUI,
          () => { void this.transitionToScene(GameSceneId.DOOR_REVEAL); },
          () => this.prepareEarlyScene(GameSceneId.DOOR_REVEAL));
      } else if (id === GameSceneId.DOOR_REVEAL) {
        scene = new DoorRevealScene(this.camera, this.overlay,
          () => { void this.transitionToScene(GameSceneId.VILLAGE_WALK); },
          () => this.prepareEarlyScene(GameSceneId.VILLAGE_WALK));
      } else if (id === GameSceneId.VILLAGE_WALK) {
        scene = new VillageWalkScene(this.camera, this.overlay,
          () => { void this.transitionToScene(GameSceneId.FESTIVAL_SQUARE); });
      } else {
        stagingCamera = this.camera.clone();
        scene = new FestivalSquareScene(stagingCamera, this.overlay,
          () => { void this.finishPastToPresent(); },
          () => this.prepareModernArrival());
      }
      cameraPose = stagingCamera ?? this.camera.clone();
    } catch (error) {
      console.warn('[Scene transition] Early scene build skipped:', error);
      return;
    } finally {
      this.restoreCameraPose(playingPose);
    }
    const ready = prepareSceneForReveal(this.appRenderer.renderer, scene.scene, cameraPose)
      .then(() => scene.prepareAlternateViews?.(this.appRenderer.renderer))
      .catch(error => console.warn('[Scene transition] Early GPU preparation skipped:', error));
    this.preparedEarlyScene = { id, scene, cameraPose, ready };
  }

  private async transitionToScene(sceneId: GameSceneId, existingRoom?: RoomManager,
    inheritedSwitches?: { local: boolean; remote: boolean },
    phase7Handoff?: Phase7GateHandoff): Promise<void> {
    if (this.transitionPending) return;
    this.transitionPending = true;
    const mood = sceneId === GameSceneId.GRAND_FESTIVAL ? 'gate'
      : sceneId <= GameSceneId.FESTIVAL_SQUARE ? 'memory' : 'moon';
    try {
      await this.curtain.cover(mood);
      // Let the compositor animate the moon while WebGL prepares the next view.
      // Rendering the retired scene here competes with shader compilation.
      this.renderPaused = true;
      if (this.preparedEarlyScene?.id === sceneId) {
        await this.preparedEarlyScene.ready;
      }
      this.goToScene(sceneId, existingRoom, inheritedSwitches, phase7Handoff);
      if (this.currentScene) {
        try {
          await prepareSceneForReveal(this.appRenderer.renderer,
            this.currentScene.scene, this.camera);
          await this.currentScene.prepareAlternateViews?.(this.appRenderer.renderer);
          primeSceneFirstFrame(this.appRenderer.renderer,
            this.currentScene.scene, this.camera);
          if (sceneId === GameSceneId.VILLAGE_WALK) {
            // Construct the next courtyard while the current curtain is opaque.
            // Its shaders finish compiling while the player walks the village path.
            this.prepareEarlyScene(GameSceneId.FESTIVAL_SQUARE);
          }
        } catch (error) {
          console.warn('[Scene transition] GPU preparation skipped:', error);
        }
      }
    } catch (error) {
      console.error('[Scene transition] Scene swap failed:', error);
    } finally {
      this.renderPaused = false;
      await this.curtain.reveal();
      this.transitionPending = false;
    }
  }

  private prepareModernArrival(): void {
    if (this.preparedModernArrival || this.modernPreparation) return;
    // The authored Phase 3C silver veil takes 3.5 seconds to close. Build after it
    // is opaque, then hold that image until shaders and textures are ready.
    this.modernPreparation = new Promise<void>(resolve =>
      window.setTimeout(resolve, 3600)).then(async () => {
      if (this.currentSceneId !== GameSceneId.FESTIVAL_SQUARE) return;
      const prepared = new ModernArrivalScene(this.camera, this.overlay, () => {
        void this.transitionToScene(GameSceneId.COOPERATIVE_FESTIVAL);
      });
      prepared.prepareVisuals();
      this.preparedModernArrival = prepared;
      try {
        await prepareSceneForReveal(this.appRenderer.renderer, prepared.scene, this.camera);
        await prepared.prepareAlternateViews(this.appRenderer.renderer);
        const handoffCamera = this.camera.clone();
        handoffCamera.position.set(0, 10, 10);
        handoffCamera.lookAt(0, 16.5, -24);
        handoffCamera.far = 350;
        handoffCamera.updateProjectionMatrix();
        primeSceneFirstFrame(this.appRenderer.renderer, prepared.scene, handoffCamera);
      } catch (error) {
        console.warn('[Scene transition] Modern arrival GPU preparation skipped:', error);
      }
    }).catch(error => console.error('[Scene transition] Modern arrival preparation:', error));
  }

  private async finishPastToPresent(): Promise<void> {
    if (this.pastHandoffPending) return;
    this.pastHandoffPending = true;
    try {
      if (this.modernPreparation) await this.modernPreparation;
      this.goToScene(GameSceneId.MODERN_ARRIVAL);
    } finally {
      this.pastHandoffPending = false;
    }
  }

  public update(delta: number, time: number) {
    if (this.transitionPending || this.pastHandoffPending) return;
    if (this.currentScene) {
      this.currentScene.update(delta, time);
    }
  }

  public getActiveThreeScene(): THREE.Scene | null {
    if (this.renderPaused) return null;
    if (this.currentScene instanceof GrandFestivalScene && this.currentScene.isFinished) return null;
    return this.currentScene ? this.currentScene.scene : null;
  }

  public isTerminal(): boolean {
    return this.currentScene instanceof GrandFestivalScene && this.currentScene.isFinished;
  }
}
