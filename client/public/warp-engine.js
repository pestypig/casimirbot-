;(() => {
  // Prevent duplicate loads (HMR, script re-inject, etc.)
  if (globalThis.__WARP_ENGINE_LOADED__) {
    console.warn('[warp-engine] duplicate load detected — skipping body');
    return;
  }
  globalThis.__WARP_ENGINE_LOADED__ = true;

// Optimized 3D spacetime curvature visualization engine
// Authentic Natário warp bubble physics with WebGL rendering


// --- Grid defaults (scientifically scaled for needle hull) ---
if (typeof window.GRID_DEFAULTS === 'undefined') {
  window.GRID_DEFAULTS = {
    spanPadding: (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
      ? 1.45   // a touch more padding on phones so the first fit is perfect
      : 1.35,  // tighter framing for closer view on desktop
    minSpan: 2.6,        // never smaller than this (in clip-space units)
    divisions: 100       // more lines so a larger grid still looks dense
  };
}
const GRID_DEFAULTS = window.GRID_DEFAULTS;

if (typeof window.SCENE_SCALE === 'undefined') {
  window.SCENE_SCALE = (typeof sceneScale === 'number' && isFinite(sceneScale)) ? sceneScale : 1.0;
}
const SCENE_SCALE = window.SCENE_SCALE;

class WarpEngine {
    static getOrCreate(canvas) {
        const existing = canvas.__warpEngine;
        if (existing && !existing._destroyed) return existing;
        return new this(canvas);
    }

    constructor(canvas) {
        // Per-canvas guard: allow multiple engines across different canvases
        if (!window.__WARP_ENGINES) window.__WARP_ENGINES = new WeakSet();
        if (window.__WARP_ENGINES.has(canvas) && !window.__WARP_ENGINE_ALLOW_MULTI) {
            console.warn('Duplicate WarpEngine on the same canvas blocked.');
            throw new Error('WarpEngine already attached to this canvas');
        }
        window.__WARP_ENGINES.add(canvas);
        
        this._destroyed = false;
        this.canvas = canvas;
        canvas.__warpEngine = this;
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
        
        // Handle GL context loss/recovery internally
        canvas.addEventListener('webglcontextlost', (e) => {
            try { e.preventDefault(); } catch {}
            this._setLoaded(false);
            console.warn('[WarpEngine] WebGL context lost');
        }, false);
        canvas.addEventListener('webglcontextrestored', () => {
            console.warn('[WarpEngine] WebGL context restored; rebuilding GL resources');
            try { this._recreateGL(); } catch (e) { console.error(e); }
        }, false);
        
        // Check for non-blocking shader compilation support
        this.parallelShaderExt = this.gl.getExtension('KHR_parallel_shader_compile');
        if (this.parallelShaderExt) {
            console.log("⚡ Non-blocking shader compilation available");
        }
        
        // Loading state management
        this.isLoaded = false;
        this.onLoadingStateChange = null; // callback for loading progress
        this._readyQueue = [];            // callbacks to run once shaders are linked
        
        // Strobing state for sector sync
        this.strobingState = {
            sectorCount: 1,
            currentSector: 0
        };
        
        // Initialize WebGL state
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background for visibility
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
        
        // Current warp parameters (unchanged)
        this.currentParams = {
            dutyCycle: 0.14,
            g_y: 26,
            cavityQ: 1e9,
            sagDepth_nm: 16,
            tsRatio: 4102.74,
            powerAvg_MW: 83.3,
            exoticMass_kg: 1405
        };

        // Display-only controls (safe defaults; no baked ring)
        this.uniforms = {
            vizGain: 1.0,
            vShip: 1.0,
            wallWidth: 0.06,

            // IMPORTANT: don't seed a unit ellipsoid here – we compute it from the hull each update
            axesClip: null,

            driveDir: [1, 0, 0],
            epsilonTilt: 0.0,
            betaTiltVec: [0, -1, 0],
            tiltGain: 0.55,

            // visual system
            cosmeticLevel: 10,
            colorMode: 'theta',
            exposure: 6.0,
            zeroStop: 1e-7,

            // comparison helpers
            physicsParityMode: false,
            lockFraming: true,
            cameraZ: null,
            
            // ridge visualization mode
            ridgeMode: 1  // default to single crest at ρ=1 (clean outline)
        };
        
        // Initialize rendering pipeline
        this._setupCamera();
        this._initializeGrid();              // creates VBO & vertices
        this._compileGridShaders();          // compiles & links program (async-safe)
        
        const strobeHandler = ({ sectorCount, currentSector, split }) => {
          try {
            this.strobingState.sectorCount   = Math.max(1, sectorCount|0);
            this.strobingState.currentSector = Math.max(0, currentSector|0) % this.strobingState.sectorCount;
            this.updateUniforms({
              sectors: this.strobingState.sectorCount,
              // prefer explicit split if provided; otherwise use currentSector
              split: Number.isFinite(split)
                ? Math.max(0, Math.min(this.strobingState.sectorCount - 1, split|0))
                : this.strobingState.currentSector
            });
          } catch(e){ console.warn("WarpEngine strobe error:", e); }
        };
        if (typeof window.__addStrobingListener === 'function') {
          this._offStrobe = window.__addStrobingListener(strobeHandler);
        } else {
          // create a mux once
          const listeners = (window.__strobeListeners = new Set());
          window.setStrobingState = payload => { for (const fn of listeners) { try{ fn(payload); }catch{} } };
          window.__addStrobingListener = fn => { listeners.add(fn); return () => listeners.delete(fn); };
          this._offStrobe = window.__addStrobingListener(strobeHandler);
        }
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
        
        // Namespaced debug hooks for DevTools access
        const id = canvas.id || `warp-${Math.random().toString(36).slice(2,8)}`;
        this.__id = id;
        window.__warp = window.__warp || {};
        window.__warp[id] = this; // e.g. window.__warp['parity-canvas'].setPresetParity()
        
        // Start render loop
        console.log('[WarpEngine] Starting render loop...');
        this._renderLoop();
    }
    
    _recreateGL() {
        // Reacquire context, rebuild buffers & shaders
        this.gl = this.canvas.getContext('webgl2', { alpha:false, antialias:false, powerPreference:'high-performance', desynchronized:true })
            || this.canvas.getContext('webgl', { alpha:false, antialias:false, powerPreference:'high-performance', desynchronized:true });
        if (!this.gl) throw new Error('WebGL not supported after restore');
        this.gridProgram = null;
        this.gridVbo = null;
        this._initializeGrid();        // re-create VBO + compile shaders
        this._setLoaded(false);        // will flip to true in _compileGridShaders on ready
        this._resizeCanvasToDisplaySize();
    }

    // --- central overhead camera (single place to change the pose) ---
    _applyOverheadCamera(opts = {}) {
        const gl = this.gl;
        if (!gl) return;
        const aspect = this.canvas.width / Math.max(1, this.canvas.height);
        const fov = this._fitFovForAspect(aspect);      // existing helper

        // bubble radius in scene units
        const axes = this.uniforms?.axesScene || this._lastAxesScene || [1,1,1];
        const axesMax = Math.max(axes[0], axes[1], axes[2]);
        const hint = Math.max(1, opts.spanHint || 0);
        const R = Math.min(hint, Math.max(axesMax, 1)); // never larger than hull radius
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
        // ---- guards ----
        const spanSafe = Number.isFinite(span) && span > 0 ? span : 1.6;
        const divIn    = Number.isFinite(divisions) && divisions > 0 ? divisions : GRID_DEFAULTS.divisions || 160;

        const baseDiv  = Math.max(divIn, 160);
        const hullAxes = Array.isArray(this.currentParams?.hullAxes) ? this.currentParams.hullAxes : [503.5,132,86.5];
        const wallWidth_m = Number.isFinite(this.currentParams?.wallWidth_m) ? this.currentParams.wallWidth_m : 6.0;

        const minAxis = Math.max(1e-6, Math.min(...hullAxes));
        const span_rho = (3 * wallWidth_m) / minAxis;
        const scale = Math.max(1.0, 12 / (Math.max(1e-6, span_rho) * baseDiv));

        let div = Math.min(320, Math.floor(baseDiv * scale));
        if (!Number.isFinite(div) || div < 1) div = baseDiv;   // final fallback

        divisions = div;
        const verts = [];
        const step = (spanSafe * 2) / divisions;  // Full span width divided by divisions
        const half = spanSafe;  // Half-extent
        
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
        console.log(`Grid coordinate range: X=${-half} to ${half}, Z=${-half} to ${half} (span=${spanSafe*2})`);
        return new Float32Array(verts);
    }

    _compileGridShaders() {
        const gl = this.gl;
        if (!gl) return;
        this._setLoaded(false);              // ← important: we're not ready *yet*
        
        const isWebGL2 = gl.getParameter(gl.VERSION).includes("WebGL 2.0");
        
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
            "uniform vec3 u_sheetColor;\n" +
            "uniform vec3 u_axesScene;\n" +   // Authoritative scene-normalized hull axes
            "uniform vec3 u_axes;\n" +        // Legacy fallback
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
            "uniform bool  u_physicsParityMode;\n" + // parity mode flag
            "uniform float u_displayGain;\n" +   // display gain multiplier
            "uniform float u_vizGain;\n" +       // visual mode seasoning
            "uniform float u_curvatureGainT;\n" + // time blending factor
            "uniform float u_curvatureBoostMax;\n" + // max boost multiplier
            "uniform int   u_colorMode;\n" +    // 0=solid, 1=theta (front/back), 2=shear |σ| proxy
            "uniform int   u_ridgeMode;\n" +    // 0=physics df, 1=single crest at ρ=1
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
            "    // Authoritative axes: use scene-normalized hull or fallback to legacy\n" +
            "    vec3 axes = (u_axesScene.x + u_axesScene.y + u_axesScene.z) > 0.0\n" +
            "      ? u_axesScene\n" +
            "      : u_axes;\n" +
            "    \n" +
            "    // derive effective gains (parity protection)\n" +
            "    float showGain  = u_physicsParityMode ? 1.0 : u_displayGain;\n" +
            "    float vizSeason = u_physicsParityMode ? 1.0 : u_vizGain;\n" +
            "    float tBlend    = u_physicsParityMode ? 0.0 : clamp(u_curvatureGainT, 0.0, 1.0);\n" +
            "    float tBoost    = u_physicsParityMode ? 1.0 : max(1.0, u_curvatureBoostMax);\n" +
            "    \n" +
            "    vec3 pN = v_pos / axes;\n" +
            "    float rs = length(pN) + 1e-6;\n" +
            "    vec3 dN = normalize(u_driveDir / axes);\n" +
            "    float xs = dot(pN, dN);\n" +
            "    float w = max(1e-4, u_wallWidth);\n" +
            "    float delta = (rs - 1.0) / w;\n" +
            "    float f     = exp(-delta*delta);                    // single-lobe pulse at ρ=1\n" +
            "    float dfdrs = (-2.0*(rs - 1.0) / (w*w)) * f;\n" +
            "    float thetaField = (u_ridgeMode == 0)\n" +
            "      ? u_vShip * (xs/rs) * dfdrs          // physics (double-lobe)\n" +
            "      : u_vShip * (xs/rs) * f;             // single crest at ρ=1 (oriented by drive)\n" +
            "    // NEW: shear magnitude proxy (transverse gradient piece)\n" +
            "    float sinphi = sqrt(max(0.0, 1.0 - (xs/rs)*(xs/rs)));\n" +
            "    float shearProxy = (u_ridgeMode == 0)\n" +
            "      ? abs(dfdrs) * sinphi * u_vShip      // physics (double-lobe magnitude)\n" +
            "      : f * sinphi * u_vShip;              // single crest magnitude\n" +
            "    // Parity-protected amplitude scaling\n" +
            "    float amp = u_thetaScale * max(1.0, u_userGain) * showGain * vizSeason;\n" +
            "    amp *= (1.0 + tBlend * (tBoost - 1.0));\n" +
            "    float valTheta  = thetaField * amp;\n" +
            "    float valShear  = shearProxy * amp;\n" +
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
            "    vec3 pN_int = v_pos / axes;\n" +
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
            "uniform vec3 u_sheetColor;\n" +
            "uniform vec3 u_axesScene;\n" +   // Authoritative scene-normalized hull axes
            "uniform vec3 u_axes;\n" +        // Legacy fallback
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
            "uniform bool  u_physicsParityMode;\n" + // parity mode flag
            "uniform float u_displayGain;\n" +   // display gain multiplier
            "uniform float u_vizGain;\n" +       // visual mode seasoning
            "uniform float u_curvatureGainT;\n" + // time blending factor
            "uniform float u_curvatureBoostMax;\n" + // max boost multiplier
            "uniform int   u_colorMode;\n" +    // 0=solid, 1=theta (front/back), 2=shear |σ| proxy
            "uniform int   u_ridgeMode;\n" +    // 0=physics df, 1=single crest at ρ=1
            "uniform int   u_RidgeMode;\n" +    // physics uniforms
            "uniform int   u_PhysicsParityMode;\n" +
            "uniform int   u_SectorCount;\n" +
            "uniform int   u_Split;\n" +
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
            "    // Authoritative axes: use scene-normalized hull or fallback to legacy\n" +
            "    vec3 axes = (u_axesScene.x + u_axesScene.y + u_axesScene.z) > 0.0\n" +
            "      ? u_axesScene\n" +
            "      : u_axes;\n" +
            "    \n" +
            "    // derive effective gains (parity protection)\n" +
            "    float showGain  = u_physicsParityMode ? 1.0 : u_displayGain;\n" +
            "    float vizSeason = u_physicsParityMode ? 1.0 : u_vizGain;\n" +
            "    float tBlend    = u_physicsParityMode ? 0.0 : clamp(u_curvatureGainT, 0.0, 1.0);\n" +
            "    float tBoost    = u_physicsParityMode ? 1.0 : max(1.0, u_curvatureBoostMax);\n" +
            "    \n" +
            "    vec3 pN = v_pos / axes;\n" +
            "    float rs = length(pN) + 1e-6;\n" +
            "    vec3 dN = normalize(u_driveDir / axes);\n" +
            "    float xs = dot(pN, dN);\n" +
            "    float w = max(1e-4, u_wallWidth);\n" +
            "    float delta = (rs - 1.0) / w;\n" +
            "    float f     = exp(-delta*delta);                    // single-lobe pulse at ρ=1\n" +
            "    float dfdrs = (-2.0*(rs - 1.0) / (w*w)) * f;\n" +
            "    float thetaField = (u_ridgeMode == 0)\n" +
            "      ? u_vShip * (xs/rs) * dfdrs          // physics (double-lobe)\n" +
            "      : u_vShip * (xs/rs) * f;             // single crest at ρ=1 (oriented by drive)\n" +
            "    // NEW: shear magnitude proxy (transverse gradient piece)\n" +
            "    float sinphi = sqrt(max(0.0, 1.0 - (xs/rs)*(xs/rs)));\n" +
            "    float shearProxy = (u_ridgeMode == 0)\n" +
            "      ? abs(dfdrs) * sinphi * u_vShip      // physics (double-lobe magnitude)\n" +
            "      : f * sinphi * u_vShip;              // single crest magnitude\n" +
            "    // Parity-protected amplitude scaling\n" +
            "    float amp = u_thetaScale * max(1.0, u_userGain) * showGain * vizSeason;\n" +
            "    amp *= (1.0 + tBlend * (tBoost - 1.0));\n" +
            "    float valTheta  = thetaField * amp;\n" +
            "    float valShear  = shearProxy * amp;\n" +
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
            "    vec3 pN_int = v_pos / axes;\n" +
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
    
    _onProgramLinked(program) {
        const gl = this.gl;
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return false;
        }
        // cache locations & mark ready
        this._cacheGridLocations(program);
        this._warnNoProgramOnce = false;
        this._setLoaded(true);
        return true;
    }

    _cacheGridLocations(program) {
        const gl = this.gl;
        this.gridProgram = program;
        this.gridAttribs = {
            position: gl.getAttribLocation(program, 'a_position'),
        };
        this.gridUniforms = {
            mvpMatrix:  gl.getUniformLocation(program, 'u_mvpMatrix'),
            sheetColor: gl.getUniformLocation(program, 'u_sheetColor'),
            thetaScale: gl.getUniformLocation(program, 'u_thetaScale'),
            ridgeMode:  gl.getUniformLocation(program, 'u_RidgeMode'),
            parity:     gl.getUniformLocation(program, 'u_PhysicsParityMode'),
            sectorCount:gl.getUniformLocation(program, 'u_SectorCount'),
            split:      gl.getUniformLocation(program, 'u_Split'),
        };
    }
    
    _setupUniformLocations() {
        this._cacheGridLocations(this.gridProgram);
    }
    
    _setLoaded(loaded) {
        this.isLoaded = loaded;
        if (this.onLoadingStateChange) {
            this.onLoadingStateChange({ 
                type: loaded ? 'ready' : 'loading',
                message: loaded ? 'Warp engine ready' : 'Initializing...'
            });
        }
        // Flush once-ready callbacks on first successful link
        if (loaded && this._readyQueue && this._readyQueue.length) {
            const q = this._readyQueue.splice(0);
            for (const fn of q) { try { fn(this); } catch(e){ console.warn(e); } }
            try { this._render(); } catch {}
        }
    }

    // Run a callback when the engine is fully ready (shaders linked)
    onceReady(fn) {
        if (this.isLoaded && this.gridProgram) {
            try { fn(this); } catch(e){ console.warn(e); }
        } else {
            this._readyQueue.push(fn);
        }
    }

    // Public: force a geometry rebuild + immediate draw
    forceRedraw() {
        try { this._updateGrid(); this._render(); } catch(e){ console.warn('forceRedraw:', e); }
    }

    // Simple parameter API (so the React side can push values)
    setParameters(next) { this.params = Object.assign(this.params || {}, next); }
    resize(w, h) { this.gl.viewport(0, 0, w, h); }
    start() { 
        if (this._raf) return; 
        const loop = () => { 
            this._raf = requestAnimationFrame(loop); 
            this._render(); 
        }; 
        loop(); 
    }
    stop() { 
        if (this._raf) cancelAnimationFrame(this._raf); 
        this._raf = null; 
    }
    dispose() { 
        const gl = this.gl; 
        if (this.gridVbo) gl.deleteBuffer(this.gridVbo); 
        if (this.gridProgram) gl.deleteProgram(this.gridProgram); 
    }

    // --- Atomic uniform batching to avoid mid-frame bad states ---
    _pendingUpdate = null;
    _flushId = 0;
    
    _enqueueUniforms(patch) {
        // Merge patches until next frame, then apply once
        this._pendingUpdate = Object.assign(this._pendingUpdate || {}, patch || {});
        if (this._flushId) return;
        this._flushId = requestAnimationFrame(() => {
            const p = this._pendingUpdate || {};
            this._pendingUpdate = null;
            this._flushId = 0;
            
            // Debug mode switch
            const isModeSwitch = !!p.currentMode;
            if (isModeSwitch) {
                console.log('[WarpEngine] Mode switch detected:', {
                    mode: p.currentMode,
                    canvas: this.canvas?.id || 'unknown',
                    isLoaded: this.isLoaded,
                    hasProgram: !!this.gridProgram,
                    uniforms: this.uniforms
                });
            }
            
            try { 
                this._applyUniformsNow(p); 
                if (isModeSwitch) {
                    console.log('[WarpEngine] Uniforms applied after mode switch');
                }
            } catch(e) { 
                console.error("[WarpEngine] Uniform flush failed during mode switch:", e); 
            }
            
            // After big bursts ensure camera is sane — fit to hull, not grid
            try {
                this._resizeCanvasToDisplaySize();
                const axesR = (this.uniforms?.axesClip && this.uniforms.axesClip.length === 3)
                    ? Math.max(this.uniforms.axesClip[0], this.uniforms.axesClip[1], this.uniforms.axesClip[2])
                    : (this._lastFittedR || 1);
                const hasCamZ = Number.isFinite(this.currentParams?.cameraZ);
                // _adjustCameraForSpan respects cameraZ if present, otherwise overhead-fit
                hasCamZ ? this._adjustCameraForSpan(axesR)
                        : this._applyOverheadCamera({ spanHint: axesR });
            } catch {}
            
            // Always render immediately so we don't present a black frame
            try { 
                this._render(); 
                if (isModeSwitch) {
                    console.log('[WarpEngine] Render completed after mode switch');
                }
            } catch(e) {
                console.error("[WarpEngine] Render failed after mode switch:", e);
            }
        });
    }
    
    updateUniforms(parameters) {
        if (this._destroyed) return;
        // If program isn't ready yet, queue and let _render() relink shaders
        if (!this.gridProgram || !this.isLoaded) {
            this._pendingUpdate = Object.assign(this._pendingUpdate || {}, parameters || {});
            // Kick the linker if needed; _render() will also call this.
            if (!this.gridProgram && this.gl) try { this._compileGridShaders(); } catch {}
            return;
        }
        this._enqueueUniforms(parameters);
    }
    
    // Keep original update logic but move it into _applyUniformsNow
    _applyUniformsNow(parameters) {
        if (!parameters) return;
        
        // Helper functions
        const N = (x, d=0) => (Number.isFinite(x) ? +x : d);
        const clamp01 = (x) => Math.max(0, Math.min(1, x));

        // Store previous uniforms for comparison
        const prev = { ...(this.uniforms || {}) };
        this.currentParams = { ...this.currentParams, ...parameters };

        // --- Resolve hull + scene scaling ---
        const a = N(parameters?.hull?.a ?? parameters?.hullAxes?.[0] ?? prev?.hullAxes?.[0], 503.5);
        const b = N(parameters?.hull?.b ?? parameters?.hullAxes?.[1] ?? prev?.hullAxes?.[1], 132.0);
        const c = N(parameters?.hull?.c ?? parameters?.hullAxes?.[2] ?? prev?.hullAxes?.[2], 86.5);
        const s = 1 / Math.max(a, b, c, 1e-9);
        const axesScene = [a*s, b*s, c*s];
        const gridSpan = Number.isFinite(parameters?.gridSpan) ? +parameters.gridSpan : Math.max(2.6, Math.max(...axesScene) * 1.35);

        // --- Parity / visualization ---
        const parity = !!parameters?.physicsParityMode;
        const ridgeMode = (parameters?.ridgeMode ?? prev?.ridgeMode ?? 0)|0;
        const CM = { solid:0, theta:1, shear:2 };
        let colorModeRaw = parameters?.colorMode ?? prev?.colorMode ?? 'theta';
        const colorMode  = (typeof colorModeRaw === 'string') ? (CM[colorModeRaw] ?? 1)
                                                              : (colorModeRaw|0);
        const exposure  = N(parameters?.exposure ?? parameters?.viz?.exposure, parity ? 3.5 : (prev?.exposure ?? 6.0));
        const zeroStop  = N(parameters?.zeroStop ?? parameters?.viz?.zeroStop, parity ? 1e-5 : (prev?.zeroStop ?? 1e-7));
        const vizGain   = parity ? 1 : N(parameters?.vizGain, prev?.vizGain ?? 1);
        const curvT     = parity ? 0 : clamp01(N(parameters?.curvatureGainT ?? parameters?.viz?.curvatureGainT, prev?.curvatureGainT ?? 0));
        const curvMax   = parity ? 1 : Math.max(1, N(parameters?.curvatureBoostMax ?? parameters?.viz?.curvatureBoostMax, prev?.curvatureBoostMax ?? 40));
        const cosmetic  = parity ? 1 : N(parameters?.cosmeticLevel ?? parameters?.viz?.cosmeticLevel, prev?.cosmeticLevel ?? 10);

        // camera framing lock
        const lockFraming = parameters?.lockFraming ?? prev?.lockFraming ?? true;
        const cameraZ = (parameters?.cameraZ != null)
          ? +parameters.cameraZ
          : (lockFraming ? (prev?.cameraZ ?? null) : prev?.cameraZ ?? null);

        // --- inbound name normalization ---
        const sectorsIn =
          N(parameters?.sectors ?? parameters?.sectorCount ?? parameters?.sectorStrobing, prev?.sectors ?? 1);

        const splitIn =
          N(parameters?.split ?? parameters?.sectorSplit ?? parameters?.sectorIdx ?? this.strobingState?.currentSector, prev?.split ?? 0);

        const gammaVdBIn =
          N(parameters?.gammaVdB ?? parameters?.gammaVanDenBroeck, prev?.gammaVdB ?? 2.86e5);

        const frFromParams =
          parameters?.dutyEffectiveFR ?? parameters?.dutyShip ?? parameters?.dutyEff;

        // --- build next uniforms without mutating prev ---
        const nextUniforms = {
          ...prev,
          // geometry (authoritative)
          hullAxes: [a, b, c],
          axesClip: axesScene,
          gridSpan,
          // camera/framing
          lockFraming,
          cameraZ,
          // visualization / parity
          physicsParityMode: parity,
          ridgeMode,
          colorMode, exposure, zeroStop,
          vizGain,
          curvatureGainT: curvT,
          curvatureBoostMax: curvMax,
          cosmeticLevel: cosmetic,
          // existing fields
          vShip: parameters.vShip || prev.vShip || 1,
          wallWidth: parameters.wallWidth || prev.wallWidth || 0.06,
          driveDir: parameters.driveDir || prev.driveDir || [1,0,0],
          displayGain: N(parameters.displayGain, prev.displayGain ?? 1.0),
          userGain: N(parameters.userGain, prev.userGain ?? 1.0),
          // tilt
          epsilonTilt: parity ? 0 : N(parameters.epsilonTilt || prev.epsilonTilt || 0),
          betaTiltVec: (Array.isArray(parameters.betaTiltVec) && parameters.betaTiltVec.length===3)
                       ? parameters.betaTiltVec
                       : (prev.betaTiltVec || [0,-1,0]),
          tiltGain: prev.tiltGain ?? 0.55,
          // 🔗 physics chain fields used by CPU warp & shader
          thetaScale: N(parameters.thetaScale, prev.thetaScale ?? 1.0),
          dutyCycle: N(parameters.dutyCycle, prev.dutyCycle ?? 0.14),
          sectors: Math.max(1, Math.floor(sectorsIn)),
          split: Math.max(0, Math.min(Math.max(1, Math.floor(sectorsIn)) - 1, splitIn|0)),
          viewAvg: parameters.viewAvg != null ? !!parameters.viewAvg : (prev.viewAvg ?? true),
          gammaGeo: N(parameters.gammaGeo ?? parameters.g_y, prev.gammaGeo ?? 26),
          deltaAOverA: N(parameters.deltaAOverA ?? parameters.qSpoilingFactor, prev.deltaAOverA ?? 1),
          gammaVdB: gammaVdBIn,
          currentMode: parameters.currentMode ?? prev.currentMode ?? 'hover',
        };

        // --- Compute θ-scale from pipeline if caller didn't pass one ---
        const sectorsEff = Math.max(1, nextUniforms.sectors ?? 1);
        
        // --- FR duty selection (prefer explicit FR) ---
        const dutyEffFR = (frFromParams != null)
          ? Math.max(0, +frFromParams)
          : (nextUniforms.viewAvg ? Math.max(1e-12, (nextUniforms.dutyCycle ?? 0) / nextUniforms.sectors) : 1.0);

        const thetaScaleFromChain =
          Math.pow(Math.max(1, nextUniforms.gammaGeo ?? 1), 3) *
          Math.max(1e-12, nextUniforms.deltaAOverA ?? 1) *
          Math.max(1, nextUniforms.gammaVdB ?? 1) *
          (nextUniforms.viewAvg ? Math.sqrt(dutyEffFR) : 1);

        nextUniforms.thetaScale =
          Number.isFinite(parameters?.thetaScale) ? +parameters.thetaScale : thetaScaleFromChain;

        // decide if the CPU warp needs recompute
        const geoChanged =
          (prev.hullAxes?.[0] !== nextUniforms.hullAxes[0]) ||
          (prev.hullAxes?.[1] !== nextUniforms.hullAxes[1]) ||
          (prev.hullAxes?.[2] !== nextUniforms.hullAxes[2]) ||
          (prev.gridSpan !== nextUniforms.gridSpan);

        const warpKeys = [
          'thetaScale','userGain','displayGain','curvatureGainT','curvatureBoostMax',
          'exposure','zeroStop','physicsParityMode','ridgeMode',
          'driveDir','wallWidth','epsilonTilt','betaTiltVec','tiltGain',
          'dutyCycle','sectors','split','gammaGeo','deltaAOverA','gammaVdB',
          'viewAvg','currentMode'
        ];
        const ampChanged = warpKeys.some(k => JSON.stringify(prev[k]) !== JSON.stringify(nextUniforms[k]));

        this.uniforms = nextUniforms;
        if (geoChanged || ampChanged) {
          this._updateGrid();
        } else if (parameters.currentMode) {
          console.log('[WarpEngine] Mode change applied (no warp needed)');
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
        // keep framing stable so exaggeration remains visible
        const spanBoost =
          (bubbleParams.lockFraming === false)
            ? (1.0 + Math.min(3.0, (Math.log10(userGain) || 0)) * 0.5)
            : 1.0;
        targetSpan *= spanBoost;
        
        // Higher resolution for smoother canonical curvature
        const gridDivisions = 120; // increased from default for smoother profiles
        const driveDir = Array.isArray(this.uniforms?.driveDir) ? this.uniforms.driveDir : [1, 0, 0];
        const gridK = 0.10;                       // mild base (acts as unit scale)
        
        // === Unified "SliceViewer-consistent" amplitude for geometry ===
        // thetaScale = γ^3 · (ΔA/A) · γ_VdB · √(duty/sectors)  (already computed in updateUniforms)
        const thetaScale = Math.max(1e-6, this.uniforms?.thetaScale ?? 1.0);
        // prefer explicit payload, fall back to current uniforms
        const mode = (bubbleParams.currentMode ?? this.uniforms?.currentMode ?? 'hover').toLowerCase();
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
        console.log(`  Grid: span=${targetSpan.toFixed(2)} (hull_max=${hullMaxClip.toFixed(3)} × ${bubbleParams.lockFraming === false ? `boost×${spanBoost.toFixed(2)}` : 'locked'})`);
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

        if (!Number.isFinite(this.uniforms.thetaScale) || this.uniforms.thetaScale <= 0) {
          this.uniforms.thetaScale = betaUsedUniform; // last-resort sync
        }

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

            // Geometry amplitude should be monotonic with the slider and not instantly saturate.
            // A_geom is normalized so that T=0 -> ~0, T=1 -> ~1, regardless of absolute physics magnitude.
            const T_gain       = this.uniforms?.curvatureGainT ?? 0.375;
            const REF_BOOSTMAX = 40.0;                                  // fixed reference for "max slider"
            const boostNow     = 1 + T_gain * ((this.uniforms?.curvatureBoostMax ?? REF_BOOSTMAX) - 1);

            // CPU-side parity protection (match shader's idea but keep it neutral by default)
            const physicsParityMode = this.uniforms?.physicsParityMode ?? false;

            const useSingleRidge = ((this.uniforms?.ridgeMode|0) === 1);

            // 🔑 this is the switch that removes the geometric double ridge
            const baseMag = useSingleRidge
              ? Math.abs(xs_over_rs) * f               // single crest at ρ=1
              : Math.abs(xs_over_rs * df);             // physics double-lobe (current)

            // IMPORTANT: include userGain in the *current* magnitude but NOT in the "max slider" denominator.
            // That way, increasing exaggeration makes geometry visibly grow instead of canceling out.
            const magMax       = Math.log(1.0 + (baseMag * thetaScale * REF_BOOSTMAX) / zeroStop);
            const magNow       = Math.log(1.0 + (baseMag * thetaScale * userGain * boostNow) / zeroStop);

            // Normalized geometry amplitude (monotonic in userGain AND boostNow)
            const A_geom       = Math.pow(Math.min(1.0, magNow / Math.max(1e-12, magMax)), 0.85);

            // For color you already compute with the shader; keep a local A_vis consistent for geometry if desired:
            const A_vis    = Math.min(1.0, magNow / Math.log(1.0 + exposure));

            // Special case: make standby perfectly flat if desired
            let disp;
            if (mode === 'standby') {
                disp = 0; // perfectly flat grid for standby mode
            } else {
                // geometry should follow A_geom (independent of exposure tone-mapping)
                disp = gridK * A_geom * wallWin * front * sgn * gaussian_local;
                
                // No fixed bump; slider controls all visual scaling
                
                // Let the displacement ceiling breathe a bit with gain so big boosts aren't visually identical
                // Let exaggeration raise the ceiling too, but gently (log so it doesn't jump)
                const exgLog  = Math.log10(Math.max(1, userGain));
                // use the actual max from uniforms (fall back to REF_BOOSTMAX)
                const boostMax = (this.uniforms?.curvatureBoostMax ?? REF_BOOSTMAX);
                const maxPush = 0.12
                  + 0.10 * (boostNow / Math.max(1, boostMax))
                  + 0.10 * Math.min(1.0, exgLog / Math.log10(Math.max(10, boostMax)));
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
            this._gridSpan = targetSpan; // keep camera resize hint fresh
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
        if (!this.gridProgram || !this.gridUniforms || !this.gridAttribs) {
            if (!this._warnNoProgramOnce) { console.warn('Grid program not ready yet; waiting for shader link…'); this._warnNoProgramOnce = true; }
            return;
        }

        gl.useProgram(this.gridProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const loc = this.gridAttribs.position;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, this.mvpMatrix);
        gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 0.0, 0.0);

        const u = this.uniforms || {};
        const sectors = Math.max(1, (u.sectors|0) || 1);
        gl.uniform1f(this.gridUniforms.thetaScale,  (Number.isFinite(u.thetaScale) && u.thetaScale>0) ? u.thetaScale : 5.03e3);
        gl.uniform1i(this.gridUniforms.ridgeMode,   Number.isFinite(u.ridgeMode) ? (u.ridgeMode|0) : 1);
        gl.uniform1i(this.gridUniforms.parity,      u.physicsParityMode ? 1 : 0);
        gl.uniform1i(this.gridUniforms.sectorCount, sectors);
        gl.uniform1i(this.gridUniforms.split,       Math.max(0, Math.min(sectors-1, (u.split|0) || 0)));

        const vertexCount = (this.gridVertices?.length || 0) / 3;
        if (vertexCount > 0) gl.drawArrays(gl.LINES, 0, vertexCount);

        gl.disableVertexAttribArray(loc);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _renderLoop() {
        this._raf = requestAnimationFrame(() => this._renderLoop());
        this._render();
    }

    _render() {
        if (this._destroyed) return;
        const gl = this.gl;
        // Guard: if program got torn down, try to rebuild once
        if (!this.gridProgram && gl) {
            try { this._compileGridShaders(); } catch (e) { console.warn('Autorelink failed:', e); }
            return; // wait for shaders to (a)synchronously link
        }
        // Apply any pending updates now that shaders are ready
        if (this._pendingUpdate && this.isLoaded && this.gridProgram) {
            this._enqueueUniforms(this._pendingUpdate);
            this._pendingUpdate = null;
        }
        // Add safety checks to prevent "stuck black" state
        if (!gl || !this.isLoaded || !this.gridProgram || !this.gridUniforms || !this.gridAttribs) {
            console.warn('[WarpEngine] Render blocked - missing requirements:', {
                gl: !!gl,
                isLoaded: this.isLoaded,
                gridProgram: !!this.gridProgram,
                gridUniforms: !!this.gridUniforms,
                gridAttribs: !!this.gridAttribs
            });
            return;
        }
        // Check for lost context and try to restore
        if (gl.isContextLost && gl.isContextLost()) {
            try { gl.getExtension('WEBGL_lose_context')?.restoreContext?.(); } catch {}
            return;
        }
        
        try {
            // Clear the screen
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // Render the spacetime grid
            this._renderGridPoints();
        } catch (err) {
            console.error('[WarpEngine] render error:', err);
        }
        
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
        
        // async path (KHR_parallel_shader_compile)
        if (this.parallelShaderExt && onReady) {
            this._pollShaderCompletion(program, () => {
                if (this._onProgramLinked(program)) onReady(program);
            });
            return program;
        }

        // sync path
        this._onProgramLinked(program);
        if (onReady) try { onReady(program); } catch {}
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
        // only auto-fit if not explicitly locked
        if (!this.uniforms.lockFraming) this._applyOverheadCamera();

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
        // strictly the shader's u_displayGain (used only when parity=false)
        this.updateUniforms({ displayGain: Math.max(1, +gain) });
    }

    setUserGain(gain) {
        // strictly the shader's u_userGain (multiplies both modes)
        this.updateUniforms({ userGain: Math.max(1, +gain) });
    }

    setPresetParity() {
        this.updateUniforms({
            physicsParityMode: true,
            ridgeMode: 0,              // show true physics double-lobe
            curvatureGainT: 0.0,
            curvatureBoostMax: 1.0,
            exposure: 3.5,
            zeroStop: 1e-5,
            vizGain: 1.0,
            userGain: 1.0
        });
    }

    setPresetShowcase() {
        this.updateUniforms({
            physicsParityMode: false,
            ridgeMode: 1,              // clean single crest at ρ=1
            curvatureGainT: 0.6,       // slider blend → boost
            curvatureBoostMax: 40.0,
            exposure: 6.0,
            zeroStop: 1e-7,
            vizGain: 1.0,
            userGain: 4.0
        });
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        // Clean up per-canvas guard
        if (window.__WARP_ENGINES && this.canvas && window.__WARP_ENGINES.delete) {
            window.__WARP_ENGINES.delete(this.canvas);
        }
        
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
        try { this._offStrobe?.(); } catch {}
        
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
    globalThis.WarpEngine = WarpEngine;
    console.log("WarpEngine class loaded - OPERATIONAL MODE INTEGRATION", Date.now());
}

// Stamp a build token so the loader can compare
globalThis.WarpEngine.BUILD = globalThis.__APP_WARP_BUILD || 'dev';
globalThis.__WarpEngineBuild = globalThis.WarpEngine.BUILD;

// ---------------------------------------------------------------------------
// Helper init: one viewer in TRUTH mode, one in COSMETIC mode
// Usage (page-side):
//   __warpInitTruthCosmetic({
//     truth:    '#viewer-truth',     // CSS selector or canvas element (optional; defaults provided)
//     cosmetic: '#viewer-cosmetic',  // CSS selector or canvas element
//     paramsTruth:    { /* optional bootstrap uniforms for truth */ },
//     paramsCosmetic: { /* optional bootstrap uniforms for cosmetic */ }
//   });
//
// If you don't pass selectors, it will look for #viewer-truth and #viewer-cosmetic.
// Can be called after DOMContentLoaded.
// ---------------------------------------------------------------------------
globalThis.__warpInitTruthCosmetic = function initPair(opts = {}) {
  const q = (x) => (typeof x === 'string' ? document.querySelector(x) : x);
  const truthEl    = q(opts.truth)    || document.getElementById('viewer-truth');
  const cosmeticEl = q(opts.cosmetic) || document.getElementById('viewer-cosmetic');
  if (!truthEl && !cosmeticEl) {
    console.warn('[warp-engine] no truth/cosmetic canvases found');
    return {};
  }

  const engines = {};
  // Truth-only viewer (physics-faithful)
  if (truthEl) {
    const e = new WarpEngine(truthEl);
    const id = truthEl.id || 'viewer-truth';
    e.__id = id;
    (globalThis.__warp || (globalThis.__warp = {}))[id] = e;
    e.bootstrap(opts.paramsTruth || {});
    e.onceReady(() => {
      e.setPresetParity();                                  // TRUTH MODE
      // Make the difference obvious at a glance (optional, can remove):
      e.updateUniforms({ colorMode: 2, ridgeMode: 0 });     // shear palette + physics double-lobe
      e.forceRedraw();
      console.log('[warp] truth ready');
    });
    engines.truth = e;
  }

  // Cosmetic/showcase viewer (visually exaggerated)
  if (cosmeticEl) {
    const e = new WarpEngine(cosmeticEl);
    const id = cosmeticEl.id || 'viewer-cosmetic';
    e.__id = id;
    (globalThis.__warp || (globalThis.__warp = {}))[id] = e;
    e.bootstrap(opts.paramsCosmetic || {});
    e.onceReady(() => {
      e.setPresetShowcase();                               // COSMETIC MODE
      e.updateUniforms({ colorMode: 1, ridgeMode: 1 });    // theta diverging + single crest
      e.forceRedraw();
      console.log('[warp] cosmetic ready');
    });
    engines.cosmetic = e;
  }

  // Keep both canvases sized if their containers change
  const ro = new ResizeObserver(() => {
    engines.truth?._resizeCanvasToDisplaySize?.();
    engines.cosmetic?._resizeCanvasToDisplaySize?.();
  });
  truthEl    && ro.observe(truthEl.parentElement || truthEl);
  cosmeticEl && ro.observe(cosmeticEl.parentElement || cosmeticEl);
  return engines;
};
})();