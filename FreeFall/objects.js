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
    const padGeometry = new THREE.PlaneGeometry(2, 2);
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