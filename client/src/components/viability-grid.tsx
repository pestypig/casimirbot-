import React from 'react';

// Exact implementation of the 8-step pipeline recipe from user's attached file
export function computeViabilityGrid(
  viabilityParams: any,
  resolution: number = 30
): { A_vals: number[], R_vals: number[], Z: number[][], viableCount: number, totalCount: number } {
  
  // Recipe Step 1: Build grid
  const tileAreas = Array.from({length: resolution}, (_, i) => 1 + (100 - 1) * i / (resolution - 1)); // 1-100 cm²
  const shipRadii = Array.from({length: resolution}, (_, i) => 1 + (100 - 1) * i / (resolution - 1)); // 1-100 m
  
  const Z: number[][] = [];
  
  // Physics constants (precomputed outside loops)
  const pi = Math.PI;
  const h_bar = 1.055e-34; // J⋅s
  const c = 2.998e8; // m/s
  const c_squared = c * c; // m²/s²
  const a = 1e-9; // 1 nm gap distance
  const omega = 2 * pi * 15e9; // 15 GHz drive frequency
  const u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4)); // J/m³ (constant)
  
  // Mode-specific parameters from sliders (exact Live Energy Pipeline matching)
  const gamma_geo = viabilityParams?.gammaGeo || 26;
  const Q_mech = 5e4; // Mechanical Q (fixed)
  const Q_cavity = viabilityParams?.qFactor || 1e9; // Use slider Q-factor
  
  // CRITICAL FIX #1: Single global γ_pocket (2×10¹¹) for all modes - Needle Hull Mk 1 constant
  const gamma_pocket = 2e11; // Van-den-Broeck pocket amplification (constant for all modes)
  
  // Mode configuration (passed from phase diagram)
  const modeConfig = viabilityParams?.modeConfig || {
    duty: 0.14,
    sectors: 1,
    qSpoiling: 1,
    pocketGamma: gamma_pocket // Use global constant
  };
  
  // Constraint parameters from sliders
  const maxPower_MW = viabilityParams?.maxPower || 120; // MW (hover mode default)
  const massTolerance_pct = viabilityParams?.massTolerance || 5; // % (tight Needle Hull tolerance)
  const maxZeta = viabilityParams?.maxZeta || 1.0;
  const minTimescale = viabilityParams?.minTimescale || 0.01;
  const M_target = 1405; // kg (exact Needle Hull target)
  
  let viableCount = 0;
  let totalCount = 0;

  // Recipe Step 2: For each point (i,j) compute the full pipeline
  for (let j = 0; j < shipRadii.length; j++) {
    const Z_row: number[] = [];
    
    for (let i = 0; i < tileAreas.length; i++) {
      totalCount++;
      
      try {
        // CRITICAL FIX #2: Pull A_tile and r_ship from LOOP INDICES (not sliders)
        const A_tile = tileAreas[i] * 1e-4; // cm² → m² (use grid value, not slider)
        const r_ship = shipRadii[j]; // m (use grid value, not slider)
        
        // Recipe Step 2: Hull surface area (sphere approx for simplicity)
        const A_hull = 4 * pi * r_ship * r_ship; // m² (use grid r_ship)
        
        // Recipe Step 3: Number of tiles
        const N_tiles = A_hull / A_tile;
        
        // Recipe Step 4: Energy pipeline (using precomputed constants)
        const V_cavity = A_tile * a; // Cavity volume
        const U_static = u_casimir * V_cavity / 2; // SCUFF-EM divide by 2 convention
        const U_geo = gamma_geo * U_static; // Geometric amplification
        const U_Q = Q_mech * U_geo; // Q-enhanced energy
        
        // Recipe Step 5: Van-den-Broeck pocket for fixed exotic mass (use cruise duty for mass budgeting)
        const cruise_duty = 0.005; // Always use cruise duty for mass calculation per paper
        const U_cycle_base = U_Q * cruise_duty;
        const U_cycle = U_cycle_base * gamma_pocket; // Use global constant γ_pocket
        
        // Recipe Step 6: Exotic mass calculation (use grid variables)
        const M_exotic = Math.abs(U_cycle * N_tiles) / c_squared; // Total exotic mass (use precomputed c²)
        
        // Recipe Step 7: Power calculations (use grid variables)
        const P_loss_raw = Math.abs(U_geo * omega / Q_cavity); // Raw power per tile
        const P_raw = P_loss_raw * N_tiles; // Raw power for full hull
        const d_mode = modeConfig.duty; // Current mode duty cycle
        const P_avg = P_raw * d_mode; // Average power (duty cycle applied)
        const P_avg_MW = P_avg / 1e6; // Convert to MW
        
        // Recipe Step 8: Time-scale analysis (use grid variables)
        const f_m = 15e9; // Mechanical frequency
        const tau_LC = Math.sqrt(Q_mech / (2 * pi * f_m));
        const tau_pulse = 1 / (15e9); // Use frequency directly
        const TS_ratio = tau_LC / tau_pulse;
        
        // Recipe Step 9: Quantum safety (handle division-by-zero gracefully)
        let zeta = Infinity;
        if (d_mode > 0 && isFinite(Q_mech) && Q_mech > 0) {
          zeta = 1 / (d_mode * Math.sqrt(Q_mech));
        }
        
        // CRITICAL FIX #3: Constraint gates depend on GRID variables (not slider values)
        const M_min = M_target * (1 - massTolerance_pct/100); // User-configurable mass tolerance
        const M_max = M_target * (1 + massTolerance_pct/100); 
        const P_max = maxPower_MW; // User-configurable max power (MW)
        const TS_min = minTimescale; // User-configurable minimum time-scale separation
        const zeta_max = maxZeta; // User-configurable quantum inequality parameter
        
        // CRITICAL FIX #4: Handle division-by-zero gracefully (treat NaN/∞ as fail)
        const massGate = (isFinite(M_exotic) && M_exotic >= M_min && M_exotic <= M_max);
        const powerGate = (isFinite(P_avg_MW) && P_avg_MW <= P_max);
        const quantumGate = (isFinite(zeta) && zeta <= zeta_max);
        const timescaleGate = (isFinite(TS_ratio) && TS_ratio >= TS_min);
        
        const ok = massGate && powerGate && quantumGate && timescaleGate;
        
        // Debug logging for first few cells to understand failure reasons
        if (i < 3 && j < 3) {
          console.log(`🔍 Cell [${i},${j}] Debug: A_tile=${A_tile.toFixed(1e-4)} m², r_ship=${r_ship.toFixed(1)} m`);
          console.log(`  M_exotic=${M_exotic.toFixed(2)} kg (${M_min.toFixed(1)}-${M_max.toFixed(1)}), massGate=${massGate}`);
          console.log(`  P_avg=${P_avg_MW.toFixed(2)} MW (max ${P_max}), powerGate=${powerGate}`);
          console.log(`  ζ=${zeta.toFixed(3)} (max ${zeta_max}), quantumGate=${quantumGate}`);
          console.log(`  TS_ratio=${TS_ratio.toFixed(3)} (min ${TS_min}), timescaleGate=${timescaleGate}`);
          console.log(`  VIABLE=${ok}`);
        }
        
        if (ok) viableCount++;
        Z_row.push(ok ? 1 : 0);
        
      } catch (error) {
        Z_row.push(0); // Failed calculations = not viable
      }
    }
    Z.push(Z_row);
  }
  
  console.log(`🎯 Recipe Grid Results: ${viableCount}/${totalCount} viable points (${(viableCount/totalCount*100).toFixed(1)}%)`);
  
  return {
    A_vals: tileAreas,
    R_vals: shipRadii, 
    Z,
    viableCount,
    totalCount
  };
}