/** One animation loop; bounded catch-up avoids a huge jump after a hidden tab. */
export function fixedLoop(update, draw, step = 1 / 120) {
    let previous = null, accumulator = 0, requestId;
    function frame(milliseconds) {
        if (previous === null)
            previous = milliseconds;
        const elapsed = Math.min(Math.max((milliseconds - previous) / 1000, 0), 0.1);
        previous = milliseconds;
        accumulator += elapsed;
        let steps = 0;
        while (accumulator >= step && steps < 12) {
            update(step);
            accumulator -= step;
            steps++;
        }
        if (steps === 12)
            accumulator = 0;
        draw(elapsed, accumulator / step);
        requestId = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', () => { previous = null; accumulator = 0; });
    requestId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(requestId);
}
