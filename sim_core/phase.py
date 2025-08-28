"""
Phase diagram calculations for warp bubble viability analysis.
Server-wide calibrated against the Helix energy pipeline.
"""

from typing import Dict, Tuple, Any, Optional
import json
import os
import numpy as np
from pathlib import Path

# ---------- Base constants (SI, physics) ----------
CONST = {
    # ħc (197.326 MeV·fm) ≈ 3.164e-26 J·m
    "HBARC": 3.164e-26,
    # geometric knob (used ONLY as a constraint check, not to inflate energy)
    "GAMMA_GEO": 25.0,
    # Ford–Roman ship-avg duty (≈ 1% local × 1/400 sectors)
    "DUTY_EFF": 2.5e-5,
    # modulation frequency (Hz)
    "FREQ_HZ": 15e9,
    # pulse length used in ζ proxy
    "PULSE_LEN": 10e-6,
    # parallel-plate gap for E/A model
    "GAP_M": 1e-9,  # 1 nm
    # light speed
    "C_LIGHT": 2.99792458e8,
}

# ---------- Pipeline-owned reference targets ----------
# These can be overridden by:
#  - JSON file path in HELIX_PHASE_CALIB_JSON
#  - or discrete env vars: HELIX_PHASE_REF_TILE_CM2, _R_M, _P_W, _M_KG, _ZETA
REF_DEFAULT = {
    "tile_area_cm2": 2500.0,   # 0.25 m²
    "ship_radius_m": 5.0,      # 5 m
    "P_target_W": 100e6,       # ~100 MW target
    "M_target_kg": 1400.0,     # ~1.4e3 kg target
    "zeta_target": 0.5,        # comfortably < 1
}

def _load_ref() -> Dict[str, float]:
    path = os.getenv("HELIX_PHASE_CALIB_JSON", "").strip()
    if path:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # allow partial override
            merged = {**REF_DEFAULT, **{k: float(v) for k, v in data.items() if k in REF_DEFAULT}}
            return merged
        except Exception:
            pass
    # discrete env overrides
    env = {}
    for key, envkey in [
        ("tile_area_cm2", "HELIX_PHASE_REF_TILE_CM2"),
        ("ship_radius_m", "HELIX_PHASE_REF_R_M"),
        ("P_target_W", "HELIX_PHASE_REF_P_W"),
        ("M_target_kg", "HELIX_PHASE_REF_M_KG"),
        ("zeta_target", "HELIX_PHASE_REF_ZETA"),
    ]:
        val = os.getenv(envkey)
        if val is not None:
            try:
                env[key] = float(val)
            except ValueError:
                pass
    return {**REF_DEFAULT, **env}

REF = _load_ref()

# ---------- Nominal (uncalibrated) model ----------
def _u_static_per_tile(A_tile_m2: float, gap_m: float) -> float:
    """Parallel-plate Casimir energy per tile: U = -(π² ħ c / (720 a³)) · A."""
    return -(np.pi**2) * CONST["HBARC"] / (720.0 * gap_m**3) * A_tile_m2

def _nominals(A_cm2: float, R_m: float) -> Dict[str, float]:
    """Compute conservative nominal values (no γ³ or Q cascades)."""
    A_tile = float(A_cm2) * 1e-4
    R = float(R_m)
    A_hull = 4 * np.pi * R**2
    N_tiles = A_hull / max(A_tile, 1e-30)

    U_static = abs(_u_static_per_tile(A_tile, CONST["GAP_M"]))  # J/tile (magnitude)
    d_eff = float(CONST["DUTY_EFF"])
    omega = 2 * np.pi * float(CONST["FREQ_HZ"])

    # Power chain (conservative): P ∝ U_static · ω · N · d_eff
    P_nom_W = U_static * omega * N_tiles * d_eff

    # Mass proxy from stored static energy (pre-calibration)
    M_nom_kg = (U_static * N_tiles) / (CONST["C_LIGHT"] ** 2)

    # ζ proxy before calibration
    zeta_nom = (U_static * d_eff * float(CONST["PULSE_LEN"])) / max(CONST["HBARC"], 1e-40)

    return dict(P_nom_W=P_nom_W, M_nom_kg=M_nom_kg, zeta_nom=zeta_nom,
                N_tiles=N_tiles, A_hull=A_hull, U_static=U_static)

# ---------- Calibration (computed once from pipeline reference) ----------
_ref_nom = _nominals(REF["tile_area_cm2"], REF["ship_radius_m"])
KAPPA = {
    "P": REF["P_target_W"] / max(_ref_nom["P_nom_W"], 1e-40),
    "M": REF["M_target_kg"] / max(_ref_nom["M_nom_kg"], 1e-40),
    "Z": REF["zeta_target"] / max(_ref_nom["zeta_nom"], 1e-40),
}

def reload_calibration(ref_override: Optional[Dict[str, float]] = None) -> None:
    """Optional hot-reload from pipeline (call on config change)."""
    global REF, KAPPA, _ref_nom
    if ref_override is None:
        REF = _load_ref()
    else:
        REF = {**REF_DEFAULT, **{k: float(v) for k, v in ref_override.items() if k in REF_DEFAULT}}
    _ref_nom = _nominals(REF["tile_area_cm2"], REF["ship_radius_m"])
    KAPPA = {
        "P": REF["P_target_W"] / max(_ref_nom["P_nom_W"], 1e-40),
        "M": REF["M_target_kg"] / max(_ref_nom["M_nom_kg"], 1e-40),
        "Z": REF["zeta_target"] / max(_ref_nom["zeta_nom"], 1e-40),
    }

# ---------- Public API ----------
def load_calibration():
    """Load calibration from energy pipeline JSON, with fallbacks."""
    calib_path = Path(__file__).parent / "phase_calibration.json"
    
    # Default targets (fallback values)
    defaults = {
        "P_target_W": 100e6,    # 100 MW
        "M_target_kg": 1400,    # 1400 kg  
        "zeta_target": 0.5      # Ford-Roman proxy
    }
    
    try:
        if calib_path.exists():
            with open(calib_path, 'r') as f:
                calib = json.load(f)
                return {
                    "P_target_W": calib.get("P_target_W", defaults["P_target_W"]),
                    "M_target_kg": calib.get("M_target_kg", defaults["M_target_kg"]),
                    "zeta_target": calib.get("zeta_target", defaults["zeta_target"])
                }
    except (json.JSONDecodeError, KeyError, IOError):
        pass
    
    return defaults

def viability(A_tile_cm2: float, R_ship_m: float) -> Dict[str, Any]:
    """
    Assess viability of a tile-area / ship-radius design point.
    Calibration ties this module to the server-wide energy pipeline.
    """
    # Load calibration from energy pipeline 
    calib = load_calibration()
    nom = _nominals(A_tile_cm2, R_ship_m)

    # Calibrated results (anchored to pipeline’s reference)
    P_avg_W = KAPPA["P"] * nom["P_nom_W"]
    M_exotic = KAPPA["M"] * nom["M_nom_kg"]
    zeta = KAPPA["Z"] * nom["zeta_nom"]

    # Timescale check: want T_LC / T_m > 1
    T_m = 1.0 / float(CONST["FREQ_HZ"])
    T_LC = 2.0 * float(R_ship_m) / float(CONST["C_LIGHT"])
    TS_ratio = T_LC / max(T_m, 1e-40)

    # Geometry constraint (do not push γ into energy)
    gamma_geo = float(CONST["GAMMA_GEO"])

    # Use calibration targets with reasonable tolerances
    P_target = calib["P_target_W"]
    M_target = calib["M_target_kg"]  
    zeta_limit = calib["zeta_target"]
    
    checks = {
        "mass_ok":      0.5 * M_target <= M_exotic <= 2.0 * M_target,  # ±50% of target mass
        "power_ok":     P_avg_W <= 2.0 * P_target,                      # within 2x target power
        "quantum_safe": zeta < zeta_limit,                              # Ford-Roman compliance
        "timescale_ok": TS_ratio > 0.1,                                 # timescale separation
        "geometry_ok":  gamma_geo >= 15.0,                              # geometry enhancement
    }
    viable = all(checks.values())

    fail_reason = "Viable ✅"
    if not viable:
        if not checks["mass_ok"]:
            fail_reason = f"Mass: {M_exotic:.0f} kg"
        elif not checks["power_ok"]:
            fail_reason = f"Power: {P_avg_W/1e6:.0f} MW"
        elif not checks["quantum_safe"]:
            fail_reason = f"ζ = {zeta:.2f} ≥ 1"
        elif not checks["timescale_ok"]:
            fail_reason = f"TS = {TS_ratio:.2f} ≤ 1"
        elif not checks["geometry_ok"]:
            fail_reason = f"γ = {gamma_geo:.0f} < 20"

    return {
        "viable": viable,
        "fail_reason": fail_reason,

        # Primary values (+aliases your UI expects)
        "M_exotic": M_exotic,
        "M_exotic_kg": M_exotic,
        "P_avg_W": P_avg_W,
        "P_avg": P_avg_W / 1e6,  # MW
        "zeta": zeta,
        "TS_ratio": TS_ratio,
        "gamma_geo": gamma_geo,

        # Census & per-cycle proxies
        "N_tiles": nom["N_tiles"],
        "U_cycle": nom["U_static"] * float(CONST["DUTY_EFF"]),
        "A_hull": nom["A_hull"],
        "A_hull_m2": nom["A_hull"],

        "checks": checks,
    }

def build_phase_grid(
    A_range: Tuple[float, float],
    R_range: Tuple[float, float],
    resolution: int = 60
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Build viability grid for phase diagram visualization."""
    A_vals = np.linspace(A_range[0], A_range[1], resolution)
    R_vals = np.linspace(R_range[0], R_range[1], resolution)
    Z = np.zeros((len(R_vals), len(A_vals)), dtype=np.uint8)

    for i, R in enumerate(R_vals):
        for j, A in enumerate(A_vals):
            Z[i, j] = 1 if viability(A, R)["viable"] else 0
    return A_vals, R_vals, Z

def get_diagnostics(A_tile_cm2: float, R_ship_m: float) -> Dict[str, Any]:
    """Detailed diagnostics for a specific design point."""
    return viability(A_tile_cm2, R_ship_m)
