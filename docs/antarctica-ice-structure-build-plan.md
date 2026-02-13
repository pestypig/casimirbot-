# Antarctica Ice Structure Build-Plan Data Pack (Not Tile Stack)

## Purpose

This note collects first-pass values that drive a hull-structure build plan using Antarctic ice as a structural material (not the Casimir tile stack itself).

Scope:
- Structure and load path are for macroscopic shell members: ribs, spars, frames, compression webs, and service envelopes.
- Material references are for glaciological/freshwater-like ice where available, and are ranges unless explicitly stated.
- All values are engineering inputs for feasibility screening, not design approval.

## 1) Resource and logistics envelope

- Antarctic ice sheet area: ~14 million km².
- Typical thickness: ~2.2 km average, up to ~4.9 km locally (order-miles scale ice stock).
- Practical extraction baseline for structural stockpiles is limited by terrain, shelf dynamics, treaty controls, and infrastructure.
- Ice volume is not the binding issue; transport, freezing stability, machining, and legality are.

## 2) Core property set for structural ice (macroscale)

- Density (ρ): 916–923 kg/m³ between 0°C and −100°C.
- Young’s modulus (E): roughly 4.7–11.2 GPa for polycrystalline glaciological/freshwater ice; strong anisotropy and porosity dependence.
- Poisson’s ratio (ν): around 0.3 (polycrystalline ice approximation).
- Tensile/low-rate failure:
  - Tensile strength often sub-MPa to a few MPa range.
  - Compressive strength often quoted as a few MPa at −5 to −10°C, with some tests reaching ~5 MPa depending on temperature, strain rate, and sample quality.
- Fracture toughness (K_IC): ~100 kPa·m^0.5 is a useful baseline; fresh-water values can be higher in tighter specimens.
- Thermal conductivity (k): ~2.2 W/m·K near 0°C, increasing at lower temperature to the ~2.5–2.8 W/m·K range by about −20 to −40°C.
- Specific heat (c_p): ~2.0–2.1 kJ/kg·K in the cold range.
- Latent heat fusion: ~334 kJ/kg (ice-to-water phase change baseline).

## 3) Creep and time-dependent behavior

- Ice is not purely elastic under long dwell; sustained stress produces creep deformation.
- Glen-style constitutive treatment is usually used for long-term drift:
- ε̇ = A(T) σ^n with n commonly near 3.
- A(T) is strongly temperature dependent; warmer subzero ice creeps much faster.
- For structure-level design, this means:
  - load-duration sensitivity dominates over short-term strength alone;
  - long dwell windows must include explicit creep amplification factors;
  - geometry must be staged to keep sustained principal stress low enough for your mission timeline.

## 4) Structural design implications for a hull made from ice

- Mass advantage is only partial: high density means a rigid support frame is still heavy for meter-scale structure.
- Modulus is low enough relative to steel/ceramics that span lengths become short unless reinforced.
- Fracture behavior is brittle in many cases; defect size and crack control dominate.
  - Use a crack-growth style check: `σ_allow ≈ K_IC / (Y * sqrt(π a))`.
  - Even with clean ice, larger flaws collapse margin quickly.
- Thermal cycling creates:
  - expansion/shrinkage stresses,
  - crack-driving stress during warm campaigns,
  - surface roughening and sintering variability.
- Moisture/phase boundaries can strongly reduce strength by introducing micro-cracks and weak interfaces.

## 5) What this drives in your build plan

This is the practical key list for the plan inputs:
- Geometry mass coupling
  - ρ sets hull structural mass, inertia, support loads, and lift/settling budget.
  - Use real-time sampled density (if you switch from shelf to inland plateau ice) not one scalar.
- Sizing and span design
  - E and ν set rib/frame pitch and local shell geometry limits.
  - If tile-scale panels are to be mounted on an ice frame, panel span must be tied to crack/tension margins above.
- Safety margin and life-cycle
  - Strength and K_IC control defect acceptance.
  - Creep model (A,n) controls hold-time, dwell life, and reload/reseal intervals.
- Thermal envelope
- c_p, k, latent heat and ambient profiles set:
  - refrigeration/containment energy,
  - allowable warm-stop duration,
  - handling temperature windows for welding, cutting, and transport.
- Operational planning
  - Legal clearance and environmental assessment become explicit gating fields in the plan, not engineering afterthoughts.

## 6) Antarctic governance blockers (non-negotiable constraints)

- The Madrid Protocol (Article on environmental protection) prohibits non-scientific mining/resource extraction in Antarctica.
- Any large-scale structural extraction activity would require heavy treaty, environmental, and permitting pathways before any engineering baseline can be considered executable.
- In this project scope, this is a hard gate and should be tracked as “deployment feasibility = prohibited/waived/unclear” from day one.

## 7) Immediate next-value captures (before optimization)

- In situ ice temperature profile across planned extraction band.
- Density and porosity profile at depth.
- Static and long-duration creep coupons at representative stress and thermal ranges.
- Representative flaw map (NDE ultrasonics/CT for major defects).
- Thermal boundary model for seasonal cycle and local logistics window.
- Fracture mapping and proof-grade crack growth dataset for conservative panel spacing.
- Legal path and permit class for each activity sequence.

## References

- NSIDC, Antarctic ice sheet overview. https://nsidc.org/ice-sheets-today/about-project
- NSIDC, Antarctic sea ice/ice-sheets overview. https://nsidc.org/learn/parts-cryosphere/ice-sheets
- Britannica, Antarctic ice sheet. https://www.britannica.com/place/Antarctica
- TMS review snippet summary (ice mechanics ranges), Schulson-related review. https://www.tms.org/pubs/journals/jom/9902/schulson-9902.html
- MDPI/Sea-ice fracture strength summary (strength example context). https://www.mdpi.com/2076-3417/7/5/495
- Physics Today on ice fracturing (fracture toughness context). https://physicstoday.aip.org/features/ice-fracturing
- Engineering Toolbox thermal properties of ice. https://www.engineeringtoolbox.com/ice-thermal-properties-d_576.html
- Antarctic Treaty environmental protection summary (mining prohibition). https://www.ats.aq/e/protocol.html
- Antarctic Treaty / Australia gateway summary on Madrid Protocol, Art. 7. https://www.antarctica.gov.au/about-antarctica/law-and-treaty/the-madrid-protocol/%26lang%3Den
- Britannica on Madrid protocol overview. https://www.britannica.com/place/Antarctica/The-Antarctic-Treaty

