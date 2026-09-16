import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeScene, shadows } from '../shared/three-scene.js';
import { createInput } from '../shared/input.js';
import { normalize2, clamp } from '../shared/math.js';
import { fixedLoop } from '../shared/loop.js';
import { announce } from '../shared/assets.js';
const { scene, camera, renderer } = makeScene();
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI * .47;
const input = createInput(renderer.domElement);
const loader = new GLTFLoader();
const [robotFile, gemFile, crateFile] = await Promise.all(['robot', 'gem', 'crate'].map(name => loader.loadAsync(`../assets/3d/${name}.glb`)));
const robot = shadows(robotFile.scene);
scene.add(robot);
const ground = new THREE.Mesh(new THREE.BoxGeometry(12, .4, 12), new THREE.MeshStandardMaterial({ color: '#81b799' }));
ground.position.y = -.2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(12, 12, 0x4c8773, 0xafd4bd);
grid.position.y = .006;
scene.add(grid);
const crates = [];
for (const [x, z] of [[-2, 1], [2, -1]]) {
    const crate = shadows(crateFile.scene.clone(true));
    crate.position.set(x, .5, z);
    scene.add(crate);
    crates.push(crate);
}
const gems = [[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([x, z]) => {
    const mesh = shadows(gemFile.scene.clone(true));
    mesh.scale.setScalar(.65);
    mesh.position.set(x, .7, z);
    scene.add(mesh);
    return { mesh, x, z, collected: false };
});
let score = 0, time = 0;
function restart() { robot.position.set(0, 0, 4.8); robot.rotation.set(0, 0, 0); score = 0; gems.forEach(g => { g.collected = false; g.mesh.visible = true; }); renderer.domElement.focus(); }
document.getElementById('restart').addEventListener('click', restart);
restart();
function update(dt) {
    if (input.consume('KeyR'))
        restart();
    const d = normalize2(Number(input.isDown('ArrowRight', 'KeyD')) - Number(input.isDown('ArrowLeft', 'KeyA')), Number(input.isDown('ArrowDown', 'KeyS')) - Number(input.isDown('ArrowUp', 'KeyW')));
    robot.position.x = clamp(robot.position.x + d.x * 3 * dt, -5.4, 5.4);
    robot.position.z = clamp(robot.position.z + d.y * 3 * dt, -5.4, 5.4);
    if (d.x !== 0 || d.y !== 0)
        robot.rotation.y = Math.atan2(d.x, d.y);
    for (const gem of gems) {
        if (!gem.collected && Math.hypot(robot.position.x - gem.x, robot.position.z - gem.z) < .75) {
            gem.collected = true;
            gem.mesh.visible = false;
            score++;
        }
    }
    time += dt;
    for (const gem of gems) {
        gem.mesh.rotation.y = time;
        gem.mesh.position.y = .7 + Math.sin(time * 3) * .08;
    }
    announce(`Crystals: ${score}/4 | ${score === 4 ? 'Island explored! Restart to play again.' : 'Movement is world-relative. Crates are visual only in this pre-physics project.'}`);
    input.endStep();
}
fixedLoop(update, () => { controls.update(); renderer.render(scene, camera); }, 1 / 60);
