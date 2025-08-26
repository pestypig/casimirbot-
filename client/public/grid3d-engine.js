// public/grid3d-engine.js
(function (global) {
  const WE = global.WarpEngine;
  if (!WE) throw new Error('warp-engine.js must load before grid3d-engine.js');

  class Grid3DShowEngine extends WE {
    constructor(canvas, glOrOpts, maybeOpts) {
      // normalize to (gl, opts)
      const isGL = glOrOpts && typeof glOrOpts.getContext === 'function';
      const gl = isGL ? glOrOpts : undefined;
      const opts = isGL ? (maybeOpts ?? {}) : (glOrOpts ?? {});
      super(canvas, gl, opts);
      // ALWAYS guard local reads
      const o = opts || {};
      const divisions = (o.grid && o.grid.divisions) ?? o.divisions ?? 64;
      this.setGridResolution?.({ divisions });
      this._dprOverride = null;
      this._ssaa = 1;
      this._forceDivisions = null;
      this._meshOpts = {
        showXZ: true, showXY: false, showYZ: false,
        layersXZ: 1, layersXY: 0, layersYZ: 0,
        divisions: null,
        alignToGrid: true,
      };
    }

    // ---- public knobs ---------------------------------------------------------
    setPixelRatio(pr) {
      this._dprOverride = Math.max(1, Math.min(3, +pr || 1));
      this._resizeCanvasToDisplaySize();
    }
    setSupersample(ss) {
      this._ssaa = Math.max(1, Math.min(2, +ss || 1));
      this._resizeCanvasToDisplaySize();
    }
    setGridResolution({ divisions, radial, angular, axial } = {}) {
      const pick = [divisions, radial, angular, axial].find(v => Number.isFinite(v));
      if (Number.isFinite(pick)) this._forceDivisions = Math.max(24, pick | 0);
      this._updateGrid?.();
    }
    setMeshOptions(opts = {}) {
      this._meshOpts = { ...this._meshOpts, ...opts };
      // keep counts sane
      const clampN = v => Math.max(0, Math.min(32, v|0));
      this._meshOpts.layersXZ = clampN(this._meshOpts.layersXZ);
      this._meshOpts.layersXY = clampN(this._meshOpts.layersXY);
      this._meshOpts.layersYZ = clampN(this._meshOpts.layersYZ);
      this._updateGrid?.();
    }

    // ---- DPR + SSAA aware resize ---------------------------------------------
    _resizeCanvasToDisplaySize() {
      const base = global.devicePixelRatio || 1;
      const dpr = Math.min(2.5, (this._dprOverride || base) * (this._ssaa || 1));
      const { clientWidth, clientHeight } = this.canvas;
      const width  = Math.max(1, Math.floor(clientWidth  * dpr));
      const height = Math.max(1, Math.floor(clientHeight * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.gl) this.gl.viewport(0, 0, width, height);  // ✅ guard
        this._applyOverheadCamera({ spanHint: this._gridSpan || 1.0 });
      }
    }

    // ---- mesh generator (overrides parent) -----------------------------------
    _createGrid(span, divisions) {
      const div = (this._meshOpts.divisions || this._forceDivisions || divisions);
      const base = super._createGrid(span, div);
      const { showXZ, showXY, showYZ, layersXZ, layersXY, layersYZ, alignToGrid } = this._meshOpts;
      if (!showXZ && !showXY && !showYZ) return base;

      const verts = [];
      const half = span;
      const step = (span * 2) / Math.max(2, (div|0));
      const quant = (v) => alignToGrid ? (Math.round(v/step) * step) : v;

      const levels = (n) => {
        if (n <= 1) return [0];
        return [...Array(n)].map((_,i)=> quant(-half + (i/(n-1))*2*half));
      };

      const addXZ = (n) => {
        const yLevels = levels(n);
        for (const y of yLevels) {
          for (let z= -half; z<=half+1e-9; z+=step){
            for (let x=-half; x< half-1e-9; x+=step){ verts.push(x, y, z, x+step, y, z); }
          }
          for (let x= -half; x<=half+1e-9; x+=step){
            for (let z=-half; z< half-1e-9; z+=step){ verts.push(x, y, z, x, y, z+step); }
          }
        }
      };
      const addXY = (n) => {
        const zLevels = levels(n);
        for (const z of zLevels) {
          for (let y= -half; y<=half+1e-9; y+=step){
            for (let x=-half; x< half-1e-9; x+=step){ verts.push(x, y, z, x+step, y, z); }
          }
          for (let x= -half; x<=half+1e-9; x+=step){
            for (let y=-half; y< half-1e-9; y+=step){ verts.push(x, y, z, x, y+step, z); }
          }
        }
      };
      const addYZ = (n) => {
        const xLevels = levels(n);
        for (const x of xLevels) {
          for (let z= -half; z<=half+1e-9; z+=step){
            for (let y=-half; y< half-1e-9; y+=step){ verts.push(x, y, z, x, y+step, z); }
          }
          for (let y= -half; y<=half+1e-9; y+=step){
            for (let z=-half; z< half-1e-9; z+=step){ verts.push(x, y, z, x, y, z+step); }
          }
        }
      };

      if (showXZ) addXZ(Math.max(1, layersXZ));
      if (showXY) addXY(layersXY|0);
      if (showYZ) addYZ(layersYZ|0);

      const merged = new Float32Array(base.length + verts.length);
      merged.set(base, 0);
      merged.set(new Float32Array(verts), base.length);
      return merged;
    }
  }

  global.Grid3DShowEngine = Grid3DShowEngine;
})(globalThis);