/*-----------------------------------------------------------------------------
class Cube

1) Vertex positions
    A cube has 6 faces and each face has 4 vertices
    The total number of vertices is 24 (6 faces * 4 verts)
    So, vertices need 72 floats (24 * 3 (x, y, z)) in the vertices array

2) Vertex indices
    Vertex indices of the unit cube is as follows:
     v6----- v5
     /|      /|
    v1------v0|
    | |     | |
    | v7----|-v4
    |/      |/
    v2------v3

    The order of faces and their vertex indices is as follows:
        front (0,1,2,3), right (0,3,4,5), top (0,5,6,1), 
        left (1,6,7,2), bottom (7,4,3,2), back (4,7,6,5)
    Note that each face has two triangles, 
    so the total number of triangles is 12 (6 faces * 2 triangles)
    And, we need to maintain the order of vertices for each triangle as 
    counterclockwise (when we see the face from the outside of the cube):
        front [(0,1,2), (2,3,0)]
        right [(0,3,4), (4,5,0)]
        top [(0,5,6), (6,1,0)]
        left [(1,6,7), (7,2,1)]
        bottom [(7,4,3), (3,2,7)]
        back [(4,7,6), (6,5,4)]

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The normal vector is the same as the face normal vector
    front face: (0,0,1), right face: (1,0,0), top face: (0,1,0), 
    left face: (-1,0,0), bottom face: (0,-1,0), back face: (0,0,-1) 

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    The color is the same as the face color
    front face: red (1,0,0,1), right face: yellow (1,1,0,1), top face: green (0,1,0,1), 
    left face: cyan (0,1,1,1), bottom face: blue (0,0,1,1), back face: magenta (1,0,1,1) 

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
    The texture coordinates are the same as the face texture coordinates
    front face: v0(1,1), v1(0,1), v2(0,0), v3(1,0)
    right face: v0(0,1), v3(0,0), v4(1,0), v5(1,1)
    top face: v0(1,0), v5(0,0), v6(0,1), v1(1,1)
    left face: v1(1,0), v6(0,0), v7(0,1), v2(1,1)
    bottom face: v7(0,0), v4(0,1), v3(1,1), v2(1,0)
    back face: v4(0,0), v7(0,1), v6(1,1), v5(1,0)

6) Parameters:
    1] gl: WebGLRenderingContext
    2] options:
        1> color: array of 4 floats (default: [0.8, 0.8, 0.8, 1.0 ])
           in this case, all vertices have the same given color

7) Vertex shader: the location (0: position attrib (vec3), 1: normal attrib (vec3),
                            2: color attrib (vec4), and 3: texture coordinate attrib (vec2))
8) Fragment shader: should catch the vertex color from the vertex shader
-----------------------------------------------------------------------------*/

export class Pyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();

        const faceColors = options.faceColors || [
            [0, 0, 1, 1],  // bottom tri 1
            [0, 0, 1, 1],  // bottom tri 2
            [1, 0, 0, 1],  // front
            [1, 1, 0, 1],  // right
            [1, 0, 1, 1],  // left
            [0, 1, 1, 1],  // back
        ];

        // 정점 데이터 (position + normal + color + texcoord)
        const vertices = [];

        const pushVertex = (pos, normal, color, uv) => {
            vertices.push(...pos, ...normal, ...color, ...uv);
        };

        // 바닥 삼각형 1: v0-v1-v2
        pushVertex([-0.5, 0,  0.5], [0, -1, 0], faceColors[0], [0, 0]);
        pushVertex([ 0.5, 0,  0.5], [0, -1, 0], faceColors[0], [1, 0]);
        pushVertex([ 0.5, 0, -0.5], [0, -1, 0], faceColors[0], [1, 1]);

        // 바닥 삼각형 2: v2-v3-v0
        pushVertex([ 0.5, 0, -0.5], [0, -1, 0], faceColors[1], [1, 1]);
        pushVertex([-0.5, 0, -0.5], [0, -1, 0], faceColors[1], [0, 1]);
        pushVertex([-0.5, 0,  0.5], [0, -1, 0], faceColors[1], [0, 0]);

        // 옆면 삼각형들
        const apex = [0, 1, 0];
        const base = [
            [-0.5, 0,  0.5], // v0
            [ 0.5, 0,  0.5], // v1
            [ 0.5, 0, -0.5], // v2
            [-0.5, 0, -0.5], // v3
        ];

        const sideFaces = [
            [base[0], base[1], faceColors[2]], // front
            [base[1], base[2], faceColors[3]], // right
            [base[2], base[3], faceColors[4]], // back
            [base[3], base[0], faceColors[5]]  // left
        ];

        for (const [vA, vB, color] of sideFaces) {
            // 정점 A
            const n = this.computeNormal(vA, vB, apex);
            pushVertex(vA, n, color, [0, 0]);
            pushVertex(vB, n, color, [1, 0]);
            pushVertex(apex, n, color, [0.5, 1]);
        }

        this.vertexData = new Float32Array(vertices);

        this.initBuffers();
    }

    computeNormal(p1, p2, p3) {
        const u = [
            p2[0] - p1[0],
            p2[1] - p1[1],
            p2[2] - p1[2],
        ];
        const v = [
            p3[0] - p1[0],
            p3[1] - p1[1],
            p3[2] - p1[2],
        ];
        const nx = u[1] * v[2] - u[2] * v[1];
        const ny = u[2] * v[0] - u[0] * v[2];
        const nz = u[0] * v[1] - u[1] * v[0];
        const len = Math.hypot(nx, ny, nz);
        return [nx / len, ny / len, nz / len];
    }

    initBuffers() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

        const stride = (3 + 3 + 4 + 2) * 4;
        let offset = 0;

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, offset); // position
        gl.enableVertexAttribArray(0);
        offset += 3 * 4;

        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, offset); // normal
        gl.enableVertexAttribArray(1);
        offset += 3 * 4;

        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, offset); // color
        gl.enableVertexAttribArray(2);
        offset += 4 * 4;

        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, offset); // texCoord
        gl.enableVertexAttribArray(3);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 18);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteVertexArray(this.vao);
    }
}
