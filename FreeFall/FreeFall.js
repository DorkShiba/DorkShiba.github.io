import * as THREE from 'three';
import { createGlowBall, createJumpPad, createParticle } from './objects.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';


const movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

const components = {
    scene: 0,
    camera: {
        camera: 0,
        offset: [3, 5, 8]
    },
    renderer: 0,
    stats: 0,
    orbitControls: 0,
    composer: 0,
    physicsWorld: 0,
    loader: 0,
    eventQueue: 0
};

const lights = {
    pointLight: {
        light: 0,
        color: 0xd0ffff,
        intensity: 10,
        distance: 0,
        decay: 1
    }
}

const objects = {
    ball: { mesh: 0, body: 0, offset: new THREE.Vector3(0, 0, 0) }
};

async function init() {
    setupKeyboardEvents();
    initThree();
    await initPhysics();  // RAPIER 초기화 완료를 기다린 후
    initComposer();
    createGround();      // 기다린 후 여기로 진행 가능
    createObject();
    //initLoader();
    animate();
}

function initThree() {
    components.scene = new THREE.Scene();
    components.scene.background = new THREE.Color(0x000000);

    components.camera.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    let camera = components.camera.camera;
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
    components.eventQueue = new RAPIER.EventQueue(true);
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
    const groundGeometry = new THREE.PlaneGeometry(30, 30); // width, height
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
    let { mesh, body } = createGlowBall(components, 1, [0, 1, -3], 0xffffff, 0xa0ddff, 2.5);
    objects.ball = { mesh, body, offset: new THREE.Vector3()};

    createJumpPad(components, [0, -0.5, 3]);
    createParticle(components, 1000);
}

function initLoader() {
    components.loader = new GLTFLoader();
    let loader = components.loader;
    let scene = components.scene;

    loader.load(
        './assets/models/Ball.glb',
        function (gltf) {
            scene.add(gltf.scene);  // 모델 추가
            gltf.scene.position.set(0, 10, 0);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');  // 로딩 상태
        },
        function (error) {
            console.error('An error happened', error);
        }
        );
    }

function animate() {
    requestAnimationFrame(animate);

    // Rapier.js 물리 시뮬레이션을 한 스텝 진행합니다.
    components.physicsWorld.step(components.eventQueue);
    components.eventQueue.drainCollisionEvents((handle1, handle2, started) => {

        const b1 = components.physicsWorld.getRigidBody(handle1);
        const b2 = components.physicsWorld.getRigidBody(handle2);

        // 충돌한 바디 중 하나가 공인지 검사 후 임펄스 적용
        if (b1 === objects.ball.body || b2 === objects.ball.body) {
            objects.ball.body.applyImpulse({ x: 0, y: 40, z: 0 }, true);
        }
    })

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

    lights.pointLight.light.position.copy(ball.mesh.position);

    components.camera.camera.lookAt(ball.mesh.position);
    const offset = new THREE.Vector3().fromArray(components.camera.offset);
    components.camera.camera.position.copy(ball.mesh.position).add(offset);


    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    components.composer.render();
}

// function setupKeyboardEvents() {
//     window.addEventListener('keydown', (event) => {
//         let ball = objects.ball;
//         let force = 0.05;
//         let offset = objects.ball.offset;
//         switch (event.key) {
//             case 'ArrowUp':
//                 offset.z -= force;
//                 break;
//             case 'ArrowDown':
//                 offset.z += force;
//                 break;
//             case 'ArrowLeft':
//                 offset.x -= force;
//                 break;
//             case 'ArrowRight':
//                 offset.x -= force;
//                 break;
//         }
//     });
// }

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
function isGrounded(body) {
    const vel = body.linvel();
    return Math.abs(vel.y) < 0.05;  // 거의 수직 속도가 없으면 지면에 있다고 봄
}

init().catch(error => {
    console.error("Failed to initialize:", error);
});






