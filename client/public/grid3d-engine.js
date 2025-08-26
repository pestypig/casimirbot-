// public/grid3d-engine.js
(function (global) {
  const WE = global.WarpEngine;
  if (!WE) throw new Error('warp-engine.js must load before grid3d-engine.js');

  class Grid3DShowEngine extends WE {
    constructor(canvas){
      super(canvas);
      // defaults
      this._dprOverride = null;
      this._ssaa = 1;
      this._forceDivisions = null;
      this._meshOpts = {
        showXZ: true,  // horizontal "decks" (stack along Y)
        showXY: false, // front/back slices (stack along Z)
        showYZ: false, // side slices (stack along X)
        layersXZ: 1,   // how many deck planes
        layersXY: 0,   // how many XY planes
        layersYZ: 0,   // how many YZ planes
        divisions: null // base divisions per plane (falls back to WarpEngine logic)
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
        this.gl.viewport(0, 0, width, height);
        this._applyOverheadCamera({ spanHint: this._gridSpan || 1.0 });
      }
    }

    // ---- mesh generator (overrides parent) -----------------------------------
    _createGrid(span, divisions) {
      const div = (this._meshOpts.divisions || this._forceDivisions || divisions);
      // defer to parent's division logic first (it adapts to hull & wall width)
      const base = super._createGrid(span, div);
      // If no mesh families requested, return parent's single XZ sheet
      const { showXZ, showXY, showYZ, layersXZ, layersXY, layersYZ } = this._meshOpts;
      if (!showXZ && !showXY && !showYZ) return base;

      const verts = [];

      const addXZPlanes = (nLayers) => {
        // constant Y planes, grid along X & Z
        const half = span;
        const step = (span * 2) / Math.max(2, (div|0));
        const yLevels = nLayers <= 1 ? [0] : [...Array(nLayers)].map((_,i)=> -half + (i/(nLayers-1))*2*half);
        for (const y of yLevels) {
          // X lines
          for (let z= -half; z<=half+1e-9; z+=step){
            for (let x=-half; x< half-1e-9; x+=step){
              verts.push(x, y, z, x+step, y, z);
            }
          }
          // Z lines
          for (let x= -half; x<=half+1e-9; x+=step){
            for (let z=-half; z< half-1e-9; z+=step){
              verts.push(x, y, z, x, y, z+step);
            }
          }
        }
      };

      const addXYPlanes = (nLayers) => {
        // constant Z planes, grid along X & Y
        const half = span;
        const step = (span * 2) / Math.max(2, (div|0));
        const zLevels = nLayers <= 1 ? [0] : [...Array(nLayers)].map((_,i)=> -half + (i/(nLayers-1))*2*half);
        for (const z of zLevels) {
          // X lines
          for (let y= -half; y<=half+1e-9; y+=step){
            for (let x=-half; x< half-1e-9; x+=step){
              verts.push(x, y, z, x+step, y, z);
            }
          }
          // Y lines
          for (let x= -half; x<=half+1e-9; x+=step){
            for (let y=-half; y< half-1e-9; y+=step){
              verts.push(x, y, z, x, y+step, z);
            }
          }
        }
      };

      const addYZPlanes = (nLayers) => {
        // constant X planes, grid along Y & Z
        const half = span;
        const step = (span * 2) / Math.max(2, (div|0));
        const xLevels = nLayers <= 1 ? [0] : [...Array(nLayers)].map((_,i)=> -half + (i/(nLayers-1))*2*half);
        for (const x of xLevels) {
          // Y lines
          for (let z= -half; z<=half+1e-9; z+=step){
            for (let y=-half; y< half-1e-9; y+=step){
              verts.push(x, y, z, x, y+step, z);
            }
          }
          // Z lines
          for (let y= -half; y<=half+1e-9; y+=step){
            for (let z=-half; z< half-1e-9; z+=step){
              verts.push(x, y, z, x, y, z+step);
            }
          }
        }
      };

      // Always include at least the parent's single XZ sheet as a base
      if (showXZ) addXZPlanes(Math.max(1, layersXZ));
      if (showXY) addXYPlanes(layersXY|0);
      if (showYZ) addYZPlanes(layersYZ|0);

      // merge parent base (one deck) + our extra families
      const merged = new Float32Array(base.length + verts.length);
      merged.set(base, 0);
      merged.set(new Float32Array(verts), base.length);
      return merged;
    }
  }

  global.Grid3DShowEngine = Grid3DShowEngine;
})(globalThis);