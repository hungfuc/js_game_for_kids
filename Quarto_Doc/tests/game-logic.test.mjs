import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { overlaps, circleCircle, circleRect, normalize2, moveAndCollide } from '../games/shared/math.js';
import { createWorld, stepWorld } from '../games/robot-orchard/world.js';
import { collectOnce, mayFinish } from '../games/marble-quest/rules.js';
const level = JSON.parse(await readFile(new URL('../games/robot-orchard/level.json', import.meta.url)));
test('AABB needs overlap on both axes', () => {
    assert.equal(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 19, y: 19, w: 20, h: 20 }), true);
    assert.equal(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 21, y: 0, w: 20, h: 20 }), false);
    assert.equal(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 0, y: 21, w: 20, h: 20 }), false);
});
test('Touching rectangles are not penetrating', () => assert.equal(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 20, y: 0, w: 20, h: 20 }), false));
test('Circle-circle includes touching', () => assert.equal(circleCircle({ x: 0, y: 0, r: 5 }, { x: 10, y: 0, r: 5 }), true));
test('Circle-rectangle excludes false positive at a corner', () => {
    assert.equal(circleRect({ x: -4, y: -4, r: 5 }, { x: 0, y: 0, w: 20, h: 20 }), false);
    assert.equal(circleRect({ x: -3, y: -3, r: 5 }, { x: 0, y: 0, w: 20, h: 20 }), true);
});
test('Normalize diagonal and zero vectors', () => {
    const d = normalize2(1, 1);
    assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-12);
    assert.deepEqual(normalize2(0, 0), { x: 0, y: 0 });
});
test('Falling player lands on platform', () => {
    const p = { x: 20, y: 60, w: 20, h: 30, vx: 0, vy: 120, grounded: false };
    moveAndCollide(p, [{ x: 0, y: 100, w: 200, h: 20 }], .1);
    assert.equal(p.y, 70);
    assert.equal(p.vy, 0);
    assert.equal(p.grounded, true);
});
test('Ceiling contact stops upward motion without grounding', () => {
    const p = { x: 20, y: 25, w: 20, h: 30, vx: 0, vy: -100, grounded: false };
    moveAndCollide(p, [{ x: 0, y: 0, w: 200, h: 20 }], .1);
    assert.equal(p.y, 20);
    assert.equal(p.vy, 0);
    assert.equal(p.grounded, false);
});
test('Rightward collision snaps to left face of wall', () => {
    const p = { x: 65, y: 0, w: 20, h: 20, vx: 100, vy: 0 };
    moveAndCollide(p, [{ x: 90, y: 0, w: 20, h: 100 }], .1);
    assert.equal(p.x, 70);
    assert.equal(p.vx, 0);
});
test('World starts in ready state', () => assert.equal(createWorld(level).mode, 'ready'));
test('Reset creates fresh collectible state', () => {
    const a = createWorld(level);
    a.gems[0].collected = true;
    assert.equal(createWorld(level).gems[0].collected, false);
});
test('Player settles onto starting floor', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    for (let i = 0; i < 240; i++)
        stepWorld(w, { horizontal: 0, jump: false }, 1 / 120);
    assert.equal(w.player.y, 438);
    assert.equal(w.player.grounded, true);
});
test('Grounded jump starts upward motion', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    w.player.y = 438;
    w.player.grounded = true;
    stepWorld(w, { horizontal: 0, jump: true }, 1 / 120);
    assert.ok(w.player.vy < 0);
    assert.ok(w.player.y < 438);
});
test('Repeated jump command cannot grant a second midair jump', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    w.player.y = 438;
    w.player.grounded = true;
    stepWorld(w, { horizontal: 0, jump: true }, 1 / 120);
    const old = w.player.vy;
    stepWorld(w, { horizontal: 0, jump: true }, 1 / 120);
    assert.ok(w.player.vy > old);
});
test('A 2D gem is scored once', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    w.player.x = 150;
    w.player.y = 416;
    for (let i = 0; i < 10; i++)
        stepWorld(w, { horizontal: 0, jump: false }, 1 / 120);
    assert.equal(w.score, 1);
});
test('Pause stops simulation', () => {
    const w = createWorld(level);
    w.mode = 'paused';
    const before = JSON.stringify(w);
    stepWorld(w, { horizontal: 1, jump: true }, 1 / 120);
    assert.equal(JSON.stringify(w), before);
});
test('A fall costs one life and respawns', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    w.player.y = 700;
    stepWorld(w, { horizontal: 0, jump: false }, 1 / 120);
    assert.equal(w.lives, 2);
    assert.equal(w.player.x, level.spawn.x);
});
test('Goal requires every gem', () => {
    const w = createWorld(level);
    w.mode = 'playing';
    w.player.x = 2450;
    w.player.y = 438;
    stepWorld(w, { horizontal: 0, jump: false }, 1 / 120);
    assert.equal(w.mode, 'playing');
    w.score = w.gems.length;
    stepWorld(w, { horizontal: 0, jump: false }, 1 / 120);
    assert.equal(w.mode, 'won');
});
test('A 3D pickup is idempotent', () => {
    const state = { mode: 'playing', score: 0 }, item = { collected: false };
    assert.equal(collectOnce(item, state), true);
    assert.equal(collectOnce(item, state), false);
    assert.equal(state.score, 1);
});
test('Goal predicate works while already overlapping', () => {
    assert.equal(mayFinish({ mode: 'playing', score: 4 }, 5, true), false);
    assert.equal(mayFinish({ mode: 'playing', score: 5 }, 5, true), true);
    assert.equal(mayFinish({ mode: 'paused', score: 5 }, 5, true), false);
});
test('Included levels do not spawn inside a solid', () => {
    const w = createWorld(level);
    assert.ok(level.solids.every(s => !overlaps(w.player, s)));
});

test('A complete 2D route collects every gem and wins with three lives', () => {
    const world = createWorld(level);
    world.mode = 'playing';
    const dt = 1 / 120;
    function step(horizontal = 0, jump = false) {
        stepWorld(world, { horizontal, jump }, dt);
        assert.notEqual(world.mode, 'lost');
    }
    function moveTo(x) {
        for (let count = 0; count < 1200 && Math.abs(world.player.x - x) > 2; count++) {
            if (world.mode === 'won') return;
            step(Math.sign(x - world.player.x));
        }
    }
    function waitForGround() {
        for (let count = 0; count < 300 && !world.player.grounded; count++) step();
        assert.equal(world.player.grounded, true);
    }
    function jumpTo(takeoffX, targetX) {
        moveTo(takeoffX);
        waitForGround();
        step(Math.sign(targetX - world.player.x), true);
        for (let count = 0; count < 240 && !world.player.grounded; count++) {
            step(Math.abs(targetX - world.player.x) > 2 ? Math.sign(targetX - world.player.x) : 0);
        }
        moveTo(targetX);
    }
    waitForGround();
    moveTo(150);
    // Jump before the underside of each raised platform; do not start under it.
    for (const [takeoff, landing] of [
        [150, 298], [374, 522], [596, 734], [800, 940], [940, 1106],
        [1180, 1356], [1428, 1576], [1640, 1850], [1830, 1976],
        [2030, 2176], [2240, 2356]
    ]) jumpTo(takeoff, landing);
    moveTo(2448);
    assert.equal(world.mode, 'won');
    assert.equal(world.score, level.gems.length);
    assert.equal(world.lives, 3);
    assert.equal(world.gems.every(gem => gem.collected), true);
});
