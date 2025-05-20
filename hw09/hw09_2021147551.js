// 03-geometries.js
// - DirectionalLightHelper
// - CameraHelper for shadow range
// - ConvexGeometry, LatheGeometry, OctahedronGeometry, ParametricGeometry
// - TetrahedronGeometry, TorusGeometry
// - MeshStandardMaterial, MeshBasicMaterial
// - MultiMaterialObject

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/addons/geometries/ParametricGeometries.js';
import * as SceneUtils from 'three/addons/utils/SceneUtils.js';

const sun = new THREE.SphereGeometry(10);
// Mercury (수성): name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6', rotationSpeed: 0.02, orbitSpeed: 0.02 
const mercury = new THREE.SphereGeometry(1.5);
// Venus (금성): name: 'Venus', radius: 3, distance: 35, color: '#e39e1c', rotationSpeed: 0.015, orbitSpeed: 0.015 
const venus = new THREE.SphereGeometry(3);
// Earth (지구): name: 'Earth', radius: 3.5, distance: 50, color: '#3498db', rotationSpeed: 0.01, orbitSpeed: 0.01 
const earth = new THREE.SphereGeometry(3.5);
// Mars (화성): name: 'Mars', radius: 2.5, distance: 65, color: '#c0392b', rotationSpeed: 0.008, orbitSpeed: 0.008 
const mars = new THREE.SphereGeometry(2.5);

const scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = -50;
camera.position.y = 30;
camera.position.z = 20;
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// add subtle ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.intensity = 2.0;
scene.add(ambientLight);

// GUI
const gui = new GUI();

const mercuryProp = {
    rotSpeed: 0.02,
    orbitSpeed: 0.02
};
const venusProp = {
    rotSpeed: 0.015,
    orbitSpeed: 0.015
};
const earthProp = {
    rotSpeed: 0.01,
    orbitSpeed: 0.01
};
const marsProp = {
    rotSpeed: 0.008,
    orbitSpeed: 0.008
};

const cameraFolder = gui.addFolder('Camera');
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = -50;
            camera.position.y = 30;
            camera.position.z = 20;
            // camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = -50;
            camera.position.y = 30;
            camera.position.z = 20;
            // camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
cameraFolder.add(controls, 'switchCamera').name('Switch Camera Type');
cameraFolder.add(controls, 'perspective').listen().name('Current Camera');

const mercuryFolder = gui.addFolder('Mercury');
mercuryFolder.add(mercuryProp, 'rotSpeed', 0, 0.1).name('Rotation Speed');
mercuryFolder.add(mercuryProp, 'orbitSpeed', 0, 0.1).name('Orbit Speed');

const venusFolder = gui.addFolder('Venus');
venusFolder.add(venusProp, 'rotSpeed', 0, 0.1).name('Rotation Speed');
venusFolder.add(venusProp, 'orbitSpeed', 0, 0.1).name('Orbit Speed');

const earthFolder = gui.addFolder('Earth');
earthFolder.add(earthProp, 'rotSpeed', 0, 0.1).name('Rotation Speed');
earthFolder.add(earthProp, 'orbitSpeed', 0, 0.1).name('Orbit Speed');

const marsFolder = gui.addFolder('Mars');
marsFolder.add(marsProp, 'rotSpeed', 0, 0.1).name('Rotation Speed');
marsFolder.add(marsProp, 'orbitSpeed', 0, 0.1).name('Orbit Speed');

const sunMesh = new THREE.Mesh(sun, new THREE.MeshStandardMaterial({ color: 0xffff00 }));
sunMesh.position.set(0, 0, 0);
scene.add(sunMesh);

const textureLoader = new THREE.TextureLoader();

const mercuryTexture = textureLoader.load('Mercury.jpg');
const mercuryMesh = new THREE.Mesh(mercury, new THREE.MeshStandardMaterial({
    map: mercuryTexture,
    color: 0xa6a6a6,
    roughness: 0.8,
    metalness: 0.2
}));
mercuryMesh.position.set(0, 0, 20);
scene.add(mercuryMesh);

const venusTexture = textureLoader.load('Venus.jpg');
const venusMesh = new THREE.Mesh(venus, new THREE.MeshStandardMaterial({
    map: venusTexture,
    color: 0xe39e1c,
    roughness: 0.8,
    metalness: 0.2
}));
venusMesh.position.set(0, 0, 35);
scene.add(venusMesh);

const earthTexture = textureLoader.load('Earth.jpg');
const earthMesh = new THREE.Mesh(earth, new THREE.MeshStandardMaterial({
    map: earthTexture,
    color: 0x3498db,
    roughness: 0.8,
    metalness: 0.2
}));
earthMesh.position.set(0, 0, 50);
scene.add(earthMesh);

const marsTexture = textureLoader.load('Mars.jpg');
const marsMesh = new THREE.Mesh(mars, new THREE.MeshStandardMaterial({
    map: marsTexture,
    color: 0xc0392b,
    roughness: 0.8,
    metalness: 0.2
}));
marsMesh.position.set(0, 0, 65);
scene.add(marsMesh);

let pivots = [];
for (let i = 0; i < 4; i++) {
    pivots.push(new THREE.Object3D());
    pivots[i].position.set(0, 0, 0);
    scene.add(pivots[i]);
}
pivots[0].add(mercuryMesh);
pivots[1].add(venusMesh);
pivots[2].add(earthMesh);
pivots[3].add(marsMesh);

function render() {
    orbitControls.update();
    stats.update();

    mercuryMesh.rotation.y += mercuryProp.rotSpeed;
    pivots[0].rotation.y += mercuryProp.orbitSpeed;

    venusMesh.rotation.y += venusProp.rotSpeed;
    pivots[1].rotation.y += venusProp.orbitSpeed;
    

    earthMesh.rotation.y += earthProp.rotSpeed;
    pivots[2].rotation.y += earthProp.orbitSpeed;

    marsMesh.rotation.y += marsProp.rotSpeed;
    pivots[3].rotation.y += marsProp.orbitSpeed;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

render();