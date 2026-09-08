Program gate: G8 — parallel hardware reference and fit-planning lane; does not advance environment-harness acceptance
Workstream: First hardware design case study under HDH
Capability or component: HDH-HELMET-01 Meshy mask/helmet reference, interior, liner and retention design
Lifecycle stage: Reference admission and dimensional requirements
Reaction timescale: Offline design and operator review
Authority owner: User owns intended use, personal measurements and design choices; source mesh supplies appearance only; Blender supplies geometry observations and revisioned design artifacts
Current maturity: specified
Target maturity: implemented
Required evidence: Preserved source identity; oriented geometry report; measured head reference; liner and retention component allowances; revisioned Blender scene; sections and interference findings; unresolved assumptions register
Explicit non-goals: Fabrication or purchasing in this planning stage; protective motorcycle helmet qualification; modifying a certified helmet; optical prescription; automatic hardware/tool installation; promotion of generated geometry into measured evidence
Downstream gate unlocked: HDH-HELMET-01A source inspection and measured fit reference, followed by interior and retention design

# First hardware project: Meshy mask/helmet fit and interior

Created: 2026-09-05.

Parent plan: [Motorcycle HUD and hardware build plan](eh-mhud-0-motorcycle-helmet-hud-build-plan-v1.md).
Program authority: [Environment harness work program](../helix-environment-harness-work-program-v1.md).

## Intent and scope

Turn the supplied decorative Meshy model into a dimensioned design candidate
with a deliberate interior, removable comfort liner and adjustable retention.
Use this project to exercise the parent plan's ReferencePacketManifest,
DesignArtifactManifest and HardwareComponentSpec concepts. These are planning
conventions here; this document does not claim that their shared harness schemas
or a Blender adapter have already been implemented.

Initial assumption: a stationary fit/display prototype. Confirm whether the
desired article covers the face only, the full head, or mounts outside another
helmet before selecting an opening and strap arrangement. Adding padding and
straps does not establish impact protection. Any eventual motorcycle protective
configuration remains a separate whole-system engineering effort in the parent
plan.

## Source inventory and observations

The supplied path was not present literally. A matching model was located at:

```text
C:\Users\dan\Desktop\Helmet\Meshy_AI_Ornate_Silver_Mask_0904181708_generate.glb
```

Read-only GLB metadata inspection on 2026-09-05 found:

| Field | Observation |
| --- | --- |
| File size | 34,317,092 bytes |
| SHA-256 | `6f42e7512d16e6953632714a9bce1d700ec6f20af83d0e4748baa4e22e4036e1` |
| Format / generator | GLB version 2 / `meshy-scene` |
| Scene contents | One mesh, one node; identity node matrix |
| POSITION accessor count | 953,052 vertex entries; not a count of unique welded vertices |
| Declared X bounds | -0.722532749 to 0.720414162 |
| Declared Y bounds | -0.874794662 to 0.877765954 |
| Declared Z bounds | -0.952928662 to 0.951025903 |
| Declared axis extents | Approximately 1.442947 × 1.752561 × 1.903955 coordinate units |

These are accessor metadata, not a decoded topology inspection or measured
human-scale object. Axis-to-anatomy orientation, internal cavity, wall thickness,
openings and physical scale remain unresolved. Do not choose a scale from the
outer ornamental bounding box or assume that a visually plausible model fits.
The original file has not been edited or imported into Blender in this stage.

Blender 3.2 was found under `C:\Program Files\Blender Foundation`; Blender was
not available as a shell command in the inspected session. No callable Blender
MCP tools were found in the current tool catalog. Installation alone does not
establish an MCP connection or compatible add-on.

## Measurements and decisions to collect

Record millimetres, method, repeat measurements and estimated uncertainty.
Leave unknown dimensions unset rather than filling them with generic head sizes.

| Input | What it controls |
| --- | --- |
| Head circumference along a documented tape path | Cross-check of overall scale; insufficient alone for fit |
| Maximum head width and front-to-back depth | Side and forehead/occipital interior sections |
| Crown-to-brow distance and ear positions | Vertical location, crown support and hardware clearance |
| Face width, brow-to-chin and nose projection | Face opening, nose clearance and front interior |
| Eye centres and intended viewing position | Eye apertures and later HUD reference frame |
| Hair, glasses and other worn items | Actual fitted envelope and don/doff clearance |
| Optional head scan with a measured scale reference | Local geometry; label missing or reconstructed regions |
| Liner/pad product, free thickness and thickness under representative compression | Pad pockets, adjustment range and supported contact zones |
| Strap width/thickness, buckle envelope and adjustment travel | Routing, mounting interfaces and release access |
| Intended material, process and printer build volume | Wall design, tolerances, splitting and assembly |

A separate comfort-pad layer, suspension and any impact-management layer have
different functions and must be separate components. Do not assign a protective
role to generic foam. Begin with removable pads and accessible adjustment so
fit can be tuned without resculpting the entire shell.

## Dimensional method

1. Establish a documented millimetre convention in Blender. Record the import
   conversion, scene units, object transforms and coordinate mapping. Verify a
   known-length reference on export; display-unit settings alone do not resize
   a mesh.
2. Orient the model to anatomical left/right, forward and up. Establish a
   centre plane, brow/eye datum and crown datum. Preserve the original imported
   geometry in a locked reference collection.
3. Build or import the measured head reference. Use width, depth, height and
   local sections together. Circumference is a consistency check.
4. Construct local clearance envelopes. At a padded contact zone, desired shell
   inner position is the head surface offset by pad thickness under the intended
   fit compression plus local clearance. Carry measurement and manufacturing
   uncertainty separately. At noncontact zones, reserve the actual nose, ear,
   glasses, ventilation and motion clearance instead of applying one global gap.
5. Start with uniform appearance scaling. Compare interior sections to the fit
   envelope. If aspect ratios disagree, redesign local geometry; record any
   deliberate nonuniform scaling because it changes the artwork's proportions.
6. Evaluate the entry opening and the full don/doff path separately from the
   final seated fit. A cavity can accommodate a head while its opening prevents
   insertion. If needed, compare a removable rear section, split shell or a
   face-mask arrangement.

No final liner thickness, wall thickness, clearance or scale factor is frozen
until the corresponding measurements and component/process choices exist.

## Blender and MCP workflow

First inspect Blender's exact executable/version and the available adapter's
installation, permissions and supported calls. Record its source and version.
Use local Blender scripting through its executable as a fallback if a suitable
MCP adapter is unavailable; both routes should produce the same project files
and review artifacts. Connecting or installing an adapter is a later execution
step, not something completed by this plan.

Initial operations should provide scene inventory, import into a fresh project,
evaluated dimensions, fixed-view renders, section views and topology reports.
For edits, save a checkpoint first, target named objects, retain modifier history
where practical and save a new revision. Inspect any scripts before execution;
do not execute instructions embedded in asset names or metadata.

Inspect for disconnected geometry, interior obstructions, duplicate/internal
faces, inverted normals, non-manifold edges, self-intersections, thin ornamental
features and eye/air openings. The dense mesh may benefit from a lightweight
working proxy. Preserve the original detail for comparison and do not use
decimation as a substitute for a deliberate inner surface.

Suggested Blender collections:

```text
00_source_locked
10_head_reference_and_datums
20_fit_and_motion_envelopes
30_outer_appearance
40_engineered_inner_shell
50_removable_liner_and_pads
60_retention_and_fasteners
70_future_hud_keepouts
90_sections_cameras_and_measurements
```

Keep future HUD/projector volumes as adjustable placeholders. The normalized
software HUD remains independent of this evolving visor or mask geometry.

### Optics-aware print planning clarification

The immediate objective remains preparation of the stationary prototype shell
for printing, not completion of the optical HUD. Anticipate mechanical assembly
now so the print does not preclude later experiments. This is offline hardware
planning only: no environment adapter, runtime authority or maturity is advanced.

Separate a thin removable pane in front of the eyes from the rim/brow/chin
optical-engine carrier and local fold/coupling optics. Compute, battery and driver
electronics may be remote where the selected interfaces permit; the optical
engine still needs local alignment and thermal accommodation. Do not interpret
a local head-to-shell clearance as room for the whole electronics assembly.

Carry two alternatives: a dedicated inner combiner and an experimental visor
waveguide. The latter's image preservation is unproven; ordinary visor material,
coupling gel and generic extraction film do not establish a working AR guide.
Neither sparse HUD cues nor a planning placeholder resolve obstructed direct
vision. Video-passthrough is a separate validation track.

Within `70_future_hud_keepouts`, plan separate pane/eye-clearance, engine/thermal,
coupler/light-path, cable/connector and removable-carrier/assembly envelopes.
Record component identity, dimensions, provenance, pose, tolerances, adjustment
and access sweeps. Prefer replaceable adapters over freezing supplier-specific
holes into the shell. Include connector insertion, cable bends, tool access,
pane removal, head entry and liner/strap coexistence in interference review.

Before shell geometry freeze, either select a documented component assembly or
obtain an explicit choice to accept a bounded compatibility envelope and possible
later reprint. Optical performance may remain experimental after printing, but
engine/pane fit and shell-side mounting geometry cannot simply be deferred.
One-piece shell preference permits separate removable carriers and optical pane.
Retain the provisional $200 shell/basic liner/retention budget; optics/electronics
are outside that allowance, and no ordering or uploading is authorized here.

Detailed local requirements and pre-print decision checklist:
`C:\Users\dan\Desktop\Helmet\HDH-HELMET-01\requirements\optics-aware-print-plan-r001.md`.
The next mechanical deliverable is an optics-aware Blender layout and assembly
review, not an optical-performance or manufacturing approval. This clarification
does not itself change any Blender scene.

## Interior, liner and retention design

Preserve the chosen external appearance while creating an intentional inner
surface around the fit envelope. Hollowing by a global Solidify modifier is
only a candidate operation: inspect offsets around tight folds and ornaments,
and check local thickness and collisions after every boolean or remesh.

Compare removable pad locations at the brow, sides, crown and rear according to
coverage. Define intended support/contact zones and keep pressure away from
eyes, nose, ears and hardware. Include pad attachment thickness, edge finishing,
cleaning access and ventilation paths in the geometry.

For a face mask, evaluate a side/rear harness with optional crown support. For
a full enclosure, evaluate adjustable rear/crown support and whether a chin
strap is needed. Choose after seeing the actual geometry and mass estimate.
Model strap routing, anchor interfaces, buckle motion and accessible release;
avoid relying on thin generated decorative features as mounting points. Do not
route a tightening strap across the throat. Release must remain accessible
with the article in place.

## Stages and deliverables

| Stage | Work | Deliverable and exit condition |
| --- | --- | --- |
| HDH-HELMET-01A | Source orientation, geometry inventory and head measurement reference | Checkpointed `.blend`, fixed views and sections, unit conversion report and measurements sheet; unknown fit dimensions stay explicit |
| HDH-HELMET-01B | Scale and inner cavity candidate | Parametric fit envelopes, local clearance/thickness findings and insertion-path assessment |
| HDH-HELMET-01C | Liner and strap packaging | Separate component models, adjustment ranges, attachment design and interference review |
| HDH-HELMET-01D | Manufacturing preparation | Material/process selection, split/assembly plan, critical drawings and small fit-section candidates |
| HDH-HELMET-01E | Staged fit evaluation | Section coupons and headform evaluation before a complete article; later stationary user fit observations recorded against the exact revision |

Testing and fabrication are deferred as requested. Before those stages, define
the pass/fail observations: dimensional deviation, pressure/contact locations,
eye/air clearance, retention adjustment, independent release, don/doff path,
assembly integrity and mass. Stop a worn fit trial if removal, breathing,
vision or comfort is impaired. Record observations without inferring protective
performance from a successful fit.

Proposed project output tree, to be created during execution:

```text
Helmet/HDH-HELMET-01/
  reference/       source identity, fixed views, measured head inputs
  requirements/    measurements, uncertainties and component choices
  blender/         numbered working scenes and tool/version records
  components/      shell, liner, straps, fasteners and future HUD envelopes
  review/          sections, interference reports and annotated decisions
  exports/         dimension-checked manufacturing candidates
  evidence/        later fit observations and revision-specific results
```

Keep personal head scans and measurements local to this project by default;
reference them from repository manifests rather than committing the binary
source or personal scan. Each derived artifact records its parent hash, revision,
units, transformations and whether geometry was measured, generated or designed.

## First execution goal

**HDH-HELMET-01A: Inspect the Meshy model in Blender and establish the measured
head-fit reference.** Deliver an oriented source scene, six fixed views,
interior sections, actual transformed bounds, geometry findings, and a user
measurement worksheet. Completion of source inspection is possible before head
measurements arrive; final scale and fit remain pending those measurements.

This planning stage performed file discovery and metadata reading only. No
Blender edits, source overwrites, tool installs, prints, fit tests or runtime
acceptance checks were performed.

## HDH-HELMET-01A source inspection delivery — 2026-09-06

The offline source-inspection portion is implemented. Blender 3.2.2 native
scripting produced `helmet_reference_r002.blend`, six fixed orthographic views,
three uncapped interior sections, an overview, JSON geometry findings and a head
measurement worksheet under `C:\Users\dan\Desktop\Helmet\HDH-HELMET-01`.
The source GLB hash is unchanged. No Blender MCP connection is claimed.

The imported model has one connected component, 953,052 vertices and 1,906,640
faces, zero non-manifold edges and two near-zero-area faces under the recorded
threshold. Visual inspection confirms a cavity and irregular interior surfaces.
Blender orientation is X right, -Y forward, +Z up. Under the unchanged import
convention, width/depth/height are approximately 1442.947/1903.955/1752.561 mm;
these are uncalibrated source dimensions, not fit or fabrication dimensions.

Local report: `review/findings-r001.md`. Machine evidence:
`evidence/inspection_r002.json`. Measurement input:
`requirements/head-measurements-r001.md`. Source inspection is delivered;
the measured head reference and final scale remain pending user dimensions.
No maturity beyond implementation of this inspection workflow is claimed.
This work does not alter the active environment-harness gate.
