import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeScene, shadows } from '../shared/three-scene.js';
import { createPhysicsDebug } from '../shared/physics-debug.js';
import { createInput } from '../shared/input.js';
import { normalize2 } from '../shared/math.js';
import { fixedLoop } from '../shared/loop.js';
import { announce } from '../shared/assets.js';
import { collectOnce, mayFinish } from './rules.js';
await RAPIER.init();
const { scene, camera, renderer } = makeScene();
camera.position.set(0, 17, 17);
camera.lookAt(0, 0, -1);
const input = createInput(renderer.domElement), loader = new GLTFLoader();
const [gemFile, crateFile] = await Promise.all(['gem', 'crate'].map(n => loader.loadAsync(`../assets/3d/${n}.glb`)));
const marbleTexture = await new THREE.TextureLoader().loadAsync('../assets/2d/marble-pattern.png');
marbleTexture.colorSpace = THREE.SRGBColorSpace;
const marbleMaterial = new THREE.MeshStandardMaterial({ map: marbleTexture, roughness: .35, metalness: .1 });
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1), ballGeometry = new THREE.SphereGeometry(.45, 28, 18);
const colors = new Map();
function material(color) { if (!colors.has(color))
    colors.set(color, new THREE.MeshStandardMaterial({ color, roughness: .7 })); return colors.get(color); }
const group = new THREE.Group();
scene.add(group);
const debug = createPhysicsDebug(scene);
const gemPositions = [[-4, 5], [4, 3], [-4, -2], [4, -5], [0, -7]];
let world, events, playerBody, playerCollider, goalCollider, links = [], gems = new Map(), showDebug = false;
let state = { mode: 'ready', score: 0, lives: 3 };
function box(size, position, color, rotation = new THREE.Quaternion()) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(...position).setRotation(rotation));
    world.createCollider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setFriction(.8), body);
    const mesh = new THREE.Mesh(cubeGeometry, material(color));
    mesh.scale.set(...size);
    mesh.position.set(...position);
    mesh.quaternion.copy(rotation);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);
    return body;
}
function buildWorld(mode = 'ready') {
    if (world)
        world.free();
    if (events)
        events.free();
    group.clear();
    links = [];
    gems = new Map();
    state = { mode, score: 0, lives: 3 };
    world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    events = new RAPIER.EventQueue(true);
    box([14, .8, 18], [0, -.4, 0], '#82b198');
    box([5, 1.1, .5], [-2, .55, 2], '#7499c0');
    box([.5, 1.1, 5], [2, .55, -1], '#7499c0');
    const rampRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -.18);
    box([2.8, .3, 3], [-4, .35, -5.5], '#d9b478', rampRotation);
    playerBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 6).setLinearDamping(1.6).setAngularDamping(.6).setCcdEnabled(true));
    playerCollider = world.createCollider(RAPIER.ColliderDesc.ball(.45).setFriction(.9).setRestitution(.1), playerBody);
    const marble = new THREE.Mesh(ballGeometry, marbleMaterial);
    marble.castShadow = true;
    group.add(marble);
    links.push({ body: playerBody, mesh: marble });
    for (const [x, z] of [[-1, 0], [3, -4]]) {
        const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, .6, z));
        world.createCollider(RAPIER.ColliderDesc.cuboid(.5, .5, .5).setDensity(.6).setFriction(.6), body);
        const mesh = shadows(crateFile.scene.clone(true));
        group.add(mesh);
        links.push({ body, mesh });
    }
    for (const [x, z] of gemPositions) {
        const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, .65, z));
        const collider = world.createCollider(RAPIER.ColliderDesc.ball(.65).setSensor(true).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
        const mesh = shadows(gemFile.scene.clone(true));
        mesh.position.set(x, .7, z);
        mesh.scale.setScalar(.6);
        group.add(mesh);
        gems.set(collider.handle, { collider, body, mesh, collected: false });
    }
    const goalBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, .8, -7.8));
    goalCollider = world.createCollider(RAPIER.ColliderDesc.cuboid(1.1, .9, .8).setSensor(true), goalBody);
    const gateMaterial = material('#426d86');
    for (const x of [-1.15, 1.15]) {
        const post = new THREE.Mesh(cubeGeometry, gateMaterial);
        post.position.set(x, 1, -8);
        post.scale.set(.2, 2, .2);
        group.add(post);
    }
    const top = new THREE.Mesh(cubeGeometry, gateMaterial);
    top.position.set(0, 2, -8);
    top.scale.set(2.5, .2, .2);
    group.add(top);
    input.clear();
}
function restart() { buildWorld('playing'); renderer.domElement.focus(); }
function pause() { if (state.mode === 'playing')
    state.mode = 'paused';
else if (state.mode === 'paused')
    state.mode = 'playing'; input.clear(); renderer.domElement.focus(); }
document.getElementById('start').addEventListener('click', restart);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('debug').addEventListener('click', () => { showDebug = !showDebug; renderer.domElement.focus(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.mode === 'playing')
    state.mode = 'paused'; });
buildWorld();
function update(dt) {
    if (input.consume('KeyR'))
        restart();
    if (input.consume('KeyP'))
        pause();
    if (input.consume('KeyH'))
        showDebug = !showDebug;
    if (state.mode !== 'playing') {
        input.endStep();
        return;
    }
    const d = normalize2(Number(input.isDown('ArrowRight', 'KeyD')) - Number(input.isDown('ArrowLeft', 'KeyA')), Number(input.isDown('ArrowDown', 'KeyS')) - Number(input.isDown('ArrowUp', 'KeyW')));
    if (d.x !== 0 || d.y !== 0) {
        const impulse = playerBody.mass() * 18 * dt;
        playerBody.applyImpulse({ x: d.x * impulse, y: 0, z: d.y * impulse }, true);
    }
    const v = playerBody.linvel(), speed = Math.hypot(v.x, v.z);
    if (speed > 5)
        playerBody.setLinvel({ x: v.x * 5 / speed, y: v.y, z: v.z * 5 / speed }, true);
    world.step(events);
    const picked = new Set();
    events.drainCollisionEvents((a, b, started) => {
        if (!started)
            return;
        const other = a === playerCollider.handle ? b : b === playerCollider.handle ? a : null;
        if (other !== null && gems.has(other))
            picked.add(other);
    });
    // Apply removals after the event queue is drained, never while it is iterating.
    for (const handle of picked) {
        const item = gems.get(handle);
        if (collectOnce(item, state)) {
            item.mesh.visible = false;
            world.removeRigidBody(item.body);
        }
    }
    if (playerBody.translation().y < -4) {
        state.lives--;
        if (state.lives <= 0)
            state.mode = 'lost';
        else {
            playerBody.setTranslation({ x: 0, y: 1, z: 6 }, true);
            playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
            playerBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
            playerBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        }
    }
    // Check overlap each step: entering the goal before the final gem must still work.
    if (mayFinish(state, gemPositions.length, world.intersectionPair(playerCollider, goalCollider)))
        state.mode = 'won';
    input.endStep();
}
fixedLoop(update, elapsed => {
    for (const { body, mesh } of links) {
        mesh.position.copy(body.translation());
        mesh.quaternion.copy(body.rotation());
    }
    for (const gem of gems.values())
        if (!gem.collected && state.mode === 'playing')
            gem.mesh.rotation.y += elapsed;
    material('#426d86').color.set(state.score === gemPositions.length ? '#24be91' : '#426d86');
    debug.update(world, showDebug);
    renderer.render(scene, camera);
    const prompts = { ready: 'Press Start to roll.', playing: state.score === 5 ? 'Gate unlocked! Enter the far gate.' : 'Collect gems. Push crates. Do not fall off the board.', paused: 'Paused. Press P to resume.', won: 'Quest complete! Press Restart to play again.', lost: 'Out of lives. Try again!' };
    announce(`Gems: ${state.score}/5 | Lives: ${state.lives} | ${prompts[state.mode]}`);
}, 1 / 60);
