/** Geometry helpers used by the games and their automated tests. */
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function overlaps(a, b) {
    // Strict overlap: merely touching an edge is not penetration.
    return a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y;
}
export function circleCircle(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.r + b.r) ** 2;
}
export function circleRect(circle, rect) {
    const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
    return (circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2 <= circle.r ** 2;
}
export function normalize2(x, y) {
    const length = Math.hypot(x, y);
    return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function moveAndCollide(player, solids, dt) {
    // Assumes a non-overlapping start, static axis-aligned solids, and small steps.
    player.x += player.vx * dt;
    for (const wall of solids) {
        if (!overlaps(player, wall))
            continue;
        if (player.vx > 0)
            player.x = wall.x - player.w;
        else if (player.vx < 0)
            player.x = wall.x + wall.w;
        player.vx = 0;
    }
    player.grounded = false;
    player.y += player.vy * dt;
    for (const wall of solids) {
        if (!overlaps(player, wall))
            continue;
        if (player.vy > 0) {
            player.y = wall.y - player.h;
            player.grounded = true;
        }
        else if (player.vy < 0) {
            player.y = wall.y + wall.h;
        }
        player.vy = 0;
    }
}
