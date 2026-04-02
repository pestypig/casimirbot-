# NHM2 Shift-Geometry Visualization Memo (2026-04-01)

## Purpose

This memo records the research basis for adding a shift-geometry visualization suite to the NHM2 render stack. It does not change the authoritative Lane A diagnostic contract.

## Why shift geometry matters

For the current NHM2 solve family, the primary question is no longer whether the render path exists. The question is how to visualize the mechanism in a way that is faithful to the fixed observer and foliation contract already used by the repo:

- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- authoritative lane: `lane_a_eulerian_comoving_theta_minus_trk`

Under that contract, NHM2 is consistently closer to a Natario-like low-expansion family than to an Alcubierre-like signed-lobe family. That makes shift-centric visualization more relevant than a York-time-lobe-first viewer.

## Research basis

### 1. 3+1 GR basis

In the standard 3+1 split, the coordinate-time vector is decomposed into lapse plus a spatial shift vector tangent to the hypersurface. That makes the shift a natural object for spatial transport and frame-sliding visualization inside a fixed foliation.

Reference:

- Eric Gourgoulhon, `3+1 formalism in general relativity`
  - https://luth.obspm.fr/~luthier/gourgoulhon/pdf/GourgJ06a.pdf
- Eric Gourgoulhon, lecture notes/slides on the 3+1 split
  - https://luth.obspm.fr/~luthier/gourgoulhon/fr/present_rec/pohang08-1.pdf

### 2. Natario warp interpretation

Natario’s zero-expansion construction is naturally expressed in terms of a vector field on Euclidean 3-space and is heuristically better described as the warp region "sliding" through space. That directly supports a visualization strategy based on shift geometry and trace-free deformation rather than front/back York-time lobes.

Reference:

- José Natário, `Warp Drive With Zero Expansion`
  - https://arxiv.org/abs/gr-qc/0110086

### 3. Scientific vector-field visualization practice

Scientific visualization systems commonly represent vector fields using:

- slices
- stream tracers
- tubes
- glyphs
- plot-over-line
- probe sampling

These are not decorative choices. They are standard tools for making vector magnitude, direction, and spatial organization readable.

References:

- Einstein Toolkit visualization guidance
  - https://einsteintoolkit.org/visualize.html
- Illinois Numerical Relativity Visualization Primer
  - https://tsokaros.github.io/VisualizationGuideDocumentation/
- ParaView stream tracer docs
  - https://www.paraview.org/paraview-docs/v5.13.2/python/paraview.simple.StreamTracerForGenericDatasets.html
- ParaView basic usage tutorial
  - https://docs.paraview.org/en/v5.13.3/Tutorials/SelfDirectedTutorial/basicUsage.html
- ParaView CFD tutorial covering slices, stream tracers, tubes, glyphs, and line sampling
  - https://docs.paraview.org/en/v5.13.2/Tutorials/ClassroomTutorials/targetedComputationFluidDynamics.html
- VisIt annotation conventions
  - https://visit-sphinx-github-user-manual.readthedocs.io/en/3.4rc/using_visit/MakingItPretty/Annotations.html

### 4. Coordinate-free companion views

Shift geometry is useful but gauge-dependent. For that reason it should be paired with coordinate-free or at least coordinate-robust companion views such as invariants and constraint overlays.

Reference:

- Mattingly et al., `Curvature Invariants for the Alcubierre and Natário Warp Drives`
  - https://arxiv.org/abs/2010.13693

### 5. Supplementary recent support

A recent Natario-focused analysis argues that momentum density is more informative for trajectory orientation than volume change alone. This is a useful supplementary argument for transport-oriented views, but the repo should continue to anchor first to Natario plus the standard 3+1 formalism.

Reference:

- José Rodal, `A Closer Look at Natário's Zero-Expansion Warp Drive`
  - https://arxiv.org/abs/2512.19837

## Recommended shift-geometry suite

The first NHM2 shift-geometry suite should include:

1. `beta_magnitude`
- quantity: `|beta|`
- role: where transport intensity lives
- category: `scientific_3p1_field`

2. `beta_direction_xz`
- quantity: shift direction on `x-z` or `x-rho`
- role: show the transport flow pattern directly
- category: `mechanism_overlay`

3. `beta_x`
- quantity: ship-axis signed component of shift
- role: show forward/back transport structure without reducing to York time
- category: `scientific_3p1_field`

4. `beta_linecuts`
- quantity: line-sampled `|beta|` and `beta_x`
- role: make shift geometry numerically readable
- category: `comparison_panel` or a dedicated probe family if added later

5. `beta_residual_to_natario`
- quantity: NHM2 minus Natario control for the same shift-derived field
- role: show where NHM2 departs from the closest canonical family
- category: `mechanism_overlay`

6. `beta_residual_to_alcubierre`
- quantity: NHM2 minus Alcubierre control
- role: show where NHM2 differs from an Alcubierre-like transport pattern
- category: `mechanism_overlay`

7. `beta_constraint_context`
- quantity: shift field paired with Hamiltonian and momentum residual magnitudes
- role: prevent over-reading visually strong but numerically weak regions
- category: `mechanism_overlay`

## Scientific framing conventions

Every shift-geometry render should carry:

- title
- subtitle
- quantity symbol
- units
- observer
- foliation
- sign convention
- lane id
- display policy id
- display transform
- color family
- camera pose id
- orientation convention id

Repo-wide orientation should remain:

- `x_ship`
- `y_port`
- `z_zenith`

## Recommended view forms

### Dedicated 3+1 field renders

Use for:

- `|beta|`
- `beta_x`

These should remain on a neutral field canvas, not on transport-context imagery.

### Streamlines plus tubes

Use for:

- `beta_direction_xz`

Streamlines make the transport organization legible. Tubes improve depth cues. Sparse glyphs can indicate local direction and magnitude without clutter.

### Slice plus line cut

Use for:

- quantitative reading of `|beta|`
- quantitative reading of `beta_x`

Every volumetric shift frame should have at least one paired slice and one paired line cut.

### Residual views

Use for:

- `NHM2 - Natario`
- `NHM2 - Alcubierre`

Residuals are better than vague side-by-side impressions when the goal is to understand where the transport geometry actually departs from each canonical family.

## Use policy

- Lane A fixed-scale diagnostics remain the proof surface.
- Shift geometry is a solve-backed interpretive layer.
- If shift views conflict with diagnostics, debug the shift derivation or render path first.
- Shift renders should never be used by themselves to relabel the morphology family.

## Final fields

- recommendedShiftFieldPrimary: `beta_magnitude`
- recommendedShiftFieldDirectional: `beta_direction_xz`
- recommendedShiftFieldSigned: `beta_x`
- recommendedShiftResiduals: `nhm2_minus_natario`, `nhm2_minus_alcubierre`
- recommendedCrosschecks: `constraint_overlay`, `curvature_invariant_companion`
- repoOrientationConvention: `x_ship_y_port_z_zenith`
- recommendedUsePolicy: use shift geometry as a solve-backed mechanism-reading layer on top of the authoritative Lane A diagnostic contract
