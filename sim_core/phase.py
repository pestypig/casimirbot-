"""
Phase diagram calculations for warp bubble viability analysis.
Shows design space regions where mass, power, quantum safety, and geometry constraints are satisfied.
"""

import numpy as np
from typing import Dict, Tuple, Any

# Import existing constants to maintain consistency
# Note: Update these imports based on your actual constants structure
CONST = {
    "HBARC": 1.973e-25,  # ℏc in J⋅m
    "GAMMA_GEO": 25,     # Geometric amplification factor  
    "Q_FACTOR": 1e9,     # Quality factor
    "DUTY_EFF": 2.5e-5,  # Effective duty cycle (sector strobing)
    "PEAK_POWER": 2.0e15, # Peak lattice power (W)
    "ZETA_COEF": 1.0,    # Quantum inequality coefficient
    "PULSE_LEN": 10e-6,  # Pulse length (s)
    "C_LIGHT": 2.998e8,  # Speed of light (m/s)
    "G": 6.674e-11,      # Gravitational constant (m³/kg⋅s²)
}

def viability(A_tile_cm2: float, R_ship_m: float) -> Dict[str, Any]:
    """
    Assess viability of a tile-area / ship-radius design point.
    
    Args:
        A_tile_cm2: Tile area in cm²
        R_ship_m: Ship radius in meters
        
    Returns:
        Dictionary containing viability assessment and diagnostic values
    """
    
    # Convert units
    A_tile = A_tile_cm2 * 1e-4  # cm² to m²
    R_ship = R_ship_m
    
    # Calculate number of tiles on spherical hull
    A_hull = 4 * np.pi * R_ship**2  # Hull surface area (m²)
    N_tiles = A_hull / A_tile  # Total tile count
    
    # 1. Static Casimir energy per tile (40 μm concave geometry)
    gap = 1e-9  # 1 nm vacuum gap
    U_static = -CONST["HBARC"] * np.pi**2 / (240 * gap**3) * A_tile  # Base Casimir energy
    
    # 2. Geometric amplification (Van den Broeck factor)
    gamma_geo = CONST["GAMMA_GEO"]
    U_geo_raw = U_static * gamma_geo**3
    
    # 3. Q-factor amplification  
    Q = CONST["Q_FACTOR"]
    U_Q = U_geo_raw * Q
    
    # 4. Duty cycle averaging
    d = 0.01  # 1% mechanical duty cycle
    U_cycle = U_Q * d
    
    # 5. Total exotic mass (thin-shell formula)
    delta_wall = 1e-3  # 1 mm wall thickness
    M_exotic = A_hull / (8 * np.pi * CONST["G"] * delta_wall)
    
    # 6. Average power consumption
    omega = 2 * np.pi * 15e9  # 15 GHz modulation frequency
    P_loss_per_tile = abs(U_geo_raw * omega / Q)  # Power loss per tile
    P_avg = P_loss_per_tile * N_tiles * CONST["DUTY_EFF"]  # Average lattice power
    
    # 7. Quantum inequality check (ζ < 1 for safety)
    tau_pulse = CONST["PULSE_LEN"]
    zeta = abs(U_cycle) * tau_pulse / CONST["HBARC"]  # Quantum inequality parameter
    
    # 8. Time-scale separation
    T_m = 1 / (15e9)  # Mechanical period
    T_LC = 2 * R_ship / CONST["C_LIGHT"]  # Light crossing time
    TS_ratio = T_m / T_LC
    
    # Viability checks
    checks = {
        "mass_ok": 1000 <= M_exotic <= 2000,  # Target range around 1400 kg
        "power_ok": P_avg <= 100e6,           # Under 100 MW
        "quantum_safe": zeta < 1.0,           # Quantum inequality satisfied
        "timescale_ok": TS_ratio < 1.0,       # Proper time-scale separation
        "geometry_ok": gamma_geo >= 20        # Sufficient geometric amplification
    }
    
    # Overall viability
    viable = all(checks.values())
    
    # Failure reason (first constraint that fails)
    fail_reason = "Viable ✅"
    if not viable:
        if not checks["mass_ok"]:
            fail_reason = f"Mass: {M_exotic:.0f} kg"
        elif not checks["power_ok"]:
            fail_reason = f"Power: {P_avg/1e6:.0f} MW"
        elif not checks["quantum_safe"]:
            fail_reason = f"ζ = {zeta:.2f} > 1"
        elif not checks["timescale_ok"]:
            fail_reason = f"TS = {TS_ratio:.2f} > 1"
        elif not checks["geometry_ok"]:
            fail_reason = f"γ = {gamma_geo} < 20"
    
    return {
        "viable": viable,
        "fail_reason": fail_reason,
        "M_exotic": M_exotic,
        "P_avg": P_avg,
        "zeta": zeta,
        "TS_ratio": TS_ratio,
        "gamma_geo": gamma_geo,
        "N_tiles": N_tiles,
        "U_cycle": U_cycle,
        "A_hull": A_hull,
        "checks": checks
    }

def build_phase_grid(A_range: Tuple[float, float], R_range: Tuple[float, float], 
                    resolution: int = 60) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Build viability grid for phase diagram visualization.
    
    Args:
        A_range: (min, max) tile area in cm²
        R_range: (min, max) ship radius in meters  
        resolution: Grid resolution (points per axis)
        
    Returns:
        A_vals, R_vals, Z where Z[i,j] = 1 for viable, 0 for non-viable
    """
    
    A_vals = np.linspace(A_range[0], A_range[1], resolution)
    R_vals = np.linspace(R_range[0], R_range[1], resolution)
    Z = np.zeros((len(R_vals), len(A_vals)))
    
    for i, R in enumerate(R_vals):
        for j, A in enumerate(A_vals):
            result = viability(A, R)
            Z[i, j] = 1 if result["viable"] else 0
            
    return A_vals, R_vals, Z

def get_diagnostics(A_tile_cm2: float, R_ship_m: float) -> Dict[str, Any]:
    """Get detailed diagnostics for a specific design point."""
    return viability(A_tile_cm2, R_ship_m)