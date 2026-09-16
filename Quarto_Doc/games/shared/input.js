/** Keyboard and optional on-screen controls. Input belongs to the focused canvas. */
export function createInput(surface) {
    const held = new Set();
    const pressed = new Set();
    const allowed = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyP', 'KeyR', 'KeyH']);
    const clear = () => { held.clear(); pressed.clear(); };
    function down(code) { if (!held.has(code))
        pressed.add(code); held.add(code); }
    surface.tabIndex = 0;
    surface.addEventListener('keydown', event => {
        if (!allowed.has(event.code))
            return;
        event.preventDefault();
        down(event.code);
    });
    surface.addEventListener('keyup', event => {
        if (!allowed.has(event.code))
            return;
        event.preventDefault();
        held.delete(event.code);
    });
    surface.addEventListener('pointerdown', () => surface.focus());
    surface.addEventListener('blur', clear);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', () => { if (document.hidden)
        clear(); });
    for (const button of document.querySelectorAll('[data-key]')) {
        button.addEventListener('pointerdown', event => {
            event.preventDefault();
            surface.focus();
            button.setPointerCapture(event.pointerId);
            down(button.dataset.key);
        });
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            button.addEventListener(event, () => held.delete(button.dataset.key));
        }
    }
    return {
        held, clear,
        isDown: (...codes) => codes.some(code => held.has(code)),
        consume(code) { const found = pressed.has(code); pressed.delete(code); return found; },
        endStep() { pressed.clear(); }
    };
}
