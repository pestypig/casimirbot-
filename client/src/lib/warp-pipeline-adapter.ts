
// Adapter: pipeline → engine uniforms (strict-science: no client fabrication)
// (keep any existing imports)

export function driveWarpFromPipeline(
  engine: any,
  pipeline: any,
  options?: { mode?: 'REAL'|'SHOW'; strict?: boolean }
) {
  if (!engine || !pipeline) return;
  const mode   = options?.mode ?? 'REAL';
  const strict = options?.strict ?? true;

  // ---- 1) Normalize Light-Crossing (accept alt keys; convert μs→ms) ----------
  const lcSrc: any = (pipeline.lc ?? pipeline.lightCrossing ?? {});
  const tauLC_ms = _finite(lcSrc.tauLC_ms ?? (lcSrc.tau_ms) ?? (lcSrc.tau_us != null ? lcSrc.tau_us/1000 : undefined));
  const dwell_ms = _finite(lcSrc.dwell_ms ?? (lcSrc.dwell_ms) ?? (lcSrc.dwell_us != null ? lcSrc.dwell_us/1000 : undefined));
  const burst_ms = _finite(lcSrc.burst_ms ?? (lcSrc.burst_ms) ?? (lcSrc.burst_us != null ? lcSrc.burst_us/1000 : undefined));
  const phase    = _finite(lcSrc.phase);
  const onWindow = _booly(lcSrc.onWindow);
  const sectorIdx   = _inty(lcSrc.sectorIdx);
  const sectorCount = _inty(pipeline.sectorCount ?? lcSrc.sectorCount);
  const lcPayload = { tauLC_ms, dwell_ms, burst_ms, phase, onWindow, sectorIdx, sectorCount };

  // ---- 2) Duty used by renderer (Ford–Roman), selected by MODE --------------
  // prefer explicit dutyUsed → dutyEffectiveFR → (slice/ship by mode)
  let dutyUsed = _finite((pipeline as any).dutyUsed);
  if (!_isFinite(dutyUsed)) dutyUsed = _finite((pipeline as any).dutyEffectiveFR);
  if (!_isFinite(dutyUsed)) {
    const dSlice = _finite((pipeline as any).dutyFR_slice);
    const dShip  = _finite((pipeline as any).dutyFR_ship);
    if (mode === 'REAL'  && _isFinite(dSlice)) dutyUsed = dSlice!;
    if (mode === 'SHOW'  && _isFinite(dShip))  dutyUsed = dShip!;
  }

  // ---- 3) Physics & tensors verbatim from pipeline --------------------------
  const uniforms: any = {
    // primary physics
    gammaGeo:        _finite(pipeline.gammaGeo),
    qSpoilingFactor: _finite((pipeline as any).qSpoilingFactor ?? (pipeline as any).deltaAOverA),
    gammaVdB:        _finite((pipeline as any).gammaVdB ?? (pipeline as any).gammaVanDenBroeck),
    thetaScale:      _finite((pipeline as any).thetaScale ?? (pipeline as any).thetaUniform),
    sectorCount:     _inty(pipeline.sectorCount),
    dutyUsed,
    // explicit rendering mode flags (no boosts; just authority tags)
    physicsParityMode: (mode === 'REAL'),
    ridgeMode:          (mode === 'SHOW') ? 1 : 0,
    // axes & wall width pass-through if present
    axesHull:      _arrN((pipeline as any).axesHull, 3),
    axesMeters:    _arrN((pipeline as any).axesMeters ?? (pipeline as any).axesHull_m, 3),
    wallWidth_m:   _finite((pipeline as any).wallWidth_m),
    wallWidth_rho: _finite((pipeline as any).wallWidth_rho),
    // tensors (optional)
    metricMode:    _booly((pipeline as any).metricMode),
    gSpatialDiag:  _arrN((pipeline as any).gSpatialDiag, 3),
    gSpatialSym:   _arrN((pipeline as any).gSpatialSym, 6),
    lapseN:        _finite((pipeline as any).lapseN),
    shiftBeta:     _arrN((pipeline as any).shiftBeta, 3),
    viewForward:   _arrN((pipeline as any).viewForward, 3),
    g0i:           _arrN((pipeline as any).g0i, 3),
  };

  // ---- 4) Strict gate: refuse to push partial physics -----------------------
  if (strict) {
    const miss: string[] = [];
    if (!_isFinite(uniforms.gammaGeo)) miss.push('gammaGeo');
    if (!_isFinite(uniforms.qSpoilingFactor)) miss.push('qSpoilingFactor');
    if (!_isFinite(uniforms.gammaVdB)) miss.push('gammaVdB');
    if (!_isFinite(uniforms.dutyUsed)) miss.push('dutyUsed');
    if (!_isFinite(uniforms.sectorCount)) miss.push('sectorCount');

    if (miss.length > 0) {
      console.warn(`[driveWarpFromPipeline] Missing physics: ${miss.join(', ')}`);
      return;
    }
  }

  // ---- 5) Apply to engine (with light-crossing payload) ---------------------
  if (engine.updateUniforms) {
    engine.updateUniforms(uniforms);
  }
  if (engine.setLightCrossingPayload) {
    engine.setLightCrossingPayload(lcPayload);
  }
}

// ---- Helper functions ------------------------------------------------------
function _finite(x: any): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function _isFinite(x: any): x is number {
  return Number.isFinite(x);
}

function _booly(x: any): boolean {
  return Boolean(x);
}

function _inty(x: any): number | undefined {
  const n = Number(x);
  return Number.isInteger(n) ? n : undefined;
}

function _arrN(x: any, len: number): number[] | undefined {
  if (!Array.isArray(x) || x.length !== len) return undefined;
  const arr = x.map(Number);
  return arr.every(Number.isFinite) ? arr : undefined;
}
