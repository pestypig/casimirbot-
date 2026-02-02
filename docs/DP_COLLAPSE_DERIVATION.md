# DP Collapse Derivation Notes

Purpose
- Document the DP collapse estimator used in this repo: DeltaE from mass-density
  difference, tau = hbar / DeltaE, with explicit units, kernel choice, and
  adapter conversions.
- Keep claims at exploratory / reduced-order level. This is a model-based rate,
  not evidence of physical collapse.

Scope and assumptions
- Weak-field, Newtonian limit with a fixed background.
- Superposed mass-density branches are represented as two 3D fields on a shared
  grid (or analytic primitives sampled onto a grid).
- No claim of full GR superposition of geometries; Penrose-style motivation is
  treated as a heuristic, not a derived theorem.

Core quantities
- Define delta rho(x) = rho_A(x) - rho_B(x).
- Gravitational self-energy of the difference (Newtonian):
  DeltaE = (G/2) * integral d^3x d^3y [delta rho(x) delta rho(y) / |x - y|].
- Regularize the kernel with a smear length ell (Plummer):
  1 / sqrt(r^2 + ell^2).
- Collapse time scale: tau = hbar / DeltaE, Gamma = DeltaE / hbar.

Discretization and normalization (shared/dp-collapse.ts)
- Grid defined by dims, voxel_size_m, origin_m.
- Voxel volume dV = dx * dy * dz.
- Pairwise sum includes self-term and uses symmetry:
  - weight = 1 for i == j, weight = 2 for i < j.
  - scale factor = 0.5 * G * dV^2.
- This matches the continuous 1/2 factor for double-counting.

Adapter conversions (server/services/dp-adapters.ts)
- Input units:
  - mass_density_kg_m3: pass-through.
  - energy_density_J_m3: divide by c^2.
  - geom_stress: multiply by GEOM_TO_SI_STRESS, then divide by c^2.
- sign_mode:
  - signed: keep sign (allows negative energy density).
  - absolute: take abs(value).
  - positive: clamp to >= 0.
- Optional scale is applied after unit conversion.

Adapter sources (server/services/dp-adapter-build.ts)
- stress_energy_brick: uses T00 from the stress-energy brick (energy density).
- gr_evolve_brick: uses rho from the GR evolve brick (geom_stress).
- Both sources emit dp_adapter payloads plus diagnostics (stats + notes).

Integration flow
- /api/benchmarks/collapse/dp-adapter builds dp_adapter inputs from pipeline or
  GR snapshots with provenance hashes.
- /api/benchmarks/collapse accepts dp_adapter and derives tau via dp_deltaE.
- Collapse benchmark remains a diagnostic; it does not assert physical collapse.

Guardrails and constraints
- ell_m is required (no point-mass inputs).
- Branches must share a consistent grid (dims + voxel sizes).
- Negative energy handling is explicit via sign_mode; no silent sign flips.
- Side-effect bounds (heating / diffusion / force noise) are checks, not proof.

Tests
- tests/dp-collapse.spec.ts (analytic baselines + DeltaE behavior).
- tests/dp-adapters.spec.ts (unit conversion + grid validation).
- tests/collapse-benchmark.phase2.routes.spec.ts (dp_adapter HTTP build flow).
