import * as THREE from 'three';

/** Release resources owned by one retired scene. Never call on a transferred scene. */
export function disposeSceneResources(scene: THREE.Scene): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight ||
      object instanceof THREE.PointLight) {
      object.shadow.map?.dispose();
      object.shadow.mapPass?.dispose();
    }
    const drawable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (!drawable.material) return;
    for (const material of Array.isArray(drawable.material)
      ? drawable.material : [drawable.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}
