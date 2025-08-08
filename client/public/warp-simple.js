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
                description: 'gentle bulge, slow ripple'
            },
            cruise: { 
                color: '#00FF80', 
                intensity: 0.3, 
                rippleSpeed: 0.2,
                description: 'field nearly flat, faint ripple'
            },
            emergency: { 
                color: '#FF4000', 
                intensity: 2.0, 
                rippleSpeed: 1.0,
                description: 'strong bulge, fast shimmer'
            },
            standby: { 
                color: '#4080FF', 
                intensity: 0.1, 
                rippleSpeed: 0.05,
                description: 'grid perfectly flat, background calm'
            }
        };
        
        const config = configs[mode] || configs.hover;
        
        return {
            ...config,
            warpStrength: config.intensity * (power / 100) * (duty * 10),
            time: performance.now() * 0.001 * config.rippleSpeed
        };
    }
    
    drawWarpGrid(ctx, w, h, effects) {
        ctx.strokeStyle = effects.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        
        const gridSize = 20;
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Draw grid with warp deformation
        for (let i = 0; i <= gridSize; i++) {
            // Horizontal lines
            ctx.beginPath();
            for (let j = 0; j <= gridSize; j++) {
                const x = (j / gridSize) * w;
                const y = (i / gridSize) * h;
                
                // Calculate distance from center for warp effect
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy) / (Math.min(w, h) / 2);
                
                // Apply Natário-style warp deformation
                const warpEffect = Math.exp(-dist * dist) * effects.warpStrength;
                const warpY = y + Math.sin(effects.time + dist) * warpEffect * 20;
                
                if (j === 0) {
                    ctx.moveTo(x, warpY);
                } else {
                    ctx.lineTo(x, warpY);
                }
            }
            ctx.stroke();
            
            // Vertical lines
            ctx.beginPath();
            for (let j = 0; j <= gridSize; j++) {
                const x = (i / gridSize) * w;
                const y = (j / gridSize) * h;
                
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy) / (Math.min(w, h) / 2);
                
                const warpEffect = Math.exp(-dist * dist) * effects.warpStrength;
                const warpX = x + Math.cos(effects.time + dist) * warpEffect * 15;
                
                if (j === 0) {
                    ctx.moveTo(warpX, y);
                } else {
                    ctx.lineTo(warpX, y);
                }
            }
            ctx.stroke();
        }
        
        // Draw central warp bubble
        if (effects.warpStrength > 0.01) {
            const bubbleRadius = Math.min(w, h) * 0.2 * effects.warpStrength;
            ctx.beginPath();
            ctx.arc(centerX, centerY, bubbleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = effects.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawModeIndicator(ctx, effects) {
        ctx.fillStyle = effects.color;
        ctx.font = '12px monospace';
        ctx.fillText(`${this.params.currentMode?.toUpperCase() || 'HOVER'} MODE`, 10, 25);
        ctx.fillText(`${effects.description}`, 10, 40);
        ctx.fillText(`Power: ${this.params.powerAvg_MW?.toFixed(1) || '0.0'}MW`, 10, 55);
        ctx.fillText(`Duty: ${(this.params.dutyCycle * 100).toFixed(1)}%`, 10, 70);
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