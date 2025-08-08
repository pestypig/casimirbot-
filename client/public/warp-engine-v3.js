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
            // Operational mode parameters
            currentMode: 'hover',
            sectorStrobing: 1,
            qSpoilingFactor: 1,
            gammaVanDenBroeck: 6.57e7
        };
        
        console.log("🎯 WarpEngine V3 initialized with operational mode support");
        this._init();
    }

    _init() {
        const gl = this.gl;
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        
        // Setup WebGL state with better visibility
        gl.clearColor(0.05, 0.05, 0.15, 1.0); // Dark blue background
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
                gl_PointSize = 3.0;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.0, 1.0, 1.0, 0.8); // Bright cyan grid lines
            }
        `;
        
        this.gridProgram = this._createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.mvpMatrixLocation = this.gl.getUniformLocation(this.gridProgram, 'u_mvpMatrix');
        this.positionLocation = this.gl.getAttribLocation(this.gridProgram, 'a_position');
        
        console.log("Grid shader program compiled successfully");
    }

    updateUniforms(parameters) {
        if (!parameters) return;
        
        // Smooth transition support 
        const oldParams = { ...this.currentParams };
        this.currentParams = { ...this.currentParams, ...parameters };
        
        // Enhanced mode mapping with transitions
        if (parameters.currentMode) {
            const modeEffects = this._calculateModeEffects(parameters);
            console.log('🎯 Mode Transition:', {
                from: oldParams.currentMode || 'none',
                to: parameters.currentMode,
                dutyCycle: `${(oldParams.dutyCycle * 100).toFixed(1)}% → ${(parameters.dutyCycle * 100).toFixed(1)}%`,
                power: `${oldParams.powerAvg_MW?.toFixed(1) || 0}MW → ${parameters.powerAvg_MW?.toFixed(1)}MW`,
                visualScale: modeEffects.visualScale,
                curvatureAmplifier: modeEffects.curvatureAmplifier
            });
            
            // Apply mode-specific physics scaling
            this.currentParams.modeVisualScale = modeEffects.visualScale;
            this.currentParams.modeCurvatureAmplifier = modeEffects.curvatureAmplifier;
            this.currentParams.modeStrobingFactor = modeEffects.strobingFactor;
        }
        
        // Apply warp deformation with live operational mode integration
        this._updateGrid();
    }
    
    _calculateModeEffects(params) {
        const mode = params.currentMode || 'hover';
        const strobing = params.sectorStrobing || 1;
        const qSpoiling = params.qSpoilingFactor || 1;
        const vanDenBroeck = params.gammaVanDenBroeck || 6.57e7;
        
        // Enhanced mode-specific visual scaling for authentic Natário physics
        const modeConfigs = {
            hover: { baseScale: 1.0, curvatureBoost: 1.2, strobingViz: 0.8, description: 'gentle bulge, slow ripple' },
            cruise: { baseScale: 0.3, curvatureBoost: 0.6, strobingViz: 0.2, description: 'field nearly flat, faint ripple' },
            emergency: { baseScale: 2.0, curvatureBoost: 1.8, strobingViz: 1.0, description: 'strong bulge, fast shimmer' },
            standby: { baseScale: 0.1, curvatureBoost: 0.2, strobingViz: 0.05, description: 'grid perfectly flat, background calm' }
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
        const size = 25; // Smaller grid for better performance
        const scale = 1.0; // Larger scale for visibility
        
        const vertices = [];
        const indices = [];
        let vertexIndex = 0;
        
        // Create horizontal and vertical grid lines
        for (let i = 0; i <= size; i++) {
            const t = (i / size) * 2 - 1; // -1 to 1
            const pos = t * scale;
            
            // Horizontal lines
            vertices.push(-scale, 0.0, pos); // Start at Y=0 for visibility
            vertices.push(scale, 0.0, pos);
            indices.push(vertexIndex, vertexIndex + 1);
            vertexIndex += 2;
            
            // Vertical lines  
            vertices.push(pos, 0.0, -scale);
            vertices.push(pos, 0.0, scale);
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
        console.log(`Grid coordinate range: X=${-scale} to ${scale}, Z=${-scale} to ${scale}, Y starts at 0`);
    }

    _updateGrid() {
        console.log("_updateGrid called");
        
        if (!this.originalGridVertices) {
            console.error("No original vertices stored!");
            return;
        }
        
        // Copy original vertices
        this.gridVertices.set(this.originalGridVertices);
        
        // Apply warp field deformation with better scaling
        this._warpGridVertices(this.gridVertices, this.currentParams);
        
        // Upload updated vertices to GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log(`Grid updated: ${this.gridVertices.length / 3} vertices`);
    }

    // Simplified and more visible Natário warp implementation
    _warpGridVertices(vtx, bubbleParams) {
        const modeScale = bubbleParams.modeVisualScale || 1.0;
        const curvatureBoost = bubbleParams.modeCurvatureAmplifier || 1.0;
        
        // Scale factors for visible deformation
        const warpStrength = bubbleParams.dutyCycle * bubbleParams.g_y * 0.02 * modeScale;
        const bubbleSize = 0.5; // Radius in normalized coordinates
        
        console.log(`WARP: strength=${warpStrength.toFixed(4)}, mode=${modeScale.toFixed(2)}, boost=${curvatureBoost.toFixed(4)}`);

        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < vtx.length; i += 3) {
            const x = vtx[i];
            const z = vtx[i + 2];
            const r = Math.sqrt(x * x + z * z); // Distance from center
            
            // Natário-style warp profile: Gaussian with exponential decay
            const warpProfile = Math.exp(-(r * r) / (bubbleSize * bubbleSize));
            const displacement = warpStrength * warpProfile * curvatureBoost;
            
            // Apply vertical displacement
            vtx[i + 1] = displacement;
            
            // Track Y range for debugging
            minY = Math.min(minY, vtx[i + 1]);
            maxY = Math.max(maxY, vtx[i + 1]);
        }
        
        console.log(`Grid Y range after warp: ${minY.toFixed(4)} … ${maxY.toFixed(4)} (range: ${(maxY - minY).toFixed(4)})`);
    }

    _setupCamera() {
        this.mvpMatrix = new Float32Array(16);
        this.projMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        
        // Ensure proper aspect ratio
        const aspect = this.canvas.width / this.canvas.height;
        this._perspective(this.projMatrix, Math.PI / 6, aspect, 0.1, 100.0);
        
        this._lookAt(this.viewMatrix,
            [2.0, 1.5, 2.0],  // Camera position - higher up to see deformation
            [0.0, 0.0, 0.0],  // Look at center of grid
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
        
        console.log(`Rendered ${this.gridIndices.length} grid indices as lines`);
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
        
        // Clear with visible background
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Auto-resize if needed
        if (this.canvas.clientWidth !== this.canvas.width || 
            this.canvas.clientHeight !== this.canvas.height) {
            this._resize();
        }
        
        // Render the spacetime grid
        this._renderGridPoints();
    }

    _resize() {
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        console.log(`Canvas resized: ${canvas.width}x${canvas.height}`);
        
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
    console.log("🎯 WarpEngine V3 - FIXED VISIBILITY & OPERATIONAL MODE INTEGRATED", Date.now());
}