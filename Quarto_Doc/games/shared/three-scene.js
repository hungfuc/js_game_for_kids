import * as THREE from 'three';
export function makeScene() {
    const host = document.getElementById('stage');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', '3D game. Click to focus, then use the listed keys.');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#dceefa');
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
    camera.position.set(10, 12, 15);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x56744d, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.position.set(-5, 12, 8);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 0.1, far: 45 });
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    function resize() {
        const width = host.clientWidth, height = host.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(host);
    resize();
    return { THREE, scene, camera, renderer };
}
export function shadows(root) {
    root.traverse(object => { if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
    } });
    return root;
}
