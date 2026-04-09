/*-----------------------------------------------------------------------------
class squaredPyramid

1) Vertex positions
    A pyramid has 1 squared face with 4 vertices
    and 4 triangle faces with each 3 vertices
    The total number of vertices is 16
    (4 for the square face and 3 for each of the 4 triangle faces)
    So, vertices need 48 floats (16 * 3 (x, y, z)) in the vertices array

    height is 1, and the base is a unit square(size is 1) centered at the origin

2) Vertex indices
    Vertex indices of the pyramid is as follows:
    v0
    / | \
    v1 v2 v3
    \ | /
     v4(back)

    The order of faces and their vertex indices is as follows:
        front (0,1,2), right (0,4,1), back (0,3,4),
        left (0,2,3), bottom (1,4,3,2) -> bottom1 (1,4,3) and bottom2 (3,2,1)

    The total number of triangles is 6 (2 for the bottom face and 1 for each of the other 4 faces)
    And, we need to maintain the order of vertices for each triangle as 
    counterclockwise (when we see the face from the outside of the cube):
        front [(0,1,2)]
        right [(0,4,1)]
        back [(0,3,4)]
        left [(0,2,3)]
        bottom1 [(1,4,3)], bottom2 [(3,2,1)]
    coordinate of each vertex is as follows:
    v0: (0, 1, 0), v1: (-0.5, 0, 0.5), v2: (0.5, 0, 0.5), 
    v3: (0.5, 0, -0.5), v4: (-0.5, 0, -0.5)

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The vertex normal vector is:
    front face: (0, 1, 1), right face: (1, 1, 0),
    left face: (-1, 1, 0), back face: (0, 1, -1), bottom1, 2 face: (0, -1, 0)

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    The color is the same as the face color
    front face: red (1,0,0,1), right face: yellow (1,1,0,1),
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
        -  color: array of 4 floats (default: [0.8, 0.8, 0.8, 1.0 ])
           in this case, all vertices have the same given color
           ex) const cube = new Cube(gl, {color: [1.0, 0.0, 0.0, 1.0]}); (all red)

7) Vertex shader: the location (0: position attrib (vec3), 1: normal attrib (vec3),
                            2: color attrib (vec4), and 3: texture coordinate attrib (vec2))
8) Fragment shader: should catch the vertex color from the vertex shader
-----------------------------------------------------------------------------*/

export class squaredPyramid {
    constructor(gl) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        //         front [(0,1,2)]
        // right [(0,4,1)]
        // back [(0,3,4)]
        // left [(0,2,3)]
        // bottom1, 2 [(1,4,3), (3,2,1)]
    //         v0: (0, 1, 0), v1: (-0.5, 0, 0.5), v2: (0.5, 0, 0.5), 
    // v3: (0.5, 0, -0.5), v4: (-0.5, 0, -0.5)
        // Initializing data
        this.vertices = new Float32Array([
            // front face  (0, 1, 2)
            0.0, 1.0, 0.0,  -0.5, 0.0, 0.5,  0.5, 0.0, 0.5,
            // right face  (0, 4, 1)
            0.0, 1.0, 0.0,  -0.5, 0.0, -0.5,  -0.5, 0.0, 0.5,
            // left face   (0, 2, 3)
            0.0, 1.0, 0.0,   0.5, 0.0, 0.5,   0.5, 0.0, -0.5,
            // back face   (0, 3, 4)
            0.0, 1.0, 0.0,   0.5, 0.0, -0.5,  -0.5, 0.0, -0.5,
            // bottom1 face (1, 4, 3)
            -0.5, 0.0, 0.5,  -0.5, 0.0, -0.5,  0.5, 0.0, -0.5,
            // bottom2 face (3, 2, 1)
            0.5, 0.0, -0.5,   0.5, 0.0, 0.5,   -0.5, 0.0, 0.5
            
        ]);

    //         front face: (0, 1, 1), right face: (1, 1, 0),
    // left face: (-1, 1, 0), back face: (0, 1, -1), bottom1, 2 face: (0, -1, 0)
        this.normals = new Float32Array([
            // front face (0, 1, 1)
            0, 1, 1,  0, 1, 1,  0, 1, 1,
            // right face
            1, 1, 0,  1, 1, 0,  1, 1, 0,
            // left face
            -1, 1, 0,  -1, 1, 0,  -1, 1, 0,
            // back face
            0, 1, -1,  0, 1, -1,  0, 1, -1,
            // bottom face 1
            0, -1, 0,   0, -1, 0,   0, -1, 0,
            0, -1, 0,   0, -1, 0,   0, -1, 0
        ]);

        this.colors = new Float32Array([
            // front face (v0,v1,v2,v3) - red
            1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,
            // right face (v0,v3,v4,v5) - yellow
            1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
            // left face (v1,v6,v7,v2) - cyan
            0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1,
            // bottom face (v7,v4,v3,v2) - blue
            0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
            // bottom 2 face (v0,v5,v6,v1) - green
            0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,
            // back face (v4,v7,v6,v5) - magenta
            1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1
        ]);

        //         front [(0,1,2)]
        // right [(0,4,1)]
        // back [(0,3,4)]
        // left [(0,2,3)]
        // bottom1 [(1,4,3)], bottom2 [(3,2,1)]

        this.indices = new Uint16Array([
            // front face  012
            0, 1, 2,
            // right face  041
            3, 4, 5,
            // left face  023
            6, 7, 8,
            // back face  034
            9, 10, 11,
            // bottom1 face  143
            12, 13, 14,
            // bottom2 face  321
            15, 16, 17
        ]);

        this.sameVertices = new Uint16Array([
            0, 3, 6, 9,    // indices of the same vertices as v0
            1, 5, 12, 17,  // indices of the same vertices as v1
            2, 7, 16,  // indices of the same vertices as v2
            8, 10, 14, 15,   // indices of the same vertices as v3
            4, 11, 13,  // indices of the same vertices as v4
        ]);

        this.vertexNormals = new Float32Array(72);
        this.faceNormals = new Float32Array(72);
        this.faceNormals.set(this.normals);

        // compute vertex normals (by averaging face normals)

        for (let i = 0; i < 24; i += 3) {

            let vn_x = (this.normals[this.sameVertices[i]*3] + 
                       this.normals[this.sameVertices[i+1]*3] + 
                       this.normals[this.sameVertices[i+2]*3]) / 3; 
            let vn_y = (this.normals[this.sameVertices[i]*3 + 1] + 
                       this.normals[this.sameVertices[i+1]*3 + 1] + 
                       this.normals[this.sameVertices[i+2]*3 + 1]) / 3; 
            let vn_z = (this.normals[this.sameVertices[i]*3 + 2] + 
                       this.normals[this.sameVertices[i+1]*3 + 2] + 
                       this.normals[this.sameVertices[i+2]*3 + 2]) / 3; 

            this.vertexNormals[this.sameVertices[i]*3] = vn_x;
            this.vertexNormals[this.sameVertices[i+1]*3] = vn_x;
            this.vertexNormals[this.sameVertices[i+2]*3] = vn_x;
            this.vertexNormals[this.sameVertices[i]*3 + 1] = vn_y;
            this.vertexNormals[this.sameVertices[i+1]*3 + 1] = vn_y;
            this.vertexNormals[this.sameVertices[i+2]*3 + 1] = vn_y;
            this.vertexNormals[this.sameVertices[i]*3 + 2] = vn_z;
            this.vertexNormals[this.sameVertices[i+1]*3 + 2] = vn_z;
            this.vertexNormals[this.sameVertices[i+2]*3 + 2] = vn_z;
        }

        this.initBuffers();
    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const totalSize = vSize + nSize + cSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        // gl.bufferSubData(target, offset, data): target buffer의 
        //     offset 위치부터 data를 copy (즉, data를 buffer의 일부에만 copy)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // normals 데이터만 업데이트
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 