// Optimized 3D spacetime curvature visualization engine
// Authentic Natário warp bubble physics with WebGL rendering

// --- Grid defaults (scientifically scaled for needle hull) ---
const GRID_DEFAULTS = {
  spanPadding: 1.6,    // how much to multiply the hull span in clip space
  minSpan: 2.6,        // never smaller than this (in clip-space units)
  divisions: 100       // more lines so a larger grid still looks dense
};

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        console.log("🚨 ENHANCED 3D ELLIPSOIDAL SHELL v4.0 - PIPELINE-DRIVEN PHYSICS 🚨");
        
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
        
        // Temporal smoothing for visual calm (canonical Natário)
        this._dispAlpha = 0.25; // blend factor (0=no change, 1=instant)
        this._prevDisp = [];     // per-vertex displacement history
        
        // Grid rendering resources
        this.gridVertices = null;
        this.originalGridVertices = null; // Store original positions for warp calculations
        this.gridVbo = null;
        this.gridProgram = null;
        
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
            tiltGain: 0.55       // gentle visual scaling
        };
        
        // Initialize rendering pipeline
        this._setupCamera();
        this._initializeGrid();
        
        // Expose strobing sync function globally
        window.setStrobingState = ({ sectorCount, currentSector }) => {
            this.strobingState.sectorCount = sectorCount;
            this.strobingState.currentSector = currentSector;
        };
        
        // Bind resize handler
        this._resize = this._resize.bind(this);
        window.addEventListener('resize', this._resize);
        
        // Start render loop
        this._renderLoop();
    }

    _setupCamera() {
        const aspect = this.canvas.width / this.canvas.height;
        
        // Projection matrix - wide FOV to see full grid
        this._perspective(this.projMatrix, Math.PI / 3, aspect, 0.1, 100.0);
        
        // View matrix - camera positioned to see the spacetime grid
        const eye = [0, 0.5, -1.8];    // Pulled back and slightly above
        const center = [0, -0.1, 0];   // Looking at grid center
        const up = [0, 1, 0];
        this._lookAt(this.viewMatrix, eye, center, up);
        
        // Combined MVP matrix
        this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
    }
    
    _adjustCameraForSpan(span) {
        // Gently adjust camera distance based on grid span for comfortable framing
        const aspect = this.canvas.width / this.canvas.height;
        const eye = [0, 0.5, -Math.max(1.8, span * 1.2)];    // Pull back based on span
        const center = [0, -0.1, 0];   // Still looking at grid center
        const up = [0, 1, 0];
        
        this._lookAt(this.viewMatrix, eye, center, up);
        this._multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);
        
        console.log(`📷 Camera adjusted: distance=${eye[2].toFixed(2)} for span=${span.toFixed(2)}`);
    }

    _initializeGrid() {
        const gl = this.gl;
        
        // Create spacetime grid geometry
        // Start with default span, will be adjusted when hull params are available
        const gridData = this._createGrid(GRID_DEFAULTS.minSpan, GRID_DEFAULTS.divisions);
        this.gridVertices = new Float32Array(gridData);
        
        // Store original vertex positions for warp calculations
        this.originalGridVertices = new Float32Array(gridData);
        
        // Create VBO for grid
        this.gridVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
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
        const yVariation = 0.05;  // Small height variation

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
            "    gl_PointSize = 12.0;\n" +
            "}"
            :
            "attribute vec3 a_position;\n" +
            "uniform mat4 u_mvpMatrix;\n" +
            "varying vec3 v_pos;\n" +
            "void main() {\n" +
            "    v_pos = a_position;\n" +
            "    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);\n" +
            "    gl_PointSize = 12.0;\n" +
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
            "in vec3 v_pos;\n" +
            "out vec4 frag;\n" +
            "vec3 diverge(float t) {\n" +
            "    float x = clamp((t+1.0)*0.5, 0.0, 1.0);\n" +
            "    vec3 c1 = vec3(0.15, 0.45, 1.0);\n" +  // blue
            "    vec3 c2 = vec3(1.0);\n" +               // white  
            "    vec3 c3 = vec3(1.0, 0.45, 0.0);\n" +    // orange-red
            "    return x < 0.5 ? mix(c1,c2, x/0.5) : mix(c2,c3,(x-0.5)/0.5);\n" +
            "}\n" +
            "void main() {\n" +
            "    if (u_colorByTheta < 0.5) {\n" +
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
            "    float tVis = clamp(theta * 1.0, -1.0, 1.0);\n" +
            "    vec3 col = diverge(tVis);\n" +
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
            "varying vec3 v_pos;\n" +
            "vec3 diverge(float t) {\n" +
            "    float x = clamp((t+1.0)*0.5, 0.0, 1.0);\n" +
            "    vec3 c1 = vec3(0.15, 0.45, 1.0);\n" +  // blue
            "    vec3 c2 = vec3(1.0);\n" +               // white  
            "    vec3 c3 = vec3(1.0, 0.45, 0.0);\n" +    // orange-red
            "    return x < 0.5 ? mix(c1,c2, x/0.5) : mix(c2,c3,(x-0.5)/0.5);\n" +
            "}\n" +
            "void main() {\n" +
            "    if (u_colorByTheta < 0.5) {\n" +
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
            "    float tVis = clamp(theta * 1.0, -1.0, 1.0);\n" +
            "    vec3 col = diverge(tVis);\n" +
            "    gl_FragColor = vec4(col, 0.9);\n" +
            "}";

        this.gridProgram = this._createShaderProgram(gridVs, gridFs);
        
        if (!this.gridProgram) {
            console.error("CRITICAL: Failed to compile grid shaders!");
            return;
        }
        
        // Cache uniform locations for York-time coloring
        const gl = this.gl;
        this.gridUniforms = {
            mvpMatrix: gl.getUniformLocation(this.gridProgram, 'u_mvpMatrix'),
            colorByTheta: gl.getUniformLocation(this.gridProgram, 'u_colorByTheta'),
            sheetColor: gl.getUniformLocation(this.gridProgram, 'u_sheetColor'),
            axes: gl.getUniformLocation(this.gridProgram, 'u_axes'),
            driveDir: gl.getUniformLocation(this.gridProgram, 'u_driveDir'),
            wallWidth: gl.getUniformLocation(this.gridProgram, 'u_wallWidth'),
            vShip: gl.getUniformLocation(this.gridProgram, 'u_vShip')
        };
        
        console.log("Grid shader program compiled successfully with York-time coloring support");
    }

    updateUniforms(parameters) {
        if (!parameters) return;
        
        // Update internal parameters with operational mode integration
        this.currentParams = { ...this.currentParams, ...parameters };
        
        // Numeric coercion helper
        const N = v => (Number.isFinite(+v) ? +v : 0);
        const mode = parameters.currentMode || this.currentParams.currentMode || 'hover';

        // duty as fraction [0..1]
        const dutyFrac = (() => {
          const d = parameters.dutyCycle;
          if (d == null) return N(this.currentParams.dutyCycle);
          return d > 1 ? d/100 : N(d);
        })();

        // Mirror pipeline fields into uniforms for diagnostics
        this.uniforms = {
            ...this.uniforms,
            vizGain: 4,
            colorByTheta: 1,
            vShip: parameters.vShip || 1,
            wallWidth: parameters.wallWidth || 0.06,
            axesClip: parameters.axesClip || [0.4, 0.22, 0.22],
            driveDir: parameters.driveDir || [1, 0, 0],
            // NEW: Artificial gravity tilt parameters
            epsilonTilt: N(parameters.epsilonTilt || 0),
            epsilonTiltFloor: N(parameters.epsilonTiltFloor || 0),
            betaTiltVec: parameters.betaTiltVec || [0, -1, 0],
            tiltGain: N(parameters.tiltGain || 0.55),
            
            // Mirror pipeline fields for diagnostics
            currentMode: mode,
            dutyCycle: dutyFrac,
            gammaGeo: N(parameters.gammaGeo ?? parameters.g_y ?? this.currentParams.g_y),
            Qburst: N(parameters.Qburst ?? parameters.cavityQ ?? this.currentParams.cavityQ),
            deltaAOverA: N(parameters.deltaAOverA ?? parameters.qSpoilingFactor ?? 1),
            gammaVdB: N(parameters.gammaVdB ?? parameters.gammaVanDenBroeck ?? 1),
            sectors: Math.max(1, Math.floor(N(parameters.sectors ?? parameters.sectorStrobing ?? 1))),
            split: Math.max(0, Math.min(
                (N(parameters.sectors ?? parameters.sectorStrobing ?? 1)) - 1,
                Math.floor(N(parameters.split ?? ((mode === 'cruise' ? 0.65 : mode === 'emergency' ? 0.70 : 0.50) * N(parameters.sectors ?? parameters.sectorStrobing ?? 1))))
            )),
            viewAvg: parameters.viewAvg !== undefined ? !!parameters.viewAvg : true
        };
        
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
        // Get hull axes from uniforms or use needle hull defaults (in meters)
        const hullAxes = bubbleParams.hullAxes || [503.5, 132, 86.5]; // Semi-axes in meters
        // Enhanced wall thickness handling (meters vs normalized)
        const wallWidth_m = (bubbleParams.wallWidth_m ?? null) != null
            ? bubbleParams.wallWidth_m
            : (bubbleParams.wallWidth ?? 0.06) * 100; // Convert normalized to meters if needed
        
        // Single scene scale based on long semi-axis (scientifically faithful)
        const a = hullAxes[0], b = hullAxes[1], c = hullAxes[2];
        const sceneScale = 1.0 / a;  // Make long semi-axis = 1 scene unit
        const axesScene = [a * sceneScale, b * sceneScale, c * sceneScale]; // Exact aspect ratio [1, b/a, c/a]
        
        // Convert wall thickness to ρ-space using harmonic mean
        const aH = 3 / (1/a + 1/b + 1/c);  // Harmonic mean of semi-axes
        const w_rho = wallWidth_m / aH;     // Dimensionless wall thickness
        
        // Compute a grid span that comfortably contains the whole bubble
        const hullMaxClip = Math.max(axesScene[0], axesScene[1], axesScene[2]); // half-extent in clip space
        const spanPadding = bubbleParams.gridScale || GRID_DEFAULTS.spanPadding;
        const targetSpan = Math.max(
          GRID_DEFAULTS.minSpan,
          hullMaxClip * spanPadding
        );
        
        // Higher resolution for smoother canonical curvature
        const gridDivisions = 120; // increased from default for smoother profiles
        const driveDir = [1, 0, 0];               // +x is "aft" by convention
        const gridK = 0.12;                       // deformation gain
        
        // ---- Physics-accurate amplitude calculation (matches energy pipeline) ----
        
        // 1) Same multiplicative chain as the physics pipeline (display model):
        //    A_total ~ (gammaGeo^3) * qSpoilingFactor * gammaVdB
        //    (q_cavity is kept out of the display amplitude; it lives in ζ and losses)
        const gammaGeo = bubbleParams.gammaGeo || bubbleParams.g_y || 26;
        const geoAmp = Math.pow(gammaGeo, 3);                               // γ_geo^3
        const qSpoil = Math.max(1e-9, (bubbleParams.qSpoilingFactor || bubbleParams.deltaAOverA || 1)); // [0..1]
        const vdbAmp = Math.max(1.0, bubbleParams.gammaVanDenBroeck || bubbleParams.gammaVdB || 2.86e5);
        
        // 2) Duty / strobing: use the same effective definitions the server uses
        const sectors = Math.max(1, bubbleParams.sectors || bubbleParams.sectorStrobing || 1);
        
        // Instantaneous (during a hot sector burst)
        const dutyBurst_fs = Math.max(1e-12, bubbleParams.dutyBurst || 5e-16); // e.g. 0.5 fs
        const dutyInstEff = dutyBurst_fs * (1 / sectors);
        
        // Time-averaged (what the UI cards show next to power)
        const dutyGlobal = Math.max(1e-12, bubbleParams.dutyCycle || 0.14);
        const dutyAvgEff = dutyGlobal * qSpoil * (1 / sectors);
        
        // 3) Build an amplitude consistent with the energy-side scaling.
        //    Keep purely visual normalization so it doesn't explode on screen.
        const A_phys = geoAmp * qSpoil * vdbAmp;    // physics-like chain
        const norm = (this.uniforms?.vizNorm || 1.0e-9);  // visual normalizer
        const A_vis_base = A_phys * norm;
        
        // 4) Choose instant vs average (no √duty hacks)
        const viewAvg = bubbleParams.viewAvg || 1.0;         // 1 = show GR average
        const A_inst = A_vis_base * dutyInstEff;
        const A_avg = A_vis_base * dutyAvgEff;
        const A_used = (viewAvg >= 0.5) ? A_avg : A_inst;
        
        // 5) Optional viewer gain (like your old betaGain) to make it legible
        const gain = (this.uniforms?.vizGain || 4.0);
        const betaVis = A_used * gain;
        
        console.log(`🔗 SCIENTIFIC ELLIPSOIDAL NATÁRIO SHELL:`);
        console.log(`  Hull: [${a.toFixed(1)}, ${b.toFixed(1)}, ${c.toFixed(1)}] m → scene: [${axesScene.map(x => x.toFixed(3)).join(', ')}]`);
        console.log(`  Wall: ${wallWidth_m} m → ρ-space: ${w_rho.toFixed(4)} (aH=${aH.toFixed(1)})`);
        console.log(`  Grid: span=${targetSpan.toFixed(2)} (hull_max=${hullMaxClip.toFixed(3)} × ${spanPadding})`);
        console.log(`  🔬 PHYSICS SCALING: γ³=${geoAmp.toExponential(2)}, qSpoil=${qSpoil.toFixed(3)}, γVdB=${vdbAmp.toExponential(2)}`);
        console.log(`  📊 DUTY FACTORS: instant=${dutyInstEff.toExponential(2)}, avg=${dutyAvgEff.toExponential(2)} (sectors=${sectors})`);
        console.log(`  β_phys=${A_phys.toExponential(2)} → β_vis=${betaVis.toExponential(2)} (norm=${norm.toExponential(0)})`);
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

        const split = bubbleParams.split || Math.floor((bubbleParams.phaseSplit || 0.5) * sectors);
        
        // Read mode uniforms with sane defaults (renamed to avoid conflicts)
        const dutyCycleUniform = this.uniforms?.dutyCycle ?? 0.14;
        const sectorsUniform    = Math.max(1, Math.floor(this.uniforms?.sectors ?? 1));
        const splitUniform      = Math.max(0, Math.min(sectorsUniform - 1, this.uniforms?.split ?? 0));
        const viewAvgUniform    = this.uniforms?.viewAvg ?? true;

        const gammaGeoUniform = this.uniforms?.gammaGeo ?? 26;
        const QburstUniform   = this.uniforms?.Qburst   ?? 1e9;
        const qSpoilUniform   = this.uniforms?.deltaAOverA ?? 1.0;
        const gammaVdBUniform = this.uniforms?.gammaVdB ?? 2.86e5;

        const hullAxesUniform = this.uniforms?.hullAxes ?? [503.5,132,86.5];
        const wallWidthUniform = this.uniforms?.wallWidth ?? 0.016;  // 16 nm default

        // Physics-consistent amplitude and averaged duty
        const A_geoUniform = gammaGeoUniform * gammaGeoUniform * gammaGeoUniform; // γ_geo^3 amplification
        const effDutyUniform = viewAvgUniform ? Math.max(1e-12, dutyCycleUniform / Math.max(1, sectorsUniform)) : 1.0;
        
        const betaInstUniform = A_geoUniform * QburstUniform * gammaVdBUniform * qSpoilUniform;
        const betaAvgUniform  = betaInstUniform * Math.sqrt(effDutyUniform);
        const betaUsedUniform = viewAvgUniform ? betaAvgUniform : betaInstUniform;
        
        const betaGainUniform = this.uniforms?.betaGain ?? 0.15;
        const betaVisUniform  = betaUsedUniform * betaGainUniform;

        // Debug per mode (once per 60 frames)
        if ((this._dbgTick = (this._dbgTick||0)+1) % 60 === 0) {
            console.log("🧪 warp-mode", {
                mode: this.uniforms?.currentMode, duty: dutyCycleUniform, sectors: sectorsUniform, 
                split: splitUniform, viewAvg: viewAvgUniform, A_geo: A_geoUniform, effDuty: effDutyUniform, 
                betaInst: betaInstUniform.toExponential(2), betaAvg: betaAvgUniform.toExponential(2), 
                betaVis: betaVisUniform.toExponential(2)
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
            
            // --- Mode gains ---
            const modeAmp = (this.currentParams.modeCurvatureAmplifier || 1.0);
            const modeViz = (this.currentParams.modeVisualScale || 1.0);
            
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
            const w_rho_local = wallWidth_m / R_eff;   // thickness in ρ-units
            
            // === CANONICAL NATÁRIO: Remove micro-bumps for smooth profile ===
            // For canonical Natário bubble, disable local gaussian bumps
            const gaussian_local = 1.0; // smooth canonical profile (no organ-pipe bumps)
            
            // --- (C) Gentler wall window for canonical smoothness ---
            const asd = Math.abs(sd), a = 3.5*w_rho_local, b = 5.0*w_rho_local;
            const wallWin = (asd<=a) ? 1 : (asd>=b) ? 0
                           : 0.5*(1 + Math.cos(Math.PI*(asd-a)/(b-a))); // gentle falloff
            
            // === LOGARITHMIC COMPRESSION TO PREVENT SATURATION ===
            // Pull uniforms for current mode and parameters
            const gammaGeo = this.uniforms?.gammaGeo ?? 26;
            const Qburst   = this.uniforms?.Qburst   ?? this.uniforms?.cavityQ ?? 1e9;
            const qSpoil   = this.uniforms?.deltaAOverA ?? this.uniforms?.qSpoilingFactor ?? 1.0;
            const gammaVdB = this.uniforms?.gammaVdB ?? 2.86e5;
            const duty     = Math.max(0, Math.min(1, this.uniforms?.dutyCycle ?? 0.14));
            const sectors  = Math.max(1, this.uniforms?.sectors ?? 1);
            const mode     = (this.uniforms?.currentMode || 'hover').toLowerCase();

            // Physics amplitude (gross, unbounded)
            const A_geo   = gammaGeo * gammaGeo * gammaGeo; // γ^3
            const dutyEff = Math.sqrt(duty / sectors);      // visual proxy like before
            const A_gross = A_geo * Qburst * gammaVdB * qSpoil * dutyEff;

            // Log compression so modes separate visually instead of saturating
            const k = 1e10;           // knee – prevents standby from saturating
            const s = 1.0;            // slope after log
            const A_log = Math.log10(1 + A_gross / k) * s; // 0 … ~few

            // Mode-specific visual scaling (keeps standby very small)
            const modeScale =
              mode === 'standby'  ? 0.05 :
              mode === 'cruise'   ? 0.25 :
              mode === 'hover'    ? 0.60 :
              mode === 'emergency'? 0.90 : 0.50;

            // Optional manual override from UI uniform (0 disables override)
            const gainOverride = this.uniforms?.vizGainOverride ?? 0;
            const vizGain = gainOverride > 0 ? gainOverride : modeScale;

            // Final bounded visual amplitude 0..1
            const A_vis = Math.min(1.0, A_log * vizGain);

            // Special case: make standby perfectly flat if desired
            let disp;
            if (mode === 'standby') {
                disp = 0; // perfectly flat grid for standby mode
            } else {
                // Normal displacement calculation with compressed amplitude
                disp = gridK * A_vis * wallWin * front * sgn * gaussian_local;
                
                // Reduced visual gain to avoid clamp flattening + higher ceiling
                disp *= 2.0; // lower than 4.0 to avoid hitting clamp
                
                // Soft clamp with higher ceiling (no jaggies)
                const maxPush = 0.15;                        // slightly higher ceiling
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
            const eps = Math.max(
              0,
              (this.uniforms?.epsilonTilt || 0),
              (this.uniforms?.epsilonTiltFloor || 0)
            ); // dimensionless

            const btilt = this.uniforms?.betaTiltVec || [0, -1, 0];    // "down"
            const gtilt = this.uniforms?.tiltGain ?? 0.35;             // visual knob

            // unit "down" vector
            const bmag = Math.hypot(btilt[0], btilt[1], btilt[2]) || 1;
            const bhat = [btilt[0]/bmag, btilt[1]/bmag, btilt[2]/bmag];

            // smooth interior window (≈1 well inside, 0 outside) using local wall thickness
            const w   = Math.max(1e-6, w_rho_local);
            const t   = (1.0 + 2.0*w - rho) / (4.0*w);        // maps [1-2w, 1+2w] → [1,0]
            const winInterior = Math.max(0.0, Math.min(1.0, t)); 
            const winSmooth   = winInterior * winInterior * (3.0 - 2.0 * winInterior); // smoothstep

            // tie tilt strength to the same visual amplitude used for the wall
            // so modes scale naturally (standby≈0, cruise<hover<emergency)
            const A_tilt = A_vis;   // <- already computed above

            // final, bounded tilt displacement
            const dispTilt = A_tilt * eps * gtilt * winSmooth;

            // nudge the vertex along the cabin "down" direction
            vtx[i    ] += bhat[0] * dispTilt;
            vtx[i + 1] += bhat[1] * dispTilt;
            vtx[i + 2] += bhat[2] * dispTilt;
            // ----- end interior gravity -----

            // Canonical Natário wall displacement (unchanged)
            vtx[i]     = vtx[i]     - n[0] * disp;
            vtx[i + 1] = vtx[i + 1] - n[1] * disp;
            vtx[i + 2] = vtx[i + 2] - n[2] * disp;
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
        this.uniforms.hullDimensions = { a, b, c, aH, sceneScale, wallWidth_m };
        
        // Regenerate grid with proper span for hull size
        if (Math.abs(targetSpan - this.currentGridSpan) > 0.1) {
            console.log(`🔄 Regenerating grid: ${this.currentGridSpan || 'initial'} → ${targetSpan.toFixed(2)}`);
            this.currentGridSpan = targetSpan;
            const newGridData = this._createGrid(targetSpan, gridDivisions);
            
            // Update both current and original vertices
            this.gridVertices = newGridData;
            this.originalGridVertices = new Float32Array(newGridData);
            
            // Upload new geometry to GPU
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridVbo);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.gridVertices, this.gl.DYNAMIC_DRAW);
            
            console.log(`✓ Grid regenerated with span=${targetSpan.toFixed(2)} for hull [${a}×${b}×${c}]m`);
            
            // Adjust camera framing for larger grids
            this._adjustCameraForSpan(targetSpan);
        }
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
        
        // Bind vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
        const positionLocation = gl.getAttribLocation(this.gridProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        
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
        gl.uniform1f(this.gridUniforms.wallWidth, this.uniforms?.wallWidth || 0.06);
        gl.uniform1f(this.gridUniforms.vShip, this.uniforms?.vShip || 1.0);
        
        // Render as lines for better visibility
        const vertexCount = this.gridVertices.length / 3;
        gl.drawArrays(gl.LINES, 0, vertexCount);
        
        console.log(`Rendered ${vertexCount} grid lines with 3D perspective - should now be visible!`);
        
        // Clean up
        gl.disableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _renderLoop() {
        this._render();
        requestAnimationFrame(() => this._renderLoop());
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

    // === Natário Diagnostics (viewer-only, does not affect physics) ===
    _computePipelineBetas(U){
        const sectors      = Math.max(1, U.sectorCount || U.sectorStrobing || 1);
        const gammaGeo     = U.gammaGeo || 0;
        const Qburst       = (U.Qburst ?? U.cavityQ) || 0;
        const dAa          = (U.deltaAOverA ?? U.qSpoilingFactor ?? 1.0);
        const gammaVdB     = U.gammaVdB || 1.0;

        const betaInst = gammaGeo * Qburst * dAa * Math.pow(gammaVdB, 0.25);
        const betaAvg  = betaInst * Math.sqrt(Math.max(1e-9, (U.dutyCycle || 0) / sectors));
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
        return {
            mode: U.currentMode||'hover',
            duty: U.dutyCycle, gammaGeo: U.gammaGeo, Q: (U.Qburst??U.cavityQ),
            dA_over_A:(U.deltaAOverA??U.qSpoilingFactor), gammaVdB:(U.gammaVdB||1),
            sectors:P.sectors, phase:P.phase,
            beta_inst:P.betaInst, beta_avg:P.betaAvg, beta_net:P.betaNet,
            theta_front_max:Y.thetaFrontMax, theta_front_min:Y.thetaFrontMin,
            theta_rear_max:Y.thetaRearMax,   theta_rear_min:Y.thetaRearMin,
            T00_avg_proxy:Y.T00avg, sigma_eff:1/Math.max(1e-4, U.wallWidth||0.06),
            york_sign_ok: (Y.thetaFrontMin<0 && Y.thetaRearMax>0),
            hover_sym_ok: (Math.abs(P.phase-0.5)<1e-3) && (Math.abs(frontAbs-rearAbs)<0.1*frontAbs+1e-6)
        };
    }

    destroy() {
        window.removeEventListener('resize', this._resize);
        if (this.gridVbo) {
            this.gl.deleteBuffer(this.gridVbo);
        }
        if (this.gridProgram) {
            this.gl.deleteProgram(this.gridProgram);
        }
    }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
    console.log("WarpEngine class loaded - OPERATIONAL MODE INTEGRATION", Date.now());
}