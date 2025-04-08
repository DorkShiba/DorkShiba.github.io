import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader;
let axesVAO;
let sunVAO, earthVAO, moonVAO;

let sunTransform, earthTransform, moonTransform;
let rotationAngle = 0;
let lastTime = 0;

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

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -0.8, 0.0, 0.8, 0.0,  // x축
        0.0, -0.8, 0.0, 0.8   // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
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

    const sunColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    const earthColors = new Float32Array([
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0
    ]);

    const moonColors = new Float32Array([
        1.0, 1.0, 0.0, 1.0,  // yellow
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ]);

    sunVAO = gl.createVertexArray();
    earthVAO = gl.createVertexArray();
    moonVAO = gl.createVertexArray();

    gl.bindVertexArray(sunVAO);

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sunColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);


    gl.bindVertexArray(earthVAO);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, earthColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);


    gl.bindVertexArray(moonVAO);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, moonColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function getTransformMatrices(transformType, value) {
    const M = mat4.create();

    switch(transformType) {
        case 'T':
            return mat4.translate(M, M, [value[0], value[1], 0]);
        case 'R':
            return mat4.rotate(M, M, value[0], [0, 0, 1]);
        case 'S':
            return mat4.scale(M, M, [value[0], value[1], 1]);
    }
}

function applyTransform(type) {
    let transform = [];
    switch(type) {
        case 'S':
            sunTransform  = mat4.create();
            // [크기조정, 자전]
            transform = [getTransformMatrices('S', [0.2, 0.2]), getTransformMatrices('R', [rotationAngle * 0.25])];

            transform.forEach(matrix => {
                mat4.multiply(sunTransform, matrix, sunTransform);
            });
            break;
        case 'E':
            earthTransform = mat4.create();
            // [크기조정, 자전, 공전궤도이동, 공전]
            transform = [getTransformMatrices('S', [0.1, 0.1]), getTransformMatrices('R', [rotationAngle]),
            getTransformMatrices('T', [0.7, 0.0]), getTransformMatrices('R', [rotationAngle / 6])];

            transform.forEach(matrix => {
                mat4.multiply(earthTransform, matrix, earthTransform);
            });
            break;
        case 'M':
            moonTransform = mat4.create();
            // [크기조정, 자전, 달 공전궤도로 이동(지구 중심에서부터), 달 공전, 지구 공전궤도로 이동, 지구 공전]
            transform = [getTransformMatrices('S', [0.05, 0.05]), getTransformMatrices('R', [rotationAngle]),
                getTransformMatrices('T', [0.2, 0.0]), getTransformMatrices('R', [rotationAngle * 2]),
                getTransformMatrices('T', [0.7, 0.0]), getTransformMatrices('R', [rotationAngle / 6])];

            transform.forEach(matrix => {
                mat4.multiply(moonTransform, matrix, moonTransform);
            });
            break;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();

    // 축 그리기
    shader.setMat4("u_model", mat4.create());
    gl.bindVertexArray(axesVAO);
    gl.drawArrays(gl.LINES, 0, 4);

    // 정사각형 그리기
    shader.setMat4("u_model", sunTransform);
    gl.bindVertexArray(sunVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_model", earthTransform);
    gl.bindVertexArray(earthVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_model", moonTransform);
    gl.bindVertexArray(moonVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    rotationAngle += Math.PI * deltaTime;
    applyTransform('S');
    applyTransform('E');
    applyTransform('M');

    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('hw04Vert.glsl');
    const fragmentShaderSource = await readShaderFile('hw04Frag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        sunTransform = mat4.create();
        earthTransform = mat4.create();
        moonTransform = mat4.create();
        
        shader = await initShader();
        setupAxesBuffers(shader);
        setupCubeBuffers(shader);
        shader.use();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
