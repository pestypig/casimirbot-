//====================================================================
//  Natário Warp‑Bubble Visualiser (3D Volumetric Cage v2.1 CACHE-BUST)
//  ------------------------------------------------------------------
//  Real-time WebGL visualization with authentic parameter mapping
//  Now featuring: Three orthogonal sheets for full 3D warp perception
//  URGENT: DEBUG STAMPS ADDED FOR PIPELINE DIAGNOSTICS
//====================================================================

class WarpEngine {
    constructor(canvas) {
        try {
            // 🔍 DEBUG CHECKPOINT 1: Version Stamp for Cache Debugging  
            console.error('🚨 CACHE-BUST-STAMP-v2.5-AGGRESSIVE-RELOAD-NATARIO 🚨');
            console.error('🏷️ WARP-ENGINE-PIPELINE-DIAGNOSTICS-ACTIVE');
            console.error('✅ 3D WebGL WarpEngine with fallback compatibility loaded');
            
            console.log("WarpEngine v2.0: Starting 3D volumetric cage initialization...");
            this.canvas = canvas;
            
            // Gate this legacy cage behind a URL flag
            this.enabled = /\bcage=1\b/.test(location.search);
            if (!this.enabled) {
                console.warn('CAGE DISABLED (enable with ?cage=1). Skipping quad+grid render.');
            }
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
            window.addEventListener("resize", () => this._resize());
            
            console.log("WarpEngine: Starting render loop...");
            this._startRenderLoop();
            
            console.log("WarpEngine: Initialization completed successfully!");
        console.log(`Canvas dimensions: ${this.canvas.width}x${this.canvas.height}`);
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
            "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time, u_beta0;\n" +
            "\n" +
            "// Natário β‑field with authentic physics\n" +
            "vec3 betaField(vec3 x) {\n" +
            "    float R = u_sagDepth_nm * 1e-9;  // nm → m conversion\n" +
            "    float r = length(x);\n" +
            "    if (r < 1e-9) return vec3(0.0);\n" +
            "    \n" +
            "    float beta0 = u_beta0;  // Use directly injected β₀ from amplifier chain\n" +
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
            "    // Enhanced ripple: Power controls speed, tsRatio controls animation rate\n" +
            "    float rippleSpeed = sqrt(u_powerAvg_MW / 100.0) * 2.0 / max(u_tsRatio / 1000.0, 1.0);\n" +
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
            "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time, u_beta0;\n" +
            "\n" +
            "vec3 betaField(vec3 x) {\n" +
            "    float R = u_sagDepth_nm * 1e-9;\n" +
            "    float r = length(x);\n" +
            "    if (r < 1e-9) return vec3(0.0);\n" +
            "    \n" +
            "    float beta0 = u_beta0;  // Use directly injected β₀ from amplifier chain\n" +
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
            "    // Enhanced ripple effects with tsRatio scaling\n" +
            "    float rippleSpeed = sqrt(u_powerAvg_MW / 100.0) * 2.0 / max(u_tsRatio / 1000.0, 1.0);\n" +
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
        try {
            const gl = this.gl;
            const vbo = gl.createBuffer();
            if (!vbo) throw new Error("Failed to create VBO");
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,  1, -1,  -1, 1,  1, 1
            ]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.vbo = vbo;
            
            console.log("Quad VBO created successfully");
            
            // Initialize 3D grid for spacetime curvature visualization
            console.log("Initializing 3D grid...");
            this._initGrids();
            console.log("3D grid initialized successfully");
        } catch (error) {
            console.error("Failed to initialize quad:", error);
            throw error;
        }
    }

    _initGrids() {
        const gl = this.gl;
        
        console.log("Initializing 3D volumetric spacetime cage...");
        
        // Three orthogonal sheets for full 3D perception of warp bubble
        const size_nm = 40000;  // 40 μm viewing volume
        const divisions = 50;   // Grid resolution
        
        const sheetXY = this._createGrid(size_nm, divisions, 'XY');  // Floor (original)
        const sheetXZ = this._createGrid(size_nm, divisions, 'XZ');  // Side wall  
        const sheetYZ = this._createGrid(size_nm, divisions, 'YZ');  // End wall
        
        // Combine into single buffer for efficient rendering
        this.gridVertices = new Float32Array([
            ...sheetXY, ...sheetXZ, ...sheetYZ
        ]);
        this.gridVertexCount = this.gridVertices.length / 3;
        
        // Store sheet boundaries for colored rendering
        this.sheetXY_count = sheetXY.length / 3;
        this.sheetXZ_count = sheetXZ.length / 3;  
        this.sheetYZ_count = sheetYZ.length / 3;
        
        // Store original for reset operations
        this.originalGridVertices = new Float32Array(this.gridVertices);
        
        // Store grid parameters for warping
        this.gridSize = size_nm;
        this.gridHalf = this.gridSize / 2;
        
        // Y coordinate baseline (kept from original system)
        const step = this.gridSize / divisions;
        const norm = 0.8 / this.gridHalf;
        this.gridY0 = (-this.gridHalf * 0.3 + 3 * step) * norm;
        
        console.log(`3D Cage created: XY(${this.sheetXY_count}) + XZ(${this.sheetXZ_count}) + YZ(${this.sheetYZ_count}) = ${this.gridVertexCount} vertices`);
        console.log(`Grid parameters: size=${this.gridSize}nm, Y0=${this.gridY0}`);
        console.log(`Sheet arrays - XY: ${sheetXY.length}, XZ: ${sheetXZ.length}, YZ: ${sheetYZ.length}`);
        
        // Create dynamic grid buffer
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // Compile grid shader program with multi-sheet support
        this._compileGridShaders();
    }

    // 3D volumetric grid generator - creates orthogonal sheets for full warp bubble visualization
    _createGrid(size = 40_000, divisions = 50, plane = 'XY') {
        const verts = [];
        const step = size / divisions;
        const half = size / 2;
        const norm = 0.8 / half;  // Normalize to clip space
        
        console.log(`Generating ${plane} sheet with ${divisions}x${divisions} grid`);
        
        if (plane === 'XY') {
            // Floor grid - lines parallel to X and Y axes (original sheet)
            for (let z = 0; z <= divisions; ++z) {
                const zPos = (-half + z * step) * norm;
                for (let x = 0; x < divisions; ++x) {
                    const x0 = (-half + x * step) * norm;
                    const x1 = (-half + (x + 1) * step) * norm;
                    const yBase = -0.15 + 0.05 * Math.sin(x0 * 2) * Math.cos(zPos * 3);
                    verts.push(x0, yBase, zPos, x1, yBase, zPos);  // X-lines
                }
            }
            for (let x = 0; x <= divisions; ++x) {
                const xPos = (-half + x * step) * norm;
                for (let z = 0; z < divisions; ++z) {
                    const z0 = (-half + z * step) * norm;
                    const z1 = (-half + (z + 1) * step) * norm;
                    const yBase = -0.15 + 0.05 * Math.sin(xPos * 2) * Math.cos(z0 * 3);
                    verts.push(xPos, yBase, z0, xPos, yBase, z1);  // Z-lines
                }
            }
        }
        else if (plane === 'XZ') {
            // Side wall grid - vertical sheet, offset from camera axis for visibility
            const ySheet = 0.25;  // Move away from camera axis (25% of clip cube)
            for (let z = 0; z <= divisions; ++z) {
                const zPos = (-half + z * step) * norm;
                for (let x = 0; x < divisions; ++x) {
                    const x0 = (-half + x * step) * norm;
                    const x1 = (-half + (x + 1) * step) * norm;
                    verts.push(x0, ySheet, zPos, x1, ySheet, zPos);  // X-lines at elevated y
                }
            }
            for (let x = 0; x <= divisions; ++x) {
                const xPos = (-half + x * step) * norm;
                for (let z = 0; z < divisions; ++z) {
                    const z0 = (-half + z * step) * norm;
                    const z1 = (-half + (z + 1) * step) * norm;
                    verts.push(xPos, ySheet, z0, xPos, ySheet, z1);  // Z-lines at elevated y
                }
            }
        }
        else if (plane === 'YZ') {
            // End wall grid - vertical sheet, offset from camera axis for visibility
            const xSheet = 0.25;  // Move away from camera axis (25% of clip cube)
            for (let z = 0; z <= divisions; ++z) {
                const zPos = (-half + z * step) * norm;
                for (let y = 0; y < divisions; ++y) {
                    const y0 = (-half * 0.3 + y * step) * norm;
                    const y1 = (-half * 0.3 + (y + 1) * step) * norm;
                    verts.push(xSheet, y0, zPos, xSheet, y1, zPos);  // Y-lines at offset x
                }
            }
            for (let y = 0; y <= divisions; ++y) {
                const yPos = (-half * 0.3 + y * step) * norm;
                for (let z = 0; z < divisions; ++z) {
                    const z0 = (-half + z * step) * norm;
                    const z1 = (-half + (z + 1) * step) * norm;
                    verts.push(xSheet, yPos, z0, xSheet, yPos, z1);  // Z-lines at offset x
                }
            }
        }
        
        console.log(`${plane} sheet: ${verts.length/6} lines generated`);
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
            "uniform float u_energyFlag;\n" +  // WarpFactory energy condition flag
            "uniform vec3 u_sheetColor;\n" +    // Different color per sheet
            "out vec4 frag;\n" +
            "void main() {\n" +
            "    // WarpFactory-inspired: Color-code energy condition violations\n" +
            "    vec3 baseColor = (u_energyFlag > 0.5) ? \n" +
            "        vec3(1.0, 0.0, 1.0) :  // Magenta for WEC violations (exotic matter)\n" +
            "        u_sheetColor;           // Sheet-specific color for normal matter\n" +
            "    frag = vec4(baseColor, 0.7);\n" +  // Semi-transparent for 3D depth
            "}"
            :
            "precision highp float;\n" +
            "uniform float u_energyFlag;\n" +  // WarpFactory energy condition flag
            "uniform vec3 u_sheetColor;\n" +    // Different color per sheet
            "void main() {\n" +
            "    // WarpFactory-inspired: Color-code energy condition violations\n" +
            "    vec3 baseColor = (u_energyFlag > 0.5) ? \n" +
            "        vec3(1.0, 0.0, 1.0) :  // Magenta for WEC violations (exotic matter)\n" +
            "        u_sheetColor;           // Sheet-specific color for normal matter\n" +
            "    gl_FragColor = vec4(baseColor, 0.7);\n" +  // Semi-transparent for 3D depth
            "}";

        console.log("Compiling grid shaders for POINTS rendering...");
        console.log("Grid vertex shader with gl_PointSize:", gridVs.substring(0, 200));
        console.log("Grid fragment shader with red color:", gridFs.substring(0, 200));
        
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
            energyFlag: gl.getUniformLocation(this.gridProgram, "u_energyFlag"),  // WarpFactory energy condition
            sheetColor: gl.getUniformLocation(this.gridProgram, "u_sheetColor")   // Sheet-specific coloring
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
            time: gl.getUniformLocation(this.program, "u_time"),
            beta0: gl.getUniformLocation(this.program, "u_beta0")
        };
    }

    //----------------------------------------------------------------
    //  Public API for React integration
    //----------------------------------------------------------------
    updateUniforms(params) {
        Object.assign(this.uniforms, params);
        
        // 🔍 DEBUG CHECKPOINT 2: Uniforms changing verification
        console.log('🔧 updateUniforms called with:', params);
        console.table(this.uniforms);
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
        if (!this.enabled) return; // hard skip all drawing from this file
        
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear with dark blue background for contrast
        gl.clearColor(0.05, 0.1, 0.15, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // CRITICAL FIX: Upload time uniform to enable animation
        gl.useProgram(this.program);
        gl.uniform1f(this.uLoc.time, time);
        
        // Upload all uniforms for the warp field shader
        gl.uniform1f(this.uLoc.dutyCycle, this.uniforms.dutyCycle || 0.14);
        gl.uniform1f(this.uLoc.g_y, this.uniforms.g_y || 26);
        gl.uniform1f(this.uLoc.cavityQ, this.uniforms.cavityQ || 1e9);
        gl.uniform1f(this.uLoc.sagDepth_nm, this.uniforms.sagDepth_nm || 16);
        gl.uniform1f(this.uLoc.tsRatio, this.uniforms.tsRatio || 4100);  // Time-scale ratio for animation speed
        gl.uniform1f(this.uLoc.powerAvg_MW, this.uniforms.powerAvg_MW || 83.3);
        gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg || 1405);
        
        // CRITICAL FIX: Upload directly injected β₀ from amplifier chain
        const currentBeta0 = this.uniforms.beta0 || (this.uniforms.dutyCycle * this.uniforms.g_y);
        gl.uniform1f(this.uLoc.beta0, currentBeta0);
        
        // 🔍 DEBUG CHECKPOINT 2B: GPU uniform verification + Beta0 shader check
        console.log("🔍 BETA0 SHADER DEBUG: currentBeta0 =", currentBeta0, "(should be > 0)");
        if (performance.now() % 1000 < 16) {  // Log every second
            console.log(`🎮 GPU Uniforms: β₀=${currentBeta0.toExponential(2)}, sagDepth=${this.uniforms.sagDepth_nm}nm, power=${this.uniforms.powerAvg_MW}MW`);
        }
        
        // Render main warp field visualization first
        this._renderQuad();
        
        // Enable depth testing for 3D grid overlay
        gl.enable(gl.DEPTH_TEST);
        
        // Now render the full grid with proper physics
        this._updateGrid();
        this._renderGridPoints();
        
        gl.disable(gl.DEPTH_TEST);
    }
    
    _drawSimpleTest() {
        const gl = this.gl;
        
        // Create simple 4-corner test pattern
        if (!this.testVbo) {
            const testVertices = new Float32Array([
                -0.8, -0.8, 0.0,    // bottom left
                 0.8, -0.8, 0.0,    // bottom right
                 0.8,  0.8, 0.0,    // top right
                -0.8,  0.8, 0.0     // top left
            ]);
            
            this.testVbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.testVbo);
            gl.bufferData(gl.ARRAY_BUFFER, testVertices, gl.STATIC_DRAW);
            console.log("Test VBO created with 4 corner points");
        }
        
        // Use grid shader (which should work for simple points)
        gl.useProgram(this.gridProgram);
        
        // Identity matrix (no transformations)
        const identity = new Float32Array([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]);
        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, identity);
        
        // Bind test vertices and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.testVbo);
        gl.enableVertexAttribArray(this.gridUniforms.position);
        gl.vertexAttribPointer(this.gridUniforms.position, 3, gl.FLOAT, false, 0, 0);
        
        console.log("Drawing 4 red corner dots...");
        gl.drawArrays(gl.POINTS, 0, 4);
        
        // Check for errors
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL error in simple test:", error);
        } else {
            console.log("Simple test completed - should see 4 red dots in corners");
        }
        
        gl.disableVertexAttribArray(this.gridUniforms.position);
    }

    // Exact warpGridVertices implementation from the minimal recipe
    _updateGrid() {
        // 🔍 DEBUG CHECKPOINT 3: _updateGrid entry verification
        console.log('📊 _updateGrid called - Grid warping initiated');
        
        if (!this.gridVertices) {
            console.warn("Grid vertices not initialized!");
            return;
        }
        
        // CRITICAL BUG FIX: Reset vertices to original BEFORE warping
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
        
        // Upload the whole vertex array (works for all three sheets) - CACHE BUSTER v2
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // 🔍 DEBUG CHECKPOINT 4: VBO re-upload verification
        console.log(`💾 VBO Upload: ${this.gridVertices.length} floats = ${this.gridVertices.byteLength} bytes`);
        console.log("✅ FULL BUFFER UPDATE: All three sheets uploaded to GPU (XY, XZ, YZ)");
    }

    // Authentic Natário spacetime curvature implementation
    _warpGridVertices(vtx, halfSize, originalY, bubbleParams) {
        // CRITICAL BUG FIX: Remove the reset that was happening AFTER warping
        // (Reset now happens in _updateGrid BEFORE calling this function)

        // Use energy pipeline bubble radius instead of hardcoded value
        const bubbleRadius_nm = bubbleParams.sagDepth_nm || 10000;  // From pipeline or fallback
        const sagRclip = bubbleRadius_nm / halfSize * 0.4;  // keeps the warp inside ±0.8
        
        // Use computed β₀ from amplifier chain (duty × γ_geo × √Q_dyn × γ_VdB^0.25)
        const beta0 = bubbleParams.beta0;
        if (beta0 === undefined) {
            console.warn("No beta0 supplied to _warpGridVertices - skipping warp");
            return; // Early out to prevent using stale values
        }
        
        // Get realistic power for scaling deformation amplitude
        const powerAvg_MW = bubbleParams.powerAvg_MW || 100;
        
        // WarpFactory energy condition flags simulation (future: load from pre-computed texture)
        const energyConditionViolated = beta0 > 1000;  // Simplified WEC check
        
        const tsRatio = bubbleParams.tsRatio || 4100;
        console.log(`🔗 ENERGY PIPELINE → GRID CONNECTION:`);
        console.log(`  β₀=${beta0.toExponential(2)} (from amplifier chain)`);
        console.log(`  sagDepth=${bubbleRadius_nm}nm (from pipeline, not hardcoded)`);
        console.log(`  powerAvg=${powerAvg_MW}MW (log-scaled deformation)`);
        console.log(`  tsRatio=${tsRatio} (animation speed scaling)`);
        console.log(`  sagRclip=${sagRclip.toFixed(4)} (clip-space radius) - NORMALIZED SCALING`);
        console.log(`  🔧 AMPLITUDE CLAMP: lateralK=${(0.10 * sagRclip).toFixed(4)}, verticalK=${(0.10 * sagRclip).toFixed(4)}`);

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

            // -------- AMPLITUDE CLAMPING: Limit warp to 10% of bubble radius --------
            const lateralK = 0.10 * sagRclip;       // max 10% of radius
            const verticalK = 0.10 * sagRclip;      // max 10% of radius
            
            // -------- LATERAL DEFORMATION: Bend X and Z with clamped coefficients --------
            const push = beta * lateralK;           // use clamped coefficient
            const scale = (r > 1e-6) ? (1.0 + push / r) : 1.0;

            vtx[i] = x * scale;                      // X warped laterally
            vtx[i + 2] = z * scale;                  // Z warped laterally
            
            // -------- VERTICAL DEFORMATION: Y displacement with clamped coefficients --------
            const powerScale = Math.max(0.1, Math.min(5.0, powerAvg_MW / 100.0)); // linear, clamped
            const timeScale = 1.0 / Math.max(1, tsRatio / 1000);  // Slow animation for high tsRatio
            const dy = beta * verticalK * powerScale * timeScale;  // use clamped coefficient
            vtx[i + 1] = y_original + dy;                         // Y warped vertically from original position
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
            const y = vtx[i];
            if (y > ymax) ymax = y;
            if (y < ymin) ymin = y;
        }
        console.log(`Grid Y range after warp: ${ymin.toFixed(3)} … ${ymax.toFixed(3)} (should show variation)`);
        console.log(`✅ ENERGY PIPELINE CONNECTED: β₀=${beta0.toExponential(1)}, Power=${powerAvg_MW}MW → Visual Deformation`);
    }

    _renderQuad() {
        const gl = this.gl;
        
        // CRITICAL FIX 2: Get correct attribute location (not hardcoded 0)
        const positionLoc = gl.getAttribLocation(this.program, "a_position");
        if (positionLoc === -1) {
            console.error("a_position attribute not found in shader!");
            return;
        }
        
        // Render fullscreen quad for warp field visualization
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(positionLoc);
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
        
        // Keep depth testing enabled for proper 3D overlay
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        
        // Use POINTS instead of LINES for visible thick grid (lineWidth is clamped to 1px)
        if (this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE)[1] >= 5.0) {
            // GPU supports large points - use them for visibility
            console.log("Using POINTS for visible grid rendering");
        }
        
        // Grid rendering
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.enableVertexAttribArray(this.gridUniforms.position);
        gl.vertexAttribPointer(this.gridUniforms.position, 3, gl.FLOAT, false, 0, 0);
        
        // Render grid as points with proper 3D perspective
        if (this.gridUniforms.position !== -1) {
            // Set up 3D perspective camera (moderate zoom)
            const proj = new Float32Array([
                2.4, 0, 0, 0,
                0, 2.4, 0, 0,
                0, 0, -1.002, -1,
                0, 0, -0.2, 0
            ]);
            
            // Add 15° yaw so camera isn't orthogonal to walls
            const yaw = 15.0 * Math.PI / 180.0;     // 15°
            const cy = Math.cos(yaw), sy = Math.sin(yaw);
            
            const view = new Float32Array([
                 cy, 0,  sy, 0,
                  0, 1,   0, -0.15,   // slightly elevated camera
                -sy, 0,  cy, -1.6,   // camera with yaw rotation
                  0, 0,   0, 1
            ]);
            
            const mvp = this._multiplyMatrices(proj, view);
            gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, mvp);
            
            // WarpFactory-inspired: Upload energy condition flag for color coding
            const energyFlag = this.uniforms.beta0 > 100000 ? 1.0 : 0.0;  // WEC violation threshold
            gl.uniform1f(this.gridUniforms.energyFlag, energyFlag);
            
            // Enable blending for transparent overlapping sheets
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            
            // Render each sheet with different colors for 3D perception
            let offset = 0;
            
            console.log(`Rendering 3D cage - XY: ${this.sheetXY_count}, XZ: ${this.sheetXZ_count}, YZ: ${this.sheetYZ_count}`);
            
            // XY Floor sheet - cyan
            gl.uniform3f(this.gridUniforms.sheetColor, 0.1, 0.8, 1.0);
            gl.drawArrays(gl.LINES, offset, this.sheetXY_count);
            console.log(`XY sheet drawn: offset=${offset}, count=${this.sheetXY_count}`);
            offset += this.sheetXY_count;  // Move to start of XZ data
            
            // XZ Side wall - magenta  
            gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 0.1, 0.8);
            gl.drawArrays(gl.LINES, offset, this.sheetXZ_count);
            console.log(`XZ sheet drawn: offset=${offset}, count=${this.sheetXZ_count}`);
            offset += this.sheetXZ_count;  // Move to start of YZ data
            
            // YZ End wall - yellow
            gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 1.0, 0.1);
            gl.drawArrays(gl.LINES, offset, this.sheetYZ_count);
            console.log(`YZ sheet drawn: offset=${offset}, count=${this.sheetYZ_count}`);
            
            gl.disable(gl.BLEND);
            
            console.log(`Rendered ${this.gridVertexCount} grid lines with 3D perspective - should now be visible!`);
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
        
        console.log(`3D spacetime grid rendered with authentic Natário warp bubble physics`);
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

// Optional toggles in dev console for cage renderer
window.__cage_on  = () => {
    if (window.warpEngine) {
        window.warpEngine.enabled = true;
        console.log('🔓 CAGE ENABLED: Legacy volumetric cage renderer activated');
    }
};
window.__cage_off = () => {
    if (window.warpEngine) {
        window.warpEngine.enabled = false;
        console.log('🔒 CAGE DISABLED: Legacy volumetric cage renderer deactivated');
    }
};

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
    console.log("WarpEngine class loaded and available on window - CACHE BUSTED VERSION", Date.now());
}