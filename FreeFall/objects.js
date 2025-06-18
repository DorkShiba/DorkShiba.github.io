import * as THREE from 'three';  
import { Physics } from './physics.js';
import { components, objects } from './FreeFall.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';


import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';


export class Loader {
    constructor(scene, physics) {
        const draco = new DRACOLoader();
        draco.setDecoderPath(
            'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
        );

        this.loader = new GLTFLoader();
        this.scene = scene;
        this.physics = physics;
    }
    
    load(path, position, status='d') {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    let body = null;
                    let meshes = [];
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            meshes.push(child);
                        }
                    });
                    meshes.forEach((mesh) => {
                        let events = null;
                        if (mesh.name.includes('Plane')) {
                            events = RAPIER.ActiveEvents.COLLISION_EVENTS;
                        }
                        this.physics.attachCollider(mesh, status, events);
                        this.scene.add(mesh);
                    })
                    resolve(body); // 여기서 body 반환
                },
                undefined,
                (error) => reject(error)
            );
        });
    }
}

export function createGlowBall(
    scene, physics,
    radius=1, position=[0, 0, 0],
    color=0xffffff, emissive=0xffffff, emissiveIntensity=1
) {
    const ballGeometry = new THREE.SphereGeometry(radius);
    const ballMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.fromArray(position);
    ballMesh.receiveShadow = true

    const body = physics.attachCollider(ballMesh, 'd');
    scene.add(ballMesh);

    return { mesh: ballMesh, body: body };
}

export function createJumpPad(position = [0, 0, 0]) {
    const padGeometry = new THREE.SphereGeometry(1, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
    const padMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        emissiveIntensity: 1.5,
        side: THREE.DoubleSide
    });
    const padMesh = new THREE.Mesh(padGeometry, padMaterial);
    // padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.fromArray(position);
    components.scene.add(padMesh);

    const body = components.physics.attachCollider(padMesh, 'f', RAPIER.ActiveEvents.COLLISION_EVENTS);

    return { mesh: padMesh, body: body };
}

export function createParticle(particleCount, areaRange=50, color= 0xa0c0ff) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * areaRange,
            (Math.random() - 0.5) * areaRange,
            (Math.random() - 0.5) * areaRange
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(color) },
        },
        vertexShader: `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 5.0;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            void main() {
                float d = distance(gl_PointCoord, vec2(0.5));
                if (d > 0.5) discard; // 원형 마스크
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    components.scene.add(particles);

    return particles;
}

export function createGround() {
    let scene = components.scene;

    // add a plane: 원래 plane은 xy plane 위에 생성됨
    const groundGeometry = new THREE.PlaneGeometry(30, 30); // width, height
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x990000, side: THREE.DoubleSide});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // x축 기준으로 -90도 회전 (+y를 up으로 하는 plane이 됨)
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground Mesh에 대응하는 RAPIER Description + Body 생성
    // fixed(): ground는 움직이지 않음
    components.physics.attachCollider(ground, 'f');
}