
// Adapter: pipeline → engine uniforms (strict; no client fabrication)
// Keeps tensors; accepts top-level OR pipeline.natario.* sources.

export function driveWarpFromPipeline(
  engine: any,
  pipeline: any,
  options?: { mode?: 'REAL'|'SHOW', strict?: boolean, metrics?: any }
) {
  if (!engine || !pipeline) return;
  const mode   = options?.mode ?? (pipeline.mode as any) ?? 'REAL';
  const strict = options?.strict ?? true;
  const mx     = options?.metrics ?? null; // optional /api/helix/metrics payload

  // Safe field access for nested Natário shapes
  const get = (o:any, path:string[]): any => {
    let v = o; for (const k of path) { if (!v || typeof v!=='object') return undefined; v = v[k]; }
    return v;
  };

  // ---- 1) Normalize LC (accept alt keys; μs→ms) -----------------------------
  const lcSrc: any = (pipeline.lc ?? pipeline.lightCrossing ?? {});
  // Prefer live metrics when provided; otherwise use pipeline LC
  const mLC = (mx && (mx.lightCrossing || mx)) || {};
  const tauLC_ms = finite(mLC.tauLC_ms ?? lcSrc.tauLC_ms ?? lcSrc.tau_ms ?? (lcSrc.tau_us!=null ? lcSrc.tau_us/1000 : undefined));
  const dwell_ms = finite(mLC.dwell_ms  ?? lcSrc.dwell_ms  ?? (lcSrc.dwell_us!=null ? lcSrc.dwell_us/1000 : lcSrc.dwell_ms));
  const burst_ms = finite(mLC.burst_ms  ?? lcSrc.burst_ms  ?? (lcSrc.burst_us!=null ? lcSrc.burst_us/1000 : lcSrc.burst_ms));
  const phase    = finite(mLC.phase ?? lcSrc.phase);
  const onWindow = booly(mLC.onWindow ?? lcSrc.onWindow);
  const sectorIdx   = inty(mLC.sectorIdx ?? mx?.currentSector ?? lcSrc.sectorIdx);
  const sectorCount = inty(mLC.sectorCount ?? mx?.totalSectors ?? pipeline.sectorCount ?? lcSrc.sectorCount);
  const lcPayload = { tauLC_ms, dwell_ms, burst_ms, phase, onWindow, sectorIdx, sectorCount };

  // ---- 1b) Bring across Natário shift/tensor outputs for diagnostics --------
  const nat = (pipeline as any).natario ?? {};
  // θ choices: prefer explicit thetaScale, else Natário shift amplitude (your θ)
  const thetaFromNatario = finite(
    get(nat, ['shiftVectorField','amplitude']) ??
    get(nat, ['shiftVectorField','theta']) // allow alt naming
  );
  const thetaExpected = finite((pipeline as any).thetaScaleExpected);
  const thetaPrimary  = finite(
    (pipeline as any).thetaScale ??
    (pipeline as any).thetaUniform ??
    thetaExpected ??
    thetaFromNatario
  );

  // Optional Natário extras for inspectors (no shader dependency)
  const natShift = {
    thetaNet:    finite(get(nat, ['shiftVectorField','netShiftAmplitude'])),
    thetaPlus:   finite(get(nat, ['shiftVectorField','positivePhaseAmplitude'])),
    thetaMinus:  finite(get(nat, ['shiftVectorField','negativePhaseAmplitude'])),
  };
  const natStress = (get(nat, ['stressEnergyTensor']) || {}) as any;

  // ---- 2) Duty authority (no recompute on client) ---------------------------
  // Prefer metrics.dutyFR when present (live FR duty); else pipeline chain
  let dutyUsed = finite(mx?.dutyFR ?? (pipeline as any).dutyUsed);
  if (!isF(dutyUsed)) dutyUsed = finite((pipeline as any).dutyEffectiveFR);
  if (!isF(dutyUsed)) {
    const dSlice = finite((pipeline as any).dutyFR_slice);
    const dShip  = finite((pipeline as any).dutyFR_ship);
    if (mode==='REAL' && isF(dSlice)) dutyUsed = dSlice!;
    if (mode==='SHOW' && isF(dShip))  dutyUsed = dShip!;
  }

  // ---- 3) Physics + tensors verbatim (top-level OR natario.*) ---------------
  const uniforms: any = {
    // Primary physics
    gammaGeo:        finite(pipeline.gammaGeo),
    qSpoilingFactor: finite((pipeline as any).qSpoilingFactor ?? (pipeline as any).deltaAOverA),
    gammaVdB:        finite((pipeline as any).gammaVdB ?? (pipeline as any).gammaVanDenBroeck),
    // θ: prefer explicit pipeline fields, else θ_expected, else Natário amplitude
    thetaScale:      thetaPrimary,
    sectorCount:     inty(pipeline.sectorCount),
    dutyUsed,
    // Mode tags (no boosts)
    physicsParityMode: (mode==='REAL'),
    ridgeMode:          (mode==='SHOW') ? 1 : 0,
    // Axes & wall width (if provided)
    axesHull:      arrN((pipeline as any).axesHull, 3),
    axesMeters:    arrN((pipeline as any).axesMeters ?? (pipeline as any).axesHull_m, 3),
    wallWidth_m:   finite((pipeline as any).wallWidth_m),
    wallWidth_rho: finite((pipeline as any).wallWidth_rho),
    // Tensors (kept, not fabricated)
    metricMode:    booly((pipeline as any).metricMode ?? nat.metricMode),
    gSpatialDiag:  arrN((pipeline as any).gSpatialDiag, 3)  || arrN(nat.gSpatialDiag, 3),
    gSpatialSym:   arrN((pipeline as any).gSpatialSym, 6)   || arrN(nat.gSpatialSym, 6),
    lapseN:        finite((pipeline as any).lapseN ?? nat.lapseN),
    shiftBeta:     arrN((pipeline as any).shiftBeta, 3)     || arrN(nat.shiftBeta, 3),
    viewForward:   arrN((pipeline as any).viewForward, 3)   || arrN(nat.viewForward, 3),
    g0i:           arrN((pipeline as any).g0i, 3)           || arrN(nat.g0i, 3),
    // Natário diagnostics (no fabrication; useful in inspectors)
    thetaFromNatario: thetaFromNatario,
    thetaScaleExpected: thetaExpected,
    thetaNet:    natShift.thetaNet,
    thetaPlus:   natShift.thetaPlus,
    thetaMinus:  natShift.thetaMinus,
    T00: finite(natStress.T00),
    T11: finite(natStress.T11),
    T22: finite(natStress.T22),
    T33: finite(natStress.T33),
    NEC_satisfied: (natStress.isNullEnergyConditionSatisfied === true),
  };
  // Auto-enable metric if tensors present but flag absent
  if (typeof uniforms.metricMode === 'undefined') {
    const hasTensors = isF(uniforms.lapseN) || !!uniforms.shiftBeta || !!uniforms.gSpatialDiag || !!uniforms.gSpatialSym;
    if (hasTensors) uniforms.metricMode = true;
  }

  // ---- 4) Strict gate: refuse partial physics; viewers show __error ---------
  if (strict) {
    const miss:string[] = [];
    if (!isF(uniforms.thetaScale))      miss.push('thetaScale');
    if (!isF(uniforms.gammaGeo))        miss.push('gammaGeo');
    if (!isF(uniforms.qSpoilingFactor)) miss.push('qSpoilingFactor');
    if (!isF(uniforms.gammaVdB))        miss.push('gammaVdB');
    if (!isF(uniforms.sectorCount))     miss.push('sectorCount');
    if (!isF(uniforms.dutyUsed))        miss.push('dutyUsed');
    if (!isF(tauLC_ms) || !isF(dwell_ms) || !isF(burst_ms)) {
      miss.push('LC(tauLC_ms/dwell_ms/burst_ms)');
    }
    if (miss.length) {
      engine.uniforms = engine.uniforms || {};
      engine.uniforms.__error = `adapter: missing ${miss.join(', ')}`;
      return;
    }
  }

  // ---- 5) Push to engine (single source of truth) ---------------------------
  // Pipeline stamping for diagnostics/tracking
  const stamp = {
    __pipelineMode: mode,
    __pipelineTick: (pipeline?.tickId ?? pipeline?.timestamp ?? Date.now()),
  };
  engine.updateUniforms?.(stamp);
  
  // Helpful for inspectors: record the active mode
  const stamp:any = { currentMode: mode };
  if (mx?.timestamp) stamp.__metricsTick = mx.timestamp;
  engine.updateUniforms?.(stamp);
  engine.setLightCrossing?.(lcPayload);
  engine.updateUniforms?.(uniforms);
  engine.requestRewarp?.();
}

function finite(x:any){ const n=+x; return Number.isFinite(n)?n:undefined; }
function isF(x:any){ return Number.isFinite(+x); }
function inty(x:any){ const n=Math.floor(+x); return Number.isFinite(n)?n:undefined; }
function booly(x:any){ return x===true || x===1 || x==='1'; }
function arrN(a:any,k:number){ return (Array.isArray(a)&&a.length>=k)?a:undefined; }
