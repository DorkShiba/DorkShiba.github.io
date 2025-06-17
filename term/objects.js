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
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.fromArray(position);

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(ballMesh.position.x, ballMesh.position.y, ballMesh.position.z);
    const ballBody = components.physicsWorld.createRigidBody(bodyDesc);

    let colliderDesc = RAPIER.ColliderDesc.ball(radius);
    colliderDesc.setRestitution(0.8).setFriction(1.0);
    components.physicsWorld.createCollider(colliderDesc, ballBody);

    components.scene.add(ballMesh);

    return { mesh: ballMesh, body: ballBody };
}
