#version 300 es

layout (location = 0) in vec3 aPos;

uniform vec2 uMove;

void main() {
    gl_Position = vec4(aPos.xy + uMove, 0.0, 1.0);
} 