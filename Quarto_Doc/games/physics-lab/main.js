import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeScene } from '../shared/three-scene.js';
import { fixedLoop } from '../shared/loop.js';
import { announce } from '../shared/assets.js';
import { createPhysicsDebug } from '../shared/physics-debug.js';
await RAPIER.init();
const { scene, camera, renderer } = makeScene();
camera.position.set(9, 9, 13);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
const group = new THREE.Group();
scene.add(group);
const boxGeometry = new THREE.BoxGeometry(1, 1, 1), sphereGeometry = new THREE.SphereGeometry(.5, 24, 16);
const materials = [0x5aaee1, 0x7b5ac5, 0xeaa14f].map(color => new THREE.MeshStandardMaterial({ color, roughness: .5 }));
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90b6a2 });
let world, bodies = [], showDebug = false;
const debug = createPhysicsDebug(scene);
function reset() {
    if (world)
        world.free();
    group.clear();
    bodies = [];
    world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -.5, 0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(7, .5, 5).setRestitution(0), groundBody);
    const floor = new THREE.Mesh(boxGeometry, groundMaterial);
    floor.scale.set(14, 1, 10);
    floor.position.set(0, -.5, 0);
    floor.receiveShadow = true;
    group.add(floor);
    [0, .45, .85].forEach((bounce, index) => {
        const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation((index - 1) * 3, 5, 0).setCcdEnabled(true));
        world.createCollider(RAPIER.ColliderDesc.ball(.5).setRestitution(bounce).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max), body);
        const mesh = new THREE.Mesh(sphereGeometry, materials[index]);
        mesh.castShadow = true;
        group.add(mesh);
        bodies.push({ body, mesh });
    });
    announce('Blue bounce 0.00 | Purple 0.45 | Gold 0.85. All three balls start at the same height.');
}
document.getElementById('restart').addEventListener('click', reset);
document.getElementById('debug').addEventListener('click', () => showDebug = !showDebug);
reset();
fixedLoop(() => world.step(), () => {
    for (const { body, mesh } of bodies) {
        mesh.position.copy(body.translation());
        mesh.quaternion.copy(body.rotation());
    }
    debug.update(world, showDebug);
    controls.update();
    renderer.render(scene, camera);
}, 1 / 60);
