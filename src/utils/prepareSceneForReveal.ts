import * as THREE from 'three';

const yieldToBrowser = () => new Promise<void>(resolve => window.setTimeout(resolve, 16));

/** Compile the variants used by EffectComposer's linear scene render target. */
export async function compileForComposer(renderer: THREE.WebGLRenderer,
  scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
  const compileTarget = new THREE.WebGLRenderTarget(4, 4);
  const previousTarget = renderer.getRenderTarget();
  let compilation: Promise<unknown>;
  try {
    renderer.setRenderTarget(compileTarget);
    // compileAsync registers the programs synchronously, then waits for the GPU.
    // Release the target immediately so the currently playing scene may render.
    compilation = renderer.compileAsync(scene, camera);
  } catch (error) {
    compileTarget.dispose();
    throw error;
  } finally {
    renderer.setRenderTarget(previousTarget);
  }
  try {
    await compilation;
  } finally {
    compileTarget.dispose();
  }
}

/** Compile scene shaders and upload canvas textures before the curtain opens. */
export async function prepareSceneForReveal(renderer: THREE.WebGLRenderer,
  scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
  await compileForComposer(renderer, scene, camera);

  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    const drawable = object as THREE.Object3D & { material?: THREE.Material | THREE.Material[] };
    if (!drawable.material) return;
    const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && value.source.data && !value.isRenderTargetTexture) {
          textures.add(value);
        }
      }
    }
  });

  let uploaded = 0;
  for (const texture of textures) {
    renderer.initTexture(texture);
    if (++uploaded % 6 === 0) await yieldToBrowser();
  }
  // The normal composer gets a hidden frame to initialize geometry and bloom buffers.
  await yieldToBrowser();
  await yieldToBrowser();
}

/** Warm the first camera view offscreen while an authored veil is fully opaque. */
export function primeSceneFirstFrame(renderer: THREE.WebGLRenderer,
  scene: THREE.Scene, camera: THREE.Camera): void {
  const target = new THREE.WebGLRenderTarget(4, 4);
  const previous = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
  }
}
