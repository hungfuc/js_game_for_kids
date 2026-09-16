/** Game rules have no dependency on graphics or physics. */
export function collectOnce(item, state) {
    if (!item || item.collected || state.mode !== 'playing')
        return false;
    item.collected = true;
    state.score++;
    return true;
}
export function mayFinish(state, total, insideGoal) {
    return state.mode === 'playing' && state.score === total && insideGoal;
}
