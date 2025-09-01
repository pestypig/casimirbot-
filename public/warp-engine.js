//====================================================================
//  Natário Warp‑Bubble Visualiser (pure WebGL – no GLM, no WebAssembly)
//  ------------------------------------------------------------------
//  Drop this file next to your React (or plain‑JS) front‑end.  Create
//  <canvas id="warpView"></canvas> in the DOM and then:
//
//      import WarpEngine from "./warp_engine.js";
//      const eng = new WarpEngine(document.getElementById("warpView"));
//      window.addEventListener("message", e => eng.updateUniforms(e.data));
//
//  That’s it: the dashboard’s postMessage payload drives the bubble
//  field in real‑time.
//====================================================================

export default class WarpEngine {
    //----------------------------------------------------------------
    //  1.  Boiler‑plate
    //----------------------------------------------------------------
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported");

        //   Enable derivatives in WebGL1 – they’re core in WebGL2
        if (!this.gl.getExtension("OES_standard_derivatives")) {
            console.warn("OES_standard_derivatives extension not available – grid lines will disappear in WebGL1");
        }

        //   Default UI values (same as Hover mode)
        this.uniforms = {
            dutyCycle:     0.14,
            g_y:           26.0,
            cavityQ:       1e9,
            sagDepth_nm:   16.0,
            tsRatio:       4102.74,
            powerAvg_MW:   83.3,
            exoticMass_kg: 1405
        };

        // Add thetaScale_actual as a computed property for diagnostics
        Object.defineProperty(this.uniforms, 'thetaScale_actual', {
            get: () => this._thetaScaleActual ?? NaN,
            enumerable: true
        });

        this._compileShaders();
        this._initQuad();
        this._cacheUniformLocations();
        this._resize();
        window.addEventListener("resize", () => this._resize());
        requestAnimationFrame(t => this._loop(t));
    }

    //----------------------------------------------------------------
    //  2.  Shader compilation
    //----------------------------------------------------------------
    _compileShaders() {
        const vs = `#version 300 es
        in  vec2 a_position;   out vec2 v_uv;
        void main(){
            v_uv = a_position*0.5+0.5;
            gl_Position = vec4(a_position,0.0,1.0);
        }`;

        const fs = `#version 300 es
        precision highp float;  in vec2 v_uv;  out vec4 frag;

        uniform float u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm,
                      u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time;

        // --- Natário β‑field --------------------------------------
        vec3 betaField(vec3 x){
            float R = u_sagDepth_nm*1e-9;      // nm → m
            float r = length(x);
            if(r<1e-9) return vec3(0.);
            float beta0 = u_dutyCycle*u_g_y;
            float prof  = (r/R)*exp(-(r*r)/(R*R));
            return beta0*prof*(x/r);
        }
        // --- Colour mapping ---------------------------------------
        vec3 warpColor(float b){
            float it = clamp(b*100.0,0.0,1.0);
            return mix(vec3(0.1,0.2,0.8), vec3(0.9,0.3,0.1), it);
        }
        // -----------------------------------------------------------
        void main(){
            vec2 c = v_uv-0.5;                       // centre at 0
            vec3 pos = vec3(c*2.0e-8,0.0);           // 20 nm FOV → ±1e‑8 m
            float bmag = length(betaField(pos));
            // ripple for eye‑candy (scaled by duty‑cycle)
            bmag += sin(u_time*2.0 + length(c)*20.0)*0.1*u_dutyCycle;
            vec3 col = warpColor(bmag);

            // grid overlay (fwidth needs derivatives ⇒ WebGL2 or ext)
            vec2 g = abs(fract(c*50.0)-0.5)/fwidth(c*50.0);
            float line = 1.0-min(min(g.x,g.y),1.0);
            col = mix(col, vec3(0.5), line*0.2);
            frag = vec4(col,1.0);
        }`;

        this.program = this._linkProgram(vs, fs);
    }

    _linkProgram(vsrc, fsrc) {
        const gl = this.gl;
        const vs = this._compile(gl.VERTEX_SHADER, vsrc);
        const fs = this._compile(gl.FRAGMENT_SHADER, fsrc);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
        }
        gl.deleteShader(vs); gl.deleteShader(fs);
        return prog;
    }

    _compile(type, src) {
        const gl = this.gl;
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src); gl.compileShader(sh);
        if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
            throw new Error("Shader compile error: "+ gl.getShaderInfoLog(sh));
        }
        return sh;
    }

    //----------------------------------------------------------------
    //  3.  Geometry (single full‑screen quad)
    //----------------------------------------------------------------
    _initQuad(){
        const gl = this.gl;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1,-1,   1,-1,  -1, 1,   1, 1
        ]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.vbo = vbo;
    }

    //----------------------------------------------------------------
    //  4.  Uniform reflection
    //----------------------------------------------------------------
    _cacheUniformLocations(){
        const gl = this.gl;
        gl.useProgram(this.program);
        this.uLoc = {
            dutyCycle:     gl.getUniformLocation(this.program,"u_dutyCycle"),
            g_y:           gl.getUniformLocation(this.program,"u_g_y"),
            cavityQ:       gl.getUniformLocation(this.program,"u_cavityQ"),
            sagDepth_nm:   gl.getUniformLocation(this.program,"u_sagDepth_nm"),
            tsRatio:       gl.getUniformLocation(this.program,"u_tsRatio"),
            powerAvg_MW:   gl.getUniformLocation(this.program,"u_powerAvg_MW"),
            exoticMass_kg: gl.getUniformLocation(this.program,"u_exoticMass_kg"),
            time:          gl.getUniformLocation(this.program,"u_time")
        };
    }

    //----------------------------------------------------------------
    //  5.  Physics Chain Computation
    //----------------------------------------------------------------
    // ---- Canonical physics θ (engine is the only authority) ----
    _thetaCanonical(params) {
        const {
            gammaGeo, qSpoilingFactor,
            gammaVanDenBroeck_mass, dutyLocal,
            sectorsConcurrent, sectorsTotal,
            viewAveraged = true, currentMode
        } = params || {};

        if (currentMode === 'standby') return 0;

        const g = Math.max(1, Number(gammaGeo) || 26);
        const q = Math.max(1e-12, Number(qSpoilingFactor) || 1);
        // physics-only clamp on MASS pocket gamma (visual gamma never enters θ)
        const v = Math.max(1, Math.min(1e2, Number(gammaVanDenBroeck_mass) || 38.3));
        const sC = Math.max(1, Number(sectorsConcurrent) || 1);
        const sT = Math.max(1, Number(sectorsTotal) || 400);

        // Ford–Roman effective duty: d_FR = dutyLocal * (sC / sT)
        const dFR = Math.max(1e-12, Math.min(1, (Number(dutyLocal) || 0) * (sC / sT)));
        const dutyFactor = viewAveraged ? Math.sqrt(dFR) : 1;

        return (g * g * g) * q * v * dutyFactor;
    }

    _computeThetaScaleFromUniforms(u) {
        // Derive inputs for canonical θ from uniforms (never accept a param thetaScale here)
        const parityREAL = !!u.physicsParityMode;    // REAL physics pane?
        const mode = u.currentMode || 'hover';

        const theta = this._thetaCanonical({
            gammaGeo: u.gammaGeo ?? u.g_y,
            qSpoilingFactor: u.qSpoilingFactor ?? u.deltaAOverA,
            gammaVanDenBroeck_mass: (u.gammaVanDenBroeck_mass ?? u.gammaVanDenBroeck),
            dutyLocal: (u.dutyCycle ?? 0.01),
            sectorsConcurrent: (u.sectors ?? 1),
            sectorsTotal: (u.sectorCount ?? 400),
            viewAveraged: parityREAL,     // physics (REAL) averages, SHOW does not
            currentMode: mode
        });

        return theta;
    }

    bootstrap(payload) {
        // Ensure metric is set first if present
        const m = {};
        if ('useMetric' in (payload||{})) m.useMetric = payload.useMetric;
        if ('metric'    in (payload||{})) m.metric    = payload.metric;
        if ('metricInv' in (payload||{})) m.metricInv = payload.metricInv;
        if (Object.keys(m).length) this.updateUniforms(m);
        this.updateUniforms(payload);
    }

    //----------------------------------------------------------------
    //  6.  Public API
    //----------------------------------------------------------------
    updateUniforms(obj){
        Object.assign(this.uniforms, obj);
    }

    //----------------------------------------------------------------
    //  7.  Frame loop
    //----------------------------------------------------------------
    _loop(t){
        this._draw(t*0.001);
        requestAnimationFrame(tt => this._loop(tt));
    }

    _draw(time){
        const gl = this.gl;
        gl.viewport(0,0, this.canvas.width, this.canvas.height);
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        //  push uniforms
        gl.uniform1f(this.uLoc.dutyCycle,     this.uniforms.dutyCycle);
        gl.uniform1f(this.uLoc.g_y,           this.uniforms.g_y);
        gl.uniform1f(this.uLoc.cavityQ,       this.uniforms.cavityQ);
        gl.uniform1f(this.uLoc.sagDepth_nm,   this.uniforms.sagDepth_nm);
        gl.uniform1f(this.uLoc.tsRatio,       this.uniforms.tsRatio);
        gl.uniform1f(this.uLoc.powerAvg_MW,   this.uniforms.powerAvg_MW);
        gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg);
        gl.uniform1f(this.uLoc.time,          time);

        //  full‑screen quad attrib
        const loc = gl.getAttribLocation(this.program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    //----------------------------------------------------------------
    //  8.  Responsive resize
    //----------------------------------------------------------------
    _resize(){
        const dpr = window.devicePixelRatio || 1;
        const bw  = this.canvas.clientWidth  * dpr;
        const bh  = this.canvas.clientHeight * dpr;
        if(this.canvas.width!==bw || this.canvas.height!==bh){
            this.canvas.width  = bw;
            this.canvas.height = bh;
        }
    }

    //----------------------------------------------------------------
    //  9.  Shader injection & uniforms
    //----------------------------------------------------------------
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

// Metric-aware helper functions
float dotG(vec3 a, vec3 b) { return dot(a, u_metric * b); }
float normG(vec3 v) { return sqrt(max(1e-12, dotG(v, v))); }
vec3 normalizeG(vec3 v) { return v / max(1e-12, normG(v)); }

#endif
`;
            return `${uniformsBlock}\n${src}`;
        }
        return src;
    }

    _compileShadersWithInjection(vs_src, fs_src) {
        const gl = this.gl;
        // Inject uniforms into fragment shader
        const injected_fs = this._injectUniforms(fs_src);
        const vs = this._compile(gl.VERTEX_SHADER, vs_src);
        const fs = this._compile(gl.FRAGMENT_SHADER, injected_fs);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
        }
        gl.deleteShader(vs); gl.deleteShader(fs);
        return prog;
    }

    //----------------------------------------------------------------
    //  10. Shader Uniforms & Grid Processing
    //----------------------------------------------------------------
    _cacheGridUniformLocations(program) {
        const gl = this.gl;
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
            wallWidth: gl.getUniformLocation(program, 'u_wallWidth'),
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
        };
    }

    updateUniforms(obj){
        const patch = obj || {};
        const parameters = { ...this.uniforms, ...patch }; // Copy existing uniforms and apply patch
        const nextUniforms = { ...parameters }; // Create a new object for modifications
        const mode = parameters?.currentMode ?? this.uniforms?.currentMode ?? 'hover'; // Default to 'hover' if mode is not specified
        const parity = !!parameters?.physicsParityMode; // Ensure parity is a boolean

        // 1) Bind metric first (+ mirror to u_*)
        if ('useMetric' in patch || 'metric' in patch || 'metricInv' in patch) {
            const useMetric = !!patch.useMetric;
            const I = [1,0,0, 0,1,0, 0,0,1];
            const m  = Array.isArray(patch.metric) && patch.metric.length === 9 ? patch.metric.map(Number) : I;
            const mi = Array.isArray(patch.metricInv) && patch.metricInv.length === 9 ? patch.metricInv.map(Number) : I;
            nextUniforms.useMetric   = useMetric; nextUniforms.u_useMetric = useMetric;
            nextUniforms.metric      = m;         nextUniforms.u_metric    = m;
            nextUniforms.metricInv   = mi;        nextUniforms.u_metricInv = mi;
        }

        // 2) Merge rest, but strip any external thetaScale
        const { thetaScale, u_thetaScale, ...safeParameters } = patch;
        Object.assign(nextUniforms, safeParameters);

        const viewAvgResolved = nextUniforms.viewAvgResolved ?? false;

        // build theta scale via canonical function; never trust incidental locals
        const thetaScaleFromChain = this._computeThetaScaleFromUniforms({
            ...nextUniforms,
            // Ensure the canonical has the raw inputs (avoid stale locals)
            dutyCycle: parameters?.dutyCycle ?? nextUniforms.dutyCycle ?? 0.01,
            dutyEffectiveFR: parameters?.dutyEffectiveFR ?? nextUniforms.dutyEffectiveFR,
            sectors: parameters?.sectors ?? nextUniforms.sectors ?? 1,
            sectorCount: parameters?.sectorCount ?? nextUniforms.sectorCount ?? 400,
            currentMode: parameters?.currentMode ?? nextUniforms.currentMode ?? 'hover',
            u_physicsParityMode: nextUniforms.physicsParityMode
        });
        this.__lastThetaTerms = { // Store for potential debug logging
            gammaGeo: nextUniforms.gammaGeo ?? nextUniforms.g_y,
            qSpoilingFactor: nextUniforms.qSpoilingFactor ?? nextUniforms.deltaAOverA,
            gammaVanDenBroeck_mass: nextUniforms.gammaVanDenBroeck_mass ?? nextUniforms.gammaVanDenBroeck,
            dutyLocal: nextUniforms.dutyCycle ?? 0.01,
            sectorsConcurrent: nextUniforms.sectors ?? 1,
            sectorsTotal: nextUniforms.sectorCount ?? 400,
            viewAveraged: parity,
            currentMode: mode
        };


        // Publish FR explicitly (if none was provided, publish the reconstructed FR)
        const dFRpub = (Number.isFinite(+parameters?.dutyEffectiveFR) ? Math.max(0, Math.min(1, +parameters.dutyEffectiveFR))
                        : Math.max(0, Math.min(1, (parameters?.dutyCycle ?? nextUniforms.dutyCycle ?? 0.01) *
                                                ((parameters?.sectors ?? nextUniforms.sectors ?? 1) /
                                                 Math.max(1, (parameters?.sectorCount ?? nextUniforms.sectorCount ?? 400))))));
        nextUniforms.dutyUsed        = dFRpub;
        nextUniforms.dutyEffectiveFR = dFRpub;

        // --- Neutralize visual boosts in standby (keep this REAL-only if desired) ---
        if (mode === 'standby' && parity) {
          nextUniforms.vizGain = 1;
          nextUniforms.curvatureGainT = 0;
          nextUniforms.curvatureBoostMax = 1;
          nextUniforms.userGain = 1;
          nextUniforms.vShip = 0;
        }

        // 3) Warn if external thetaScale tried to override (once per instance)
        if ((thetaScale !== undefined || u_thetaScale !== undefined) && !this.__thetaWarned) {
            const asked = +(u_thetaScale ?? thetaScale);
            if (Number.isFinite(asked) && Math.abs(thetaScaleFromChain - asked) / Math.max(1, Math.abs(thetaScaleFromChain)) > 0.01) {
                console.warn('[WarpEngine] Ignored external thetaScale override', {
                    asked: asked.toExponential(2),
                    engine: thetaScaleFromChain.toExponential(2),
                    ratio: (thetaScaleFromChain/asked).toFixed(2)
                });
                this.__thetaWarned = true;
            }
        }

        // --- Metric tensor wiring --------------------------------------------
        // Accept either explicit metric(s) or derive an ellipsoidal cometric.
        // metricMode: 'identity' | 'ellipsoid' | 'custom'
        const prev = this.uniforms; // Store previous uniforms for comparison

        const metricMode = String(parameters?.metricMode ?? prev?.metricMode ?? 'identity');
        let metric    = parameters?.metric    ?? prev?.metric    ?? null;
        let metricInv = parameters?.metricInv ?? prev?.metricInv ?? null;
        let useMetric = (parameters?.useMetric ?? prev?.useMetric ?? false) ? true : false;

        // Need axesScene for ellipsoid mode, fall back to default if not provided
        const axesScene = parameters?.axesScene ?? prev?.axesScene ?? [1, 1, 1];

        if (!metric) {
            if (metricMode === 'ellipsoid') {
                // covariant g_ij in clip space, aligned to axesClip:
                // g = diag(1/a^2, 1/b^2, 1/c^2)
                const ga = 1.0 / Math.max(axesScene[0], 1e-9);
                const gb = 1.0 / Math.max(axesScene[1], 1e-9);
                const gc = 1.0 / Math.max(axesScene[2], 1e-9);
                metric    = [ga*ga,0,0, 0,gb*gb,0, 0,0,gc*gc];
                metricInv = [1.0/(ga*ga),0,0, 0,1.0/(gb*gb),0, 0,0,1.0/(gc*gc)];
                useMetric = true;
            } else {
                // Identity (Euclidean)
                metric    = [1,0,0, 0,1,0, 0,0,1];
                metricInv = [1,0,0, 0,1,0, 0,0,1];
            }
        }
        // Update uniforms object with metric information
        nextUniforms.metricMode = metricMode;
        nextUniforms.metric     = metric;
        nextUniforms.metricInv  = metricInv;
        nextUniforms.useMetric  = !!useMetric;


        // --- decide if the CPU warp needs recompute ---
        const geoChanged =
          (prev.hullAxes?.[0] !== nextUniforms.hullAxes[0]) ||
          (prev.hullAxes?.[1] !== nextUniforms.hullAxes[1]) ||
          (prev.hullAxes?.[2] !== nextUniforms.hullAxes[2]) ||
          (prev.gridSpan !== nextUniforms.gridSpan);

        // Final guardrail: if standby and θ>0, log once for traceability
        if ((parameters?.currentMode ?? nextUniforms.currentMode) === 'standby' && nextUniforms.thetaScale > 0) {
            console.warn('[warp-engine] Standby θ non-zero — terms:', this.__lastThetaTerms);
        }

        // Update core uniforms
        Object.assign(this.uniforms, nextUniforms); // Assign the modified uniforms back

        // Engine-authoritative θ
        this.uniforms.thetaScale_actual = thetaScaleFromChain;
        this.uniforms.thetaScale        = thetaScaleFromChain;

        // Recompute warp geometry if necessary
        if (geoChanged) {
            this._updateWarpGeometry(this.uniforms);
        }
    }

    //----------------------------------------------------------------
    //  11. Rendering
    //----------------------------------------------------------------
    _draw(time){
        const gl = this.gl;
        gl.viewport(0,0, this.canvas.width, this.canvas.height);
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // --- Standard uniforms ---------------------------------------
        // dutyCycle, g_y, cavityQ, sagDepth_nm, tsRatio, powerAvg_MW, exoticMass_kg, time
        for (const name in this.uLoc) {
            const loc = this.uLoc[name];
            const value = this.uniforms[name];
            if (loc) {
                if (typeof value === 'number') gl.uniform1f(loc, value);
                else if (typeof value === 'boolean') gl.uniform1i(loc, value ? 1 : 0);
                // Add more type checks if needed (e.g., vec3, mat3)
            }
        }

        // --- Purple shift uniforms ---------------------------------------
        if (this.gridUniforms.epsilonTilt) gl.uniform1f(this.gridUniforms.epsilonTilt, this.uniforms.epsilonTilt ?? 0.0);
        if (this.gridUniforms.betaTiltVec) {
            const betaTilt = this.uniforms.betaTiltVec || [0, -1, 0];
            gl.uniform3fv(this.gridUniforms.betaTiltVec, new Float32Array(betaTilt));
        }

        // --- Metric tensor uniforms (default to identity if not provided)
        const metric = this.uniforms.metric || [1,0,0, 0,1,0, 0,0,1];
        const metricInv = this.uniforms.metricInv || [1,0,0, 0,1,0, 0,0,1];
        const useMetric = this.uniforms.useMetric || false;
        if (this.gridUniforms.metric) {
            gl.uniformMatrix3fv(this.gridUniforms.metric, false, new Float32Array(metric));
            gl.uniformMatrix3fv(this.gridUniforms.metricInv, false, new Float32Array(metricInv));
            gl.uniform1i(this.gridUniforms.useMetric, useMetric ? 1 : 0);
        }

        // --- Grid-specific uniforms ----------------------------------
        // (Assuming _cacheGridUniformLocations has been called)
        if (this.gridUniforms) {
            for (const name in this.gridUniforms) {
                const loc = this.gridUniforms[name];
                const value = this.uniforms[name];
                if (loc && value !== undefined) {
                    // Determine uniform type based on name or value structure
                    if (name.includes('Matrix')) {
                        gl.uniformMatrix3fv(loc, false, new Float32Array(value));
                    } else if (name.includes('Color') || name.includes('Vec') || name.includes('Dir') || name.includes('Scene') || name.includes('axes')) {
                        gl.uniform3fv(loc, new Float32Array(value));
                    } else if (typeof value === 'number') {
                        gl.uniform1f(loc, value);
                    } else if (typeof value === 'boolean') {
                        gl.uniform1i(loc, value ? 1 : 0);
                    } else if (Array.isArray(value)) {
                         // Handle arrays, e.g., for vec4, mat4 etc. if needed
                        if (value.length === 3) gl.uniform3fv(loc, new Float32Array(value));
                        else if (value.length === 4) gl.uniform4fv(loc, new Float32Array(value));
                        // Add more array type handling if necessary
                    }
                }
            }
        }

        // --- Draw the full-screen quad ---
        const posLoc = gl.getAttribLocation(this.program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    //----------------------------------------------------------------
    //  12. Utility Functions (for uniform processing)
    //----------------------------------------------------------------
    // Helper to get uniform location, caching results
    _getUniformLocation(program, name) {
        if (!this.uniformCache) this.uniformCache = {};
        if (this.uniformCache[name] === undefined) {
            this.uniformCache[name] = this.gl.getUniformLocation(program, name);
        }
        return this.uniformCache[name];
    }

    // Update warp geometry based on uniforms
    _updateWarpGeometry(uniforms) {
        // This function would contain the logic to recalculate warp geometry
        // based on the current uniforms, especially if metric-aware calculations
        // require changes to the underlying grid or vertex data.
        // For now, it's a placeholder.
        console.log("Warp geometry update triggered (placeholder)");
    }

    // Metric (covariant) for CPU-side ops (defaults to identity)
    _getMetricHelpers() {
        const uniforms = this.uniforms;
        const G = (uniforms?.metric && uniforms.metric.length === 9)
                    ? uniforms.metric
                    : [1,0,0, 0,1,0, 0,0,1];
        const dotG = (ax, ay, az, bx, by, bz) =>
            ax*(G[0]*bx + G[3]*by + G[6]*bz) +
            ay*(G[1]*bx + G[4]*by + G[7]*bz) +
            az*(G[2]*bx + G[5]*by + G[8]*bz);
        const normG = (x,y,z) => Math.sqrt(Math.max(1e-12, dotG(x,y,z, x,y,z)));

        return { G, dotG, normG };
    }

    // Ellipsoid utilities (using consistent scene-scaled axes)
    rhoEllipsoidal(p) {
        const { axesScene, useMetric, metric } = this.uniforms;
        const metricHelpers = this._getMetricHelpers(); // Get metric helpers

        const pN = [p[0]/axesScene[0], p[1]/axesScene[1], p[2]/axesScene[2]];
        return useMetric ? metricHelpers.normG(pN[0], pN[1], pN[2]) : Math.hypot(pN[0], pN[1], pN[2]);
    }
}