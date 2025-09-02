;(() => {
  // Prevent duplicate loads (HMR, script re-inject, etc.)
  const BUILD = globalThis.__APP_WARP_BUILD || 'dev-2';
  // Only skip if we've *already* executed this exact build.
  if (globalThis.__WARP_ENGINE_LOADED__ === BUILD) {
    console.warn('[warp-engine] duplicate load detected — same build; skipping body');
    return;
  }
  // Mark which build is loaded
  globalThis.__WARP_ENGINE_LOADED__ = BUILD;
  globalThis.WarpEngine = globalThis.WarpEngine || {};
  globalThis.WarpEngine.BUILD = BUILD;
  globalThis.__WarpEngineBuild = BUILD;

// Optimized 3D spacetime curvature visualization engine
// Authentic Natário warp bubble physics with WebGL rendering

// (commit B additions below build on strict engine)


// --- Grid defaults (scientifically scaled for needle hull) ---
if (typeof window.GRID_DEFAULTS === 'undefined') {
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  window.GRID_DEFAULTS = {
    spanPadding: isMobile
      ? 1.55   // extra padding on phones for better visibility and touch interaction
      : 1.35,  // tighter framing for closer view on desktop
    minSpan: isMobile ? 2.8 : 2.6,  // slightly larger minimum on mobile for performance
    divisions: isMobile ? 75 : 100,  // fewer grid lines on mobile for better performance
    mobileOptimized: isMobile,
    touchEnabled: isTouch
  };
}
const GRID_DEFAULTS = window.GRID_DEFAULTS;

if (typeof window.SCENE_SCALE === 'undefined') {
  window.SCENE_SCALE = (typeof sceneScale === 'number' && isFinite(sceneScale)) ? sceneScale : 1.0;
}
const SCENE_SCALE = window.SCENE_SCALE;

// Math helpers and constants
const ID3 = new Float32Array([1,0,0, 0,1,0, 0,0,1]);

// ---- helpers for meters ↔ rho thickness and validation ----------------------
function _aHarmonic(ax, ay, az) {
  const a = +ax || 0, b = +ay || 0, c = +az || 0;
  const d = (a>0?1/a:0) + (b>0?1/b:0) + (c>0?1/c:0);
  return d > 0 ? 3 / d : NaN;
}
function _guessAH(U) {
  const H = U.axesHull, S = U.axesScene;
  if (Array.isArray(H) && H.length>=3) return _aHarmonic(H[0],H[1],H[2]);
  if (Array.isArray(S) && S.length>=3) return _aHarmonic(S[0],S[1],S[2]);
  return NaN;
}
function _req(cond, name, U) {
  if (!cond) {
    const msg = `warp-engine: missing required uniform "${name}"`;
    U.__error = msg;
    throw new Error(msg);
  }
}

// WarpEngine (WebGL runtime)
// ------------------------------------------------------------

class WarpEngine {
    static getOrCreate(canvas) {
        const existing = canvas.__warpEngine;
        if (existing && !existing._destroyed) return existing;
        return new this(canvas);
    }

    constructor(canvas) {
        // Per-canvas guard: allow multiple engines across different canvases
        if (!window.__WARP_ENGINES) window.__WARP_ENGINES = new WeakSet();
        if (window.__WARP_ENGINES.has(canvas) && !window.__WarpEngineAllowMulti) {
            console.warn('Duplicate WarpEngine on the same canvas blocked.');
            throw new Error('WarpEngine already attached to this canvas');
        }
        window.__WARP_ENGINES.add(canvas);

        this.canvas = canvas;
        this.isLoaded = false;
        this._destroyed = false;
        this.debugTag = 'WarpEngine';
        canvas.__warpEngine = this;
        // Create WebGL context with comprehensive error handling
        let gl = null;
        const contextOptions = {
            antialias: false,
            alpha: false,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false
        };

        // Try different context creation strategies
        try {
            // First try WebGL2
            gl = canvas.getContext('webgl2', contextOptions);
            if (gl) {
                console.log('✅ WebGL2 context created successfully');
            }
        } catch (e) {
            console.warn('WebGL2 context creation failed:', e.message);
        }

        if (!gl) {
            try {
                // Fallback to WebGL1
                gl = canvas.getContext('webgl', contextOptions) ||
                     canvas.getContext('experimental-webgl', contextOptions);
                if (gl) {
                    console.log('✅ WebGL1 context created successfully');
                }
            } catch (e) {
                console.warn('WebGL1 context creation failed:', e.message);
            }
        }

        // If still no context, try with different options
        if (!gl) {
            try {
                const relaxedOptions = {
                    antialias: false,
                    alpha: true,
                    depth: false,
                    stencil: false,
                    preserveDrawingBuffer: true,
                    powerPreference: "high-performance",
                    failIfMajorPerformanceCaveat: false
                };
                gl = canvas.getContext('webgl', relaxedOptions) ||
                     canvas.getContext('experimental-webgl', relaxedOptions);
                if (gl) {
                    console.log('✅ WebGL context created with relaxed options');
                }
            } catch (e) {
                console.warn('Relaxed WebGL context creation failed:', e.message);
            }
        }

        this.gl = gl;
        // Enable derivatives so we can do screen-space curvature (WebGL1 needs this; WebGL2 has dFdx/dFdy)
        this._derivExt = this.gl.getExtension('OES_standard_derivatives');

        if (!this.gl) {
            console.error('🚨 WebGL Debug Info:');
            console.error('  - Canvas:', canvas);
            console.error('  - Canvas size:', canvas.width, 'x', canvas.height);
            console.error('  - Canvas.getContext available:', typeof canvas.getContext === 'function');
            console.error('  - Environment:', {
                isHeadless: typeof window === 'undefined',
                isWorker: typeof importScripts === 'function',
                isNode: typeof process !== 'undefined' && process?.versions?.node,
                isReplit: typeof window !== 'undefined' && window.location?.hostname?.includes('replit')
            });

            // Test basic WebGL availability
            try {
                const testCanvas = document.createElement('canvas');
                testCanvas.width = 1;
                testCanvas.height = 1;

                const testGl2 = testCanvas.getContext('webgl2');
                const testGl1 = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');

                console.error('  - WebGL2 available:', !!testGl2);
                console.error('  - WebGL1 available:', !!testGl1);

                if (testGl1 || testGl2) {
                    const testGl = testGl2 || testGl1;
                    console.error('  - WebGL Renderer:', testGl.getParameter(testGl.RENDERER));
                    console.error('  - WebGL Vendor:', testGl.getParameter(testGl.VENDOR));
                    console.error('  - WebGL Version:', testGl.getParameter(testGl.VERSION));
                    console.error('  - Max Texture Size:', testGl.getParameter(testGl.MAX_TEXTURE_SIZE));
                    console.error('  - Max Viewport Dims:', testGl.getParameter(testGl.MAX_VIEWPORT_DIMS));

                    // Test basic shader compilation
                    const vertexShader = testGl.createShader(testGl.VERTEX_SHADER);
                    testGl.shaderSource(vertexShader, 'attribute vec4 a_position; void main() { gl_Position = a_position; }');
                    testGl.compileShader(vertexShader);
                    console.error('  - Vertex shader compilation:', testGl.getShaderParameter(vertexShader, testGl.COMPILE_STATUS));
                }
            } catch (e) {
                console.error('  - WebGL detection error:', e.message);
            }

            console.error('  - System Info:', {
                userAgent: navigator.userAgent.slice(0, 100) + '...',
                hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
                platform: navigator.platform,
                gpu: navigator.gpu ? 'Available' : 'Not available',
                onLine: navigator.onLine
            });

            throw new Error('WebGL not supported in this environment');
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
        this.loadingState = 'idle';
        this.onLoadingStateChange = null; // callback for loading progress
        this._readyQueue = [];            // callbacks to run once shaders are linked
        this.strictPhysics = false; // can be enabled via uniforms

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
        this.program = null;      // normalized public handle
        this.gridUniforms = null;
        this.gridAttribs = null;
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

        // Initialize rendering pipeline
        this._setupCamera();
        this._initializeGrid();              // creates VBO & vertices
        this._compileGridShaders();          // compiles & links program (async-safe)

        const strobeHandler = ({ sectorCount, currentSector, split }) => {
          try {
            this.strobingState.sectorCount   = Math.max(1, sectorCount|0);
            this.strobingState.currentSector = Math.max(0, currentSector|0) % this.strobingState.sectorCount;
            this.updateUniforms({
              sectorCount: this.strobingState.sectorCount, // TOTAL only
              split: Number.isFinite(split)
                ? Math.max(0, Math.min(this.strobingState.sectorCount - 1, split|0))
                : this.strobingState.currentSector
              // ❌ no `sectors` here — leave that to the LC loop (S_live)
            });
          } catch (e) { console.warn("WarpEngine strobe error:", e); }
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

    setDebugTag(tag) {
        this.debugTag = tag || 'WarpEngine';
    }

    destroy() {
        this._destroyed = true;
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
        if (this.gl && this.gl.getExtension) {
            // Clean up WebGL resources
            try {
                const loseContext = this.gl.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    loseContext.loseContext();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }

    _recreateGL() {
        // Reacquire context, rebuild buffers & shaders
        // Mobile-optimized context recreation
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const contextOptions = {
            alpha: false,
            antialias: false,
            powerPreference: isMobile ? 'default' : 'high-performance',
            desynchronized: !isMobile,
            failIfMajorPerformanceCaveat: false
        };

        this.gl = this.canvas.getContext('webgl2', contextOptions) ||
                  this.canvas.getContext('webgl', contextOptions) ||
                  this.canvas.getContext('experimental-webgl', contextOptions);
        if (!this.gl) throw new Error('WebGL not supported after restore');

        // Clear old program/handles so panels don't read stale LINK_STATUS
        this.gridProgram = null;
        this.program = null;
        this.gridUniforms = null;
        this.gridAttribs = null;

        this._initializeGrid();        // re-create VBO + compile shaders
        this._setLoaded(false);        // will flip to true in _compileGridShaders on ready
        this._setLoadingState('loading');
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
            this._perspective(this.projMatrix, this._fitFovForAspect(aspect), aspect, 0.08, 100);
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
        // Use unified wall thickness handling
        const wallWidth_m   = Number.isFinite(this.currentParams?.wallWidth_m) ? this.currentParams.wallWidth_m : undefined;
        const wallWidth_rho = Number.isFinite(this.currentParams?.wallWidth_rho) ? this.currentParams.wallWidth_rho :
                              Number.isFinite(this.uniforms?.wallWidth_rho)  ? this.uniforms.wallWidth_rho    :
                              WALL_RHO_DEFAULT;

        const minAxis = Math.max(1e-3, Math.min(hullAxes[0], hullAxes[1], hullAxes[2]));
        const span_rho = (3 * (wallWidth_m ?? wallWidth_rho * minAxis)) / minAxis;
        const scale = Math.max(1.0, 12 / (Math.max(1e-3, span_rho) * baseDiv));

        let div = Math.min(320, Math.floor(baseDiv * scale));
        if (!Number.isFinite(div) || div < 1) div = baseDiv;   // final fallback

        divisions = div;
        const verts = [];
        const step = (spanSafe * 2) / divisions;  // Full span width divided by divisions
        const half = spanSafe;  // Half-extent

        // Create a slight height variation across the grid for better 3D visualization
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

    // Idempotent uniform injection helper
    _injectUniforms(src) {
        if (!/WARP_UNIFORMS_INCLUDED/.test(src)) {
            const uniformsBlock = `
#ifndef WARP_UNIFORMS_INCLUDED
#define WARP_UNIFORMS_INCLUDED

// Core uniforms (idempotent)
uniform vec3  u_sheetColor;
uniform float u_thetaScale;
uniform int   u_sectorCount;
uniform int   u_split;
uniform vec3  u_axesScene;
uniform vec3  u_axes;
uniform vec3  u_driveDir;
uniform float u_wallWidth;
uniform float u_vShip;
uniform float u_epsTilt;
uniform float u_intWidth;
uniform float u_tiltViz;
uniform float u_exposure;
uniform float u_zeroStop;
uniform float u_userGain;
uniform bool  u_physicsParityMode;
uniform float u_displayGain;
uniform float u_vizGain;
uniform float u_curvatureGainT;
uniform float u_curvatureBoostMax;
uniform int   u_colorMode;
uniform int   u_ridgeMode;

// Purple shift (interior gravity)
uniform float u_epsilonTilt;
uniform vec3  u_betaTiltVec;

// Metric tensor uniforms (covariant & inverse)
uniform mat3 u_metric;
uniform mat3 u_metricInv;
uniform bool u_useMetric;

#endif
`;
            return `${uniformsBlock}\n${src}`;
        }
        return src;
    }

    // Precision + profile-aware shader factory
    _makeShaderSources(gl) {
        const isGL2 = (typeof WebGL2RenderingContext !== 'undefined') && (gl instanceof WebGL2RenderingContext);

        // precision probe for WebGL1 FS
        const hi = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        const med = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
        const wantHighp = !!hi && hi.precision > 0;
        const prec = wantHighp ? 'precision highp float;' : 'precision mediump float;';

        // --- Vertex ---
        const vs2 = `#version 300 es
in vec3 a_position;
uniform mat4 u_mvpMatrix;
out vec3 v_pos;
void main() {
  v_pos = a_position;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}`;

        const vs1 = `
attribute vec3 a_position;
uniform mat4 u_mvpMatrix;
varying vec3 v_pos;
void main() {
  v_pos = a_position;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}`;

        // --- Fragment (shared body with proper type handling) ---
        const fsBody = `
${prec}
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
VARY_DECL vec3 v_pos;
VEC4_DECL frag;

// ───────── Metric helpers (g_ij and its inverse) ─────────
uniform mat3  u_metric;     // g_ij
uniform mat3  u_metricInv;  // g^{ij}
uniform float u_metricOn;   // 0 = Euclidean, 1 = metric-enabled

float dot_g(vec3 a, vec3 b){ return dot(a, u_metric * b); }
float norm_g(vec3 v){ return sqrt(max(1e-12, dot_g(v,v))); }
vec3  normalize_g(vec3 v){ float L = norm_g(v); return v / max(L, 1e-12); }

vec3 diverge(float t) {
  float x = clamp((t+1.0)*0.5, 0.0, 1.0);
  vec3 c1 = vec3(0.15, 0.45, 1.0);
  vec3 c2 = vec3(1.0);
  vec3 c3 = vec3(1.0, 0.45, 0.0);
  return x < 0.5 ? mix(c1,c2, x/0.5) : mix(c2,c3,(x-0.5)/0.5);
}
vec3 seqTealLime(float u) {
  vec3 a = vec3(0.05, 0.30, 0.35);
  vec3 b = vec3(0.00, 1.00, 0.60);
  return mix(a,b, pow(u, 0.8));
}

// Enhanced metric-aware helper functions
float dotG(vec3 a, vec3 b) { return dot(a, u_metric * b); }
float normG(vec3 v) { return sqrt(max(1e-12, dotG(v, v))); }
vec3 normalizeG(vec3 v) { return v / max(1e-12, normG(v)); }

float purpleShiftWeight(vec3 normalWS) {
  // signed tilt along β; clamp to avoid NaNs if ε=0
  vec3 beta_normalized = u_useMetric ? normalizeG(u_betaTiltVec) : normalize(u_betaTiltVec);
  vec3 normal_normalized = u_useMetric ? normalizeG(normalWS) : normalize(normalWS);
  float proj = u_useMetric ? dotG(beta_normalized, normal_normalized) : dot(beta_normalized, normal_normalized);
  return u_epsilonTilt * proj; // small signed number
}
void main() {
  // Safe type conversions to avoid bool/int/float mixing
  bool  isREAL    = u_physicsParityMode;
  bool  isShowcase = !isREAL;
  int   ridgeI    = clamp(u_ridgeMode, 0, 1);
  float ridgeF    = float(ridgeI);
  int   colorI    = clamp(u_colorMode, 0, 4);

  if (colorI == 0) {
    SET_FRAG(vec4(u_sheetColor, 0.85));
    return;
  }

  vec3 axes = (u_axesScene.x + u_axesScene.y + u_axesScene.z) > 0.0 ? u_axesScene : u_axes;

  // Use explicit boolean checks instead of direct float conversion
  float showGain  = isREAL ? 1.0 : u_displayGain;
  float vizSeason = isREAL ? 1.0 : u_vizGain;
  float tBlend    = isREAL ? 0.0 : clamp(u_curvatureGainT, 0.0, 1.0);
  float tBoost    = isREAL ? 1.0 : max(1.0, u_curvatureBoostMax);

  vec3 pN = v_pos / axes;
  float rs = (u_metricOn > 0.5 ? norm_g(pN) : length(pN)) + 1e-6;
  vec3 dN = (u_metricOn > 0.5)
          ? normalize_g(u_metricInv * (u_driveDir / axes))
          : normalize(u_driveDir / axes);
  float xs = (u_metricOn > 0.5) ? dot_g(pN, dN) : dot(pN, dN);
  float w = max(1e-4, u_wallWidth);
  float delta = (rs - 1.0) / w;
  float f     = exp(-delta*delta);
  float dfdrs = (-2.0*(rs - 1.0) / (w*w)) * f;

  // Use ridge mode with explicit int comparison (ridgeI already computed above)
  float thetaField = (ridgeI == 0)
    ? u_vShip * (xs/rs) * dfdrs
    : u_vShip * (xs/rs) * f;

  float sinphi = sqrt(max(0.0, 1.0 - (xs/rs)*(xs/rs)));
  float shearProxy = (ridgeI == 0)
    ? abs(dfdrs) * sinphi * u_vShip
    : f * sinphi * u_vShip;

  // Calculate surface normal for Purple shift (metric-aware)
  vec3 normalWS = u_useMetric ? normalizeG(v_pos) : normalize(v_pos);

  // Metric-aware screen-space curvature (adds ridge accent when enabled)
#ifdef GL_OES_standard_derivatives
  vec3 Nm = normalWS;                        // already metric-aware above
  float kScreen = length(dFdx(Nm)) + length(dFdy(Nm));
#else
  float kScreen = 0.0;
#endif
  float curvVis = clamp(u_curvatureGainT * kScreen, 0.0, 1.0);
  float kval = shearProxy;
  if (ridgeI > 0) {
    // Blend some metric-aware curvature into the shear proxy when ridge overlay is active
    kval = clamp(mix(kval, kval + curvVis, 0.5), 0.0, 1.0);
  }

  // Apply Purple shift modulation to theta field
  float purpleWeight = purpleShiftWeight(normalWS);
  float thetaWithPurple = thetaField * (1.0 + purpleWeight);

  // --- Metric-aware screen-space curvature cue (adds soft ridge accent) ---
#ifdef GL_OES_standard_derivatives
  float curvVis = clamp(u_curvatureGainT * kScreen, 0.0, u_curvatureBoostMax);
  if (ridgeI != 0) {
    // when ridge overlay is on, blend in curvature to the shear proxy
    shearProxy = clamp(shearProxy + 0.5 * curvVis, 0.0, 1.0);
  }
#endif

  float amp = u_thetaScale * max(1.0, u_userGain) * showGain * vizSeason;
  amp *= (1.0 + tBlend * (tBoost - 1.0));
  float valTheta  = thetaWithPurple * amp;
  float valShear  = shearProxy * amp; // Apply amplitude to shear proxy as well

  float magT = log(1.0 + abs(valTheta) / max(u_zeroStop, 1e-18));
  float magS = log(1.0 +      valShear / max(u_zeroStop, 1e-18));
  float norm = log(1.0 + max(1.0, u_exposure));

  float tVis = clamp((valTheta < 0.0 ? -1.0 : 1.0) * (magT / norm), -1.0, 1.0);
  float sVis = clamp( magS / norm, 0.0, 1.0);

  // color mode mux
  vec3 col = (colorI == 1) ? diverge(tVis) : seqTealLime(sVis);
  if (colorI == 6) {
    col = seqTealLime(curvVis);
    SET_FRAG(vec4(col, 1.0)); return;
  }

  // Add subtle Purple shift visualization
  vec3 purple = vec3(0.62, 0.36, 0.85);
  float pv = clamp(10.0 * abs(purpleShiftWeight(normalWS)), 0.0, 0.12);
  col = mix(col, purple, pv);

  // Interior tilt mode (3): purple visualization
  if (colorI == 3) {
    float tilt = abs(u_epsilonTilt);
    vec3 purpleTilt = vec3(0.678, 0.267, 0.678);  // violet-400 equivalent
    vec3 baseColor = mix(vec3(0.1, 0.1, 0.2), purpleTilt,
                        smoothstep(0.0, 1.0, tilt * u_thetaScale));
    col = baseColor;
  }

  // final color selection (add curvature debug slot = 6)
  if (u_colorMode == 6) {
#ifdef GL_OES_standard_derivatives
    vec3 dbg = seqTealLime(clamp(u_curvatureGainT * (length(dFdx(normalWS)) + length(dFdy(normalWS))), 0.0, 1.0));
#else
    vec3 dbg = vec3(0.0);
#endif
    SET_FRAG(vec4(dbg, 1.0));
    return;
  }

  // Debug modes (4+)
  if (colorI >= 4) {
    float debug = abs(thetaField) * u_thetaScale; // Use thetaField for debug based on context
    vec3 debugColor = vec3(debug, 0.0, 1.0 - debug);
    col = debugColor;
  }
  SET_FRAG(vec4(col, 0.9));
}`;

        // Apply idempotent uniform injection
        const fs2 = this._injectUniforms(`#version 300 es
${fsBody.replace('VARY_DECL', 'in').replace('VEC4_DECL frag;', 'out vec4 frag;').replace(/SET_FRAG/g,'frag=')}`);

        const fs1 = this._injectUniforms(`
${fsBody.replace('VARY_DECL', 'varying').replace('VEC4_DECL frag;', '').replace(/SET_FRAG/g,'gl_FragColor=')}`);

        return isGL2 ? { vs: vs2, fs: fs2, profile: 'webgl2', wantHighp }
                     : { vs: vs1, fs: fs1, profile: 'webgl1', wantHighp };
    }

    _compileGridShaders() {
        const gl = this.gl;
        if (!gl) return;
        this._setLoaded(false);              // ← important: we're not ready *yet*

        // Use new precision-aware shader factory
        const src = this._makeShaderSources(this.gl);
        this.shaderProfile = src.profile; // for DAG display/debug

        const onReady = (program) => {
            if (!program) {
                console.error("CRITICAL: Failed to compile grid shaders!");
                return;
            }

            this.gridProgram = program;
            this._setupUniformLocations();
            this._setLoaded(true);
            console.log(`Grid shader program compiled successfully (${src.profile}, highp=${src.wantHighp})`);
        };

        if (this.parallelShaderExt) {
            this.gridProgram = this._createShaderProgram(src.vs, src.fs, onReady);
        } else {
            this.gridProgram = this._createShaderProgram(src.vs, src.fs);
            onReady(this.gridProgram);
        }
    }

    _onProgramLinked(program) {
        const gl = this.gl;
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            console.error(`[${this.debugTag}] Program linking failed:`, error);
            throw new Error(`[${this.debugTag}] Program linking failed: ${error}`);
        } else {
            console.log(`[${this.debugTag}] Program linked successfully`);
        }
        // cache locations & mark ready
        this._cacheGridLocations(program);
        this._warnNoProgramOnce = false;
        return true;
    }

    _cacheGridLocations(program) {
        const gl = this.gl;
        if (!gl || !program) return false;
        this.gridProgram = program;
        this.gridUniforms = {
            // matrices / basics
            mvpMatrix: gl.getUniformLocation(program, 'u_mvpMatrix'),
            sheetColor: gl.getUniformLocation(program, 'u_sheetColor'),

            // core physics chain
            thetaScale: gl.getUniformLocation(program, 'u_thetaScale'),
            colorMode:  gl.getUniformLocation(program, 'u_colorMode'),
            ridgeMode:  gl.getUniformLocation(program, 'u_ridgeMode'),
            parity:     gl.getUniformLocation(program, 'u_physicsParityMode'),

            // sectoring
            sectorCount: gl.getUniformLocation(program, 'u_sectorCount'),
            split:       gl.getUniformLocation(program, 'u_split'),

            // scene & hull
            axesScene: gl.getUniformLocation(program, 'u_axesScene'),
            axes:      gl.getUniformLocation(program, 'u_axes'),

            // drive + wall
            driveDir:  gl.getUniformLocation(program, 'u_driveDir'),
            wallWidth: gl.getUniformLocation(program, 'u_wallWidth'), // Alias for wallWidth_rho
            vShip:     gl.getUniformLocation(program, 'u_vShip'),

            // viz / exposure chain
            exposure:          gl.getUniformLocation(program, 'u_exposure'),
            zeroStop:          gl.getUniformLocation(program, 'u_zeroStop'),
            userGain:          gl.getUniformLocation(program, 'u_userGain'),
            displayGain:       gl.getUniformLocation(program, 'u_displayGain'),
            vizGain:           gl.getUniformLocation(program, 'u_vizGain'),
            curvatureGainT:    gl.getUniformLocation(program, 'u_curvatureGainT'),
            curvatureBoostMax: gl.getUniformLocation(program, 'u_curvatureBoostMax'),

            // interior tilt (safe no-ops if unused)
            intWidth: gl.getUniformLocation(program, 'u_intWidth'),
            epsTilt:  gl.getUniformLocation(program, 'u_epsTilt'),
            tiltViz:  gl.getUniformLocation(program, 'u_tiltViz'),

            // Purple shift uniforms
            epsilonTilt: gl.getUniformLocation(program, 'u_epsilonTilt'),
            betaTiltVec: gl.getUniformLocation(program, 'u_betaTiltVec'),

            // Metric tensor uniforms
            metric: gl.getUniformLocation(program, 'u_metric'),
            metricInv: gl.getUniformLocation(program, 'u_metricInv'),
            useMetric: gl.getUniformLocation(program, 'u_useMetric'),
            metricOn: gl.getUniformLocation(program, 'u_metricOn'),
        };

        // (Optional) quick sanity log once
        if (!this._uniformAuditOnce) {
            this._uniformAuditOnce = true;
            for (const [k,v] of Object.entries(this.gridUniforms)) {
                if (v == null) console.warn(`[${this.debugTag}] Missing uniform location:`, k);
            }
        }
        this.gridAttribs = {
            position: gl.getAttribLocation(program, 'a_position'),
        };
        this._setLoaded(true);
        return true;
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

    // New: canonical loading state for DAG
    // 'idle' | 'compiling' | 'linked' | 'failed' | 'loading'
    _setLoadingState(state) {
        this.loadingState = state;               // ← DAG reads this
        this.isLoaded = (state === 'linked');    // ← keep boolean for legacy paths
        // Keep compatibility with older boolean listeners but also pass richer object if supported
        try {
            this.onLoadingStateChange?.({
              type: state,
              isLoaded: this.isLoaded,
              message:
                state === 'compiling' ? 'Compiling shaders…' :
                state === 'linked'    ? 'Shaders linked'     :
                state === 'failed'    ? 'Link failed'        :
                state === 'loading'   ? 'Initializing…'      :
                'Idle'
            });
        } catch {}
    }

    // Enhanced diagnostics for shader compilation status
    getLinkStatus() {
        if (!this.gl || !this.gridProgram) return 'idle';

        // Check for async compilation support
        if (this.parallelShaderExt) {
            const status = this.gl.getProgramParameter(this.gridProgram, this.gl.COMPLETION_STATUS_KHR);
            if (status === false) return 'compiling';  // Still async compiling - show ⏳
        }

        // Check link status
        const linked = this.gl.getProgramParameter(this.gridProgram, this.gl.LINK_STATUS);
        return linked ? 'linked' : 'failed';
    }

    // Get current shader profile for diagnostics
    getShaderProfile() {
        return this.shaderProfile || 'unknown';
    }

    // Enhanced shader diagnostics for DAG panel
    getShaderDiagnostics() {
        if (!this.gl) return { status: 'no-context', message: 'No WebGL context' };
        if (!this.gridProgram) return { status: 'no-program', message: 'No shader program' };

        const linkStatus = this.getLinkStatus();
        const profile = this.getShaderProfile();

        if (linkStatus === 'compiling') {
            return { status: 'compiling', message: '⏳ compiling shaders…', profile };
        }

        if (linkStatus === 'failed') {
            const info = this.gl.getProgramInfoLog(this.gridProgram);
            return { status: 'failed', message: `Shader link failed: ${info}`, profile };
        }

        if (linkStatus === 'linked') {
            const vertexCount = this.gridVertices?.length / 3 || 0;
            return {
                status: 'linked',
                message: `✅ ${profile} shaders ready (${vertexCount} vertices)`,
                profile,
                vertexCount
            };
        }

        return { status: 'idle', message: 'Shader system idle', profile };
    }

    // === Patch C compatibility: simple driver-verified helpers ===
    isShadersLinked() {
        try {
            return !!(this.gl && this.gridProgram && this.gl.getProgramParameter(this.gridProgram, this.gl.LINK_STATUS));
        } catch { return false; }
    }

    getShaderHealth() {
        const gl = this.gl;
        const prog = this.gridProgram;
        if (!gl) return {ok:false, reason:'no GL', status:this.loadingState, profile:this.getShaderProfile() };
        if (!prog) return {ok:false, reason:'no program', status:this.loadingState, profile:this.getShaderProfile() };
        let ok = false, reason = 'unknown';
        try {
            ok = !!gl.getProgramParameter(prog, gl.LINK_STATUS);
            reason = ok ? 'linked' : (gl.getProgramInfoLog(prog) || 'link failed (no log)').trim();
        } catch (e) {
            reason = `exception: ${e?.message || e}`;
        }
        return { ok, reason, status: this.getLinkStatus(), profile: this.getShaderProfile(), async: !!this.parallelShaderExt };
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

            // Debug mode switch and operational state
            const isModeSwitch = !!p.currentMode;
            const isOperationalChange = !!(p.currentMode || p.physicsParityMode !== undefined || p.ridgeMode !== undefined);

            if (isModeSwitch || isOperationalChange) {
                console.log(`[WarpEngine] Operational change detected:`, {
                    mode: p.currentMode,
                    parity: p.physicsParityMode,
                    ridge: p.ridgeMode,
                    canvas: this.canvas?.id || 'unknown',
                    isLoaded: this.isLoaded,
                    hasProgram: !!this.gridProgram,
                    thetaScale: p.thetaScale
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
        if (!this.gridProgram && this.gl) try { this._compileGridShaders(); } catch {}
        if (!this.gridProgram || !this.isLoaded) {
            this._pendingUpdate = Object.assign(this._pendingUpdate || {}, parameters || {});
            return;
        }
        this._enqueueUniforms(parameters);
    }

    /** Set/enable a 3×3 metric tensor (and its inverse). Pass `on=false` to revert to Euclidean. */
    setMetric(g, gInv=null, on=true) {
        if (!g) {
            this.updateUniforms({
                metric: ID3,
                metricInv: ID3,
                metricOn: 0.0,
                useMetric: false
            });
            return this;
        }
        this.updateUniforms({
            metric: (g instanceof Float32Array) ? g : new Float32Array(g),
            metricInv: (gInv instanceof Float32Array) ? gInv :
                      (gInv ? new Float32Array(gInv) : ID3),
            metricOn: on ? 1.0 : 0.0,
            useMetric: on
        });
        return this;
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

        // add mode detection after prev is defined
        const modeStr = String(parameters?.currentMode ?? prev?.currentMode ?? 'hover').toLowerCase();
        const isStandby = modeStr === 'standby';

        // ---- Unify wall-width ingestion (no hidden defaults in strict) ----------
        let w_rho = (Number.isFinite(parameters.wallWidth) ? +parameters.wallWidth : undefined);
        if (Number.isFinite(parameters.wallWidth_rho)) w_rho = +parameters.wallWidth_rho;
        if (!Number.isFinite(w_rho) && Number.isFinite(parameters.wallWidth_m)) {
          const aH = _guessAH(this.uniforms); // Use existing uniforms for context
          if (Number.isFinite(aH)) w_rho = (+parameters.wallWidth_m) / aH;
        }
        if (this.strictPhysics) _req(Number.isFinite(w_rho), "wallWidth (rho) or wallWidth_m", this.uniforms);
        if (Number.isFinite(w_rho)) this.uniforms.wallWidth = w_rho;

        // ---- Axes setup (strict mode will require these) -----------------------
        if (Array.isArray(parameters.axesHull))  this.uniforms.axesHull  = parameters.axesHull.slice(0,3);
        if (Array.isArray(parameters.axesScene)) this.uniforms.axesScene = parameters.axesScene.slice(0,3);

        // ---- Accept strict mode toggle up front --------------------------------
        if (typeof parameters.strictPhysics === "boolean") this.strictPhysics = !!parameters.strictPhysics;

        // ---- Axes setup (strict mode will require these) -----------------------
        if (Array.isArray(parameters.axesHull))  this.uniforms.axesHull  = parameters.axesHull.slice(0,3);
        if (Array.isArray(parameters.axesScene)) this.uniforms.axesScene = parameters.axesScene.slice(0,3);

        // ---- Metric uniforms (optional for now) --------------------------------
        if (typeof parameters.metricMode === "boolean") this.uniforms.metricMode = !!parameters.metricMode;
        if (Array.isArray(parameters.gSpatialDiag)) this.uniforms.gSpatialDiag = parameters.gSpatialDiag.slice(0,3).map(Number);

        // ---- Physics uniforms (no defaults when strict) -------------------------
        if (Number.isFinite(parameters.gammaGeo))           this.uniforms.gammaGeo = +parameters.gammaGeo;
        if (Number.isFinite(parameters.gammaVanDenBroeck))  this.uniforms.gammaVanDenBroeck = +parameters.gammaVanDenBroeck;
        if (Number.isFinite(parameters.qSpoilingFactor))    this.uniforms.deltaAOverA = +parameters.qSpoilingFactor;
        if (Number.isFinite(parameters.deltaAOverA))        this.uniforms.deltaAOverA = +parameters.deltaAOverA;
        if (Number.isFinite(parameters.dutyEffectiveFR))    this.uniforms.dutyEffectiveFR = +parameters.dutyEffectiveFR;
        if (Number.isFinite(parameters.sectorCount))        this.uniforms.sectorCount = parameters.sectorCount|0;
        if (Number.isFinite(parameters.sectorStrobing))     this.uniforms.sectorStrobing = parameters.sectorStrobing|0;
        if (typeof parameters.lockFraming === "boolean")    this.uniforms.lockFraming = !!parameters.lockFraming;
        if (Number.isFinite(parameters.thetaScale))         this.uniforms.thetaScale = +parameters.thetaScale;

        if (this.strictPhysics) {
          this._req(Array.isArray(this.uniforms.axesHull) && this.uniforms.axesHull.length===3, "axesHull[a,b,c]", this.uniforms);
          this._req(Number.isFinite(this.uniforms.wallWidth), "wallWidth (rho)", this.uniforms);
          this._req(Number.isFinite(this.uniforms.gammaGeo), "gammaGeo", this.uniforms);
          this._req(Number.isFinite(this.uniforms.deltaAOverA), "qSpoilingFactor/deltaAOverA", this.uniforms);
          this._req(Number.isFinite(this.uniforms.gammaVanDenBroeck), "gammaVanDenBroeck", this.uniforms);
          this._req(Number.isFinite(this.uniforms.sectorCount) && this.uniforms.sectorCount>=1, "sectorCount", this.uniforms);
          this._req(Number.isFinite(this.uniforms.sectorStrobing) && this.uniforms.sectorStrobing>=1, "sectorStrobing", this.uniforms);
          this._req(Number.isFinite(this.uniforms.dutyEffectiveFR), "dutyEffectiveFR", this.uniforms);
          // Either authoritative theta OR all factors to recompute are present
          if (!Number.isFinite(this.uniforms.thetaScale)) {
            this._req(true, "thetaScale (pipeline) — required in strict mode for now", this.uniforms);
          }
          // Lock framing while validating strict 1:1
          this.uniforms.lockFraming = true;
        }

        // --- Axes setup (derive scene-normalized if hull-only provided) -----------
        if (!Array.isArray(this.uniforms.axesScene) && Array.isArray(this.uniforms.axesHull)) {
          const a = this.uniforms.axesHull;
          const aMax = Math.max(1e-6, a[0], a[1], a[2]);
          this.uniforms.axesScene = [a[0]/aMax, a[1]/aMax, a[2]/aMax];
        }

        // In strict mode: no span/userGain seasoning
        if (this.strictPhysics) {
          this.uniforms.userGain = 1.0;
          this.uniforms.displayGain = 1.0;
        }

        // --- Parse other parameters (mostly visual/cosmetic) --------------------
        const P = parameters; // alias for brevity
        const U = this.uniforms; // alias for brevity
        const isREAL = U.physicsParityMode;
        const zeroStandby = isREAL && isStandby;

        // Hull axes (also used for grid generation)
        const hullAxesMeters = P.hullAxesMeters ?? P.hull?.a ?? prev?.hullAxesMeters;
        if (hullAxesMeters) {
            const a = hullAxesMeters[0] ?? prev?.hullAxesMeters?.[0] ?? 503.5;
            const b = hullAxesMeters[1] ?? prev?.hullAxesMeters?.[1] ?? 132.0;
            const c = hullAxesMeters[2] ?? prev?.hullAxesMeters?.[2] ?? 86.5;
            U.hullAxes = [a, b, c];
        }

        // Wall thickness (meters)
        const wallWidthMeters = P.wallWidth_m ?? P.hull?.wallWidthMeters ?? prev?.wallWidth_m;
        if (Number.isFinite(wallWidthMeters)) U.wallWidth_m = +wallWidthMeters;

        // Hull scaling and clipping axes (used for camera fit)
        const axesScene = P.axesScene ?? U.axesScene; // Prefer explicit scene axes
        if (!Array.isArray(axesScene) && Array.isArray(U.hullAxes)) {
            const aH = _guessAH(U); // Harmonic mean in meters
            const hullMax = Math.max(1e-6, U.hullAxes[0], U.hullAxes[1], U.hullAxes[2]);
            const clipScale = Math.max(1e-9, hullMax, aH || 1); // use largest dimension OR harmonic mean
            U.axesScene = U.hullAxes.map(x => x / clipScale);
        } else if (Array.isArray(axesScene)) {
            U.axesScene = axesScene.slice(0,3); // Ensure it's a clean copy
        }

        // Grid span for framing (derived or explicit)
        let gridSpan = P.gridSpan ?? prev?.gridSpan;
        if (!Number.isFinite(gridSpan) && U.axesScene) {
            const hullMaxClip = Math.max(1e-6, U.axesScene[0], U.axesScene[1], U.axesScene[2]);
            const spanPadding = P.gridSpanPadding ?? GRID_DEFAULTS.spanPadding;
            gridSpan = Math.max(GRID_DEFAULTS.minSpan, hullMaxClip * spanPadding);
        }
        if (Number.isFinite(gridSpan)) U.gridSpan = gridSpan;

        // --- Camera explicit Z override -----------------------------------------
        // Lock framing if strictly physics or explicitly requested
        const lockFraming = P.lockFraming ?? U.lockFraming ?? this.strictPhysics;
        if (P.cameraZ != null) U.cameraZ = +P.cameraZ;
        else if (!lockFraming && prev?.cameraZ != null) U.cameraZ = prev.cameraZ; // maintain if unlocked

        // Visualization parameters
        const exposure       = N(P.exposure, prev?.exposure ?? (isREAL ? 3.5 : 6.0));
        const zeroStop       = N(P.zeroStop, prev?.zeroStop ?? (isREAL ? 1e-5 : 1e-7));
        const vizGain        = isREAL ? 1.0 : N(P.vizGain, prev?.vizGain ?? 1.0);
        const curvatureGainT = isREAL ? 0.0 : clamp01(N(P.curvatureGainT, prev?.curvatureGainT ?? 0.0));
        const curvatureBoostMax = isREAL ? 1.0 : Math.max(1.0, N(P.curvatureBoostMax, prev?.curvatureBoostMax ?? 40.0));
        const cosmeticLevel  = isREAL ? 1.0 : N(P.cosmeticLevel ?? P.viz?.cosmeticLevel, prev?.cosmeticLevel ?? 10.0);

        // Apply overrides
        U.exposure = exposure;
        U.zeroStop = zeroStop;
        U.vizGain = vizGain;
        U.curvatureGainT = curvatureGainT;
        U.curvatureBoostMax = curvatureBoostMax;
        U.cosmeticLevel = cosmeticLevel; // Affects geometry gain/boost

        // --- Physics chain parameters -------------------------------------------
        const sectorsTotal = Math.max(1, (P.sectorCount ?? U.sectorCount ?? this.strobingState?.sectorCount ?? 400)|0);
        const sectorsLive  = Math.max(1, (P.sectors ?? U.sectors ?? this.strobingState?.currentSector ?? 1)|0);
        const dutyCycle    = N(P.dutyCycle, U.dutyCycle ?? 0.01);

        // Use provided `dutyEffectiveFR` if available, otherwise compute from dutyCycle and sectors
        let dutyEffFR = Number.isFinite(P.dutyEffectiveFR) ? +P.dutyEffectiveFR
                      : (isREAL && !zeroStandby)
                        ? dutyCycle * (sectorsLive / sectorsTotal)
                        : dutyCycle;
        dutyEffFR = Math.max(1e-12, Math.min(1.0, dutyEffFR)); // Clamp to [0,1]

        const gammaGeo = N(P.gammaGeo ?? P.g_y, U.gammaGeo ?? 26);
        const deltaAOverA = N(P.deltaAOverA ?? P.qSpoilingFactor, U.deltaAOverA ?? 1.0);
        const gammaVdB = N(P.gammaVanDenBroeck, U.gammaVanDenBroeck ?? 2.86e5);

        // Calculate canonical thetaScale for REAL mode, use provided for SHOW
        let thetaScaleFinal;
        if (isREAL) {
            if (zeroStandby) {
                thetaScaleFinal = 0; // Flat in standby
            } else {
                const A_geo = Math.pow(Math.max(1, gammaGeo), 3);
                const beta_inst = A_geo * Math.max(1e-12, deltaAOverA) * Math.max(1, gammaVdB);
                const beta_avg = beta_inst * Math.sqrt(Math.max(1e-12, dutyEffFR));
                // viewAvg determines if we use average beta or instantaneous
                const viewAvg = (P.viewAvg ?? U.viewAvg ?? true);
                thetaScaleFinal = viewAvg ? beta_avg : beta_inst;
            }
        } else {
            // SHOW mode: use provided scale, or default to a reasonable value
            thetaScaleFinal = Number.isFinite(P.thetaScale) ? +P.thetaScale : (thetaScaleFinal || 1.0);
        }

        // Re-apply computed values to uniforms
        U.sectors = sectorsLive;
        U.sectorCount = sectorsTotal;
        U.dutyCycle = dutyCycle;
        U.dutyEffectiveFR = dutyEffFR; // Store the effective duty factor used
        U.gammaGeo = gammaGeo;
        U.deltaAOverA = deltaAOverA;
        U.gammaVanDenBroeck = gammaVdB;
        U.thetaScale = thetaScaleFinal;

        // Store actual computed theta for diagnostics
        this.uniforms.thetaScale_actual = thetaScaleFinal;

        // ---- Metric-diagnostic theta (derived) ----------------------------------
        // If metricMode + gSpatialDiag present, derive a simple scalar proxy for audit:
        // theta_metric ≈ sqrt( max( |g_xx-1|, |g_yy-1|, |g_zz-1| ) )
        if (U.metricMode && Array.isArray(U.gSpatialDiag) && U.gSpatialDiag.length>=3) {
          const gx = +U.gSpatialDiag[0] || 1, gy = +U.gSpatialDiag[1] || 1, gz = +U.gSpatialDiag[2] || 1;
          const dx = Math.abs(gx-1), dy = Math.abs(gy-1), dz = Math.abs(gz-1);
          const dev = Math.max(dx,dy,dz);
          U.thetaScale_metric = Math.sqrt(Math.max(0, dev));
        } else {
          U.thetaScale_metric = undefined;
        }

        // Apply mode specific overrides to visual parameters
        if (isREAL) {
            // REAL physics: use defaults, clamp exaggeration
            U.ridgeMode = 0; // Physics double-lobe
            U.curvatureGainT = 0.0;
            U.curvatureBoostMax = 1.0;
            U.userGain = 1.0;
        } else {
            // SHOW mode: allow visual seasoning
            U.ridgeMode = P.ridgeMode ?? U.ridgeMode ?? 1; // Show single crest
            U.curvatureGainT = curvatureGainT;
            U.curvatureBoostMax = curvatureBoostMax;
            U.userGain = N(P.userGain, U.userGain ?? 1.0); // Apply user gain for visual scaling
        }

        // --- Set drive direction and interior tilt ----
        const driveDir = P.driveDir ?? U.driveDir ?? [1,0,0];
        U.driveDir = Array.isArray(driveDir) ? driveDir.slice(0,3) : [1,0,0];
        const epsilonTilt = N(P.epsilonTilt, U.epsilonTilt ?? 0.0);
        const betaTiltVec = P.betaTiltVec ?? U.betaTiltVec ?? [0,-1,0];
        const tiltGain = N(P.tiltGain, U.tiltGain ?? 0.55);
        U.epsilonTilt = epsilonTilt;
        U.betaTiltVec = Array.isArray(betaTiltVec) ? betaTiltVec.slice(0,3) : [0,-1,0];
        U.tiltGain = tiltGain;

        // --- Set interior parameters ----
        const intWidth = N(P.intWidth, U.intWidth ?? 0.25);
        U.intWidth = intWidth;

        // --- Set color mode ----
        let colorModeRaw = P.colorMode ?? U.colorMode ?? 'theta';
        const CM = { solid:0, theta:1, shear:2, interiorTilt:3, debug:4, custom:5, curvature:6 };
        U.colorMode = (typeof colorModeRaw === 'string') ? (CM[colorModeRaw.toLowerCase()] ?? 1) : (colorModeRaw|0);

        // --- Metric tensor uniforms ----
        const metric = P.metric ?? U.metric ?? ID3;
        const metricInv = P.metricInv ?? U.metricInv ?? ID3;
        const useMetric = P.useMetric ?? U.useMetric ?? false;
        const metricOn = P.metricOn ?? (useMetric ? 1.0 : 0.0);
        U.metric = metric;
        U.metricInv = metricInv;
        U.useMetric = useMetric;
        U.metricOn = metricOn;

        // --- Trigger grid rebuild if geometry parameters changed ----
        const geoChanged =
            (prev?.hullAxes?.[0] !== U.hullAxes?.[0]) || (prev?.hullAxes?.[1] !== U.hullAxes?.[1]) || (prev?.hullAxes?.[2] !== U.hullAxes?.[2]) ||
            (prev?.wallWidth_m !== U.wallWidth_m) || (prev?.wallWidth_rho !== U.wallWidth_rho) ||
            (prev?.gridSpan !== U.gridSpan);

        // Also recompute if amplitude changed, as it affects geometry
        const ampChanged =
            (prev?.thetaScale !== U.thetaScale) || (prev?.userGain !== U.userGain) ||
            (prev?.cosmeticLevel !== U.cosmeticLevel) || (prev?.curvatureGainT !== U.curvatureGainT) ||
            (prev?.curvatureBoostMax !== U.curvatureBoostMax) || (prev?.physicsParityMode !== U.physicsParityMode) ||
            (prev?.ridgeMode !== U.ridgeMode);

        if (geoChanged || ampChanged) {
            this._updateGrid();
        } else if (parameters.currentMode || P.lockFraming || P.cameraZ) {
            // Just update camera if mode/framing/Z changed without geometry/amplitude
            this._adjustCameraForSpan(U.gridSpan || 1.0);
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
            curvatureAmplifier: 1.0,   // ← neutralized for geometry
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
        this._warpGridVertices(this.gridVertices, this.currentParams);

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

    _restoreOriginalGrid() {
        if (!this.originalGridVertices || !this.gridVertices || !this.gl || !this.gridVbo) return;
        this.gridVertices.set(this.originalGridVertices);
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // Authentic Natário spacetime curvature implementation
    _warpGridVertices(vtx, bubbleParams) {
        // Get hull axes from uniforms or use needle hull defaults (in meters)
        const hullAxes = (this.uniforms?.hullAxes || bubbleParams.hullAxes) || [503.5,132,86.5]; // semi-axes [a,b,c] in meters
        // Unified wall thickness handling - use either meters or ρ-units
        const a_m = hullAxes[0], b_m = hullAxes[1], c_m = hullAxes[2];
        const aH = _guessAH(this.uniforms) || 1; // harmonic mean, meters
        const wallWidth_rho = this.uniforms?.wallWidth_rho ?? this.uniforms?.wallWidth ?? WALL_RHO_DEFAULT;
        const wallWidth_m   = this.uniforms?.wallWidth_m ?? wallWidth_rho * aH; // meters

        // Prefer server-provided clip axes; otherwise scale by the *true* long semi-axis.
        const axesScene =
          (this.uniforms?.axesScene && this.uniforms.axesScene.length === 3)
            ? this.uniforms.axesScene
            : (() => {
                const aMax = Math.max(a_m, b_m, c_m);
                const s    = 1.0 / Math.max(aMax, 1e-9);
                return [a_m * s, b_m * s, c_m * s];
              })();

        // Use the computed wallWidth_rho from above

        // Compute a grid span that comfortably contains the whole bubble
        const hullMaxClip = Math.max(axesScene[0], axesScene[1], axesScene[2]); // half-extent in clip space
        const spanPadding = bubbleParams.gridSpanPadding ?? GRID_DEFAULTS.spanPadding;
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
        const driveDir = Array.isArray(this.uniforms?.driveDir) ? this.uniforms.driveDir : [1,0,0];
        const gridK = 0.10;                       // mild base (acts as unit scale)

        // === UNIFIED "SliceViewer-consistent" AMPLITUDE for geometry ===
        // thetaScale = γ^3 · (ΔA/A) · γ_VdB · √(duty/sectors) (already computed in updateUniforms)
        const thetaScale = Math.max(1e-6, this.uniforms?.thetaScale ?? 1.0);
        // prefer explicit payload, fall back to current uniforms
        const mode = (bubbleParams.currentMode ?? this.uniforms?.currentMode ?? 'hover').toLowerCase();
        const A_base = thetaScale;          // physics, averaged if viewAvg was true upstream
        const boost = userGain;             // 1..max (same number sent to shader as u_userGain)
        // Small per-mode seasoning only, so we don't hide the physics
        const modeScale =
            mode === 'standby'   ? 0.95 :
            mode === 'cruise'    ? 1.00 :
            mode === 'hover'     ? 1.05 :
            mode === 'emergency' ? 1.08 : 1.00;
        // Enhanced amplitude compression for decades-scale gains: compress *after* boosting
        const A_vis    = Math.min(1.0, Math.log10(1.0 + A_base * boost * modeScale));

        console.log(`🔗 SCIENTIFIC ELLIPSOIDAL NATÁRIO SHELL:`);
        console.log(`  Hull: [${a_m.toFixed(1)}, ${b_m.toFixed(1)}, ${c_m.toFixed(1)}] m → scene: [${axesScene.map(x => x.toFixed(3)).join(', ')}]`);
        console.log(`  Wall: ${wallWidth_m.toFixed(3)} m → ρ-space: ${wallWidth_rho.toFixed(4)} (aH=${aH.toFixed(1)})`);
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

        // Calculate canonical thetaScale for REAL mode, use provided for SHOW
        const A_geoUniform = gammaGeoUniform * gammaGeoUniform * gammaGeoUniform; // γ_geo^3 amplification
        const sectorsTotalU = Math.max(1, (this.uniforms?.sectorCount|0) || sectorsUniform);
        const dutyFR_u = dutyCycleUniform * (sectorsUniform / sectorsTotalU);
        const effDutyUniform = viewAvgUniform ? Math.max(1e-12, dutyFR_u) : 1.0;

        const betaInstUniform = A_geoUniform * gammaVdBUniform * qSpoilUniform; // ← match thetaScale chain
        const betaAvgUniform  = betaInstUniform * Math.sqrt(effDutyUniform);
        const betaUsedUniform = viewAvgUniform ? betaAvgUniform : betaInstUniform;

        if (!Number.isFinite(this.uniforms.thetaScale) || this.uniforms.thetaScale <= 0) {
          this.uniforms.thetaScale = betaUsedUniform; // last-resort sync
        }

        // Debug per mode (once per 60 frames) - cosmetic controls all exaggeration now
        if ((this._dbgTick = (this._dbgTick||0)+1) % 60 === 0) {
            console.log("🧪 warp-mode", {
                mode: this.uniforms?.currentMode, duty: dutyCycleUniform, sectors: sectorsUniform,
                split: splitUniform, viewAvg: viewAvgUniform, A_geo: A_geoUniform, effDuty: effDutyUniform,
                betaInst: betaInstUniform.toExponential(2), betaAvg: betaAvgUniform.toExponential(2),
                betaVis: betaUsedUniform.toExponential(2), // Show the base physics value
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
            // Use ρ-units directly. If meters were provided, we already converted to wallWidth_rho above.
            const w_rho_local = Math.max(1e-4, wallWidth_rho);

            // ---- Existing physics chain (do not change) ----
            const A_geoUniform = gammaGeoUniform * gammaGeoUniform * gammaGeoUniform; // γ_geo^3 amplification
            const sectorsTotalU = Math.max(1, (this.uniforms?.sectorCount|0) || sectorsUniform);
            const dutyFR_u = dutyCycleUniform * (sectorsUniform / sectorsTotalU);
            const effDutyUniform = viewAvgUniform ? Math.max(1e-12, dutyFR_u) : 1.0;

            const betaInstUniform = A_geoUniform * gammaVdBUniform * qSpoilUniform; // ← match thetaScale chain
            const betaAvgUniform  = betaInstUniform * Math.sqrt(effDutyUniform);
            const betaUsedUniform = viewAvgUniform ? betaAvgUniform : betaInstUniform;

            // Final viz field (no decades boost - cosmetic slider controls all exaggeration)
            const betaVisUniform = betaUsedUniform;

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

            // IMPORTANT: include userGain in the *current* magnitude but NOT in the "max slider" denominator.
            // That way, increasing exaggeration makes geometry visibly grow instead of canceling out.
            const magMax       = Math.log(1.0 + (thetaScale * REF_BOOSTMAX) / zeroStop);
            const magNow       = Math.log(1.0 + (thetaScale * userGain * boostNow) / zeroStop);

            // Normalized geometry amplitude (monotonic in userGain AND boostNow)
            const A_geom       = Math.pow(Math.min(1.0, magNow / Math.max(1e-12, magMax)), 0.85);

            // For color you already compute with the shader; keep a local A_vis consistent for geometry if desired:
            const A_vis    = Math.min(1.0, magNow / Math.log(1.0 + exposure));

            // Special case: make REAL standby perfectly flat if desired
            let disp;
            if (mode === 'standby' && this.strictPhysics && this.uniforms?.physicsParityMode) {
                disp = 0; // perfectly flat grid for REAL standby mode
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
            // CPU interior window width uses wallWidth_rho (unified)
            const w_int = Number.isFinite(this.uniforms?.intWidth)
              ? Math.max(0.002, +this.uniforms.intWidth)
              : Math.max(3.0 * (this.uniforms?.wallWidth_rho ?? WALL_RHO_DEFAULT), 0.02);
            // --- end interior gravity -----
            // Project normal onto "down" and keep sign stable
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
        this.uniforms.wallWidth = wallWidth_rho; // Alias for shader
        this.uniforms.hullDimensions = { a: a_m, b: b_m, c: c_m, aH, SCENE_SCALE, wallWidth_m };

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

            console.log(`✓ Grid regenerated with span=${targetSpan.toFixed(2)} for hull [${a_m}×${b_m}×${c_m}]m`);

            // Adjust camera framing for larger grids
            this._adjustCameraForSpan(targetSpan);
        }
    }

    _renderGridPoints() {
        const gl = this.gl;
        if (!this.gridProgram || !this.gridUniforms || !this.gridAttribs) {
            if (!this._warnNoProgramOnce) {
                console.warn(`[${this.debugTag}] Grid program not ready yet; waiting for shader link…`);
                this._warnNoProgramOnce = true;
            }
            return;
        }

        // Show diagnostics if strict is missing inputs
        if (this.strictPhysics && this.uniforms?.__error) {
          gl.clearColor(0.2, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          return;
        }

        gl.useProgram(this.gridProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const loc = this.gridAttribs.position;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);

        const U = this.uniforms || {};

        // --- names / helpers
        const I = (x, d)=> Number.isFinite(x) ? (x|0) : d;
        const F = (x, d)=> Number.isFinite(x) ? +x : d;
        const V3 = (arr, d=[0,0,0]) => (Array.isArray(arr) && arr.length===3 ? arr : d);

        // --- colors / matrices you already set:
        gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix, false, this.mvpMatrix);
        gl.uniform3f(this.gridUniforms.sheetColor, 1.0, 0.0, 0.0);

        // --- modes / sectoring (use lowercase names in the shader)
        if (this.gridUniforms.colorMode)  gl.uniform1i(this.gridUniforms.colorMode,  I(U.colorMode, 1));
        if (this.gridUniforms.ridgeMode)  gl.uniform1i(this.gridUniforms.ridgeMode,  I(U.ridgeMode, 1));
        if (this.gridUniforms.parity)     gl.uniform1i(this.gridUniforms.parity,     U.physicsParityMode ? 1 : 0);
        const sLive  = Math.max(1, (U.sectors|0)      || 1);
        const sTotal = Math.max(1, (U.sectorCount|0)  || sLive);
        if (this.gridUniforms.sectorCount)gl.uniform1i(this.gridUniforms.sectorCount, sTotal);
        if (this.gridUniforms.split)      gl.uniform1i(this.gridUniforms.split,      Math.max(0, Math.min(sLive - 1, I(U.split,0))));

        // --- axes (scene-normalized and legacy hull)
        const axesScene = U.axesClip || U.axesScene || [1,1,1];
        const hullAxes  = U.hullAxes || [503.5, 132.0, 86.5];
        if (this.gridUniforms.axesScene) gl.uniform3fv(this.gridUniforms.axesScene, new Float32Array(axesScene));
        if (this.gridUniforms.axes)      gl.uniform3fv(this.gridUniforms.axes,      new Float32Array(hullAxes));

        // --- drive + wall
        const drive = V3(U.driveDir, [1,0,0]);
        // Use unified wallWidth_rho, aliased as wallWidth for the shader
        const wRho  = F(U.wallWidth, WALL_RHO_DEFAULT);
        if (this.gridUniforms.driveDir)  gl.uniform3fv(this.gridUniforms.driveDir, new Float32Array(drive));
        if (this.gridUniforms.wallWidth) gl.uniform1f(this.gridUniforms.wallWidth, wRho);

        // --- critical amplitude carrier INSIDE theta field:
        const vShip = Number.isFinite(U.vShip) ? U.vShip : (U.physicsParityMode ? 0.0 : 1.0);
        if (this.gridUniforms.vShip)     gl.uniform1f(this.gridUniforms.vShip, F(vShip, 1.0));

        // --- θ-scale (you already set a fallback in JS if missing)
        if (this.gridUniforms.thetaScale) gl.uniform1f(this.gridUniforms.thetaScale, U.thetaScale || 0); // Direct pipeline value, no fallback amplification

        // --- exposure / viz chain
        if (this.gridUniforms.exposure)          gl.uniform1f(this.gridUniforms.exposure,          F(U.exposure, U.physicsParityMode ? 3.5 : 6.0));
        if (this.gridUniforms.zeroStop)          gl.uniform1f(this.gridUniforms.zeroStop,          F(U.zeroStop, U.physicsParityMode ? 1e-5 : 1e-7));
        if (this.gridUniforms.userGain)          gl.uniform1f(this.gridUniforms.userGain,          F(U.userGain, 1.0));
        if (this.gridUniforms.displayGain)       gl.uniform1f(this.gridUniforms.displayGain,       F(U.displayGain, 1.0));
        if (this.gridUniforms.vizGain)           gl.uniform1f(this.gridUniforms.vizGain,           F(U.vizGain, 1.0));
        if (this.gridUniforms.curvatureGainT)    gl.uniform1f(this.gridUniforms.curvatureGainT,    F(U.curvatureGainT, 0.0));
        if (this.gridUniforms.curvatureBoostMax) gl.uniform1f(this.gridUniforms.curvatureBoostMax, F(U.curvatureBoostMax, 1.0));

        // --- interior tilt (benign defaults)
        if (this.gridUniforms.intWidth) gl.uniform1f(this.gridUniforms.intWidth, F(U.intWidth, 0.25));
        if (this.gridUniforms.epsTilt)  gl.uniform1f(this.gridUniforms.epsTilt,  F(U.epsTilt,  0.0));
        if (this.gridUniforms.tiltViz)  gl.uniform1f(this.gridUniforms.tiltViz,  F(U.tiltViz,  0.0));

        // --- Purple shift uniforms
        if (this.gridUniforms.epsilonTilt) gl.uniform1f(this.gridUniforms.epsilonTilt, F(U.epsilonTilt, 0.0));
        if (this.gridUniforms.betaTiltVec) {
            const betaTilt = V3(U.betaTiltVec, [0, -1, 0]);
            gl.uniform3fv(this.gridUniforms.betaTiltVec, new Float32Array(betaTilt));
        }

        // --- Metric tensor uniforms (default to identity if not provided)
        const metric = U.metric || [1,0,0, 0,1,0, 0,0,1];
        const metricInv = U.metricInv || [1,0,0, 0,1,0, 0,0,1];
        const useMetric = U.useMetric || false;
        const metricOn = U.metricOn !== undefined ? U.metricOn : (useMetric ? 1.0 : 0.0);

        if (this.gridUniforms.metric) {
            gl.uniformMatrix3fv(this.gridUniforms.metric, false, new Float32Array(metric));
            gl.uniformMatrix3fv(this.gridUniforms.metricInv, false, new Float32Array(metricInv));
            gl.uniform1i(this.gridUniforms.useMetric, useMetric ? 1 : 0);
        }
        if (this.gridUniforms.metricOn) {
            gl.uniform1f(this.gridUniforms.metricOn, metricOn);
        }


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
            // Clear the frame and enforce a single opaque pass
            gl.disable(gl.BLEND);
            gl.depthMask(true);
            gl.clearColor(0, 0, 0, 1);
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

        const vertexShader   = this.compileShader(gl.VERTEX_SHADER,   vertexSource, 'vertex');
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource, 'fragment');
        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // record initial debug
        this._glStatus = {
            vertOK: !!gl.getShaderParameter(vertexShader,   gl.COMPILE_STATUS),
            fragOK: !!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS),
            linkOK: !!gl.getProgramParameter(program,       gl.LINK_STATUS),
            vertLog: (gl.getShaderInfoLog(vertexShader)   || '').trim(),
            fragLog: (gl.getShaderInfoLog(fragmentShader) || '').trim(),
            linkLog: (gl.getProgramInfoLog(program)       || '').trim(),
        };
        (window.__glDiag ||= {})[this.canvas?.id || `engine_${Date.now()}`] = this._glStatus;

        // expose a live program handle even during compile so panels can query status
        this.program = this.gridProgram = program;

        // --- Async path (KHR) ---
        if (this.parallelShaderExt && onReady) {
            this._setLoadingState('compiling');
            this._pollShaderCompletion(program, (p) => {
                if (!p) {
                    this._setLoadingState('failed');
                    onReady?.(null);
                    return;
                }
                if (this._onProgramLinked(p)) {
                    this.program = this.gridProgram = p;
                    this._setLoadingState('linked');
                    onReady?.(p);
                } else {
                    this._setLoadingState('failed');
                    onReady?.(null);
                }
            });
            return program;
        }

        // --- Sync path ---
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const vsLog = gl.getShaderInfoLog(vertexShader) || '(vs ok)';
            const fsLog = gl.getShaderInfoLog(fragmentShader) || '(fs ok)';
            const pgLog = gl.getProgramInfoLog(program) || '(program no log)';
            console.error(`[${this.debugTag}] Link error:`, { vsLog, fsLog, pgLog });
            gl.deleteProgram(program);
            this._setLoadingState('failed');
            return null;
        }

        // success (sync)
        if (this._onProgramLinked(program)) {
            this.program = this.gridProgram = program;
            this._setLoadingState('linked');
            onReady?.(program);
            return program;
        }
        this._setLoadingState('failed');
        return null;
    }

    _pollShaderCompletion(program, onReady) {
        const gl = this.gl;
        const ext = this.parallelShaderExt;

        const poll = () => {
            const done = gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR);
            if (done) {
                const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
                if (ok) {
                    onReady(program);
                    this._setLoadingState('linked');
                } else {
                    console.error(`[${this.debugTag}] Shader program link error:`, gl.getProgramInfoLog(program));
                    gl.deleteProgram(program);
                    onReady(null);
                    this._setLoadingState('failed');
                }
            } else {
                requestAnimationFrame(poll);
                this._setLoadingState('compiling'); // keep telling the world we're compiling
            }
        };
        poll();
    }

    compileShader(type, source, shaderType = 'unknown') {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            console.error(`[${this.debugTag}] ${shaderType} shader compilation failed:`, error);
            throw new Error(`[${this.debugTag}] ${shaderType} shader compilation failed: ${error}`);
        } else {
            console.log(`[${this.debugTag}] ${shaderType} shader compiled successfully`);
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

    _perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1.0 / (near - far);

        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
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
        const w     = Math.max(1e-4, U.wallWidth_rho ?? U.wallWidth ?? WALL_RHO_DEFAULT);   // shell width in rho
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

            const theta = (U.ridgeMode===1)
                ? vShip * (xs/rs) * f      // single crest
                : vShip * (xs/rs) * dfdr;  // double-lobe
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

        // C) Additional physics values for CPU comparison
        // Single source of truth for duty: what the engine actually used
        let d_FR = U.dutyEffectiveFR;
        if (!Number.isFinite(d_FR)) d_FR = U.dutyUsed;
        if (!Number.isFinite(d_FR)) {
            // final fallback: duty_local × (S_concurrent / S_total)
            const dutyLocal = Number.isFinite(U.dutyLocal) ? U.dutyLocal : 0.01; // 1% default
            const S_total   = Math.max(1, U.sectorCount ?? 400);
            const S_live    = Math.max(1, U.sectors ?? 1);
            d_FR = dutyLocal * (S_live / S_total);
        }
        d_FR = Math.max(1e-12, d_FR);

        // View mass fraction for displays (REAL shows ~1/sectorCount; SHOW uses 1.0)
        const sectorFraction = Math.max(1, (U.sectors||1)) / Math.max(1, U.sectorCount||400);
        const viewFraction = (U.viewAvg ?? true)
            ? (U.viewMassFraction ?? (U.physicsParityMode ? 1/Math.max(1, U.sectorCount||400) : 1.0))
            : 1.0;

        const f_view = Math.max(1e-12, U.viewMassFraction ?? 1.0);
        return {
            mode: U.currentMode||'hover',
            duty: U.dutyCycle, gammaGeo: U.gammaGeo, Q: (U.Qburst??U.cavityQ),
            dA_over_A:(U.deltaAOverA??U.qSpoilingFactor), gammaVdB:(U.gammaVdB||1),
            sectors:P.sectors, phase:P.phase,
            beta_inst:P.betaInst, beta_avg:P.betaAvg, beta_net:P.betaNet,
            theta_front_max:Y.thetaFrontMax, theta_front_min:Y.thetaFrontMin,
            theta_rear_max:Y.thetaRearMax,   theta_rear_min:Y.thetaRearMin,
            T00_avg_proxy:Y.T00avg, sigma_eff:1/Math.max(1e-4, U.wallWidth_rho ?? U.wallWidth ?? WALL_RHO_DEFAULT),
            shear_avg_proxy: shear_avg_proxy,
            york_sign_ok: (Y.thetaFrontMin<0 && Y.thetaRearMax>0),
            hover_sym_ok: (Math.abs(P.phase-0.5)<1e-3) && (Math.abs(frontAbs-rearAbs)<0.1*frontAbs+1e-6),
            // C) Additional physics values for CPU comparison
            d_FR,
            viewFraction,
            sectorFraction,
            frameHash8x8: this.sampleHash8x8(),

            // pane-aware (display only)
            theta_front_max_viewed: Y.thetaFrontMax * Math.sqrt(f_view),
            theta_rear_min_viewed:  Y.thetaRearMin  * Math.sqrt(f_view),
        };
    }

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

    // === C) Frame hash for checkpoint validation ===
    sampleHash8x8() {
        if (!this.gl || !this.canvas) return 0;

        try {
            const gl = this.gl;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Sample 8x8 grid across canvas
            const pixels = new Uint8Array(64 * 4); // 8x8 RGBA
            const stepX = Math.max(1, Math.floor(w / 8));
            const stepY = Math.max(1, Math.floor(h / 8));

            let hash = 0;
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const px = Math.min(w - 1, x * stepX);
                    const py = Math.min(h - 1, y * stepY);

                    const rgba = new Uint8Array(4);
                    gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);

                    // XOR + simple hash
                    const idx = (y * 8 + x) * 4;
                    pixels[idx] = rgba[0];
                    pixels[idx + 1] = rgba[1];
                    pixels[idx + 2] = rgba[2];
                    pixels[idx + 3] = rgba[3];

                    hash ^= (rgba[0] << 24) | (rgba[1] << 16) | (rgba[2] << 8) | rgba[3];
                    hash = ((hash << 1) | (hash >>> 31)) & 0xFFFFFFFF; // rotate left
                }
            }

            return hash;
        } catch (e) {
            console.warn('sampleHash8x8 error:', e);
            return 0;
        }
    }

    setPresetParity() {
        this.updateUniforms({
            physicsParityMode: true,
            viewAvg: true,
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
            viewAvg: false,
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
        this.program = null;
        this.gridUniforms = null;
        this.gridAttribs = null;

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
    // Keep BUILD token on the class
    WarpEngine.BUILD = BUILD;
    globalThis.__WarpEngineBuild = BUILD;
    globalThis.WarpEngine = WarpEngine;
    console.log("🔥 PATCHED ENGINE BODY RUNNING - Build:", BUILD, "Time:", Date.now());
}

// Build token already stamped in guard section above

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