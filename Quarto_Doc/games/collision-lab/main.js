import { overlaps, circleRect, circleCircle, moveAndCollide, normalize2, clamp } from '../shared/math.js';
import { createInput } from '../shared/input.js';
import { fixedLoop } from '../shared/loop.js';
import { announce } from '../shared/assets.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const shapeSelect = document.getElementById('shape');
const blocking = document.getElementById('blocking');
const player = { x: 100, y: 250, w: 48, h: 48, vx: 0, vy: 0, grounded: false };
const wall = { x: 440, y: 170, w: 150, h: 190 };
const target = { x: 740, y: 265, r: 65 };
let hitWall = false, hitCircle = false;
shapeSelect.addEventListener('change', () => {
    blocking.disabled = shapeSelect.value === 'circle';
    player.x = 100;
    player.y = 250;
});
canvas.addEventListener('pointermove', event => {
    if (!(event.buttons & 1))
        return;
    const r = canvas.getBoundingClientRect();
    // Dragging is intentionally a teleport: useful for inspecting overlap.
    player.x = (event.clientX - r.left) * canvas.width / r.width - player.w / 2;
    player.y = (event.clientY - r.top) * canvas.height / r.height - player.h / 2;
});
function update(dt) {
    const direction = normalize2(Number(input.isDown('ArrowRight', 'KeyD')) - Number(input.isDown('ArrowLeft', 'KeyA')), Number(input.isDown('ArrowDown', 'KeyS')) - Number(input.isDown('ArrowUp', 'KeyW')));
    player.vx = direction.x * 240;
    player.vy = direction.y * 240;
    if (shapeSelect.value === 'box' && blocking.checked)
        moveAndCollide(player, [wall], dt);
    else {
        player.x += player.vx * dt;
        player.y += player.vy * dt;
    }
    player.x = clamp(player.x, 0, canvas.width - player.w);
    player.y = clamp(player.y, 0, canvas.height - player.h);
    const circle = { x: player.x + 24, y: player.y + 24, r: 24 };
    hitWall = shapeSelect.value === 'box' ? overlaps(player, wall) : circleRect(circle, wall);
    hitCircle = shapeSelect.value === 'box' ? circleRect(target, player) : circleCircle(circle, target);
    announce(`Wall overlap: ${hitWall ? 'YES' : 'no'} | Circle contact: ${hitCircle ? 'YES' : 'no'} | ${shapeSelect.value === 'box' && blocking.checked ? 'Rectangle blocking is on.' : 'Detection only: shapes may pass through.'}`);
    input.endStep();
}
function draw() {
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(0, 0, 960, 540);
    ctx.strokeStyle = '#e2eaf5';
    ctx.lineWidth = 1;
    for (let x = 0; x < 960; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 540);
        ctx.stroke();
    }
    for (let y = 0; y < 540; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(960, y);
        ctx.stroke();
    }
    ctx.fillStyle = hitWall ? '#ef899d' : '#ffd08a';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = '#a46417';
    ctx.lineWidth = 3;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = hitCircle ? '#d3b4ff' : '#ebe0fa';
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8055b8';
    ctx.stroke();
    ctx.fillStyle = '#247fc7';
    if (shapeSelect.value === 'box')
        ctx.fillRect(player.x, player.y, player.w, player.h);
    else {
        ctx.beginPath();
        ctx.arc(player.x + 24, player.y + 24, 24, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#233c60';
    ctx.font = 'bold 25px system-ui';
    ctx.fillText('A collision is a question. A response is a rule.', 35, 55);
    ctx.font = '18px system-ui';
    ctx.fillText('Move with the keys. Drag to inspect an overlap. Switch the shape above.', 35, 91);
    ctx.fillText('rectangle / wall', 440, 395);
    ctx.fillText('circle / sensor', 675, 370);
    ctx.fillText('Touching edges is not rectangle penetration; circles include boundary contact.', 35, 500);
}
fixedLoop(update, draw);
canvas.focus();
