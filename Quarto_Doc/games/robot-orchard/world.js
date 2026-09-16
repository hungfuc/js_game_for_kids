import { moveAndCollide, circleRect, overlaps, clamp } from '../shared/math.js';
export const SETTINGS = Object.freeze({ speed: 230, jumpSpeed: 550, gravity: 1400, maxFall: 760 });
export function createWorld(level) {
    if (!Array.isArray(level.solids) || !Array.isArray(level.gems) || !level.spawn)
        throw new Error('Level requires solids, gems, and spawn.');
    return {
        level, mode: 'ready', time: 0, score: 0, lives: 3, immunity: 0,
        player: { ...level.spawn, w: 28, h: 42, vx: 0, vy: 0, grounded: false, facing: 1 },
        gems: level.gems.map(g => ({ ...g, r: 14, collected: false })),
        enemies: level.enemies.map(e => ({ ...e }))
    };
}
function damage(world) {
    if (world.immunity > 0)
        return;
    world.lives--;
    if (world.lives <= 0) {
        world.mode = 'lost';
        return;
    }
    Object.assign(world.player, world.level.spawn, { vx: 0, vy: 0, grounded: false });
    world.immunity = 1.5;
}
export function stepWorld(world, command, dt) {
    if (world.mode !== 'playing')
        return;
    world.time += dt;
    world.immunity = Math.max(0, world.immunity - dt);
    const player = world.player;
    player.vx = clamp(command.horizontal, -1, 1) * SETTINGS.speed;
    if (player.vx !== 0)
        player.facing = Math.sign(player.vx);
    if (command.jump && player.grounded) {
        player.vy = -SETTINGS.jumpSpeed;
        player.grounded = false;
    }
    player.vy = Math.min(player.vy + SETTINGS.gravity * dt, SETTINGS.maxFall);
    moveAndCollide(player, world.level.solids, dt);
    player.x = clamp(player.x, 0, world.level.width - player.w);
    for (const gem of world.gems) {
        if (!gem.collected && circleRect(gem, player)) {
            gem.collected = true;
            world.score++;
        }
    }
    for (const enemy of world.enemies) {
        enemy.x += enemy.vx * dt;
        if (enemy.x < enemy.minX) {
            enemy.x = enemy.minX;
            enemy.vx = Math.abs(enemy.vx);
        }
        if (enemy.x > enemy.maxX) {
            enemy.x = enemy.maxX;
            enemy.vx = -Math.abs(enemy.vx);
        }
        if (overlaps(player, enemy))
            damage(world);
    }
    if (player.y > 680)
        damage(world);
    if (world.mode === 'playing' && world.score === world.gems.length && overlaps(player, world.level.goal))
        world.mode = 'won';
}
