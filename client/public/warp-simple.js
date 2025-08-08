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
        
        this.params = { ...this.params, ...parameters };
        
        console.log('🎯 Mode Update:', {
            mode: this.params.currentMode,
            power: this.params.powerAvg_MW,
            duty: this.params.dutyCycle
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
        const beta0 = (this.params.dutyCycle || 0.14) * (this.params.g_y || 26); // peak β
        const direction = [1, 0, 0]; // +x direction warp bubble
        const normScale = Math.min(w, h) / 4; // screen to physical scale
        
        console.log(`Natário params: R=${R*1e9}nm, β₀=${beta0.toFixed(3)}, power=${this.params.powerAvg_MW}MW`);
        
        // Draw grid with authentic Natário warp deformation
        for (let i = 0; i <= gridSize; i++) {
            // Horizontal lines with scientific Natário deformation
            ctx.beginPath();
            const lineVertices = [];
            
            for (let j = 0; j <= gridSize; j++) {
                const screenX = (j / gridSize) * w;
                const screenY = (i / gridSize) * h;
                
                // Convert to physical coordinates (meters)
                const physX = (screenX - centerX) / normScale * 1e-9;
                const physY = (screenY - centerY) / normScale * 1e-9;
                const physZ = 0; // 2D projection
                
                // (i) Apply β as translation in +x direction
                const r_perp = Math.sqrt(physY * physY + physZ * physZ); // orthogonal radius
                const prof = (r_perp / R) * Math.exp(-r_perp * r_perp / (R * R)); // Natário profile
                const beta = beta0 * prof;
                const xShift = beta * direction[0]; // shift along chosen direction
                
                // (ii) Adjust transverse metric: γᵢⱼ = δᵢⱼ + βᵢβⱼ
                const stretch = Math.sqrt(1 + beta * beta); // metric correction
                const stretchedY = physY * stretch;
                const stretchedZ = physZ * stretch;
                
                // (iii) Derive energy density from β
                const laplacian = (2/R - 2*r_perp*r_perp/(R*R*R)) * beta0 * Math.exp(-r_perp*r_perp/(R*R));
                const rho = -(beta * laplacian) / (8 * Math.PI * 6.674e-11); // J/m³
                
                // Convert back to screen coordinates
                const finalX = centerX + (physX + xShift) * normScale * 1e9;
                const finalY = centerY + stretchedY * normScale * 1e9;
                
                // Color based on energy density (exotic = magenta, normal = cyan)
                const energyIntensity = Math.abs(rho) / 1e8; // normalize
                const isExotic = rho < 0;
                const red = isExotic ? Math.min(1, energyIntensity) : 0;
                const green = isExotic ? 0.3 * Math.min(1, energyIntensity) : Math.min(1, energyIntensity);
                const blue = Math.min(1, energyIntensity);
                
                ctx.strokeStyle = effects.color; // Keep mode color for primary effect
                ctx.globalAlpha = 0.6 + 0.4 * Math.min(1, energyIntensity);
                
                lineVertices.push({ x: finalX, y: finalY, rho: rho });
                
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
                
                const physX = (screenX - centerX) / normScale * 1e-9;
                const physY = (screenY - centerY) / normScale * 1e-9;
                const physZ = 0;
                
                const r_perp = Math.sqrt(physY * physY + physZ * physZ);
                const prof = (r_perp / R) * Math.exp(-r_perp * r_perp / (R * R));
                const beta = beta0 * prof;
                const xShift = beta * direction[0];
                
                const stretch = Math.sqrt(1 + beta * beta);
                const stretchedY = physY * stretch;
                
                const finalX = centerX + (physX + xShift) * normScale * 1e9;
                const finalY = centerY + stretchedY * normScale * 1e9;
                
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