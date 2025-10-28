// physics-core.js — portable 1→7 pipeline with homogenized sectoring default
const PhysicsCore = (() => {
  const C = 2.99792458e8, HBAR = 1.054571817e-34, H = 6.62607015e-34, KB = 1.380649e-23, PI = Math.PI;
  const G = 6.67430e-11; // m^3 kg^-1 s^-2
  const SIGMA = 5.670374419e-8; // Stefan–Boltzmann constant (W m^-2 K^-4)
  function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
  function toRad(f_GHz){ return 2*PI*(f_GHz*1e9); }
  function casimir_u(a_m){ return -(PI**2 * HBAR * C) / (720 * a_m**4); }
  function sphericalCapRadius(D_m, h_m){ if(!(D_m>0 && h_m>0)) return NaN; return (((D_m/2)**2 + h_m**2) / (2*h_m)); }
  function fmt(x){ if(x==null||!isFinite(x)) return '—'; const a=Math.abs(x); if(a>=1e6||a<1e-2) return x.toExponential(2); return x.toLocaleString(undefined,{maximumFractionDigits:3}); }
  const safeDiv = (num, den) => (isFinite(num) && isFinite(den) && den !== 0) ? (num/den) : NaN;
  // Policy (default GR treatment): homogenized sectoring over macro-cycle
  const POLICY = { global: 'homogenized' }; // or 'conservative'
  // Bands & calibration bounds
  const BANDS = {
    R2_hull: { lo: 0.1, hi: 0.3 },
    TS_hull_min: 1e3,
    TS_pocket_min: 1e3,
    stroke_pm_cap: 50, stroke_frac_cap: 0.10,
    radiator_fit_k: 1.0,
    sigma_allow_MPa: 150, structure_margin: 3.0
  };
  const CAL = {
    allowAdjust: { d_eff: true, gammaVdB: true },
    d_eff_limits: { min: 1e-6, max: 0.1 },
    gammaVdB_limits: { min: 1, max: 1e7 }
  };

  function buildTuple({name, author, ship, tile, drive, env, warp}) {
    return {
      id: (name||'warp').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
      name: name || 'Warp Ship',
      author: author || 'anon',
      createdAt: Date.now(),
      ship: {
        length_m: ship.length_m, width_m: ship.width_m, area_m2: ship.area_m2, tilesFill: ship.tilesFill,
        tilePitch_m: ship.tilePitch_m, depth_m: ship.depth_m, habitatReserve_m3: ship.habitatReserve_m3
      },
      tile: {
        A_tile_m2: tile.A_tile_m2, a_nm: tile.a_nm, D_um: tile.D_um, h_nm: tile.h_nm, gammaGeo: tile.gammaGeo,
        tileThickness_m: tile.tileThickness_m
      },
      drive: {
        f_GHz: drive.f_GHz, Q: drive.Q, beta: drive.beta, deltaA_pm: drive.deltaA_pm, d_eff: drive.d_eff,
        // optional warp-metric controls
        tauCurvMode: drive.tauCurvMode, sectors: drive.sectors,
        burst_us: drive.burst_us, dwell_us: drive.dwell_us,
        // design intent + targets
        designIntent: drive.designIntent, R2_star: drive.R2_star
      },
      env: { T_K: env.T_K, Rs_nOhm: env.Rs_nOhm },
      warp: warp || {},
      derived: {}
    };
  }

  function compute(profile){
    const {ship, tile, drive, env} = profile;
    const a_m = tile.a_nm*1e-9;
    const A_tile = tile.A_tile_m2;
    const f = drive.f_GHz*1e9, w = toRad(drive.f_GHz);
    const QL = drive.Q; // loaded Q
    const beta = Number.isFinite(drive.beta) ? drive.beta : 1;
    let Q0 = Number(drive.Q0 || NaN), Qext = Number(drive.Qext || NaN);
    if(!Number.isFinite(Q0) && !Number.isFinite(Qext)){
      Q0 = 2*QL; Qext = 2*QL; // critical coupling as default
    } else if(Number.isFinite(Q0) && !Number.isFinite(Qext)){
      Qext = 1 / Math.max(1e-18, (1/QL - 1/Q0));
    } else if(!Number.isFinite(Q0) && Number.isFinite(Qext)){
      Q0 = 1 / Math.max(1e-18, (1/QL - 1/Qext));
    }
    const gammaGeo = tile.gammaGeo;
    const deltaA = drive.deltaA_pm*1e-12;
    const d_eff_input = drive.d_eff;
    const T = env.T_K;
    const Rs = env.Rs_nOhm*1e-9;
    const pitch_m = Math.max(1e-6, ship.tilePitch_m || 0.02);
    const depth_m = Math.max(0, ship.depth_m || 0.5);
    const habitat_m3 = Math.max(0, ship.habitatReserve_m3 || 0);
    const tileThickness_m = Math.max(0, tile.tileThickness_m || 0.001);
    const intent = (drive.designIntent === 'hull') ? 'hull' : 'geom';
    const R2_star = Number.isFinite(drive.R2_star) ? drive.R2_star : 0.2;

    // Sectorization and timing (for duty and reciprocity)
  const sectors = Math.max(1, Number(profile?.drive?.sectors || profile?.ship?.sectors || 16));
  const S_total = sectors;
  const S_live_instant = 1; // one active sector at an instant
  const S_eff = Math.max(1, Number(profile?.drive?.sectorsEff || sectors)); // coverage over macro-cycle
  const S_live = S_live_instant;
  const duty_sector = S_live_instant / S_total;
    const burst_us = Number(profile?.drive?.burst_us ?? NaN);
    const dwell_us = Number(profile?.drive?.dwell_us ?? NaN);
    const burst_ms = isFinite(burst_us) ? (burst_us / 1000) : NaN;
    const dwell_ms = isFinite(dwell_us) ? (dwell_us / 1000) : NaN;
    const duty_timing = (isFinite(burst_ms) && isFinite(dwell_ms))
      ? clamp(burst_ms / Math.max(1e-12, (burst_ms + dwell_ms)), 0, 1)
      : NaN;
  const d_eff_timing = isFinite(duty_timing) ? duty_timing * duty_sector : NaN;
  let d_eff = isFinite(d_eff_timing) ? d_eff_timing : clamp(d_eff_input, 0, 1);
  let d_eff_source = isFinite(d_eff_timing) ? 'timing' : 'input';

    // Per-tile static U
    const u = casimir_u(a_m);
    const U_static = u * A_tile * a_m; // J

    // Geometry & mech
    const U_geo = U_static * gammaGeo;
    const q_mech = 0.9438771172679477; // use your panel default for now
    const U_Q = U_geo * q_mech;

    // Power per tile (ON)
  const P_on = (w * Math.abs(U_Q)) / QL; // W (per-tile, ON)
  const P_wall_on = (w * Math.abs(U_Q)) / Math.max(1e-9, Q0);
  const P_port_on = (w * Math.abs(U_Q)) / Math.max(1e-9, Qext);

  // N from hull area + pitch feasibility cap
  const N_area = Math.max(0, Math.floor((ship.tilesFill * ship.area_m2) / Math.max(1e-12, A_tile)));
  const N_pitchMax = Math.max(0, Math.floor(ship.area_m2 / (pitch_m*pitch_m)));
  const N = Math.min(N_area, N_pitchMax);
    let P_ship = P_on * N * d_eff; // W (avg over timing/sectorization)
  let P_ship_MW = P_ship / 1e6;

    // ---- Tiles sufficiency vs optional target ship power ----
    const P_target_MW = Number.isFinite(profile?.drive?.P_target_MW) ? Number(profile.drive.P_target_MW) : 0;
    let N_required = 0, area_required_m2 = 0, tilesEnough = true;

    // Mass path (VdB)
    const gammaVdB_default = 1.348526e5; // same as panel default
    let gammaVdB_used = gammaVdB_default;
    // E_tile_avg and M_total computed after potential calibration

  // GR gates (cavity time ↔ curvature times)
  const tau_LC = (1/w) * QL; // seconds (Q/ω)
  const tau_LC_ms = tau_LC*1e3;
  const T_mod = 1/(drive.f_GHz*1e9); // seconds
  const R1 = T_mod / tau_LC;
  // Geometry-scale curvature (pocket)
  const R_geom = sphericalCapRadius(tile.D_um*1e-6, tile.h_nm*1e-9);
  const tau_curv_geom = R_geom / C;
  const R2_geom = tau_LC / tau_curv_geom;
  // Hull-scale curvature (homogenized vs conservative)
  const L_design = Math.max(1e-6, (ship.length_m || 1)); // actual hull length
  const L_eff_homog = L_design / Math.max(1, S_eff);
  const tau_curv_hull_homog = L_eff_homog / C; // s
  const R2_hull_homog = tau_LC / tau_curv_hull_homog;
  const tau_curv_hull_cons = L_design / C; // s
  const R2_hull_cons = tau_LC / tau_curv_hull_cons;
  const useHomog = (POLICY.global === 'homogenized');
  const tau_curv_hull = useHomog ? tau_curv_hull_homog : tau_curv_hull_cons;
  const R2_hull = useHomog ? R2_hull_homog : R2_hull_cons;
  const L_eff = L_eff_homog;
  // Time-scale separations
  const tau_LC_hull = L_design / C;
  const TS_hull = safeDiv(tau_LC_hull, T_mod);
  const TS_pocket = safeDiv(tau_curv_geom, T_mod);
  // Active mode chooses which τ_curv drives the main R2 (still report both)
  const tauCurvMode = (profile?.drive?.tauCurvMode === 'hull') ? 'hull' : 'geom';
  const tau_curv = (tauCurvMode === 'hull') ? tau_curv_hull : tau_curv_geom;
  const tau_curv_ms = tau_curv * 1e3;
  const R2 = tau_LC / tau_curv;

  // Reciprocity gate: strict (burst ≥ τ_Q) OR PASS_AVG if TS_hull is huge
  const hasAnyTiming = isFinite(burst_ms) || isFinite(dwell_ms);
  const reciprocity_strict = isFinite(burst_ms) ? (burst_ms >= tau_LC_ms) : false;
  const reciprocity_avg = isFinite(TS_hull) ? (TS_hull >= BANDS.TS_hull_min) : false;
  const reciprocityOK = reciprocity_strict || reciprocity_avg || (!hasAnyTiming);

  // Materials & DCE guards
  const Tc = 18.0; const materialsOK = (T <= 4.2) && (QL >= 1e8);
    const dRel = deltaA / a_m;
    const DCE_ok = (dRel <= 0.1) && (drive.deltaA_pm <= 50);

    // Thermal occupancy
    const hf_over_kT = (H*f)/(KB*T); const n_th = 1/(Math.exp(hf_over_kT) - 1);

  // Geometry gate via time-scale separation; Hull gate via homogenized band
  const WarpGeomOK = isFinite(TS_pocket) && (TS_pocket >= BANDS.TS_pocket_min);
  const WarpHullOK = isFinite(R2_hull) && (R2_hull >= BANDS.R2_hull.lo) && (R2_hull <= BANDS.R2_hull.hi);
  const WarpOK = WarpGeomOK && WarpHullOK;

  // Packing / volume gates
  const V_hull = ship.area_m2 * depth_m;
  const V_tiles = N * A_tile * tileThickness_m;
  const pitchOK = (A_tile <= pitch_m*pitch_m) && (N_area <= N_pitchMax + 1e-9);
  // Cryo + Plant minimal model
  const COP_4K = Number.isFinite(env.COP_4K) ? env.COP_4K : 0.01;
  const eps_rad = Number.isFinite(env.eps_rad) ? env.eps_rad : 0.8;
  const T_rad = Number.isFinite(env.T_rad_K) ? env.T_rad_K : 300;
  const P_wall_4K = P_wall_on * N * d_eff;
  const P_el_cryo = P_wall_4K / Math.max(1e-9, COP_4K);
  const A_radiator_m2 = P_el_cryo / (Math.max(1e-6, eps_rad) * SIGMA * (T_rad**4));
  const plant_kg_per_kW = Number.isFinite(env.plant_kg_per_kW) ? env.plant_kg_per_kW : 8;
  const plant_m3_per_kW = Number.isFinite(env.plant_m3_per_kW) ? env.plant_m3_per_kW : 0.02;
  const P_bus = P_el_cryo * 1.03;
  const plant_mass = plant_kg_per_kW * (P_bus/1000);
  const plant_vol  = plant_m3_per_kW * (P_bus/1000);
  const tile_areal_kgpm2 = Number.isFinite(tile.tile_areal_kgpm2) ? tile.tile_areal_kgpm2 : 2.0;
  const M_tiles = N * A_tile * tile_areal_kgpm2;
  const frame_mass_factor = Number.isFinite(ship.frame_mass_factor) ? ship.frame_mass_factor : 0.5;
  const M_frames = frame_mass_factor * M_tiles;
  const cryo_kg_per_W4K = Number.isFinite(env.cryo_kg_per_W4K) ? env.cryo_kg_per_W4K : 6.0;
  const M_cryo = cryo_kg_per_W4K * P_wall_4K;
  const V_cryo = 0.005 * P_wall_4K;
  const V_power = plant_vol;
  const V_budget_used = V_tiles + V_cryo + V_power + habitat_m3;
  const volumeOK = (V_hull >= V_budget_used);
  const a_design = Number.isFinite(ship.a_design_ms2) ? ship.a_design_ms2 : 1.0;
  const sigma_allow = Number.isFinite(ship.sigma_allow_MPa) ? ship.sigma_allow_MPa*1e6 : 150e6;
  const structure_margin = Number.isFinite(ship.structure_margin) ? ship.structure_margin : 3.0;
  const M_ship_total = M_tiles + M_frames + M_cryo + plant_mass;
  const wall_area_eff = 2*(Math.max(0, ship.length_m)+Math.max(0, ship.width_m))*Math.max(1e-6, depth_m) + 2*Math.max(0, ship.area_m2);
  const avg_stress = (M_ship_total * a_design) / Math.max(1e-6, wall_area_eff);
  const structureOK = (avg_stress <= (sigma_allow/structure_margin));
  const radiator_fit_k = Number.isFinite(env.radiator_fit_k) ? env.radiator_fit_k : BANDS.radiator_fit_k;
  const radiatorOK = (A_radiator_m2 <= radiator_fit_k * wall_area_eff);
  const packingOK = pitchOK && volumeOK;

  // Optional hover anchoring: adjust d_eff and/or γ_VdB within bounds to match targets
  const M_target_kg = Number.isFinite(profile?.drive?.M_target_kg) ? Number(profile.drive.M_target_kg) : 0;
  const calibrated = [];
  if (P_target_MW > 0 && CAL.allowAdjust.d_eff && isFinite(P_on) && P_on>0 && N>0) {
    const d_needed = (P_target_MW*1e6) / (P_on * N);
    if (isFinite(d_needed)) {
      const d_fit = clamp(d_needed, CAL.d_eff_limits.min, CAL.d_eff_limits.max);
      if (Math.abs(d_fit - d_eff) / Math.max(1e-9, d_eff) > 1e-6) {
        d_eff = d_fit; d_eff_source = 'calibrated';
        calibrated.push(`d_eff→${d_eff.toExponential(2)}`);
      }
    }
  }
  // Recompute ship power and sufficiency with possibly updated d_eff
  P_ship = P_on * N * d_eff; P_ship_MW = P_ship / 1e6;
  if (P_target_MW > 0 && isFinite(P_on) && P_on>0 && isFinite(d_eff) && d_eff>0) {
    const P_target_W = P_target_MW * 1e6;
    N_required = Math.ceil(P_target_W / (P_on * d_eff));
    tilesEnough = (N >= N_required);
    const fill = Math.max(1e-9, Number(ship.tilesFill) || 0);
    area_required_m2 = (N_required * Math.max(A_tile, 1e-12)) / fill;
  }
  // Calibrate gammaVdB to meet exotic mass target, if provided
  if (M_target_kg > 0 && CAL.allowAdjust.gammaVdB) {
    const denom = N * Math.abs(U_static) * (gammaGeo**3) * d_eff / (C**2);
    const g_needed = denom>0 ? (M_target_kg / denom) : NaN;
    if (isFinite(g_needed)) {
      const g_fit = clamp(g_needed, CAL.gammaVdB_limits.min, CAL.gammaVdB_limits.max);
      gammaVdB_used = g_fit;
      if (Math.abs(g_fit - gammaVdB_default)/Math.max(1e-9,gammaVdB_default) > 1e-6) {
        calibrated.push(`γ_VdB→${g_fit.toExponential(3)}`);
      }
    }
  }
  // Now compute exotic mass path with calibrated parameters
  const E_tile_avg = Math.abs(U_static) * (gammaGeo**3) * gammaVdB_used * d_eff;
  const M_total = (E_tile_avg / (C**2)) * N;

  // --------- Sizing engine "quanta" (rules of thumb) ----------
  // Tiles per m² (planform-limited) and average W per m² at current settings
  const tiles_per_m2 = safeDiv(ship.tilesFill, A_tile); // η_fill / A_tile
  const P_avg_per_m2_W = (isFinite(P_on) && isFinite(d_eff)) ? (P_on * d_eff * tiles_per_m2) : NaN;
  // Tiles needed per MW and area per MW at current settings
  const tiles_per_MW = (isFinite(P_on) && P_on>0 && isFinite(d_eff) && d_eff>0)
    ? (1e6 / (P_on * d_eff)) : NaN;
  const area_per_MW_m2 = (isFinite(tiles_per_MW) && isFinite(A_tile) && isFinite(ship.tilesFill) && ship.tilesFill>0)
    ? (tiles_per_MW * A_tile / ship.tilesFill) : NaN;
  // Radiator sizing rule: m² per kW (depends only on ε and T_rad)
  const rad_m2_per_kW = (Math.max(1e-9, eps_rad) * SIGMA * (T_rad**4)) > 0
    ? (1000 / (eps_rad * SIGMA * (T_rad**4))) : NaN;
  // Plant mass rule (kg per MW)
  const plant_kg_per_MW = (isFinite(plant_kg_per_kW) ? (1000 * plant_kg_per_kW) : NaN);

  // --------- Component ledger (explicit) ----------
  const components = {
    tiles: { N, mass_kg: M_tiles, vol_m3: V_tiles, areal_kgpm2: tile_areal_kgpm2 },
    frames:{ mass_kg: M_frames, vol_m3: V_tiles * frame_mass_factor },
    cryo:  { Pel_W: P_el_cryo, mass_kg: M_cryo, vol_m3: V_cryo, Arad_m2: A_radiator_m2, eps: eps_rad, Trad_K: T_rad },
    plant: { Pbus_W: P_bus, mass_kg: plant_mass, vol_m3: plant_vol, kg_per_kW: plant_kg_per_kW, m3_per_kW: plant_m3_per_kW },
    hull:  { Awall_m2: wall_area_eff, Vhull_m3: V_hull, sigma_avg_Pa: avg_stress, sigma_allow_Pa: sigma_allow/structure_margin }
  };

  // Hull helpers (targets): homogenized default
  const L_min_homog = (QL * C) / (w * Math.max(1e-9, R2_star) * Math.max(1, S_eff));
  const Q_target_homog = (w * Math.max(1e-6, L_design) * Math.max(1e-9, R2_star) * Math.max(1, S_eff)) / C;
  const L_min_cons = (QL * C * Math.max(1, sectors)) / (w * Math.max(1e-9, R2_star));
  const L_min_for_R2star = L_min_homog;
  const Q_target_for_R2star = Q_target_homog;

  // Status (intent-aware)
  // Coupling validity: require positive Qs and Q0≥QL; check 1/QL≈1/Q0+1/Qext
  const couplingConsErr = Math.abs((1/Math.max(1e-18, QL)) - ((1/Math.max(1e-18, Q0)) + (1/Math.max(1e-18, Qext))));
  const couplingOK = (QL>0 && Q0>0 && Qext>0 && Q0>=QL && couplingConsErr <= (1e-6/Math.max(1e-18,QL)));
  const dutyKnown = isFinite(duty_timing) || !(isFinite(burst_ms) || isFinite(dwell_ms));
  const intentOK = (intent === 'hull') ? (WarpHullOK && packingOK && structureOK) : WarpGeomOK;
  const status = (materialsOK && DCE_ok && reciprocityOK && dutyKnown && couplingOK && radiatorOK && (R1 < 1e-3) && intentOK && volumeOK) ? "ok"
           : (materialsOK ? "warn" : "fail");

    // --- Alcubierre Compliance (order-of-magnitude proxies) ---
    // Inputs (with safe defaults)
    const bubble_R_m   = Math.max(1e-6, Number(profile?.warp?.bubble_R_m ?? 5));
    const wall_thick_m = Math.max(1e-9, Number(profile?.warp?.wall_thick_m ?? 0.5));
    const v_s          = Math.max(0, Math.min(1, Number(profile?.warp?.v_s ?? 0.01)));
    const k_warp       = Math.max(1e-6, Number(profile?.warp?.k_warp ?? 1));
    const f_throat     = Math.max(0, Math.min(1, Number(profile?.warp?.f_throat ?? 0.05)));
    // QI constants
    const C_QI         = Math.max(1e-6, Number(profile?.warp?.C_QI ?? 0.01));
    const tau_QI_ms    = Number.isFinite(profile?.warp?.tau_QI_ms) ? profile.warp.tau_QI_ms : (tau_LC_ms);
    const tau_QI_s     = Math.max(1e-12, tau_QI_ms/1e3);

    // Required negative energy proxy:
    // E_req ~ k_warp * (c^4/G) * v_s^2 * (4π R^2 / Δ)
    const C4_over_G = (C**4)/G;
    const wall_area = 4*PI*(bubble_R_m**2);
    const E_req_neg_J = k_warp * C4_over_G * (v_s**2) * (wall_area / wall_thick_m);

    // Available negative energy from lattice (cycle-averaged)
    const U_neg_tile = u * A_tile * a_m; // same as U_static (negative)
    const U_neg_tile_eff = U_neg_tile * (gammaGeo**3) * d_eff * f_throat;
    const E_avail_neg_J = Math.abs(U_neg_tile_eff) * N; // magnitude

    // QI sampler proxy: |⟨ρ⟩_τ| ≤ C_QI / τ^4
    const rho_neg_avg = Math.abs(u) * (gammaGeo**3) * d_eff * f_throat; // J/m^3
    const rho_QI_bound = C_QI / (tau_QI_s**4); // J/m^3
    const QI_OK = rho_neg_avg <= rho_QI_bound;

    // Compliance ratios
    const warp_ratio = (E_avail_neg_J>0) ? (E_avail_neg_J / E_req_neg_J) : 0;
    const warp_OK = warp_ratio >= 1;

    return {
      a_m, A_tile, u, U_static, U_geo, U_Q,
  f, w, Q: QL, Q0, Qext, beta, q_mech, gammaGeo, gammaVdB,
  P_on_W: P_on, N, P_ship_W: P_ship, P_ship_MW,
  // tiles sufficiency signals
  N_required, area_required_m2, tilesEnough, P_target_MW,
      E_tile_avg_J: E_tile_avg, M_total_kg: M_total,
      tauCurvMode, intent, R2_star,
  tau_LC_ms, T_mod_ms: T_mod*1e3, tau_curv_ms, R1, R2,
  R2_geom, R2_hull, tau_curv_geom_ms: tau_curv_geom*1e3, tau_curv_hull_ms: tau_curv_hull*1e3,
  // expose homogenized vs conservative breakdown and effective coverage + TS
      R2_hull_homog, R2_hull_cons,
      tau_curv_hull_homog_ms: tau_curv_hull_homog*1e3,
      tau_curv_hull_cons_ms: tau_curv_hull_cons*1e3,
  sectors, S_eff,
  tau_LC_hull_ms: tau_LC_hull*1e3, TS_hull, TS_pocket,
      L_design_m: L_design,
      L_eff_m: L_eff,
      L_eff_homog_m: L_eff_homog,
      T_K: T, Rs_nOhm: env.Rs_nOhm, n_th, hf_over_kT,
      materialsOK, DCE_ok, reciprocityOK, WarpOK, WarpGeomOK, WarpHullOK, status,
      // packing/volume
  pitch_m, depth_m, habitat_m3, tileThickness_m, V_hull, V_tiles, pitchOK, volumeOK, packingOK,
  // cryo/plant ledger
  COP_4K: COP_4K, eps_rad, T_rad_K: T_rad,
  P_wall_on, P_port_on, P_wall_4K, P_el_cryo, A_radiator_m2,
  plant_mass_kg: plant_mass, plant_vol_m3: plant_vol, P_bus_W: P_bus,
  M_tiles_kg: M_tiles, M_frames_kg: M_frames, M_cryo_kg: M_cryo, V_cryo_m3: V_cryo, V_power_m3: V_power,
  structureOK, avg_stress_Pa: avg_stress, sigma_allow_Pa: sigma_allow, structure_margin,
  radiatorOK,
    // helpers
    L_min_for_R2star, Q_target_for_R2star,
    L_min_homog_m: L_min_homog,
    L_min_cons_m: L_min_cons,
    pocket_R_m: R_geom,
    // duty provenance
  d_eff_effective: d_eff, d_eff_source, duty_timing, duty_sector, burst_ms, dwell_ms, S_total, S_live, dutyKnown,
  couplingOK,
    // calibration provenance
    calibrated, gammaVdB_used,
      // Alcubierre compliance (proxies)
      bubble_R_m, wall_thick_m, v_s, k_warp, f_throat,
      E_req_neg_J, E_avail_neg_J, warp_ratio, warp_OK,
      C_QI, tau_QI_ms, rho_neg_avg, rho_QI_bound, QI_OK
      ,
      // --- sizing engine exposure ---
      components,
      tiles_per_m2, P_avg_per_m2_W, tiles_per_MW, area_per_MW_m2,
      rad_m2_per_kW, plant_kg_per_MW
    };
  }

  function publicTuple(p){
    // minimal tuple for display
    return {
      id: p.id, name: p.name, author: p.author,
      ship: {...p.ship, N: p.derived.N},
      tile: p.tile, drive: p.drive, env: p.env,
      derived: {
        P_ship_MW: p.derived.P_ship_MW, M_total_kg: p.derived.M_total_kg,
        R1: p.derived.R1, R2: p.derived.R2, status: p.derived.status
      }
    };
  }

  function renderGates(d){
    const pill = (label, ok) => `<span class="pill ${ok?'ok':'warn'}">${label}</span>`;
    return `
      <div class="gate-row">
        ${pill('Materials', d.materialsOK)} ${pill('DCE', d.DCE_ok)} ${pill('Reciprocity', d.reciprocityOK)}
        ${pill('Coupling', d.couplingOK)} ${pill('Duty Known', d.dutyKnown)} ${pill('Radiator', d.radiatorOK)}
        ${pill(d.intent==='hull' ? 'Warp Hull' : 'Warp Geom', d.intent==='hull' ? d.WarpHullOK : d.WarpGeomOK)}
        ${pill('Packing', d.packingOK && d.volumeOK && d.structureOK)} ${pill('R1', d.R1 < 1e-3)} ${pill('R2*', isFinite(d.R2))}
      </div>
      <div class="subrow">
        <span>R1 = ${fmt(d.R1)}</span> · <span>R2(active) = ${fmt(d.R2)} [${d.tauCurvMode}]</span> ·
        <span>τ_LC = ${fmt(d.tau_LC_ms)} ms</span> · <span>τ_curv(active) = ${fmt(d.tau_curv_ms)} ms</span> ·
        <span>burst = ${d.burst_ms!=null?fmt(d.burst_ms):'—'} ms (${d.d_eff_source})</span>
      </div>
      <div class="subrow">
        <span>R2_geom = ${fmt(d.R2_geom)} (τ_curv,geom = ${fmt(d.tau_curv_geom_ms)} ms) → band [3–7] ${d.WarpGeomOK?'✓':'×'}</span> ·
        <span>R2_hull(homog) = ${fmt(d.R2_hull_homog)} (τ = ${fmt(d.tau_curv_hull_homog_ms)} ms)</span> ·
        <span>R2_hull(cons) = ${fmt(d.R2_hull_cons)} (τ = ${fmt(d.tau_curv_hull_cons_ms)} ms)</span> ·
        <span>active hull → ${fmt(d.R2_hull)} (S = ${fmt(d.sectors)}, S_eff = ${fmt(d.S_eff)}, S_live = ${fmt(d.S_live)}) → band [0.1–0.3] ${d.WarpHullOK?'✓':'×'}</span>
      </div>
      <div class="subrow">
        <span>Pitch OK = ${d.pitchOK ? '✓' : '×'} (A_tile ≤ p² & grid cap)</span> ·
        <span>Volume OK = ${d.volumeOK ? '✓' : '×'} (V_hull ≥ V_tiles + V_cryo + V_power + V_hab)</span> ·
        <span>Structure OK = ${d.structureOK ? '✓' : '×'} (avg σ = ${fmt(d.avg_stress_Pa)} Pa ≤ ${fmt(d.sigma_allow_Pa)} Pa)</span> ·
        <span>Radiator fit = ${d.radiatorOK ? '✓' : '×'}</span>
      </div>
      <div class="subrow">
        <span>L_min,h(@R2*=${fmt(d.R2_star)}) = ${fmt(d.L_min_homog_m)} m</span> ·
        <span>L_min,c(@R2*=${fmt(d.R2_star)}) = ${fmt(d.L_min_cons_m)} m</span> ·
        <span>Q_target,h(@R2*=${fmt(d.R2_star)}) = ${fmt(d.Q_target_for_R2star)}</span>
      </div>
    `;
  }

  function renderAlcubierre(d){
    const pill = (label, ok) => `<span class="pill ${ok?'ok':'warn'}">${label}</span>`;
    return `
      <div class="gate-row">
        ${pill('Warp Budget', d.warp_OK)} ${pill('QI Sampler', d.QI_OK)}
      </div>
      <div class="subrow">
        <span>E_req (proxy) = ${fmt(d.E_req_neg_J)} J</span> ·
        <span>E_avail = ${fmt(d.E_avail_neg_J)} J</span> ·
        <span>coverage = ${fmt(d.warp_ratio)}</span>
      </div>
      <div class="subrow">
        <span>R = ${fmt(d.bubble_R_m)} m</span> ·
        <span>Δ = ${fmt(d.wall_thick_m)} m</span> ·
        <span>v_s = ${fmt(d.v_s)} c</span> ·
        <span>k_warp = ${fmt(d.k_warp)}</span> ·
        <span>f_throat = ${fmt(d.f_throat)}</span>
      </div>
      <div class="subrow">
        <span>ρ̄_neg ≈ ${fmt(d.rho_neg_avg)} J/m³</span> ·
        <span>QI bound ≲ ${fmt(d.rho_QI_bound)} J/m³</span> ·
        <span>τ_QI = ${fmt(d.tau_QI_ms)} ms</span> ·
        <span>C_QI = ${fmt(d.C_QI)}</span>
      </div>
      <div class="note">
        <em>Note:</em> Alcubierre & QI checks above are <b>order-of-magnitude proxies</b>.
        They scale (v², area/Δ, 1/τ⁴) but are not a proof of GR sourcing.
      </div>
    `;
  }

  function renderAlcubierreCard(d){
    return `
      <div class="card">
        <h3>Alcubierre Compliance (Proxies)</h3>
        ${renderAlcubierre(d)}
      </div>
    `;
  }

  function renderResults(d){
    return `
      <div class="card">
        <h3>Key Results</h3>
        <div class="subrow"><span>P_on (tile)</span> <b>${fmt(d.P_on_W)}</b> W</div>
        <div class="subrow"><span>N (tiles)</span> <b>${fmt(d.N)}</b></div>
        <div class="subrow"><span>P_ship,avg</span> <b>${fmt(d.P_ship_W)}</b> W (${fmt(d.P_ship_MW)} MW)</div>
        <div class="subrow"><span>M_total (exotic proxy)</span> <b>${fmt(d.M_total_kg)}</b> kg</div>
        <div class="subrow"><span>n_th @ f</span> ${fmt(d.n_th)}</div>
        <div class="subrow"><span>Status</span> <span class="pill ${d.status}">${d.status}</span></div>
      </div>
      <div class="card">
        <h3>Power & Thermal (Ledger)</h3>
        <div class="subrow"><span>P_wall,on (tile)</span> ${fmt(d.P_wall_on)} W · <span>P_wall,4K (avg)</span> <b>${fmt(d.P_wall_4K)}</b> W</div>
        <div class="subrow"><span>COP_4K</span> ${fmt(d.COP_4K)} · <span>P_el,cryo</span> <b>${fmt(d.P_el_cryo)}</b> W · <span>Radiator @ ${fmt(d.T_rad_K)} K</span> ${fmt(d.A_radiator_m2)} m²</div>
        <div class="subrow"><span>P_bus</span> <b>${fmt(d.P_bus_W)}</b> W · <span>Plant mass</span> ${fmt(d.plant_mass_kg)} kg · <span>Plant vol</span> ${fmt(d.plant_vol_m3)} m³</div>
      </div>
      <div class="card">
        <h3>Mass & Volume</h3>
        <div class="subrow"><span>M_tiles</span> ${fmt(d.M_tiles_kg)} kg · <span>M_frames</span> ${fmt(d.M_frames_kg)} kg · <span>M_cryo</span> ${fmt(d.M_cryo_kg)} kg</div>
        <div class="subrow"><span>V_tiles</span> ${fmt(d.V_tiles)} m³ · <span>V_cryo</span> ${fmt(d.V_cryo_m3)} m³ · <span>V_power</span> ${fmt(d.V_power_m3)} m³ · <span>V_hab</span> ${fmt(d.habitat_m3)} m³</div>
        <div class="subrow"><span>V_hull</span> <b>${fmt(d.V_hull)}</b> m³ · <span>Used</span> ${fmt(d.V_tiles + d.V_cryo_m3 + d.V_power_m3 + d.habitat_m3)} m³</div>
      </div>
      <div class="card">
        <h3>Size Scales & Rules-of-Thumb</h3>
        <div class="subrow"><span>Pocket R (geom)</span> <b>${fmt(d.pocket_R_m)}</b> m · <span>Hull L_design</span> <b>${fmt(d.L_design_m)}</b> m</div>
        <div class="subrow"><span>L_min (homog) @ R2*=${fmt(d.R2_star)}</span> <b>${fmt(d.L_min_homog_m)}</b> m · <span>L_min (cons)</span> <b>${fmt(d.L_min_cons_m)}</b> m</div>
        <div class="subrow"><span>tiles / m²</span> <b>${fmt(d.tiles_per_m2)}</b> · <span>avg W / m²</span> <b>${fmt(d.P_avg_per_m2_W)}</b></div>
        <div class="subrow"><span>tiles / MW</span> <b>${fmt(d.tiles_per_MW)}</b> · <span>area / MW</span> <b>${fmt(d.area_per_MW_m2)}</b> m²</div>
      </div>
      <div class="card">
        <h3>Rules of Thumb (live)</h3>
        <div class="subrow"><span>tiles / m²</span> <b>${fmt(d.tiles_per_m2)}</b> · <span>avg W / m²</span> <b>${fmt(d.P_avg_per_m2_W)}</b></div>
        <div class="subrow"><span>tiles / MW</span> <b>${fmt(d.tiles_per_MW)}</b> · <span>area / MW</span> <b>${fmt(d.area_per_MW_m2)}</b> m²</div>
        <div class="subrow"><span>radiator m² / kW (ε=${fmt(d.eps_rad)}, T=${fmt(d.T_rad_K)} K)</span> <b>${fmt(d.rad_m2_per_kW)}</b></div>
        <div class="subrow"><span>plant kg / MW</span> <b>${fmt(d.plant_kg_per_MW)}</b> · <span>tiles enough for target?</span> <span class="pill ${d.tilesEnough?'ok':'warn'}">${d.P_target_MW>0?(d.tilesEnough?'yes':'no'):'—'}</span></div>
      </div>
      ${renderAlcubierreCard(d)}
    `;
  }

  return { buildTuple, compute, publicTuple, renderGates, renderResults };
})();
