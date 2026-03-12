// Global constants
// id를 통해 html의 canvas 요소를 가져옴
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

// WebGL2 Context는 API 함수,
// 주요 status flag, Buffer 종류, 데이터 타입 등을 포함한다

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 처음엔 500x500으로 설정, 이후 창 크기에 맞게 조정
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
// viewport: 윈도우에서 드로잉에 사용되는 부분
// - Lower-left-x, Lower-left-y, width, height로 정의됨
gl.viewport(0, 0, canvas.width, canvas.height);

gl.enable(gl.SCISSOR_TEST); // scissor test 활성화: scissor box로 지정된 영역만 그리기 허용

// Start rendering
render();

// Render loop
function render() {
    drawRectangle(0, 0, [0.0, 0.0, 1.0]); // 좌하단 파랑
    drawRectangle(canvas.width/2, 0, [1.0, 1.0, 0.0]); // 우하단 노랑
    drawRectangle(0, canvas.height/2, [0.0, 1.0, 0.0]); // 좌상단 초록
    drawRectangle(canvas.width/2, canvas.height/2, [1.0, 0.0, 0.0]); // 우상단 빨강
}

function drawRectangle(x, y, color) {
    gl.scissor(x, y, canvas.width/2, canvas.height/2); // 박스 자르기
    gl.clearColor(color[0], color[1], color[2], 1.0); // 컬러 설정
    gl.clear(gl.COLOR_BUFFER_BIT); // 칠하기
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    var minLen = Math.min(window.innerWidth, window.innerHeight);  // 높이, 너비 중 작은 값으로 설정
    canvas.width = minLen;
    canvas.height = minLen;  // 1:1 비율 유지
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

