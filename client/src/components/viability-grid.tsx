// Exact implementation of the 8-step pipeline recipe from user's attached file
// (adjusted for robustness: resolution clamp, finite checks, consistent symbols)

export function computeViabilityGrid(
  viabilityParams: any,
  resolution: number = 25
): { A_vals: number[]; R_vals: number[]; Z: number[][]; viableCount: number; totalCount: number } {
  // --- Guard & normalize resolution to avoid divide-by-zero when resolution=1 ---
  const RES = Math.max(2, Math.floor(Number.isFinite(resolution) ? resolution : 25));

  // Recipe Step 1: Build grid (fix array generation)
  const tileAreas = Array.from({ length: RES }, (_, i) => 1 + ((100 - 1) * i) / (RES - 1)); // 1–100 cm²
  const shipRadii = Array.from({ length: RES }, (_, i) => 1 + ((100 - 1) * i) / (RES - 1)); // 1–100 m

  // Debug grid generation
  console.log(
    `🔧 Grid Debug: tileAreas[0]=${tileAreas[0]}, tileAreas[1]=${tileAreas[1]}, tileAreas[2]=${tileAreas[2]}`
  );
  console.log(
    `🔧 Grid Debug: shipRadii[0]=${shipRadii[0]}, shipRadii[1]=${shipRadii[1]}, shipRadii[2]=${shipRadii[2]}`
  );

  const Z: number[][] = [];

  // Physics constants (precomputed outside loops)
  const pi = Math.PI;
  const h_bar = 1.055e-34; // J⋅s
  const c = 2.998e8; // m/s
  const c_squared = c * c; // m²/s²
  const a = 1e-9; // 1 nm gap distance
  const f_m = 15e9; // 15 GHz
  const omega = 2 * pi * f_m; // rad/s
  const u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4)); // J/m³ (constant)

  // Mode-specific parameters from sliders (exact Live Energy Pipeline matching)
  const gamma_geo = Number.isFinite(viabilityParams?.gammaGeo) ? Number(viabilityParams.gammaGeo) : 26;
  const Q_mech = 5e4; // Mechanical Q (fixed)
  const Q_cavity = Number.isFinite(viabilityParams?.qFactor) ? Number(viabilityParams.qFactor) : 1e9; // slider Q

  // Constraint parameters from sliders - MUST BE DECLARED FIRST
  const M_target = 1405; // kg (exact Needle Hull target) - MUST BE DECLARED FIRST
  const maxPower_MW = Number.isFinite(viabilityParams?.maxPower) ? Number(viabilityParams.maxPower) : 120; // MW
  const massTolerance_pct = Number.isFinite(viabilityParams?.massTolerance)
    ? Number(viabilityParams.massTolerance)
    : 5; // %
  const maxZeta = Number.isFinite(viabilityParams?.maxZeta) ? Number(viabilityParams.maxZeta) : 1.0; // QI bound
  const minTimescale = Number.isFinite(viabilityParams?.minTimescale) ? Number(viabilityParams.minTimescale) : 0.01;

  // CRITICAL FIX #1: Single global γ_pocket (2×10¹¹) for all modes - Needle Hull Mk 1 constant
  const gamma_pocket = 2e11; // Van-den-Broeck pocket amplification (constant for all modes)

  console.log(
    `🔧 Fast Single Inequality: γ_pocket=${gamma_pocket.toExponential(
      3
    )}, M_target=${M_target} kg, resolution=${RES}×${RES}`
  );

  // Mode configuration (passed from phase diagram)
  const modeConfig = viabilityParams?.modeConfig || {
    duty: 0.14,
    sectors: 1,
    qSpoiling: 1,
    pocketGamma: gamma_pocket, // Use global constant
  };

  let viableCount = 0;
  let totalCount = 0;

  // Recipe Step 2: For each point (i,j) compute the full pipeline
  for (let j = 0; j < shipRadii.length; j++) {
    const Z_row: number[] = [];

    for (let i = 0; i < tileAreas.length; i++) {
      totalCount++;

      try {
        // NEW APPROACH: Single inequality method for exotic mass constraint
        const A_tile_cm2 = tileAreas[i]; // cm² grid value
        const A_tile = A_tile_cm2 * 1e-4; // cm² → m²
        const r_ship = shipRadii[j]; // m grid value

        // Pre-compute constants (independent of grid position)
        const cruise_duty = 0.005; // Always use cruise duty for mass calculation
        const M_max = M_target * (1 + massTolerance_pct / 100); // Maximum allowed exotic mass

        // Compute U_cycle per tile (depends on A_tile) - simplified for speed
        const U_static = u_casimir * A_tile * a * 0.5; // SCUFF-EM divide-by-2 convention
        const U_cycle = Q_mech * gamma_geo * U_static * cruise_duty * gamma_pocket; // Complete energy pipeline

        // Avoid divide-by-zero in degenerate cases
        const U_cycle_abs = Math.max(1e-30, Math.abs(U_cycle));

        // Single inequality viability check: 4πR² ≤ A_tile * (M_max * c²) / U_cycle
        const K = (M_max * c_squared) / (4 * pi * U_cycle_abs); // Coefficient
        const viabilityCondition = r_ship * r_ship <= K * A_tile; // R² ≤ K·A_tile

        // Additional constraints (power, quantum safety, timescale)
        if (viabilityCondition) {
          // Only compute these if mass constraint passes (optimization)
          const N_tiles = (4 * pi * r_ship * r_ship) / A_tile;
          const P_loss_raw = Math.abs(gamma_geo * U_static * omega / Q_cavity);
          const P_avg_MW = (P_loss_raw * N_tiles * modeConfig.duty) / 1e6;

          // ζ = 1 / (d * √Q_on) proxy (use Q_mech as the "on" Q here)
          const zeta = modeConfig.duty > 0 ? 1 / (modeConfig.duty * Math.sqrt(Q_mech)) : Number.POSITIVE_INFINITY;

          // Time-scale separation ratio (same algebra, clearer symbols)
          const T_m = 1 / f_m;
          const T_struct = Math.sqrt(Q_mech / (2 * pi * f_m));
          const TS_ratio = T_struct / T_m;

          const powerGate = P_avg_MW <= maxPower_MW;
          const quantumGate = Number.isFinite(zeta) && zeta <= maxZeta;
          const timescaleGate = Number.isFinite(TS_ratio) && TS_ratio >= minTimescale;

          const ok = powerGate && quantumGate && timescaleGate;

          // Debug logging for first cell only (reduce console spam)
          if (i === 0 && j === 0) {
            const M_exotic = Math.abs(U_cycle * N_tiles) / c_squared;
            console.log(
              `🔍 Single Inequality Debug: K=${K.toExponential(3)}, Mass=${M_exotic.toFixed(
                2
              )} kg, Power=${P_avg_MW.toFixed(2)} MW, ζ=${zeta.toFixed(3)}, TS=${TS_ratio.toExponential(2)}`
            );
          }

          if (ok) viableCount++;
          Z_row.push(ok ? 1 : 0);
        } else {
          // Mass constraint failed - no debug logging for performance
          Z_row.push(0);
        }
      } catch {
        Z_row.push(0); // Failed calculations = not viable
      }
    }
    Z.push(Z_row);
  }

  console.log(
    `🎯 Recipe Grid Results: ${viableCount}/${totalCount} viable points (${((viableCount / totalCount) * 100).toFixed(
      1
    )}%)`
  );

  return {
    A_vals: tileAreas,
    R_vals: shipRadii,
    Z,
    viableCount,
    totalCount,
  };
}