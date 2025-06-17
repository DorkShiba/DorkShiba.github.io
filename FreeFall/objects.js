import * as THREE from 'three';  

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';


export function createGlowBall(
    components,
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

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(ballMesh.position.x, ballMesh.position.y, ballMesh.position.z);
    const ballBody = components.physicsWorld.createRigidBody(bodyDesc);
    ballBody.setLinearDamping(1.2);   // 선형 감속 계수
    ballBody.setAngularDamping(1);  // 회전 감속 계수

    let colliderDesc = RAPIER.ColliderDesc.ball(radius);
    colliderDesc.setRestitution(0.8).setFriction(1.0);
    components.physicsWorld.createCollider(colliderDesc, ballBody);

    components.scene.add(ballMesh);

    return { mesh: ballMesh, body: ballBody };
}

export function createJumpPad(components, position = [0, 0, 0]) {
    const padGeometry = new THREE.CircleGeometry(1.5, 30);
    const padMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1.5
    });
    const padMesh = new THREE.Mesh(padGeometry, padMaterial);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.fromArray(position);
    components.scene.add(padMesh);

    const padBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(...position);
    const padBody = components.physicsWorld.createRigidBody(padBodyDesc);

    // 센서로 설정 (충돌은 감지되지만 반응하지 않음)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.1, 1)
        .setSensor(true)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    components.physicsWorld.createCollider(colliderDesc, padBody);

    return { mesh: padMesh, body: padBody };
}

export function createParticle(components, particleCount, areaRange=50, color= 0xa0c0ff) {
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