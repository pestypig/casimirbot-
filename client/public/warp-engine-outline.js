/**
 * Warp Bubble • Shell Outline (ρ = 1 ± Δ)
 * Ellipsoidal wireframes for inner / center / outer shell (Natário),
 * with interior shift vector (violet).
 */
(function () {
  const TAU = Math.PI * 2;

  // Helpers
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp  = (a, b, t) => a + (b - a) * t;

  function ellipsoidPoint(a, b, c, theta, phi) {
    const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
    const cosTh  = Math.cos(theta), sinTh = Math.sin(theta);
    const x = a * cosPhi * cosTh;
    const y = b * sinPhi;
    const z = c * cosPhi * sinTh;
    return [x, y, z];
  }

  // Very simple look-at perspective aligned with +Y up, camera at +Z
  function project(p, cam) {
    const [x, y, z] = p;
    const pe = [x - cam.eye[0], y - cam.eye[1], z - cam.eye[2]];
    const Z = -pe[2];                       // looking toward -Z
    const X = pe[0];
    const Y = pe[1];
    const sx = cam.cx + cam.f * (X / Math.max(1e-6, Z));
    const sy = cam.cy - cam.f * (Y / Math.max(1e-6, Z));
    return [sx, sy, Z];
  }

  function OutlineEngine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    this.params = {
      hullAxes: [0.42, 0.11, 0.09], // scene units
      wallWidth: 0.06,              // normalized Δρ thickness
      epsilonTilt: 0.0,
      betaTiltVec: [0, -1, 0],
      // Mode coupling
      mode: 'hover',
      dutyCycle: 0.14,
      sectors: 1,
      dutyEffectiveFR: undefined,   // ← FR window (burst/dwell)
      lightCrossing: undefined,     // ← { tauLC_ms, dwell_ms, burst_ms } (shape-agnostic bag)
      zeta: undefined,              // ← Ford–Roman ζ for HUD tint (optional)
      gammaGeo: 26,
      qSpoil: 1.0,
      qCavity: 1e9,
      // NEW: Mechanical response parameters
      qMechanical: 1,
      fMod_Hz: 15e9,
      f0_Hz: 15e9,
      mechZeta: 0.005,
      mechGain: undefined,          // compute if not provided
      debug: false,
      animate: false
    };
    this._needsFrame = false;
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
    this.debugTag = 'OutlineEngine';
  }

  OutlineEngine.prototype.setDebugTag = function (tag) {
        this.debugTag = tag || 'OutlineEngine';
    }

  OutlineEngine.prototype.destroy = function () {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    if (this.gl && this.gl.getExtension) {
      try {
        const loseContext = this.gl.getExtension('WEBGL_lose_context');
        if (loseContext) loseContext.loseContext();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  OutlineEngine.prototype.bootstrap = function (params) {
    this.updateUniforms(params || {});
    this._draw(); // immediate paint
  };

  OutlineEngine.prototype.updateUniforms = function (params) {
    const p = Object.assign({}, this.params, params || {});

    if (!Array.isArray(p.hullAxes) || p.hullAxes.length !== 3) {
      p.hullAxes = this.params.hullAxes.slice();
    }
    p.wallWidth =
      Number.isFinite(p.wallWidth) && p.wallWidth > 0 ? p.wallWidth : this.params.wallWidth;

    const v = Array.isArray(p.betaTiltVec) ? p.betaTiltVec.slice(0, 3) : [0, -1, 0];
    const L = Math.hypot(v[0], v[1], v[2]) || 1;
    p.betaTiltVec = [v[0] / L, v[1] / L, v[2] / L];

    this.params = p;
    this._requestDraw();
  };

  OutlineEngine.prototype._resize = function () {
    const pr = this.pixelRatio;
    const w = this.canvas.clientWidth || (this.canvas.parentElement && this.canvas.parentElement.clientWidth) || 800;
    const h = this.canvas.clientHeight || (this.canvas.parentElement && this.canvas.parentElement.clientHeight) || 400;
    this.canvas.width  = Math.floor(w * pr);
    this.canvas.height = Math.floor(h * pr);
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(pr, 0, 0, pr, 0, 0);
    this._requestDraw();
  };

  OutlineEngine.prototype._camera = function () {
    const a = this.params.hullAxes[0], b = this.params.hullAxes[1], c = this.params.hullAxes[2];
    const R = Math.max(a, b, c);

    const w = this.canvas.width  / this.pixelRatio;
    const h = this.canvas.height / this.pixelRatio;
    const aspect = w / Math.max(1, h);

    // Slightly overhead; camera on +Z looking toward origin
    const eye  = [0, 0.40 * R, 1.8 * R];
    const fov  = aspect > 1 ? Math.PI / 3.2 : Math.PI / 2.8;
    const f    = (0.5 * h) / Math.tan(0.5 * fov);

    return {
      eye,
      f,
      cx: w * 0.5,
      cy: h * 0.5
    };
  };

  OutlineEngine.prototype._requestDraw = function () {
    if (this._needsFrame) return;
    this._needsFrame = true;
    requestAnimationFrame(() => {
      this._needsFrame = false;
      this._draw();
    });
  };

  OutlineEngine.prototype._draw = function () {
    const ctx = this.ctx;
    const p   = this.params;
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    // Clear
    const W = this.canvas.width / this.pixelRatio;
    const H = this.canvas.height / this.pixelRatio;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const cam = this._camera();

    // Visual "curvature gain" proxy (purely presentational)
    const gamma3  = Math.pow(p.gammaGeo ?? 26, 3);
    // Prefer authoritative FR window if present; fall back to duty/sectors
    const dutyEff = Number.isFinite(p.dutyEffectiveFR)
      ? clamp01(p.dutyEffectiveFR)
      : Math.max(1e-6, (p.dutyCycle ?? 0.14) / Math.max(1, p.sectors ?? 1));
    const qspoil  = Math.max(1e-3, p.qSpoil ?? 1.0);
    const gainVis = Math.pow(gamma3 * qspoil * dutyEff, 0.25);

    // Mechanical response: compute from Q if mechGain not provided
    let mechGain = p.mechGain;
    if (!Number.isFinite(mechGain)) {
      const qMech = Math.max(1e-6, p.qMechanical ?? 1);
      const zeta  = 1 / (2 * qMech);
      const f0    = Math.max(1e-12, p.f0_Hz ?? p.fMod_Hz ?? 15e9);
      const fmod  = Math.max(1e-12, p.fMod_Hz ?? 15e9);
      const omega = fmod / f0;
      const denom = Math.sqrt((1 - omega*omega)**2 + (2 * zeta * omega)**2);
      const Arel  = 1 / denom;         // amplitude ratio at drive
      mechGain    = clamp01(Arel - 1); // 0..~ (soft normalized)
    } else {
      mechGain = clamp01(mechGain);
    }
    const mechMod  = 1 + 2.5 * mechGain;

    if (p.debug) {
      console.log(`🔧 OUTLINE: mechGain=${mechGain.toFixed(3)}, mechMod=${mechMod.toFixed(2)}x, f_mod=${((p.fMod_Hz??15e9)/1e9).toFixed(1)}GHz, ζ=${(p.mechZeta??0.005).toFixed(3)}`);
    }

    // Mode tint/alpha (flip to warning tint if ζ≥1)
    const frBreach = Number.isFinite(p.zeta) && p.zeta >= 1.0;
    const modeAlpha =
      p.mode === 'standby'   ? 0.40 :
      p.mode === 'cruise'    ? 0.55 :
      p.mode === 'hover'     ? 0.70 :
      p.mode === 'emergency' ? 0.85 : 0.65;

    // Add subtle breathing effect
    const t = (performance.now() * 0.001) % (Math.PI * 2);
    const breathe = 0.07 * Math.sin(t * 0.8); // ±7%
    const finalAlpha = (0.9 + breathe) * modeAlpha;

    // Shell styling that responds to mechanical resonance
    // Apply mechGain modulation: thickness *= (1.0 + 0.5 * mechGain), alpha *= mix(0.6, 1.0, mechGain)
    const alphaMod = 0.6 + 0.4 * mechGain; // 0.6 to 1.0 alpha multiplier
    const thicknessMod = 1.0 + 0.5 * mechGain; // 1.0 to 1.5x thickness multiplier

    // Mechanical response alpha modulation
    const shellAlpha = finalAlpha * alphaMod;

    // Base shell colors with optional cyan tint when "in band"
    const baseColors = {
      // shift palette slightly if FR breach
      inner:  frBreach ? [255,120,120] : [255,176,176],
      center:             [200,208,220],
      outer:  frBreach ? [255,196,120] : [176,208,255]
    };
    const mechTint = [77, 230, 255]; // cyan tint (0.3, 0.9, 1.0 * 255)
    const tintStrength = 0.35 * mechGain;

    // Mix base colors with cyan tint when mechanical response is active
    const mixColor = (base, tint, strength) => [
      Math.round(base[0] * (1 - strength) + tint[0] * strength),
      Math.round(base[1] * (1 - strength) + tint[1] * strength),
      Math.round(base[2] * (1 - strength) + tint[2] * strength)
    ];

    const innerColor = mixColor(baseColors.inner, mechTint, tintStrength);
    const centerColor = mixColor(baseColors.center, mechTint, tintStrength);
    const outerColor = mixColor(baseColors.outer, mechTint, tintStrength);

    const baseInner = `rgba(${innerColor[0]},${innerColor[1]},${innerColor[2]},${0.60 * shellAlpha})`;
    const baseCenter= `rgba(${centerColor[0]},${centerColor[1]},${centerColor[2]},${0.45 * shellAlpha})`;
    const baseOuter = `rgba(${outerColor[0]},${outerColor[1]},${outerColor[2]},${0.60 * shellAlpha})`;
    const colShift  = `rgba(180,120,255,${0.90})`;              // violet (shift vector)

    // Apply mechanical response thickness modulation: thickness *= (1.0 + 0.5 * mechGain)
    const innerWidth  = (1.0 + 0.75 * gainVis) * thicknessMod;
    const centerWidth = (0.8 + 0.50 * gainVis) * thicknessMod;
    const outerWidth  = (1.0 + 0.75 * gainVis) * thicknessMod;

    const a0 = p.hullAxes[0], b0 = p.hullAxes[1], c0 = p.hullAxes[2];
    const dRho = clamp(p.wallWidth, 0.005, 0.40);

    const shells = [
      { scale: 1 - dRho, color: baseInner,  line: innerWidth },
      { scale: 1.00,     color: baseCenter, line: centerWidth },
      { scale: 1 + dRho, color: baseOuter,  line: outerWidth  },
    ];

    const Nθ = 96, Nφ = 40;

    // Use per-color alpha; no global alpha for shells
    shells.forEach(s => {
      const a = a0 * s.scale, b = b0 * s.scale, c = c0 * s.scale;
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = s.line;

      // Latitudes
      for (let j = 1; j < Nφ; j++) {
        const phi = lerp(-Math.PI/2, Math.PI/2, j / Nφ);
        let first = true;
        ctx.beginPath();
        for (let i = 0; i <= Nθ; i++) {
          const th = (i / Nθ) * TAU;
          const [x, y] = project(ellipsoidPoint(a, b, c, th, phi), cam);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }

      // Meridians
      for (let i = 0; i < Nθ; i += 6) {
        const th = (i / Nθ) * TAU;
        let first = true;
        ctx.beginPath();
        for (let j = 0; j <= Nφ; j++) {
          const phi = lerp(-Math.PI/2, Math.PI/2, j / Nφ);
          const [x, y] = project(ellipsoidPoint(a, b, c, th, phi), cam);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }
    });

    // Shift vector arrow with mode-responsive scaling
    if (p.epsilonTilt > 0) {
      const R = Math.max(a0, b0, c0);
      const head = Math.min(0.35 * R, (p.epsilonTilt * gainVis * 1.2) * R);
      const base = [0, 0, 0];
      const tip  = [
        base[0] + p.betaTiltVec[0] * head,
        base[1] + p.betaTiltVec[1] * head,
        base[2] + p.betaTiltVec[2] * head,
      ];
      const [x0, y0] = project(base, cam);
      const [x1, y1] = project(tip,  cam);

      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = colShift;
      ctx.fillStyle   = colShift;
      ctx.lineWidth   = 2.0;

      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();

      const angle = Math.atan2(y1 - y0, x1 - x0);
      const ah = 10, aw = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ah * Math.cos(angle - Math.PI/8), y1 - ah * Math.sin(angle - Math.PI/8));
      ctx.lineTo(x1 - aw * Math.cos(angle + Math.PI/2), y1 - aw * Math.sin(angle + Math.PI/2));
      ctx.closePath();
      ctx.fill();
    }

    // Mini legend with mode indicator
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const legendW = 280, legendH = 96;
    ctx.fillRect(12, 12, legendW, legendH);
    ctx.fillStyle = '#fff';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
    ctx.fillText(`Shell Outline • ${p.mode?.toUpperCase() || 'HOVER'} mode`, 18, 28);
    ctx.fillStyle = baseInner;  ctx.fillRect(18, 36, 10, 10); ctx.fillStyle = '#b0b8c0'; ctx.fillText('Compression (inner)', 34, 45);
    ctx.fillStyle = baseOuter;  ctx.fillRect(138, 36, 10, 10); ctx.fillStyle = '#b0b8c0'; ctx.fillText('Expansion (outer)',   154, 45);
    ctx.fillStyle = '#b0b8c0';
    ctx.fillText('Shift vector (violet) • Live physics coupling', 18, 60);
    ctx.fillStyle = '#888';
    ctx.font = '10px ui-sans-serif, system-ui, -apple-system';
    const mechStatus = mechGain > 0.1 ? `IN-BAND` : `off-resonance`;
    const lc = p.lightCrossing || {};
    const tauLCs  = Number.isFinite(lc.tauLC_ms) ? `${(lc.tauLC_ms/1000).toFixed(3)}s` : '—';
    const dwellMs = Number.isFinite(lc.dwell_ms) ? `${lc.dwell_ms.toFixed(2)}ms` : '—';
    const burstMs = Number.isFinite(lc.burst_ms) ? `${lc.burst_ms.toFixed(2)}ms` : '—';
    const frTxt   = Number.isFinite(p.zeta) ? `ζ=${p.zeta.toFixed(3)} ${p.zeta>=1?'(WARN)':'(PASS)'}` : 'ζ=—';
    ctx.fillText(`γ³=${gamma3.toExponential(1)} • duty_FR=${(dutyEff*100).toFixed(2)}% • mech:${mechStatus}`, 18, 74);
    ctx.fillText(`τLC=${tauLCs} • Tsec=${dwellMs} • burst=${burstMs} • ${frTxt}`, 18, 88);

    // Keep animating if requested (for breathing/tilt shimmer)
    if (p.animate) this._requestDraw();
  };

  // expose
  window.OutlineEngine = OutlineEngine;
})();