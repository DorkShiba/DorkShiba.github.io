/*--------------------------------------------------------------------------------
18_SmoothShading.js

- Viewing a 3D unit cylinder at origin with perspective projection
- Rotating the cylinder by ArcBall interface (by left mouse button dragging)
- Keyboard controls:
    - 'a' to switch between camera and model rotation modes in ArcBall interface
    - 'r' to reset arcball
    - 's' to switch to smooth shading
    - 'f' to switch to flat shading
- Applying Diffuse & Specular reflection using Flat/Smooth shading to the cylinder
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';
import { Arcball } from '../util/arcball.js';
import { Cylinder } from '../util/cylinder.js';
import { Cone } from './cone.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let lampShader;
let textOverlay, textOverlay2, textOverlay3, textOverlay4, textOverlay5,
    textOverlay6, textOverlay7, textOverlay8, textOverlay9;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();
let arcBallMode = 'CAMERA';     // 'CAMERA' or 'MODEL'
let shadingMode = 'FLAT';       // 'FLAT' or 'SMOOTH'
let shadingMode2 = 'GOURAUD';       // 'PHONG' or 'GOURAUD'

const cone = new Cone(gl, 32);
const lamp = new Cube(gl);

const cameraPos = vec3.fromValues(0, 0, -3);
const lightPos = vec3.fromValues(1.0, 0.7, 1.0);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);

// Arcball object: initial distance 5.0, rotation sensitivity 2.0, zoom sensitivity 0.0005
// default of rotation sensitivity = 1.5, default of zoom sensitivity = 0.001
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

async function reloadShader() {
    let vsPath, fsPath;
    if (shadingMode2 === 'GOURAUD') {
        vsPath = 'gouraudVert.glsl';
        fsPath = 'gouraudFrag.glsl';
    } else if (shadingMode2 === 'PHONG') {
        vsPath = 'phongVert.glsl';
        fsPath = 'phongFrag.glsl';
    }

    const vertexShaderSource = await readShaderFile(vsPath);
    const fragmentShaderSource = await readShaderFile(fsPath);
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);

    shader.use();
    shader.setMat4("u_projection", projMatrix);
    shader.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
    shader.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
    shader.setFloat("material.shininess", 16);
    shader.setVec3("light.position", lightPos);
    shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
    shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
    shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
    shader.setVec3("u_viewPos", cameraPos);
}

function copyNormals() {
    if (shadingMode == 'SMOOTH') {
        cone.copyVertexNormalsToNormals();
        cone.updateNormals();
    } else if (shadingMode == 'FLAT') {
        cone.copyFaceNormalsToNormals();
        cone.updateNormals();
    }
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'a') {
            if (arcBallMode == 'CAMERA') {
                arcBallMode = 'MODEL';
            }
            else {
                arcBallMode = 'CAMERA';
            }
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 'r') {
            arcball.reset();
            modelMatrix = mat4.create(); 
            arcBallMode = 'CAMERA';
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 's') {
            shadingMode = 'SMOOTH';
            copyNormals();
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + shadingMode2 + ")");
            render();
        }
        else if (event.key == 'f') {
            shadingMode = 'FLAT';
            copyNormals();
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + shadingMode2 + ")");
            render();
        }
        else if (event.key == 'g') {
            copyNormals();
            shadingMode2 = 'GOURAUD';
            reloadShader();
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + shadingMode2 + ")");
            render();
        }
        else if (event.key == 'p') {
            copyNormals();
            shadingMode2 = 'PHONG';
            reloadShader();
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + shadingMode2 + ")");
            render();
        }
    });
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('gouraudVert.glsl');
    const fragmentShaderSource = await readShaderFile('gouraudFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initLampShader() {
    const vertexShaderSource = await readShaderFile('shLampVert.glsl');
    const fragmentShaderSource = await readShaderFile('shLampFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    // clear canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (arcBallMode == 'CAMERA') {
        viewMatrix = arcball.getViewMatrix();
    }
    else { // arcBallMode == 'MODEL'
        modelMatrix = arcball.getModelRotMatrix();
        viewMatrix = arcball.getViewCamDistanceMatrix();
    }

    // drawing the cone
    shader.use();  // using the cone's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    cone.draw(shader);

    // drawing the lamp
    lampShader.use();
    lampShader.setMat4('u_view', viewMatrix);
    lamp.draw(lampShader);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        // View transformation matrix (camera at cameraPos, invariant in the program)
        mat4.translate(viewMatrix, viewMatrix, cameraPos);

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // creating shaders
        shader = await initShader();
        lampShader = await initLampShader();

        shader.use();
        shader.setMat4("u_projection", projMatrix);

        shader.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
        shader.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
        shader.setFloat("material.shininess", 16);

        shader.setVec3("light.position", lightPos);
        shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
        shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shader.setVec3("u_viewPos", cameraPos);

        lampShader.use();
        lampShader.setMat4("u_projection", projMatrix);
        const lampModelMatrix = mat4.create();
        mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
        mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
        lampShader.setMat4('u_model', lampModelMatrix);

        textOverlay = setupText(canvas, "Cone with Lighting");
        textOverlay2 = setupText(canvas, "arcball mode: " + arcBallMode, 2);
        textOverlay3 = setupText(canvas, "shading mode: " + shadingMode + " (" + shadingMode2 + ")", 3);
        textOverlay4 = setupText(canvas, "press 'a' to change arcball mode", 4);
        textOverlay5 = setupText(canvas, "press 'r' to reset arcball", 5);
        textOverlay6 = setupText(canvas, "press 's' to switch to smooth shading", 6);
        textOverlay7 = setupText(canvas, "press 'f' to switch to flat shading", 7);
        textOverlay8 = setupText(canvas, "press 'g' to switch to Gouraud shading", 8);;
        textOverlay9 = setupText(canvas, "press 'p' to switch to Phong shading", 9);;
        setupKeyboardEvents();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

