#version 300 es

layout(location = 0) in vec3 aPos;

uniform vec3 uMove;

void main() {
    vec3 finalPos = aPos;
    if (aPos.y + uMove.y <= 1.0 || aPos.y + uMove.y >= -1.0) {
        finalPos.x += uMove.x;
    }

    if (aPos.y + uMove.y <= 1.0 || aPos.y + uMove.y >= -1.0) {
        finalPos.y += uMove.y;
    }
    gl_Position = vec4(finalPos, 1.0);
}