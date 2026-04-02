/*-------------------------------------------------------------------------
07_LineSegments.js

left mouse button을 click하면 선분을 그리기 시작하고, 
button up을 하지 않은 상태로 마우스를 움직이면 임시 선분을 그리고, 
button up을 하면 최종 선분을 저장하고 임시 선분을 삭제함.

임시 선분의 color는 회색이고, 최종 선분의 color는 빨간색임.

이 과정을 반복하여 여러 개의 선분 (line segment)을 그릴 수 있음. 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
const gl_PointSize = 10.0; // 점의 크기 (필요한 경우 사용)
const circleNumSegments = 100; // 원을 그릴 때 사용할 점의 개수 (필요한 경우 사용)
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array, 각 선분은 [x1, y1, x2, y2] 형태로 저장
let textOverlay; // 원 정보 표시
let textOverlay2; // line segment 정보 표시
let textOverlay3; // 교차 여부 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

let radius = 0;
let intersection = 0;
let center = [0, 0];
let intersections = [];
let lineSegmentEquation = [0, 0, 0]; // ax + by + c = 0 형태의 선분 방정식 계수 a, b, c를 저장하는 array

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        
        if (!isDrawing && lines.length < 2) { // 선분을 그리고 있지 않은 상태이고, 아직 2개의 선분이 그려지지 않은 경우에만 선분 그리기 시작
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { // 1번 또는 2번 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; // 임시 선분의 끝 point
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {
            if (lines.length == 0) {
                lines.push(renderCircle());
                let radius = Math.sqrt((tempEndPoint[0] - startPoint[0]) ** 2 + (tempEndPoint[1] - startPoint[1]) ** 2)
                center = startPoint;

                updateText(textOverlay, "Circle: center (" + startPoint[0].toFixed(2) + ", " + startPoint[1].toFixed(2) + 
                    ") radius = " + radius.toFixed(2));
            }
            else {
                lines.push([...startPoint, ...tempEndPoint]);

                updateText(textOverlay2, "Line segment: (" + lines[1][0].toFixed(2) + ", " + lines[1][1].toFixed(2) + 
                    ") ~ (" + lines[1][2].toFixed(2) + ", " + lines[1][3].toFixed(2) + ")");

                checkIntersection();
                console.log("intersection: " + intersection);

                if (intersection == 0) {
                    updateText(textOverlay3, "No intersection");
                }
                else if (intersection == 1) {
                    updateText(textOverlay3, "Intersection Points: 1 Point 1: (" + intersections[0][0].toFixed(2) + ", " + intersections[0][1].toFixed(2) + ")");
                }
                else {
                    updateText(textOverlay3, "Intersection Points: 2 Points 1: (" + intersections[0][0].toFixed(2) + ", " + intersections[0][1].toFixed(2) +
                        ") 2: (" + intersections[1][0].toFixed(2) + ", " + intersections[1][1].toFixed(2) + ")");
                }
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function renderCircle() {
    let center = startPoint;
    let radius = Math.sqrt((tempEndPoint[0] - startPoint[0]) ** 2 + (tempEndPoint[1] - startPoint[1]) ** 2);
    let verts = [];
    for (let i = 0; i <= circleNumSegments; i++) {
        let angle = (i / circleNumSegments) * 2 * Math.PI;
        let x = center[0] + radius * Math.cos(angle);
        let y = center[1] + radius * Math.sin(angle);
        verts.push(x, y);
    }

    return verts;
}

function checkIntersection() {
    let xgap = lines[1][2] - lines[1][0];
    let ygap = lines[1][3] - lines[1][1];
    let xcgap = lines[1][0] - center[0];
    let ycgap = lines[1][1] - center[1];

    console.log("xgap: " + xgap + " ygap: " + ygap);

    let a = xgap ** 2 + ygap ** 2;
    let b = 2 * (xcgap * xgap + ycgap * ygap);
    let c = xcgap ** 2 + ycgap ** 2 - radius ** 2;

    let discriminant = b ** 2 - 4 * a * c;
    console.log("discriminant: " + discriminant);
    let ans1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    let ans2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    if (discriminant < 0) {
        intersection = 0; // 교차하지 않음
    } else if (discriminant === 0) {
        intersection = 1; // 한 점에서 접함
        let intersectX = lines[1][0] + ans * xgap;
        let intersectY = lines[1][1] + ans * ygap;
        if (pointOnLineSegment(intersectX, intersectY)) {
            intersections.push([intersectX, intersectY]);
        }
    } else {
        intersection = 2; // 두 점에서 교차

        let intersectX = lines[1][0] + ans1 * xgap;
        let intersectY = lines[1][1] + ans1 * ygap;
        if (pointOnLineSegment(intersectX, intersectY)) {
            intersections.push([intersectX, intersectY]);
        } else { intersection -= 1; }

        intersectX = lines[1][0] + ans2 * xgap;
        intersectY = lines[1][1] + ans2 * ygap;
        if (pointOnLineSegment(intersectX, intersectY)) {
            intersections.push([intersectX, intersectY]);
        } else { intersection -= 1; }
    }
}

function pointOnLineSegment(px, py) {
    let xisIntervalX = (px >= Math.min(lines[1][0], lines[1][2]) && px <= Math.max(lines[1][0], lines[1][2]));
    let isIntervalY = (py >= Math.min(lines[1][1], lines[1][3]) && py <= Math.max(lines[1][1], lines[1][3]));
    return xisIntervalX && isIntervalY;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 저장된 선들 그리기
    let num = 0;
    for (let line of lines) {
        if (num == 0) { // 첫 번째 선분인 경우, yellow
            shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, circleNumSegments + 1);
        }
        else { // num == 1 (2번째 선분인 경우), red
            shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
        num++;
    }

    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색

        if (lines.length == 0) {
            let verts = renderCircle();

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, circleNumSegments + 1);
        }
        else {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                        gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
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
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
