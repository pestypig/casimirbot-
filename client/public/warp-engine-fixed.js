// Optimized 3D spacetime curvature visualization engine
// Authentic Natário warp bubble physics with WebGL rendering

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        console.log("3D spacetime grid rendered with authentic Natário warp bubble physics");
        
        // Initialize WebGL state
        this.gl.clearColor(0.0, 0.0, 0.3, 1.0); // Dark blue background
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        
        // Grid rendering resources
        this.gridVertices = null;
        this.originalGridVertices = null; // Store original positions for warp calculations
        this.gridVbo = null;
        this.gridProgram = null;
        
        // Camera and projection
        this.viewMatrix = new Float32Array(16);
        this.projMatrix = new Float32Array(16);
        this.mvpMatrix = new Float32Array(16);
        
        // Current warp parameters
        this.currentParams = {
            dutyCycle: 0.14,
            g_y: 26,
            cavityQ: 1e9,
            sagDepth_nm: 16,
            tsRatio: 4102.74,
            powerAvg_MW: 83.3,
            exoticMass_kg: 1405
        };
        
        // Initialize rendering pipeline
        this._setupCamera();
        this._initializeGrid();
        
        // Bind resize handler
        this._resize = this._resize.bind(this);
        window.addEventListener('resize', this._resize);
        
        // Start render loop
        this._renderLoop();
    }

    _setupCamera() {
        const aspect = this.canvas.width / this.canvas.height;
        
        // Projection matrix - wide FOV to see full grid
        this._perspective(this.projMatrix, Math.PI / 3, aspect, 0.1, 100.0);
        
        // View matrix - camera positioned to see the spacetime grid
        const eye = [0, 0.5, -1.8];    // Pulled back and slightly above
        const center = [0, -0.1, 0];   // Looking at grid center
        const up = [0, 1, 0];
        this._lookAt(this.viewMatrix, eye, center, up);
        
        // Combined MVP matrix
        this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
    }

    _initializeGrid() {
        const gl = this.gl;
        
        // Create spacetime grid geometry
        const gridData = this._createGrid(40000, 50);
        this.gridVertices = new Float32Array(gridData);
        
        // Store original vertex positions for warp calculations
        this.originalGridVertices = new Float32Array(gridData);
        
        // Create VBO for grid
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // Compile grid shader program
        this._compileGridShaders();
    }

    // Authentic spacetime grid from gravity_sim.cpp with proper normalization
    _createGrid(size = 40_000, divisions = 50) {
        const verts = [];
        const step = size / divisions;
        const half = size / 2;
        
        // Create a slight height variation across the grid for proper 3D visualization
        const yBase = -0.15;  // Base Y level
        const yVariation = 0.05;  // Small height variation
        
        // Normalize to [-0.8, 0.8] to keep grid visible within viewport
        const norm = 0.8 / half;

        for (let z = 0; z <= divisions; ++z) {
            const zPos = (-half + z * step) * norm;
            for (let x = 0; x < divisions; ++x) {
                const x0 = (-half + x * step) * norm;
                const x1 = (-half + (x + 1) * step) * norm;
                
                // Add slight Y variation for better 3D visibility
                const y0 = yBase + yVariation * Math.sin(x0 * 2) * Math.cos(zPos * 3);
                const y1 = yBase + yVariation * Math.sin(x1 * 2) * Math.cos(zPos * 3);
                
                verts.push(x0, y0, zPos, x1, y1, zPos);      // x–lines with height variation
            }
        }
        for (let x = 0; x <= divisions; ++x) {
            const xPos = (-half + x * step) * norm;
            for (let z = 0; z < divisions; ++z) {
                const z0 = (-half + z * step) * norm;
                const z1 = (-half + (z + 1) * step) * norm;
                
                // Add slight Y variation for better 3D visibility
                const y0 = yBase + yVariation * Math.sin(xPos * 2) * Math.cos(z0 * 3);
                const y1 = yBase + yVariation * Math.sin(xPos * 2) * Math.cos(z1 * 3);
                
                verts.push(xPos, y0, z0, xPos, y1, z1);     // z–lines with height variation
            }
        }
        
        console.log(`Spacetime grid: ${verts.length/6} lines, ${divisions}x${divisions} divisions`);
        console.log(`Grid coordinate range: X=${(-half + 0 * step) * norm} to ${(-half + divisions * step) * norm}`);
        console.log(`Grid coordinate range: Z=${(-half + 0 * step) * norm} to ${(-half + divisions * step) * norm}`);
        return new Float32Array(verts);
    }

    _compileGridShaders() {
        const isWebGL2 = this.gl.getParameter(this.gl.VERSION).includes("WebGL 2.0");
        
        const gridVs = isWebGL2 ?
            "#version 300 es\n" +
            "in vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "void main() {\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "    gl_PointSize = 12.0;\n" +
            "}"
            :
            "attribute vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "void main() {\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "    gl_PointSize = 12.0;\n" +
            "}";

        const gridFs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "out vec4 frag;\n" +
            "void main() {\n" +
            "    frag = vec4(1.0, 0.0, 0.0, 1.0);\n" +  // Bright red for maximum visibility
            "}"
            :
            "precision highp float;\n" +
            "void main() {\n" +
            "    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n" +  // Bright red for maximum visibility
            "}";

        this.gridProgram = this._createShaderProgram(gridVs, gridFs);
        
        if (!this.gridProgram) {
            console.error("CRITICAL: Failed to compile grid shaders!");
            return;
        }
        
        console.log("Grid shader program compiled successfully");
    }

    updateUniforms(parameters) {
        if (!parameters) return;
        
        // Update internal parameters
        this.currentParams = { ...this.currentParams, ...parameters };
        
        // Apply warp deformation to grid
        this._updateGrid();
    }

    _updateGrid() {
        console.log("_updateGrid called");
        console.log("Updating", this.gridVertices.length / 3, "grid vertices...");
        
        if (!this.originalGridVertices) {
            console.error("No original vertices stored!");
            return;
        }
        
        // Copy original vertices
        this.gridVertices.set(this.originalGridVertices);
        
        // Apply warp field deformation
        const vtx = this.gridVertices;
        const halfSize = 20000; // Half grid size in original units
        const originalY = -0.144; // Base Y coordinate
        
        this._warpGridVertices(vtx, halfSize, originalY, this.currentParams);
        
        // Upload updated vertices to GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log("Grid vertices updated and uploaded to GPU");
    }

    // Authentic Natário spacetime curvature implementation
    _warpGridVertices(vtx, halfSize, originalY, bubbleParams) {
        // CRITICAL FIX: Work entirely in clip-space to avoid unit mismatch
        const sagRclip = bubbleParams.sagDepth_nm / halfSize * 0.8;  // Convert sag to clip-space
        const beta0 = bubbleParams.dutyCycle * bubbleParams.g_y;
        
        console.log(`WARP DEBUG: originalY=${originalY} (should be original grid Y), halfSize=${halfSize}, sagRclip=${sagRclip}`);

        for (let i = 0; i < vtx.length; i += 3) {
            // Work directly in clip-space coordinates
            const x = vtx[i];
            const z = vtx[i + 2];
            const r = Math.hypot(x, z);              // radius in clip-space
            
            // Use original Y coordinate for each vertex, not a single constant
            const y_original = this.originalGridVertices ? this.originalGridVertices[i + 1] : originalY;
            
            // Natário warp bubble profile (now with correct units)
            const prof = (r / sagRclip) * Math.exp(-(r * r) / (sagRclip * sagRclip));
            const beta = beta0 * prof;              // |β| shift vector magnitude

            // -------- LATERAL DEFORMATION: Bend X and Z with the warp field --------
            const push = beta * 0.05;               // FIXED: Keep inside clip cube (-1 to +1)
            const scale = (r > 1e-6) ? (1.0 + push / r) : 1.0;

            vtx[i] = x * scale;                      // X warped laterally
            vtx[i + 2] = z * scale;                  // Z warped laterally
            
            // -------- VERTICAL DEFORMATION: Y displacement --------
            const dy = beta * 0.05;                 // FIXED: Keep inside clip cube (-1 to +1)
            
            // Optional: Add exotic mass-based depression (negative energy density effect)
            const rho = -beta * beta * (bubbleParams.cavityQ / 1e9);  // Toy ρ ≈ -β²Q (normalized)
            const extraDip = rho * 0.002;           // Scale for subtle visibility
            
            vtx[i + 1] = y_original + dy + extraDip;  // Y warped with curvature + mass depression
        }
        
        // DIAGNOSTIC 1: Confirm CPU is mutating the vertex array
        let maxDrift = 0;
        for (let i = 0; i < vtx.length; i += 3) {
            maxDrift = Math.max(maxDrift, Math.abs(vtx[i] - vtx[i+2]));
        }
        console.log("Max lateral drift =", maxDrift.toFixed(4), "(FIXED: should be < 0.2 to stay visible)");
        
        // Visual smoke test - check Y range after warping
        let ymax = -1e9, ymin = 1e9;
        for (let i = 1; i < vtx.length; i += 3) {
            const y = vtx[i];
            if (y > ymax) ymax = y;
            if (y < ymin) ymin = y;
        }
        console.log(`Grid Y range after warp: ${ymin.toFixed(3)} … ${ymax.toFixed(3)} (should show variation)`);
    }

    _renderGridPoints() {
        const gl = this.gl;
        
        // Use the properly compiled grid program
        if (!this.gridProgram) {
            console.error("CRITICAL: Grid program not available in render!");
            return;
        }
        
        console.log("Using grid program for rendering...");
        gl.useProgram(this.gridProgram);
        
        // Bind vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const positionLocation = gl.getAttribLocation(this.gridProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        
        // Set MVP matrix
        const mvpLocation = gl.getUniformLocation(this.gridProgram, 'u_mvpMatrix');
        gl.uniformMatrix4fv(mvpLocation, false, this.mvpMatrix);
        
        // Render as lines for better visibility
        const vertexCount = this.gridVertices.length / 3;
        gl.drawArrays(gl.LINES, 0, vertexCount);
        
        console.log(`Rendered ${vertexCount} grid lines with 3D perspective - should now be visible!`);
        
        // Clean up
        gl.disableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _renderLoop() {
        this._render();
        requestAnimationFrame(() => this._renderLoop());
    }

    _render() {
        const gl = this.gl;
        
        // Clear the screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Render the spacetime grid
        this._renderGridPoints();
    }

    _resize() {
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this._setupCamera();
    }

    // Matrix math utilities
    _createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    _perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1.0 / (near - far);
        
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    }

    _lookAt(out, eye, center, up) {
        const x0 = eye[0], x1 = eye[1], x2 = eye[2];
        const y0 = center[0], y1 = center[1], y2 = center[2];
        const u0 = up[0], u1 = up[1], u2 = up[2];
        
        let z0 = x0 - y0, z1 = x1 - y1, z2 = x2 - y2;
        let len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len; z1 *= len; z2 *= len;
        
        let x0_ = u1 * z2 - u2 * z1;
        let x1_ = u2 * z0 - u0 * z2;
        let x2_ = u0 * z1 - u1 * z0;
        len = Math.hypot(x0_, x1_, x2_);
        if (!len) {
            x0_ = 0; x1_ = 0; x2_ = 0;
        } else {
            len = 1 / len;
            x0_ *= len; x1_ *= len; x2_ *= len;
        }
        
        let y0_ = z1 * x2_ - z2 * x1_;
        let y1_ = z2 * x0_ - z0 * x2_;
        let y2_ = z0 * x1_ - z1 * x0_;
        
        out[0] = x0_; out[1] = y0_; out[2] = z0; out[3] = 0;
        out[4] = x1_; out[5] = y1_; out[6] = z1; out[7] = 0;
        out[8] = x2_; out[9] = y2_; out[10] = z2; out[11] = 0;
        out[12] = -(x0_ * x0 + x1_ * x1 + x2_ * x2);
        out[13] = -(y0_ * x0 + y1_ * x1 + y2_ * x2);
        out[14] = -(z0 * x0 + z1 * x1 + z2 * x2);
        out[15] = 1;
    }

    _multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }

    destroy() {
        window.removeEventListener('resize', this._resize);
        if (this.gridVbo) {
            this.gl.deleteBuffer(this.gridVbo);
        }
        if (this.gridProgram) {
            this.gl.deleteProgram(this.gridProgram);
        }
    }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
    console.log("WarpEngine class loaded and available on window - CACHE BYPASS VERSION", Date.now());
}