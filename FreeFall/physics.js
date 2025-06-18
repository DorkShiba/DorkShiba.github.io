import * as THREE from 'three';
import { components, objects } from './FreeFall.js';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

export class RapierDebugRenderer {
  enabled = false;

  constructor(scene, world) {
    this.world = world;
    this.mesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update() {
    if (this.enabled) {
      const { vertices, colors } = this.world.debugRender();
      this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      this.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }
}

export class Physics {
  constructor() {
    this.world = null;
    this.eventQueue = null;
    this.debugger = null;
  }

  async init(scene) {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.eventQueue = new RAPIER.EventQueue(true);
    this.debugger = new RapierDebugRenderer(scene, this.world);
  }

  attachCollider(mesh, status, colliderEvent=null) {
    mesh.material = mesh.material.clone();
    let desc;
    if (status == 'd') { desc = RAPIER.RigidBodyDesc.dynamic(); }
    else if (status == 'f') { desc = RAPIER.RigidBodyDesc.fixed(); }
    else { desc = RAPIER.RigidBodyDesc.kinematicPositionBased(); }
    desc.setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    const quaternion = mesh.quaternion;
    desc.setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w });

    const body = this.world.createRigidBody(desc);
    body.setLinearDamping(1.2);   // 선형 감속 계수
    body.setAngularDamping(1);  // 회전 감속 계수
    body.meshRef = mesh;
    mesh.boyRef = body;
    const geometry = mesh.geometry;

    const positionAttr = geometry.getAttribute('position');
    const vertices = [];
    for (let i = 0; i < positionAttr.count; i++) {
        vertices.push(
            positionAttr.getX(i),
            positionAttr.getY(i),
            positionAttr.getZ(i)
        );
    }
    const vertexArray = new Float32Array(vertices);
    const colliderDesc = RAPIER.ColliderDesc.convexHull(vertexArray);
    colliderDesc.setRestitution(0.8).setFriction(1.0);
    if (colliderEvent) {
      colliderDesc.setActiveEvents(colliderEvent);
    }
    const collider = this.world.createCollider(colliderDesc, body);

    return body;
  }

  update() {
    this.debugger.update();
    this.world.step(components.physics.eventQueue);
  }
}