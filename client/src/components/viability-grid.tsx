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
  
  // Physics constants
  const pi = Math.PI;
  const h_bar = 1.055e-34; // J⋅s
  const c = 2.998e8; // m/s
  const a = 1e-9; // 1 nm gap distance
  
  // Mode-specific parameters from sliders (exact Live Energy Pipeline matching)
  const gamma_geo = viabilityParams?.gammaGeo || 26;
  const Q_mech = 5e4; // Mechanical Q (fixed)
  const Q_cavity = viabilityParams?.qFactor || 1e9; // Use slider Q-factor
  const f_drive = 15e9; // 15 GHz drive frequency
  const omega = 2 * pi * f_drive;
  
  // Mode configuration (passed from phase diagram)
  const modeConfig = viabilityParams?.modeConfig || {
    duty: 0.14,
    sectors: 1,
    qSpoiling: 1,
    pocketGamma: 2.86e9
  };
  
  // Constraint parameters from sliders
  const maxPower_MW = viabilityParams?.maxPower || 120; // MW (hover mode default)
  const massTolerance_pct = viabilityParams?.massTolerance || 5; // % (tight Needle Hull tolerance)
  const maxZeta = viabilityParams?.maxZeta || 1.0;
  const minTimescale = viabilityParams?.minTimescale || 0.01;
  
  let viableCount = 0;
  let totalCount = 0;

  // Recipe Step 2: For each point (i,j) compute the full pipeline
  for (let j = 0; j < shipRadii.length; j++) {
    const Z_row: number[] = [];
    
    for (let i = 0; i < tileAreas.length; i++) {
      totalCount++;
      
      try {
        const A = tileAreas[i]; // cm²
        const R = shipRadii[j]; // m
        
        // Recipe Step 2: Hull surface area (sphere approx for simplicity)
        const r = R;
        const A_hull = 4 * pi * r * r; // m²
        
        // Recipe Step 3: Tile area in m²
        const A_tile = A * 1e-4; // cm² → m²
        
        // Recipe Step 4: Number of tiles
        const N_tiles = A_hull / A_tile;
        
        // Recipe Step 5: Energy pipeline (exact Live Energy Pipeline match)
        const u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4));
        const V_cavity = A_tile * a; // Cavity volume
        const U_static = u_casimir * V_cavity / 2; // SCUFF-EM divide by 2 convention
        const U_geo = gamma_geo * U_static; // Geometric amplification
        const U_Q = Q_mech * U_geo; // Q-enhanced energy
        
        // Recipe Step 6: Van-den-Broeck pocket for fixed exotic mass (cruise duty for mass budgeting)
        const M_target = 1405; // kg (exact Needle Hull target)
        const cruise_duty = 0.005; // Always use cruise duty for mass calculation per paper
        const U_cycle_base = U_Q * cruise_duty;
        const gamma_pocket = modeConfig.pocketGamma;
        const U_cycle = U_cycle_base * gamma_pocket; // Final cycle energy with pocket boost
        
        // Recipe Step 7: Exotic mass calculation 
        const M_exotic = N_tiles * Math.abs(U_cycle) / (c * c);
        
        // Recipe Step 8: Raw per-tile loss & raw hull power
        const P_raw_tile = Math.abs(U_geo) * omega / Q_cavity;
        const P_raw = P_raw_tile * N_tiles;
        
        // Recipe Step 9: Mode-specific throttling (exact Live Energy Pipeline match)
        const Q_idle = Q_cavity * modeConfig.qSpoiling; // Q-spoiling factor
        const f_throttle = modeConfig.duty * (Q_idle / Q_cavity) * (1 / modeConfig.sectors);
        
        // Recipe Step 10: Realistic average power
        const P_avg_W = P_raw * f_throttle;
        const P_avg_MW = P_avg_W / 1e6;
        
        // Recipe Step 11: Time-scale & quantum margin
        const tau_LC = r / c;
        const tau_pulse = 1 / f_drive;
        const TS_ratio = tau_LC / tau_pulse;
        const zeta = modeConfig.duty > 0 ? 1 / (modeConfig.duty * Math.sqrt(Q_mech)) : Infinity;
        
        // Recipe Step 12: Viability test with USER-CONFIGURABLE constraints
        const M_min = M_target * (1 - massTolerance_pct/100); // User-configurable mass tolerance
        const M_max = M_target * (1 + massTolerance_pct/100); 
        const P_max = maxPower_MW; // User-configurable max power (MW)
        const TS_min = minTimescale; // User-configurable minimum time-scale separation
        const zeta_max = maxZeta; // User-configurable quantum inequality parameter
        
        const ok = (
          M_exotic >= M_min && M_exotic <= M_max &&    // mass gate
          P_avg_MW <= P_max &&                          // power gate
          zeta <= zeta_max &&                          // QI gate
          TS_ratio >= TS_min                           // homogenization gate
        );
        
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