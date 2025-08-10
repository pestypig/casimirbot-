//====================================================================
//  Natário Warp-Bubble Visualiser — v3.3 (York-time overlay)
//  ------------------------------------------------------------------
//  Adds York-time θ (trace of extrinsic curvature) overlay on the grid:
//    θ ~ v_s * (x_s / r_s) * d f(r_s) / d r_s
//  We approximate f(rs) using a Gaussian wall around an ellipsoidal shell.
//  Grid still "hugs" the wall via SDF-based displacement and shows
//  front contraction / rear expansion via driveDir and sector strobing.
//====================================================================
(function(){
  class WarpEngine {
    constructor(canvas){
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2') ||
                canvas.getContext('webgl')  ||
                canvas.getContext('experimental-webgl');

      this.uniforms = {
        // Legacy/pipeline
        dutyCycle: 0.14, g_y: 26.0, cavityQ: 1e9, sagDepth_nm: 16.0,
        tsRatio: 4102.74, powerAvg_MW: 83.3, exoticMass_kg: 1405.0,
        // Theory knobs
        gammaGeo: 25.0, Qburst: 1e9, deltaAOverA: 0.05,
        sectorCount: 400.0, phaseSplit: 0.5, viewAvg: 1.0,
        axesClip: [0.40, 0.22, 0.22],
        betaGradient: [0.0, -0.02, 0.0],
        sectorSpeed: 2.0,
        // Grid hugging
        driveDir: [1.0, 0.0, 0.0],
        wallWidth: 0.06,
        gridK: 0.12,
        // York-time overlay controls
        showK: 1.0,   // color by θ
        kScale: 2.5,  // visualization gain (boosted)
        vShip: 1.5    // v_s visual factor (boosted)
      };
      this.mode = 'HOVER';

      if (!this.gl){ this._createFallback2D(); return; }

      this._compileMainProgram();
      this._compileGridShaders();
      this._initQuad();
      this._initGrid();
      this._cacheUniformLocations();

      this.gl.enable(this.gl.DEPTH_TEST);
      this._resize();
      window.addEventListener('resize', () => this._resize());
      this._startRenderLoop();
      console.log('WarpEngine v3.3 — York-time overlay build ready.');
    }

    setMode(mode){
      this.mode = mode;
      if (mode === 'HOVER'){
        this.uniforms.phaseSplit = 0.5;
        this.uniforms.viewAvg    = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'CRUISE'){
        this.uniforms.phaseSplit = 0.65;
        this.uniforms.viewAvg    = 1.0;
        this.uniforms.betaGradient = [0,0,0];
      } else if (mode === 'TILT'){
        this.uniforms.phaseSplit = 0.5;
        this.uniforms.viewAvg    = 1.0;
        this.uniforms.betaGradient = [0.0,-0.02,0.0];
      }
    }
    setEllipsoidAxes(x,y,z){ this.uniforms.axesClip = [x,y,z]; }
    toggleInstantaneous(show){ this.uniforms.viewAvg = show? 0.0 : 1.0; }
    updateUniforms(params){ Object.assign(this.uniforms, params); }

    _createFallback2D(){
      const ctx = this.canvas.getContext('2d');
      const loop=()=>{
        if (!ctx) return;
        const {width:w,height:h}=this.canvas;
        ctx.fillStyle='#0A1420'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#00FFFF'; ctx.font='12px monospace';
        ctx.fillText('WebGL unavailable — 2D fallback', 12, 24);
        ctx.fillText('York-time overlay not available in 2D mode', 12, 42);
        requestAnimationFrame(loop);
      }; requestAnimationFrame(loop);
    }

    _resize(){
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
      const w = Math.floor(this.canvas.clientWidth * dpr);
      const h = Math.floor(this.canvas.clientHeight * dpr);
      if (this.canvas.width!==w || this.canvas.height!==h){ this.canvas.width=w; this.canvas.height=h; }
    }

    _compileMainProgram(){
      const gl=this.gl, is2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');
      const vs = is2 ? `#version 300 es
        in vec2 a_position; out vec2 v_uv;
        void main(){ v_uv=a_position*0.5+0.5; gl_Position=vec4(a_position,0.0,1.0); }`
      : `attribute vec2 a_position; varying vec2 v_uv;
         void main(){ v_uv=a_position*0.5+0.5; gl_Position=vec4(a_position,0.0,1.0); }`;
      const fs2 = `#version 300 es
        precision highp float;
        uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;
        uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;
        uniform vec3  u_axesClip; uniform vec3 u_betaGradient;
        in vec2 v_uv; out vec4 fragColor;
        float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
        void main(){
          vec2 p2=(v_uv-0.5)*2.0; vec3 p=vec3(p2.x,0.0,p2.y);
          float w=0.06; float sd=sdEllipsoid(p,u_axesClip);
          float ring=exp(-(sd*sd)/(w*w));
          float theta=atan(p.z,p.x); theta=theta<0.0?theta+6.28318530718:theta;
          float wedge=floor(theta/(6.28318530718/max(1.0,u_sectorCount)));
          float idx=mod(wedge+u_sectorIndex,u_sectorCount);
          float split=floor(u_phaseSplit*u_sectorCount);
          float signBeta=(idx<split)?1.0:-1.0;
          float beta_inst=u_gammaGeo*u_Qburst*u_deltaAOverA*ring;
          float beta_avg=beta_inst*sqrt(max(1e-9,u_dutyCycle/max(1.0,u_sectorCount)));
          float beta_core=mix(beta_inst,beta_avg,clamp(u_viewAvg,0.0,1.0));
          float beta_amp=(u_g_y>0.0?u_g_y:1.0)*beta_core;
          float beta=signBeta*beta_amp+dot(u_betaGradient,p);
          vec3 base=vec3(0.05,0.10,0.15), warp=vec3(1.0,0.5,0.0);
          float intensity=clamp(abs(beta)*3.0,0.0,1.0);
          fragColor=vec4(mix(base,warp,intensity),1.0);
        }`;
      const fs1 = `precision highp float;
        uniform float u_time, u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm, u_tsRatio, u_powerAvg_MW, u_exoticMass_kg;
        uniform float u_gammaGeo, u_Qburst, u_deltaAOverA, u_sectorCount, u_phaseSplit, u_viewAvg, u_sectorIndex;
        uniform vec3  u_axesClip; uniform vec3 u_betaGradient;
        varying vec2 v_uv;
        float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
        void main(){
          vec2 p2=(v_uv-0.5)*2.0; vec3 p=vec3(p2.x,0.0,p2.y);
          float w=0.06; float sd=sdEllipsoid(p,u_axesClip);
          float ring=exp(-(sd*sd)/(w*w));
          float theta=atan(p.z,p.x); theta=theta<0.0?theta+6.28318530718:theta;
          float wedge=floor(theta/(6.28318530718/max(1.0,u_sectorCount)));
          float idx=mod(wedge+u_sectorIndex,u_sectorCount);
          float split=floor(u_phaseSplit*u_sectorCount);
          float signBeta=(idx<split)?1.0:-1.0;
          float beta_inst=u_gammaGeo*u_Qburst*u_deltaAOverA*ring;
          float beta_avg=beta_inst*sqrt(max(1e-9,u_dutyCycle/max(1.0,u_sectorCount)));
          float beta_core=mix(beta_inst,beta_avg,clamp(u_viewAvg,0.0,1.0));
          float beta_amp=(u_g_y>0.0?u_g_y:1.0)*beta_core;
          float beta=signBeta*beta_amp+dot(u_betaGradient,p);
          vec3 base=vec3(0.05,0.10,0.15), warp=vec3(1.0,0.5,0.0);
          float intensity=clamp(abs(beta)*3.0,0.0,1.0);
          gl_FragColor=vec4(mix(base,warp,intensity),1.0);
        }`;
      this.program = this._linkProgram(vs, is2?fs2:fs1);
    }

    _compileGridShaders(){
      const gl=this.gl, is2 = gl.getParameter(gl.VERSION).includes('WebGL 2.0');
      const gridVs = is2? `#version 300 es
        in vec3 a_position; uniform mat4 u_mvpMatrix;
        uniform vec3  u_axesClip, u_driveDir;
        uniform float u_wallWidth, u_gridK;
        uniform float u_betaMag, u_sectorCount, u_phaseSplit, u_sectorIndex;
        uniform float u_showK, u_kScale, u_vShip;
        out float v_ring; out float v_theta;
        float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
        vec3  nEllipsoid(vec3 p, vec3 a){ vec3 qa=p/(a*a); float L=length(p/a); return normalize(qa/max(L,1e-6)); }
        void main(){
          vec3 p=a_position;
          float sd=sdEllipsoid(p,u_axesClip); vec3 n=nEllipsoid(p,u_axesClip);
          float ring=exp(-(sd*sd)/(u_wallWidth*u_wallWidth));
          v_ring=ring;
          float thetaA=atan(p.z,p.x); thetaA=thetaA<0.0?thetaA+6.28318530718:thetaA;
          float wedge=floor(thetaA/(6.28318530718/max(1.0,u_sectorCount)));
          float idx=mod(wedge+u_sectorIndex,u_sectorCount);
          float split=floor(u_phaseSplit*u_sectorCount);
          float signBeta=(idx<split)?1.0:-1.0;
          float front=sign(dot(n, normalize(u_driveDir)));
          float disp=u_gridK*u_betaMag*ring*signBeta*front;
          vec3 pw = p - n*disp;
          // York-time approx on ellipsoid-normalized coords
          vec3 pN = p / u_axesClip;
          float rs = length(pN);
          float wrs = max(u_wallWidth, 1e-4);
          float f = exp(-((rs-1.0)*(rs-1.0))/(wrs*wrs));
          float dfdrs = (-2.0*(rs-1.0)/(wrs*wrs))*f;
          vec3 dN = normalize(u_driveDir / u_axesClip);
          float xs = dot(pN, dN);
          float thetaY = u_vShip * (rs>1e-5 ? (xs/rs) : 0.0) * dfdrs;
          v_theta = u_kScale * thetaY;
          gl_Position = u_mvpMatrix * vec4(pw, 1.0);
        }`
      : `attribute vec3 a_position; uniform mat4 u_mvpMatrix;
         uniform vec3  u_axesClip, u_driveDir;
         uniform float u_wallWidth, u_gridK;
         uniform float u_betaMag, u_sectorCount, u_phaseSplit, u_sectorIndex;
         uniform float u_showK, u_kScale, u_vShip;
         varying float v_ring; varying float v_theta;
         float sdEllipsoid(vec3 p, vec3 a){ vec3 q=p/a; return length(q)-1.0; }
         vec3  nEllipsoid(vec3 p, vec3 a){ vec3 qa=p/(a*a); float L=length(p/a); return normalize(qa/max(L,1e-6)); }
         void main(){
           vec3 p=a_position;
           float sd=sdEllipsoid(p,u_axesClip); vec3 n=nEllipsoid(p,u_axesClip);
           float ring=exp(-(sd*sd)/(u_wallWidth*u_wallWidth));
           v_ring=ring;
           float thetaA=atan(p.z,p.x); thetaA=thetaA<0.0?thetaA+6.28318530718:thetaA;
           float wedge=floor(thetaA/(6.28318530718/max(1.0,u_sectorCount)));
           float idx=mod(wedge+u_sectorIndex,u_sectorCount);
           float split=floor(u_phaseSplit*u_sectorCount);
           float signBeta=(idx<split)?1.0:-1.0;
           float front=sign(dot(n, normalize(u_driveDir)));
           float disp=u_gridK*u_betaMag*ring*signBeta*front;
           vec3 pw = p - n*disp;
           vec3 pN = p / u_axesClip;
           float rs = length(pN);
           float wrs = max(u_wallWidth, 1e-4);
           float f = exp(-((rs-1.0)*(rs-1.0))/(wrs*wrs));
           float dfdrs = (-2.0*(rs-1.0)/(wrs*wrs))*f;
           vec3 dN = normalize(u_driveDir / u_axesClip);
           float xs = dot(pN, dN);
           float thetaY = u_vShip * (rs>1e-5 ? (xs/rs) : 0.0) * dfdrs;
           v_theta = u_kScale * thetaY;
           gl_Position = u_mvpMatrix * vec4(pw, 1.0);
         }`;

      const gridFs = is2? `#version 300 es
        precision highp float;
        uniform float u_energyFlag; uniform vec3 u_sheetColor;
        uniform float u_showK;
        in float v_ring; in float v_theta; out vec4 frag;
        vec3 diverge(float t){ // blue-white-red
          t = clamp(t, -1.0, 1.0);
          if (t<0.0){ return mix(vec3(0.0,0.15,0.8), vec3(0.95,0.97,1.0), t+1.0); }
          return mix(vec3(0.95,0.97,1.0), vec3(0.9,0.1,0.0), t);
        }
        void main(){
          vec3 base = (u_energyFlag>0.5)? vec3(1.0,0.0,1.0) : u_sheetColor;
          float a = 0.05 + 0.90 * clamp(v_ring, 0.0, 1.0);
          vec3 color = (u_showK>0.5) ? diverge(v_theta) : base;
          frag = vec4(color, a);
        }`
      : `precision highp float;
         uniform float u_energyFlag; uniform vec3 u_sheetColor; uniform float u_showK;
         varying float v_ring; varying float v_theta;
         vec3 diverge(float t){
           t = clamp(t, -1.0, 1.0);
           if (t<0.0){ return mix(vec3(0.0,0.15,0.8), vec3(0.95,0.97,1.0), t+1.0); }
           return mix(vec3(0.95,0.97,1.0), vec3(0.9,0.1,0.0), t);
         }
         void main(){
           vec3 base = (u_energyFlag>0.5)? vec3(1.0,0.0,1.0) : u_sheetColor;
           float a = 0.05 + 0.90 * clamp(v_ring, 0.0, 1.0);
           vec3 color = (u_showK>0.5) ? diverge(v_theta) : base;
           gl_FragColor = vec4(color, a);
         }`;

      this.gridProgram = this._linkProgram(gridVs, gridFs);
      const glp=this.gridProgram;
      this.gridUniforms = {
        mvpMatrix:  this.gl.getUniformLocation(glp,'u_mvpMatrix'),
        position:   this.gl.getAttribLocation(glp,'a_position'),
        energyFlag: this.gl.getUniformLocation(glp,'u_energyFlag'),
        sheetColor: this.gl.getUniformLocation(glp,'u_sheetColor'),
        axesClip:   this.gl.getUniformLocation(glp,'u_axesClip'),
        driveDir:   this.gl.getUniformLocation(glp,'u_driveDir'),
        wallWidth:  this.gl.getUniformLocation(glp,'u_wallWidth'),
        gridK:      this.gl.getUniformLocation(glp,'u_gridK'),
        betaMag:    this.gl.getUniformLocation(glp,'u_betaMag'),
        sectorCount:this.gl.getUniformLocation(glp,'u_sectorCount'),
        phaseSplit: this.gl.getUniformLocation(glp,'u_phaseSplit'),
        sectorIndex:this.gl.getUniformLocation(glp,'u_sectorIndex'),
        showK:      this.gl.getUniformLocation(glp,'u_showK'),
        kScale:     this.gl.getUniformLocation(glp,'u_kScale'),
        vShip:      this.gl.getUniformLocation(glp,'u_vShip')
      };
    }

    _linkProgram(vsSrc, fsSrc){
      const gl=this.gl;
      const vs=gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs,vsSrc); gl.compileShader(vs);
      if(!gl.getShaderParameter(vs,gl.COMPILE_STATUS)){ console.error('VS error',gl.getShaderInfoLog(vs)); return null; }
      const fs=gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs,fsSrc); gl.compileShader(fs);
      if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)){ console.error('FS error',gl.getShaderInfoLog(fs)); return null; }
      const p=gl.createProgram(); gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ console.error('Link error',gl.getProgramInfoLog(p)); return null; }
      return p;
    }

    _cacheUniformLocations(){
      const gl = this.gl; gl.useProgram(this.program);
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
        beta0: gl.getUniformLocation(this.program,'u_beta0')
      };
    }

    _initQuad(){
      const gl=this.gl;
      const verts=new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
      this.quadVbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.quadVbo);
      gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
    }

    _initGrid(){
      const gl=this.gl, divisions=100, half=1.0, norm=0.8;
      const mk=(plane)=>{
        const out=[]; const step=(2*half)/divisions;
        if(plane==='XY'){
          const y=0.0;
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
        } else if(plane==='XZ'){
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
        } else {
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
      const XY=mk('XY'), XZ=mk('XZ'), YZ=mk('YZ');
      this.gridVertices=new Float32Array(XY.length+XZ.length+YZ.length);
      this.gridVertices.set(XY,0); this.gridVertices.set(XZ,XY.length); this.gridVertices.set(YZ,XY.length+XZ.length);
      this.originalGridVertices=new Float32Array(this.gridVertices);
      this.gridVertexCount=this.gridVertices.length/3;
      this.gridVbo=this.gl.createBuffer(); this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.gridVbo);
      this.gl.bufferData(this.gl.ARRAY_BUFFER,this.gridVertices,this.gl.DYNAMIC_DRAW);
    }

    _startRenderLoop(){
      const tick=(t)=>{ this._draw(t*0.001); this._raf=requestAnimationFrame(tick); };
      this._raf=requestAnimationFrame(tick);
    }

    _draw(time){
      const gl=this.gl; if(!gl) return;
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      gl.clearColor(0.05,0.1,0.15,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

      // ---- Quad background "heat" (unchanged) ----
      gl.useProgram(this.program);
      gl.uniform1f(this.uLoc.time,time);
      gl.uniform1f(this.uLoc.dutyCycle,this.uniforms.dutyCycle);
      gl.uniform1f(this.uLoc.g_y,this.uniforms.g_y);
      gl.uniform1f(this.uLoc.cavityQ,this.uniforms.cavityQ);
      gl.uniform1f(this.uLoc.sagDepth_nm,this.uniforms.sagDepth_nm);
      gl.uniform1f(this.uLoc.tsRatio,this.uniforms.tsRatio);
      gl.uniform1f(this.uLoc.powerAvg_MW,this.uniforms.powerAvg_MW);
      gl.uniform1f(this.uLoc.exoticMass_kg,this.uniforms.exoticMass_kg);

      const sectorCount=this.uniforms.sectorCount;
      const sectorIndex=(time*(this.uniforms.sectorSpeed||2.0)*sectorCount)%sectorCount;
      gl.uniform1f(this.uLoc.gammaGeo,this.uniforms.gammaGeo);
      gl.uniform1f(this.uLoc.Qburst,this.uniforms.Qburst);
      gl.uniform1f(this.uLoc.deltaAOverA,this.uniforms.deltaAOverA);
      gl.uniform1f(this.uLoc.sectorCount,sectorCount);
      gl.uniform1f(this.uLoc.phaseSplit,this.uniforms.phaseSplit);
      gl.uniform1f(this.uLoc.viewAvg,this.uniforms.viewAvg);
      gl.uniform1f(this.uLoc.sectorIndex,sectorIndex);
      const ax=this.uniforms.axesClip; gl.uniform3f(this.uLoc.axesClip,ax[0],ax[1],ax[2]);
      const bg=this.uniforms.betaGradient; gl.uniform3f(this.uLoc.betaGradient,bg[0],bg[1],bg[2]);
      const currentBeta0 = (this.uniforms.beta0!==undefined) ? this.uniforms.beta0 : (this.uniforms.dutyCycle*this.uniforms.g_y);
      gl.uniform1f(this.uLoc.beta0,currentBeta0);

      gl.bindBuffer(gl.ARRAY_BUFFER,this.quadVbo);
      gl.enableVertexAttribArray(this.uLoc.position);
      gl.vertexAttribPointer(this.uLoc.position,2,gl.FLOAT,false,0,0);
      gl.depthMask(false); gl.drawArrays(gl.TRIANGLES,0,6); gl.depthMask(true);
      gl.disableVertexAttribArray(this.uLoc.position);

      // ---- Grid + York-time coloring ----
      gl.useProgram(this.gridProgram);
      const fov=Math.PI/4, aspect=this.canvas.width/this.canvas.height;
      const n=0.1,f=10.0,s=1/Math.tan(fov/2);
      const proj=new Float32Array([ s/aspect,0,0,0, 0,s,0,0, 0,0,(f+n)/(n-f),(2*f*n)/(n-f), 0,0,-1,0 ]);
      const yaw=20*Math.PI/180, pitch=-12*Math.PI/180;
      const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
      const R=new Float32Array([ cy,0,sy,0,  sy*sp,cp,-cy*sp,0,  -sy*cp,sp,cy*cp,0, 0,0,0,1 ]);
      const T=new Float32Array([ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-2.2,1 ]);
      const VR=this._mul4(T,R); const MVP=this._mul4(proj,VR);
      gl.uniformMatrix4fv(this.gridUniforms.mvpMatrix,false,MVP);

      const beta_inst=this.uniforms.gammaGeo*this.uniforms.Qburst*this.uniforms.deltaAOverA;
      const beta_avg =beta_inst*Math.sqrt(Math.max(1e-9,this.uniforms.dutyCycle/Math.max(1.0,sectorCount)));
      const betaMag  =(this.uniforms.viewAvg>=0.5)?beta_avg:beta_inst;

      gl.uniform3f(this.gridUniforms.axesClip,ax[0],ax[1],ax[2]);
      const dd=this.uniforms.driveDir; gl.uniform3f(this.gridUniforms.driveDir,dd[0],dd[1],dd[2]);
      gl.uniform1f(this.gridUniforms.wallWidth,this.uniforms.wallWidth);
      gl.uniform1f(this.gridUniforms.gridK,this.uniforms.gridK);
      gl.uniform1f(this.gridUniforms.betaMag,betaMag);
      gl.uniform1f(this.gridUniforms.sectorCount,sectorCount);
      gl.uniform1f(this.gridUniforms.phaseSplit,this.uniforms.phaseSplit);
      gl.uniform1f(this.gridUniforms.sectorIndex,sectorIndex);
      const exoticOn=(this.uniforms.viewAvg<0.5 || Math.abs(this.uniforms.phaseSplit-0.5)>1e-3)?1.0:0.0;
      gl.uniform1f(this.gridUniforms.energyFlag,exoticOn);
      gl.uniform1f(this.gridUniforms.showK,this.uniforms.showK||0.0);
      gl.uniform1f(this.gridUniforms.kScale,this.uniforms.kScale||1.0);
      gl.uniform1f(this.gridUniforms.vShip,this.uniforms.vShip||1.0);

      gl.bindBuffer(gl.ARRAY_BUFFER,this.gridVbo);
      gl.enableVertexAttribArray(this.gridUniforms.position);
      gl.vertexAttribPointer(this.gridUniforms.position,3,gl.FLOAT,false,0,0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const vertsPerSheet=Math.floor(this.gridVertexCount/3);
      gl.uniform3f(this.gridUniforms.sheetColor,0.0,1.0,1.0); gl.drawArrays(gl.LINES,0,vertsPerSheet);
      gl.uniform3f(this.gridUniforms.sheetColor,1.0,0.0,1.0); gl.drawArrays(gl.LINES,vertsPerSheet,vertsPerSheet);
      gl.uniform3f(this.gridUniforms.sheetColor,1.0,1.0,0.0); gl.drawArrays(gl.LINES,vertsPerSheet*2,vertsPerSheet);

      gl.disableVertexAttribArray(this.gridUniforms.position);
      gl.disable(gl.BLEND);
    }

    _mul4(a,b){
      const o=new Float32Array(16);
      for(let r=0;r<4;r++)for(let c=0;c<4;c++){ o[r*4+c]=a[r*4+0]*b[0*4+c]+a[r*4+1]*b[1*4+c]+a[r*4+2]*b[2*4+c]+a[r*4+3]*b[3*4+c]; }
      return o;
    }

    destroy(){
      cancelAnimationFrame(this._raf);
      const gl=this.gl; if(!gl) return;
      [this.quadVbo,this.gridVbo].forEach(b=>b&&gl.deleteBuffer(b));
      [this.program,this.gridProgram].forEach(p=>p&&gl.deleteProgram(p));
    }
  }
  window.WarpEngine = WarpEngine;
})();