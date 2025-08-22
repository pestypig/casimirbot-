// Optimized 3D spacetime curvature visualization engine
// Authentic Natário warp bubble physics with WebGL rendering

// --- Grid defaults (scientifically scaled for needle hull) ---
const GRID_DEFAULTS = {
  spanPadding: (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
    ? 1.45   // a touch more padding on phones so the first fit is perfect
    : 1.35,  // tighter framing for closer view on desktop
  minSpan: 2.6,        // never smaller than this (in clip-space units)
  divisions: 100       // more lines so a larger grid still looks dense
};

const SCENE_SCALE = (typeof sceneScale === 'number' && isFinite(sceneScale)) ? sceneScale : 1.0;

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
            desynchronized: true
        }) || canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
            desynchronized: true
        });
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        console.log("🚨 ENHANCED 3D ELLIPSOIDAL SHELL v4.0 - PIPELINE-DRIVEN PHYSICS 🚨");
        
        // Check for non-blocking shader compilation support
        this.parallelShaderExt = this.gl.getExtension('KHR_parallel_shader_compile');
        if (this.parallelShaderExt) {
            console.log("⚡ Non-blocking shader compilation available");
        }
        
        // Loading state management
        this.isLoaded = false;
        this.onLoadingStateChange = null; // callback for loading progress
        
        // Strobing state for sector sync
        this.strobingState = {
            sectorCount: 1,
            currentSector: 0
        };
        
        // Initialize WebGL state
        this.gl.clearColor(0.0, 0.0, 0.3, 1.0); // Dark blue background
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        
        // Initialize uniform dirty flag
        this._uniformsDirty = false;
        
        // Debug mode and performance tracking
        this._debugMode = !!(location.search && /debug=1/.test(location.search));
        this._lastDebugTime = 0;
        this._lastRenderLog = 0;
        
        // Cache for responsive camera
        this._lastAxesScene = null;
        this._gridSpan = null;
        
        // Camera system
        this.cameraMode = 'overhead';         // single source of truth for camera pose
        this._lastFittedR = 1;                // cache last fit radius for stability
        
        // Temporal smoothing for visual calm (canonical Natário)
        this._dispAlpha = 0.25; // blend factor (0=no change, 1=instant)
        this._prevDisp = [];     // per-vertex displacement history
        
        // Grid rendering resources
        this.gridVertices = null;
        this.originalGridVertices = null; // Store original positions for warp calculations
        this.gridVbo = null;
        this.gridProgram = null;
        this._vboBytes = 0; // Track VBO buffer size for efficient updates
        this._resizeRaf = 0; // Track resize throttling RAF ID
        this._warnNoProgramOnce = false; // Warn-once flag for shader program availability
        
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

        // Display-only controls (do NOT feed these back into pipeline math)
        this.uniforms = {
            vizGain: 4.0,        // how exaggerated the bend looks
            colorByTheta: 1.0,   // 1=York colors, 0=solid sheet color
            vShip: 1.0,          // ship-frame speed scale for θ
            wallWidth: 0.06,
            axesClip: [0.40, 0.22, 0.22],
            driveDir: [1, 0, 0],
            // NEW: Artificial gravity tilt parameters
            epsilonTilt: 0.0,    // gentle tilt strength (interior artificial gravity)
            betaTiltVec: [0, -1, 0],  // tilt direction vector (default: -Y = "down")
            tiltGain: 0.55,      // gentle visual scaling
            // NEW: Cosmetic curvature control (1 = real physics, 10 = current visuals)
            cosmeticLevel: 10    // default to current visual feel
        };
        
        // Initialize rendering pipeline
        this._setupCamera();
        this._initializeGrid();
        
        // Expose strobing sync function globally
        window.setStrobingState = ({ sectorCount, currentSector, split }) => {
            try {
                this.strobingState.sectorCount  = Math.max(1, sectorCount|0);
                this.strobingState.currentSector= Math.max(0, currentSector|0) % this.strobingState.sectorCount;
                // update visual strobing immediately
                this.updateUniforms({
                  sectors: this.strobingState.sectorCount,
                  split: Number.isFinite(split) ? Math.max(0, Math.min(this.strobingState.sectorCount-1, split|0)) : this.uniforms?.split
                });
            } catch (e) {
                console.warn("WarpEngine.setStrobingState error:", e);
            }
        };
        // Expose curvature gain setter for the UI slider (0..8 decades)
        this.__warp_setGainDec = (dec, max = 40) => {
            try { this.setCurvatureGainDec(dec, max); } catch (e) { console.warn(e); }
        };
        window.__warp_setGainDec = this.__warp_setGainDec;

        // Expose cosmetic curvature level API (1 = real physics, 10 = current visuals)
        this.__warp_setCosmetic = (level /* 1..10 */) => {
            try { this.setCosmeticLevel(level); } catch(e){ console.warn(e); }
        };
        window.__warp_setCosmetic = this.__warp_setCosmetic;

        // One-click presets
        window.__warp_truePhysics = () => {
          this.updateUniforms({
            physicsParityMode: true,        // activates the clamp above
            curvatureBoostMax: 1,
            curvatureGainT: 0,
            // exposure/zeroStop are set in the parity block
          });
          console.log("✅ True Physics: parity ON, no boosts/cosmetics");
        };

        window.__warp_showcase = () => {
          this.updateUniforms({
            physicsParityMode: false,
            cosmeticLevel: 10,
            curvatureBoostMax: 40,
            curvatureGainT: 0.50,          // "demo" mid-boost; adjust to taste
            exposure: 6.0,
            zeroStop: 1e-7,
          });
          console.log("🎨 Showcase: parity OFF, cosmetics/boosts ON");
        };

        // default to "current visuals" feel
        this.setCosmeticLevel(10);
        
        // Bind throttled resize handler
        this._resize = () => {
            if (this._resizeRaf) return;
            this._resizeRaf = requestAnimationFrame(() => { 
                this._resizeRaf = 0; 
                this._resizeCanvasToDisplaySize(); 
            });
        };
        window.addEventListener('resize', this._resize);
        this._resizeCanvasToDisplaySize(); // Initial setup
        
        // Prime the engine with initial visible curvature using T+boostMax pattern
        this.updateUniforms({
            curvatureGainT: 0.0,     // 0 → 1× (true-physics visual scale)
            curvatureBoostMax: 40,   // same as SliceViewer
            exposure: 6.0,
            zeroStop: 1e-7,
            wallWidth: 0.05,         // fatten the wall to catch more vertices
        });
        
        // Start render loop
        this._renderLoop();
    }

    // --- central overhead camera (single place to change the pose) ---
    _applyOverheadCamera(opts = {}) {
        const gl = this.gl;
        if (!gl) return;
        const aspect = this.canvas.width / Math.max(1, this.canvas.height);
        const fov = this._fitFovForAspect(aspect);      // existing helper

        // bubble radius in scene units
        const axes = this.uniforms?.axesScene || this._lastAxesScene || [1,1,1];
        const R = Math.max(axes[0], axes[1], axes[2], opts.spanHint || 1);
        this._lastFittedR = R;

        const baseMargin = 1.22;
        const margin = baseMargin * (aspect < 1 ? 1.12 : 1.00);
        const dist = (margin * R) / Math.tan(fov * 0.5);

        // ↑ raise camera; ↓ look slightly down so bubble isn't on the horizon
        const eye    = [0, 0.62 * R, -dist];   // higher overhead
        const center = [0, -0.12 * R, 0];      // look further down
        const up     = [0, 1, 0];

        this._perspective(this.projMatrix, fov, aspect, 0.08, 100.0);
        this._lookAt(this.viewMatrix, eye, center, up);
        this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
        
        console.log(`📷 Overhead fit: R=${R.toFixed(2)}, eye=[${eye.map(v=>v.toFixed(2)).join(',')}], center=[${center.map(v=>v.toFixed(2)).join(',')}]`);
    }

    _setupCamera() {
        // always start in the overhead fitted view
        this._applyOverheadCamera();
    }

    _resizeCanvasToDisplaySize() {
        // Cap DPR on phones so we don't oversample and "zoom in"
        const dprCap = (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ? 1.5 : 2.0;
        const dpr = Math.min(dprCap, window.devicePixelRatio || 1);

        const { clientWidth, clientHeight } = this.canvas;
        const width  = Math.max(1, Math.floor(clientWidth  * dpr));
        const height = Math.max(1, Math.floor(clientHeight * dpr));

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width  = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);

            // after resize, reapply overhead fit (no low pose flash)
            this._applyOverheadCamera({ spanHint: this._gridSpan || 1.0 });
        }
    }
    
    _adjustCameraForSpan(span) {
        // prefer overhead fit unless the user explicitly set cameraZ
        if (Number.isFinite(this.currentParams?.cameraZ)) {
            const aspect = this.canvas.width / Math.max(1, this.canvas.height);
            const eye = [0, 0.50, -this.currentParams.cameraZ];
            const center = [0, -0.08, 0];
            const up = [0, 1, 0];
            this._perspective(this.projMatrix, this._fitFovForAspect(aspect), aspect, 0.08, 100.0);
            this._lookAt(this.viewMatrix, eye, center, up);
            this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
            console.log(`📷 Camera override: z=${(-this.currentParams.cameraZ).toFixed(2)} (span=${span.toFixed(2)})`);
        } else {
            this._applyOverheadCamera({ spanHint: span });
        }
    }

    _initializeGrid() {
        const gl = this.gl;
        
        // Create spacetime grid geometry
        // Start with default span, will be adjusted when hull params are available
        const initialSpan = GRID_DEFAULTS.minSpan;
        const gridData = this._createGrid(initialSpan, GRID_DEFAULTS.divisions);
        this.gridVertices = new Float32Array(gridData);
        
        // Store original vertex positions for warp calculations
        this.originalGridVertices = new Float32Array(gridData);
        this.currentGridSpan = initialSpan;
        
        // Create VBO for grid
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        this._vboBytes = this.gridVertices.byteLength;
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // Compile grid shader program
        this._compileGridShaders();
    }

    // Authentic spacetime grid from gravity_sim.cpp with proper normalization
    _createGrid(span = 1.6, divisions = GRID_DEFAULTS.divisions) {
        // Adaptive mesh density for thin walls (smoother displacement)
        const baseDiv = Math.max(divisions, 160);
        const targetVertsAcrossWall = 12;
        const hullAxes = this.currentParams?.hullAxes || [503.5, 132, 86.5];
        const wallWidth_m = this.currentParams?.wallWidth_m || 6.0;
        
        // ρ-span of ±3σ wall thickness
        const span_rho = Math.max(1e-3, (3 * wallWidth_m) / Math.min(...hullAxes));
        const scale = Math.max(1.0, targetVertsAcrossWall / (span_rho * baseDiv));
        divisions = Math.min(320, Math.floor(baseDiv * scale)); // Higher cap for smoother walls
        const verts = [];
        const step = (span * 2) / divisions;  // Full span width divided by divisions
        const half = span;  // Half-extent
        
        // Create a slight height variation across the grid for proper 3D visualization
        const yBase = -0.15;  // Base Y level
        const yVariation = this.uniforms?.physicsParityMode ? 0 : 0.05;  // Small height variation

        for (let z = 0; z <= divisions; ++z) {
            const zPos = -half + z * step;
            for (let x = 0; x < divisions; ++x) {
                const x0 = -half + x * step;
                const x1 = -half + (x + 1) * step;
                
                // Add slight Y variation for better 3D visibility
                const y0 = yBase + yVariation * Math.sin(x0 * 2) * Math.cos(zPos * 3);
                const y1 = yBase + yVariation * Math.sin(x1 * 2) * Math.cos(zPos * 3);
                
                verts.push(x0, y0, zPos, x1, y1, zPos);      // x–lines with height variation
            }
        }
        for (let x = 0; x <= divisions; ++x) {
            const xPos = -half + x * step;
            for (let z = 0; z < divisions; ++z) {
                const z0 = -half + z * step;
                const z1 = -half + (z + 1) * step;
                
                // Add slight Y variation for better 3D visibility
                const y0 = yBase + yVariation * Math.sin(xPos * 2) * Math.cos(z0 * 3);
                const y1 = yBase + yVariation * Math.sin(xPos * 2) * Math.cos(z1 * 3);
                
                verts.push(xPos, y0, z0, xPos, y1, z1);     // z–lines with height variation
            }
        }
        
        console.log(`Spacetime grid: ${verts.length/6} lines, ${divisions}x${divisions} divisions`);
        console.log(`Grid coordinate range: X=${-half} to ${half}, Z=${-half} to ${half} (span=${span*2})`);
        return new Float32Array(verts);
    }

    _compileGridShaders() {
        const isWebGL2 = this.gl.getParameter(this.gl.VERSION).includes("WebGL 2.0");
        
        const gridVs = isWebGL2 ?
            "#version 300 es\n" +
            "in vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "out vec3 v_pos;\n" +
            "void main() {\n" +
            "    v_pos = a_position;\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "}"
            :
            "attribute vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "varying vec3 v_pos;\n" +
            "void main() {\n" +
            "    v_pos = a_position;\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "}";

        const gridFs = isWebGL2 ?
            "#version 300 es\n" +
            "precision highp float;\n" +
            "uniform float u_colorByTheta;\n" +
            "uniform vec3 u_sheetColor;\n" +
            "uniform vec3 u_axes;\n" +
            "uniform vec3 u_driveDir;\n" +
            "uniform float u_wallWidth;\n" +
            "uniform float u_vShip;\n" +
            "uniform float u_epsTilt;\n" +      // ε_tilt (dimensionless)
            "uniform float u_intWidth;\n" +     // interior window width in ρ-units
            "uniform float u_tiltViz;\n" +      // visual gain for violet tint only
            "uniform float u_exposure;\n" +     // logarithmic exposure control (3.0 .. 12.0)
            "uniform float u_zeroStop;\n" +     // prevents log blowup (~1e-9 .. 1e-5)
            "uniform float u_thetaScale;\n" +   // amplitude chain: γ³ · (ΔA/A) · γ_VdB · √(duty/sectors)
            "uniform float u_userGain;\n" +     // unified curvature gain from UI slider
            "uniform int   u_colorMode;\n" +    // 0=solid, 1=theta (front/back), 2=shear |σ| proxy
            "in vec3 v_pos;\n" +
            "out vec4 frag;\n" +
            "vec3 diverge(float t) {\n" +
            "    float x = clamp((t+1.0)*0.5, 0.0, 1.0);\n" +
            "    vec3 c1 = vec3(0.15, 0.45, 1.0);\n" +  // blue
            "    vec3 c2 = vec3(1.0);\n" +               // white  
            "    vec3 c3 = vec3(1.0, 0.45, 0.0);\n" +    // orange-red
            "    return x < 0.5 ? mix(c1,c2, x/0.5) : mix(c2,c3,(x-0.5)/0.5);\n" +
            "}\n" +
            "vec3 seqTealLime(float u) {\n" +
            "    vec3 a = vec3(0.05, 0.30, 0.35);\n" + // dark teal
            "    vec3 b = vec3(0.00, 1.00, 0.60);\n" + // lime-teal
            "    return mix(a,b, pow(u, 0.8));\n" +     // slight gamma for pop
            "}\n" +
            "void main() {\n" +
            "    if (u_colorMode == 0) {\n" +
            "        frag = vec4(u_sheetColor, 0.85);\n" +
            "        return;\n" +
            "    }\n" +
            "    vec3 pN = v_pos / u_axes;\n" +
            "    float rs = length(pN) + 1e-6;\n" +
            "    vec3 dN = normalize(u_driveDir / u_axes);\n" +
            "    float xs = dot(pN, dN);\n" +
            "    float w = max(1e-4, u_wallWidth);\n" +
            "    float f = exp(-pow(rs - 1.0, 2.0) / (w*w));\n" +
            "    float dfdrs = (-2.0*(rs - 1.0) / (w*w)) * f;\n" +
            "    float theta = u_vShip * (xs/rs) * dfdrs;\n" +
            "    // NEW: shear magnitude proxy (transverse gradient piece)\n" +
            "    float sinphi = sqrt(max(0.0, 1.0 - (xs/rs)*(xs/rs)));\n" +
            "    float shearProxy = abs(dfdrs) * sinphi * u_vShip;\n" +
            "    // Shared amplitude/log mapping (both go through same chain so scales match)\n" +
            "    float valTheta  = theta      * u_thetaScale * max(1.0, u_userGain);\n" +
            "    float valShear  = shearProxy * u_thetaScale * max(1.0, u_userGain);\n" +
            "    // symmetric log for theta (signed), simple log for shear (magnitude)\n" +
            "    float magT = log(1.0 + abs(valTheta) / max(u_zeroStop, 1e-18));\n" +
            "    float magS = log(1.0 +      valShear / max(u_zeroStop, 1e-18));\n" +
            "    float norm = log(1.0 + max(1.0, u_exposure));\n" +
            "    // normalized visual values\n" +
            "    float tVis = clamp((valTheta < 0.0 ? -1.0 : 1.0) * (magT / norm), -1.0, 1.0);\n" +
            "    float sVis = clamp( magS / norm, 0.0, 1.0);\n" +
            "    // Choose color by mode\n" +
            "    vec3 col;\n" +
            "    if (u_colorMode == 1) {\n" +
            "        col = diverge(tVis);\n" +       // θ front/back
            "    } else {\n" +                       // 2 = shear
            "        col = seqTealLime(sVis);\n" +   // |σ|
            "    }\n" +
            "    // ----- interior tilt violet blend (visual only) -----\n" +
            "    vec3 pN_int = v_pos / u_axes;\n" +
            "    float rs_int = length(pN_int) + 1e-6;\n" +
            "    float wInt = max(1e-4, u_intWidth);\n" +
            "    float s = clamp((1.0 - rs_int) / wInt, 0.0, 1.0);\n" +
            "    float interior = s*s*(3.0 - 2.0*s);          // C¹ smoothstep\n" +
            "    float blendAmt = clamp(abs(u_epsTilt) * u_tiltViz * interior, 0.0, 1.0);\n" +
            "    vec3 violet = vec3(0.70, 0.30, 1.00);\n" +
            "    col = mix(col, violet, blendAmt);\n" +
            "    frag = vec4(col, 0.9);\n" +
            "}"
            :
            "precision highp float;\n" +
            "uniform float u_colorByTheta;\n" +
            "uniform vec3 u_sheetColor;\n" +
            "uniform vec3 u_axes;\n" +
            "uniform vec3 u_driveDir;\n" +
            "uniform float u_wallWidth;\n" +
            "uniform float u_vShip;\n" +
            "uniform float u_epsTilt;\n" +
            "uniform float u_intWidth;\n" +
            "uniform float u_tiltViz;\n" +
            "uniform float u_exposure;\n" +
            "uniform float u_zeroStop;\n" +
            "uniform float u_thetaScale;\n" +
            "uniform float u_userGain;\n" +
            "uniform int   u_colorMode;\n" +    // 0=solid, 1=theta (front/back), 2=shear |σ| proxy
            "varying vec3 v_pos;\n" +
            "vec3 diverge(float t) {\n" +
            "    float x = clamp((t+1.0)*0.5, 0.0, 1.0);\n" +
            "    vec3 c1 = vec3(0.15, 0.45, 1.0);\n" +  // blue
            "    vec3 c2 = vec3(1.0);\n" +               // white  
            "    vec3 c3 = vec3(1.0, 0.45, 0.0);\n" +    // orange-red
            "    return x < 0.5 ? mix(c1,c2, x/0.5) : mix(c2,c3,(x-0.5)/0.5);\n" +
            "}\n" +
            "vec3 seqTealLime(float u) {\n" +
            "    vec3 a = vec3(0.05, 0.30, 0.35);\n" + // dark teal
            "    vec3 b = vec3(0.00, 1.00, 0.60);\n" + // lime-teal
            "    return mix(a,b, pow(u, 0.8));\n" +     // slight gamma for pop
            "}\n" +
            "void main() {\n" +
            "    if (u_colorMode == 0) {\n" +
            "        gl_FragColor = vec4(u_sheetColor, 0.85);\n" +
            "        return;\n" +
            "    }\n" +
            "    vec3 pN = v_pos / u_axes;\n" +
            "    float rs = length(pN) + 1e-6;\n" +
            "    vec3 dN = normalize(u_driveDir / u_axes);\n" +
            "    float xs = dot(pN, dN);\n" +
            "    float w = max(1e-4, u_wallWidth);\n" +
            "    float f = exp(-pow(rs - 1.0, 2.0) / (w*w));\n" +
            "    float dfdrs = (-2.0*(rs - 1.0) / (w*w)) * f;\n" +
            "    float theta = u_vShip * (xs/rs) * dfdrs;\n" +
            "    // NEW: shear magnitude proxy (transverse gradient piece)\n" +
            "    float sinphi = sqrt(max(0.0, 1.0 - (xs/rs)*(xs/rs)));\n" +
            "    float shearProxy = abs(dfdrs) * sinphi * u_vShip;\n" +
            "    // Shared amplitude/log mapping (both go through same chain so scales match)\n" +
            "    float valTheta  = theta      * u_thetaScale * max(1.0, u_userGain);\n" +
            "    float valShear  = shearProxy * u_thetaScale * max(1.0, u_userGain);\n" +
            "    // symmetric log for theta (signed), simple log for shear (magnitude)\n" +
            "    float magT = log(1.0 + abs(valTheta) / max(u_zeroStop, 1e-18));\n" +
            "    float magS = log(1.0 +      valShear / max(u_zeroStop, 1e-18));\n" +
            "    float norm = log(1.0 + max(1.0, u_exposure));\n" +
            "    // normalized visual values\n" +
            "    float tVis = clamp((valTheta < 0.0 ? -1.0 : 1.0) * (magT / norm), -1.0, 1.0);\n" +
            "    float sVis = clamp( magS / norm, 0.0, 1.0);\n" +
            "    // Choose color by mode\n" +
            "    vec3 col;\n" +
            "    if (u_colorMode == 1) {\n" +
            "        col = diverge(tVis);\n" +       // θ front/back
            "    } else {\n" +                       // 2 = shear
            "        col = seqTealLime(sVis);\n" +   // |σ|
            "    }\n" +
            "    // ----- interior tilt violet blend (visual only) -----\n" +
            "    vec3 pN_int = v_pos / u_axes;\n" +
            "    float rs_int = length(pN_int) + 1e-6;\n" +
            "    float wInt = max(1e-4, u_intWidth);\n" +
            "    float s = clamp((1.0 - rs_int) / wInt, 0.0, 1.0);\n" +
            "    float interior = s*s*(3.0 - 2.0*s);\n" +
            "    float blendAmt = clamp(abs(u_epsTilt) * u_tiltViz * interior, 0.0, 1.0);\n" +
            "    vec3 violet = vec3(0.70, 0.30, 1.00);\n" +
            "    col = mix(col, violet, blendAmt);\n" +
            "    gl_FragColor = vec4(col, 0.9);\n" +
            "}";

        // Use async shader compilation if available
        const onShaderReady = (program) => {
            if (!program) {
                console.error("CRITICAL: Failed to compile grid shaders!");
                return;
            }
            
            this.gridProgram = program;
            this._setupUniformLocations();
            this._setLoaded(true);
            console.log("Grid shader program compiled successfully with York-time coloring support");
        };
        
        // Try async compilation first, fallback to sync
        if (this.parallelShaderExt) {
            this.gridProgram = this._createShaderProgram(gridVs, gridFs, onShaderReady);
        } else {
            this.gridProgram = this._createShaderProgram(gridVs, gridFs);
            onShaderReady(this.gridProgram);
        }
    }
    
    _setupUniformLocations() {
        const gl = this.gl;
        this.gridUniforms = {
            mvpMatrix: gl.getUniformLocation(this.gridProgram, 'u_mvpMatrix'),
            colorByTheta: gl.getUniformLocation(this.gridProgram, 'u_colorByTheta'),
            sheetColor: gl.getUniformLocation(this.gridProgram, 'u_sheetColor'),
            axes: gl.getUniformLocation(this.gridProgram, 'u_axes'),
            driveDir: gl.getUniformLocation(this.gridProgram, 'u_driveDir'),
            wallWidth: gl.getUniformLocation(this.gridProgram, 'u_wallWidth'),
            vShip: gl.getUniformLocation(this.gridProgram, 'u_vShip'),
            epsTilt: gl.getUniformLocation(this.gridProgram, 'u_epsTilt'),
            intWidth: gl.getUniformLocation(this.gridProgram, 'u_intWidth'),
            tiltViz: gl.getUniformLocation(this.gridProgram, 'u_tiltViz'),
            exposure: gl.getUniformLocation(this.gridProgram, 'u_exposure'),
            zeroStop: gl.getUniformLocation(this.gridProgram, 'u_zeroStop'),
            thetaScale: gl.getUniformLocation(this.gridProgram, 'u_thetaScale'),
            userGain: gl.getUniformLocation(this.gridProgram, 'u_userGain'),
            colorMode: gl.getUniformLocation(this.gridProgram, 'u_colorMode')
        };
        this.gridAttribs = {
            position: gl.getAttribLocation(this.gridProgram, 'a_position'),
        };
    }
    
    _setLoaded(loaded) {
        this.isLoaded = loaded;
        if (this.onLoadingStateChange) {
            this.onLoadingStateChange({ 
                type: loaded ? 'ready' : 'loading',
                message: loaded ? 'Warp engine ready' : 'Initializing...'
            });
        }
    }

    updateUniforms(parameters) {
        if (!parameters) return;
        
        // 🔬 PHYSICS PARITY MODE DETECTION
        const physicsParityMode = parameters.physicsParityMode === true;
        
        // NEW: cosmetic curvature blend (1 = real physics, 10 = current visuals)
        const rawLevel = Number.isFinite(parameters.cosmeticLevel) ? +parameters.cosmeticLevel : 10;
        const cosmeticT0 = Math.max(0, Math.min(1, (rawLevel - 1) / 9)); // 1→0, 10→1
        const cosmeticT = physicsParityMode ? 0 : cosmeticT0; // parity overrides to true-physics
        
        // Color mode parsing: accept strings or ints: 'solid'|'theta'|'shear' or 0|1|2
        const colorMode = (() => {
            const cm = (parameters as any).colorMode;
            if (cm === 'solid' || cm === 0) return 0;
            if (cm === 'shear' || cm === 2) return 2;
            return 1; // default theta
        })();
        
        if (physicsParityMode) {
            console.warn('🔬 PHYSICS PARITY MODE ACTIVE: All visual multipliers forced to unity for debug baseline');
            
            // Suppress global boost injections
            if (typeof window !== 'undefined' && window.__warp_setGainDec) {
                console.warn('🔬 PARITY MODE: Suppressing global warp boost injections');
                // Temporarily disable global boosts
                window.__warp_setGainDec = () => {};
            }
        } else if (cosmeticT < 1) {
            console.log(`🎨 COSMETIC CURVATURE: Level ${rawLevel}/10 → blend ${(cosmeticT * 100).toFixed(1)}% toward current visuals`);
        }
        
        // Update internal parameters with operational mode integration
        this.currentParams = { ...this.currentParams, ...parameters };
        // If caller provided a cameraZ override, keep it
        if (Number.isFinite(parameters?.cameraZ)) {
            this.currentParams.cameraZ = Number(parameters.cameraZ);
        }
        
        // Numeric coercion helper
        const N = v => (Number.isFinite(+v) ? +v : 0);
        const mode = parameters.currentMode || this.currentParams.currentMode || 'hover';

        // duty as fraction [0..1]
        const dutyFrac = (() => {
          const d = parameters.dutyCycle;
          if (d == null) return N(this.currentParams.dutyCycle);
          return d > 1 ? d/100 : N(d);
        })();

        const axesScene =
            parameters.axesScene || parameters.axesClip || this.uniforms?.axesClip || (function resolveFromHull(p){
                if (!p) return null;
                const a = (p.hullAxes?.[0] ?? p.hull?.a) || 503.5;
                const b = (p.hullAxes?.[1] ?? p.hull?.b) || 132.0;
                const c = (p.hullAxes?.[2] ?? p.hull?.c) || 86.5;
                // Convert meters → scene (using standard scale)
                const s = 1.0 / 1200.0;
                return [a * s, b * s, c * s];
            })(parameters) ||
            this._lastAxesScene ||
            [0.4, 0.22, 0.22];

        // Mirror pipeline fields into uniforms for diagnostics
        this.uniforms = {
            ...this.uniforms,
            vizGain: 4,
            colorByTheta: 1,
            vShip: parameters.vShip || 1,
            wallWidth: parameters.wallWidth || 0.06,
            axesClip: axesScene,
            driveDir: parameters.driveDir || [1, 0, 0],
            // NEW: Artificial gravity tilt parameters
            epsilonTilt: physicsParityMode ? 0 : N(parameters.epsilonTilt || 0), // 🔬 Force zero tilt in parity mode
            epsilonTiltFloor: physicsParityMode ? 0 : N(parameters.epsilonTiltFloor || 0), // 🔬 Force zero tilt floor
            betaTiltVec: physicsParityMode ? [0, 0, 0] : (parameters.betaTiltVec || [0, -1, 0]), // 🔬 Force zero tilt vector
            tiltGain: N(parameters.tiltGain || 0.55),
            // NEW: Curvature Gain blend system (replaces vizGainOverride)
            // --- Curvature gain mapping (exactly matches SliceViewer) ---
            curvatureBoostMax: (() => {
                const boostMax = Number.isFinite(parameters.curvatureBoostMax)
                    ? Math.max(1, parameters.curvatureBoostMax)
                    : (this.uniforms?.curvatureBoostMax ?? 40);
                return boostMax;
            })(),
            
            curvatureGainT: (() => {
                const clamp01 = t => Math.max(0, Math.min(1, t));
                // Normalize to T in [0,1]
                const T_from_props =
                    Number.isFinite(parameters.curvatureGainT)   ? clamp01(+parameters.curvatureGainT) :
                    Number.isFinite(parameters.curvatureGain)    ? clamp01(+parameters.curvatureGain / 8) :
                    Number.isFinite(parameters.curvatureGainDec) ? clamp01(+parameters.curvatureGainDec / 8) :
                    (this.uniforms?.curvatureGainT ?? 0.375); // default = slider ~3/8
                return T_from_props;
            })(),
            
            userGain: (() => {
                // 🔬 Physics Parity Mode: Force unity gain
                if (physicsParityMode) {
                    return 1;
                }
                
                const clamp01 = t => Math.max(0, Math.min(1, t));
                const boostMax = Number.isFinite(parameters.curvatureBoostMax)
                    ? Math.max(1, parameters.curvatureBoostMax)
                    : (this.uniforms?.curvatureBoostMax ?? 40);
                
                const T_from_props =
                    Number.isFinite(parameters.curvatureGainT)   ? clamp01(+parameters.curvatureGainT) :
                    Number.isFinite(parameters.curvatureGain)    ? clamp01(+parameters.curvatureGain / 8) :
                    Number.isFinite(parameters.curvatureGainDec) ? clamp01(+parameters.curvatureGainDec / 8) :
                    (this.uniforms?.curvatureGainT ?? 0.375);

                // Blend 1→boostMax exactly like SliceViewer
                const userGainFromT = 1 + T_from_props * (boostMax - 1);

                // Allow absolute override if caller passes userGain directly
                const userGainFinal = Number.isFinite(parameters.userGain)
                    ? Math.max(1, +parameters.userGain)
                    : userGainFromT;

                return userGainFinal;
            })(),
            
            // HELIX drives a numeric thetaScale; fall back to local rebuild only if absent
            thetaScale: (() => {
                // 1) If HELIX sent a viz block, honor its default choice (FR-like).
                if (parameters?.viz?.thetaScale_FR_like != null &&
                    (parameters?.viz?.defaultThetaScale === "FR_like" || !parameters?.viz?.defaultThetaScale)) {
                  return +parameters.viz.thetaScale_FR_like;
                }
                if (parameters?.viz?.thetaScale_UI_like != null &&
                    parameters?.viz?.defaultThetaScale === "UI_like") {
                  return +parameters.viz.thetaScale_UI_like;
                }
                // 2) Else fall back to local rebuild, but include ΔA/A (qSpoilingFactor).
                if (Number.isFinite(parameters.thetaScale)) return +parameters.thetaScale;
                const gammaGeo = N(parameters.gammaGeo ?? this.currentParams.g_y ?? 26);
                const gammaVdB = N(parameters.gammaVdB ?? this.currentParams.gammaVanDenBroeck ?? 1);
                const dAa      = N(parameters.deltaAOverA ?? parameters.qSpoilingFactor ?? 1);
                const duty     = Math.max(1e-12, N(dutyFrac));
                const sectors  = Math.max(1, N(parameters.sectors ?? 400));
                return Math.pow(gammaGeo, 3) * dAa * gammaVdB * Math.sqrt(duty / sectors);
            })(),
            
            // Mirror pipeline fields for diagnostics
            currentMode: mode,
            // UI duty for HUD/visual seasoning; FR duty handled by thetaScale (server/viz)
            dutyCycle: physicsParityMode ? 1 : dutyFrac,
            gammaGeo: physicsParityMode ? 1 : N(parameters.gammaGeo ?? parameters.g_y ?? this.currentParams.g_y), // 🔬 Force unity
            Qburst: physicsParityMode ? 1 : N(parameters.Qburst ?? parameters.cavityQ ?? this.currentParams.cavityQ), // 🔬 Force unity
            deltaAOverA: physicsParityMode ? 1 : N(parameters.deltaAOverA ?? parameters.qSpoilingFactor ?? 1), // 🔬 Force unity
            gammaVdB: physicsParityMode ? 1 : N(parameters.gammaVdB ?? parameters.gammaVanDenBroeck ?? 1), // 🔬 Force unity
            sectors: physicsParityMode ? 1 : Math.max(1, Math.floor(N(parameters.sectors ?? parameters.sectorStrobing ?? 1))), // 🔬 Force 1 sector
            split: physicsParityMode ? 0 : Math.max(0, Math.min(
                (N(parameters.sectors ?? parameters.sectorStrobing ?? 1)) - 1,
                Math.floor(N(parameters.split ?? ((mode === 'cruise' ? 0.65 : mode === 'emergency' ? 0.70 : 0.50) * N(parameters.sectors ?? parameters.sectorStrobing ?? 1))))
            )), // 🔬 Force 0 split in parity mode
            viewAvg: parameters.viewAvg !== undefined ? !!parameters.viewAvg : true
        };

        // pipeline drives hullAxes (meters); clip-axes are computed later in _warpGridVertices
        const hullAxes = parameters.hullAxes || this.uniforms?.hullAxes || [503.5,132,86.5];
        this.uniforms = {
            ...this.uniforms,
            hullAxes,
            colorMode,
        };
        this.currentParams.hullAxes = hullAxes;    // keep currentParams in sync

        // 🔬 PHYSICS PARITY MODE: Hard disable cosmetics & boosts, keep real thetaScale above
        if (physicsParityMode) {
            // Hard disable cosmetics & boosts, keep real thetaScale above.
            this.uniforms.userGain           = 1;
            this.uniforms.curvatureBoostMax  = 1;
            this.uniforms.curvatureGainT     = 0;
            this.uniforms.exposure           = 3.0;    // lower contrast
            this.uniforms.zeroStop           = 1e-5;   // less aggressive log pop
            this.uniforms.epsilonTilt        = 0;      // no interior tilt visuals
            this.uniforms.betaTiltVec        = [0,0,0];
            this.uniforms.cosmeticT          = 0;
        }

        // 🎨 COSMETIC BLENDING: Apply visual parameter interpolation based on cosmeticLevel
        if (cosmeticT < 1 && !physicsParityMode) {
            // Baselines for a "real physics" look
            const EXPOSURE_BASE = 3.0;    // lower contrast
            const ZEROSTOP_BASE = 1e-5;   // less aggressive log pop
            const USERGAIN_BASE = 1.0;    // no boost
            
            // Get current target values from parameters or uniforms
            const exposureTarget = Number.isFinite(parameters.exposure) ? +parameters.exposure : (this.uniforms?.exposure ?? 6.0);
            const zeroStopTarget = Number.isFinite(parameters.zeroStop) ? +parameters.zeroStop : (this.uniforms?.zeroStop ?? 1e-7);
            const userGainCurrent = this.uniforms.userGain || 1;
            
            // BLEND: effective values that the shaders/geometry actually use
            const userGainEffective = USERGAIN_BASE + cosmeticT * (userGainCurrent - USERGAIN_BASE);
            const exposureEffective = EXPOSURE_BASE + cosmeticT * (exposureTarget - EXPOSURE_BASE);
            const zeroStopEffective = ZEROSTOP_BASE + cosmeticT * (zeroStopTarget - ZEROSTOP_BASE);
            
            // Write back to uniforms so both shader & CPU geometry use the blended values
            this.uniforms.userGain = userGainEffective;
            this.uniforms.exposure = exposureEffective;
            this.uniforms.zeroStop = zeroStopEffective;
            this.uniforms.cosmeticT = cosmeticT; // Store for debugging
            
            console.log(`🎨 COSMETIC BLEND: userGain ${userGainCurrent.toFixed(2)}→${userGainEffective.toFixed(2)}, exposure ${exposureTarget.toFixed(1)}→${exposureEffective.toFixed(1)}, zeroStop ${zeroStopTarget.toExponential(1)}→${zeroStopEffective.toExponential(1)}`);
        } else {
            // Ensure exposure and zeroStop are set when not blending
            this.uniforms.exposure = Number.isFinite(parameters.exposure) ? +parameters.exposure : (this.uniforms?.exposure ?? 6.0);
            this.uniforms.zeroStop = Number.isFinite(parameters.zeroStop) ? +parameters.zeroStop : (this.uniforms?.zeroStop ?? 1e-7);
            this.uniforms.cosmeticT = cosmeticT;
        }

        // Expose exaggeration snapshot that UI can read per frame (for HUD)
        this.uniforms.__exaggeration = {
            userGain: this.uniforms.userGain,
            exposure: this.uniforms.exposure,
            zeroStop: this.uniforms.zeroStop,
            cosmeticT: this.uniforms.cosmeticT || 1
        };

        // Update cached axes and refit camera if changed
        if (axesScene) {
            this._lastAxesScene = axesScene;
            this._fitCameraToBubble(axesScene, this._gridSpan || 1);
        }

        // If grid span provided, cache it and refit
        if (typeof parameters.gridSpan === 'number') {
            this._gridSpan = Math.max(0.5, parameters.gridSpan);
            this._fitCameraToBubble(this._lastAxesScene || axesScene, this._gridSpan);
        }
        
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
        
        // 🔬 PHYSICS PARITY MODE: Comprehensive uniform logging for debug baseline
        if (physicsParityMode) {
            console.warn('🔬 PHYSICS PARITY UNIFORM LOGGING:', {
                A_geoUniform: this.uniforms?.gammaGeo || 1,
                // QburstUniform: removed from curvature chain,
                gammaVdBUniform: this.uniforms?.gammaVdB || 1,
                qSpoilUniform: this.uniforms?.deltaAOverA || 1,
                dutyCycleUniform: this.uniforms?.dutyCycle || 1,
                sectorsUniform: this.uniforms?.sectors || 1,
                betaInstUniform: 'calculated in _warpGridVertices',
                betaAvgUniform: 'calculated in _warpGridVertices',
                betaUsedUniform: 'calculated in _warpGridVertices',
                thetaScaleUniform: this.uniforms?.thetaScale || 0,
                userGainUniform: this.uniforms?.userGain || 1,
                curvatureBoostMaxUniform: this.uniforms?.curvatureBoostMax || 1,
                curvatureGainTUniform: this.uniforms?.curvatureGainT || 0,
                epsilonTiltUniform: this.uniforms?.epsilonTilt || 0,
                betaTiltVecUniform: this.uniforms?.betaTiltVec || [0,0,0],
                wallWidthUniform: this.uniforms?.wallWidth || 0.016,
                exposureUniform: this.uniforms?.exposure || 6,
                zeroStopUniform: this.uniforms?.zeroStop || 1e-7
            });
        }

        // Log tilt uniforms for diagnostics
        if (this._diagEnabled) {
          console.log('🎛️ Tilt uniforms:', {
            epsilonTilt: this.uniforms?.epsilonTilt,
            tiltGain: this.uniforms?.tiltGain,
            betaTiltVec: this.uniforms?.betaTiltVec,
          });
        }
        
        // Apply warp deformation to grid with mode-specific enhancements
        this._updateGrid();
        
        // Apply camera positioning - prefer overhead fit unless explicit cameraZ provided
        if (Number.isFinite(this.currentParams?.cameraZ)) {
            this._adjustCameraForSpan(this._gridSpan || this._lastFittedR || 1.0);
        } else {
            this._applyOverheadCamera({ spanHint: this._gridSpan || this._lastFittedR || 1.0 });
        }
    }
    
    _calculateModeEffects(params) {
        // visual-only seasoning; geometry ignores this
        const mode = (params.currentMode || 'hover').toLowerCase();
        const config = {
            hover:     { baseScale: 1.0, strobingViz: 0.8 },
            cruise:    { baseScale: 1.0, strobingViz: 0.6 },
            emergency: { baseScale: 1.0, strobingViz: 1.0 },
            standby:   { baseScale: 1.0, strobingViz: 0.3 }
        }[mode] || { baseScale: 1.0, strobingViz: 0.8 };

        return {
            visualScale: config.baseScale,
            curvatureAmplifier: 1.0,   // <- neutralized for geometry
            strobingFactor: config.strobingViz
        };
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
        
        this._warpGridVertices(vtx, this.currentParams);
        
        // Upload updated vertices to GPU efficiently
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        if (this._vboBytes !== this.gridVertices.byteLength) {
            // Buffer size changed, need full reallocation
            gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
            this._vboBytes = this.gridVertices.byteLength;
        } else {
            // Buffer size unchanged, use cheaper subdata update
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridVertices);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log("Grid vertices updated and uploaded to GPU");
    }

    // Authentic Natário spacetime curvature implementation
    _warpGridVertices(vtx, bubbleParams) {
        // Get hull axes from uniforms or use needle hull defaults (in meters)
        const hullAxes = (this.uniforms?.hullAxes || bubbleParams.hullAxes) || [503.5,132,86.5]; // semi-axes [a,b,c] in meters
        // Clean wall thickness handling - use either meters or ρ-units
        const a = hullAxes[0], b = hullAxes[1], c = hullAxes[2];
        const aH = 3 / (1/a + 1/b + 1/c); // harmonic mean, meters
        const wallWidth_m   = Number.isFinite(bubbleParams.wallWidth_m)   ? bubbleParams.wallWidth_m   : undefined;
        const wallWidth_rho = Number.isFinite(bubbleParams.wallWidth_rho) ? bubbleParams.wallWidth_rho : undefined;
        const w_rho = wallWidth_rho ?? (wallWidth_m != null ? wallWidth_m / aH : 0.016); // default in ρ-units
        
        // Prefer server-provided clip axes; otherwise scale by the *true* long semi-axis.
        const axesScene =
          (this.uniforms?.axesClip && this.uniforms.axesClip.length === 3)
            ? this.uniforms.axesClip
            : (() => {
                const aMax = Math.max(a, b, c);
                const s    = 1.0 / Math.max(aMax, 1e-9);
                return [a * s, b * s, c * s];
              })();
        
        // Use the computed w_rho from above
        
        // Compute a grid span that comfortably contains the whole bubble
        const hullMaxClip = Math.max(axesScene[0], axesScene[1], axesScene[2]); // half-extent in clip space
        const spanPadding = bubbleParams.gridScale || GRID_DEFAULTS.spanPadding;
        let targetSpan = Math.max(
          GRID_DEFAULTS.minSpan,
          hullMaxClip * spanPadding
        );
        
        // --- Enhanced gain boost for BOTH color & geometry (decades slider support) ---
        const userGain = Math.max(1.0, this.uniforms?.userGain || 1.0);
        // Expand the grid more aggressively with gain so you actually see it
        const spanBoost = 1.0 + Math.min(3.0, (Math.log10(userGain) || 0)) * 0.5; // +0..1.5× span
        targetSpan *= spanBoost;
        
        // Higher resolution for smoother canonical curvature
        const gridDivisions = 120; // increased from default for smoother profiles
        const driveDir = Array.isArray(this.uniforms?.driveDir) ? this.uniforms.driveDir : [1, 0, 0];
        const gridK = 0.10;                       // mild base (acts as unit scale)
        
        // === Unified "SliceViewer-consistent" amplitude for geometry ===
        // thetaScale = γ^3 · (ΔA/A) · γ_VdB · √(duty/sectors)  (already computed in updateUniforms)
        const thetaScale = this.uniforms?.thetaScale ?? 1.0;
        const mode = (bubbleParams.currentMode || 'hover').toLowerCase();
        const A_base = thetaScale;          // physics, averaged if viewAvg was true upstream
        const boost = userGain;             // 1..max (same number sent to shader as u_userGain)
        // Small per-mode seasoning only, so we don't hide the physics
        // Keep mode scale only for non-geometry uses (colors, display), not geometry amplitude
        const modeScale =
            mode === 'standby'   ? 0.95 :
            mode === 'cruise'    ? 1.00 :
            mode === 'hover'     ? 1.05 :
            mode === 'emergency' ? 1.08 : 1.00;
        // Enhanced amplitude compression for decades-scale gains: compress *after* boosting
        const A_vis = Math.min(1.0, Math.log10(1.0 + A_base * boost * modeScale));
        
        console.log(`🔗 SCIENTIFIC ELLIPSOIDAL NATÁRIO SHELL:`);
        console.log(`  Hull: [${a.toFixed(1)}, ${b.toFixed(1)}, ${c.toFixed(1)}] m → scene: [${axesScene.map(x => x.toFixed(3)).join(', ')}]`);
        console.log(`  Wall: ${wallWidth_m ?? w_rho * aH} m → ρ-space: ${w_rho.toFixed(4)} (aH=${aH.toFixed(1)})`);
        console.log(`  Grid: span=${targetSpan.toFixed(2)} (hull_max=${hullMaxClip.toFixed(3)} × gain×${spanBoost.toFixed(2)})`);
        console.log(`  🎛️ UNIFIED AMPLITUDE: thetaScale=${thetaScale.toExponential(2)} × userGain=${userGain.toFixed(2)} × modeScale=${modeScale.toFixed(2)}`);
        console.log(`  🔬 FINAL A_vis=${A_vis.toExponential(2)} (same blend as SliceViewer)`);
        console.log(`  🎯 AMPLITUDE CLAMP: max_push=10% of shell radius (soft tanh saturation)`);

        // Ellipsoid utilities (using consistent scene-scaled axes)
        const rhoEllipsoidal = (p) => {
            return Math.hypot(p[0]/axesScene[0], p[1]/axesScene[1], p[2]/axesScene[2]);
        };
        
        const sdEllipsoid = (p, axes) => {
            return rhoEllipsoidal(p) - 1.0;
        };
        
        const nEllipsoid = (p, axes) => {
            const qa = [p[0]/(axes[0]*axes[0]), p[1]/(axes[1]*axes[1]), p[2]/(axes[2]*axes[2])];
            const rho = Math.max(1e-6, rhoEllipsoidal(p));
            const n = [qa[0]/rho, qa[1]/rho, qa[2]/rho];
            const m = Math.hypot(n[0], n[1], n[2]) || 1;
            return [n[0]/m, n[1]/m, n[2]/m];
        };
        
        // Normalize drive direction (using scene-scaled axes)
        const dN = (() => {
            const t = [driveDir[0]/axesScene[0], driveDir[1]/axesScene[1], driveDir[2]/axesScene[2]];
            const m = Math.hypot(...t) || 1;
            return [t[0]/m, t[1]/m, t[2]/m];
        })();

        // Smooth helper functions for C²-continuous displacement
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const smoothstep = (a, b, x) => { 
            const t = clamp01((x - a) / (b - a)); 
            return t * t * (3 - 2 * t); 
        }; // C¹
        const smootherstep = (a, b, x) => { 
            const t = clamp01((x - a) / (b - a)); 
            return t * t * t * (t * (t * 6 - 15) + 10); 
        }; // C²
        const softSign = (x) => Math.tanh(x); // smooth odd sign in (-1,1)

        // Read mode uniforms with sane defaults (renamed to avoid conflicts)
        const dutyCycleUniform = this.uniforms?.dutyCycle ?? 0.14;
        const sectorsUniform    = Math.max(1, Math.floor(this.uniforms?.sectors ?? 1));
        const splitUniform      = Math.max(0, Math.min(sectorsUniform - 1, this.uniforms?.split ?? 0));
        const viewAvgUniform    = this.uniforms?.viewAvg ?? true;

        const gammaGeoUniform = this.uniforms?.gammaGeo ?? 26;
        const qSpoilUniform   = this.uniforms?.deltaAOverA ?? 1.0;
        const gammaVdBUniform = this.uniforms?.gammaVdB ?? 2.86e5;

        const hullAxesUniform = this.uniforms?.hullAxes ?? [503.5,132,86.5];
        const wallWidthUniform = this.uniforms?.wallWidth ?? 0.016;  // 16 nm default

        // ---- Existing physics chain (do not change) ----
        const A_geoUniform = gammaGeoUniform * gammaGeoUniform * gammaGeoUniform; // γ_geo^3 amplification
        const effDutyUniform = viewAvgUniform ? Math.max(1e-12, dutyCycleUniform / Math.max(1, sectorsUniform)) : 1.0;
        
        const betaInstUniform = A_geoUniform * gammaVdBUniform * qSpoilUniform; // ← match thetaScale chain
        const betaAvgUniform  = betaInstUniform * Math.sqrt(effDutyUniform);
        const betaUsedUniform = viewAvgUniform ? betaAvgUniform : betaInstUniform;

        // Final viz field (no decades boost - cosmetic slider controls all exaggeration)
        const betaVisUniform = betaUsedUniform;

        // Debug per mode (once per 60 frames) - cosmetic controls all exaggeration now
        if ((this._dbgTick = (this._dbgTick||0)+1) % 60 === 0) {
            console.log("🧪 warp-mode", {
                mode: this.uniforms?.currentMode, duty: dutyCycleUniform, sectors: sectorsUniform, 
                split: splitUniform, viewAvg: viewAvgUniform, A_geo: A_geoUniform, effDuty: effDutyUniform, 
                betaInst: betaInstUniform.toExponential(2), betaAvg: betaAvgUniform.toExponential(2), 
                betaVis: betaVisUniform.toExponential(2),
                cosmeticLevel: this.uniforms?.cosmeticLevel || 10
            });
        }
        
        // Check for uniform updates
        if (this._uniformsDirty) {
            // (nothing special needed, just consume fresh uniforms)
            this._uniformsDirty = false;
        }

        // Core displacement calculation loop (C²-smooth)
        for (let i = 0; i < vtx.length; i += 3) {
            const p = [vtx[i], vtx[i + 1], vtx[i + 2]];
            
            // --- Smooth strobing sign using uniform sectors/split (C¹) ---
            const theta = Math.atan2(p[2], p[0]);
            const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
            const sectorIdx = Math.floor(u * sectorsUniform);
            
            // Distance from the split boundary in sector units
            const dist = (sectorIdx - splitUniform + 0.5);
            const strobeWidth = 1.5; // wider for smoother canonical profile
            const sgn = Math.tanh(-dist / strobeWidth); // smooth ±1
            
            // --- Ellipsoidal signed distance ---
            const rho = rhoEllipsoidal(p);            // ≈ |p| in ellipsoid coords
            const sd = rho - 1.0;                     // negative inside wall
            

            
            // --- Surface normal ---
            const n = nEllipsoid(p, axesScene);
            
            // --- (B) Soft front/back polarity (C¹-continuous) ---
            const dotND = n[0]*dN[0] + n[1]*dN[1] + n[2]*dN[2];
            const front = Math.tanh(dotND / 0.15);          // softer front polarity for canonical smoothness
            
            // --- Mode gains removed (cosmetic slider controls all exaggeration) ---
            
            // --- Local wall thickness in ellipsoidal ρ (correct units) ---
            // Semi-axes in meters (not the clip-scaled ones)
            const a_m = hullAxes[0]; // 503.5
            const b_m = hullAxes[1]; // 132.0
            const c_m = hullAxes[2]; // 86.5
            
            // Direction-dependent mapping of meters → Δρ
            const invR = Math.sqrt(
                (n[0]/a_m)*(n[0]/a_m) +
                (n[1]/b_m)*(n[1]/b_m) +
                (n[2]/c_m)*(n[2]/c_m)
            );
            const R_eff = 1.0 / Math.max(invR, 1e-6);
            // Use ρ-units directly. If meters were provided, we already converted to w_rho above.
            const w_rho_local = Math.max(1e-4, (wallWidth_m != null) ? (wallWidth_m / R_eff) : w_rho);
            
            // === CANONICAL NATÁRIO: Remove micro-bumps for smooth profile ===
            // For canonical Natário bubble, disable local gaussian bumps
            const gaussian_local = 1.0; // smooth canonical profile (no organ-pipe bumps)
            
            // --- (C) Gentler wall window for canonical smoothness ---
            const asd = Math.abs(sd), aWin = 3.5*w_rho_local, bWin = 5.0*w_rho_local;
            const wallWin = (asd<=aWin) ? 1 : (asd>=bWin) ? 0
                           : 0.5*(1.0 + Math.cos(3.14159265 * (asd - aWin) / (bWin - aWin))); // gentle falloff
            
            // Local θ proxy (same kernel as shader)
            const rs = rho;
            const w  = Math.max(1e-6, w_rho_local);
            const f  = Math.exp(-((rs - 1.0)*(rs - 1.0)) / (w*w));
            const df = (-2.0 * (rs - 1.0) / (w*w)) * f;

            // ≈ cos between surface normal and drive direction
            const xs_over_rs = (n[0]*dN[0] + n[1]*dN[1] + n[2]*dN[2]);

            // CPU shear proxy (for diagnostics/labels)
            const sinphi = Math.sqrt(Math.max(0, 1 - xs_over_rs*xs_over_rs));
            const shearProxy = Math.abs(df) * sinphi * (this.uniforms?.vShip ?? 1.0);
            // Accumulate quick average for the proof panel
            this._accumShear = (this._accumShear||0) + shearProxy;
            this._accumShearN = (this._accumShearN||0) + 1;

            // Same amplitude chain + user gain as the shader
            const userGain   = Math.max(1.0, this.uniforms?.userGain ?? 1.0);
            const zeroStop   = Math.max(1e-18, this.uniforms?.zeroStop ?? 1e-7);
            const exposure   = Math.max(1.0, this.uniforms?.exposure ?? 6.0);
            const mode       = (this.uniforms?.currentMode || 'hover').toLowerCase();

            // Geometry amplitude should be monotonic with the slider and not instantly saturate.
            // A_geom is normalized so that T=0 -> ~0, T=1 -> ~1, regardless of absolute physics magnitude.
            const T_gain     = this.uniforms?.curvatureGainT ?? 0.375;
            const boostMax   = Math.max(1, this.uniforms?.curvatureBoostMax ?? 40);
            const boostNow   = 1 + T_gain * (boostMax - 1);

            // Use natural log like the shader, but normalize by the "max boost" so result is in [0,1]
            const val = xs_over_rs * df * thetaScale * userGain;
            const num   = Math.log(1.0 + Math.abs(val) / zeroStop);
            // Remove mode scaling from geometry - keep modes visual-only elsewhere
            const denom = Math.max(1e-12, Math.log(1.0 + (xs_over_rs * df * thetaScale * boostMax) / zeroStop));
            const A_geom = Math.pow(Math.min(1.0, num / denom), 0.85); // 0..1, tracks the UI gain with gentle curve
            
            // Keep A_vis for color (can saturate)
            const norm = Math.log(1.0 + exposure);
            const A_vis = Math.min(1.0, num / norm);               // 0..1

            // Special case: make standby perfectly flat if desired
            let disp;
            if (mode === 'standby') {
                disp = 0; // perfectly flat grid for standby mode
            } else {
                // Normal displacement calculation with normalized amplitude (A_geom tracks slider)
                disp = gridK * A_geom * wallWin * front * sgn * gaussian_local;
                
                // No fixed bump; slider controls all visual scaling
                
                // Let curvature breathe more under big gain
                const maxPush = 0.22;                        // higher ceiling for decades slider
                const softClamp = (x, m) => m * Math.tanh(x / m);
                disp = softClamp(disp, maxPush);
                
                // Optional temporal smoothing for canonical visual calm
                const vertIndex = i / 3;
                const prev = this._prevDisp[vertIndex] ?? disp;
                const blended = prev + this._dispAlpha * (disp - prev);
                this._prevDisp[vertIndex] = blended;
                disp = blended;
            }
            
            // ----- Interior gravity (shift vector "tilt") -----
            // NEW: interior-only smooth window (C¹), wider and independent of 'ring'
            const w_int = Math.max(3.0 * (this.uniforms?.wallWidth || 0.016), 0.02); // ~few cm in normalized space
            const interior = (() => {
              // 1 inside the cabin (rho <= 1 - w_int), 0 outside; smooth edge within w_int
              const t = (1.0 - rho) / Math.max(w_int, 1e-6);
              // smoothstep(0→1): 3t² − 2t³, clamped
              const s = Math.max(0, Math.min(1, t));
              return s * s * (3 - 2 * s);
            })();

            // NEW: interior tilt displacement — do NOT multiply by 'ring'
            const epsTilt   = this.uniforms?.epsilonTilt ?? 0.0;
            const tiltGain  = this.uniforms?.tiltGain ?? 0.25;     // gentle default
            const betaTilt  = this.uniforms?.betaTiltVec || [0, -1, 0];
            // project normal onto "down" and keep sign stable
            const downDot   = (n[0]*betaTilt[0] + n[1]*betaTilt[1] + n[2]*betaTilt[2]);
            // scale small, interior-only, soft-clamped
            let dispTilt = epsTilt * tiltGain * interior * downDot;
            const maxTilt = 0.05;          // <= 5% of nominal radius; tune to taste
            dispTilt = Math.max(-maxTilt, Math.min(maxTilt, dispTilt));
            // ----- end interior gravity -----

            // apply both curvature and tilt
            vtx[i]     = p[0] - n[0] * (disp + dispTilt);
            vtx[i + 1] = p[1] - n[1] * (disp + dispTilt);
            vtx[i + 2] = p[2] - n[2] * (disp + dispTilt);
        }
        
        // Enhanced diagnostics - check for amplitude overflow
        let maxRadius = 0, maxDisp = 0;
        for (let i = 0; i < vtx.length; i += 3) {
            const r = Math.hypot(vtx[i], vtx[i + 1], vtx[i + 2]);
            maxRadius = Math.max(maxRadius, r);
            // Check displacement from original
            if (this.originalGridVertices) {
                const origR = Math.hypot(this.originalGridVertices[i], this.originalGridVertices[i + 1], this.originalGridVertices[i + 2]);
                maxDisp = Math.max(maxDisp, Math.abs(r - origR));
            }
        }
        console.log(`🎯 AMPLITUDE CHECK: max_radius=${maxRadius.toFixed(4)} (should be <2.0 to stay in frustum)`);
        console.log(`🎯 DISPLACEMENT: max_change=${maxDisp.toFixed(4)} (controlled deformation, no spears)`);
        
        let ymax = -1e9, ymin = 1e9;
        for (let i = 1; i < vtx.length; i += 3) {
            const y = vtx[i];
            if (y > ymax) ymax = y;
            if (y < ymin) ymin = y;
        }
        console.log(`Grid Y range: ${ymin.toFixed(3)} … ${ymax.toFixed(3)} (canonical smooth shell)`);
        console.log(`🔧 CANONICAL NATÁRIO: Smooth C¹-continuous profile (no micro-mountains)`);
        console.log(`🔧 SMOOTH STROBING: Wide blend width for canonical smoothness`);
        
        // Update uniforms for scientific consistency (using scene-scaled axes)
        this.uniforms.axesClip = axesScene;
        this.uniforms.wallWidth = w_rho;
        this.uniforms.hullDimensions = { a, b, c, aH, SCENE_SCALE, wallWidth_m };
        
        // Regenerate grid with proper span for hull size
        if (!Number.isFinite(this.currentGridSpan) || Math.abs(targetSpan - this.currentGridSpan) > 0.1) {
            console.log(`🔄 Regenerating grid: ${this.currentGridSpan || 'initial'} → ${targetSpan.toFixed(2)}`);
            this.currentGridSpan = targetSpan;
            const newGridData = this._createGrid(targetSpan, gridDivisions);
            
            // Update both current and original vertices
            this.gridVertices = newGridData;
            this.originalGridVertices = new Float32Array(newGridData);
            
            // Upload new geometry to GPU efficiently
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridVbo);
            if (this._vboBytes !== this.gridVertices.byteLength) {
                // Buffer size changed, need full reallocation
                this.gl.bufferData(this.gl.ARRAY_BUFFER, this.gridVertices, this.gl.DYNAMIC_DRAW);
                this._vboBytes = this.gridVertices.byteLength;
            } else {
                // Buffer size unchanged, use cheaper subdata update
                this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.gridVertices);
            }
            
            console.log(`✓ Grid regenerated with span=${targetSpan.toFixed(2)} for hull [${a}×${b}×${c}]m`);
            
            // Adjust camera framing for larger grids
            this._adjustCameraForSpan(targetSpan);
        }
    }

    _renderGridPoints() {
        const gl = this.gl;
        
        // Use the properly compiled grid program
        if (!this.gridProgram) {
            if (!this._warnNoProgramOnce) {
                console.warn("Grid program not ready yet; waiting for shader link…");
                this._warnNoProgramOnce = true;
            }
            return;
        }
        
        // Throttled logging for performance
        if (this._debugMode && Date.now() - (this._lastDebugTime || 0) > 1000) {
            console.log("Using grid program for rendering...");
            this._lastDebugTime = Date.now();
        }
        gl.useProgram(this.gridProgram);
        
        // Bind vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const loc = this.gridAttribs.position;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
        
        // Set all uniforms for York-time visualization
        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, this.mvpMatrix);
        gl.uniform1f(this.gridUniforms.colorByTheta, this.uniforms?.colorByTheta || 1.0);
        gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 0.0, 0.0); // fallback red
        gl.uniform3f(this.gridUniforms.axes, 
            this.uniforms?.axesClip[0] || 0.40,
            this.uniforms?.axesClip[1] || 0.22, 
            this.uniforms?.axesClip[2] || 0.22);
        gl.uniform3f(this.gridUniforms.driveDir,
            this.uniforms?.driveDir[0] || 1.0,
            this.uniforms?.driveDir[1] || 0.0,
            this.uniforms?.driveDir[2] || 0.0);
        gl.uniform1f(this.gridUniforms.wallWidth, Math.max(1e-4, this.uniforms?.wallWidth ?? 0.016));
        gl.uniform1f(this.gridUniforms.vShip, this.uniforms?.vShip || 1.0);
        
        // Violet interior tilt tint (visual-only)
        const epsTilt = (this.uniforms?.epsilonTilt || 0) * (this.uniforms?.tiltGain || 0);
        const wInt = Math.max(3.0 * (this.uniforms?.wallWidth || 0.016), 0.02); // same window as geometry
        const tintViz = 8.0;  // purely visual: raise/lower if you want the violet to pop more/less
        gl.uniform1f(this.gridUniforms.epsTilt, epsTilt);
        gl.uniform1f(this.gridUniforms.intWidth, wInt);
        gl.uniform1f(this.gridUniforms.tiltViz, tintViz);
        
        // Exposure controls for enhanced mode contrast
        gl.uniform1f(this.gridUniforms.exposure, this.uniforms?.exposure || 6.0);
        gl.uniform1f(this.gridUniforms.zeroStop, this.uniforms?.zeroStop || 1e-7);
        gl.uniform1f(this.gridUniforms.thetaScale, this.uniforms?.thetaScale || 1.0);
        gl.uniform1f(this.gridUniforms.userGain, this.uniforms?.userGain || 1.0);
        gl.uniform1i(this.gridUniforms.colorMode, (this.uniforms?.colorMode ?? 1)|0);
        
        // Render as lines for better visibility
        const vertexCount = this.gridVertices.length / 3;
        gl.drawArrays(gl.LINES, 0, vertexCount);
        
        // Throttled render logging
        if (this._debugMode && Date.now() - (this._lastRenderLog || 0) > 1000) {
            console.log(`Rendered ${vertexCount} grid lines with 3D perspective - should now be visible!`);
            this._lastRenderLog = Date.now();
        }
        
        // Clean up
        gl.disableVertexAttribArray(loc);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _renderLoop() {
        this._raf = requestAnimationFrame(() => this._renderLoop());
        this._render();
    }

    _render() {
        const gl = this.gl;
        
        // Clear the screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Render the spacetime grid
        this._renderGridPoints();
        
        // Emit diagnostics for proof panel
        if (this.onDiagnostics) {
            try { 
                const diag = this.computeDiagnostics();
                this.onDiagnostics(diag);
            } catch(e){
                console.warn('Diagnostics error:', e);
            }
        }
    }



    // Matrix math utilities
    _createShaderProgram(vertexSource, fragmentSource, onReady = null) {
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
        
        // Non-blocking compilation if available
        if (this.parallelShaderExt && onReady) {
            console.log("⚡ Starting non-blocking shader compilation...");
            this._pollShaderCompletion(program, onReady);
            return program; // Return immediately, will be ready asynchronously
        }
        
        // Synchronous fallback
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    _pollShaderCompletion(program, onReady) {
        const gl = this.gl;
        const ext = this.parallelShaderExt;
        
        const poll = () => {
            const done = gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR);
            
            if (done) {
                // Check if linking was successful
                if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.log("⚡ Shader compilation completed successfully");
                    onReady(program);
                } else {
                    console.error('Shader program link error:', gl.getProgramInfoLog(program));
                    gl.deleteProgram(program);
                    onReady(null);
                }
            } else {
                // Still compiling, check again next frame
                requestAnimationFrame(poll);
                
                // Update loading state if callback is available
                if (this.onLoadingStateChange) {
                    this.onLoadingStateChange({ type: 'compiling', message: 'Compiling shaders...' });
                }
            }
        };
        
        poll();
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

    // === Responsive camera helpers =============================================
    _fitFovForAspect(aspect) {
        // Wider FOV when the canvas is tall (phones/portrait)
        // desktop ~55°, phone ~68°
        const fovDesktop = Math.PI / 3.272;  // ~55°
        const fovPortrait = Math.PI / 2.65;  // ~68°
        const t = Math.min(1, Math.max(0, (1.2 - aspect) / 0.6)); // aspect<1.2 => more portrait
        return fovDesktop * (1 - t) + fovPortrait * t;
    }

    // axesScene is the ellipsoid semi-axes in scene units (what the renderer already uses)
    // spanHint is optional fallback (grid span in scene units)
    _fitCameraToBubble(axesScene, spanHint) {
        const aspect = this.canvas.width / Math.max(1, this.canvas.height);
        const fov = this._fitFovForAspect(aspect);

        // Bounding sphere radius of the ellipsoid (in scene units)
        const R = axesScene ? Math.max(axesScene[0], axesScene[1], axesScene[2]) : (spanHint || 1);
        const baseMargin = 1.22;                        // a hair more breathing room
        const margin = baseMargin * (aspect < 1 ? 1.12 : 1.00);

        // Distance along -Z so bubble fits vertically
        const dist = (margin * R) / Math.tan(fov * 0.5);

        // Higher overhead perspective for better visualization
        const eye = [0, 0.62 * R, -dist];      // match overhead height
        // look further down to clearly show deck plane and interior effects
        const center = [0, -0.12 * R, 0];      // match overhead look-down
        const up = [0, 1, 0];

        // Update projection & view
        this._perspective(this.projMatrix, fov, aspect, 0.1, 200.0);
        this._lookAt(this.viewMatrix, eye, center, up);
        this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
        
        console.log(`📷 Auto-frame: aspect=${aspect.toFixed(2)}, FOV=${(fov*180/Math.PI).toFixed(1)}°, dist=${dist.toFixed(2)}`);
    }

    // --- Bootstrap: set uniforms & fit camera before first frame ---------------
    bootstrap(initialParams = {}) {
        this.currentParams = Object.assign({}, initialParams);
        // Ensure canvas size is correct before we compute FOV/dist
        this._resizeCanvasToDisplaySize();

        // Let updateUniforms compute/remember axesScene & span, then fit
        this.updateUniforms(initialParams);
        
        // sets overhead once
        this._setupCamera();
        // and again after uniforms are in
        this._applyOverheadCamera();

        // Mark so we don't rely on any legacy default camera
        this._bootstrapped = true;
    }

    // --- Convenience method: Set curvature gain from 0-8 slider value --------
    setCurvatureGainDec(slider0to8, boostMax = 40) {
        const T = Math.max(0, Math.min(1, slider0to8 / 8));
        this.updateUniforms({ curvatureGainT: T, curvatureBoostMax: boostMax });
    }

    setCosmeticLevel(level /* 1..10 */) {
        const L = Math.max(1, Math.min(10, level));
        this.updateUniforms({ cosmeticLevel: L });
    }

    // === Natário Diagnostics (viewer-only, does not affect physics) ===
    _computePipelineBetas(U){
        const sectors      = Math.max(1, U.sectorCount || U.sectorStrobing || U.sectors || 1);
        const gammaGeo     = U.gammaGeo || 0;
        const dAa          = (U.deltaAOverA ?? U.qSpoilingFactor ?? 1.0);
        const gammaVdB     = U.gammaVdB || 1.0;

        const betaInst = Math.pow(Math.max(1, gammaGeo), 3) * Math.max(1e-12, dAa) * Math.max(1, gammaVdB);
        const betaAvg  = betaInst * Math.sqrt(Math.max(1e-12, (U.dutyCycle || 0) / sectors));
        const phase    = (U.phaseSplit != null) ? U.phaseSplit :
                        (U.currentMode === 'cruise' ? 0.65 : 0.50);
        const betaNet  = betaAvg * (2*phase - 1);

        return { betaInst, betaAvg, betaNet, sectors, phase };
    }

    _sampleYorkAndEnergy(U){
        const axes  = U.axesClip || [0.40,0.22,0.22];
        const w     = Math.max(1e-4, U.wallWidth || 0.06);   // shell width
        const vShip = U.vShip || 1.0;
        const d     = U.driveDir || [1,0,0];
        const dN    = (()=>{ const t=[d[0]/axes[0], d[1]/axes[1], d[2]/axes[2]];
                            const m=Math.hypot(...t)||1; return [t[0]/m,t[1]/m,t[2]/m]; })();

        let tfMax=-1e9, tfMin=1e9, trMax=-1e9, trMin=1e9, eSum=0, n=0;
        const N=64;
        for(let k=0;k<N;k++){
            const ang=2*Math.PI*k/N;
            const pN=[Math.cos(ang)*1.01, 0.0, Math.sin(ang)*1.01]; // ~on shell
            const rs=Math.hypot(...pN);
            const xs=pN[0]*dN[0]+pN[1]*dN[1]+pN[2]*dN[2];
            const f=Math.exp(-((rs-1)*(rs-1))/(w*w));
            const dfdr=(-2.0*(rs-1)/(w*w))*f;

            const theta = vShip * (xs/rs) * dfdr;               // York-time proxy
            const T00   = - (vShip*vShip) * (dfdr*dfdr) / (rs*rs+1e-6); // energy density proxy

            if(xs>=0){ tfMax=Math.max(tfMax,theta); tfMin=Math.min(tfMin,theta); }
            else     { trMax=Math.max(trMax,theta); trMin=Math.min(trMin,theta); }

            eSum+=T00; n++;
        }
        return { thetaFrontMax:tfMax, thetaFrontMin:tfMin, thetaRearMax:trMax, thetaRearMin:trMin,
                T00avg:(n?eSum/n:0) };
    }

    computeDiagnostics(){
        const U = { ...(this.currentParams||{}), ...(this.uniforms||{}) };
        const P=this._computePipelineBetas(U);
        const Y=this._sampleYorkAndEnergy(U);
        const frontAbs=Math.max(Math.abs(Y.thetaFrontMax),Math.abs(Y.thetaFrontMin));
        const rearAbs =Math.max(Math.abs(Y.thetaRearMax), Math.abs(Y.thetaRearMin));
        // Calculate shear average proxy and reset accumulators
        const shear_avg_proxy = (this._accumShearN ? this._accumShear / this._accumShearN : 0);
        this._accumShear = 0; 
        this._accumShearN = 0;

        return {
            mode: U.currentMode||'hover',
            duty: U.dutyCycle, gammaGeo: U.gammaGeo, Q: (U.Qburst??U.cavityQ),
            dA_over_A:(U.deltaAOverA??U.qSpoilingFactor), gammaVdB:(U.gammaVdB||1),
            sectors:P.sectors, phase:P.phase,
            beta_inst:P.betaInst, beta_avg:P.betaAvg, beta_net:P.betaNet,
            theta_front_max:Y.thetaFrontMax, theta_front_min:Y.thetaFrontMin,
            theta_rear_max:Y.thetaRearMax,   theta_rear_min:Y.thetaRearMin,
            T00_avg_proxy:Y.T00avg, sigma_eff:1/Math.max(1e-4, U.wallWidth||0.06),
            shear_avg_proxy: shear_avg_proxy,
            york_sign_ok: (Y.thetaFrontMin<0 && Y.thetaRearMax>0),
            hover_sym_ok: (Math.abs(P.phase-0.5)<1e-3) && (Math.abs(frontAbs-rearAbs)<0.1*frontAbs+1e-6)
        };
    }

    // Generic uniform setter for display gain and other shader uniforms
    setUniform(name, value) {
        if (!this.gl || !this.gridProgram) return;
        
        const gl = this.gl;
        const location = gl.getUniformLocation(this.gridProgram, name);
        if (location !== null) {
            gl.useProgram(this.gridProgram);
            if (typeof value === 'number') {
                gl.uniform1f(location, value);
            } else if (Array.isArray(value)) {
                if (value.length === 2) gl.uniform2fv(location, value);
                else if (value.length === 3) gl.uniform3fv(location, value);
                else if (value.length === 4) gl.uniform4fv(location, value);
            }
            console.log(`🎛️ setUniform: ${name} = ${value}`);
        }
    }

    setDisplayGain(gain) {
        // Store but respect parity
        this.uniforms.displayGain = gain;

        // If physics parity is active, force unity and stop
        if (this.uniforms?.physicsParityMode) {
            this.uniforms.userGain = 1;
            this._uniformsDirty = true;
            return;
        }

        // Correct scaling: use the PREVIOUS displayGain to get the base
        const prev = this._prevDisplayGain || 1;
        const base = (this.uniforms.userGain ?? 1) / prev; // remove previous scale
        this.uniforms.userGain = base * gain;              // apply new scale

        this._prevDisplayGain = gain;
        this._uniformsDirty = true;
        console.log(`🎛️ setDisplayGain: base=${base.toFixed(3)} prev=${prev} now=${gain}`);
    }

    destroy() {
        // Cancel animation frame
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
        
        // Clean up event listeners
        window.removeEventListener('resize', this._resize);
        // Remove globals we installed
        if (window.__warp_setGainDec === this.__warp_setGainDec) {
            delete window.__warp_setGainDec;
        }
        if (window.__warp_setCosmetic === this.__warp_setCosmetic) {
            delete window.__warp_setCosmetic;
        }
        delete window.setStrobingState;
        
        // Clean up WebGL resources
        const gl = this.gl;
        if (gl) {
            if (this.gridProgram) {
                gl.deleteProgram(this.gridProgram);
                this.gridProgram = null;
            }
            
            if (this.gridVbo) {
                gl.deleteBuffer(this.gridVbo);
                this.gridVbo = null;
            }
        }
        
        // Clear callbacks
        this.onDiagnostics = null;
        
        // Clear vertex arrays
        this.gridVertices = null;
        this.originalGridVertices = null;
        
        console.log("WarpEngine resources cleaned up");
    }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
    console.log("WarpEngine class loaded - OPERATIONAL MODE INTEGRATION", Date.now());
}