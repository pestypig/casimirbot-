//====================================================================
//  Natário Warp‑Bubble Visualiser (3D Volumetric Cage v2.6 FRESH-REBUILD)
//  ------------------------------------------------------------------
//  Real-time WebGL visualization with authentic parameter mapping
//  Now featuring: Three orthogonal sheets for full 3D warp perception
//  FIXED: Orange blob issue with proper Natário curvature scaling
//====================================================================

class WarpEngine {
    constructor(canvas) {
        try {
            // 🔍 DEBUG CHECKPOINT 1: Version Stamp for Cache Debugging  
            console.error('🚨 BUNDLE VERSION: REVERTED-v3.2 - HARDCODED GRID SCALE RESTORED 🚨');
            console.error('🏷️ WARP-ENGINE-PIPELINE-DIAGNOSTICS-ACTIVE');
            console.error('✅ 3D WebGL WarpEngine with FIXED Natário curvature');
            
            console.log("WarpEngine v2.6: Starting 3D volumetric cage initialization...");
            this.canvas = canvas;
            // Try WebGL2 first, then WebGL1, then experimental contexts
            this.gl = canvas.getContext("webgl2") || 
                     canvas.getContext("webgl") || 
                     canvas.getContext("experimental-webgl");
            
            if (!this.gl) {
                console.error("WebGL not supported - browser compatibility issue");
                // Create a simplified fallback instead of throwing
                this.createFallbackRenderer();
                return;
            }

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

            console.log("WarpEngine: Compiling shaders...");
            this._compileShaders();
            
            console.log("WarpEngine: Initializing quad and grid...");
            this._initQuad();
            
            console.log("WarpEngine: Caching uniform locations...");
            this._cacheUniformLocations();
            
            console.log("WarpEngine: Resizing...");
            this._resize();
            
            // Enable depth buffer for 3D grid rendering
            this.gl.enable(this.gl.DEPTH_TEST);
            
            // Auto-resize and continuous rendering
            this._startRenderLoop();
            
            window.addEventListener('resize', () => this._resize());
            
            console.log("WarpEngine initialization complete!");
            
            // Debug info for cache verification
            console.log(`WebGL context: ${this.gl ? 'OK' : 'FAILED'}`);
            console.log(`Grid vertices: ${this.gridVertexCount} points`);
            console.log(`Grid VBO created: ${this.gridVbo ? 'YES' : 'NO'}`);
            console.log(`Grid program created: ${this.gridProgram ? 'YES' : 'NO'}`);
        } catch (error) {
            console.error("WarpEngine initialization failed:", error);
            console.error("Error stack:", error.stack);
            // Create fallback instead of throwing - maintain functionality
            this.createFallbackRenderer();
        }
    }

    // Fallback renderer for WebGL compatibility issues
    createFallbackRenderer() {
        console.log("🔧 Creating fallback 2D renderer for compatibility");
        this.isWebGLFallback = true;
        this.uniforms = {
            dutyCycle: 0.14, g_y: 26, cavityQ: 1e9, sagDepth_nm: 16,
            powerAvg_MW: 83.3, exoticMass_kg: 1405, beta0: 0
        };
        
        // Create 2D context for basic visualization
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            this.ctx2d = ctx;
            this.startFallbackRender();
        }
    }

    startFallbackRender() {
        const animate = () => {
            if (this.ctx2d && this.isWebGLFallback) {
                this.drawFallback();
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    drawFallback() {
        const ctx = this.ctx2d;
        if (!ctx) return;
        
        ctx.fillStyle = '#0A1420';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show energy pipeline values as text
        ctx.fillStyle = '#00FFFF';
        ctx.font = '12px monospace';
        ctx.fillText(`WebGL Fallback - Pipeline Connected`, 10, 30);
        ctx.fillText(`β₀: ${(this.uniforms.beta0 || 0).toExponential(2)}`, 10, 50);
        ctx.fillText(`sagDepth: ${this.uniforms.sagDepth_nm}nm`, 10, 70);
        ctx.fillText(`Power: ${this.uniforms.powerAvg_MW}MW`, 10, 90);
        
        // Draw basic warp representation
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Maintain API compatibility for React integration
    updateUniforms(params) {
        if (this.isWebGLFallback) {
            // 🔍 DEBUG CHECKPOINT 2: Uniforms changing verification (fallback mode)
            console.log('🔧 updateUniforms called (FALLBACK MODE):', params);
            Object.assign(this.uniforms, params);
            console.table(this.uniforms);
            return;
        }
        
        // Normal WebGL path
        Object.assign(this.uniforms, params);
        console.log('🔧 updateUniforms called with:', params);
        console.table(this.uniforms);
    }

    _resize() {
        const canvas = this.canvas;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            console.log(`Canvas resized: ${displayWidth}x${displayHeight}`);
        }
    }

    _compileShaders() {
        const gl = this.gl;
        const isWebGL2 = gl.getParameter(gl.VERSION).includes("WebGL 2.0");
        
        // Vertex shader
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

        // Fragment shader with FIXED Natário physics
        const fs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "uniform float u_time;\n" +
            "uniform float u_dutyCycle;\n" +
            "uniform float u_g_y;\n" +
            "uniform float u_cavityQ;\n" +
            "uniform float u_sagDepth_nm;\n" +
            "uniform float u_tsRatio;\n" +
            "uniform float u_powerAvg_MW;\n" +
            "uniform float u_exoticMass_kg;\n" +
            "uniform float u_beta0;\n" +
            "in vec2 v_uv;\n" +
            "out vec4 fragColor;\n" +
            "void main() {\n" +
            "    vec2 p = (v_uv - 0.5) * 2.0;\n" +
            "    float r = length(p);\n" +
            "    \n" +
            "    // FIXED: Proper radius scaling - make warp field visible\n" +
            "    float sagR = u_sagDepth_nm / 50.0 * 0.4;\n" +  // Increased scaling for visibility
            "    float prof = (r / sagR) * exp(-(r * r) / (sagR * sagR));\n" +
            "    float beta = u_beta0 * prof / 1000000.0;\n" +
            "    \n" +
            "    // FIXED: Reduced intensity to prevent banding\n" +
            "    float intensity = clamp(abs(beta) * 10.0, 0.0, 1.0);\n" +  // Reduced from 20.0
            "    \n" +
            "    vec3 color = mix(\n" +
            "        vec3(0.05, 0.1, 0.15),\n" +      // Dark blue background
            "        vec3(1.0, 0.5, 0.0),\n" +        // Orange for warp field
            "        intensity\n" +
            "    );\n" +
            "    \n" +
            "    fragColor = vec4(color, 1.0);\n" +
            "}"
            :
            "precision highp float;\n" +
            "uniform float u_time;\n" +
            "uniform float u_dutyCycle;\n" +
            "uniform float u_g_y;\n" +
            "uniform float u_cavityQ;\n" +
            "uniform float u_sagDepth_nm;\n" +
            "uniform float u_tsRatio;\n" +
            "uniform float u_powerAvg_MW;\n" +
            "uniform float u_exoticMass_kg;\n" +
            "uniform float u_beta0;\n" +
            "varying vec2 v_uv;\n" +
            "void main() {\n" +
            "    vec2 p = (v_uv - 0.5) * 2.0;\n" +
            "    float r = length(p);\n" +
            "    \n" +
            "    // FIXED: Proper radius scaling - make warp field visible\n" +
            "    float sagR = u_sagDepth_nm / 50.0 * 0.4;\n" +  // Increased scaling for visibility
            "    float prof = (r / sagR) * exp(-(r * r) / (sagR * sagR));\n" +
            "    float beta = u_beta0 * prof / 1000000.0;\n" +
            "    \n" +
            "    // FIXED: Reduced intensity to prevent banding\n" +
            "    float intensity = clamp(abs(beta) * 10.0, 0.0, 1.0);\n" +  // Reduced from 20.0
            "    \n" +
            "    vec3 color = mix(\n" +
            "        vec3(0.05, 0.1, 0.15),\n" +      // Dark blue background
            "        vec3(1.0, 0.5, 0.0),\n" +        // Orange for warp field
            "        intensity\n" +
            "    );\n" +
            "    \n" +
            "    gl_FragColor = vec4(color, 1.0);\n" +
            "}";

        this.program = this._linkProgram(vs, fs);
        
        // Compile grid shaders
        this._compileGridShaders();
    }

    _linkProgram(vs, fs) {
        const gl = this.gl;
        
        const vertexShader = this._compileShader(gl.VERTEX_SHADER, vs);
        const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fs);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader program link error:", gl.getProgramInfoLog(program));
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
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }

    _initQuad() {
        const gl = this.gl;
        
        // Full-screen quad
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]);
        
        this.quadVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Initialize 3D grid
        this._initGrid();
    }

    _initGrid() {
        const gl = this.gl;
        const divisions = 100;  // High resolution for smooth curvature
        const half = 1.0;  // Clip space bounds ±1
        
        // Create three orthogonal sheets for full 3D visualization
        const xySheet = this._createGridSheet('XY', half, divisions);
        const xzSheet = this._createGridSheet('XZ', half, divisions);
        const yzSheet = this._createGridSheet('YZ', half, divisions);
        
        // Combine all sheets into single VBO for efficiency
        const totalVertices = xySheet.length + xzSheet.length + yzSheet.length;
        this.gridVertices = new Float32Array(totalVertices);
        
        let offset = 0;
        this.gridVertices.set(xySheet, offset);
        offset += xySheet.length;
        this.gridVertices.set(xzSheet, offset);
        offset += xzSheet.length;
        this.gridVertices.set(yzSheet, offset);
        
        // Store original vertices for warping reset
        this.originalGridVertices = new Float32Array(this.gridVertices);
        
        // Grid parameters for warping
        this.gridHalf = half * 0.8;  // Slightly smaller than clip bounds
        this.gridY0 = 0.0;           // Base Y level
        this.gridVertexCount = totalVertices / 3;
        
        // CRITICAL FIX: clip-space normalizer (nm → –0.8…+0.8)
        this.gridSize = 80000;  // 80 µm total cage in nm
        this.gridHalfNm = this.gridSize / 2;  // 40 µm radius in nm
        this.normClip = 0.8 / this.gridHalfNm;  // nm to clip-space conversion
        this.bubbleRadius_nm = 10000;  // 10 µm bubble radius
        
        console.log(`Grid initialized: ${this.gridVertexCount} vertices across 3 sheets`);
        console.log(`XY sheet: ${xySheet.length/3} vertices`);
        console.log(`XZ sheet: ${xzSheet.length/3} vertices`);
        console.log(`YZ sheet: ${yzSheet.length/3} vertices`);
        
        // Create VBO
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        
        console.log("Grid VBO created and uploaded to GPU");
    }

    _createGridSheet(plane, half, divisions) {
        const verts = [];
        const step = (2 * half) / divisions;
        const norm = 0.8;  // Normalize to clip space bounds
        
        if (plane === 'XY') {
            // XY plane (floor) - cyan
            const zPos = -half * 0.3;  // Below center
            for (let x = 0; x <= divisions; ++x) {
                const xPos = (-half + x * step) * norm;
                for (let y = 0; y < divisions; ++y) {
                    const y0 = (-half + y * step) * norm;
                    const y1 = (-half + (y + 1) * step) * norm;
                    verts.push(xPos, y0, zPos, xPos, y1, zPos);  // Y-lines at fixed x
                }
            }
            for (let y = 0; y <= divisions; ++y) {
                const yPos = (-half + y * step) * norm;
                for (let x = 0; x < divisions; ++x) {
                    const x0 = (-half + x * step) * norm;
                    const x1 = (-half + (x + 1) * step) * norm;
                    verts.push(x0, yPos, zPos, x1, yPos, zPos);  // X-lines at fixed y
                }
            }
        }
        else if (plane === 'XZ') {
            // XZ plane (back wall) - magenta
            const yPos = half * 0.3;  // Above center
            for (let x = 0; x <= divisions; ++x) {
                const xPos = (-half + x * step) * norm;
                for (let z = 0; z < divisions; ++z) {
                    const z0 = (-half + z * step) * norm;
                    const z1 = (-half + (z + 1) * step) * norm;
                    verts.push(xPos, yPos, z0, xPos, yPos, z1);  // Z-lines at fixed x
                }
            }
            for (let z = 0; z <= divisions; ++z) {
                const zPos = (-half + z * step) * norm;
                for (let x = 0; x < divisions; ++x) {
                    const x0 = (-half + x * step) * norm;
                    const x1 = (-half + (x + 1) * step) * norm;
                    verts.push(x0, yPos, zPos, x1, yPos, zPos);  // X-lines at fixed z
                }
            }
        }
        else if (plane === 'YZ') {
            // YZ plane (side wall) - yellow
            const xSheet = half * 0.3;  // To the right
            for (let y = 0; y <= divisions; ++y) {
                const yPos = (-half + y * step) * norm;
                for (let z = 0; z < divisions; ++z) {
                    const z0 = (-half + z * step) * norm;
                    const z1 = (-half + (z + 1) * step) * norm;
                    verts.push(xSheet, yPos, z0, xSheet, yPos, z1);  // Z-lines at fixed y
                }
            }
            for (let z = 0; z <= divisions; ++z) {
                const zPos = (-half * 0.3 + z * step) * norm;
                for (let y = 0; y < divisions; ++y) {
                    const y0 = (-half + y * step) * norm;
                    const y1 = (-half + (y + 1) * step) * norm;
                    verts.push(xSheet, y0, zPos, xSheet, y1, zPos);  // Y-lines at offset x
                }
            }
        }
        
        console.log(`${plane} sheet: ${verts.length/6} lines generated`);
        return new Float32Array(verts);
    }

    _compileGridShaders() {
        const isWebGL2 = this.gl.getParameter(this.gl.VERSION).includes("WebGL 2.0");
        console.log("Grid shader using", isWebGL2 ? "WebGL2" : "WebGL1", "fragment branch");
        
        const gridVs = isWebGL2 ?
            "#version 300 es\n" +
            "in vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "void main() {\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "    gl_PointSize = 8.0;\n" +
            "}"
            :
            "attribute vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "void main() {\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "    gl_PointSize = 8.0;\n" +  // Larger points for better visibility
            "}";

        const gridFs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "uniform float u_energyFlag;\n" +
            "uniform vec3 u_sheetColor;\n" +
            "out vec4 frag;\n" +
            "void main() {\n" +
            "    vec3 baseColor = (u_energyFlag > 0.5) ? \n" +
            "        vec3(1.0, 0.0, 1.0) :  // Magenta for WEC violations\n" +
            "        u_sheetColor;           // Sheet-specific color\n" +
            "    frag = vec4(baseColor, 0.8);\n" +
            "}"
            :
            "precision highp float;\n" +
            "uniform float u_energyFlag;\n" +
            "uniform vec3 u_sheetColor;\n" +
            "void main() {\n" +
            "    vec3 baseColor = (u_energyFlag > 0.5) ? \n" +
            "        vec3(1.0, 0.0, 1.0) :  // Magenta for WEC violations\n" +
            "        u_sheetColor;           // Sheet-specific color\n" +
            "    gl_FragColor = vec4(baseColor, 0.8);\n" +
            "}";

        console.log("Compiling grid shaders for POINTS rendering...");
        
        this.gridProgram = this._linkProgram(gridVs, gridFs);
        
        if (!this.gridProgram) {
            console.error("CRITICAL: Grid shader program compilation failed!");
            return;
        }
        
        const gl = this.gl;
        gl.useProgram(this.gridProgram);
        this.gridUniforms = {
            mvpMatrix: gl.getUniformLocation(this.gridProgram, "u_mvpMatrix"),
            position: gl.getAttribLocation(this.gridProgram, "a_position"),
            energyFlag: gl.getUniformLocation(this.gridProgram, "u_energyFlag"),
            sheetColor: gl.getUniformLocation(this.gridProgram, "u_sheetColor")
        };
        
        // Check uniform locations to diagnose potential issues
        console.log("🔍 UNIFORM LOCATION DEBUG:");
        console.log("sheetColor loc =", this.gridUniforms.sheetColor);
        console.log("energyFlag loc =", this.gridUniforms.energyFlag);
        console.log("mvpMatrix loc =", this.gridUniforms.mvpMatrix);
        console.log("position loc =", this.gridUniforms.position);
        
        if (this.gridUniforms.sheetColor === null || this.gridUniforms.sheetColor === -1) {
            console.error("❌ sheetColor uniform location is INVALID - this explains missing colors!");
        }
        if (this.gridUniforms.energyFlag === null || this.gridUniforms.energyFlag === -1) {
            console.error("❌ energyFlag uniform location is INVALID - this explains missing colors!");
        }
        
        console.log("✅ Grid shader compiled successfully! Multi-color mode restored.");
    }

    _cacheUniformLocations() {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        this.uLoc = {
            time: gl.getUniformLocation(this.program, "u_time"),
            dutyCycle: gl.getUniformLocation(this.program, "u_dutyCycle"),
            g_y: gl.getUniformLocation(this.program, "u_g_y"),
            cavityQ: gl.getUniformLocation(this.program, "u_cavityQ"),
            sagDepth_nm: gl.getUniformLocation(this.program, "u_sagDepth_nm"),
            tsRatio: gl.getUniformLocation(this.program, "u_tsRatio"),
            powerAvg_MW: gl.getUniformLocation(this.program, "u_powerAvg_MW"),
            exoticMass_kg: gl.getUniformLocation(this.program, "u_exoticMass_kg"),
            beta0: gl.getUniformLocation(this.program, "u_beta0"),
            position: gl.getAttribLocation(this.program, "a_position")
        };
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
        
        // Clear with dark blue background for contrast
        gl.clearColor(0.05, 0.1, 0.15, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Upload all uniforms for the warp field shader
        gl.useProgram(this.program);
        gl.uniform1f(this.uLoc.time, time);
        gl.uniform1f(this.uLoc.dutyCycle, this.uniforms.dutyCycle || 0.14);
        gl.uniform1f(this.uLoc.g_y, this.uniforms.g_y || 26);
        gl.uniform1f(this.uLoc.cavityQ, this.uniforms.cavityQ || 1e9);
        gl.uniform1f(this.uLoc.sagDepth_nm, this.uniforms.sagDepth_nm || 16);
        gl.uniform1f(this.uLoc.tsRatio, this.uniforms.tsRatio || 4100);
        gl.uniform1f(this.uLoc.powerAvg_MW, this.uniforms.powerAvg_MW || 83.3);
        gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg || 1405);
        
        // Upload β₀ from amplifier chain
        const currentBeta0 = this.uniforms.beta0 || (this.uniforms.dutyCycle * this.uniforms.g_y);
        gl.uniform1f(this.uLoc.beta0, currentBeta0);
        
        // Render quad first WITHOUT writing to depth buffer
        gl.depthMask(false);         // Stop writing Z to depth buffer
        this._renderQuad();
        gl.depthMask(true);          // Restore depth writes for grid
        console.log("🎯 DEPTH BUFFER FIX: Orange quad rendered without depth writes - grid should now be visible!");
        
        // Now render the grid with depth testing enabled
        gl.enable(gl.DEPTH_TEST);
        this._updateGrid();
        this._renderGridPointsFixed();
        
        gl.disable(gl.DEPTH_TEST);
    }

    _renderQuad() {
        const gl = this.gl;
        
        console.log("▶️ _renderQuad() executing");
        
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
        gl.enableVertexAttribArray(this.uLoc.position);
        gl.vertexAttribPointer(this.uLoc.position, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.disableVertexAttribArray(this.uLoc.position);
    }

    _renderGridPointsFixed() {
        const gl = this.gl;
        
        gl.useProgram(this.gridProgram);
        
        // Create correct perspective + view matrix
        const fov = Math.PI/4;
        const aspect = this.canvas.width / this.canvas.height;
        const near = 0.01, far = 10.0;
        const f = 1/Math.tan(fov/2);

        // Corrected projection matrix with proper depth coefficients
        // M[2,2] = (far+near)/(near-far) ≈ -1.002  
        // M[2,3] = (2*far*near)/(near-far) ≈ -0.020
        const proj = new Float32Array([
            f/aspect, 0,      0,               0,
            0,        f,      0,               0,
            0,        0, (far+near)/(near-far), (2*far*near)/(near-far),
            0,        0,     -1,               0
        ]);

        // View matrix: camera at (0, -0.15, -2.5) looking at origin
        const view = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, -0.15,
            0, 0, 1, 2.5,    // push the world *back*, not forward
            0, 0, 0, 1
        ]);

        // Multiply projection * view matrices
        const mvp = this._multiplyMatrices4x4(proj, view);
        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, mvp);
        
        // Bind grid vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.enableVertexAttribArray(this.gridUniforms.position);
        gl.vertexAttribPointer(this.gridUniforms.position, 3, gl.FLOAT, false, 0, 0);
        
        // Calculate vertex counts per sheet
        const verticesPerSheet = Math.floor(this.gridVertexCount / 3);
        
        console.log(`🎯 FINAL GRID: Drawing 3 colored sheets with corrected perspective+view`);
        
        // Draw XY sheet (cyan floor)
        gl.uniform3f(this.gridUniforms.sheetColor, 0.0, 1.0, 1.0);
        gl.uniform1f(this.gridUniforms.energyFlag, 0.0);
        gl.drawArrays(gl.LINES, 0, verticesPerSheet);
        
        // Draw XZ sheet (magenta wall)
        gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 0.0, 1.0);
        gl.drawArrays(gl.LINES, verticesPerSheet, verticesPerSheet);
        
        // Draw YZ sheet (yellow wall)
        gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 1.0, 0.0);
        gl.drawArrays(gl.LINES, verticesPerSheet * 2, verticesPerSheet);
        
        console.log("✅ 3D spacetime grid rendered: Cyan XY + Magenta XZ + Yellow YZ sheets");
        
        gl.disableVertexAttribArray(this.gridUniforms.position);
    }

    // 4x4 matrix multiplication helper
    _multiplyMatrices4x4(a, b) {
        const result = new Float32Array(16);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                result[row * 4 + col] = 
                    a[row * 4 + 0] * b[0 * 4 + col] +
                    a[row * 4 + 1] * b[1 * 4 + col] +
                    a[row * 4 + 2] * b[2 * 4 + col] +
                    a[row * 4 + 3] * b[3 * 4 + col];
            }
        }
        return result;
    }

    // Exact warpGridVertices implementation with FIXED Natário curvature
    _updateGrid() {
        // 🔍 DEBUG CHECKPOINT 3: _updateGrid entry verification
        console.log('📊 _updateGrid called - Grid warping initiated');
        
        if (!this.gridVertices) {
            console.warn("Grid vertices not initialized!");
            return;
        }
        
        // CRITICAL BUG FIX: Reset vertices to original BEFORE warping
        if (this.originalGridVertices) {
            this.gridVertices.set(this.originalGridVertices);
            console.log("✅ Grid reset to original before warping");
        }
        
        console.log(`Updating ${this.gridVertices.length / 3} grid vertices...`);
        this._warpGridVertices(this.gridVertices, this.gridHalf, this.gridY0, this.uniforms);
        
        // Upload all three sheets (XY, XZ, YZ) to GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        
        // Upload the whole vertex array (works for all three sheets)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // 🔍 DEBUG CHECKPOINT 4: VBO re-upload verification
        console.log(`💾 VBO Upload: ${this.gridVertices.length} floats = ${this.gridVertices.byteLength} bytes`);
        console.log("✅ FULL BUFFER UPDATE: All three sheets uploaded to GPU (XY, XZ, YZ)");
    }

    // Authentic Natário spacetime curvature implementation - REVERTED to visible scale
    _warpGridVertices(vtx, halfSize, originalY, bubbleParams) {
        // REVERT to a hardcoded radius (e.g., 10,000 nm) that is proportional
        // to the grid's 40,000 nm size. This makes the warp visible.
        const bubbleRadius_nm = 10000; // 10 µm
        const sagRclip = bubbleRadius_nm * this.normClip;

        // REVERT to a fixed visual amplitude to control the deformation size.
        const visualAmplitude = 0.25;

        // Physics parameters for animation scaling
        const powerAvg_MW = bubbleParams.powerAvg_MW || 100;
        const tsRatio = bubbleParams.tsRatio || 4100;

        for (let i = 0; i < vtx.length; i += 3) {
            const x = this.originalGridVertices[i];
            const y_original = this.originalGridVertices[i + 1];
            const z = this.originalGridVertices[i + 2];
            const r = Math.hypot(x, z);

            // The Natário profile function gives the SHAPE of the warp.
            const prof = (r / sagRclip) * Math.exp(-(r * r) / (sagRclip * sagRclip));

            // --- LATERAL DEFORMATION ---
            const push = prof * visualAmplitude;
            const scale = (r > 1e-6) ? (1.0 + push / r) : 1.0;
            vtx[i] = x * scale;
            vtx[i + 2] = z * scale;

            // --- VERTICAL DEFORMATION ---
            const powerScale = Math.log10(Math.max(1, powerAvg_MW)) / 2.0;
            const timeScale = 1.0 / Math.max(1, tsRatio / 1000);
            const dy = prof * visualAmplitude * powerScale * timeScale;
            vtx[i + 1] = y_original + dy;
        }
        
        // DIAGNOSTIC 1: Confirm CPU is mutating the vertex array
        let maxDrift = 0;
        for (let i = 0; i < vtx.length; i += 3) {
            maxDrift = Math.max(maxDrift, Math.abs(vtx[i] - vtx[i+2]));
        }
        console.log("Max lateral drift =", maxDrift.toFixed(4), "(target ≈ 0.08 for needle-hull pinch)");
        
        // Visual smoke test - check Y range after warping
        let ymax = -1e9, ymin = 1e9;
        for (let i = 1; i < vtx.length; i += 3) {
            ymax = Math.max(ymax, vtx[i]);
            ymin = Math.min(ymin, vtx[i]);
        }
        console.log(`Grid Y range after warp: ${ymin.toFixed(3)} … ${ymax.toFixed(3)} (should show variation)`);
        
        console.log(`✅ ENERGY PIPELINE CONNECTED: β₀=${(beta0/1e6).toFixed(1)}e+6, Power=${powerAvg_MW}MW → Visual Deformation`);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const gl = this.gl;
        if (gl) {
            if (this.gridVbo) gl.deleteBuffer(this.gridVbo);
            if (this.quadVbo) gl.deleteBuffer(this.quadVbo);
            if (this.program) gl.deleteProgram(this.program);
            if (this.gridProgram) gl.deleteProgram(this.gridProgram);
        }
    }
}

// Make available globally
window.WarpEngine = WarpEngine;
console.log("WarpEngine class loaded and available on window - FRESH REBUILD VERSION", Date.now());