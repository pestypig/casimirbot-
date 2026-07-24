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
- `origin_m` is the coordinate of the grid center, not the minimum corner:
  x_i = (i - (n-1)/2) dx + origin.
- Voxel volume dV = dx * dy * dz.
- Pairwise sum includes self-term and uses symmetry:
  - weight = 1 for i == j, weight = 2 for i < j.
  - scale factor = 0.5 * G * dV^2.
- This matches the continuous 1/2 factor for double-counting.
- The self/cross component ledger uses both off-diagonal branch orderings,
  rho_A,i rho_B,j + rho_A,j rho_B,i, so
  DeltaE = E_AA + E_BB - 2 E_AB for arbitrary asymmetric branches.
- Density-grid branches must match dimensions, voxel sizes, and origin.
- Density-grid payloads accept little-endian row-major Float32 or Float64
  transport, but decoded transport length must be exact; short and trailing
  bytes are rejected. Every decoded mass-density sample must be finite and
  nonnegative.
- Payload identity is canonicalized as little-endian Float64 row-major bytes
  (`dims[0] * dims[1] * dims[2] * 8` bytes). A declared
  `lattice_generation_hash` must be exactly 64 lowercase SHA-256 hex characters
  and must equal the SHA-256 of those canonical decoded bytes. A malformed or
  forged hash fails closed before DP evaluation.
- Both density branches need successfully recomputed payload hashes before the
  runtime may emit `provenance_class: measured`, `claim_tier: certified`, and
  `certifying: true`; hash absence remains a noncertifying proxy path.
- Results expose declared/sampled mass checks through the calling campaign and
  boundary-shell mass fractions for containment audits.

Independent softened-potential audit (shared/dp-collapse.ts)
- Define the signed difference potential on the same grid and with the same
  Plummer kernel:
  DeltaPhi_i = -G dV sum_j DeltaRho_j / sqrt(r_ij^2 + ell^2).
- Replay the energy as:
  DeltaE_Phi = -(1/2) dV sum_i DeltaRho_i DeltaPhi_i.
- Compare DeltaE_Phi against the pairwise double integral with declared
  relative and absolute tolerances.
- This checks two discrete formulations of the same softened Newtonian model.
  It is not a verification of an unsmoothed Poisson field-energy integral and
  does not upgrade the runtime to full GR or physical-collapse evidence.

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
- Generic signed stress/energy conversion is an exploratory adapter capability.
  It is not, by itself, a Casimir-to-OR bridge: a scalar T00/c^2 conversion
  omits pressure, momentum flux, renormalization, gauge, causal metric
  response, and metric-to-coherence dynamics.

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
- tests/dp-collapse.spec.ts (analytic baselines, asymmetric component identity,
  point-pair normalization, grid-origin parity, softened-potential equivalence,
  exact density byte lengths, finite/nonnegative density enforcement, forged
  hash rejection, canonical Float64 hash binding, and DeltaE behavior).
- tests/dp-adapters.spec.ts (unit conversion + grid validation).
- tests/collapse-benchmark.phase2.routes.spec.ts (dp_adapter HTTP build flow).
