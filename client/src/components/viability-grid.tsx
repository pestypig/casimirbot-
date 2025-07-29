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
  
  // Mode-specific parameters
  const gamma_geo = viabilityParams?.gammaGeo || 26;
  const Q_mech = 5e4; // Mechanical Q
  const Q_cavity = 1e9; // Cavity Q
  const d_cruise = viabilityParams?.duty || 0.14; // Mode duty cycle
  const f_drive = 15e9; // 15 GHz drive frequency
  const omega = 2 * pi * f_drive;
  
  // Combined throttle factors (mode-specific)
  let Q_idle = Q_cavity;
  let S_sectors = 1;
  
  if (Math.abs(d_cruise - 0.14) < 0.02) {
    // Hover mode: no additional throttling
    Q_idle = Q_cavity; S_sectors = 1;
  } else if (Math.abs(d_cruise - 0.005) < 0.002) {
    // Cruise mode: Q-spoiling + sector strobing  
    Q_idle = Q_cavity * 0.001; S_sectors = 400;
  } else if (Math.abs(d_cruise - 0.50) < 0.1) {
    // Emergency mode: no additional throttling
    Q_idle = Q_cavity; S_sectors = 1;
  }

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
        
        // Recipe Step 5: Pipeline constants
        const u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4));
        const U_static = u_casimir * A_tile * a;
        const U_geo = gamma_geo * U_static;
        const U_Q = Q_mech * U_geo;
        const U_cycle = U_Q * d_cruise; // Simplified for grid computation
        
        // Recipe Step 6: Exotic mass
        const M_exotic = N_tiles * Math.abs(U_cycle) / (c * c);
        
        // Recipe Step 7: Raw per-tile loss & raw hull power
        const P_raw_tile = Math.abs(U_geo) * omega / Q_cavity;
        const P_raw = P_raw_tile * N_tiles;
        
        // Recipe Step 8: Combined throttle
        const f_throttle = d_cruise * (Q_idle / Q_cavity) * (1 / S_sectors);
        
        // Recipe Step 9: Realistic average power
        const P_avg_W = P_raw * f_throttle;
        const P_avg_MW = P_avg_W / 1e6;
        
        // Recipe Step 10: Time-scale & quantum margin
        const tau_LC = r / c;
        const tau_pulse = 1 / f_drive;
        const TS_ratio = tau_LC / tau_pulse;
        const zeta = d_cruise > 0 ? 1 / (d_cruise * Math.sqrt(Q_mech)) : Infinity;
        
        // Recipe Step 11: Viability test with REALISTIC constraints
        const M_min = 500; // 500 kg minimum exotic mass
        const M_max = 5000; // 5000 kg maximum exotic mass  
        const P_max = 1000; // 1000 MW maximum power
        const TS_min = 0.001; // Minimum time-scale separation
        const zeta_max = 3.0; // Maximum quantum inequality parameter
        
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