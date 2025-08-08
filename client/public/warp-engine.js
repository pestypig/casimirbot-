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
        this.gridY0 = -this.gridHalf * 0.3 + 3 * (this.gridSize / 50);  // exact yPlane from C++
        
        console.log(`Grid initialized: ${this.gridVertexCount} vertices, size=${this.gridSize}nm`);
        
        // Create dynamic grid buffer
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // Compile grid shader program
        this._compileGridShaders();
    }

    // Simple test grid - just a few large lines that should be clearly visible
    _createGrid(size = 40_000, divisions = 10) {  // Reduce to 10x10 for testing
        const verts = [];
        
        // Create a simple cross pattern first for testing
        verts.push(-0.8, 0, 0,   0.8, 0, 0);  // Horizontal line
        verts.push(0, -0.8, 0,   0, 0.8, 0);  // Vertical line
        
        // Add a few more lines to make a visible grid
        for (let i = -2; i <= 2; i++) {
            const pos = i * 0.3;
            // Horizontal lines
            verts.push(-0.8, pos, 0,   0.8, pos, 0);
            // Vertical lines  
            verts.push(pos, -0.8, 0,   pos, 0.8, 0);
        }
        
        console.log(`Simple test grid created with ${verts.length/6} lines`);
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
            "    frag = vec4(1.0, 1.0, 1.0, 0.9);\n" +  // Bright white for maximum visibility
            "}"
            :
            "precision highp float;\n" +
            "void main() {\n" +
            "    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.9);\n" +
            "}";

        this.gridProgram = this._linkProgram(gridVs, gridFs);
        
        const gl = this.gl;
        gl.useProgram(this.gridProgram);
        this.gridUniforms = {
            mvpMatrix: gl.getUniformLocation(this.gridProgram, "u_mvpMatrix"),
            position: gl.getAttribLocation(this.gridProgram, "a_position")
        };
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

        // 2. Update and render dynamic spacetime grid  
        this._renderGrid();  // Skip update for now, just test rendering
        
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

    // Direct implementation from the gravity sim recipe with enhanced visibility
    _warpGridVertices(vtx, halfSize, y0, bubbleParams) {
        const G = 6.6743e-11, c = 2.99792458e8;
        const sagR = bubbleParams.sagDepth_nm * 1e-9;          // nm → m
        const beta0 = bubbleParams.dutyCycle * bubbleParams.g_y;

        for (let i = 0; i < vtx.length; i += 3) {
            const x = vtx[i], z = vtx[i + 2];

            // --- simple Natário–style shift vector approximation ---
            const r = Math.hypot(x, z);           // radial distance in normalized space
            
            // Scale the radius to work with normalized coordinates
            const rScaled = r * 20e-9;  // Scale to 20nm range
            const sagRScaled = sagR;
            
            const prof = (rScaled / sagRScaled) * Math.exp(-(rScaled * rScaled) / (sagRScaled * sagRScaled));
            const beta = beta0 * prof;              // |β| at this point

            // map |β| to a visible Y displacement in normalized coordinates
            const dy = beta * 0.2;           // Much larger displacement for visibility

            vtx[i + 1] = y0 + dy;
        }
    }

    _renderGrid() {
        const gl = this.gl;
        
        // Skip grid program validation temporarily - just force render with main program
        gl.useProgram(this.program);
        
        // Debug: Check if we have valid grid data
        if (!this.gridVbo || this.gridVertexCount === 0) {
            console.warn("Grid VBO not initialized properly");
            return;
        }
        
        // Force render without any matrix transformations - identity matrix
        const mvp = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,     
            0, 0, 1, 0,     
            0, 0, 0, 1
        ]);
        
        // Try to set matrix uniform (may fail but that's OK for testing)
        const matLoc = gl.getUniformLocation(this.program, "u_mvpMatrix");
        if (matLoc) {
            gl.uniformMatrix4fv(matLoc, false, mvp);
        }
        
        // Disable all tests and render directly on top
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        
        // Force line width (may not work on all systems but worth trying)
        gl.lineWidth(3.0);
        
        // Grid rendering
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const posLoc = gl.getAttribLocation(this.program, "a_position");
        if (posLoc >= 0) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            
            // Force manual color to white
            const colorLoc = gl.getUniformLocation(this.program, "u_color");
            if (colorLoc) {
                gl.uniform4f(colorLoc, 1.0, 1.0, 1.0, 1.0);
            }
            
            gl.drawArrays(gl.LINES, 0, this.gridVertexCount);
            gl.disableVertexAttribArray(posLoc);
            
            console.log(`Rendered ${this.gridVertexCount} grid vertices`);
        } else {
            console.warn("Could not find position attribute");
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.lineWidth(1.0);
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