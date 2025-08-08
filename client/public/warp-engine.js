//====================================================================
//  Natário Warp‑Bubble Visualiser (optimized with enhanced physics visualization)
//  ------------------------------------------------------------------
//  Real-time WebGL visualization with authentic parameter mapping
//====================================================================

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported");

        // Enable derivatives extension for WebGL1 compatibility
        this.hasDerivatives = true;
        if (!this.gl.getExtension("OES_standard_derivatives")) {
            console.warn("OES_standard_derivatives extension not available – grid lines disabled for WebGL1");
            this.hasDerivatives = false;
        }

        // Default Natário parameters (Hover mode defaults)
        this.uniforms = {
            dutyCycle: 0.14,        // 14% duty cycle
            g_y: 26.0,              // geometric amplification
            cavityQ: 1e9,           // electromagnetic Q-factor
            sagDepth_nm: 16.0,      // sag depth in nanometers
            tsRatio: 4102.74,       // time-scale separation
            powerAvg_MW: 83.3,      // average power (MW)
            exoticMass_kg: 1405     // exotic mass (kg)
        };

        this._compileShaders();
        this._initQuad();
        this._cacheUniformLocations();
        this._resize();
        
        // Enable depth buffer for 3D grid rendering
        this.gl.enable(this.gl.DEPTH_TEST);
        
        // Auto-resize and continuous rendering
        window.addEventListener("resize", () => this._resize());
        this._startRenderLoop();
    }

    //----------------------------------------------------------------
    //  Enhanced shader compilation with visual physics mapping
    //----------------------------------------------------------------
    _compileShaders() {
        const isWebGL2 = this.gl.getParameter(this.gl.VERSION).includes("WebGL 2.0");
        
        const vs = isWebGL2 ? 
            "#version 300 es\n" +
            "in vec2 a_position;\n" +
            "out vec2 v_uv;\n" +
            "void main() {\n" +
            "    v_uv = a_position * 0.5 + 0.5;\n" +
            "    gl_Position = vec4(a_position, 0.0, 1.0);\n" +
            "}"
            :
            "attribute vec2 a_position;\n" +
            "varying vec2 v_uv;\n" +
            "void main() {\n" +
            "    v_uv = a_position * 0.5 + 0.5;\n" +
            "    gl_Position = vec4(a_position, 0.0, 1.0);\n" +
            "}";

        const fs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "in vec2 v_uv;\n" +
            "out vec4 frag;\n" +
            "\n" +
            "uniform float u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm,\n" +
            "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time;\n" +
            "\n" +
            "// Natário β‑field with authentic physics\n" +
            "vec3 betaField(vec3 x) {\n" +
            "    float R = u_sagDepth_nm * 1e-9;  // nm → m conversion\n" +
            "    float r = length(x);\n" +
            "    if (r < 1e-9) return vec3(0.0);\n" +
            "    \n" +
            "    float beta0 = u_dutyCycle * u_g_y;  // Physics cheat-sheet: DutyCycle × γ_geo\n" +
            "    float prof = (r / R) * exp(-(r * r) / (R * R));\n" +
            "    return beta0 * prof * (x / r);\n" +
            "}\n" +
            "\n" +
            "// Enhanced color mapping with physics-based intensity\n" +
            "vec3 warpColor(float b) {\n" +
            "    float intensity = clamp(b * 100.0, 0.0, 1.0);\n" +
            "    return mix(vec3(0.1, 0.2, 0.8), vec3(0.9, 0.3, 0.1), intensity);\n" +
            "}\n" +
            "\n" +
            "void main() {\n" +
            "    vec2 center = v_uv - 0.5;\n" +
            "    vec3 pos = vec3(center * 2.0e-8, 0.0);  // 20nm field of view\n" +
            "    \n" +
            "    float bmag = length(betaField(pos));\n" +
            "    \n" +
            "    // Enhanced ripple: Power controls speed, Duty controls amplitude\n" +
            "    float rippleSpeed = sqrt(u_powerAvg_MW / 100.0) * 2.0;\n" +
            "    float rippleAmplitude = 0.15 * u_dutyCycle;\n" +
            "    bmag += sin(u_time * rippleSpeed + length(center) * 20.0) * rippleAmplitude;\n" +
            "    \n" +
            "    vec3 color = warpColor(bmag);\n" +
            "    \n" +
            "    // Q-Factor driven halo/bloom effect\n" +
            "    float halo = smoothstep(8.0, 10.0, log(u_cavityQ) / log(10.0));\n" +
            "    color += halo * vec3(1.0, 0.8, 0.3) * 0.4;\n" +
            "    \n" +
            "    // Exotic Mass shock ring visualization\n" +
            "    float shockRadius = pow(u_exoticMass_kg / 1000.0, 0.333) * 1.0e-8;\n" +
            "    float distFromCenter = length(pos);\n" +
            "    float shock = step(shockRadius, distFromCenter) * \n" +
            "                 (1.0 - step(shockRadius * 1.3, distFromCenter));\n" +
            "    color = mix(color, vec3(0.9, 0.9, 1.0), 0.25 * shock);\n" +
            "    \n" +
            (this.hasDerivatives ?
            "    // Grid overlay with derivatives\n" +
            "    vec2 grid = abs(fract(center * 50.0) - 0.5) / fwidth(center * 50.0);\n" +
            "    float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);\n" +
            "    color = mix(color, vec3(0.5), gridLine * 0.15);\n"
            :
            "    // Grid disabled for WebGL1 compatibility\n") +
            "    \n" +
            "    frag = vec4(color, 1.0);\n" +
            "}"
            :
            (this.hasDerivatives ? "#extension GL_OES_standard_derivatives : enable\n" : "") +
            "precision highp float;\n" +
            "varying vec2 v_uv;\n" +
            "\n" +
            "uniform float u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm,\n" +
            "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time;\n" +
            "\n" +
            "vec3 betaField(vec3 x) {\n" +
            "    float R = u_sagDepth_nm * 1e-9;\n" +
            "    float r = length(x);\n" +
            "    if (r < 1e-9) return vec3(0.0);\n" +
            "    \n" +
            "    float beta0 = u_dutyCycle * u_g_y;\n" +
            "    float prof = (r / R) * exp(-(r * r) / (R * R));\n" +
            "    return beta0 * prof * (x / r);\n" +
            "}\n" +
            "\n" +
            "vec3 warpColor(float b) {\n" +
            "    float intensity = clamp(b * 100.0, 0.0, 1.0);\n" +
            "    return mix(vec3(0.1, 0.2, 0.8), vec3(0.9, 0.3, 0.1), intensity);\n" +
            "}\n" +
            "\n" +
            "void main() {\n" +
            "    vec2 center = v_uv - 0.5;\n" +
            "    vec3 pos = vec3(center * 2.0e-8, 0.0);\n" +
            "    \n" +
            "    float bmag = length(betaField(pos));\n" +
            "    \n" +
            "    // Enhanced ripple effects\n" +
            "    float rippleSpeed = sqrt(u_powerAvg_MW / 100.0) * 2.0;\n" +
            "    float rippleAmplitude = 0.15 * u_dutyCycle;\n" +
            "    bmag += sin(u_time * rippleSpeed + length(center) * 20.0) * rippleAmplitude;\n" +
            "    \n" +
            "    vec3 color = warpColor(bmag);\n" +
            "    \n" +
            "    // Q-Factor halo\n" +
            "    float halo = smoothstep(8.0, 10.0, log(u_cavityQ) / log(10.0));\n" +
            "    color += halo * vec3(1.0, 0.8, 0.3) * 0.4;\n" +
            "    \n" +
            "    // Exotic Mass shock ring\n" +
            "    float shockRadius = pow(u_exoticMass_kg / 1000.0, 0.333) * 1.0e-8;\n" +
            "    float distFromCenter = length(pos);\n" +
            "    float shock = step(shockRadius, distFromCenter) * \n" +
            "                 (1.0 - step(shockRadius * 1.3, distFromCenter));\n" +
            "    color = mix(color, vec3(0.9, 0.9, 1.0), 0.25 * shock);\n" +
            "    \n" +
            (this.hasDerivatives ?
            "    vec2 grid = abs(fract(center * 50.0) - 0.5) / fwidth(center * 50.0);\n" +
            "    float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);\n" +
            "    color = mix(color, vec3(0.5), gridLine * 0.15);\n"
            : "") +
            "    \n" +
            "    gl_FragColor = vec4(color, 1.0);\n" +
            "}";

        this.program = this._linkProgram(vs, fs);
    }

    _linkProgram(vsrc, fsrc) {
        const gl = this.gl;
        const vs = this._compile(gl.VERTEX_SHADER, vsrc);
        const fs = this._compile(gl.FRAGMENT_SHADER, fsrc);
        const prog = gl.createProgram();
        
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
        }
        
        // Clean up shaders after linking
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return prog;
    }

    _compile(type, src) {
        const gl = this.gl;
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error("Shader compile error: " + gl.getShaderInfoLog(sh));
        }
        return sh;
    }

    //----------------------------------------------------------------
    //  Optimized geometry setup
    //----------------------------------------------------------------
    _initQuad() {
        const gl = this.gl;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  1, -1,  -1, 1,  1, 1
        ]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.vbo = vbo;
        
        // Initialize 3D grid for spacetime curvature visualization
        this._initGrid();
    }

    _initGrid() {
        const gl = this.gl;
        
        // Create grid using the exact recipe from gravity_sim.cpp
        this.gridVertices = this._createGrid(40_000, 50);  // 40μm grid, 50 divisions
        this.gridVertexCount = this.gridVertices.length / 3;
        
        // Store grid parameters for warping
        this.gridSize = 40_000;
        this.gridHalf = this.gridSize / 2;
        
        // CRITICAL FIX: Normalize Y coordinate to clip space like X and Z
        const step = this.gridSize / 50;
        const norm = 0.8 / this.gridHalf;
        this.gridY0 = (-this.gridHalf * 0.3 + 3 * step) * norm;  // Apply same normalization as X/Z
        
        console.log(`Grid initialized: ${this.gridVertexCount} vertices, size=${this.gridSize}nm`);
        console.log(`Grid Y0 normalized: ${this.gridY0} (was ~-3600 in raw nm)`);
        console.log(`First few vertices:`, this.gridVertices.slice(0, 12));
        console.log(`Last few vertices:`, this.gridVertices.slice(-12));
        
        // Create dynamic grid buffer
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
        const yPlane = 0;   // Start flat for deformation
        
        // Normalize to [-0.8, 0.8] to keep grid visible within viewport
        const norm = 0.8 / half;

        for (let z = 0; z <= divisions; ++z) {
            const zPos = (-half + z * step) * norm;
            for (let x = 0; x < divisions; ++x) {
                const x0 = (-half + x * step) * norm;
                const x1 = (-half + (x + 1) * step) * norm;
                verts.push(x0, yPlane, zPos, x1, yPlane, zPos);      // x–lines
            }
        }
        for (let x = 0; x <= divisions; ++x) {
            const xPos = (-half + x * step) * norm;
            for (let z = 0; z < divisions; ++z) {
                const z0 = (-half + z * step) * norm;
                const z1 = (-half + (z + 1) * step) * norm;
                verts.push(xPos, yPlane, z0, xPos, yPlane, z1);     // z–lines
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
            "}"
            :
            "attribute vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "void main() {\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "}";

        const gridFs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "out vec4 frag;\n" +
            "void main() {\n" +
            "    frag = vec4(0.7, 0.9, 1.0, 0.8);\n" +  // Light cyan with good visibility
            "}"
            :
            "precision highp float;\n" +
            "void main() {\n" +
            "    gl_FragColor = vec4(0.7, 0.9, 1.0, 0.8);\n" +
            "}";

        console.log("Compiling grid shaders...");
        console.log("Grid vertex shader:", gridVs);
        console.log("Grid fragment shader:", gridFs);
        
        this.gridProgram = this._linkProgram(gridVs, gridFs);
        
        if (!this.gridProgram) {
            console.error("CRITICAL: Grid shader program compilation failed!");
            return;
        }
        
        const gl = this.gl;
        gl.useProgram(this.gridProgram);
        this.gridUniforms = {
            mvpMatrix: gl.getUniformLocation(this.gridProgram, "u_mvpMatrix"),
            position: gl.getAttribLocation(this.gridProgram, "a_position")
        };
        
        console.log("Grid shader compiled successfully!");
        console.log("Grid uniform mvpMatrix location:", this.gridUniforms.mvpMatrix);
        console.log("Grid attribute position location:", this.gridUniforms.position);
        
        if (this.gridUniforms.mvpMatrix === null) {
            console.error("CRITICAL: u_mvpMatrix uniform not found!");
        }
        if (this.gridUniforms.position === -1) {
            console.error("CRITICAL: a_position attribute not found!");
        }
    }

    //----------------------------------------------------------------
    //  Cached uniform locations for performance
    //----------------------------------------------------------------
    _cacheUniformLocations() {
        const gl = this.gl;
        gl.useProgram(this.program);
        this.uLoc = {
            dutyCycle: gl.getUniformLocation(this.program, "u_dutyCycle"),
            g_y: gl.getUniformLocation(this.program, "u_g_y"),
            cavityQ: gl.getUniformLocation(this.program, "u_cavityQ"),
            sagDepth_nm: gl.getUniformLocation(this.program, "u_sagDepth_nm"),
            tsRatio: gl.getUniformLocation(this.program, "u_tsRatio"),
            powerAvg_MW: gl.getUniformLocation(this.program, "u_powerAvg_MW"),
            exoticMass_kg: gl.getUniformLocation(this.program, "u_exoticMass_kg"),
            time: gl.getUniformLocation(this.program, "u_time")
        };
    }

    //----------------------------------------------------------------
    //  Public API for React integration
    //----------------------------------------------------------------
    updateUniforms(params) {
        Object.assign(this.uniforms, params);
    }

    //----------------------------------------------------------------
    //  Optimized render loop with high-DPI support
    //----------------------------------------------------------------
    _startRenderLoop() {
        const animate = (time) => {
            this._draw(time * 0.001);
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }

    _draw(time) {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Enable depth testing for 3D grid
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 1. Render background warp field
        gl.useProgram(this.program);
        gl.uniform1f(this.uLoc.dutyCycle, this.uniforms.dutyCycle);
        gl.uniform1f(this.uLoc.g_y, this.uniforms.g_y);
        gl.uniform1f(this.uLoc.cavityQ, this.uniforms.cavityQ);
        gl.uniform1f(this.uLoc.sagDepth_nm, this.uniforms.sagDepth_nm);
        gl.uniform1f(this.uLoc.tsRatio, this.uniforms.tsRatio);
        gl.uniform1f(this.uLoc.powerAvg_MW, this.uniforms.powerAvg_MW);
        gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg);
        gl.uniform1f(this.uLoc.time, time);

        const loc = gl.getAttribLocation(this.program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(loc);

        // 2. Update and render dynamic spacetime grid with physics
        this._updateGrid();
        this._renderGrid();
        
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
    }

    // Exact warpGridVertices implementation from the minimal recipe
    _updateGrid() {
        this._warpGridVertices(this.gridVertices, this.gridHalf, this.gridY0, this.uniforms);
        
        // Upload warped vertices to GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // Authentic Natário spacetime curvature implementation
    _warpGridVertices(vtx, halfSize, y0, bubbleParams) {
        // CRITICAL FIX: Work entirely in clip-space to avoid unit mismatch
        const sagRclip = bubbleParams.sagDepth_nm / halfSize * 0.8;  // Convert sag to clip-space
        const beta0 = bubbleParams.dutyCycle * bubbleParams.g_y;

        for (let i = 0; i < vtx.length; i += 3) {
            // Work directly in clip-space coordinates
            const x = vtx[i];
            const z = vtx[i + 2];
            const r = Math.hypot(x, z);              // radius in clip-space
            
            // Natário warp bubble profile (now with correct units)
            const prof = (r / sagRclip) * Math.exp(-(r * r) / (sagRclip * sagRclip));
            const beta = beta0 * prof;              // |β| shift vector magnitude

            // -------- LATERAL DEFORMATION: Bend X and Z with the warp field --------
            const push = beta * 0.15;               // Increased visibility (3x stronger)
            const scale = (r > 1e-6) ? (1.0 + push / r) : 1.0;

            vtx[i] = x * scale;                      // X warped laterally
            vtx[i + 2] = z * scale;                  // Z warped laterally
            
            // -------- VERTICAL DEFORMATION: Y displacement --------
            const dy = beta * 0.15;                 // Keep in clip units (3x stronger)
            vtx[i + 1] = y0 + dy;                    // Y warped vertically
        }
        
        // Visual smoke test - check Y range after warping
        let ymax = -1e9, ymin = 1e9;
        for (let i = 1; i < vtx.length; i += 3) {
            const y = vtx[i];
            if (y > ymax) ymax = y;
            if (y < ymin) ymin = y;
        }
        console.log(`Grid Y range after warp: ${ymin.toFixed(3)} … ${ymax.toFixed(3)} (should show variation)`);
    }

    _renderGrid() {
        const gl = this.gl;
        
        // Use the properly compiled grid program
        if (!this.gridProgram) {
            console.error("CRITICAL: Grid program not available in render!");
            return;
        }
        
        console.log("Using grid program for rendering...");
        
        gl.useProgram(this.gridProgram);
        
        // Debug: Check if we have valid grid data
        if (!this.gridVbo || this.gridVertexCount === 0) {
            console.warn("Grid VBO not initialized properly");
            return;
        }
        
        // Add perspective camera to reveal 3D warp deformation
        const fov = Math.PI / 4;                    // 45°
        const aspect = this.canvas.width / this.canvas.height;
        const near = 0.01, far = 10.0;

        // Simple perspective matrix (without gl-matrix dependency)
        const f = 1.0 / Math.tan(fov / 2);
        const proj = new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) / (near - far), (2 * far * near) / (near - far),
            0, 0, -1, 0
        ]);

        // Look-at view matrix (lower camera to see peaks and valleys better)
        const eye = [0, 0.15, 1.6];
        const view = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, -0.15,
            0, 0, 1, -1.6,
            0, 0, 0, 1
        ]);

        // Combine projection and view
        const mvp = this._multiplyMatrices(proj, view);
        
        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, mvp);
        
        // Render grid on top with transparency
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Thick lines for maximum visibility
        gl.lineWidth(3.0);
        
        // Grid rendering
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.enableVertexAttribArray(this.gridUniforms.position);
        gl.vertexAttribPointer(this.gridUniforms.position, 3, gl.FLOAT, false, 0, 0);
        
        // Guard attribute location and render
        if (this.gridUniforms.position !== -1) {
            gl.drawArrays(gl.LINES, 0, this.gridVertexCount);
        } else {
            console.warn("Grid attribute position not found, skipping render");
        }
        
        // Check for WebGL errors after drawing
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error(`WebGL error during grid rendering: ${error}`);
        }
        
        gl.disableVertexAttribArray(this.gridUniforms.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.lineWidth(1.0);
        
        console.log(`Spacetime grid rendered: ${this.gridVertexCount} vertices with lateral warp deformation`);
    }

    // Helper function for matrix multiplication
    _multiplyMatrices(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return result;
    }

    //----------------------------------------------------------------
    //  High-DPI responsive resize
    //----------------------------------------------------------------
    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.clientWidth * dpr;
        const displayHeight = this.canvas.clientHeight * dpr;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }
    }

    //----------------------------------------------------------------
    //  Cleanup for component unmounting
    //----------------------------------------------------------------
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener("resize", this._resize);
        
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        if (this.gl && this.gridProgram) {
            this.gl.deleteProgram(this.gridProgram);
        }
        if (this.gl && this.vbo) {
            this.gl.deleteBuffer(this.vbo);
        }
        if (this.gl && this.gridVbo) {
            this.gl.deleteBuffer(this.gridVbo);
        }
    }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
}