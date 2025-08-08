//====================================================================
//  Natário Warp‑Bubble Visualiser — Unified Engine (v3.1)
//  ------------------------------------------------------------------
//  Single-file WebGL engine with theory-aware controls:
//   • Ellipsoidal wall (needle hull) via SDF
//   • Sector strobing (+β / –β) with HOVER / CRUISE modes
//   • Instantaneous vs GR averaged view (burst vs duty+sector-avg)
//   • Natário "tilt" (tiny β-gradient) for artificial gravity demo
//   • γ_geo, Q_burst, Δa/a actually drive β intensity
//   • 3 orthogonal grid sheets w/ exotic-on echo
//   • WebGL2→WebGL1→2D fallback
//====================================================================

(function(){
  class WarpEngine {
    constructor(canvas){
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2') ||
                canvas.getContext('webgl')  ||
                canvas.getContext('experimental-webgl');

      // Default uniforms (theory + legacy)
      this.uniforms = {
        dutyCycle: 0.14, g_y: 26.0, cavityQ: 1e9, sagDepth_nm: 16.0,
        tsRatio: 4102.74, powerAvg_MW: 83.3, exoticMass_kg: 1405.0,
        // New theory knobs
        gammaGeo: 25.0, Qburst: 1e9, deltaAOverA: 0.05,
        sectorCount: 400.0, phaseSplit: 0.5, viewAvg: 1.0, // 1=average
        axesClip: [0.35, 0.22, 0.22],                      // ellipsoid (x,y,z)
        betaGradient: [0.0, -0.02, 0.0],                   // subtle tilt
        sectorSpeed: 2.0
      };
      this.mode = 'HOVER';

      if (!this.gl){
        this._createFallback2D();
        return;
      }

      this.hasDerivatives = !!this.gl.getExtension('OES_standard_derivatives');
      this._compileMainProgram();
      this._compileGridShaders();
      this._initQuad();
      this._initGrid();

      this._cacheUniformLocations();

      this.gl.enable(this.gl.DEPTH_TEST);
      this._resize();
      window.addEventListener('resize', () => this._resize());
      this._startRenderLoop();
      console.log('WarpEngine v3.1 — unified build ready.');
    }

    //===================== Public helpers =====================
    setMode(mode){
      this.mode = mode;
      if (mode === 'HOVER'){
        this.uniforms.phaseSplit   = 0.5;
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'CRUISE'){
        this.uniforms.phaseSplit   = 0.65;
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'TILT'){
        this.uniforms.phaseSplit   = 0.5;
        this.uniforms.viewAvg      = 1.0;
        this.uniforms.betaGradient = [0.0,-0.02,0.0];
      }
    }
    setEllipsoidAxes(x,y,z){ this.uniforms.axesClip = [x,y,z]; }
    toggleInstantaneous(show){ this.uniforms.viewAvg = show? 0.0 : 1.0; }
    updateUniforms(params){ Object.assign(this.uniforms, params); }

    //===================== Fallback 2D =====================
    _createFallback2D(){
      this.ctx2d = this.canvas.getContext('2d');
      this.isWebGLFallback = true;
      const loop = ()=>{
        if (!this.ctx2d) return;
        const {width, height} = this.canvas;
        this.ctx2d.fillStyle = '#0A1420';
        this.ctx2d.fillRect(0,0,width,height);
        this.ctx2d.fillStyle = '#00FFFF';
        this.ctx2d.font = '12px monospace';
        this.ctx2d.fillText('WebGL unavailable — 2D fallback', 12, 24);
        this.ctx2d.fillText(`γ_geo=${this.uniforms.gammaGeo.toFixed(1)}  Q=${this.uniforms.Qburst.toExponential(1)}`, 12, 42);
        const cx=width/2, cy=height/2, r=Math.min(width,height)*0.3;
        this.ctx2d.strokeStyle='#FF7F00'; this.ctx2d.lineWidth=2;
        this.ctx2d.beginPath(); this.ctx2d.ellipse(cx, cy, r*1.3, r*0.8, 0, 0, Math.PI*2); this.ctx2d.stroke();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    //===================== GL Setup =====================
    _resize(){
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.floor(this.canvas.clientWidth * dpr);
      const h = Math.floor(this.canvas.clientHeight * dpr);
      if (this.canvas.width !== w || this.canvas.height !== h){
        this.canvas.width = w; this.canvas.height = h;
      }
    }

    _compileMainProgram(){
      const gl = this.gl;
      const isWebGL2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');
      const vs = isWebGL2 ?
        `#version 300 es
        in vec2 a_position;
        out vec2 v_uv;
        void main(){ v_uv = a_position*0.5+0.5; gl_Position = vec4(a_position,0.0,1.0); }`
      :
        `attribute vec2 a_position;
         varying vec2 v_uv;
         void main(){ v_uv = a_position*0.5+0.5; gl_Position = vec4(a_position,0.0,1.0); }`;

      const fs2 =
        `#version 300 es
         precision highp float;
         uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;
         uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;
         uniform vec3  u_axesClip; uniform vec3 u_betaGradient;
         in vec2 v_uv; out vec4 fragColor;
         float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
         void main(){
           vec2 p2 = (v_uv-0.5)*2.0; vec3 p = vec3(p2.x, 0.0, p2.y);
           float w = 0.06; float sd = sdEllipsoid(p, u_axesClip);
           float ring = exp(-(sd*sd)/(w*w)); // peak at shell
           float theta = atan(p.z,p.x); theta = theta<0.0 ? theta+6.28318530718 : theta;
           float wedge = floor(theta / (6.28318530718 / max(1.0,u_sectorCount)));
           float idx = mod(wedge + u_sectorIndex, u_sectorCount);
           float split = floor(u_phaseSplit * u_sectorCount);
           float signBeta = (idx < split) ? 1.0 : -1.0;
           float beta_inst = u_gammaGeo * u_Qburst * u_deltaAOverA * ring;
           float beta_avg  = beta_inst * sqrt(max(1e-9, u_dutyCycle / max(1.0, u_sectorCount)));
           float beta_core = mix(beta_inst, beta_avg, clamp(u_viewAvg,0.0,1.0));
           float beta_amp  = (u_g_y>0.0?u_g_y:1.0) * beta_core;
           float beta      = signBeta * beta_amp + dot(u_betaGradient,p);
           float intensity = clamp(abs(beta)*3.0, 0.0, 1.0);
           vec3 base=vec3(0.05,0.10,0.15), warp=vec3(1.0,0.5,0.0);
           fragColor = vec4(mix(base,warp,intensity),1.0);
         }`;

      const fs1 =
        `precision highp float;
         uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;
         uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;
         uniform vec3  u_axesClip; uniform vec3 u_betaGradient;
         varying vec2 v_uv;
         float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
         void main(){
           vec2 p2 = (v_uv-0.5)*2.0; vec3 p = vec3(p2.x,0.0,p2.y);
           float w=0.06; float sd = sdEllipsoid(p, u_axesClip);
           float ring = exp(-(sd*sd)/(w*w));
           float theta = atan(p.z,p.x); theta = theta<0.0 ? theta+6.28318530718 : theta;
           float wedge = floor(theta / (6.28318530718 / max(1.0,u_sectorCount)));
           float idx = mod(wedge + u_sectorIndex, u_sectorCount);
           float split = floor(u_phaseSplit * u_sectorCount);
           float signBeta = (idx < split) ? 1.0 : -1.0;
           float beta_inst = u_gammaGeo * u_Qburst * u_deltaAOverA * ring;
           float beta_avg  = beta_inst * sqrt(max(1e-9, u_dutyCycle / max(1.0, u_sectorCount)));
           float beta_core = mix(beta_inst, beta_avg, clamp(u_viewAvg,0.0,1.0));
           float beta_amp  = (u_g_y>0.0?u_g_y:1.0) * beta_core;
           float beta      = signBeta * beta_amp + dot(u_betaGradient,p);
           float intensity = clamp(abs(beta)*3.0, 0.0, 1.0);
           vec3 base=vec3(0.05,0.10,0.15), warp=vec3(1.0,0.5,0.0);
           gl_FragColor = vec4(mix(base,warp,intensity),1.0);
         }`;

      this.program = this._linkProgram(vs, isWebGL2 ? fs2 : fs1);
    }

    _compileGridShaders(){
      const gl = this.gl;
      const isWebGL2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');
      const gridVs = isWebGL2 ?
        `#version 300 es
         in vec3 a_position; uniform mat4 u_mvpMatrix;
         void main(){ gl_Position = u_mvpMatrix*vec4(a_position,1.0); }`
      :
        `attribute vec3 a_position; uniform mat4 u_mvpMatrix;
         void main(){ gl_Position = u_mvpMatrix*vec4(a_position,1.0); }`;

      const gridFs2 =
        `#version 300 es
         precision highp float; uniform float u_energyFlag; uniform vec3 u_sheetColor;
         out vec4 frag; void main(){ vec3 c=(u_energyFlag>0.5)?vec3(1.0,0.0,1.0):u_sheetColor; frag=vec4(c,0.8);} `;
      const gridFs1 =
        `precision highp float; uniform float u_energyFlag; uniform vec3 u_sheetColor;
         void main(){ vec3 c=(u_energyFlag>0.5)?vec3(1.0,0.0,1.0):u_sheetColor; gl_FragColor=vec4(c,0.8);} `;

      this.gridProgram = this._linkProgram(gridVs, isWebGL2 ? gridFs2 : gridFs1);
      const glp = this.gridProgram;
      this.gridUniforms = {
        mvpMatrix: gl.getUniformLocation(glp, 'u_mvpMatrix'),
        position:  gl.getAttribLocation(glp, 'a_position'),
        energyFlag:gl.getUniformLocation(glp, 'u_energyFlag'),
        sheetColor:gl.getUniformLocation(glp, 'u_sheetColor')
      };
    }

    _linkProgram(vsSrc, fsSrc){
      const gl = this.gl;
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, vsSrc); gl.compileShader(vs);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
        console.error('VS error:', gl.getShaderInfoLog(vs));
        return null;
      }
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, fsSrc); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
        console.error('FS error:', gl.getShaderInfoLog(fs));
        return null;
      }
      const prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){
        console.error('Link error:', gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    }

    _cacheUniformLocations(){
      const gl = this.gl;
      gl.useProgram(this.program);
      this.uLoc = {
        time: gl.getUniformLocation(this.program,'u_time'),
        dutyCycle: gl.getUniformLocation(this.program,'u_dutyCycle'),
        g_y: gl.getUniformLocation(this.program,'u_g_y'),
        cavityQ: gl.getUniformLocation(this.program,'u_cavityQ'),
        sagDepth_nm: gl.getUniformLocation(this.program,'u_sagDepth_nm'),
        tsRatio: gl.getUniformLocation(this.program,'u_tsRatio'),
        powerAvg_MW: gl.getUniformLocation(this.program,'u_powerAvg_MW'),
        exoticMass_kg: gl.getUniformLocation(this.program,'u_exoticMass_kg'),
        gammaGeo: gl.getUniformLocation(this.program,'u_gammaGeo'),
        Qburst: gl.getUniformLocation(this.program,'u_Qburst'),
        deltaAOverA: gl.getUniformLocation(this.program,'u_deltaAOverA'),
        sectorCount: gl.getUniformLocation(this.program,'u_sectorCount'),
        phaseSplit: gl.getUniformLocation(this.program,'u_phaseSplit'),
        viewAvg: gl.getUniformLocation(this.program,'u_viewAvg'),
        sectorIndex: gl.getUniformLocation(this.program,'u_sectorIndex'),
        axesClip: gl.getUniformLocation(this.program,'u_axesClip'),
        betaGradient: gl.getUniformLocation(this.program,'u_betaGradient'),
        position: gl.getAttribLocation(this.program,'a_position'),
        beta0: gl.getUniformLocation(this.program,'u_beta0') // legacy/compat
      };
    }

    _initQuad(){
      const gl = this.gl;
      const verts = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
      this.quadVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    }

    _initGrid(){
      const gl = this.gl;
      const divisions = 100, half = 1.0, norm = 0.8;
      const mkSheet = (plane)=>{
        const out=[]; const step=(2*half)/divisions;
        if (plane==='XY'){
          const y=-0.15;
          for(let z=0; z<=divisions; z++){
            const zPos=(-half+z*step)*norm;
            for(let x=0; x<divisions; x++){
              const x0=(-half+x*step)*norm, x1=(-half+(x+1)*step)*norm;
              out.push(x0,y,zPos, x1,y,zPos);
            }
          }
          for(let x=0; x<=divisions; x++){
            const xPos=(-half+x*step)*norm;
            for(let z=0; z<divisions; z++){
              const z0=(-half+z*step)*norm, z1=(-half+(z+1)*step)*norm;
              out.push(xPos,y,z0, xPos,y,z1);
            }
          }
        } else if (plane==='XZ'){
          const y=0.0;
          for(let x=0; x<=divisions; x++){
            const xPos=(-half+x*step)*norm;
            for(let z=0; z<divisions; z++){
              const z0=(-half+z*step)*norm, z1=(-half+(z+1)*step)*norm;
              out.push(xPos,y,z0, xPos,y,z1);
            }
          }
          for(let z=0; z<=divisions; z++){
            const zPos=(-half+z*step)*norm;
            for(let x=0; x<divisions; x++){
              const x0=(-half+x*step)*norm, x1=(-half+(x+1)*step)*norm;
              out.push(x0,y,zPos, x1,y,zPos);
            }
          }
        } else { // YZ
          const x=0.0;
          for(let y=0; y<=divisions; y++){
            const yPos=(-half+y*step)*norm;
            for(let z=0; z<divisions; z++){
              const z0=(-half+z*step)*norm, z1=(-half+(z+1)*step)*norm;
              out.push(x,yPos,z0, x,yPos,z1);
            }
          }
          for(let z=0; z<=divisions; z++){
            const zPos=(-half+z*step)*norm;
            for(let y=0; y<divisions; y++){
              const y0=(-half+y*step)*norm, y1=(-half+(y+1)*step)*norm;
              out.push(x,y0,zPos, x,y1,zPos);
            }
          }
        }
        return new Float32Array(out);
      };

      const XY = mkSheet('XY'), XZ = mkSheet('XZ'), YZ = mkSheet('YZ');
      this.gridVertices = new Float32Array(XY.length + XZ.length + YZ.length);
      this.gridVertices.set(XY, 0);
      this.gridVertices.set(XZ, XY.length);
      this.gridVertices.set(YZ, XY.length + XZ.length);
      this.originalGridVertices = new Float32Array(this.gridVertices);
      this.gridVertexCount = this.gridVertices.length/3;
      this.gridVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
      gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.DYNAMIC_DRAW);
    }

    //===================== Main loop =====================
    _startRenderLoop(){
      const tick = (t)=>{ this._draw(t*0.001); this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick);
    }

    _draw(time){
      const gl = this.gl;
      if (!gl){ return; }
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      gl.clearColor(0.05,0.1,0.15,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // ----- Main program (quad) -----
      gl.useProgram(this.program);
      gl.uniform1f(this.uLoc.time, time);
      gl.uniform1f(this.uLoc.dutyCycle, this.uniforms.dutyCycle);
      gl.uniform1f(this.uLoc.g_y, this.uniforms.g_y);
      gl.uniform1f(this.uLoc.cavityQ, this.uniforms.cavityQ);
      gl.uniform1f(this.uLoc.sagDepth_nm, this.uniforms.sagDepth_nm);
      gl.uniform1f(this.uLoc.tsRatio, this.uniforms.tsRatio);
      gl.uniform1f(this.uLoc.powerAvg_MW, this.uniforms.powerAvg_MW);
      gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg);

      const sectorCount = this.uniforms.sectorCount;
      const sectorIndex = (time * (this.uniforms.sectorSpeed||2.0) * sectorCount) % sectorCount;
      gl.uniform1f(this.uLoc.gammaGeo, this.uniforms.gammaGeo);
      gl.uniform1f(this.uLoc.Qburst, this.uniforms.Qburst);
      gl.uniform1f(this.uLoc.deltaAOverA, this.uniforms.deltaAOverA);
      gl.uniform1f(this.uLoc.sectorCount, sectorCount);
      gl.uniform1f(this.uLoc.phaseSplit, this.uniforms.phaseSplit);
      gl.uniform1f(this.uLoc.viewAvg, this.uniforms.viewAvg);
      gl.uniform1f(this.uLoc.sectorIndex, sectorIndex);

      const ax = this.uniforms.axesClip;
      gl.uniform3f(this.uLoc.axesClip, ax[0], ax[1], ax[2]);
      const bg = this.uniforms.betaGradient;
      gl.uniform3f(this.uLoc.betaGradient, bg[0], bg[1], bg[2]);

      const currentBeta0 = (this.uniforms.beta0!==undefined) ? this.uniforms.beta0 : (this.uniforms.dutyCycle*this.uniforms.g_y);
      gl.uniform1f(this.uLoc.beta0, currentBeta0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.enableVertexAttribArray(this.uLoc.position);
      gl.vertexAttribPointer(this.uLoc.position, 2, gl.FLOAT, false, 0, 0);
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
      gl.disableVertexAttribArray(this.uLoc.position);

      // ----- Grid -----
      this._updateGrid();
      gl.useProgram(this.gridProgram);

      // Build MVP
      const fov = Math.PI/4, aspect=this.canvas.width/this.canvas.height;
      const n=0.1, f=10.0, s=1/Math.tan(fov/2);
      const proj = new Float32Array([
        s/aspect,0,0,0, 0,s,0,0, 0,0,(f+n)/(n-f),(2*f*n)/(n-f), 0,0,-1,0
      ]);
      // simple view: rotate a touch and pull back
      const yaw=20*Math.PI/180, pitch=-12*Math.PI/180;
      const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
      const R = new Float32Array([ cy,0,sy,0,  sy*sp,cp,-cy*sp,0,  -sy*cp,sp,cy*cp,0,  0,0,0,1 ]);
      const T = new Float32Array([ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-2.2,1 ]);
      const VR = this._mul4(T,R);
      const MVP = this._mul4(proj, VR);
      gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix,false,MVP);

      const exoticOn = (this.uniforms.viewAvg<0.5 || Math.abs(this.uniforms.phaseSplit-0.5)>1e-3)?1.0:0.0;
      gl.uniform1f(this.gridUniforms.energyFlag, exoticOn);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
      gl.enableVertexAttribArray(this.gridUniforms.position);
      gl.vertexAttribPointer(this.gridUniforms.position,3,gl.FLOAT,false,0,0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const vertsPerSheet = Math.floor(this.gridVertexCount/3);
      // XY (cyan)
      gl.uniform3f(this.gridUniforms.sheetColor, 0.0,1.0,1.0);
      gl.drawArrays(gl.LINES, 0, vertsPerSheet);
      // XZ (magenta)
      gl.uniform3f(this.gridUniforms.sheetColor, 1.0,0.0,1.0);
      gl.drawArrays(gl.LINES, vertsPerSheet, vertsPerSheet);
      // YZ (yellow)
      gl.uniform3f(this.gridUniforms.sheetColor, 1.0,1.0,0.0);
      gl.drawArrays(gl.LINES, vertsPerSheet*2, vertsPerSheet);

      gl.disableVertexAttribArray(this.gridUniforms.position);
      gl.disable(gl.BLEND);
    }

    _updateGrid(){
      if (!this.gridVertices || !this.originalGridVertices) return;
      this.gridVertices.set(this.originalGridVertices);
      const v = this.gridVertices;
      // Very light "breathing" warp so the sheets feel alive (coupled to β)
      const betaVis = Math.pow(this.uniforms.gammaGeo*this.uniforms.Qburst*this.uniforms.deltaAOverA, 0.25) * 0.002;
      for (let i=0; i<v.length; i+=3){
        const x=v[i], y=v[i+1], z=v[i+2];
        const r=Math.hypot(x,y,z);
        const k = 1.0 + betaVis*Math.exp(-r*r*5.0);
        v[i]=x*k; v[i+1]=y; v[i+2]=z*k;
      }
      const gl=this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridVertices);
    }

    _mul4(a,b){
      const o=new Float32Array(16);
      for(let r=0;r<4;r++)for(let c=0;c<4;c++){
        o[r*4+c]=a[r*4+0]*b[0*4+c]+a[r*4+1]*b[1*4+c]+a[r*4+2]*b[2*4+c]+a[r*4+3]*b[3*4+c];
      } return o;
    }

    destroy(){
      cancelAnimationFrame(this._raf);
      const gl=this.gl;
      if (!gl) return;
      [this.quadVbo,this.gridVbo].forEach(b=>b&&gl.deleteBuffer(b));
      [this.program,this.gridProgram].forEach(p=>p&&gl.deleteProgram(p));
    }
  }

  if (typeof window !== 'undefined') {
    window.WarpEngine = WarpEngine;
  }
})();