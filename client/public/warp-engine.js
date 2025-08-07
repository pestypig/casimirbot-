/**
 * Natário Warp Bubble WebGL Visualizer
 * Simplified version for direct browser integration
 */

class WarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Warp parameters (updated from dashboard)
        this.uniforms = {
            dutyCycle: 0.14,      // Hover mode default
            g_y: 26.0,            // geometric amplification
            cavityQ: 1e9,         // electromagnetic Q-factor
            sagDepth_nm: 16.0,    // nm bow-shallow depth
            tsRatio: 4102.74,     // time-scale separation
            powerAvg_MW: 83.3,    // average power (MW)
            exoticMass_kg: 1405   // exotic mass (kg)
        };

        this.initShaders();
        this.initGeometry();
        this.initUniforms();
    }

    initShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            
            uniform float u_dutyCycle;
            uniform float u_g_y;
            uniform float u_cavityQ;
            uniform float u_sagDepth_nm;
            uniform float u_tsRatio;
            uniform float u_powerAvg_MW;
            uniform float u_exoticMass_kg;
            uniform float u_time;
            
            varying vec2 v_uv;
            
            // Natário shift vector β(r)
            vec3 betaField(vec3 x) {
                float R = u_sagDepth_nm * 1e-9; // convert nm to m
                float r = length(x);
                if (r < 1e-9) return vec3(0.0);
                
                float beta0 = u_dutyCycle * u_g_y;
                float prof = (r / R) * exp(-(r * r) / (R * R));
                return beta0 * prof * (x / r);
            }
            
            // Color mapping for warp field visualization
            vec3 warpColor(float beta_mag) {
                // Blue to red gradient based on field strength
                float intensity = clamp(beta_mag * 100.0, 0.0, 1.0);
                return mix(
                    vec3(0.1, 0.2, 0.8),  // Dark blue (low field)
                    vec3(0.9, 0.3, 0.1),  // Bright orange (high field)
                    intensity
                );
            }
            
            void main() {
                // Convert UV to physical coordinates (nanometer scale)
                vec2 center = v_uv - 0.5;
                vec3 pos = vec3(center * 20e-9, 0.0); // 20nm field of view
                
                vec3 beta = betaField(pos);
                float beta_magnitude = length(beta);
                
                // Add time-varying ripple effect
                float ripple = sin(u_time * 2.0 + length(center) * 20.0) * 0.1;
                beta_magnitude += ripple * u_dutyCycle;
                
                vec3 color = warpColor(beta_magnitude);
                
                // Add grid overlay
                vec2 grid = abs(fract(center * 50.0) - 0.5) / fwidth(center * 50.0);
                float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);
                color = mix(color, vec3(0.5), gridLine * 0.2);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Program failed to link: ' + this.gl.getProgramInfoLog(program));
        }
        
        return program;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader failed to compile: ' + this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }

    initGeometry() {
        // Full-screen quad
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    }

    initUniforms() {
        this.gl.useProgram(this.program);
        
        // Get uniform locations
        this.uniformLocations = {
            dutyCycle: this.gl.getUniformLocation(this.program, 'u_dutyCycle'),
            g_y: this.gl.getUniformLocation(this.program, 'u_g_y'),
            cavityQ: this.gl.getUniformLocation(this.program, 'u_cavityQ'),
            sagDepth_nm: this.gl.getUniformLocation(this.program, 'u_sagDepth_nm'),
            tsRatio: this.gl.getUniformLocation(this.program, 'u_tsRatio'),
            powerAvg_MW: this.gl.getUniformLocation(this.program, 'u_powerAvg_MW'),
            exoticMass_kg: this.gl.getUniformLocation(this.program, 'u_exoticMass_kg'),
            time: this.gl.getUniformLocation(this.program, 'u_time')
        };
    }

    updateUniforms(params) {
        // Update internal parameters
        Object.assign(this.uniforms, params);
    }

    render(time = 0) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        // Set uniforms
        this.gl.uniform1f(this.uniformLocations.dutyCycle, this.uniforms.dutyCycle);
        this.gl.uniform1f(this.uniformLocations.g_y, this.uniforms.g_y);
        this.gl.uniform1f(this.uniformLocations.cavityQ, this.uniforms.cavityQ);
        this.gl.uniform1f(this.uniformLocations.sagDepth_nm, this.uniforms.sagDepth_nm);
        this.gl.uniform1f(this.uniformLocations.tsRatio, this.uniforms.tsRatio);
        this.gl.uniform1f(this.uniformLocations.powerAvg_MW, this.uniforms.powerAvg_MW);
        this.gl.uniform1f(this.uniformLocations.exoticMass_kg, this.uniforms.exoticMass_kg);
        this.gl.uniform1f(this.uniformLocations.time, time * 0.001);

        // Set up vertex attributes
        const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}

// Export for use in React components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarpEngine;
} else {
    window.WarpEngine = WarpEngine;
}