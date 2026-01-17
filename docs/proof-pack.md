# Proof Pack Contract

The proof pack is the single source of truth for pipeline-derived proof metrics.
Panels must consume this payload instead of recomputing locally, and they must
respect the proxy flags and math-stage gating before making non-proxy claims.

## Endpoint
- `GET /api/helix/pipeline/proofs`

## Response shape (v1)
```
{
  "kind": "proof-pack",
  "version": 1,
  "generatedAt": "2026-01-16T00:00:00.000Z",
  "pipeline": { "seq": 123, "ts": 1700000000000, "mode": "hover" },
  "values": {
    "power_avg_W": { "value": 8.33e7, "unit": "W", "source": "pipeline.P_avg_W" },
    "duty_effective": { "value": 2.5e-5, "unit": "1", "source": "pipeline.dutyEffectiveFR" },
    "hull_area_m2": { "value": 1234, "unit": "m^2", "source": "pipeline.hullArea_m2" },
    "kappa_drive": { "value": 1.2e-12, "unit": "1/m^2", "source": "derived:kappa_drive_from_power", "proxy": true }
  },
  "equations": { "theta_expected": "...", "U_static": "..." },
  "sources": { "gammaGeo": "server.result.gammaGeo (design)" },
  "notes": ["missing_values=..."]
}
```

## ProofValue fields
- `value`: number | boolean | string | null.
- `unit`: unit string for numeric values (e.g., `W`, `m^2`, `1/m^2`).
- `source`: path or derivation label used to compute the value.
- `proxy`: true when the value is a proxy, fallback, or derived from weaker evidence.
- `basis`: optional unit-conversion metadata (from unit, scale).
- `note`: optional short explanation.

## Contract rules
- Every proof number in UI must be sourced from `values` or a documented
  pipeline field; if not, it must be labeled as a proxy.
- Proxy fields stay proxy even if numeric; stage gating can force additional
  proxy labels when required modules are below the minimum stage.
- Conversions (MW -> W, cm^2 -> m^2, nm -> m) are recorded via `basis` or `note`.
- Do not emit full pipeline state here; only derived proof metrics belong in
  the pack.

## Required keys (v1)
Proof panels rely on the following keys at minimum:
- power/duty: `power_avg_W`, `power_avg_MW`, `duty_effective`, `duty_burst`
- geometry: `hull_Lx_m`, `hull_Ly_m`, `hull_Lz_m`, `hull_area_m2`
- tiles: `tile_area_cm2`, `tile_area_m2`, `tile_count`, `packing`, `radial_layers`
- cavity: `gap_m`, `gap_guard_m`, `cavity_volume_m3`, `rho_tile_J_m3`,
  `mechanical_casimir_pressure_Pa`, `mechanical_electrostatic_pressure_Pa`,
  `mechanical_restoring_pressure_Pa`, `mechanical_margin_Pa`,
  `mechanical_max_stroke_pm`
- energies: `U_static_J`, `U_geo_J`, `U_Q_J`, `U_cycle_J`, `U_static_total_J`
- masses: `M_exotic_kg`, `M_exotic_raw_kg`, `mass_calibration`
- bubble: `bubble_R_m`, `bubble_sigma`, `bubble_beta`, `coverage`,
  `theta_raw`, `theta_cal`
- guards: `vdb_limit`, `vdb_pocket_radius_m`, `vdb_pocket_thickness_m`,
  `vdb_planck_margin`, `vdb_admissible`
- curvature proxy: `kappa_drive`, `kappa_drive_gain`
- checks: `zeta`, `ts_ratio`, `ford_roman_ok`, `natario_ok`

Update this list if proof panels are expanded.
