"""
Interactive phase diagram tab for warp bubble design space exploration.
Shows viability regions for tile area vs ship radius combinations.
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from sim_core.phase import build_phase_grid, get_diagnostics

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
            help="Surface area of each Casimir tile"
        )
        
        ship_radius = st.slider(
            "Ship Radius (m)", 
            min_value=1.0, 
            max_value=50.0, 
            value=5.0, 
            step=0.5,
            help="Radius of spherical warp bubble hull"
        )
        
        # Get live diagnostics for current point
        diagnostics = get_diagnostics(tile_area, ship_radius)
        
        st.subheader("Live Diagnostics")
        
        # Status indicators with color coding
        if diagnostics["viable"]:
            st.success("✅ **VIABLE DESIGN**")
            st.success(f"All constraints satisfied")
        else:
            st.error("❌ **FAILS CONSTRAINTS**")
            st.error(f"Issue: {diagnostics['fail_reason']}")
        
        # Detailed metrics
        st.markdown("**Key Metrics:**")
        
        # Exotic mass
        mass_color = "green" if diagnostics["checks"]["mass_ok"] else "red"
        st.markdown(f"**Exotic Mass:** :{mass_color}[{diagnostics['M_exotic']:.0f} kg]")
        
        # Power consumption
        power_color = "green" if diagnostics["checks"]["power_ok"] else "red"
        st.markdown(f"**Avg Power:** :{power_color}[{diagnostics['P_avg']/1e6:.1f} MW]")
        
        # Quantum safety
        zeta_color = "green" if diagnostics["checks"]["quantum_safe"] else "red"
        st.markdown(f"**Quantum ζ:** :{zeta_color}[{diagnostics['zeta']:.3f}]")
        
        # Time-scale separation
        ts_color = "green" if diagnostics["checks"]["timescale_ok"] else "red"
        st.markdown(f"**TS Ratio:** :{ts_color}[{diagnostics['TS_ratio']:.3f}]")
        
        # Additional info
        st.markdown("**System Scale:**")
        st.markdown(f"• Total tiles: {diagnostics['N_tiles']:.2e}")
        st.markdown(f"• Hull area: {diagnostics['A_hull']:.1f} m²")
        st.markdown(f"• Energy/tile: {diagnostics['U_cycle']:.2e} J")
    
    with col2:
        st.subheader("Viability Phase Space")
        
        # Create heatmap
        fig = go.Figure(data=go.Heatmap(
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
            customdata=[["Fails" if z == 0 else "Viable ✅" for z in row] for row in Z]
        ))
        
        # Add current point marker
        fig.add_trace(go.Scatter(
            x=[tile_area],
            y=[ship_radius],
            mode='markers',
            marker=dict(
                size=15,
                color='yellow',
                symbol='circle',
                line=dict(width=3, color='black')
            ),
            name='Current Point',
            hovertemplate=(
                f"<b>Current Design</b><br>"
                f"Tile area: {tile_area} cm²<br>"
                f"Ship radius: {ship_radius} m<br>"
                f"Status: {diagnostics['fail_reason']}<extra></extra>"
            )
        ))
        
        # Layout styling
        fig.update_layout(
            title="Design Space Viability Map",
            xaxis_title="Tile Area (cm²)",
            yaxis_title="Ship Radius (m)",
            width=700,
            height=500,
            showlegend=False
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Legend and explanation
        st.markdown("""
        **🟦 Teal regions:** Viable designs meeting all constraints  
        **🟥 Red regions:** Designs failing one or more constraints  
        **🟡 Yellow dot:** Your current parameter selection  
        
        **Constraints checked:**
        - Exotic mass: 1000-2000 kg range
        - Power consumption: < 100 MW  
        - Quantum safety: ζ < 1.0
        - Time-scale separation: < 1.0
        - Geometric amplification: γ ≥ 20
        """)
    
    # Export functionality
    st.subheader("📊 Export & Analysis")
    
    col3, col4 = st.columns(2)
    
    with col3:
        if st.button("📈 Export Phase Data"):
            # Create exportable data
            viable_count = np.sum(Z)
            total_points = Z.size
            viable_fraction = viable_count / total_points
            
            export_data = {
                "current_design": {
                    "tile_area_cm2": tile_area,
                    "ship_radius_m": ship_radius,
                    "viable": diagnostics["viable"],
                    "exotic_mass_kg": diagnostics["M_exotic"],
                    "power_MW": diagnostics["P_avg"] / 1e6,
                    "quantum_zeta": diagnostics["zeta"]
                },
                "phase_space_summary": {
                    "viable_designs": f"{viable_count}/{total_points}",
                    "viable_fraction": f"{viable_fraction:.1%}",
                    "parameter_ranges": {
                        "tile_area_range_cm2": [A_vals[0], A_vals[-1]],
                        "ship_radius_range_m": [R_vals[0], R_vals[-1]]
                    }
                }
            }
            
            st.json(export_data)
    
    with col4:
        if st.button("🧪 Quick Test Points"):
            st.markdown("**Test validation:**")
            
            # Test point 1: Should fail (high power)
            test1 = get_diagnostics(100, 30)
            status1 = "✅ PASS" if not test1["viable"] else "❌ FAIL"
            st.markdown(f"• 100 cm², 30m → {status1} (expect fail)")
            
            # Test point 2: Should pass (viable region)
            test2 = get_diagnostics(2500, 5)
            status2 = "✅ PASS" if test2["viable"] else "❌ FAIL"  
            st.markdown(f"• 2500 cm², 5m → {status2} (expect pass)")
            
            if test1["viable"] or not test2["viable"]:
                st.error("⚠️ Validation failed - check constraint logic")
            else:
                st.success("✅ Validation passed - constraints working correctly")

if __name__ == "__main__":
    app()