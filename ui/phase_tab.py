"""
Interactive phase diagram tab for warp bubble design space exploration.
Shows viability regions for tile area vs ship radius combinations.
"""

import streamlit as st
import plotly.graph_objects as go
import numpy as np
from sim_core.phase import build_phase_grid, get_diagnostics

# ---------- helpers ----------
def pick(d: dict, *keys, default=None):
    """Return the first present, non-None key from dict d."""
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default

def to_number(x):
    """Accept numbers or numeric strings."""
    if isinstance(x, (int, float)) and np.isfinite(x):
        return float(x)
    if isinstance(x, str):
        try:
            v = float(x.strip())
            return v if np.isfinite(v) else None
        except Exception:
            return None
    return None

def fmt_int(x):  # pretty integer or scientific fallback
    v = to_number(x)
    if v is None:
        return "—"
    try:
        return f"{int(round(v)):,}"
    except Exception:
        return f"{v:.2e}"

def mw_from_any(power):
    """Normalize average power to MW whether given as W or MW."""
    v = to_number(power)
    if v is None:
        return None
    # Heuristic: treat large numbers as W (>=10k W), else as MW
    return v / 1e6 if v >= 1e4 else v

def yes_no_color(ok: bool) -> str:
    return "green" if ok else "red"

@st.cache_data(max_entries=2, show_spinner=False)
def cached_grid_build():
    """Cache the viability grid to avoid recomputation."""
    return build_phase_grid(A_range=(50, 5000), R_range=(1, 50), resolution=60)

def app():
    """Main phase diagram tab application."""

    st.header("🌌 Warp Bubble Phase Diagram")
    st.markdown("**Interactive design space explorer** showing viable tile-area vs ship-radius combinations")

    # Build cached viability grid
    A_vals, R_vals, Z = cached_grid_build()

    # Create two columns for controls and plot
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Design Parameters")

        # Interactive sliders
        tile_area = st.slider(
            "Tile Area (cm²)",
            min_value=50,
            max_value=5000,
            value=2500,
            step=50,
            help="Surface area of each Casimir tile",
        )

        ship_radius = st.slider(
            "Ship Radius (m)",
            min_value=1.0,
            max_value=50.0,
            value=5.0,
            step=0.5,
            help="Radius of spherical warp bubble hull",
        )

        # Get live diagnostics for current point
        diagnostics = get_diagnostics(tile_area, ship_radius) or {}

        # Normalize/robust fields
        viable = bool(diagnostics.get("viable", False))
        fail_reason = pick(diagnostics, "fail_reason", "reason", "status", default="Viable ✅")

        checks = diagnostics.get("checks") or {}
        mass_ok = bool(checks.get("mass_ok", True if viable else False))
        power_ok = bool(checks.get("power_ok", True if viable else False))
        quantum_ok = bool(checks.get("quantum_safe", True if viable else False))
        timescale_ok = bool(checks.get("timescale_ok", True if viable else False))

        M_exotic = pick(diagnostics, "M_exotic", "M_exotic_kg", "exoticMass_kg", "exotic_mass_kg")
        P_any = pick(diagnostics, "P_avg_W", "P_avg", "power_W", "power_MW")
        P_MW = mw_from_any(P_any)
        zeta = pick(diagnostics, "zeta", "ζ", "zeta_qi")
        TS_ratio = pick(diagnostics, "TS_ratio", "TS", "timescale_ratio")
        N_tiles = pick(diagnostics, "N_tiles", "tiles_total", "N")
        A_hull = pick(diagnostics, "A_hull", "A_hull_m2", "hull_area_m2")
        U_cycle = pick(diagnostics, "U_cycle", "E_cycle", "energy_per_cycle_J")

        st.subheader("Live Diagnostics")

        # Status indicators
        if viable:
            st.success("✅ **VIABLE DESIGN**")
            st.success("All constraints satisfied")
        else:
            st.error("❌ **FAILS CONSTRAINTS**")
            st.error(f"Issue: {fail_reason}")

        # Detailed metrics
        st.markdown("**Key Metrics:**")

        st.markdown(f"**Exotic Mass:** :{yes_no_color(mass_ok)}[{fmt_int(M_exotic)} kg]")

        if P_MW is None:
            st.markdown("**Avg Power:** —")
        else:
            st.markdown(f"**Avg Power:** :{yes_no_color(power_ok)}[{P_MW:.1f} MW]")

        if zeta is None:
            st.markdown("**Quantum ζ:** —")
        else:
            zc = yes_no_color(quantum_ok)
            st.markdown(f"**Quantum ζ:** :{zc}[{float(zeta):.3f}]")

        if TS_ratio is None:
            st.markdown("**TS Ratio:** —")
        else:
            tc = yes_no_color(timescale_ok)
            st.markdown(f"**TS Ratio:** :{tc}[{float(TS_ratio):.3f}]")

        st.markdown("**System Scale:**")
        st.markdown(f"• Total tiles: {fmt_int(N_tiles) if N_tiles is not None else '—'}")
        st.markdown(f"• Hull area: {float(A_hull):.1f} m²" if A_hull is not None else "• Hull area: —")
        st.markdown(f"• Energy/tile: {float(U_cycle):.2e} J" if U_cycle is not None else "• Energy/tile: —")

    with col2:
        st.subheader("Viability Phase Space")

        # Build human labels array for hover
        status_labels = np.where(np.array(Z) == 0, "Fails", "Viable ✅")
        fig = go.Figure(
            data=go.Heatmap(
                x=A_vals,
                y=R_vals,
                z=Z,
                colorscale=[[0, "red"], [1, "teal"]],
                showscale=False,
                hovertemplate=(
                    "Tile area: %{x:.0f} cm²<br>"
                    "Ship radius: %{y:.1f} m<br>"
                    "<b>Status: %{customdata}</b><extra></extra>"
                ),
                customdata=status_labels,
            )
        )

        # Add current point marker
        current_status = "Viable ✅" if viable else f"Fails — {fail_reason}"
        fig.add_trace(
            go.Scatter(
                x=[tile_area],
                y=[ship_radius],
                mode="markers",
                marker=dict(size=15, color="yellow", symbol="circle", line=dict(width=3, color="black")),
                name="Current Point",
                hovertemplate=(
                    "<b>Current Design</b><br>"
                    f"Tile area: {tile_area} cm²<br>"
                    f"Ship radius: {ship_radius} m<br>"
                    f"Status: {current_status}<extra></extra>"
                ),
            )
        )

        fig.update_layout(
            title="Design Space Viability Map",
            xaxis_title="Tile Area (cm²)",
            yaxis_title="Ship Radius (m)",
            height=500,
            showlegend=False,
            margin=dict(l=50, r=20, t=40, b=50),
        )

        st.plotly_chart(fig, use_container_width=True)

        # Legend and explanation
        st.markdown(
            """
        **🟦 Teal regions:** Viable designs meeting all constraints  
        **🟥 Red regions:** Designs failing one or more constraints  
        **🟡 Yellow dot:** Your current parameter selection  

        **Constraints checked (typical):**
        - Exotic mass: 1000–2000 kg target band
        - Power consumption: < 100 MW
        - Quantum safety: ζ < 1.0
        - Time-scale separation: **> 1.0**
        - Geometric amplification: γ ≥ 20
        """
        )

    # Export functionality
    st.subheader("📊 Export & Analysis")

    col3, col4 = st.columns(2)

    with col3:
        if st.button("📈 Export Phase Data"):
            viable_count = int(np.sum(Z))
            total_points = int(np.size(Z))
            viable_fraction = viable_count / total_points if total_points else 0.0

            export_data = {
                "current_design": {
                    "tile_area_cm2": tile_area,
                    "ship_radius_m": ship_radius,
                    "viable": viable,
                    "exotic_mass_kg": to_number(M_exotic),
                    "power_MW": float(P_MW) if P_MW is not None else None,
                    "quantum_zeta": to_number(zeta),
                    "TS_ratio": to_number(TS_ratio),
                },
                "phase_space_summary": {
                    "viable_designs": f"{viable_count}/{total_points}",
                    "viable_fraction": f"{viable_fraction:.1%}",
                    "parameter_ranges": {
                        "tile_area_range_cm2": [A_vals[0], A_vals[-1]],
                        "ship_radius_range_m": [R_vals[0], R_vals[-1]],
                    },
                },
            }

            st.json(export_data)

    with col4:
        if st.button("🧪 Quick Test Points"):
            st.markdown("**Test validation:**")

            # Test point 1: Should fail (e.g., high power)
            test1 = get_diagnostics(100, 30) or {}
            status1 = "✅ PASS" if not test1.get("viable", False) else "❌ FAIL"
            st.markdown(f"• 100 cm², 30 m → {status1} (expect fail)")

            # Test point 2: Should pass (viable region)
            test2 = get_diagnostics(2500, 5) or {}
            status2 = "✅ PASS" if test2.get("viable", False) else "❌ FAIL"
            st.markdown(f"• 2500 cm², 5 m → {status2} (expect pass)")

            if test1.get("viable", False) or not test2.get("viable", False):
                st.error("⚠️ Validation failed — check constraint logic")
            else:
                st.success("✅ Validation passed — constraints working correctly")


if __name__ == "__main__":
    app()
