import * as THREE from 'three';
/** Debug wireframes are optional; replace/dispose the small buffer each frame. */
export function createPhysicsDebug(scene) {
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false }));
    lines.frustumCulled = false;
    lines.renderOrder = 999;
    scene.add(lines);
    return {
        update(world, visible) {
            lines.visible = visible;
            if (!visible)
                return;
            const { vertices, colors } = world.debugRender();
            const rgb = new Float32Array(vertices.length);
            for (let i = 0; i < vertices.length / 3; i++) {
                rgb[i * 3] = colors[i * 4];
                rgb[i * 3 + 1] = colors[i * 4 + 1];
                rgb[i * 3 + 2] = colors[i * 4 + 2];
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
            lines.geometry.dispose();
            lines.geometry = geometry;
        },
        dispose() { lines.geometry.dispose(); lines.material.dispose(); scene.remove(lines); }
    };
}
