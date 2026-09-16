# JavaScript Game Programming for Kids
## Colorful Quarto edition: Dynamic 2D and 3D

An 18-chapter, student-facing textbook with diagrams, playable companion projects, original assets, and optional Advanced Study callouts. The original ten chapters are retained. Chapters 11-18 extend the progression into complete 2D game development and Three.js/Rapier 3D games. There are no teacher-note sections.

## Read and play

The included `preview.html` is a self-contained HTML reading edition generated from the Quarto manuscript with Pandoc. It includes the diagrams and styling; it is **not a native Quarto build**. The project links inside it work when the complete folder is served locally.

With Node.js installed, run from this folder:

```bash
node scripts/serve.mjs
```

Then visit:

- `http://127.0.0.1:8000/preview.html` - complete reading edition
- `http://127.0.0.1:8000/games/` - Game Lab launcher

No `npm install` is required. The server is local-only and is not a production web server. For a port conflict, choose a different port with the `PORT` environment variable, or stop the process already using port 8000.

The two 2D projects work from local files once the server is running. The four 3D projects use pinned CDN imports and need internet access by default. Their renderer requires WebGL2. A blocked library request produces a visible startup error rather than silently leaving a blank screen.

## New chapter progression

| Chapter | Project / focus |
|---|---|
| 11 | Real-time 2D loops, input state, velocity, fixed updates |
| 12 | Rectangle and circle collision, wall response, gravity, jumping |
| 13 | Original sprites, animation sheets, image loading, JSON levels |
| 14 | Robot Orchard: scrolling camera, enemies, collectibles, lives, restart |
| 15 | Three.js scenes, cameras, meshes, lighting, movement |
| 16 | GLB loading, custom models, materials, origins, Asset Workshop |
| 17 | Rapier worlds, bodies, colliders, synchronization, bounce experiment |
| 18 | Marble Quest: dynamic obstacles, sensors, scoring, respawn, win rules |

Each new chapter includes an original explanatory SVG diagram, two optional Advanced Study blocks, a challenge, a checkpoint, and links to complete companion source. The original chapters retain their existing visual explanations and callouts.

## Complete companion projects

- `games/collision-lab/` - interactive detection-versus-response experiment
- `games/robot-orchard/` - complete 2D platform adventure with editable `level.json`
- `games/three-explorer/` - collectible 3D exploration without physics
- `games/asset-workshop/` - customize and export the supplied robot as GLB
- `games/physics-lab/` - compare three bouncing balls in Rapier
- `games/marble-quest/` - complete marble-and-collectibles physics game

Shared helpers are in `games/shared/`. The code snippets in the textbook are explanatory selections; the companion folders contain the complete runnable implementations. Early Pong/Breakout/Snake chapters remain concept-building examples rather than full runnable projects.

## Original custom assets

`games/assets/2d/` contains eight SVG designs and matching PNGs, including a four-frame robot sprite, gem, ground tile, crate, enemy bug, portal, background, and marble texture. The SVGs are editable sources.

`games/assets/3d/` contains `robot.glb`, `crate.glb`, and `gem.glb`, plus a dimensions/origin specification. These models are rigid geometry, not rigged characters, and have no animation clips. The browser Asset Workshop can recolor the robot body and export a customized GLB. For a deeper customization route, `scripts/generate-assets.py` contains the original drawing and model-building source. Its optional Python dependencies are listed in `scripts/requirements-assets.txt`; running it replaces the supplied asset pack, so back up your edits first.

`games/assets/audio/collect.wav` is an original collection sound. See `games/assets/ASSET_LICENSE.md` for reuse and modification permission. External library licenses are separate.

## Dependencies and offline use

The browser import maps pin **Three.js 0.180.0** and **@dimforge/rapier3d-compat 0.17.3**. These are chosen versions, not a claim about the latest release. Three.js and its addons must use the same version. Rapier's compatibility build embeds its WebAssembly data but still needs `await RAPIER.init()`.

Optional one-time setup on an internet-connected computer:

```bash
python3 scripts/vendor-dependencies.py
```

The standard-library Python script downloads the exact releases from npm, checks the registry-provided integrity hashes, retains package licenses, and rewrites the four 3D pages to local imports. Keep `games/vendor/` in the project. Use `--cdn` to restore the original CDN import maps. This script's live download path was not executable in the authoring environment; see `VALIDATION.md`.

## Edit and render the Quarto book

Edit the chapter `.qmd` files. From the project root, with Quarto installed:

```bash
quarto preview
# or build a static site:
quarto render
```

The `_quarto.yml` file organizes five parts, appends student reference material, and copies `games/**` into the published book. The styling is configured for HTML, with colored callouts, syntax highlighting, copy buttons, navigation, and responsive diagrams. PDF output is not configured.

- `styles/textbook.scss` - Quarto/Bootstrap theme settings
- `styles/textbook.css` - colorful textbook components
- `styles/preview.css` - standalone reading-edition navigation/layout
- `figures/chapter_11/` through `chapter_18/` - editable SVG explanations

Rebuild the combined manuscript after editing:

```bash
python3 scripts/build-single-file.py
```

To render the combined manuscript with Quarto, use the `single-file/` directory's configuration:

```bash
cd single-file
quarto render book.qmd
```

To regenerate the supplied reading edition without Quarto, install Pandoc and run `python3 scripts/build-preview.py` from the project root. This preview generator implements the textbook's callouts and embeds the figures; it is not a general-purpose replacement for Quarto.

## Test and review

```bash
node --test tests/*.test.mjs
```

These automated checks exercise collision helpers and game rules. They do not simulate all Three.js/Rapier behavior. See `VALIDATION.md` for exactly what was checked, what remains unverified, and important example limitations. Always playtest after changing physics, level geometry, assets, or dependency versions.

## Pedagogical boundaries

The 2D platformer uses axis-separated collision against static rectangular platforms, not a general physics engine. Small fixed updates and capped speeds reduce tunneling; there is no swept-collision solver. The 3D movement is intentionally world-relative, the walking robot is a rigid model, and Marble Quest uses a dynamic marble instead of a humanoid character controller. These choices are explained in the chapters and are starting points for further study.
