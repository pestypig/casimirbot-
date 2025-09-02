
//====================================================================
//  Natário Warp‑Bubble Visualiser (NEUTERED DEMO VERSION)
//  ------------------------------------------------------------------
//  This demo engine now defers all critical operations to the
//  authoritative public/warp-engine.js to prevent conflicts.
//====================================================================

export default class WarpEngine {
    constructor(canvas) {
        console.warn('[warp-engine.demo.js] NEUTERED: Deferring to authoritative /warp-engine.js');

        // Check if authoritative engine is available
        if (window.WarpEngine && typeof window.WarpEngine === 'function') {
            // Delegate to the real engine
            const authEngine = new window.WarpEngine(canvas);

            // Copy all methods and properties to this instance
            Object.setPrototypeOf(this, authEngine);
            Object.assign(this, authEngine);

            console.log('[warp-engine.demo.js] Successfully delegated to authoritative engine');
            return authEngine;
        }

        // Fallback minimal implementation if authoritative engine not available
        this.canvas = canvas;
        this.gl = null;
        this.isLoaded = false;
        this._destroyed = false;
        this.uniforms = {};

        console.error('[warp-engine.demo.js] Authoritative engine not found - minimal fallback active');
    }

    // All critical methods defer to authoritative engine or no-op
    updateUniforms(obj) {
        console.warn('[warp-engine.demo.js] updateUniforms called on neutered engine - ignoring');
        return;
    }

    bootstrap(payload) {
        console.warn('[warp-engine.demo.js] bootstrap called on neutered engine - ignoring');
        return;
    }

    destroy() {
        this._destroyed = true;
        console.log('[warp-engine.demo.js] Neutered engine destroyed');
    }

    // Minimal compatibility methods
    onceReady(cb) {
        console.warn('[warp-engine.demo.js] onceReady called on neutered engine');
        if (typeof cb === 'function') {
            setTimeout(cb, 0);
        }
    }

    forceRedraw() {
        // No-op
    }

    setDisplayGain() {
        // No-op
    }

    _resize() {
        // No-op
    }
}
