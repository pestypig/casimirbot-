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
            gammaVanDenBroeck: 286000,
            sagDepth_nm: 16,
            g_y: 26,
            exoticMass_kg: 1405
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
        const gridSize = 60; // ultra-high resolution for smooth Natário contours
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Proper scale matching: physical lengths to clip-space ruler
        const CLIP_HALF = 0.8; // normalized clip coordinates
        const R = (this.params.sagDepth_nm || 16) * 1e-9; // bubble radius in meters
        const VIEW_DIAM = 4 * R; // view 4× bubble diameter for closer zoom (better visibility)
        const metresPerClip = VIEW_DIAM / (2 * CLIP_HALF); // consistent length scale
        
        const duty = this.params.dutyCycle || 0.14;
        const gamma_geo = this.params.g_y || 26;
        const beta0 = duty * gamma_geo; // β₀ = duty × γ_geo
        const normScale = Math.min(w, h) / 2; // screen scale for ±0.8 range
        
        console.log(`Natário params: R=${R*1e9}nm, β₀=${beta0.toFixed(3)}, VIEW=${VIEW_DIAM*1e9}nm (ZOOMED)`);
        console.log('Scale Debug:', { R_nm: R*1e9, VIEW_nm: VIEW_DIAM*1e9, metresPerClip, zoom: '4×' });
        
        // Draw grid with authentic Natário warp deformation
        for (let i = 0; i <= gridSize; i++) {
            // Horizontal lines with scientific Natário deformation
            ctx.beginPath();
            const lineVertices = [];
            
            for (let j = 0; j <= gridSize; j++) {
                const screenX = (j / gridSize) * w;
                const screenY = (i / gridSize) * h;
                
                // Convert screen to normalized clip coordinates (-0.8 to 0.8)
                const clipX = (screenX - centerX) / normScale * CLIP_HALF;
                const clipY = (screenY - centerY) / normScale * CLIP_HALF;
                const clipZ = 0; // 2D projection
                
                // Debug toggle for warp effects  
                if (this.debugDisableWarp) {
                    // Render flat grid without warp
                    const finalX = centerX + clipX * normScale / CLIP_HALF;
                    const finalY = centerY + clipY * normScale / CLIP_HALF;
                    
                    if (j === 0) {
                        ctx.moveTo(finalX, finalY);
                    } else {
                        ctx.lineTo(finalX, finalY);
                    }
                    continue;
                }
                
                // (i) Authentic Natário β profile with proper scaling
                const r = Math.sqrt(clipX*clipX + clipY*clipY + clipZ*clipZ) * metresPerClip; // physical radius
                const s = r / R; // normalized radius
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // Natário canonical bell profile
                
                // Debug first vertex β calculation
                if (i === 0 && j === 0) {
                    console.log('β Debug:', { r_nm: r*1e9, R_nm: R*1e9, s, beta0, beta_magnitude });
                }
                
                // Convert β displacement to clip space with clamping for stability
                const xShiftPhysical = beta_magnitude; // β displacement in meters
                let xShiftClip = xShiftPhysical / metresPerClip; // convert to clip coordinates
                
                // Clamp warp displacement to prevent vertices from leaving clip space
                xShiftClip = Math.max(-0.1, Math.min(0.1, xShiftClip));
                
                // Debug logging once per frame
                if (i === 0 && j === 0) {
                    console.log('Warp Debug:', { 
                        r_nm: r*1e9, 
                        s: s.toFixed(3), 
                        beta: beta_magnitude.toExponential(3),
                        pushClip: xShiftClip.toFixed(6)
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
                        beta0: this.params.dutyCycle * this.params.g_y,
                        sagDepth: this.params.sagDepth_nm,
                        mode: this.params.currentMode,
                        maxBeta: beta_magnitude
                    });
                }
                
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
                
                // Convert back to screen coordinates with proper scaling
                const finalX = centerX + (clipX + xShiftClip) * normScale / CLIP_HALF;
                const finalY = centerY + stretchedY * normScale / CLIP_HALF;
                
                // Use color-coded β field strength for visibility
                const rgbColor = `rgb(${Math.round(red*255)}, ${Math.round(green*255)}, ${Math.round(blue*255)})`;
                ctx.strokeStyle = warpIntensity > 0.0001 ? rgbColor : effects.color;
                ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, warpIntensity);
                ctx.lineWidth = 1 + Math.min(2, warpIntensity * 5); // vary line thickness with β strength
                
                lineVertices.push({ x: finalX, y: finalY, rho: rho });
                
                // Sanity check - log first vertex per frame (removed since moved above)
                
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
                
                const clipX = (screenX - centerX) / normScale * CLIP_HALF;
                const clipY = (screenY - centerY) / normScale * CLIP_HALF;
                const clipZ = 0;
                
                // Debug toggle for vertical lines too
                if (this.debugDisableWarp) {
                    // Render flat vertical lines without warp
                    const finalX = centerX + clipX * normScale / CLIP_HALF;
                    const finalY = centerY + clipY * normScale / CLIP_HALF;
                    
                    if (j === 0) {
                        ctx.moveTo(finalX, finalY);
                    } else {
                        ctx.lineTo(finalX, finalY);
                    }
                    continue;
                }
                
                const r = Math.sqrt(clipX*clipX + clipY*clipY + clipZ*clipZ) * metresPerClip; // physical radius
                const s = r / R;
                const beta_magnitude = beta0 * s * Math.exp(-s * s); // authentic Natário profile
                
                let xShiftClip = beta_magnitude / metresPerClip; // proper scaling
                xShiftClip = Math.max(-0.1, Math.min(0.1, xShiftClip)); // clamp for stability
                
                const stretchedY = clipY; // keep spatial metric flat per Natário
                
                const finalX = centerX + (clipX + xShiftClip) * normScale / CLIP_HALF;
                const finalY = centerY + stretchedY * normScale / CLIP_HALF;
                
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
        
        // Real-time β calculations display at bottom
        this.drawBetaCalculations(ctx, w, h, beta0, R, VIEW_DIAM);
    }
    
    drawBetaCalculations(ctx, w, h, beta0, R, viewDiam) {
        const startY = h - 140;
        ctx.fillStyle = '#00FFFF';
        ctx.font = '11px monospace';
        
        // Real-time β sampling at key points
        const samplePoints = [
            { name: 'Center', s: 0, r: 0 },
            { name: 'R/2', s: 0.5, r: 0.5 * R },
            { name: 'R', s: 1.0, r: R },
            { name: 'Edge', s: viewDiam/(2*R), r: viewDiam/2 }
        ];
        
        const samples = samplePoints.map(pt => {
            const beta = beta0 * pt.s * Math.exp(-pt.s * pt.s);
            return `${pt.name}(s=${pt.s.toFixed(2)}): β=${beta.toExponential(2)}`;
        }).join('  |  ');
        
        // Physics equations display
        const equations = [
            `β(r) = β₀ × (r/R) × exp(-r²/R²)   [Natário 2002 Canonical Bell Profile]`,
            `β₀ = duty × γ_geo = ${(this.params.dutyCycle || 0.14).toFixed(3)} × ${this.params.g_y || 26} = ${beta0.toFixed(3)}`,
            `R = ${(R*1e9).toFixed(1)}nm   |   View = ${(viewDiam*1e9).toFixed(1)}nm (4× zoom)   |   s_max = ${(viewDiam/(2*R)).toFixed(2)}`,
            `Live β Samples: ${samples}`,
            `γᵢⱼ = δᵢⱼ (flat spatial metric)   |   ρ = (|∇×β|² - |∇β|²)/(16π)   [Authentic Energy Density]`,
            `${this.debugDisableWarp ? '🔧 WARP DISABLED (Press W to enable)' : '🔥 WARP ENABLED (Press W to disable)'}`
        ];
        
        equations.forEach((eq, i) => {
            ctx.fillText(eq, 10, startY + i * 15);
        });
        
        // Live parameter updates box
        const paramBox = [
            `Mode: ${this.params.currentMode || 'hover'}  |  Power: ${(this.params.powerAvg_MW || 83.3).toFixed(1)}MW`,
            `Duty: ${((this.params.dutyCycle || 0.14) * 100).toFixed(1)}%  |  Q: ${(this.params.cavityQ || 1e9).toExponential(0)}`,
            `Exotic Mass: ${this.params.exoticMass_kg || 1405}kg  |  Sag Depth: ${this.params.sagDepth_nm || 16}nm`
        ];
        
        // Semi-transparent background for readability
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.fillRect(w - 400, startY - 10, 390, 80);
        
        ctx.fillStyle = '#00FF88';
        ctx.font = '10px monospace';
        paramBox.forEach((param, i) => {
            ctx.fillText(param, w - 395, startY + 5 + i * 15);
        });
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