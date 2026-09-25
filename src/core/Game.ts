import * as THREE from 'three';
import { AppRenderer } from './Renderer';
import { SceneManager, GameSceneId } from '../scenes/SceneManager';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CraftingUI } from '../ui/CraftingUI';

export class Game {
  public renderer: AppRenderer;
  private sceneManager: SceneManager;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.renderer = new AppRenderer(container);
    this.overlay = new StoryOverlay();
    this.craftingUI = new CraftingUI();
    this.sceneManager = new SceneManager(
      this.renderer.camera,
      this.overlay,
      this.craftingUI
    );
    this.clock = new THREE.Clock();

    // Check URL query parameters for fast scene jumping during testing
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get('scene');
    const startScene = sceneParam !== null ? parseInt(sceneParam, 10) : GameSceneId.TIME_TRAVEL;

    // Start with requested Scene or default Scene 0 (Time Travel)
    this.sceneManager.goToScene(isNaN(startScene) ? GameSceneId.TIME_TRAVEL : startScene);

    // Expose for automated browser inspection
    (window as unknown as { game: Game; sceneManager: SceneManager }).game = this;
    (window as unknown as { game: Game; sceneManager: SceneManager }).sceneManager = this.sceneManager;

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    this.sceneManager.update(delta, elapsedTime);

    const activeScene = this.sceneManager.getActiveThreeScene();
    if (activeScene) {
      this.renderer.render(activeScene);
    }
  }
}
