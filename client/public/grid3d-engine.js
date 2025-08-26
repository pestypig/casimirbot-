// public/grid3d-engine.js (or any served JS module)
(function (global) {
  const WE = global.WarpEngine;
  if (!WE) throw new Error('warp-engine.js must load before grid3d-engine.js');

  class Grid3DShowEngine extends WE {
    setPixelRatio(pr) {
      this._dprOverride = Math.max(1, Math.min(3, +pr || 1));
      this._resizeCanvasToDisplaySize();
    }
    setSupersample(ss) {
      this._ssaa = Math.max(1, Math.min(2, +ss || 1));
      this._resizeCanvasToDisplaySize();
    }
    setGridResolution({ divisions, radial, angular, axial } = {}) {
      // map any of these to the grid 'divisions' used by WarpEngine
      const pick = [divisions, radial, angular, axial].find(v => Number.isFinite(v));
      if (Number.isFinite(pick)) this._forceDivisions = Math.max(24, pick | 0);
      // will be consumed on next _createGrid call
      this._updateGrid?.();
    }

    // override to honor DPR + SSAA knobs
    _resizeCanvasToDisplaySize() {
      // base DPR
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

    // forward any forced divisions into the parent grid builder
    _createGrid(span, divisions) {
      const div = this._forceDivisions || divisions;
      return super._createGrid(span, div);
    }
  }

  global.Grid3DShowEngine = Grid3DShowEngine;
})(globalThis);