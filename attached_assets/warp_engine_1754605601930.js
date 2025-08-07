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
            dutyCycle:    gl.getUniformLocation(this.program,"u_dutyCycle"),
            g_y:          gl.getUniformLocation(this.program,"u_g_y"),
            cavityQ:      gl.getUniformLocation(this.program,"u_cavityQ"),
            sagDepth_nm:  gl.getUniformLocation(this.program,"u_sagDepth_nm"),
            tsRatio:      gl.getUniformLocation(this.program,"u_tsRatio"),
            powerAvg_MW:  gl.getUniformLocation(this.program,"u_powerAvg_MW"),
            exoticMass_kg:gl.getUniformLocation(this.program,"u_exoticMass_kg"),
            time:         gl.getUniformLocation(this.program,"u_time")
        };
    }

    //----------------------------------------------------------------
    //  5.  Public API
    //----------------------------------------------------------------
    updateUniforms(obj){
        Object.assign(this.uniforms, obj);
    }

    //----------------------------------------------------------------
    //  6.  Frame loop
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
    //  7.  Responsive resize
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
}
