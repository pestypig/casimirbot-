# TIME DILATION RENDER POLICY

Purpose
- Make TimeDilationLattice rendering deterministic across warp modes and data maturity.
- Separate physics state (GR/certified/proxy/fallback) from visualization choices.

Modes
- alcubierre: directional warp expected; geometry warp may be enabled when inputs are certified.
- natario: volume-preserving expectation; geometry warp may be enabled in strict mode, but theta-driven warp is disabled (theta is diagnostic only).

Data sources
- GR brick: primary diagnostic fields (alpha, theta, beta, gamma, shear).
- Lapse brick: fallback for alpha/clock rate only.
- Analytic proxy: used only when bricks are unavailable; must be labeled PROXY or FALLBACK.

State flags
- hasHull: true only when applied geometry is present and bounds are non-default or explicitly user-chosen; default needle bounds are framing only.
- hasGrBrick: GR evolve brick is available.
- grCertified: GR guardrails are non-proxy and sourced from pipeline GR.
- wallDetected: true when curvature invariants detect a bubble wall; if false, treat as NO_HULL for geometry warp gating.
- anyProxy: any proxy inputs or guardrail proxy is present.
- mathStageOK: required modules meet minimum math maturity stage.

Visual layers
- Geometry warp: beta-advection and theta radial warp (only when Alcubierre + certified GR).
- Theta radial warp: part of geometry warp; disabled for Natario canonical display.
- Color: clockRate (alpha or g_tt) and theta tint when available.
- Overlays: constraints and region grid are optional and do not change the core plan.
- Warp cap: cell-size-limited displacement cap sourced from RenderPlan.

Hard rules
- No hull -> banner `NO_HULL / MINKOWSKI`, geometry warp disabled, neutral grid.
- Wall not detected (invariants) -> banner `NO_HULL / MINKOWSKI`, geometry warp disabled, neutral grid.
- Natario mode -> geometry warp disabled.
- Geometry warp requires Alcubierre + hasHull + GR brick + mathStageOK + grCertified + no proxy.
- GR missing while requested -> banner WAITING_GR, no geometry warp.

Soft rules
- When GR is unavailable, use lapse brick for alpha/clock rate if present; otherwise analytic proxy.
- Proxy inputs -> banner PROXY, normalization switches to proxy or off as appropriate.
- Fallback state (GR disabled) -> banner FALLBACK and no geometry warp.

Visualization scalers
- betaWarpWeight, thetaWarpWeight, geomWarpScale, and normalization targets are visualization scalers, not physical coefficients.

RenderPlan contract
- All rendering decisions (data sources, warp weights, normalization, banners) come from RenderPlan.
- UI must print RenderPlan summary + reasons in debug mode.
