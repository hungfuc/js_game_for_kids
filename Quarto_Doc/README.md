# JavaScript Game Programming for Kids
## Colorful Quarto edition: Dynamic 2D and 3D

A 22-chapter, student-facing textbook with diagrams, playable companion projects, original assets, and optional Advanced Study callouts. Chapters 1–4 establish computer and file skills, then introduce Structure, Style, and Behavior in three short lessons before the game-programming sequence begins in Chapter 5. Chapters 15-22 extend the progression into complete 2D game development and Three.js/Rapier 3D games. There are no teacher-note sections.

## Development theme throughout the book

**Build the scene structure → Style the scene → Program game behavior** (short form: **Structure → Style → Behavior**) is introduced in Chapter 2 and guides the subsequent chapters, their exercises and challenges, and the reference appendices. Chapter 1 focuses on computer knowledge and file operations. “Scene” covers both HTML page structure and game-world objects. “Style” includes CSS, canvas drawing, sprites, 3D materials, lighting, and feedback. “Program game behavior” covers game data, input, operations, and rules.

From Chapter 2 onward, exercises identify the stage they practice; challenges give a concrete route through the three steps. Every chapter opens with an unnumbered overview and learning objectives, followed by its topics. Reuse an unchanged stage rather than rebuilding it, predict a result, and check it. This is a development strategy, not the browser’s loading order or the game’s update loop.

The three foundation chapters reuse one Monster Clicker scene and place short practice tasks beside each concept. Linked runnable stage copies are in `games/foundations/`, with matching practice copies in `../workspace/foundations/`. The full HTML/CSS explanations and summary tables are preserved in Appendix F as an optional lookup reference, including the older Game Maker HQ project. Advanced layout techniques are introduced when later games need them.

## Read and play

The included `preview.html` is a self-contained HTML reading edition generated from the Quarto manuscript with Pandoc. It includes the diagrams and styling; it is **not a native Quarto build**. The project links inside it work when the complete folder is served locally.

**Server requirements:** the one-file games in Chapters 2–14 and `workspace/` open directly. **All six Game Lab projects in Chapters 15–22 require local HTTP:** Collision Playground, Robot Orchard, Robot Island Explorer, 3D Asset Workshop, Rapier Drop Lab, and Marble Quest. Their module-based demonstration pages also require HTTP.

### Simple setup: install once, double-click to play

1. Download **Node.js LTS** from the official page: [https://nodejs.org/en/download](https://nodejs.org/en/download).
2. On **Windows**, select Windows and download the **.msi** installer (x64 for most computers; ARM64 for ARM computers). Open it, accept the license if you agree, keep the defaults including **Add to PATH**, and choose **Install → Finish**. Skip optional native-module build tools.
3. On **macOS**, select macOS and download the **.pkg** installer. Open it, choose **Continue**, accept the license if you agree, then **Install → Close**; enter your password if requested.
4. Open a new Command Prompt (Windows) or Terminal (macOS), run `node --version`, and check that it prints a version number. Restart the computer if Node.js is still not found.
5. Extract the book ZIP, then open `Quarto_Doc`. Keep `games/`, `scripts/`, and the launchers together.
6. Double-click the launcher below. Leave its window open while playing. Choose **Collision Playground** and check that an arrow key moves the shape. Close the window or press Ctrl+C to stop.

See the [Game Lab setup guide](appendices/e-game-lab.qmd) for detailed steps and troubleshooting. It is also in the reading edition's **Your Game Lab** appendix. Linux users can install Node.js using the Linux instructions on the official download page, then use the terminal command below.

For students, the easiest option is to double-click `start-game-lab.command` on macOS or `start-game-lab.bat` on Windows. The launchers check for Node.js, start the server, and open the Game Lab.

For a terminal, with Node.js installed, run from this folder:

```bash
node scripts/serve.mjs
```

Then visit:

- `http://127.0.0.1:8000/preview.html` - complete reading edition
- `http://127.0.0.1:8000/games/` - Game Lab launcher

No `npm install` is required. The server is local-only and is not a production web server. For a port conflict, choose a different port with the `PORT` environment variable, or stop the process already using port 8000.

The two 2D projects run offline through the local HTTP server; opening their HTML files directly with `file://` will not work. The four 3D projects use pinned CDN imports and need internet access by default. Their renderer requires WebGL2. A blocked library request produces a visible startup error rather than silently leaving a blank screen.

## New chapter progression

| Chapter | Project / focus |
|---|---|
| 1 | Personal computer, browser, local files, client/server web basics |
| 2 | Structure: tiny game idea, sketch, HTML document, elements, attributes, nesting |
| 3 | Style: CSS connection, selectors, text, boxes, image styling, readable controls |
| 4 | Behavior: input controls, state, action rules, paper simulation, feedback, reset |
| 5-14 | JavaScript state, events, decisions, timing, canvas, game patterns, and game design |
| 15 | Real-time 2D loops, input state, velocity, fixed updates |
| 16 | Rectangle and circle collision, wall response, gravity, jumping |
| 17 | Original sprites, animation sheets, image loading, JSON levels |
| 18 | Robot Orchard: scrolling camera, enemies, collectibles, lives, restart |
| 19 | Three.js scenes, cameras, meshes, lighting, movement |
| 20 | GLB loading, custom models, materials, origins, Asset Workshop |
| 21 | Rapier worlds, bodies, colliders, synchronization, bounce experiment |
| 22 | Marble Quest: dynamic obstacles, sensors, scoring, respawn, win rules |

Each new chapter includes an original explanatory SVG diagram, two optional Advanced Study blocks, a challenge, a checkpoint, and links to complete companion source. The original chapters retain their existing visual explanations and callouts.

## Complete companion projects

- `games/collision-lab/` - interactive detection-versus-response experiment
- `games/robot-orchard/` - complete 2D platform adventure with editable `level.json`
- `games/three-explorer/` - collectible 3D exploration without physics
- `games/asset-workshop/` - customize and export the supplied robot as GLB
- `games/physics-lab/` - compare three bouncing balls in Rapier
- `games/marble-quest/` - complete marble-and-collectibles physics game

Shared helpers are in `games/shared/`. The code snippets in the textbook are explanatory selections; the companion folders contain the complete runnable implementations. The early Pong, Breakout, and Snake chapters include complete small examples alongside focused explanatory snippets.

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
- `figures/chapter_11/` through `chapter_18/` - editable SVG explanations used by the later game chapters

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

## Regenerate the chapter screenshots

`figures/game-stage-captures.json` records the source and caption for each captured stage. `scripts/capture-game-stages.cjs` renders the chapter code and companion projects in Chrome, removes scripts for the HTML/CSS stages, and operates the actual controls for behavior captures. Animation callbacks advance in fixed frames so movement and physics states are repeatable. Chapters 9–14 retain their existing behavior galleries alongside the new HTML/CSS captures.

With Node.js, Playwright, and Chrome available, run from this directory:

```bash
node scripts/capture-game-stages.cjs
python3 scripts/insert-game-stage-figures.py
python3 scripts/build-single-file.py
```

Pass chapter numbers to recapture a selection, such as `node scripts/capture-game-stages.cjs 8 18`. Set `PLAYWRIGHT_MODULE` to an existing Playwright package path if needed, and `CHROME_PATH` if Chrome is outside its default macOS location. The 3D captures use the companion pages' pinned CDN dependencies. The insertion script can be run repeatedly without duplicating figures.

## Test and review

```bash
node --test tests/*.test.mjs
```

These automated checks exercise collision helpers and game rules. They do not simulate all Three.js/Rapier behavior. See `VALIDATION.md` for exactly what was checked, what remains unverified, and important example limitations. Always playtest after changing physics, level geometry, assets, or dependency versions.

## Pedagogical boundaries

The 2D platformer uses axis-separated collision against static rectangular platforms, not a general physics engine. Small fixed updates and capped speeds reduce tunneling; there is no swept-collision solver. The 3D movement is intentionally world-relative, the walking robot is a rigid model, and Marble Quest uses a dynamic marble instead of a humanoid character controller. These choices are explained in the chapters and are starting points for further study.
