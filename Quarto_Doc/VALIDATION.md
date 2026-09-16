# Validation and known boundaries

## Checks completed

- All 16 JavaScript/module files in the companion games, local server, and test suite passed Node's syntax check.
- All **21 automated tests passed**. The tests cover rectangle and circle overlap, edge contact, closest-point collision, diagonal normalization, landing, ceiling/wall response, grounded jumping, collectible idempotence, pause, reset, falls, and win rules.
- A deterministic complete Robot Orchard route collected all ten gems, reached the portal, and finished with three lives. This verifies reachability for that route with the supplied level and fixed-step settings; it is not a claim that every possible route or modification works.
- The two 2D projects were smoke-tested in Chromium. Robot Orchard loaded its original artwork, started, moved, collected a gem, jumped, paused without advancing player state, and restarted. No JavaScript page errors occurred in those tests.
- For those browser tests, local asset URLs and ES-module imports were inlined into test copies because the browser's managed policy blocks navigation to local HTTP pages. The original game logic was unchanged. Separately, the supplied local server returned HTTP 200 and the expected MIME types for HTML, JSON, JavaScript, and GLB samples.
- The reading preview was checked in Chromium at desktop and 390-pixel mobile widths. Its 18 images loaded; its 26 Advanced Study blocks were present; no horizontal page overflow was detected. Representative chapter starts, diagrams, and callouts were visually reviewed.
- Internal preview anchors and local file links were checked. All 18 chapter files and eight new SVG teaching diagrams were present, with no missing checked targets.
- The three GLB assets passed binary-header and embedded-buffer checks and were read back with Trimesh. Robot feet are at y=0; the crate bounds are 1 by 1 by 1; the gem bounds are 0.9 by 1.4 by 0.9. The assets contain no animation clips.
- The optional dependency downloader's archive-safety function was tested with a local fixture. It extracted a regular file and rejected path traversal and symlink entries.

The automated Node test output is included in `tests/last-test-run.txt`.

## Not verified in this environment

- **Live Three.js/Rapier execution was not tested.** Outbound package downloads were unavailable. The four 3D projects have complete source, pinned import maps, local assets, documented API usage, and visible startup error handling, but the actual rendering, physics integration, and GLB export must be exercised on a computer that can load those libraries.
- The optional `vendor-dependencies.py` live registry download was not run. Its extraction safeguards were tested locally; package availability, network policy, and offline behavior still need a real download-and-run check.
- **Native `quarto render` was not run**, because Quarto was not installed. The supplied HTML reading edition was generated with Pandoc using a project-specific converter. It is not being represented as native Quarto output.
- Safari, Firefox, mobile touch gameplay, and assistive-technology support were not exhaustively tested. The mobile browser check covered layout, not a full touch-control playthrough.

## Intended limits of the examples

The 2D platformer uses static axis-aligned rectangle response with bounded speeds and 1/120-second updates. It has no swept collision solver, sloped platforms, rider-carrying platforms, or general rigid-body physics. The collision experiment's circle mode demonstrates detection, not a complete circle response solver.

The 3D explorer has decorative crates without physics. Marble Quest is the physics-enabled project. The robot assets are rigid, not skeletal characters; there are no character animation clips. The marble uses world-relative movement and a fixed camera. Rendering after fixed updates uses the current state rather than full interpolation.

The games are educational examples, not a security-hardened public service or production game engine. After changing dependencies, assets, level geometry, or controls, rerun tests and playtest on the actual student devices.
