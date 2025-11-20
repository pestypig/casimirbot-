Alcubierre alignment package

Purpose
- Align this codebase with the canonical general relativity Alcubierre warp metric.
- Provide a reusable rubric, LLM prompts, and validation notes that collaborators can run without prior context.

## Symmetry‚ÄìBoundary Conservation Principle (SBCP)

> Whenever the equations of motion are invariant under an **active continuous symmetry**, there exists a corresponding quantity whose change inside any system boundary equals the flux of that quantity through the boundary.

- In practice: Nat√°rio symmetry (‚àá¬∑Œ≤ = 0) + the drive boundary ‚áí energy/momentum change = ‚àí‚àÆS¬∑dA.
- Server implementation: `server/stress-energy-brick.ts` derives `S` and `‚àá¬∑S`; `netFlux` stays ‚âà0 for a closed hull.
- Client implementation: the **FluxInvariantBadge** in `EnergyFluxPanel` highlights SBCP status; `DriveGuardsPanel` surfaces Nat√°rio/York-time checks.
- Use `FluxInvariantBadge` (or the raw stats it wraps) whenever a new panel or diagnostic needs to assert ‚Äúconservation = symmetry + closed boundary.‚Äù

Canonical reference (ground truth)
- Metric (ADM 3+1 form, lapse alpha = 1):  
  `ds^2 = -c^2 dt^2 + [dx - v_s(t) f(r_s) dt]^2 + dy^2 + dz^2`, where `r_s = sqrt((x - x_s(t))^2 + y^2 + z^2)` and the only non-zero shift component is `beta^x = -v_s f(r_s)`.
- Shape function (smooth top-hat used by NASA Warp Field Mechanics 101):  
  `f(r_s) = [tanh(sigma (r_s + R)) - tanh(sigma (r_s - R))] / [2 tanh(sigma R)]`.  
  Always document parameters `(R, sigma)` and provide `df/dr_s` analytically when possible.
- Expansion scalar (York time for Eulerian observers):  
  `theta = v_s (x_s / r_s) (df/dr_s)`.  
  Single-plane (x, rho) slice must show contraction (`theta < 0`) in front of the bubble and expansion (`theta > 0`) behind. Magnitude grows with thinner walls (larger `sigma`).
- Eulerian energy density:  
  > See: [Ford‚ÄìRoman QI](docs/papers/ford-roman-qi-1995.md) and [Van den Broeck Warp Pocket](docs/papers/vanden-broeck-1999.md).
  `T^{00} = -(1 / 8 pi) (v_s^2 rho^2 / (4 r_s^2)) (df/dr_s)^2`.  
  Distribution is toroidal around the bubble wall with a node on the symmetry axis; thicker walls (smaller `sigma`) reduce the peak magnitude.
- Physical reading from Alcubierre and Lobo: volume elements expand behind and contract in front; stress-energy lives in a torus. Violating classical energy conditions is expected. Natario solutions provide a divergence-free shift (`theta ~ 0`) for cross-checks.
- Quick visual audit: single-plane `theta` must flip sign across the ship, and `T^{00}` must be toroidal with an axial node. If not, suspect a sign, orientation, or observer-frame mismatch.

## Maupertuis duality and the LaplaceñRungeñLenz invariant

### Proof I ó Maupertuis action lock {#proof-maupertuis}

For a shell at fixed specific energy \(E\), Maupertuis's abbreviated action \(S_0 = \int \mathbf{p}\cdot d\mathbf{q}\) is stationary only when the trajectory hugs the Kepler solution. In practice we integrate the instantaneous action rate \(\dot S_0 = \mathbf{p}\cdot\mathbf{v}\) right next to the existing stress-energy tap, store it in the pipeline metadata, and expose it through the shared `LaplaceRungeLenzMeasure.actionRate`. Drive diagnostics (Flux invariant badge, Drive Guards, km-scale ledger) now show the same scalar you would compute analytically when auditing least-action.

### Proof II ó \(w = \sqrt{z}\) conformal bridge {#proof-conformal}

Promote in-plane points to complex values \(z = x + i y\) and apply \(w = \sqrt{z}\). The energy pipeline keeps both the planar sample and its oscillator lift: `oscillatorCoordinate` (the stored \(w\)), `oscillatorVelocity` (\(\dot{w}\)), and the complex energy \(E_c = \tfrac{m}{2} \dot{w}^2 + 4 w^2\). We also stash the residual \(|w^2 - z|\) so UI layers can display a green ìbridge lockedî badge only when the conformal dual really squares back to the sampled configuration point.

### Proof III ó Geometric readout {#proof-geometry}

Mapping \(E_c\) back down produces \(\mathbf{A} = \mathbf{p} \times \mathbf{L} - mk\,\hat{\mathbf{r}}\), the LaplaceñRungeñLenz vector that points to periapsis and whose magnitude equals \(|\mathbf{A}| = mk e\). The helper `computeLaplaceRungeLenz` (mirrored server/client) now returns `{vector, magnitude, eccentricity, periapsisAngle, angularMomentum}` plus the norms used to verify `|A| = mk e`. Energy panels, Drive Guards, Halobank, and the km-scale ledger all surface these numbers so a drift immediately flags a Maupertuis violation or a non-Keplerian perturbation.

When the pipeline keeps \(|\mathbf{A}|\) fixed it is explicitly honoring the same least-action structure this alignment doc enforces for \(T^{00}\) and \(\theta\). If \(\mathbf{A}\) drifts, you either violated the Maupertuis constraint or injected a non-Keplerian potential; the diagnostics will tell you which.
README-ready comparison rubric
- Copy this block into `docs/alignment.md` or the README so reviewers and LLMs can check boxes quickly:

```
## Alcubierre alignment checklist

- [ ] Metric matches `ds^2 = -(1 - v_s^2 f^2) dt^2 - 2 v_s f dt dx + dx^2 + dy^2 + dz^2` (shift `beta^x = -v_s f`, lapse `alpha = 1`).
- [ ] Shape function `f(r_s)` documented with `(R, sigma)` and analytic `df/dr_s`.
- [ ] Expansion scalar `theta = v_s (x_s / r_s) (df/dr_s)` implemented; fore (<0) vs aft (>0) sign test passes.
- [ ] Eulerian energy density `T^{00}` equals canonical form; toroidal distribution with axis node and expected `sigma` trend.
- [ ] Proper-time note: Eulerian observers inside bubble have ~zero acceleration (craft clocks track coordinate time).
- [ ] Horizon marker noted where `v_s^2 f(r_s)^2 = 1` for superluminal speeds.
- [ ] Natario divergence-free shift available as a control and produces `theta ~ 0`.
- [ ] Units statement clarifies whether `G = c = 1`; include conversions if not.
```

LLM / Copilot prompts (drop-in)
- Run these from the repository root to collect YAML artifacts you can commit under `reports/`.

Prompt A - Inventory the Alcubierre pathway
```
You are reviewing this repository to locate any Alcubierre-warp code paths.

TASKS
1) Find files that define a spacetime metric with dx - v_s*f(rs)*dt structure or a shift beta^x = -v_s f(rs).
2) Extract the shape function f(rs), its parameters (R, sigma), and a closed-form df/drs if present.
3) Identify where the York-time/expansion scalar (theta = nabla_mu n^mu) is computed and how.
4) Identify where the Eulerian energy density T^00 is computed and how.

OUTPUT (YAML)
metric_paths: [ list of file:line where metric is built ]
shift_definition: {file, line, expression}
shape_function: {file, line, f(rs) as text, params: {R:.., sigma:..}, df/drs: "analytic"|"numeric"|"missing"}
theta_definition: {file, line, expression or "missing"}
T00_definition: {file, line, expression or "missing"}
coords: {motion_axis: x|y|z, slice: "x-rho"|"x-y"|...}
units: {uses_G_equals_c_equals_1: true|false|unknown}
notes: "...short freeform notes..."
```

Prompt B - Symbolic cross-check against canonical targets
```
CANONICAL_TARGETS
- Metric: ds^2 = -c^2 dt^2 + [dx - v_s f(rs) dt]^2 + dy^2 + dz^2  (NASA Eq. 1; Alcubierre 1994)
- York time: theta = v_s * (x_s/rs) * df/drs                     (NASA Eq. 2; Fig. 1)
- Energy density: T^00 = -(1/8pi) * (v_s^2 * rho^2 / (4 rs^2)) * (df/drs)^2 (NASA Eq. 3; Fig. 2)

CHECKS
A) Do our expressions symbolically simplify to the targets (up to variable names and sign conventions)?
B) In our single-plane theta plot: fore region (direction of motion) must be <0, aft region >0.
C) In our T^00 plot: toroidal distribution with node on axis; peak decreases as sigma decreases.

OUTPUT (YAML)
symbolic_match: {metric: true|false, theta: true|false, T00: true|false}
sign_test_theta: {fore_negative: true|false, aft_positive: true|false}
topology_T00: {toroidal: true|false, axis_node: true|false}
sigma_trend: {theta_magnitude_increases_with_sigma: true|false, T00_peak_decreases_with_sigma: true|false}
mismatches: [ "brief bullet per mismatch with file:line" ]
```

Prompt C - Generate theta and T^00 slices (x, rho plane)
```
Produce code (in the dominant language of this repo) that:
1) Imports our f(rs) and df/drs.
2) Constructs theta(x, rho) and T00(x, rho) for given (R, sigma, v_s) with z = 0 and rho = |y|.
3) Plots two heatmaps: theta and T00, with axis labels and motion axis annotated.
4) Marks fore/aft signs on theta and highlights the toroidal ring for T00.

Use internal helpers if available; otherwise wrap our implementations in a small adapter.
```

Prompt D - Natario zero-expansion control
```
Add an alternative shift beta with divergence zero (Natario warp) while keeping the same f(rs).
Compute theta for that metric and confirm ~0 everywhere (numerical tolerance).
Report {max |theta| on grid} and show a panel comparing Alcubierre theta vs Natario theta.
Reference: Natario, "Warp Drive With Zero Expansion" (CQG 19, 2002).
```

Prompt E - YAML summary for papers or supplements
```
Emit a YAML block summarizing:
- Parameters used (R, sigma, v_s, grid, units)
- Derived formulas (theta, T^00) as strings
- Figure paths for theta and T^00 panels
- Deviations from canonical targets and explanations (gauge, lapse, observer frame, etc.)
```

Prompt F - "Alcubierre Repo File-Structure & Theory Alignment Report"
```
ROLE
You are auditing THIS repository (read-only) to map the file structure that implements, documents, or visualizes an Alcubierre warp metric. Produce a structured report to compare this repo's methods to the canonical theory and verify that parameters are derived correctly from first principles.

CONSTRAINTS
- Do not run code, install packages, or modify files.
- Work from the files present in the repo and its subfolders.
- If notebooks (.ipynb) exist, parse their code cells and markdown.
- Ignore large data/binaries: node_modules, .git, .venv, dist, build, images/*.png, etc.

CANONICAL TARGETS (for alignment)
Use these to recognize and cross-check implementations (allow for variable renamings and sign/gauge conventions):
1) Metric (Alcubierre, alpha = 1, shift-only form):
   ds^2 = -c^2 dt^2 + [dx - v_s f(r_s) dt]^2 + dy^2 + dz^2,
   r_s = sqrt((x - x_s(t))^2 + y^2 + z^2), beta^x = - v_s f(r_s), alpha = 1.
   (Equivalent expanded form: ds^2 = -(1 - v_s^2 f^2) dt^2 - 2 v_s f dt dx + dx^2 + dy^2 + dz^2)
2) Shape function (typical smooth top-hat):
   f(r_s) = [tanh(sigma (r_s + R)) - tanh(sigma (r_s - R))] / [2 tanh(sigma R)]
   (Other profiles allowed; the key is R (radius), sigma (wall thickness), and df/dr_s availability.)
3) Expansion/York-time scalar for Eulerian observers (canonical gauge):
   theta = nabla_mu n^mu = v_s * d f / d x = v_s * ((x - x_s)/r_s) * (df/dr_s)
   (Sign convention may vary; expect theta < 0 ahead, theta > 0 behind for +x motion.)
4) Eulerian energy density (toroidal around the wall; negative in canonical presentation):
   T^{00} proportional to - v_s^2 * (rho^2 / r_s^2) * (df/dr_s)^2 with rho = sqrt(y^2 + z^2)
   (Constant factors vary by units; topology and scaling are the important checks.)

WHAT TO FIND (file-structure first, then formulas)
A) File/Folder Map (only files relevant to metric/GR/visualization/tests):
   - Source code by language (for example Python/Julia/Mathematica/C++/Fortran): paths and brief roles
   - Notebooks (*.ipynb) relevant to Alcubierre: paths and main sections
   - Symbolics and GR libs (sympy, einsteinpy, xTensor, GRTensor, etc.)
   - Visualization scripts (matplotlib/plotly/VTK): file paths and plotting functions
   - Tests/CI config touching GR, theta, T^{00}, metric, or shape function
   - Docs: README, papers, LaTeX, and markdown that define equations or parameters

B) Canonical Concepts -> Where they live in the repo:
   - Metric construction (g_{mu nu}, line element, or shift/lapse variables)
   - Definition of r_s, x_s(t), and motion axis (x or z)
   - Shape function f(r_s), its parameters (R, sigma), df/dr_s (analytic vs numeric)
   - theta implementation (divergence of n, trace of extrinsic curvature K, or explicit v_s df/dx)
   - T^{00} (observer choice, sign, topology expectations)
   - Units and conventions (G=c=1? sign of K vs theta? index/signature -,+,+,+ or +,-,-,-)

C) Plots and Outputs:
   - Single-plane theta slice (x-rho or x-y): path and code lines
   - T^{00} slice: path and code lines
   - Parameters used in figures (R, sigma, v_s, grid extents)
   - Axis labels/orientation (confirm where "fore" and "aft" are)

D) Derivation Integrity (ground-up checks):
   - From r_s -> f(r_s) -> df/dr_s -> theta and T^{00}: do files derive these in order?
   - Any hard-coded values vs parameterized configs?
   - Any alternative frameworks present (Natario zero-expansion, positive-energy variants)? Where?

E) Red Flags (call out with file:line):
   - theta sign flipped relative to stated direction of motion without explanation
   - T^{00} not toroidal or missing axis node when expected
   - Mismatch between documentation and implementation (units, symbols, axes)
   - Use of lapse alpha != 1 or non-Eulerian observers without documenting consequences

SEARCH HEURISTICS (keywords/regex to locate relevant files quickly)
- "Alcubierre" | "warp" | "r_s" | "rs" | "x_s(" | "xs(" | "shape function"
- "tanh" AND ("sigma"|"R") AND ("radius"|"wall")
- "beta" OR "shift" OR "lapse" OR "alpha" OR "ADM" OR "BSSN"
- "K" AND ("trace"|"extrinsic"|"York"|"theta"|"expansion")
- "T00" OR "T^{00}" OR "energy density" OR "Eulerian"
- "rho" OR "sqrt(y**2 + z**2)" OR "sqrt(y^2+z^2)"
- "matplotlib"|"plotly"|"heatmap"|"surface"|"x-rho"|"x-r"|"x-y" labels
- "pytest"|"unittest"|"@test" near the above symbols

OUTPUT FORMAT
Emit TWO parts:

1) RELEVANT_FILE_STRUCTURE (tree + short roles)
   - Show a pruned directory tree of only folders/files implicated above.
   - For each listed file, give a one-line role summary.

2) ALIGNMENT_REPORT (YAML)
   repo_overview:
     languages: [ ... ]
     gr_libraries: [ ... ]
     plotting: [ ... ]
   canonical_mappings:
     metric: {file: "...", line: N, form: "shift|line_element|tensor", motion_axis: "x|z", signature: "-,+,+,+"}
     r_s: {file: "...", line: N, expr: "sqrt((x - x_s(t))^2 + y^2 + z^2)"}
     shape_function: {file: "...", line: N, expr: "...", params: {R: "...", sigma: "..."}, df_dr_s: "analytic|numeric|missing"}
     theta: {file: "...", line: N, expr: "...", note: "expects v_s*((x-x_s)/r_s)*df/dr_s up to sign"}
     T00: {file: "...", line: N, expr: "...", topology: "toroidal|other"}
     units: {G_eq_c_eq_1: true|false|unknown}
     observers_frame: "Eulerian|other"
   plotting_panels:
     theta_slice: {file: "...", function: "...", plane: "x-rho|x-y", fore_aft_labels: true|false}
     T00_slice: {file: "...", function: "...", torus_node_on_axis: true|false}
     params_used: {R: ..., sigma: ..., v_s: ..., grid: "..."}
   derivation_chain:
     order_present: ["r_s","f","df/dr_s","theta","T00"]
     hard_coded_constants: [ ... ]
     parameter_files: [ ... ]
   alternatives_present:
     natario_zero_expansion: {present: true|false, files: [ ... ]}
     other_variants: [ "positive-energy", ... ]
   red_flags:
     - {file: "...", line: N, issue: "theta sign opposite to doc", severity: "high|med|low"}
     - {file: "...", line: N, issue: "T00 not toroidal", severity: "..."}
   confidence: "high|med|low"
   notes: "brief freeform justifications; do not include internal chain-of-thought"
```

Tips
- Paste this prompt into Copilot or Codex from the repo root when you need a consolidated audit.
- If the response is too large, constrain the model to specific subdirectories (for example `src/`, `docs/`, `tests/`).
- Store the resulting tree under `reports/relevant_file_structure.txt` and the YAML under `reports/alcubierre_alignment.yaml` for repeatable comparisons.

Unit-test harness (optional but recommended)
- Drop the following template into `tests/test_alcubierre_consistency.py` (fill in imports from your implementation).  
  The assertions match NASA Warp Field Mechanics 101 Figures 1-2.

```python
import numpy as np

from modules.dynamic.alcubierre import theta_slice, energy_density_slice

VS = 0.5
RADIUS = 10.0
SIGMA_THIN = 2.0
SIGMA_THICK = 0.5


def test_theta_sign_and_symmetry():
    xs = 0.0
    rho_axis = np.linspace(0.0, 8.0, 64)
    theta_fore = theta_slice(x=xs + 4.0, rho=0.0, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)
    theta_aft = theta_slice(x=xs - 4.0, rho=0.0, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)
    assert theta_fore < 0.0
    assert theta_aft > 0.0
    for rho in rho_axis:
        assert abs(theta_slice(x=xs, rho=rho, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)) < 1e-6


def test_energy_density_toroidal_profile():
    xs = 0.0
    rho_wall = RADIUS
    t00_axis = energy_density_slice(x=xs, rho=0.0, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)
    t00_wall = energy_density_slice(x=xs, rho=rho_wall, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)
    assert abs(t00_axis) < 1e-9
    assert t00_wall < t00_axis  # negative energy magnitude larger in the wall
    t00_far = energy_density_slice(x=xs, rho=3 * RADIUS, v_s=VS, R=RADIUS, sigma=SIGMA_THIN)
    assert abs(t00_far) < abs(t00_wall)


def test_sigma_trend_matches_nasa_figures():
    xs = 0.0
    theta_thin = abs(theta_slice(x=xs + RADIUS, rho=0.0, v_s=VS, R=RADIUS, sigma=SIGMA_THIN))
    theta_thick = abs(theta_slice(x=xs + RADIUS, rho=0.0, v_s=VS, R=RADIUS, sigma=SIGMA_THICK))
    assert theta_thin > theta_thick
    t00_thin = abs(energy_density_slice(x=xs, rho=RADIUS, v_s=VS, R=RADIUS, sigma=SIGMA_THIN))
    t00_thick = abs(energy_density_slice(x=xs, rho=RADIUS, v_s=VS, R=RADIUS, sigma=SIGMA_THICK))
    assert t00_thick < t00_thin
```

Optional cross-checks for write-ups
- Horizon markers: solve `v_s^2 f(r_s)^2 = 1` and annotate the pseudo-horizon on `theta` and `T^{00}` panels.
- Energy-condition note: document the negative sign of `T^{00}` (violates the weak energy condition) with a reference to Pfenning and Ford (1997).
- Figure alignment: if you rotate axes, explicitly say how your plots map to Alcubierre and Lobo Figure 1.

Source references (stable links)
- Alcubierre (1994), Class. Quantum Grav. 11 L73-77. `https://www.if.ufrj.br/~mbr/warp/alcubierre/cq940501.pdf`
- Alcubierre and Lobo, "Warp drive basics," in *Wormholes, Warp Drives and Energy Conditions* (2017). `https://ar5iv.org/pdf/2103.05610`
- NASA "Warp Field Mechanics 101" deck (2011) - equations and panels for metric, theta, and T^{00}.
- Natario, "Warp Drive With Zero Expansion," Class. Quantum Grav. 19 (2002) 1157. `https://arxiv.org/abs/gr-qc/0110086`
- Pfenning and Ford, "The unphysical nature of 'Warp Drive'" (1997). `https://arxiv.org/abs/gr-qc/9702026`
- Positive-energy variants (for comparison only): Lentz, "Hyper-Fast Positive Energy Warp Drives" (2021). `https://arxiv.org/abs/2201.00652`

Implementation notes
- Store YAML outputs from the prompts under `reports/` (for example `reports/alcubierre_alignment.yaml`) so changes can be tracked in CI.
- When using these prompts with Copilot or ChatGPT, paste the exact block; the structured YAML makes comparisons and diffs straightforward.
- Document any gauge or lapse deviations up front so reviewers can understand legitimate departures from the canonical solution.

