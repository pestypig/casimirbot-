/**
 * warp-patch.js — Drop-in theory patch for your Natário Visualizer
 * 
 * How to use:
 *   1) Load your original engine first, then this file:
 *        <script src="warp-engine-fresh.js"></script>
 *        <script src="warp-patch.js"></script>
 *   2) New instances use the patched class automatically: new window.WarpEngine(canvas)
 * 
 * What it adds:
 *   - Ellipsoidal shell (needle hull) instead of a spherical blob
 *   - Sector strobing (+β / –β) with HOVER / CRUISE modes
 *   - Instantaneous vs GR averaged view (burst vs duty+sector-averaged)
 *   - Natário "tilt" (tiny β-gradient) for artificial gravity demo
 *   - γ_geo, Q_burst, Δa/a uniforms that actually drive β
 *   - Grid "exotic" flag echoes when net exotic is active
 */

(function(){
  if (typeof window === 'undefined' || typeof window.WarpEngine === 'undefined') {
    console.error('[warp-patch] window.WarpEngine not found. Load your original engine before this patch.');
    return;
  }

  const Base = window.WarpEngine;
  window.__OriginalWarpEngine = Base;

  class PatchedWarpEngine extends Base {
    constructor(canvas){
      super(canvas);
      // Extend default uniforms with theory knobs
      if (!this.uniforms) this.uniforms = {};
      Object.assign(this.uniforms, {
        gammaGeo: 25.0,          // concave blue-shift gain γ_geo
        Qburst: 1e9,             // burst Q during the on-window
        deltaAOverA: 0.05,       // fractional boundary stroke (Δa/a)
        sectorCount: 400.0,      // sectors around the ring
        phaseSplit: 0.5,         // fraction of +β sectors (0.5=HOVER)
        viewAvg: 1.0,            // 0=instantaneous, 1=GR cycle-average
        axesClip: [0.35, 0.22, 0.22], // ellipsoid semi-axes (x,y,z) in clip coords
        betaGradient: [0.0, -0.02, 0.0], // subtle "down" for TILT demo
        sectorSpeed: 2.0         // revolutions per second of the active wedge
      });
      // Provide a simple mode API out of the box
      this.mode = 'HOVER';
      if (typeof this.setMode === 'function') {
        this.setMode('HOVER');
      }
      console.log('[warp-patch] Patched WarpEngine active.');
    }

    // === Helper API ===
    setMode(mode){
      this.mode = mode;
      if (mode === 'HOVER'){
        this.uniforms.phaseSplit   = 0.5;
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'CRUISE'){
        this.uniforms.phaseSplit   = 0.65; // tweak as you like
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'TILT'){
        this.uniforms.phaseSplit   = 0.5;
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0.0, -0.02, 0.0];
      }
    }
    setEllipsoidAxes(x, y, z){ this.uniforms.axesClip = [x,y,z]; }
    toggleInstantaneous(showInstant){ this.uniforms.viewAvg = showInstant? 0.0 : 1.0; }

    // === Override to install our fragment shader (keep your grid shaders) ===
    _compileShaders(){
      const gl = this.gl;
      const isWebGL2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');

      // Vertex shader: same full-screen quad
      const vs = isWebGL2 ?
        "#version 300 es\n" +
        "in vec2 a_position;\n" +
        "out vec2 v_uv;\n" +
        "void main(){ v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position,0.0,1.0);}"
      :
        "attribute vec2 a_position;\n" +
        "varying vec2 v_uv;\n" +
        "void main(){ v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position,0.0,1.0);}";
      
      // Fragment shader: ellipsoid + sector strobing + tilt
      const fs_webgl2 =
        "#version 300 es\n"
      + "precision highp float;\n"
      + "uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;\n"
      + "uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;\n"
      + "uniform vec3  u_axesClip;\n"
      + "uniform vec3  u_betaGradient;\n"
      + "in vec2 v_uv;\n"
      + "out vec4 fragColor;\n"
      + "float sdEllipsoid(vec3 p, vec3 a){ vec3 q = p / a; return length(q) - 1.0; }\n"
      + "void main(){\n"
      + "  vec2 p2 = (v_uv - 0.5) * 2.0;\n"
      + "  vec3 p  = vec3(p2.x, 0.0, p2.y);\n"
      + "  float w = 0.06;\n"
      + "  float sd = sdEllipsoid(p, u_axesClip);\n"
      + "  float ring = exp(- (sd*sd) / (w*w));\n"
      + "  float theta = atan(p.z, p.x);\n"
      + "  theta = (theta < 0.0) ? theta + 6.28318530718 : theta;\n"
      + "  float wedge = floor(theta / (6.28318530718 / max(1.0, u_sectorCount)));\n"
      + "  float idx = mod(wedge + u_sectorIndex, u_sectorCount);\n"
      + "  float split = floor(u_phaseSplit * u_sectorCount);\n"
      + "  float signBeta = (idx < split) ? 1.0 : -1.0;\n"
      + "  float beta_inst = u_gammaGeo * u_Qburst * u_deltaAOverA * ring;\n"
      + "  float beta_avg  = beta_inst * sqrt(max(1e-9, u_dutyCycle / max(1.0, u_sectorCount)));\n"
      + "  float beta_core = mix(beta_inst, beta_avg, clamp(u_viewAvg,0.0,1.0));\n"
      + "  float beta_amp  = (u_g_y > 0.0 ? u_g_y : 1.0) * beta_core;\n"
      + "  float beta      = signBeta * beta_amp;\n"
      + "  beta += dot(u_betaGradient, p);\n"
      + "  float intensity = clamp(abs(beta) * 3.0, 0.0, 1.0);\n"
      + "  vec3 base = vec3(0.05,0.10,0.15);\n"
      + "  vec3 warp = vec3(1.0,0.5,0.0);\n"
      + "  vec3 color = mix(base, warp, intensity);\n"
      + "  fragColor = vec4(color, 1.0);\n"
      + "}\n";

      const fs_webgl1 =
        "precision highp float;\n"
      + "uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;\n"
      + "uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;\n"
      + "uniform vec3  u_axesClip;\n"
      + "uniform vec3  u_betaGradient;\n"
      + "varying vec2 v_uv;\n"
      + "float sdEllipsoid(vec3 p, vec3 a){ vec3 q = p / a; return length(q) - 1.0; }\n"
      + "void main(){\n"
      + "  vec2 p2 = (v_uv - 0.5) * 2.0; vec3 p = vec3(p2.x, 0.0, p2.y);\n"
      + "  float w = 0.06; float sd = sdEllipsoid(p, u_axesClip);\n"
      + "  float ring = exp(- (sd*sd) / (w*w));\n"
      + "  float theta = atan(p.z, p.x); theta = (theta < 0.0) ? theta + 6.28318530718 : theta;\n"
      + "  float wedge = floor(theta / (6.28318530718 / max(1.0, u_sectorCount)));\n"
      + "  float idx = mod(wedge + u_sectorIndex, u_sectorCount);\n"
      + "  float split = floor(u_phaseSplit * u_sectorCount);\n"
      + "  float signBeta = (idx < split) ? 1.0 : -1.0;\n"
      + "  float beta_inst = u_gammaGeo * u_Qburst * u_deltaAOverA * ring;\n"
      + "  float beta_avg  = beta_inst * sqrt(max(1e-9, u_dutyCycle / max(1.0, u_sectorCount)));\n"
      + "  float beta_core = mix(beta_inst, beta_avg, clamp(u_viewAvg,0.0,1.0));\n"
      + "  float beta_amp  = (u_g_y > 0.0 ? u_g_y : 1.0) * beta_core;\n"
      + "  float beta      = signBeta * beta_amp;\n"
      + "  beta += dot(u_betaGradient, p);\n"
      + "  float intensity = clamp(abs(beta) * 3.0, 0.0, 1.0);\n"
      + "  vec3 base = vec3(0.05,0.10,0.15); vec3 warp = vec3(1.0,0.5,0.0);\n"
      + "  vec3 color = mix(base, warp, intensity);\n"
      + "  gl_FragColor = vec4(color, 1.0);\n"
      + "}\n";

      const fs = isWebGL2 ? fs_webgl2 : fs_webgl1;

      const program = this._linkProgram(vs, fs);
      if (!program) {
        console.error('[warp-patch] Failed to link patched main program; falling back to original.');
        // try original compile if available
        if (super._compileShaders) super._compileShaders();
        return;
      }
      this.program = program;

      // Rebuild grid shaders with your existing method
      if (typeof this._compileGridShaders === 'function') {
        this._compileGridShaders();
      }
    }

    _cacheUniformLocations(){
      super._cacheUniformLocations && super._cacheUniformLocations();
      const gl = this.gl;
      gl.useProgram(this.program);
      // main (existing) uLoc keys already set by base
      this.uLoc.gammaGeo     = gl.getUniformLocation(this.program, "u_gammaGeo");
      this.uLoc.Qburst       = gl.getUniformLocation(this.program, "u_Qburst");
      this.uLoc.deltaAOverA  = gl.getUniformLocation(this.program, "u_deltaAOverA");
      this.uLoc.sectorCount  = gl.getUniformLocation(this.program, "u_sectorCount");
      this.uLoc.phaseSplit   = gl.getUniformLocation(this.program, "u_phaseSplit");
      this.uLoc.viewAvg      = gl.getUniformLocation(this.program, "u_viewAvg");
      this.uLoc.sectorIndex  = gl.getUniformLocation(this.program, "u_sectorIndex");
      this.uLoc.axesClip     = gl.getUniformLocation(this.program, "u_axesClip");
      this.uLoc.betaGradient = gl.getUniformLocation(this.program, "u_betaGradient");
    }

    _draw(time){
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.05, 0.1, 0.15, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // ----- MAIN PROGRAM (warp quad) -----
      gl.useProgram(this.program);
      gl.uniform1f(this.uLoc.time, time);
      gl.uniform1f(this.uLoc.dutyCycle,     this.uniforms.dutyCycle || 0.14);
      gl.uniform1f(this.uLoc.g_y,           this.uniforms.g_y || 26.0);
      gl.uniform1f(this.uLoc.cavityQ,       this.uniforms.cavityQ || 1e9);
      gl.uniform1f(this.uLoc.sagDepth_nm,   this.uniforms.sagDepth_nm || 16.0);
      gl.uniform1f(this.uLoc.tsRatio,       this.uniforms.tsRatio || 4100.0);
      gl.uniform1f(this.uLoc.powerAvg_MW,   this.uniforms.powerAvg_MW || 83.3);
      gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg || 1405.0);

      // New theory uniforms
      const sectorCount = this.uniforms.sectorCount || 400.0;
      const sectorIndex = (time * (this.uniforms.sectorSpeed || 2.0) * sectorCount) % sectorCount;
      gl.uniform1f(this.uLoc.gammaGeo,     this.uniforms.gammaGeo);
      gl.uniform1f(this.uLoc.Qburst,       this.uniforms.Qburst);
      gl.uniform1f(this.uLoc.deltaAOverA,  this.uniforms.deltaAOverA);
      gl.uniform1f(this.uLoc.sectorCount,  sectorCount);
      gl.uniform1f(this.uLoc.phaseSplit,   this.uniforms.phaseSplit);
      gl.uniform1f(this.uLoc.viewAvg,      this.uniforms.viewAvg);
      gl.uniform1f(this.uLoc.sectorIndex,  sectorIndex);

      const ax = this.uniforms.axesClip || [0.35,0.22,0.22];
      gl.uniform3f(this.uLoc.axesClip, ax[0], ax[1], ax[2]);
      const bg = this.uniforms.betaGradient || [0,0,0];
      gl.uniform3f(this.uLoc.betaGradient, bg[0], bg[1], bg[2]);

      // Keep your original β chain for continuity (not used in FS math but safe)
      const currentBeta0 = this.uniforms.beta0 || (this.uniforms.dutyCycle * this.uniforms.g_y);
      gl.uniform1f(this.uLoc.beta0, currentBeta0);

      // Draw the full-screen quad without depth writes
      gl.depthMask(false);
      this._renderQuad();
      gl.depthMask(true);

      // ----- GRID PROGRAM -----
      gl.enable(gl.DEPTH_TEST);
      this._updateGrid && this._updateGrid();

      // Echo "exotic-on" periods when net β ≠ 0 or showing instantaneous view
      const exoticOn = (this.uniforms.viewAvg < 0.5 || Math.abs(this.uniforms.phaseSplit - 0.5) > 1e-3) ? 1.0 : 0.0;
      if (this.gridProgram && this.gridUniforms && this.gridUniforms.energyFlag) {
        gl.useProgram(this.gridProgram);
        gl.uniform1f(this.gridUniforms.energyFlag, exoticOn);
      }
      // Draw grid with your existing routine
      this._renderGridPointsFixed && this._renderGridPointsFixed();
      gl.disable(gl.DEPTH_TEST);
    }
  }

  // Replace the global class
  window.WarpEngine = PatchedWarpEngine;
  console.log('[warp-patch] Installed. New instances will use the patched engine.');
})();