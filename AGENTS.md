- Never turn this project into an open-world game.
- Preserve Vietnamese cultural identity.
- Preserve the lantern as the central visual motif.
- Prefer cinematic composition over technical complexity.
- Use 2.5D when it improves visual quality/performance.
- Never sacrifice important visual storytelling merely to simplify implementation.
- Always run and visually inspect important scene changes.
- Do not mark a scene complete just because it technically works.
- Keep the architecture modular.
- Do not add unnecessary dependencies.
- Do not use copyrighted/ripped assets.

IMPORTANT NOTES ON PRESERVING INTEGRITY (ANTI-REGRESSION & SCOPE ISOLATION):

1. DO NOT MODIFY ORIGINAL CONFIGURATION FILES (RENDERER / COMPOSER CONFIG):
- Strictly avoid changing default initial values ​​in the shared Renderer or Post-processing configuration files (e.g., Bloom, ToneMapping). 
- Any adjustments to Bloom or Fog must be handled exclusively within the Ascent script (Phase 3C) using dynamic tweening/interpolation, and values ​​must revert to the original state if the player replays earlier scenes.

2. ISOLATE NEW ASSETS:
- Particles and meshes intended for the ascending camera sequence must be contained entirely within an independent component or Group (e.g., `ascentTransitionGroup`). 
- Thoroughly eliminate defective square particles by removing them from the Phase 3C group; do not overwrite or modify the particle systems belonging to Phase 1 or Phase 2.

3. REGRESSION TESTING:
- After finalizing Scene 3C, re-test the Lighting Scene (Scene 1) and the Bamboo Path Walk (Scene 2) to ensure that lighting and colors remain 100% consistent with the previously approved visuals.