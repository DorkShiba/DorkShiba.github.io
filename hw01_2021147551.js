const canvas = document.getElementById('hw1');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

canvas.width = 500;
canvas.height = 500;

halfWidth = 0;
halfHeight = 0;

renderCanvas(canvas.width, canvas.height);

// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
    // Draw something here
}

function renderCanvas(cw, ch) {
    halfWidth = cw / 2;
    halfHeight = ch / 2;

    gl.viewport(0, 0, halfWidth, halfHeight);
    gl.enable(gl.SCISSOR_TEST);

    gl.scissor(0, 0, halfWidth, halfHeight);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);

    render();

    gl.viewport(0, halfHeight, halfWidth, halfHeight);
    gl.scissor(0, halfHeight, halfWidth, halfHeight);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);

    render();

    gl.viewport(halfWidth, 0, halfWidth, halfHeight);
    gl.scissor(halfWidth, 0, halfWidth, halfHeight);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);

    render();

    gl.viewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);

    render();
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    if (window.innerWidth < 500 || window.innerHeight < 500) {
        var min = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = min;
        canvas.height = min
    } else {
        canvas.width = 500;
        canvas.height = 500;
    }

    renderCanvas(canvas.width, canvas.height);
});

