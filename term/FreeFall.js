import * as THREE from 'three';
import { createGlowBall } from './objects.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

const components = {
    scene: 0,
    camera: {
        camera: 0,
        position: [3, 3, 3]
    },
    renderer: 0,
    stats: 0,
    orbitControls: 0,
    composer: 0,
    physicsWorld: 0
};

const lights = {
    pointLight: {
        light: 0,
        color: 0xd0ffff,
        intensity: 10,
        distance: 4,
        decay: 1
    }
}

const objects = [];

async function init() {
    initThree();
    await initPhysics();  // RAPIER 초기화 완료를 기다린 후
    initComposer();
    createGround();      // 기다린 후 여기로 진행 가능
    createObject();
    animate();
}

function initThree() {
    components.scene = new THREE.Scene();
    components.scene.background = new THREE.Color(0x000000);

    components.camera.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    let camera = components.camera.camera;
    camera.position.fromArray(components.camera.position);
    components.scene.add(camera);

    // renderer 설정
    components.renderer = new THREE.WebGLRenderer({ antialias: true });
    components.renderer.setSize(window.innerWidth, window.innerHeight);
    components.renderer.shadowMap.enabled = true;  // 그림자 활성화
    components.renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // 부드러운 그림자
    document.body.appendChild(components.renderer.domElement);

    components.stats = new Stats();
    document.body.appendChild(components.stats.dom);

    components.orbitControls = new OrbitControls(camera, components.renderer.domElement);
    components.orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
    components.orbitControls.dampingFactor = 0.05; // 감속 정도, 크면 더 빨리 감속, default = 0.05

    // lights
    const ambientLight = new THREE.AmbientLight(0x000000);
    components.scene.add(ambientLight);

    let pl = lights.pointLight;
    pl.light = new THREE.PointLight(pl.color, pl.intensity, pl.distance, pl.decay);
    pl.light.castShadow = true;
    components.scene.add(pl.light);

    window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
    components.camera.camera.aspect = window.innerWidth / window.innerHeight;
    components.camera.camera.updateProjectionMatrix();
    components.renderer.setSize(window.innerWidth, window.innerHeight);
}

async function initPhysics() { 
    await RAPIER.init(); 
    // await로 인해 RAPIER.init() 실행 끝난 후 다음으로 진행 
    // 즉, RAPIER.init()이 끝나지 않은 상태에서 아래 RAPIER.world 생성하는 것을
    // 방지하게 해 줌 
    // Gravity = (0, -9.81, 0) 인 physics world 생성
    components.physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
}

function initComposer() {
    let composer = new EffectComposer(components.renderer);
    const renderPass = new RenderPass(components.scene, components.camera.camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.4, // strength
        2, // radius
        0.9 // threshold
    );
    composer.addPass(bloomPass);
    components.composer = composer;
}

function createGround() {
    let scene = components.scene;
    let physicsWorld = components.physicsWorld;

    // add a plane: 원래 plane은 xy plane 위에 생성됨
    const groundGeometry = new THREE.PlaneGeometry(15, 15); // width, height
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x990000, side: THREE.DoubleSide});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // x축 기준으로 -90도 회전 (+y를 up으로 하는 plane이 됨)
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground Mesh에 대응하는 RAPIER Description + Body 생성
    // fixed(): ground는 움직이지 않음
    const groundBodyDesc = RAPIER.RigidBodyDesc.fixed() 
        .setTranslation(0, 0, 0);
    const groundBody = physicsWorld.createRigidBody(groundBodyDesc);

    // Ground Mesh에 대응하는 RAPIER Collider Description 생성
    // Collider: 충돌 계산에 사용되는 simple한 형태의 geometry
    // cuboid(): box 형태의 collider
    // setFriction(2.0): 마찰 계수 설정, Ground 위의 물체의 미끌어짐 정도에 영향을 줌
    // parameter: 위의 PlaneGeometry 크기의 half로 x, z 값 지정
    //            y 값은 0.1로 지정
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(15, 0.1, 15)
        .setFriction(2.0);

    // Ground Mesh에 대응하는 RAPIER Collider 생성
    physicsWorld.createCollider(groundColliderDesc, groundBody);
}

function createObject() {
    let { mesh, body } = createGlowBall(components, 1, [0, 1, 0], 0xffffff, 0xd0ffff, 1.5);
    objects.push({ mesh, body });
}

function animate() {
    requestAnimationFrame(animate);

    // Rapier.js 물리 시뮬레이션을 한 스텝 진행합니다.
    components.physicsWorld.step();

    objects.forEach((obj) => {
    let pos = obj.body.translation();
    let rot = obj.body.rotation();
    obj.mesh.position.set(pos.x, pos.y, pos.z);
    obj.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    })

    // pos = objects[1].body.translation();
    // rot = objects[1].body.rotation();
    // objects[1].mesh.position.set(pos.x, pos.y, pos.z);
    // objects[1].mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    components.stats.update();
    components.orbitControls.update();

    lights.pointLight.light.position.copy(objects[0].mesh.position);


    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    components.composer.render();
}

init().catch(error => {
    console.error("Failed to initialize:", error);
});






