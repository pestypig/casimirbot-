//====================================================================
//  Natário Warp‑Bubble Visualiser (optimized WebGL – cross-browser compatible)
//  ------------------------------------------------------------------
//  Integrates seamlessly with React dashboard for real-time physics visualization
//====================================================================

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported");

        // Enable derivatives extension for WebGL1 compatibility
        this.hasDerivatives = !!this.gl.getExtension("OES_standard_derivatives");
        if (!this.hasDerivatives && !this.gl.getParameter(this.gl.VERSION).includes("WebGL 2.0")) {
            console.warn("OES_standard_derivatives extension not available – grid lines disabled for WebGL1");
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

        this._compileShaders();
        this._initQuad();
        this._cacheUniformLocations();
        this._resize();
        
        // Auto-resize and continuous rendering
        window.addEventListener("resize", () => this._resize());
        this._startRenderLoop();
    }

    //----------------------------------------------------------------
    //  Optimized shader compilation with WebGL1/2 compatibility
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

        let fs = "";
        if (isWebGL2) {
            fs = "#version 300 es\n" +
                "precision highp float;\n" +
                "in vec2 v_uv;\n" +
                "out vec4 frag;\n" +
                "\n" +
                "uniform float u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm,\n" +
                "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time;\n" +
                "\n" +
                "// Natário β‑field with authentic physics\n" +
                "vec3 betaField(vec3 x) {\n" +
                "    float R = u_sagDepth_nm * 1e-9;  // nm → m conversion\n" +
                "    float r = length(x);\n" +
                "    if (r < 1e-9) return vec3(0.0);\n" +
                "    \n" +
                "    float beta0 = u_dutyCycle * u_g_y;\n" +
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
                "    // Dynamic ripple effect scaled by duty cycle\n" +
                "    bmag += sin(u_time * 2.0 + length(center) * 20.0) * 0.1 * u_dutyCycle;\n" +
                "    \n" +
                "    vec3 color = warpColor(bmag);\n" +
                "    \n" +
                "    // Grid overlay with WebGL2 derivatives\n" +
                "    vec2 grid = abs(fract(center * 50.0) - 0.5) / fwidth(center * 50.0);\n" +
                "    float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);\n" +
                "    color = mix(color, vec3(0.5), gridLine * 0.2);\n" +
                "    \n" +
                "    frag = vec4(color, 1.0);\n" +
                "}";
        } else {
            fs = (this.hasDerivatives ? "#extension GL_OES_standard_derivatives : enable\n" : "") +
                "precision highp float;\n" +
                "varying vec2 v_uv;\n" +
                "\n" +
                "uniform float u_dutyCycle, u_g_y, u_cavityQ, u_sagDepth_nm,\n" +
                "              u_tsRatio, u_powerAvg_MW, u_exoticMass_kg, u_time;\n" +
                "\n" +
                "vec3 betaField(vec3 x) {\n" +
                "    float R = u_sagDepth_nm * 1e-9;\n" +
                "    float r = length(x);\n" +
                "    if (r < 1e-9) return vec3(0.0);\n" +
                "    \n" +
                "    float beta0 = u_dutyCycle * u_g_y;\n" +
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
                "    bmag += sin(u_time * 2.0 + length(center) * 20.0) * 0.1 * u_dutyCycle;\n" +
                "    \n" +
                "    vec3 color = warpColor(bmag);\n" +
                "    \n" +
                (this.hasDerivatives ? 
                "    vec2 grid = abs(fract(center * 50.0) - 0.5) / fwidth(center * 50.0);\n" +
                "    float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);\n" +
                "    color = mix(color, vec3(0.5), gridLine * 0.2);\n" : "") +
                "    \n" +
                "    gl_FragColor = vec4(color, 1.0);\n" +
                "}";
        }

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
        const gl = this.gl;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  1, -1,  -1, 1,  1, 1
        ]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.vbo = vbo;
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
            time: gl.getUniformLocation(this.program, "u_time")
        };
    }

    //----------------------------------------------------------------
    //  Public API for React integration
    //----------------------------------------------------------------
    updateUniforms(params) {
        Object.assign(this.uniforms, params);
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
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // Efficiently set all uniforms
        gl.uniform1f(this.uLoc.dutyCycle, this.uniforms.dutyCycle);
        gl.uniform1f(this.uLoc.g_y, this.uniforms.g_y);
        gl.uniform1f(this.uLoc.cavityQ, this.uniforms.cavityQ);
        gl.uniform1f(this.uLoc.sagDepth_nm, this.uniforms.sagDepth_nm);
        gl.uniform1f(this.uLoc.tsRatio, this.uniforms.tsRatio);
        gl.uniform1f(this.uLoc.powerAvg_MW, this.uniforms.powerAvg_MW);
        gl.uniform1f(this.uLoc.exoticMass_kg, this.uniforms.exoticMass_kg);
        gl.uniform1f(this.uLoc.time, time);

        // Render full-screen quad
        const loc = gl.getAttribLocation(this.program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
        if (this.gl && this.vbo) {
            this.gl.deleteBuffer(this.vbo);
        }
    }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else if (typeof window !== 'undefined') {
    window.WarpEngine = WarpEngine;
}