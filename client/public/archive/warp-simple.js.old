class SimpleWarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationId = null;
        this.initialized = false;
        this.amplificationMode = 'auto'; // 'auto', 'legacy', 'amplified'
        this.uniforms = {}; // Store uniforms for direct access
        
        // Default operational mode parameters with full amplifier chain
        this.params = {
            dutyCycle: 0.14,
            gammaGeo: 26.0,     // concave-pocket boost (stage-1)
            Qdyn: 1e9,          // dynamic Casimir boost (stage-2)
            gammaVdB: 1e11,     // VdB throat boost (stage-4)
            sagDepth_nm: 16.0,
            powerAvg_MW: 83.3,
            exoticMass_kg: 1405,
            currentMode: 'hover',
            sectorStrobing: 1,
            qSpoilingFactor: 1,
            // Legacy compatibility
            g_y: 26
        };
        
        this.debugDisableWarp = false; // debug toggle
        
        // Add debug controls
        window.addEventListener('keydown', e => {
            if (e.key === 'w' || e.key === 'W') {
                this.debugDisableWarp = !this.debugDisableWarp;
                console.log('🔧 Warp debug toggle:', this.debugDisableWarp ? 'DISABLED' : 'ENABLED');
            }
        });
        
        this.init();
    }
    
    init() {
        console.log('🎯 SimpleWarpEngine initialized');
        this.resize();
        this.initialized = true;
        this.startRenderLoop();
        this.setupKeyboardControls();
    }
    
    setupKeyboardControls() {
        // Add keyboard toggle for amplification modes
        document.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') {
                // Cycle through amplification modes
                if (this.amplificationMode === 'auto') {
                    this.amplificationMode = 'legacy';
                } else if (this.amplificationMode === 'legacy') {
                    this.amplificationMode = 'amplified';
                } else {
                    this.amplificationMode = 'auto';
                }
                console.log('🔄 Amplification mode:', this.amplificationMode);
            }
        });
    }
    
    updateUniforms(parameters) {
        if (!parameters) return;
        
        // Extract additional physics parameters from parameters
        this.params = { 
            ...this.params, 
            ...parameters,
            // Ensure we have all physics parameters
            sagDepth_nm: parameters.sagDepth_nm || this.params.sagDepth_nm || 16,
            g_y: parameters.g_y || this.params.g_y || 26,
            exoticMass_kg: parameters.exoticMass_kg || this.params.exoticMass_kg || 1405
        };
        
        // Store in uniforms for direct access (enables live β₀ injection)
        Object.assign(this.uniforms, this.params);
        
        console.log('🎯 Mode Update:', {
            mode: this.params.currentMode,
            power: this.params.powerAvg_MW,
            duty: this.params.dutyCycle,
            beta0: (this.params.dutyCycle * this.params.g_y).toFixed(3),
            sagDepth: this.params.sagDepth_nm + 'nm',
            uniforms_beta0: this.uniforms.beta0 ? this.uniforms.beta0.toExponential(2) : 'none'
        });
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        console.log(`Canvas resized: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    startRenderLoop() {
        if (this.animationId) return;
        this.render();
    }
    
    render() {
        this.animationId = requestAnimationFrame(() => this.render());
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear with dark blue background
        ctx.fillStyle = '#0D1B2A';
        ctx.fillRect(0, 0, w, h);
        
        // Get mode-specific effects
        const modeEffects = this.getModeEffects();
        
        // Draw spacetime grid with warp effects
        this.drawWarpGrid(ctx, w, h, modeEffects);
        
        // Draw mode indicator
        this.drawModeIndicator(ctx, modeEffects);
    }
    
    getModeEffects() {
        const mode = this.params.currentMode || 'hover';
        const power = this.params.powerAvg_MW || 0;
        const duty = this.params.dutyCycle || 0;
        
        const configs = {
            hover: { 
                color: '#00FFFF', 
                intensity: 1.0, 
                rippleSpeed: 0.5,
                description: 'gentle β-field translation, slow metric evolution'
            },
            cruise: { 
                color: '#00FF80', 
                intensity: 0.3, 
                rippleSpeed: 0.2,
                description: 'minimal β amplitude, nearly flat spacetime'
            },
            emergency: { 
                color: '#FF4000', 
                intensity: 2.0, 
                rippleSpeed: 1.0,
                description: 'maximum β-field strength, rapid metric distortion'
            },
            standby: { 
                color: '#4080FF', 
                intensity: 0.1, 
                rippleSpeed: 0.05,
                description: 'β ≈ 0, flat Minkowski background'
            }
        };
        
        const config = configs[mode] || configs.hover;
        
        return {
            ...config,
            warpStrength: config.intensity * (power / 100) * (duty * 10),
            // Power modulates animation speed (Emergency mode races)
            time: performance.now() * 0.001 * config.rippleSpeed * Math.sqrt(power / 50)
        };
    }
    
    drawWarpGrid(ctx, w, h, effects) {
        const gridSize = 60; // ultra-high resolution for smooth Natário contours
        const centerX = w / 2;
        const centerY = h / 2;
        
        // 3D Camera setup for proper depth perception
        const cameraEye = [0.0, 0.25, 1.4];    // raised & pulled back
        const cameraCenter = [0.0, 0.0, 0.0];  // looking at origin
        const cameraUp = [0.0, 1.0, 0.0];      // up vector
        
        // Simple 3D to 2D projection helper
        const project3D = (x, y, z) => {
            // Simple perspective projection
            const fov = Math.PI / 4; // 45 degrees
            const aspect = w / h;
            const near = 0.1;
            const far = 10.0;
            
            // Transform to camera space
            const dx = x - cameraEye[0];
            const dy = y - cameraEye[1]; 
            const dz = z - cameraEye[2];
            
            // Simple perspective divide
            const projZ = Math.max(0.1, Math.abs(dz));
            const screenX = centerX + (dx / projZ) * centerX * 0.8;
            const screenY = centerY - (dy / projZ) * centerY * 0.8;
            
            return { x: screenX, y: screenY, depth: projZ };
        };
        
        // Proper scale matching: physical lengths to clip-space ruler
        const CLIP_HALF = 0.8; // normalized clip coordinates
        const R = (this.params.sagDepth_nm || 16) * 1e-9; // bubble radius in meters
        const VIEW_DIAM = 4 * R; // view 4× bubble diameter for closer zoom (better visibility)
        const metresPerClip = VIEW_DIAM / (2 * CLIP_HALF); // consistent length scale
        
        const duty = this.params.dutyCycle || 0.14;
        const gammaGeo = this.params.gammaGeo || 26;
        const Qdyn = this.params.Qdyn || 1e9;
        const gammaVdB = this.params.gammaVdB || 1e11;
        
        // Use directly injected β₀ if available, otherwise compute amplifier chain
        const beta0 = this.uniforms.beta0 || (duty * gammaGeo * Math.sqrt(Qdyn) * Math.pow(gammaVdB, 0.25));
        const normScale = Math.min(w, h) / 2; // screen scale for ±0.8 range
        
        console.log(`Natário params: R=${R*1e9}nm, β₀=${beta0.toExponential(3)}, VIEW=${VIEW_DIAM*1e9}nm (ZOOMED)`);
        console.log('Scale Debug:', { R_nm: R*1e9, VIEW_nm: VIEW_DIAM*1e9, metresPerClip, zoom: '4×' });
        
        // Draw grid with authentic Natário warp deformation
        for (let i = 0; i <= gridSize; i++) {
            // Horizontal lines with scientific Natário deformation
            ctx.beginPath();
            const lineVertices = [];
            
            for (let j = 0; j <= gridSize; j++) {
                // Map to 3D world coordinates
                const worldX = ((j / gridSize) - 0.5) * 2.0; // -1 to +1
                const worldZ = ((i / gridSize) - 0.5) * 2.0; // -1 to +1
                let worldY = 0; // start flat
                
                // Debug toggle for warp effects  
                if (this.debugDisableWarp) {
                    // Render flat grid without warp
                    const projected = project3D(worldX, worldY, worldZ);
                    
                    if (j === 0) {
                        ctx.moveTo(projected.x, projected.y);
                    } else {
                        ctx.lineTo(projected.x, projected.y);
                    }
                    continue;
                }
                
                // (i) Authentic Natário β profile with proper scaling
                const r = Math.sqrt(worldX*worldX + worldZ*worldZ) * metresPerClip; // physical radius
                const s = r / R; // normalized radius
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // Natário canonical bell profile
                
                // Debug first vertex β calculation
                if (i === 0 && j === 0) {
                    console.log('β Debug:', { r_nm: r*1e9, R_nm: R*1e9, s, beta0, beta_magnitude });
                }
                
                // Apply Y displacement for Natário warp bubble height
                // Amplification mode selection
                let visualScale;
                if (this.amplificationMode === 'legacy') {
                    // Original small β₀ values
                    const legacyBeta0 = duty * gammaGeo; // Just duty × γ_geo
                    const legacyBetaMag = legacyBeta0 * s * Math.exp(-s * s);
                    worldY = (legacyBetaMag / metresPerClip) * 200;
                    visualScale = 1.0;
                } else if (this.amplificationMode === 'amplified') {
                    // Force full amplification visible
                    visualScale = 1e-4; // More aggressive scaling
                } else {
                    // Auto mode - dynamically scale based on β₀ magnitude
                    if (beta0 > 1e6) {
                        visualScale = 1e-6;  // High amplification: scale down heavily
                    } else if (beta0 > 1e3) {
                        visualScale = 1e-3;  // Medium amplification: moderate scaling
                    } else {
                        visualScale = 1.0;   // Low amplification: no extra scaling
                    }
                }
                const yDisplacement = (beta_magnitude * visualScale) / metresPerClip * 200; // increased base scale
                worldY = yDisplacement;
                
                // Clamp warp displacement for stability (increased range for amplified effects)
                worldY = Math.max(-1.5, Math.min(1.5, worldY));
                
                // Debug logging once per frame
                if (i === 0 && j === 0) {
                    console.log('Warp Debug:', { 
                        r_nm: r*1e9, 
                        s: s.toFixed(3), 
                        beta: beta_magnitude.toExponential(3),
                        beta0: beta0.toExponential(3),
                        visualScale: visualScale,
                        yShiftClip: worldY.toFixed(6)
                    });
                }
                
                // Color-code the warp field strength for visibility (exaggerated for visual feedback)
                const warpIntensity = Math.abs(beta_magnitude * 1e7); // exaggerate ONLY for color, not geometry
                const red = Math.min(1, warpIntensity * 2);
                const green = Math.min(1, warpIntensity * 0.5);
                const blue = 0.3 + Math.min(0.7, warpIntensity);
                
                // Log once per frame to verify parameter flow
                if (i === 0 && j === 0) {
                    console.log('Engine Uniforms:', { 
                        amplifier_chain: {
                            duty: duty,
                            γ_geo: gammaGeo,
                            Q_dyn: Qdyn.toExponential(1),
                            γ_VdB: gammaVdB.toExponential(1)
                        },
                        beta0: beta0.toExponential(3),
                        sagDepth: this.params.sagDepth_nm,
                        mode: this.params.currentMode,
                        maxBeta: beta_magnitude.toExponential(3)
                    });
                }
                
                // (ii) Authentic energy density: ρ = (|∇×β|² - |∇β|²)/(16π)
                // Simplified for radially symmetric β in +x direction
                const dr_ds = (1 - 2*s*s) * Math.exp(-s*s); // d/ds[s*exp(-s²)]
                const gradBeta = beta0 * dr_ds / R; // |∇β|
                const gradBeta2 = gradBeta * gradBeta;
                const curlBeta2 = 0; // curl of radial field is zero
                const rho = (curlBeta2 - gradBeta2) / (16 * Math.PI); // authentic Natário energy density
                
                // Project 3D world coordinates to 2D screen with proper 3D camera
                const projected = project3D(worldX, worldY, worldZ);
                
                // Use color-coded β field strength for visibility
                const rgbColor = `rgb(${Math.round(red*255)}, ${Math.round(green*255)}, ${Math.round(blue*255)})`;
                ctx.strokeStyle = warpIntensity > 0.0001 ? rgbColor : effects.color;
                ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, warpIntensity);
                ctx.lineWidth = 1 + Math.min(2, warpIntensity * 5); // vary line thickness with β strength
                
                lineVertices.push({ x: projected.x, y: projected.y, rho: projected.depth });
                
                if (j === 0) {
                    ctx.moveTo(projected.x, projected.y);
                } else {
                    ctx.lineTo(projected.x, projected.y);
                }
            }
            ctx.stroke();
            
            // Draw energy density indicators for exotic matter regions
            lineVertices.forEach(vertex => {
                if (vertex.rho < -1e6) { // significant exotic energy
                    ctx.fillStyle = '#FF00FF'; // magenta for exotic matter
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(vertex.x, vertex.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        
        // Vertical lines with same 3D treatment
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            for (let j = 0; j <= gridSize; j++) {
                // Map to 3D world coordinates
                const worldX = ((i / gridSize) - 0.5) * 2.0; // -1 to +1
                const worldZ = ((j / gridSize) - 0.5) * 2.0; // -1 to +1
                let worldY = 0; // start flat
                
                // Debug toggle for vertical lines too
                if (this.debugDisableWarp) {
                    // Render flat vertical lines without warp
                    const projected = project3D(worldX, worldY, worldZ);
                    
                    if (j === 0) {
                        ctx.moveTo(projected.x, projected.y);
                    } else {
                        ctx.lineTo(projected.x, projected.y);
                    }
                    continue;
                }
                
                const r = Math.sqrt(worldX*worldX + worldZ*worldZ) * metresPerClip; // physical radius
                const s = r / R;
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // authentic Natário profile
                
                // Apply Y displacement for Natário warp bubble height (same scaling as horizontal)
                let visualScale;
                if (beta0 > 1e6) {
                    visualScale = 1e-6;  // High amplification: scale down heavily
                } else if (beta0 > 1e3) {
                    visualScale = 1e-3;  // Medium amplification: moderate scaling
                } else {
                    visualScale = 1.0;   // Low amplification: no extra scaling
                }
                const yDisplacement = (beta_magnitude * visualScale) / metresPerClip * 200; // increased base scale
                worldY = yDisplacement;
                
                // Clamp warp displacement for stability (increased range for amplified effects)
                worldY = Math.max(-1.5, Math.min(1.5, worldY));
                
                // Project 3D world coordinates to 2D screen
                const projected = project3D(worldX, worldY, worldZ);
                
                ctx.strokeStyle = effects.color;
                ctx.globalAlpha = 0.6;
                
                if (j === 0) {
                    ctx.moveTo(projected.x, projected.y);
                } else {
                    ctx.lineTo(projected.x, projected.y);
                }
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawModeIndicator(ctx, effects) {
        ctx.fillStyle = effects.color;
        ctx.font = '12px monospace';
        
        // Scientific parameters display with amplifier chain
        const duty_disp = this.params.dutyCycle || 0.14;
        const gamma_geo_disp = this.params.gammaGeo || 26;
        const Q_dyn_disp = this.params.Qdyn || 1e9;
        const gamma_VdB_disp = this.params.gammaVdB || 1e11;
        const beta0_disp = duty_disp * gamma_geo_disp * Math.sqrt(Q_dyn_disp) * Math.pow(gamma_VdB_disp, 0.25);
        const R_nm = this.params.sagDepth_nm || 16;
        
        ctx.fillText(`${this.params.currentMode?.toUpperCase() || 'HOVER'} MODE - NATÁRIO BUBBLE`, 10, 25);
        ctx.fillText(`${effects.description}`, 10, 40);
        ctx.fillText(`β₀: ${beta0_disp.toExponential(2)} | R: ${R_nm}nm | P: ${this.params.powerAvg_MW?.toFixed(1) || '0.0'}MW`, 10, 55);
        ctx.fillText(`Amplifiers: γ=${gamma_geo_disp} × Q=${Q_dyn_disp.toExponential(0)} × VdB=${gamma_VdB_disp.toExponential(0)}^0.25`, 10, 70);
        ctx.fillText(`Duty: ${(duty_disp * 100).toFixed(1)}% | Mode: ${this.amplificationMode.toUpperCase()} | γᵢⱼ = δᵢⱼ + βᵢβⱼ`, 10, 85);
        ctx.fillText(`Press 'A' to toggle amplification modes`, 10, 100);
        
        // Energy density indicator
        ctx.fillStyle = '#FF00FF';
        ctx.font = '10px monospace';
        ctx.fillText('● Exotic matter regions (ρ < 0)', 10, 90);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Export
window.SimpleWarpEngine = SimpleWarpEngine;
console.log('🎯 SimpleWarpEngine loaded - 2D Canvas fallback', Date.now());