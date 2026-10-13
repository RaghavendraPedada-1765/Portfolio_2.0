# Raghavendra Pedada — Enter the Grand Line

A full-screen One Piece portfolio with a cinematic harbor-to-portal opening, the detailed Thousand Sunny, ten selectable Straw Hat models, floating Devil Fruit project objects, a personal Wanted poster, and a Den Den Mushi contact scene.

## Preview
Serve `dist/` over HTTP: `python -m http.server 5174 --bind 127.0.0.1 --directory dist`.

## Implementation
- `dist/index.html`, `cinematic.css`: entrance, responsive scene interface and accessible dialogs.
- `dist/experience.js`: portfolio content, destinations, crew selection and opt-in audio.
- `dist/grand-line.js`: Three.js ocean, camera choreography, model loading and interactions.
- `dist/lite.html`, `style.css`, `app.js`, `scene.js`: text-rich Lite alternative with a link to the cinematic version.
- `dist/assets/models/`: optimized user-provided ship, harbor and crew GLB assets.
- `dist/assets/audio/`: user-provided music and character cues; silent until enabled.
- `dist/vendor/`: local Three.js r168 modules, loaders, postprocessing and Draco decoder.

Scroll or use the destination buttons to travel; drag to change the viewpoint. Crew and project selections have dedicated controls. Details open in native dialogs with Escape support. The menu includes reduced motion, replay and Lite access. Smaller screens use lower pixel density and disable bloom by default. Models load on demand and are cached during the visit. Some source character models have animations; others retain their supplied poses. Luffy uses a stable pose to avoid the source jump animation's root motion.

Identity, education, IFB experience, project descriptions, skills, photo, résumé and social links come from the existing portfolio at the previous portfolio. Project flows are conceptual, with no invented metrics. Downloaded assets came from the user's Downloads folder; originals remain unchanged. Harbor geometry and textures were reduced; Nami was converted to standard glTF PBR materials; large crew textures were resized. Source asset author/license metadata was not supplied. The Devil Fruit, portal and telephone snail geometry are custom implementation assets.

Publish the `dist/` directory on a static web host. No build step or backend is required. Google Fonts have local system fallbacks.

Robin and Brook now use user-provided Mixamo Hip Hop FBX rigs and animation. Materials were restored from the original GLBs, scale normalized, textures embedded, and meshes compressed with Draco. Editable packed Blender sources are retained separately in `source-assets/rigged-crew/`.

Robin uses a custom gentle idle derived from the new rig, avoiding leg-through-skirt intersections in the supplied dance. Her original dance action remains in the Blender source. Brook plays the supplied Hip Hop dance. Reduced motion pauses both.
