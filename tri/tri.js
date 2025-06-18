import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/*──────────────────── 설정값 ────────────────────*/
const TRI_TOTAL      = 30;          // 전체 삼각형 개수 (≈ 한 화면 10개 정도)
const WIRE_RATIO     = 0.4;         // 테두리(면 없는) 비율
const SIZE_MIN_MAX   = [0.4, 1.3];  // 삼각형 스케일 범위
const CYL_RADIUS     = 6;           // 원통 반경 (카메라 중심)
const Z_RANGE        = [-3, -11];   // 원통 높이 범위 (카메라보다 앞쪽)
const GLOW_INTENSITY = 0.15;        // 희미한 발광 세기


/*───────────────── 정(正)삼각형 지오메트리 ──────────────*/
const h = Math.sqrt(3);                 // 높이 (한 변 길이 2 기준) = √3 ≈ 1.732
const triGeo = new THREE.BufferGeometry();
triGeo.setAttribute('position', new THREE.Float32BufferAttribute([
  0,   h/2, 0,    // 꼭짓점 A (상단 중앙)
 -1, -h/2, 0,     // B (좌측 하단)
  1, -h/2, 0      // C (우측 하단)
], 3));
triGeo.setIndex([0,1,2]);
triGeo.computeVertexNormals();

/*───────────────── 머티리얼 (면 / 테두리) ───────────────*/
const matFace = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: GLOW_INTENSITY,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide
});

const matWire = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.8
});

/*───────────────────── 인스턴싱 준비 ───────────────────*/
const countWire = Math.round(TRI_TOTAL * WIRE_RATIO);
const countFace = TRI_TOTAL - countWire;

const meshFace = new THREE.InstancedMesh(triGeo, matFace, countFace);
const meshWire = new THREE.InstancedMesh(triGeo, matWire, countWire);
meshFace.scale.set(10, 10, 10);
meshWire.scale.set(10, 10, 10);

const dummy = new THREE.Object3D();

// 원통 내부 무작위 위치 생성
function randomCylPos(radius, zRange) {
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;      // 균일 분포(면적 기준)
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  const z = THREE.MathUtils.randFloat(...zRange);
  return [x, y, z];
}

const randDeg = () => THREE.MathUtils.randFloat(0, Math.PI * 2);

function placeTriangle(idx, targetMesh) {
  const [x, y, z] = randomCylPos(CYL_RADIUS, Z_RANGE);
  dummy.position.set(x, y, z);
  dummy.scale.setScalar(THREE.MathUtils.randFloat(...SIZE_MIN_MAX));
  dummy.rotation.set(randDeg(), randDeg(), randDeg()); // 자유 회전
  dummy.updateMatrix();
  targetMesh.setMatrixAt(idx, dummy.matrix);
}

for (let i = 0; i < countFace; i++) placeTriangle(i, meshFace);
for (let i = 0; i < countWire; i++) placeTriangle(i, meshWire);

meshFace.instanceMatrix.needsUpdate = true;
meshWire.instanceMatrix.needsUpdate = true;


/*──────────────────── Wireframe Cube Grid ───────────────────*/
function createCubeGrid(size = 10, divisions = 10, color = 0xffffff) {
  const step = size / divisions;
  const half = size / 2;
  const positions = [];
  // generate lines parallel to X axis
  for (let y = -half; y <= half; y += step) {
    for (let z = -half; z <= half; z += step) {
      positions.push(-half, y, z,  half, y, z);
    }
  }
  // lines parallel to Y axis
  for (let x = -half; x <= half; x += step) {
    for (let z = -half; z <= half; z += step) {
      positions.push(x, -half, z,  x, half, z);
    }
  }
  // lines parallel to Z axis
  for (let x = -half; x <= half; x += step) {
    for (let y = -half; y <= half; y += step) {
      positions.push(x, y, -half,  x, y, half);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
}

const cubeGrid = createCubeGrid(12, 12, 0xffffff);


export function initTri(components) {
  // components.scene.add(meshFace, meshWire);
  for (let i = 0; i < countFace; i++) placeTriangle(i, meshFace);
  for (let i = 0; i < countWire; i++) placeTriangle(i, meshWire);
  meshFace.instanceMatrix.needsUpdate = true;
  meshWire.instanceMatrix.needsUpdate = true;

  const cubeGrid = createCubeGrid(12, 12, 0xaaaaaa);
  cubeGrid.scale.set(10, 10, 10);
  components.scene.add(cubeGrid);
}
/*──────────────────── 렌더 루프 ───────────────────*/
// const clock = new THREE.Clock();
// function animate() {
//   requestAnimationFrame(animate);

//   const t = clock.getElapsedTime() * 0.05;
//   meshFace.rotation.set(0, t, 0);
//   meshWire.rotation.set(0, t, 0);
//   cubeGrid.rotation.set(0, t * 0.5, 0); // optional slow rotation for grid

//   components.renderer.render(components.scene, components.camera.camera);
// }
// animate();
