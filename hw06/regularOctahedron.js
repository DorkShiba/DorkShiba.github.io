/*-----------------------------------------------------------------------------
class RegularOctahedron

1) Vertex positions
    A octahedron has 6 vertices, 1 at the top and 4 at the base and 1 at the below
    The pyramid has 8 faces - 8 triangular faces
    Total of 24 vertices needed (8 triangular faces * 3 vertices)

2) Vertex indices
    Vertex indices of the square pyramid:
          v0
          /\
         /  \
        /    \
       /      \
      v1------v2
     /|       /|
    v4-------v3
    \        /
     \       /
      \      /
       \    /
        \  /
         v5

    The order of faces and their vertex indices is as follows:
    up-front face (v0,v1,v2), up-right face (v0,v2,v3), 
    up-back face (v0,v3,v4), up-left face (v0,v4,v1),
    down-front face (v5, v2, v1), down-right face (v5, v3, v2),
    down-back face (v5, v4, v3), down-left face(v5, v1, v4)

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The vertex normal vector is the same as the face normal vector

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    up-front face: red (1,0,0,1), up-right face: yellow (1,1,0,1), 
    up-back face: magenta (1,0,1,1), up-left face: cyan (0,1,1,1), 
    down-front face: (0, 1, 0, 1), down-right face: (0, 0, 1, 1),
    down-back face: (0, 0, 0, 1), down-left face: (1,1,1,1)

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
-----------------------------------------------------------------------------*/

export class RegularOctahedron {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const baseWidth = options.baseWidth || 1.0;
        const baseDepth = options.baseDepth || 1.0;
        const height = options.height || Math.sqrt(2)/2;

        const halfWidth = baseWidth / 2;
        const halfDepth = baseDepth / 2;

        // Initializing vertex data - 16 vertices (3 coordinates each)
        // The order of faces and their vertex indices is as follows:
        // up-front face (v0,v1,v2), up-right face (v0,v2,v3), 
        // up-back face (v0,v3,v4), up-left face (v0,v4,v1),
        // down-front face (v5, v2, v1), down-right face (v5, v3, v2),
        // down-back face (v5, v4, v3), down-left face(v5, v1, v4)
    
        this.vertices = new Float32Array([
            // up-Front face (v0,v1,v2) - Triangle
            0, height, 0,  -halfWidth, 0, halfDepth,  halfWidth, 0, halfDepth,
            
            // up-Right face (v0,v2,v3) - Triangle
            0, height, 0,  halfWidth, 0, halfDepth,  halfWidth, 0, -halfDepth,
            
            // up-Back face (v0,v3,v4) - Triangle
            0, height, 0,  halfWidth, 0, -halfDepth,  -halfWidth, 0, -halfDepth,
            
            // up-Left face (v0,v4,v1) - Triangle
            0, height, 0,  -halfWidth, 0, -halfDepth,  -halfWidth, 0, halfDepth,
            

            // down-front face (v5, v2, v1) - Triangle
            0, -height, 0,  halfWidth, 0, halfDepth,  -halfWidth, 0, halfDepth,
            
            // down-right face (v5, v3, v2) - Triangle
            0, -height, 0,  halfWidth, 0, -halfDepth,  halfWidth, 0, halfDepth,
            
            // down-back face (v5, v4, v3) - Triangle
            0, -height, 0,  -halfWidth, 0, -halfDepth,  halfWidth, 0, -halfDepth,
            
            // down-left face(v5, v1, v4) - Triangle
            0, -height, 0,  -halfWidth, 0, halfDepth,  -halfWidth, 0, -halfDepth,
        ]);

                // Calculate normals for each face
        // For each triangular face, compute cross product of two edges
        
        // up-Front face normal
        const upFrontNormal = this.calculateNormal(
            [0, height, 0], 
            [-halfWidth, 0, halfDepth], 
            [halfWidth, 0, halfDepth]
        );
        
        // up-Right face normal
        const upRightNormal = this.calculateNormal(
            [0, height, 0], 
            [halfWidth, 0, halfDepth], 
            [halfWidth, 0, -halfDepth]
        );
        
        // up-Back face normal
        const upBackNormal = this.calculateNormal(
            [0, height, 0], 
            [halfWidth, 0, -halfDepth], 
            [-halfWidth, 0, -halfDepth]
        );
        
        // up-Left face normal
        const upLeftNormal = this.calculateNormal(
            [0, height, 0], 
            [-halfWidth, 0, -halfDepth], 
            [-halfWidth, 0, halfDepth]
        );


        // down-Front face normal
        const downFrontNormal = this.calculateNormal(
            [0, -height, 0],
            [halfWidth, 0, halfDepth],
            [-halfWidth, 0, halfDepth] 
        );
        
        // down-Right face normal
        const downRightNormal = this.calculateNormal(
            [0, -height, 0],
            [halfWidth, 0, -halfDepth],
            [halfWidth, 0, halfDepth]
        );
        
        // down-Back face normal
        const downBackNormal = this.calculateNormal(
            [0, -height, 0],
            [-halfWidth, 0, -halfDepth],
            [halfWidth, 0, -halfDepth] 
        );
        
        // down-Left face normal
        const downLeftNormal = this.calculateNormal(
            [0, -height, 0],
            [-halfWidth, 0, halfDepth],
            [-halfWidth, 0, -halfDepth] 
        );

        // Normals for all vertices - repeat the normal for each vertex in a face
        this.normals = new Float32Array([
            // up-Front face - 3 vertices
            ...upFrontNormal, ...upFrontNormal, ...upFrontNormal,
            
            // up-Right face - 3 vertices
            ...upRightNormal, ...upRightNormal, ...upRightNormal,
            
            // up-Back face - 3 vertices
            ...upBackNormal, ...upBackNormal, ...upBackNormal,
            
            // up-Left face - 3 vertices
            ...upLeftNormal, ...upLeftNormal, ...upLeftNormal,
            

            // down-Front face - 3 vertices
            ...downFrontNormal, ...downFrontNormal, ...downFrontNormal,
            
            // down-Right face - 3 vertices
            ...downRightNormal, ...downRightNormal, ...downRightNormal,
            
            // down-Back face - 3 vertices
            ...downBackNormal, ...downBackNormal, ...downBackNormal,
            
            // down-Left face - 3 vertices
            ...downLeftNormal, ...downLeftNormal, ...downLeftNormal,
        ]);

        if (options.color) {
            this.colors = new Float32Array(16 * 4); // 16 vertices * 4 color components (RGBA)
            for (let i = 0; i < 16; i++) {
                this.colors[i*4] = options.color[0];
                this.colors[i*4+1] = options.color[1];
                this.colors[i*4+2] = options.color[2];
                this.colors[i*4+3] = options.color[3];
            }
        } else {
            this.colors = new Float32Array([
                // up-Front face (red) - 3 vertices
                1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
                
                // up-Right face (yellow) - 3 vertices
                1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,
                
                // up-Back face (magenta) - 3 vertices
                1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
                
                // up-Left face (cyan) - 3 vertices
                0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1,
                
                
                // down-Front face (red) - 3 vertices
                0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,
                
                // down-Right face (yellow) - 3 vertices
                0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,
                
                // down-Back face (magenta) - 3 vertices
                1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
                
                // down-Left face (cyan) - 3 vertices
                1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
            ]);
        }

        // The order of faces and their vertex indices is as follows:
        // up-front face (v0,v1,v2), up-right face (v0,v2,v3), 
        // up-back face (v0,v3,v4), up-left face (v0,v4,v1),
        // down-front face (v5, v2, v1), down-right face (v5, v3, v2),
        // down-back face (v5, v4, v3), down-left face(v5, v1, v4)
        this.texCoords = new Float32Array([
            // up-Front face - 3 vertices
            0.5, 1,  0.5, 0.5,  0.75, 0.5,
            
            // up-Right face - 3 vertices
            0.5, 1,  0.75, 0.5,  1, 0.5,
            
            // up-Back face - 3 vertices
            0.5, 1,  0, 0.5,  0.25, 0.5,
            
            // up-Left face - 3 vertices
            0.5, 1,  0.25, 0.5,  0.5, 0.5,
            

            // downFront face - 3 vertices
            0.5, 0,  0.75, 0.5,  0.5, 0.5,
            
            // downRight face - 3 vertices
            0.5, 0,  1, 0.5,  0.75, 0.5,
            
            // downBack face - 3 vertices
            0.5, 0,  0.25, 0.5,  0, 0.5,
            
            // downLeft face - 3 vertices
            0.5, 0,  0.5, 0.5,  0.25, 0.5,
        ]);

        // Indices for drawing - 24 indices (3 per triangle * 8 triangles)
        // The triangular faces are already defined as triangles,
        // but the square base needs to be drawn as 2 triangles
        this.indices = new Uint16Array([
            // upFront face
            0, 1, 2,
            
            // upRight face
            3, 4, 5,
            
            // upBack face
            6, 7, 8,
            
            // upLeft face
            9, 10, 11,
            
            // downFront face
            12, 13, 14,
            
            // downRight face
            15, 16, 17,
            
            // downBack face
            18, 19, 20,
            
            // downLeft face
            21, 22, 23
        ]);

        this.initBuffers();
    }

    // Calculate normal vector for a triangle (cross product of two edges)
    calculateNormal(v0, v1, v2) {
        // Vector from v0 to v1
        const edge1 = [
            v1[0] - v0[0],
            v1[1] - v0[1],
            v1[2] - v0[2]
        ];
        
        // Vector from v0 to v2
        const edge2 = [
            v2[0] - v0[0],
            v2[1] - v0[1],
            v2[2] - v0[2]
        ];
        
        // Cross product edge1 × edge2
        const normal = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];
        
        // Normalize the vector
        const length = Math.sqrt(
            normal[0] * normal[0] + 
            normal[1] * normal[1] + 
            normal[2] * normal[2]
        );
        
        if (length > 0) {
            normal[0] /= length;
            normal[1] /= length;
            normal[2] /= length;
        }
        
        return normal;
    }

    initBuffers() {
        const gl = this.gl;

        // Calculate buffer sizes
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // Copy data to VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // Copy index data to EBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Set up vertex attributes
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // Enable vertex attribute arrays
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // Unbind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 24);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteVertexArray(this.vao);
    }
}
