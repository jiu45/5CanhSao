import * as THREE from 'three';
import { AppRenderer } from './Renderer';
import { SceneManager, GameSceneId } from '../scenes/SceneManager';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CraftingUI } from '../ui/CraftingUI';
import { AudienceGate } from '../ui/AudienceGate';
import { chooseGuest } from '../content/AudienceMode';

export class Game {
  public renderer: AppRenderer;
  private sceneManager: SceneManager;
  private overlay: StoryOverlay;
  private craftingUI: CraftingUI;
  private clock: THREE.Clock;
  private audienceGate: AudienceGate | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new AppRenderer(container);
    this.overlay = new StoryOverlay();
    this.craftingUI = new CraftingUI();
    this.sceneManager = new SceneManager(
      this.renderer.camera,
      this.overlay,
      this.craftingUI,
      this.renderer
    );
    this.clock = new THREE.Clock();

    // Check URL query parameters for fast scene jumping and multiplayer room invites
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get('scene');
    const roomParam = params.get('room');

    let startScene: GameSceneId = GameSceneId.TIME_TRAVEL;
    if (sceneParam !== null) {
      const parsed = parseInt(sceneParam, 10);
      startScene = isNaN(parsed) ? GameSceneId.TIME_TRAVEL : (parsed as GameSceneId);
    } else if (roomParam && roomParam.trim().length > 0) {
      // Intercept ?room= to launch Cooperative Festival scene directly
      startScene = GameSceneId.COOPERATIVE_FESTIVAL;
    }

    // Start with requested Scene or default Scene 0 (Time Travel)
    if (startScene !== GameSceneId.TIME_TRAVEL && params.get('mock') !== 'true') {
      // A room link or resumed scene starts after the same choice, without replaying the dedication.
      this.audienceGate = new AudienceGate(!!roomParam);
      this.audienceGate.show(() => {
        this.audienceGate = null;
        this.sceneManager.goToScene(startScene);
      });
    } else {
      if (params.get('mock') === 'true') chooseGuest();
      this.sceneManager.goToScene(startScene);
    }

    // Expose for automated browser inspection
    (window as unknown as { game: Game; sceneManager: SceneManager }).game = this;
    (window as unknown as { game: Game; sceneManager: SceneManager }).sceneManager = this.sceneManager;

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    this.sceneManager.update(delta, elapsedTime);

    const activeScene = this.sceneManager.getActiveThreeScene();
    if (activeScene) {
      this.renderer.render(activeScene);
    }
    if (!this.sceneManager.isTerminal()) requestAnimationFrame(this.animate);
  }
}
