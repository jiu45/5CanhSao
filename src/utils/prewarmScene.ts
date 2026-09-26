import * as THREE from 'three';

/** Upload a future scene in small offscreen batches while the current scene plays. */
export function prewarmScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene): () => void {
  const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 500);
  camera.position.set(0, 16, 45);
  camera.lookAt(30, 6, -20);
  const target = new THREE.WebGLRenderTarget(4, 4);
  const groups: Array<{ object: THREE.Group; visible: boolean }> = [];
  const active: Array<{ object: THREE.Object3D; visible: boolean;
    frustumCulled: boolean }> = [];
  const hidden: typeof active = [];
  scene.traverse(object => {
    if (object instanceof THREE.Group) {
      groups.push({ object, visible: object.visible });
    }
    if (object instanceof THREE.Mesh || object instanceof THREE.Line ||
      object instanceof THREE.Points || object instanceof THREE.Sprite) {
      let ancestor = object.parent;
      let hiddenByGroup = false;
      while (ancestor && ancestor !== scene) {
        if (!ancestor.visible) hiddenByGroup = true;
        ancestor = ancestor.parent;
      }
      (hiddenByGroup ? hidden : active).push({ object, visible: object.visible,
        frustumCulled: object.frustumCulled });
      object.visible = false;
    }
  });
  const renderables = [...active, ...hidden];
  let next = 0;
  let timer = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    renderables.forEach(({ object, visible, frustumCulled }) => {
      object.visible = visible; object.frustumCulled = frustumCulled;
    });
    groups.forEach(({ object, visible }) => { object.visible = visible; });
    target.dispose();
  };
  const warmBatch = () => {
    if (stopped) return;
    if (next === active.length) groups.forEach(({ object }) => { object.visible = true; });
    const limit = next < active.length ? Math.min(active.length, next + 12) : next + 12;
    const batch = renderables.slice(next, limit);
    batch.forEach(({ object }) => {
      object.visible = true; object.frustumCulled = false;
    });
    const previousTarget = renderer.getRenderTarget();
    let failed = false;
    try {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    } catch (error) {
      console.warn('[Scene prewarm] Offscreen batch skipped:', error);
      failed = true;
    } finally {
      renderer.setRenderTarget(previousTarget);
      batch.forEach(({ object }) => { object.visible = false; });
    }
    if (failed) { stop(); return; }
    next += batch.length;
    if (next < renderables.length) timer = window.setTimeout(warmBatch, 55);
    else stop();
  };
  timer = window.setTimeout(warmBatch, 55);
  return stop;
}
