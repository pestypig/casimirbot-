class SimpleWarpEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationId = null;
        this.initialized = false;
        
        // Default operational mode parameters
        this.params = {
            dutyCycle: 0.14,
            powerAvg_MW: 83.3,
            currentMode: 'hover',
            sectorStrobing: 1,
            qSpoilingFactor: 1,
            gammaVanDenBroeck: 286000
        };
        
        this.init();
    }
    
    init() {
        console.log('🎯 SimpleWarpEngine initialized');
        this.resize();
        this.initialized = true;
        this.startRenderLoop();
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
        
        console.log('🎯 Mode Update:', {
            mode: this.params.currentMode,
            power: this.params.powerAvg_MW,
            duty: this.params.dutyCycle,
            beta0: (this.params.dutyCycle * this.params.g_y).toFixed(3),
            sagDepth: this.params.sagDepth_nm + 'nm'
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
        const gridSize = 20;
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Scientifically correct Natário parameters
        const R = (this.params.sagDepth_nm || 16) * 1e-9; // bubble radius in meters
        const duty = this.params.dutyCycle || 0.14;
        const gamma_geo = this.params.g_y || 26;
        const beta0 = duty * gamma_geo; // β₀ = duty × γ_geo
        const direction = [1, 0, 0]; // +x direction warp bubble
        const normScale = Math.min(w, h) / 4; // screen to physical scale
        
        console.log(`Natário params: R=${R*1e9}nm, β₀=${beta0.toFixed(3)}, power=${this.params.powerAvg_MW}MW`);
        console.log('Physics Debug:', { duty, gamma_geo, beta0, params: this.params });
        
        // Draw grid with authentic Natário warp deformation
        for (let i = 0; i <= gridSize; i++) {
            // Horizontal lines with scientific Natário deformation
            ctx.beginPath();
            const lineVertices = [];
            
            for (let j = 0; j <= gridSize; j++) {
                const screenX = (j / gridSize) * w;
                const screenY = (i / gridSize) * h;
                
                // Convert screen to normalized clip coordinates (-0.8 to 0.8)
                const clipX = (screenX - centerX) / normScale * 0.8;
                const clipY = (screenY - centerY) / normScale * 0.8;
                const clipZ = 0; // 2D projection
                
                // (i) Authentic Natário β profile: β(r) = β₀ * (r/R) * exp(-r²/R²)
                const r = Math.sqrt(clipX*clipX + clipY*clipY + clipZ*clipZ) * 20e-6; // total radius in meters
                const s = r / R; // normalized radius
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // Natário canonical bell profile
                const beta_x = beta_magnitude; // +x direction translation
                const beta_y = 0;
                const beta_z = 0;
                
                // Debug first vertex β calculation
                if (i === 0 && j === 0) {
                    console.log('β Debug:', { r, R, s, beta0, beta_magnitude });
                }
                
                // Convert β (dimensionless) to clip-space units properly
                const metresPerClip = 20e-6 / 1.6; // 20 µm field / 1.6 clip range
                const exaggerate = 150.0; // temporary visibility boost
                const xShiftClip = (beta_x / metresPerClip) * exaggerate;
                
                // (ii) Correct Natário spatial metric: γᵢⱼ = δᵢⱼ (keep flat!)
                // The β² term goes in the lapse function, not spatial metric
                const stretchedY = clipY; // no artificial stretching
                const stretchedZ = clipZ;
                
                // (iii) Authentic energy density: ρ = (|∇×β|² - |∇β|²)/(16π)
                // Simplified for radially symmetric β in +x direction
                const dr_ds = (1 - 2*s*s) * Math.exp(-s*s); // d/ds[s*exp(-s²)]
                const gradBeta = beta0 * dr_ds / R; // |∇β|
                const gradBeta2 = gradBeta * gradBeta;
                const curlBeta2 = 0; // curl of radial field is zero
                const rho = (curlBeta2 - gradBeta2) / (16 * Math.PI); // authentic Natário energy density
                
                // Convert back to screen coordinates (no more 1e9 multiplication!)
                const finalX = centerX + (clipX + xShiftClip) * normScale / 0.8;
                const finalY = centerY + stretchedY * normScale / 0.8;
                
                // Color based on energy density (exotic = magenta, normal = cyan)
                const energyIntensity = Math.abs(rho) / 1e8; // normalize
                const isExotic = rho < 0;
                const red = isExotic ? Math.min(1, energyIntensity) : 0;
                const green = isExotic ? 0.3 * Math.min(1, energyIntensity) : Math.min(1, energyIntensity);
                const blue = Math.min(1, energyIntensity);
                
                ctx.strokeStyle = effects.color; // Keep mode color for primary effect
                ctx.globalAlpha = 0.6 + 0.4 * Math.min(1, energyIntensity);
                
                lineVertices.push({ x: finalX, y: finalY, rho: rho });
                
                // Sanity check - log first vertex per frame
                if (i === 0 && j === 0) {
                    console.log(`β₀≈${beta0.toExponential(2)} max|β|≈${beta_magnitude.toExponential(2)} shiftClip≈${xShiftClip.toFixed(3)}`);
                }
                
                if (j === 0) {
                    ctx.moveTo(finalX, finalY);
                } else {
                    ctx.lineTo(finalX, finalY);
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
        
        // Vertical lines with same scientific treatment
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            for (let j = 0; j <= gridSize; j++) {
                const screenX = (i / gridSize) * w;
                const screenY = (j / gridSize) * h;
                
                const clipX = (screenX - centerX) / normScale * 0.8;
                const clipY = (screenY - centerY) / normScale * 0.8;
                const clipZ = 0;
                
                const r = Math.sqrt(clipX*clipX + clipY*clipY + clipZ*clipZ) * 20e-6; // total radius
                const s = r / R;
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // authentic Natário profile
                
                const metresPerClip = 20e-6 / 1.6;
                const exaggerate = 150.0; // temporary visibility boost
                const xShiftClip = (beta_magnitude / metresPerClip) * exaggerate;
                
                const stretchedY = clipY; // keep spatial metric flat per Natário
                
                const finalX = centerX + (clipX + xShiftClip) * normScale / 0.8;
                const finalY = centerY + stretchedY * normScale / 0.8;
                
                ctx.strokeStyle = effects.color;
                ctx.globalAlpha = 0.6;
                
                if (j === 0) {
                    ctx.moveTo(finalX, finalY);
                } else {
                    ctx.lineTo(finalX, finalY);
                }
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawModeIndicator(ctx, effects) {
        ctx.fillStyle = effects.color;
        ctx.font = '12px monospace';
        
        // Scientific parameters display
        const beta0 = (this.params.dutyCycle || 0.14) * (this.params.g_y || 26);
        const R_nm = this.params.sagDepth_nm || 16;
        
        ctx.fillText(`${this.params.currentMode?.toUpperCase() || 'HOVER'} MODE - NATÁRIO BUBBLE`, 10, 25);
        ctx.fillText(`${effects.description}`, 10, 40);
        ctx.fillText(`β₀: ${beta0.toFixed(3)} | R: ${R_nm}nm | P: ${this.params.powerAvg_MW?.toFixed(1) || '0.0'}MW`, 10, 55);
        ctx.fillText(`Duty: ${(this.params.dutyCycle * 100).toFixed(1)}% | γᵢⱼ = δᵢⱼ + βᵢβⱼ`, 10, 70);
        
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