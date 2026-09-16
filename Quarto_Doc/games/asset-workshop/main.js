import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeScene, shadows } from '../shared/three-scene.js';
import { announce } from '../shared/assets.js';
const { scene, camera, renderer } = makeScene();
camera.position.set(3, 2.5, 4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .8, 0);
controls.enableDamping = true;
const gltf = await new GLTFLoader().loadAsync('../assets/3d/robot.glb');
const robot = shadows(gltf.scene);
scene.add(robot);
const grid = new THREE.GridHelper(6, 12, 0x5c8ca1, 0xc0d8e5);
scene.add(grid);
const colorInput = document.getElementById('color');
robot.traverse(object => { if (object.isMesh && object.name === 'body')
    object.material = object.material.clone(); });
colorInput.addEventListener('input', () => { robot.traverse(object => { if (object.isMesh && object.name === 'body')
    object.material.color.set(colorInput.value); }); });
document.getElementById('export').addEventListener('click', async () => {
    try {
        const exportScene = new THREE.Scene();
        exportScene.add(robot.clone(true));
        const bytes = await new GLTFExporter().parseAsync(exportScene, { binary: true });
        const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-robot.glb';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        announce('Exported my-robot.glb. Keep the original as a backup before replacing it.');
    }
    catch (error) {
        announce(`Export failed: ${error.message}`);
    }
});
announce('Change the body color, inspect the robot, then export a GLB file. The model keeps its foot-level origin.');
function frame() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
