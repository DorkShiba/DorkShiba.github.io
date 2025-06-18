import * as THREE from 'three';
import { createGlowBall, createJumpPad, createParticle, Loader } from './objects.js';
import { Physics } from './physics.js';
import { initTri } from './tri.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

const velocities = [];
const movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

export const components = {
    scene: 0,
    camera: {
        camera: 0,
        offset: 5,
        lookAt: true,
        radius: 30,
        update: 0
    },
    physics: 0,
    renderer: 0,
    stats: 0,
    orbitControls: 0,
    composer: 0,
    physicsWorld: 0,
    loader: 0,
    eventQueue: 0
};

export const objects = {
    lights: {
        pointLight: {
            light: 0,
            color: 0xffffff,
            intensity: 10,
            distance: 20,
            decay: 1
        },
        ambientLight: {
            light: 0,
            color: 0x0f0f0f
        }
    },
    ball: {
        mesh: 0, body: 0,
        position: [0, 0, 0],
        offset: new THREE.Vector3(0, 0, 0)
    },
    particles: 0
};

async function init() {
    initThree();
    await initPhysics();  // RAPIER 초기화 완료를 기다린 후
    initComposer();
    //createGround();      // 기다린 후 여기로 진행 가능
    createObject();
    await initLoader();
    initTri(components);
    animate();
}

function initThree() {
    components.scene = new THREE.Scene();
    let scene = components.scene;
    scene.background = new THREE.Color(0x000000);

    components.camera.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    let camera = components.camera;
    camera.camera.position.set(0, 30, 30);
    scene.add(camera.camera);
    camera.update = () => {
        let ball = objects.ball;
        const ballY = ball.mesh.position.y;
        const radius = components.camera.radius; // 공에서 카메라까지의 수평 거리

        // 1. OrbitControls의 타겟을 공의 현재 위치로 설정
        components.orbitControls.target.set(ball.mesh.position.x, ballY, ball.mesh.position.z);

        // 2. 카메라 위치를 업데이트
        // controls.getAzimuthalAngle()는 마우스 입력에 따라 자동 변경됨
        const angle = components.orbitControls.getAzimuthalAngle(); // ← 회전각도
        const camX = ball.mesh.position.x + radius * Math.sin(angle);
        const camZ = ball.mesh.position.z + radius * Math.cos(angle);
        const camY = ballY + components.camera.offset; // 공보다 약간 위에서 보기

        components.camera.camera.position.set(camX, camY, camZ);

        // 3. 카메라는 항상 공을 바라봄
        components.camera.camera.lookAt(ball.mesh.position);
    }

    // renderer 설정
    components.renderer = new THREE.WebGLRenderer({ antialias: true });
    components.renderer.setSize(window.innerWidth, window.innerHeight);
    components.renderer.shadowMap.enabled = true;  // 그림자 활성화
    components.renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // 부드러운 그림자
    document.body.appendChild(components.renderer.domElement);

    components.stats = new Stats();
    document.body.appendChild(components.stats.dom);

    components.orbitControls = new OrbitControls(camera.camera, components.renderer.domElement);
    let controls = components.orbitControls;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2; // 위아래 고정
    controls.maxPolarAngle = Math.PI / 2;
    components.orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
    components.orbitControls.dampingFactor = 0.05; // 감속 정도, 크면 더 빨리 감속, default = 0.05

    // lights
    let al = objects.lights.ambientLight;
    al.light = new THREE.AmbientLight(al.color);
    scene.add(al.light);

    let pl = objects.lights.pointLight;
    pl.light = new THREE.PointLight(pl.color, pl.intensity, pl.distance, pl.decay);
    pl.light.castShadow = false;
    scene.add(pl.light);

    setupKeyboardEvents();
    window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
    components.camera.camera.aspect = window.innerWidth / window.innerHeight;
    components.camera.camera.updateProjectionMatrix();
    components.renderer.setSize(window.innerWidth, window.innerHeight);
}

async function initPhysics() { 
    await RAPIER.init(); 
    components.physics = new Physics();
    await components.physics.init(components.scene);

    // components.physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    // components.eventQueue = new RAPIER.EventQueue(true);
    // components.physics.debugger = new RapierDebugRenderer(components.scene, components.physicsWorld);

    // const debugRenderBuffers = new RAPIER.DebugRenderBuffers();
    // components.debugRenderBuffers = debugRenderBuffers;
}

function initComposer() {
    let composer = new EffectComposer(components.renderer);
    const renderPass = new RenderPass(components.scene, components.camera.camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.4, // strength
        2, // radius
        0.5 // threshold
    );
    composer.addPass(bloomPass);
    components.composer = composer;
}

function createObject() {
    let { mesh, body } = createGlowBall(components.scene, components.physics, 1, [0, 90, 0], 0xffffff, 0xa0ddff, 2.5);
    body.setEnabledRotations(true, false, true);  // X, Y, Z
    objects.ball = { mesh, body, offset: new THREE.Vector3()};

    //createJumpPad([0, -0.5, 3]);
    objects.particles = createParticle(3000, 500);
}

async function initLoader() {
  components.loader = new Loader(components.scene, components.physics);
  const loader = components.loader;

  // 병렬로 로드
  const [ rocks, layers ] = await Promise.all([
    loader.load('test_onlyrocks.glb', [0, 0, 0], 'f'),
    loader.load('test_withlayers.glb', [0, -220, 0], 'f')
    // loader.load('./assets/models/geo1.glb', [0, -80, 0], 'f')
  ]);

  // 필요하면 전역에 저장
  objects.rocks = rocks;   // { group, bodies }
  objects.layers = layers;
}

function syncRigidPair({ mesh, body }) {
  const pos = body.translation();
  const rot = body.rotation();
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
}

function animate() {
  requestAnimationFrame(animate);

  components.physics.update();     // Rapier 월드 스텝

  /* glb 모델 동기화 */
    objects.rocks?.pairs.forEach(syncRigidPair);
    objects.layers?.pairs.forEach(syncRigidPair);

    let ball = objects.ball;
    let pos = ball.body.translation();
    let rot = ball.body.rotation();

    const force = 0.3;
    const damping = 0.98;
    const linvel = ball.body.linvel();

    const newVel = { x: linvel.x, y: linvel.y, z: linvel.z };

    // 방향 입력에 따라 x/z만 업데이트
    if (movement.up) newVel.z -= force * damping;
    if (movement.down) newVel.z += force * damping;
    if (movement.left) newVel.x -= force * damping;
    if (movement.right) newVel.x += force * damping;

    // 업데이트된 속도로 설정 (y는 그대로)
    ball.body.setLinvel(newVel, true);

    ball.mesh.position.set(pos.x, pos.y, pos.z);
    ball.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    components.stats.update();
    components.orbitControls.update();

    objects.lights.pointLight.light.position.copy(ball.mesh.position);
    components.camera.update();

    components.composer.render();
}

function setupKeyboardEvents() {
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp': movement.up = true; break;
            case 'ArrowDown': movement.down = true; break;
            case 'ArrowLeft': movement.left = true; break;
            case 'ArrowRight': movement.right = true; break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.key) {
            case 'ArrowUp': movement.up = false; break;
            case 'ArrowDown': movement.down = false; break;
            case 'ArrowLeft': movement.left = false; break;
            case 'ArrowRight': movement.right = false; break;
        }
    });
}

function animateParticles(particles) {
    const positions = particles.geometry.attributes.position.array;
    const count = velocities.length;

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] += velocities[i * 3 + 0]; // x
        positions[i * 3 + 1] += velocities[i * 3 + 1]; // y
        positions[i * 3 + 2] += velocities[i * 3 + 2]; // z
    }

    particles.geometry.attributes.position.needsUpdate = true;
}


init().catch(error => {
    console.error("Failed to initialize:", error);
});






