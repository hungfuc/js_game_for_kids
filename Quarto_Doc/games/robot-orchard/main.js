import { createInput } from '../shared/input.js';
import { fixedLoop } from '../shared/loop.js';
import { loadImage, loadJSON, announce } from '../shared/assets.js';
import { clamp } from '../shared/math.js';
import { createWorld, stepWorld } from './world.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const names = ['robot-strip', 'gem', 'ground', 'bug', 'portal', 'background'];
const images = await Promise.all(names.map(name => loadImage(`../assets/2d/${name}.svg`)));
const art = Object.fromEntries(names.map((name, i) => [name, images[i]]));
const level = await loadJSON('./level.json');
const sound = new Audio('../assets/audio/collect.wav');
sound.volume = 0.2;
let world = createWorld(level), debug = false;
function start() { world = createWorld(level); world.mode = 'playing'; input.clear(); canvas.focus(); }
function pause() { if (world.mode === 'playing')
    world.mode = 'paused';
else if (world.mode === 'paused')
    world.mode = 'playing'; input.clear(); canvas.focus(); }
document.getElementById('start').addEventListener('click', start);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('debug').addEventListener('click', () => { debug = !debug; canvas.focus(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && world.mode === 'playing')
    world.mode = 'paused'; });
function update(dt) {
    if (input.consume('KeyR'))
        start();
    if (input.consume('KeyP'))
        pause();
    if (input.consume('KeyH'))
        debug = !debug;
    const oldScore = world.score;
    stepWorld(world, { horizontal: Number(input.isDown('ArrowRight', 'KeyD')) - Number(input.isDown('ArrowLeft', 'KeyA')), jump: input.consume('Space') || input.consume('ArrowUp') || input.consume('KeyW') }, dt);
    if (world.score > oldScore && document.getElementById('sound').checked) {
        sound.currentTime = 0;
        sound.play().catch(() => { }); // Sound is optional; gameplay does not depend on autoplay permission.
    }
    input.endStep();
}
function draw() {
    const player = world.player;
    const cameraX = clamp(player.x + player.w / 2 - canvas.width / 2, 0, level.width - canvas.width);
    const backX = -(cameraX * 0.25) % 960;
    ctx.drawImage(art.background, backX, 0, 960, 540);
    ctx.drawImage(art.background, backX + 960, 0, 960, 540);
    ctx.save();
    ctx.translate(-cameraX, 0);
    for (const solid of level.solids) {
        // Crop the last tile rather than stretching it beyond the platform.
        for (let x = solid.x; x < solid.x + solid.w; x += 64) {
            const width = Math.min(64, solid.x + solid.w - x);
            ctx.drawImage(art.ground, 0, 0, width, 64, x, solid.y, width, solid.h);
        }
    }
    for (const gem of world.gems)
        if (!gem.collected)
            ctx.drawImage(art.gem, gem.x - 18, gem.y - 18 + Math.sin(world.time * 4) * 3, 36, 36);
    for (const enemy of world.enemies)
        ctx.drawImage(art.bug, enemy.x - 7, enemy.y - 9, 48, 48);
    ctx.globalAlpha = world.score === world.gems.length ? 1 : 0.45;
    ctx.drawImage(art.portal, level.goal.x, level.goal.y, level.goal.w, level.goal.h);
    ctx.globalAlpha = 1;
    const moving = Math.abs(player.vx) > 0 && player.grounded;
    const frame = moving ? Math.floor(world.time * 8) % 4 : 0;
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h);
    ctx.scale(player.facing, 1);
    if (world.immunity > 0)
        ctx.globalAlpha = Math.floor(world.time * 12) % 2 === 0 ? .4 : 1;
    ctx.drawImage(art['robot-strip'], frame * 64, 0, 64, 64, -24, -60, 48, 64);
    ctx.restore();
    if (debug) {
        ctx.strokeStyle = '#b32460';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.w, player.h);
        ctx.strokeStyle = '#137168';
        for (const s of level.solids)
            ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = '#b32460';
        for (const e of world.enemies)
            ctx.strokeRect(e.x, e.y, e.w, e.h);
        ctx.strokeStyle = '#713799';
        for (const g of world.gems)
            if (!g.collected) {
                ctx.beginPath();
                ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
                ctx.stroke();
            }
        ctx.strokeRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);
    }
    ctx.restore();
    announce(`Gems: ${world.score}/${world.gems.length} | Lives: ${world.lives} | ${world.mode.toUpperCase()}`);
    if (world.mode !== 'playing') {
        ctx.fillStyle = '#17304bcc';
        ctx.fillRect(0, 0, 960, 540);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px system-ui';
        const titles = { ready: 'Welcome to Robot Orchard!', paused: 'Paused', won: 'All gems collected. Great exploring!', lost: 'Try a new route!' };
        ctx.fillText(titles[world.mode], 480, 240);
        ctx.font = '22px system-ui';
        ctx.fillText(world.mode === 'paused' ? 'Press P or Pause to continue.' : 'Press Start / Restart to play.', 480, 285);
        ctx.textAlign = 'left';
    }
}
fixedLoop(update, draw);
// A read-only view helps you inspect game state in the developer console.
globalThis.gameDebug = { snapshot: () => structuredClone({ mode: world.mode, score: world.score, lives: world.lives, player: world.player }) };
