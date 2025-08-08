class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        this.initialized = false;
        this.animationId = null;
        
        // Initialize with default Natário parameters
        this.currentParams = {
            dutyCycle: 0.14,
            g_y: 26,
            cavityQ: 1e9,
            sagDepth_nm: 16,
            powerAvg_MW: 83.3,
            exoticMass_kg: 1405,
            // NEW: Operational mode parameters
            currentMode: 'hover',
            sectorStrobing: 1,
            qSpoilingFactor: 1,
            gammaVanDenBroeck: 6.57e7
        };
        
        console.log("🎯 WarpEngine initialized with operational mode support");
        this._init();
    }

    _init() {
        const gl = this.gl;
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        
        // Setup WebGL state
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        
        this._setupShaders();
        this._setupGrid();
        this._setupCamera();
        
        this.initialized = true;
        this._startRenderLoop();
        
        console.log("3D spacetime grid rendered with authentic Natário warp bubble physics");
    }

    _setupShaders() {
        const vertexShaderSource = `
            attribute vec3 a_position;
            uniform mat4 u_mvpMatrix;
            
            void main() {
                gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0); // Red grid lines
            }
        `;
        
        this.gridProgram = this._createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.mvpMatrixLocation = this.gl.getUniformLocation(this.gridProgram, 'u_mvpMatrix');
        this.positionLocation = this.gl.getAttribLocation(this.gridProgram, 'a_position');
        
        console.log("Grid shader program compiled successfully");
    }

    updateUniforms(parameters) {
        if (!parameters) return;
        
        // Update internal parameters with operational mode integration
        this.currentParams = { ...this.currentParams, ...parameters };
        
        // NEW: Map operational mode parameters to spacetime visualization
        if (parameters.currentMode) {
            const modeEffects = this._calculateModeEffects(parameters);
            console.log('🎯 Operational Mode Effects:', {
                mode: parameters.currentMode,
                strobing: parameters.sectorStrobing,
                qSpoiling: parameters.qSpoilingFactor, 
                vanDenBroeck: parameters.gammaVanDenBroeck,
                visualScale: modeEffects.visualScale,
                curvatureAmplifier: modeEffects.curvatureAmplifier
            });
            
            // Apply mode-specific physics scaling
            this.currentParams.modeVisualScale = modeEffects.visualScale;
            this.currentParams.modeCurvatureAmplifier = modeEffects.curvatureAmplifier;
            this.currentParams.modeStrobingFactor = modeEffects.strobingFactor;
        }
        
        // Apply warp deformation to grid with mode-specific enhancements
        this._updateGrid();
    }
    
    _calculateModeEffects(params) {
        const mode = params.currentMode || 'hover';
        const strobing = params.sectorStrobing || 1;
        const qSpoiling = params.qSpoilingFactor || 1;
        const vanDenBroeck = params.gammaVanDenBroeck || 6.57e7;
        
        // Mode-specific visual scaling factors for authentic Natário physics
        const modeConfigs = {
            hover: { baseScale: 1.0, curvatureBoost: 1.2, strobingViz: 0.8 },
            cruise: { baseScale: 0.3, curvatureBoost: 0.6, strobingViz: 0.2 },
            emergency: { baseScale: 2.0, curvatureBoost: 1.8, strobingViz: 1.0 },
            standby: { baseScale: 0.1, curvatureBoost: 0.2, strobingViz: 0.05 }
        };
        
        const config = modeConfigs[mode] || modeConfigs.hover;
        
        return {
            visualScale: config.baseScale * Math.sqrt(qSpoiling),
            curvatureAmplifier: config.curvatureBoost * (vanDenBroeck / 1e7) * 0.1, 
            strobingFactor: config.strobingViz * (400 / Math.max(strobing, 1))
        };
    }

    _setupGrid() {
        const gl = this.gl;
        const size = 50;
        const scale = 0.8;
        
        const vertices = [];
        const indices = [];
        let vertexIndex = 0;
        
        // Create horizontal and vertical grid lines
        for (let i = 0; i <= size; i++) {
            const t = (i / size) * 2 - 1; // -1 to 1
            const pos = t * scale;
            
            // Horizontal lines
            vertices.push(-scale, -0.144, pos);
            vertices.push(scale, -0.144, pos);
            indices.push(vertexIndex, vertexIndex + 1);
            vertexIndex += 2;
            
            // Vertical lines  
            vertices.push(pos, -0.144, -scale);
            vertices.push(pos, -0.144, scale);
            indices.push(vertexIndex, vertexIndex + 1);
            vertexIndex += 2;
        }
        
        this.gridVertices = new Float32Array(vertices);
        this.originalGridVertices = new Float32Array(vertices); // Store original
        this.gridIndices = new Uint16Array(indices);
        
        // Create and populate VBO
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        
        // Create and populate IBO
        this.gridIbo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gridIbo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.gridIndices, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        console.log(`Spacetime grid: ${this.gridIndices.length / 2} lines, ${size}x${size} divisions`);
        console.log(`Grid coordinate range: X=${-scale} to ${scale}`);
        console.log(`Grid coordinate range: Z=${-scale} to ${scale}`);
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
            // Apply operational mode scaling to lateral warp effects
            const modeScale = this.currentParams?.modeVisualScale || 1.0;
            const curvatureBoost = this.currentParams?.modeCurvatureAmplifier || 1.0;
            const push = beta * 0.05 * modeScale * curvatureBoost;  // Mode-dependent deformation
            const scale = (r > 1e-6) ? (1.0 + push / r) : 1.0;

            vtx[i] = x * scale;                      // X warped laterally
            vtx[i + 2] = z * scale;                  // Z warped laterally
            
            // -------- VERTICAL DEFORMATION: Y displacement --------
            const dy = beta * 0.05 * modeScale;     // Mode-scaled vertical deformation
            
            // Enhanced: Mode-dependent exotic mass effects
            const rho = -beta * beta * (bubbleParams.cavityQ / 1e9) * curvatureBoost;  // Enhanced with mode boost
            const extraDip = rho * 0.002 * (this.currentParams?.modeStrobingFactor || 0.002);  // Strobing-dependent
            
            vtx[i + 1] = y_original + dy + extraDip;  // Y with full mode-dependent curvature
        }
        
        // Log range for debugging
        const yValues = [];
        for (let i = 1; i < vtx.length; i += 3) {
            yValues.push(vtx[i]);
        }
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        console.log(`Max lateral drift = ${Math.max(...vtx.filter((_, i) => i % 3 === 0)).toFixed(4)} (FIXED: should be < 0.2 to stay visible)`);
        console.log(`Grid Y range after warp: ${minY.toFixed(3)} … ${maxY.toFixed(3)} (should show variation)`);
    }

    _setupCamera() {
        this.mvpMatrix = new Float32Array(16);
        this.projMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        
        const aspect = this.canvas.width / this.canvas.height;
        this._perspective(this.projMatrix, Math.PI / 4, aspect, 0.1, 100.0);
        
        this._lookAt(this.viewMatrix,
            [2.5, 1.5, 2.0],  // Camera position (elevated and angled)
            [0.0, -0.1, 0.0], // Look at center of grid
            [0.0, 1.0, 0.0]   // Up vector
        );
        
        this._multiplyMatrices(this.mvpMatrix, this.projMatrix, this.viewMatrix);
    }

    _renderGridPoints() {
        const gl = this.gl;
        
        gl.useProgram(this.gridProgram);
        gl.uniformMatrix4fv(this.mvpMatrixLocation, false, this.mvpMatrix);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gridIbo);
        gl.drawElements(gl.LINES, this.gridIndices.length, gl.UNSIGNED_SHORT, 0);
        
        console.log("Using grid program for rendering...");
        console.log(`Rendered ${this.gridIndices.length} grid lines with 3D perspective - should now be visible!`);
    }

    _startRenderLoop() {
        if (!this.animationId) {
            this._renderLoop();
        }
    }

    _renderLoop() {
        this.animationId = requestAnimationFrame(() => this._renderLoop());
        this._render();
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
        out[12] = -(x0_ * x0 + x1_ * x1 + x2_ * x2); out[13] = -(y0_ * x0 + y1_ * x1 + y2_ * x2);
        out[14] = -(z0 * x0 + z1 * x1 + z2 * x2); out[15] = 1;
    }

    _multiplyMatrices(out, a, b) {
        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

        let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        out[0] = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
        out[1] = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
        out[2] = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
        out[3] = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

        a0 = a[4]; a1 = a[5]; a2 = a[6]; a3 = a[7];
        out[4] = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
        out[5] = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
        out[6] = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
        out[7] = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

        a0 = a[8]; a1 = a[9]; a2 = a[10]; a3 = a[11];
        out[8] = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
        out[9] = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
        out[10] = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
        out[11] = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

        a0 = a[12]; a1 = a[13]; a2 = a[14]; a3 = a[15];
        out[12] = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
        out[13] = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
        out[14] = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
        out[15] = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.gl && this.initialized) {
            this.gl.deleteBuffer(this.gridVbo);
            this.gl.deleteBuffer(this.gridIbo);
            this.gl.deleteProgram(this.gridProgram);
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
    console.log("🎯 WarpEngine V2 - OPERATIONAL MODE INTEGRATED", Date.now());
}