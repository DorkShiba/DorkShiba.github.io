import { resizeAspectRatio } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let pillarVao, bigWingVao, rightWingVao, leftWingVao;
let bigWingTransform, rightWingTransform, leftWingTransform;
let deltaTime = 0;
let startTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupPillarBuffer() {
    const cubeVertices = new Float32Array([
        -0.2,  0,  // 좌상단
        -0.2, -1.0,  // 좌하단
         0.2, -1.0,  // 우하단
         0.2,  0   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        0.7, 0.7, 0.0, 1.0,  // 색상
        0.7, 0.7, 0.0, 1.0,
        0.7, 0.7, 0.0, 1.0,
        0.7, 0.7, 0.0, 1.0
    ]);

    pillarVao = gl.createVertexArray();
    gl.bindVertexArray(pillarVao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function setupWingsBuffers() {
    const cubeVertices = new Float32Array([
        -0.5,  0.5,  // 좌상단
        -0.5, -0.5,  // 좌하단
         0.5, -0.5,  // 우하단
         0.5,  0.5   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const bigWingColors = new Float32Array([
        1.0, 1.0, 1.0, 1.0,  // 색상
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ]);

    const smallWingColors = new Float32Array([
        0.3, 0.3, 0.3, 1.0,  // 색상
        0.3, 0.3, 0.3, 1.0,
        0.3, 0.3, 0.3, 1.0,
        0.3, 0.3, 0.3, 1.0
    ]);

    bigWingVao = gl.createVertexArray();
    gl.bindVertexArray(bigWingVao);

    // VBO for position
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bigWingColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    leftWingVao = gl.createVertexArray();
    gl.bindVertexArray(leftWingVao);

    // VBO for position
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, smallWingColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    rightWingVao = gl.createVertexArray();
    gl.bindVertexArray(rightWingVao);

    // VBO for position
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, smallWingColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function getTransformMatrices(type, params) {
    /*
    type: T, R, S 중 하나
    params:
    - T: translation vector [tx, ty]
    - R: [rotation speed]
    - S: scale vector [sx, sy]
    */
    const M = mat4.create();
    
    switch(type) {
        case 'T':
            mat4.translate(M, M, [params[0], params[1], 0]);
            break;
        case 'R':
            mat4.rotate(M, M, params[0], [0, 0, 1]);
            break;
        case 'S':
            mat4.scale(M, M, [params[0], params[1], 1]);
            break;
    }
    
    return M;
}

function applyTransform() {
    bigWingTransform = mat4.create();
    rightWingTransform = mat4.create();
    leftWingTransform = mat4.create();
    
    const bigWingTransformations = [
        getTransformMatrices('S', [1.5, 0.25]),
        getTransformMatrices('R', [Math.sin(deltaTime) * Math.PI * 2.0]),
        getTransformMatrices('T', [0, 0])
    ]
    const rightWingTransformations = [
        getTransformMatrices('S', [0.25, 0.125]),
        getTransformMatrices('R', [Math.sin(deltaTime) * Math.PI * 10.0]),
        getTransformMatrices('T', [0.75, 0]),
        getTransformMatrices('R', [Math.sin(deltaTime) * Math.PI * 2.0]),
    ]
    const leftWingTransformations = [
        getTransformMatrices('S', [0.25, 0.125]),
        getTransformMatrices('R', [Math.sin(deltaTime) * Math.PI * 10.0]),
        getTransformMatrices('T', [-0.75, 0]),
        getTransformMatrices('R', [Math.sin(deltaTime) * Math.PI * 2.0]),
    ]

    bigWingTransformations.forEach(matrix => {
        mat4.multiply(bigWingTransform, matrix, bigWingTransform);
    });
    rightWingTransformations.forEach(matrix => {
        mat4.multiply(rightWingTransform, matrix, rightWingTransform);
    });
    leftWingTransformations.forEach(matrix => {
        mat4.multiply(leftWingTransform, matrix, leftWingTransform);
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw cube
    shader.use();

    gl.bindVertexArray(pillarVao);
    shader.setMat4("u_transform", mat4.create());
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(bigWingVao);
    shader.setMat4("u_transform", bigWingTransform);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(rightWingVao);
    shader.setMat4("u_transform", rightWingTransform);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(leftWingVao);
    shader.setMat4("u_transform", leftWingTransform);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {

    deltaTime = (currentTime - startTime) / 1000;
    applyTransform();

    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        bigWingTransform = mat4.create();
        rightWingTransform = mat4.create();
        leftWingTransform = mat4.create();
        
        await initShader();

        setupPillarBuffer();
        setupWingsBuffers();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
