# EH-MHUD-0 Motorcycle Helmet HUD Build Plan v1

Program gate: G8 — environment-harness release evaluation; parallel post-G7 physical-device design lane that cannot substitute for G8 closure
Workstream: Motorcycle awareness system, helmet HUD CAD, deterministic safety controller, and CasimirBot environment-adapter planning
Capability or component: Non-road motorcycle threat-awareness prototype with a transparent inner combiner, eight-sector HUD, bike-mounted sensing, helmet pose sensing, replay environment, and advisory semantic supervisor
Lifecycle stage: source admission → observation normalization → bounded reflex proposal → HUD admission → cue rendering → causal receipt → evidence re-entry
Reaction timescale: `bounded_reflex` for deterministic threat-to-cue processing; short semantic replanning for situation interpretation; durable planning for development, calibration, and post-run analysis
Authority owner: the rider owns operation and manual override; the helmet HUD controller owns only bounded cue rendering; the bike safety controller owns deterministic threat estimation; Helix owns identity, freshness, admission, provenance, interruption, and evidence re-entry; Runtime Codex owns advisory interpretation and planning but no reflex, vehicle-control, or terminal safety authority
Current maturity: projected
Target maturity: specified, with frozen interfaces, CAD envelopes, hazard controls, staged evidence requirements, and an executable first bench packet
Required evidence: reviewed requirements and hazard log; versioned coordinate frames and schemas; deterministic replay fixtures; latency and stale-input tests; optical bench measurements; CAD interference and sight-line checks on a headform; watchdog and manual-blanking behavior; zero vehicle actuation; and explicit separation between bench, closed-course, and road/certification claims
Explicit non-goals: no road use; no claim of crash prevention, certification, or safety acceptance; no cutting, drilling, compressing, replacing, or bonding to protective helmet shell or EPS; no video passthrough; no autonomous motorcycle control; no LLM in the reflex path; no frozen warning from stale data; no facial recognition, license-plate identification, or unnecessary recording; and no inference that a simulator, CAD fit, or bench demo makes a helmet road legal
Downstream gate unlocked: none; this packet only defines the program and prepares separately reviewed CAD, replay, optical-bench, and hardware-in-the-loop packets

Helix Ask/Codex change classification: source admission, evidence
normalization, evidence re-entry, follow-up reasoning, terminal authority,
presentation, and Codex-owned runtime behavior implemented only through a thin
provider adapter

Repository capability ownership, overlap resolution and reuse/extend/bridge
decisions for this plan are maintained in
`docs/work-packets/eh-hci-0a-repository-harness-capability-crosswalk-v1.md`.
That crosswalk is a reconciliation aid, not a second maturity roadmap; the
canonical environment-harness work program remains status authority.

## Decision

Build a sparse motorcycle awareness HUD, not an augmented-reality windshield and
not a video helmet. The rider keeps direct optical vision through an ordinary
transparent outer visor. A removable transparent inner combiner carries only
large peripheral cues: threat direction and urgency, navigation, blind-zone
occupancy, and system state.

The project is split into three independently testable build lanes:

1. **Physical system:** bike sensors, helmet display electronics, power,
   communications, watchdog, haptics, and test instrumentation.
2. **Helmet CAD and optics:** headform, keep-out volumes, inner combiner,
   projector and fold path, mounts, thermal paths, serviceability, and sight
   lines.
3. **Programming environment:** recorded/synthetic traffic replay, deterministic
   tracking and threat logic, HUD renderer, hardware-in-the-loop bridge, and a
   governed CasimirBot environment adapter.

These lanes meet first at a stationary instrumented headform, then at a bench
hardware-in-the-loop rig. A moving closed-course study and any road-going helmet
are later projects with separate safety review and, for a product, whole-helmet
compliance work.

## Product boundary

### Intended first capability

The first capability answers one question:

> Can a person correctly and quickly identify the direction and urgency of an
> approaching simulated threat from a sparse HUD cue without losing direct
> forward vision?

The first display has eight sectors and five visual states:

```text
                    FRONT
              ┌────── 0 ──────┐
              │ 7           1 │
              │               │
         LEFT 6      clear    2 RIGHT
              │     center    │
              │ 5           3 │
              └────── 4 ──────┘
                    REAR

sector state: off | dim | moderate | urgent | urgent_pulse
```

The center remains graphics-free during ordinary operation. A center cue is
reserved for a separately validated imminent-conflict class; it is not part of
the first prototype.

### Explicit operating modes

| Mode | Physical movement | Live sensing | HUD on a person | Claim permitted |
| --- | --- | --- | --- | --- |
| `simulation` | none | no | optional desktop mock | software behavior only |
| `optical_bench` | none | no | no; camera/photometer/headform | optical measurement only |
| `stationary_fit` | none | synthetic/replayed | only under a reviewed lab protocol | fit and recognition evidence only |
| `closed_course_research` | controlled | bounded | later packet only | exact study result only |
| `road` | public traffic | live | prohibited by this packet | none |

No mode may silently promote itself. The mode, fixture identity, configuration
hash, operator, timestamps, and evidence references belong in every run record.

## System architecture

```text
MOTORCYCLE / FIXTURE                          HELMET / HEADFORM
┌──────────────────────────┐                 ┌────────────────────────┐
│ rear/front radar inputs  │                 │ helmet IMU             │
│ optional cameras         │                 │ ambient-light sensor   │
│ wheel speed, GNSS, IMU   │                 │ display watchdog       │
└────────────┬─────────────┘                 │ renderer + projector   │
             │ observations                  │ haptic/audio reserve   │
             ▼                               └───────────▲────────────┘
┌──────────────────────────┐                             │ admitted HudCue
│ deterministic bike node  │◄──── time sync / pose ──────┤
│ normalize → track → TTC  │                             │
│ risk → sector → arbiter  │─────────────────────────────┘
└────────────┬─────────────┘
             │ causal events; never raw high-rate video by default
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ phone or installed CasimirBot node                               │
│ run identity · situation digest · evidence · semantic reasoning  │
│ calibration · post-run analysis · navigation intent              │
└──────────────────────────────────────────────────────────────────┘
```

The bike node continues its bounded deterministic work if CasimirBot is slow,
offline, or reasoning. Loss of CasimirBot cannot delay or suppress an otherwise
valid reflex cue. Loss or staleness of required sensor input clears the affected
threat cue and presents a distinct degraded-system indication; it must never
leave a threat graphic frozen as though it were current.

## Reaction timescales and ownership

| Timescale | Initial budget | Owner | Permitted work | Forbidden work |
| --- | ---: | --- | --- | --- |
| reflex | target 10–20 ms compute window after normalized input arrival | deterministic bike controller | freshness, tracking, closing rate, TTC/CPA family, confidence, hysteresis, sector cue | LLM call, free-form text, remote dependency, vehicle actuation |
| situation | 100–500 ms target | deterministic situation controller | persistent closing pattern, escape-zone occupancy, cue combination, sensor disagreement | inventing an object, overriding stale data, expanding display vocabulary |
| semantic | asynchronous | Runtime Codex through Helix | explain a digest, interpret construction/merge context, prepare navigation or calibration plan, analyze a run | serving as reflex, blocking a cue, claiming safety from a receipt, writing directly to display memory |

Runtime Codex may request only predeclared advisory or navigation cue families.
Every request passes through the same local HUD admission controller, priority
rules, freshness limits, rate limits, and manual override as other cues.

## Coordinate frames and timing contract

Freeze the coordinate convention before collecting data:

```text
bike frame B:  +x forward, +y left, +z up
head frame H:  +x gaze-forward, +y left, +z up
bearing:       atan2(y, x), positive counter-clockwise/left
range:         meters
time:          monotonic nanoseconds plus optional UTC correlation
```

For a planar first prototype:

```text
head_relative_bearing = wrap180(object_bike_bearing - head_yaw_in_bike)
```

The production-shaped contract reserves full quaternions and calibrated rigid
transforms so the planar shortcut does not become the permanent geometry.
Transform records bind the helmet, bike, calibration, IMU epochs, uncertainty,
and timestamps. Out-of-order, uncalibrated, stale, or epoch-mismatched data is
rejected before threat admission.

Closing speed is positive only when measured range is decreasing. A first-order
TTC estimate is valid only when closing speed exceeds a frozen minimum and the
track passes freshness and confidence gates:

```text
ttc_s = range_m / closing_speed_mps
```

TTC alone is not collision likelihood. Lateral motion, closest point of
approach, track uncertainty, ego motion, braking, and roadway geometry enter
later profiles. The first fixture must contain cases where low TTC is not an
intersecting path so the system does not learn to equate closing with collision.

## Frozen v0 data contracts

The first schemas should be implemented in shared code before hardware drivers.
Every schema has a `schema_version`, producer identity, producer epoch,
monotonic sequence, source timestamp, arrival timestamp, freshness deadline,
and configuration hash.

```ts
type TrafficTrack = {
  trackId: string;
  bearingBikeDeg: number;
  rangeM: number;
  closingSpeedMps: number;
  relativeAccelerationMps2?: number;
  lateralSpeedMps?: number;
  confidence: number;
  covarianceRef?: string;
  classification: "unknown" | "vehicle_like";
};

type HelmetPose = {
  bikeToHeadQuaternion: [number, number, number, number];
  yawBikeDeg: number;
  angularVelocityDps: [number, number, number];
  calibrationId: string;
};

type ThreatState = {
  threatId: string;
  sourceTrackIds: string[];
  bearingHeadDeg: number;
  rangeM: number;
  closingSpeedMps: number;
  ttcS?: number;
  severity: number;
  confidence: number;
  sector: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  reasonCode: string;
};

type HudCue = {
  cueId: string;
  cueClass: "threat" | "navigation" | "blind_zone" | "system";
  sector: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  level: "dim" | "moderate" | "urgent" | "urgent_pulse";
  pattern: "steady" | "approach" | "occupied" | "degraded";
  ttlMs: number;
  sourceEvidenceRefs: string[];
  admittedBy: string;
};
```

The final TypeScript contracts should use branded units or runtime validation;
the examples above communicate shape, not implementation completeness.

## HUD admission policy v0

1. A cue is rendered only from an admitted enum; no arbitrary text, HTML,
   bitmap, animation, or model-authored shader enters the reflex display.
2. Threat cues outrank navigation. System-degraded state remains visible without
   covering a higher-priority threat sector.
3. The controller uses separate enter and exit thresholds plus minimum dwell to
   prevent flicker. Exact values are fixture parameters until human-factors
   testing freezes them.
4. Each cue has a short TTL and must be renewed from current evidence.
5. Stale pose clears migration around the annulus; stale track data clears the
   corresponding threat cue. The system reports degraded sensing and never
   presents the absence of a cue as proof of a clear lane.
6. Manual blanking, Emergency Stop, lease expiry, configuration mismatch, or
   watchdog failure releases renderer authority and records a causal receipt.
7. Pulsing frequency, color, intensity, and duty cycle remain conservative and
   configurable until photosensitivity, distraction, and daylight/night studies
   are completed. Color is never the sole carrier of meaning.
8. No HUD cue commands the rider to swerve, brake, or accelerate in v0. It
   communicates direction, urgency, occupancy, or degraded state.

## Physical system lane

### Bike-mounted assembly

Reserve mounting and interfaces for:

- rear sensing as the first live-capable direction, with front sensing later;
- vehicle IMU and speed input;
- GNSS for time/location correlation where lawful and needed;
- deterministic compute node with hardware watchdog;
- fused and protected power input, local energy reserve for orderly shutdown,
  and a physical disconnect;
- authenticated low-latency helmet link with sequence, epoch, freshness, and
  reconnect behavior;
- local recording of normalized tracks and receipts, with raw video disabled by
  default and separately governed if ever used.

Sensor selection is deferred until the observation schema and fixture prove
what range, angular resolution, update rate, timestamp quality, weather rating,
and interface are actually required.

### Helmet assembly

Reserve:

- helmet IMU;
- ambient-light sensor;
- microdisplay/projector and driver;
- optional fold mirror;
- removable inner combiner;
- render microcontroller or small deterministic compute module;
- independent watchdog and physical blanking path;
- minimal status indicator outside the principal optical field;
- haptic/audio interfaces as electrically present but disabled in the first
  optical study.

Battery and heavy compute should remain off the brow where practical. Early
experiments may tether the headform. A worn system needs snag, connector-break,
thermal, water-ingress, mass, center-of-mass, and emergency-removal analysis.

## Reusable scientific hardware-definition and production-evidence lane

Program gate: G8 — environment-harness release evaluation; parallel scientific-hardware planning lane that cannot substitute for G8 closure or any research program's active proof gate
Workstream: theory-to-experiment-to-hardware digital thread
Capability or component: reusable Hardware Definition Harness (`HDH-0`)
Lifecycle stage: theory localization → predicted observable → device requirement → reference/component/CAD artifacts → independently admitted measurement → evidence re-entry
Reaction timescale: asynchronous research and engineering workflow; never a reflex, device-protection, or live control loop
Authority owner: the Theory Badge Graph owns typed theory location and claim boundaries; each research work program owns proof and maturity gates; the hardware project owns design revisions; instruments and admitted test adapters own measurements; Helix owns identity, provenance, leases, evidence admission, and terminal eligibility; Codex owns bounded reasoning and tool requests only
Current maturity: specified
Target maturity: deterministically verified
Required evidence: versioned cross-domain contracts; exact theory badge, equation, scale, unit, requirement, component, CAD revision, simulator, instrument, and test-run bindings; reference classification; preregistered predictions and falsifiers; source/design/test separation; UI/MCP parity; fixed-view CAD comparison; DFM and compatibility checks; measurement uncertainty; negative and stale evidence; tool receipts; and proof that no design artifact, graph adjacency, simulation, or generated render is promoted into empirical or manufacturing authority
Explicit non-goals: automatic proof promotion, graph proximity as truth, generated geometry as measurement, design-to-test circularity, post-result retuning, private model or tool loops, unattended fabrication or purchasing, arbitrary machine control, fabrication-readiness claims without review, physical viability inheritance, helmet certification, or road-use authority
Downstream gate unlocked: HDH-0A may define the shared manifests and developer Hardware Workspace; motorcycle MHUD-2/MHUD-3 and separately governed research-device programs may consume those contracts without inheriting one another's maturity

### Why this belongs above the motorcycle project

The motorcycle HUD is one hardware environment, not the owner of hardware
design. The repository already contains the more general pattern: theoretical
and numerical work can identify an observable, an experimental device can be
proposed to measure it, and a manufacturing/test packet can turn that proposal
into falsifiable evidence. The Casimir-tile program is a useful precedent
because it distinguishes a lab coupon that is a fabrication and measurement
target from a system-mechanism tile that remains authoritative only for model
and governance use. The two may be related without being treated as the same
physical object or maturity claim.

NHM2 full-solve artifacts and Theory Graph lamps are likewise inputs to this
workflow only at their authenticated claim ceiling. A theory badge may locate
equations, scale bands, runtime rows, missing bridges, candidate observables,
and recommended next tools. It does not prove that an apparatus can be built,
that a measurement occurred, or that measured evidence supports the theory.
This lane must not modify an NHM2 candidate, active proof gate, frozen input,
certificate, or Theory Graph lamp merely because a hardware design was created.

```text
Theory Badge Graph / governed research program
        │ exact badge, equation, scale, units, claim ceiling
        ▼
predicted observable + uncertainty + falsifier
        │ preregistered before apparatus results
        ▼
device requirement graph
        │ sensitivity, range, timing, environment, geometry
        ▼
hardware environment profile + component graph
        │ reference packet, CAD, electrical, firmware, fixtures
        ▼
simulation / tolerance / interference / DFM evidence
        │ candidate design evidence; not empirical evidence
        ▼
human release to fabrication or bench integration
        │ independently identified article, instrument and procedure
        ▼
measurement packet + uncertainty + negative results
        │ evidence admission and post-tool Codex reasoning
        ▼
research work-program review / Theory Graph diagnostic update proposal
```

The return arrow is governed. Measurements may challenge, constrain, or support
a bounded prediction, but only the owning research program can admit them into
its proof or empirical status. A generated design cannot manufacture its own
confirming evidence.

### Two independent classification axes

Every design feature, dimension, material, interface, and hidden region carries
a reference classification:

| Reference classification | Meaning |
| --- | --- |
| `observed` | directly visible in an immutable source image, scan, drawing, or existing article |
| `measured` | supplied by calibrated metrology, an admitted instrument, or a traceable manufacturer datum |
| `inferred` | estimated from incomplete evidence and explicitly uncertain |
| `newly_designed` | intentionally introduced by the operator or Codex as a candidate design choice |

A separate requirement-provenance field records whether a requirement is
`theory_derived`, `simulation_derived`, `empirical`, `datasheet`,
`engineering_assumption`, or `operator_constraint`. Neither axis is a maturity
claim. For example, a reference-aligned CAD surface can remain `inferred`, and
a precisely measured dimension can still belong to an article that failed its
acceptance test.

Artifact lifecycle is recorded independently:

```text
concept
  → parametric_blockout
  → reference_aligned
  → interference_checked
  → bench_candidate
  → bench_verified
  → manufacturing_reviewed
  → fabrication_released
```

These are hardware-artifact states, not substitutes for the canonical
environment-harness maturity vocabulary or the exploratory → reduced-order →
diagnostic → certified math stages. `Fabrication_released` means a named human
released an exact drawing/BOM revision to a named process; it does not mean the
device works, validates a theory, satisfies product regulation, or is safe for
wear.

### Canonical hardware project contracts

The first shared schemas should be domain-neutral:

| Contract | Required identity and purpose |
| --- | --- |
| `TheoryDesignLink` | badge ids, equation/runtime rows, source artifacts, scale bands, unit signatures, claim ceiling, predicted observables, uncertainty, falsifiers, and owning work-program gate |
| `HardwareEnvironmentProfile` | intended environment, component graph, frames/datums, sensor and display ports, compute/power/thermal/mass/bandwidth budgets, calibration, failure policies, and evidence refs |
| `HardwareComponentSpec` | stable part/revision, role, supplier or custom status, physical envelope, interfaces, performance bands, environmental limits, substitutions, and provenance classes |
| `ReferencePacketManifest` | immutable originals, scale anchors, orthographic guides, SVG contours, masks, classifications, uncertainty, approvals, and supersession history |
| `DesignArtifactManifest` | CAD/EDA/firmware source revision, dependencies, coordinate system, generated exports, fixed cameras, hashes, classifications, unresolved regions, and tool receipts |
| `ExperimentClosurePacket` | exact article/BOM/CAD/firmware, apparatus, calibration, preregistration, procedure, raw and derived evidence, uncertainty, falsifiers, deviations, and result claim ceiling |

Software requirements and hardware capabilities meet through typed ports rather
than prose alone. A sensor port declares observable type, units, frame,
field-of-view, range, cadence, timing uncertainty, latency, protocol, calibration
and stale/failure behavior. A display port declares pixel/optical geometry,
refresh, latency, transform, luminance or electrical envelope, blanking and
watchdog behavior. Compute, power, thermal and mechanical ports use the same
revisioned compatibility pattern.

This creates a bidirectional digital thread:

- research and software tell the device what must be measured, rendered,
  computed, synchronized, powered and physically accommodated;
- selected or measured hardware tells software its actual calibration,
  transforms, performance envelope, health, firmware and limitations; and
- incompatibility remains visible as typed evidence rather than being repaired
  by silently changing a theory prediction, sensor profile, CAD dimension or
  acceptance threshold.

### Reference compiler and CAD/EDA tool adapters

The image-to-CAD workflow becomes a reusable, governed reference compiler:

```text
immutable originals
  → feature and uncertainty inventory
  → perspective correction / silhouettes / masks / SVG contours
  → coordinated orthographic guides with common datums and scale
  → operator approval of every inferred or newly designed region
  → locked reference packet
  → CAD blockout
  → fixed-camera renders and transparent comparisons
  → separately admitted print/manufacturing engineering
```

Original pixels and scans remain source evidence. Generated orthographic views,
image-to-3D meshes, and completed hidden geometry are candidate artifacts.
Blender Image Empties, fixed cameras, millimeter units, locked reference
collections, checkpointed source scenes, and deterministic render paths are the
preferred first CAD adapter conventions. A 2D adapter is useful for measurable
tracing and annotation, not unrecorded beautification.

Blender, a vector editor, EDA software, simulators, slicers, DFM checkers,
instrument software and manufacturing-package exporters are harness tool
adapters. They do not become state or reasoning authorities. Potentially
destructive operations, arbitrary scripts, exports, machine motion, purchasing,
fabrication submission and external messages require separately scoped tools,
leases and receipts. Codex requests those tools through its native governed
loop; Helix must not create a private sampler, retry loop or terminal answer
from their receipts.

### Hardware Workspace and shared UI/MCP behavior

The developer Hardware Workspace should project the same canonical project
state exposed through MCP:

```text
Hardware Workspace
├─ Theory and observable links
├─ Reference Packet
├─ Requirements and scale/units
├─ Component and interface graph
├─ CAD / EDA / firmware sessions
├─ Compatibility and tolerance findings
├─ Calibration and test procedures
├─ Fabrication-preparation package
└─ Evidence, receipts and unresolved assumptions
```

The user can operate and monitor every admitted action. A bound Codex thread may
also list, inspect, compare, configure and invoke supported adapters under exact
profile/project/revision/tool leases. Both clients observe the same hashes,
receipts, conflicts, unavailable tools and evidence; MCP does not click hidden
panel controls. The Surface Registry may host CAD renders, live instrument
views, plots and comparison overlays, while VSE may create bounded visual
evidence packets. Neither pixels nor panel text supersede typed instrument or
world-state evidence.

### Proposed upper-tree file hierarchy

```text
shared/contracts/hardware-definition/                    # domain-neutral schemas
shared/hardware-definition/                              # validation, hashing, compatibility
server/services/hardware-definition/                     # project registry + evidence admission
server/mcp/hardware-definition/                          # thin tools over the same service
client/src/components/workstation/hardware-workspace/    # developer projection
connectors/hardware-tools/
├─ reference-2d/
├─ blender/
├─ eda/
├─ simulation/
├─ dfm-and-slicer/
└─ instruments/
hardware/projects/
├─ motorcycle-hud/
│  ├─ theory-design-links/
│  ├─ references/
│  ├─ requirements/
│  ├─ components/
│  ├─ cad/
│  ├─ electrical/
│  ├─ firmware/
│  ├─ calibration/
│  ├─ tests/
│  ├─ renders/
│  └─ exports/
└─ casimir-tile/                                         # governed by its own specs/program
   ├─ lab-coupon/
   └─ system-mechanism/                                  # never merged with coupon authority
artifacts/hardware-definition/                           # immutable run/receipt outputs
```

This hierarchy creates discoverable retrieval context for Codex without loading
every theory, solver, CAD file, component catalog and measurement into every
turn. Exact links allow the harness to retrieve only the relevant badges,
equations, scale bands, device revision, adapter contracts, test evidence and
claim boundaries.

### Scientific independence and stop/fail rules

Before a scored experiment, freeze the predicted observable, units, expected
band or null behavior, uncertainty treatment, falsifiers, article revision,
calibration procedure, excluded data, and analysis code hash. Design simulations
may optimize apparatus sensitivity, but the measurement dataset cannot be used
to retune the prediction, article or decision threshold and then be scored as
independent evidence. Exploratory post-result changes create a new explicitly
labelled run and cannot rewrite the previous receipt.

Stop or fail the path when:

- theory badge, owning gate, unit signature, scale band, or claim ceiling is
  missing or mismatched;
- a model abstraction is represented as the fabricated article;
- an inferred/generated dimension is represented as observed or measured;
- the CAD/BOM/firmware/calibration identities do not name the tested article;
- simulated, rendered or expected output is substituted for instrument data;
- uncertainty, calibration, negative results or protocol deviations are
  missing;
- design and evaluation share an undeclared tuned dataset or post-result
  threshold;
- a tool receipt is treated as proof that a render, export, fabrication,
  machine action or measurement completed;
- a device proposal attempts to raise the Theory Graph or research-program
  claim ceiling automatically; or
- a helmet design enters protective structure, wearable testing or road use
  outside the separately reviewed MHUD gates.

### HDH staged program

| Phase | Build | Required evidence | Promotion boundary |
| --- | --- | --- | --- |
| HDH-0A | shared theory-design, hardware-profile, component, reference, artifact and experiment-closure contracts plus project registry | schema fixtures, canonical hashing, provenance/classification tests, unit/scale mismatch rejection, claim-ceiling and circular-evidence poison cases | design metadata only; no CAD tool, fabrication or empirical claim |
| HDH-0B | developer Hardware Workspace and UI/MCP parity over the project registry | exact profile/project/revision binding, stale conflicts, lease/revoke/sign-out behavior, context poison tests and no panel-click automation | configuration and retrieval only |
| HDH-0C | reference compiler plus governed 2D and Blender adapters | immutable-original preservation, classification coverage, fixed-camera reproducibility, checkpoint/recovery, script/export leases and visual comparison receipts | candidate geometry only; no fit, DFM or build claim |
| HDH-0D | component, mechanical, electrical, firmware, tolerance and interface compatibility graph | unit-aware compatibility fixtures, conflict/failure propagation, substitutions, power/thermal/mass budgets and unresolved-assumption reporting | engineering analysis only; no procurement or manufacturing release |
| HDH-0E | simulator, calibration and instrument evidence adapters | exact article/apparatus/firmware identity, timestamp/epoch binding, uncertainty, stale/revoke/negative-result cases and independent postcondition evidence | bench evidence only; no theory or product promotion |
| HDH-0F | fabrication-preparation and external handoff package | exact released revision, drawings/BOM/process/test/acceptance package, DFM review, human release, vendor-message/procurement receipts and as-built return identity | handoff only; fabrication receipt is not performance evidence |

The first implementation goal for this lane is HDH-0A. It can proceed as a
separate planning/contract packet while HUDH-0C2 builds the reusable visual
workspace, provided neither claims completion of the other's open dependency.

## Bidirectional cross-environment object traversal

Program gate: G8 — environment-harness release evaluation; parallel representation-transfer planning lane that cannot substitute for live adapter acceptance
Workstream: portable object/scene evidence and target realization
Capability or component: Environment Object Traversal (`EOT-0`)
Lifecycle stage: source selection → multimodal observation → canonical portable object package → target adaptation → separately admitted realization → verification evidence
Reaction timescale: asynchronous capture, reconstruction and build planning; never a reflex, safety-warning, or unbounded environment-action loop
Authority owner: the source adapter owns typed source facts; sensing adapters own calibrated samples; the portable package owns provenance-preserving representation; the target adapter owns compatibility and loss reporting; Minecraft World Authority or Player Embodiment owns admitted game effects; the user owns capture consent, retention and release; Codex owns bounded reconstruction/build reasoning only
Current maturity: specified
Target maturity: deterministically verified
Required evidence: exact source/target environment, object, profile, producer epoch, frame, scale, unit, capture, package, reconstruction, target-plan and realization-receipt identities; multimodal provenance; measured-versus-inferred geometry; privacy/retention controls; target loss reports; round-trip and cross-representation fixtures; stale/mismatch/poison cases; separate mutation admission; and postcondition comparison
Explicit non-goals: literal identity claims across environments, screenshots as Minecraft World Authority, generated meshes as measured scans, silent scale/material/semantic invention, person or private-space capture without consent, continuous ambient recording, arbitrary external upload, automatic Minecraft mutation, generated build plans as completed structures, physical fabrication, or safety/proof authority
Downstream gate unlocked: EOT-0A may define the portable package and adapter contracts; later Minecraft, Meshy-like reconstruction, LiDAR/depth, CAD and fabrication-target adapters remain separately permissioned and verified

### Traversal is translation, not object teleportation

An object does not retain perfect identity when it crosses between a voxel
world, photographs, a point cloud, a triangle mesh, parametric CAD and a
fabricated article. Each representation preserves different information. The
harness therefore separates three authorities:

1. **Source observation package:** what the selected environment or sensor
   actually supplied, with exact identity, frame, scale, time and provenance.
2. **Canonical portable object package:** a provider-neutral representation of
   geometry, appearance, composition, semantics and uncertainty. It may contain
   both measured samples and inferred candidate surfaces.
3. **Target realization plan:** an environment-specific compilation with an
   explicit approximation/loss report and separately admitted actions.

```text
Minecraft blocks / code / CAD / images / depth / LiDAR
                         │
                         ▼
             SourceObservationBundle
                         │
               normalize frames/units
                         ▼
              PortableObjectPackage
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   triangle mesh   Minecraft plan   CAD/fixture candidate
    + textures     + block palette   + constraints/BOM
          │              │              │
          └────── target loss reports ──┘
                         │
                  separate execution
                         │
                 postcondition evidence
```

The portable package is not a universal perfect 3D format. It is an evidence
container that can hold exact discrete structure, continuous geometry, images,
point samples, materials, semantic parts and unresolved regions together
without flattening their authority.

### Canonical traversal contracts

| Contract | Required content |
| --- | --- |
| `SourceObservationBundle` | owner/profile, source environment/object, producer epoch, timestamps, source coordinate frame, units, sensor/calibration identities, typed world facts, images/depth/point-cloud refs, consent, privacy class and hashes |
| `PortableObjectPackage` | package/revision, local object frame, scale anchors, discrete structure, geometry layers, material/texture layers, semantic parts, topology, classifications, confidence/uncertainty, source links and unresolved regions |
| `RepresentationLayer` | representation kind, fidelity, authority class, coordinate transform, bounds, resolution, provenance, generator and supersession history |
| `TargetEnvironmentProfile` | target units/grid, coordinate frame, available primitives/materials, build permissions, size/resource limits, unsupported features and adapter version |
| `TargetRealizationPlan` | package/target revisions, placement transform, selected representation, palette/component mapping, ordered candidate operations, resource estimate, approximation/loss report, preconditions and verification plan |
| `RealizationReceipt` | exact admitted actions and actor authority, resulting target object/region, postcondition observations, deviations, residual/loss metrics and non-terminal evidence refs |

Every representation layer retains the earlier HDH classifications. LiDAR or
depth samples may be `measured`; the surface meshed between them is normally
`inferred`; a repaired hole or stylized feature is `newly_designed`. A Minecraft
block-state export may be exact for the selected admitted region while a render
or screenshot of that region remains visual evidence only.

### Coordinate, scale and semantic normalization

Traversal requires an explicit transform chain rather than a guessed common
origin:

```text
source environment frame
  → selected object/region frame
  → canonical object frame
  → target placement frame
  → target environment frame
```

Each transform records handedness, axis convention, units or voxel scale,
origin/datum, rotation, scale, uncertainty and revision. A package with no
credible scale anchor may be visually reconstructed but cannot claim real-world
dimensions. Nonuniform scaling, coordinate clipping, voxel rounding and target
placement changes appear in the loss report.

Geometry alone is insufficient. The package may also record semantic parts,
connectivity, openings, support relationships, intended function and source-
specific behavior. These semantics are claims with provenance, not instructions.
For example, recognizing a Minecraft block arrangement as a “door” does not
authorize opening, replacing or rebuilding it.

### Minecraft source and target paths

For a Minecraft house used as a source, the preferred extraction path is typed
World Authority data for an explicitly bounded, authorized region:

- dimension/world, server and connector epoch;
- integer bounds and anchor block;
- block ids, properties, orientation and relevant structural relationships;
- separately governed block-entity data;
- palette and resource-pack identity where appearance matters; and
- synchronized screenshots only as auxiliary appearance evidence.

Signs, books, containers, player data, command blocks and other block-entity
content require minimization/redaction policy because they may contain private
text, inventory or executable behavior. Unsupported or withheld content remains
typed as unavailable rather than being inferred from a screenshot.

For Minecraft as a target, the adapter compiles a package into a candidate
voxelization and block palette. It records scale choice, occupancy error,
material substitutions, lost curvature/detail, unsupported behavior, required
resources and ordered build operations. The plan does not mutate the world.
Execution requires the normal selected player/world identity, World Authority
or Player Embodiment admission, effect ceilings, manual override, checkpoints,
postcondition sensing and terminal eligibility. A completed build receipt names
what blocks actually changed; it does not claim equivalence to the source
object beyond the measured target metrics.

The first deterministic Minecraft fixtures should cover:

1. exact bounded house export and import into an empty fixture world;
2. rotation, translation and integer-scale transforms;
3. round-trip block/state equality where the target palette is identical;
4. curved CAD/mesh to voxel approximation with a declared error envelope;
5. missing/modded blocks and palette substitution;
6. hidden/private block-entity exclusion;
7. interrupted build with checkpoint and rollback/recovery policy; and
8. post-build comparison against the exact target plan.

### Physical capture from a helmet or mobile sensor rig

A later helmet, mask or handheld rig may contribute cameras, stereo/depth or
LiDAR, but capture remains separate from motorcycle warning authority. The
capture session binds sensor calibration, intrinsics/extrinsics, head/rig pose,
timestamps, exposure/scan settings, coverage and subject/object selection.
Point clouds and depth maps are stored as calibrated observations; registration,
denoising, completion, semantic segmentation and mesh generation create derived
layers with their own hashes and classifications.

The operator must affirm that the object and space may be captured. People,
faces, identifying text, screens, license plates, homes, precise location and
private property invoke explicit minimization, redaction, retention and export
rules. Profile storage needs visible quota, provenance, expiry/export/delete
controls and revocation. No raw scan is automatically uploaded to an external
provider, attached to an Ask turn, or retained merely because a derived asset
was requested.

### Shared multimodal sensing, recording and guidance sessions

The platform capability is broader than a 3D scan. A real device or simulated
environment may expose several receptive modalities at once, while HUD, audio
or haptic outputs help the user conduct the capture. These streams need one
governed session identity without pretending they have the same evidentiary
meaning.

```text
physical or virtual hardware profile
├─ receptive inputs
│  ├─ RGB / infrared / event video
│  ├─ still images
│  ├─ microphone / spatial audio
│  ├─ depth / LiDAR / point cloud
│  ├─ IMU / pose / location
│  └─ typed simulator or world-state observations
├─ operator annotations
│  ├─ voice memo
│  ├─ text note
│  └─ marked object, region or event
└─ guidance outputs
   ├─ HUD coverage / placement / focus / range cues
   ├─ audio prompts or confirmation tones
   └─ optional haptic status
```

The shared primitive is a `MultimodalCaptureSession`, not an ambient recorder.
It binds the authenticated profile, hardware/environment profile, selected
subject or region, purpose, admitted modalities, source and producer epochs,
device/calibration identities, coordinate frames, time bases, consent,
retention, output destinations and stop conditions. Each track has an
independent permission, health, clock, encoding, classification and receipt.

The canonical contracts should include:

| Contract | Purpose |
| --- | --- |
| `MultimodalCaptureSession` | root identity, purpose, selected subject/region, profiles, clocks, consent, retention, admitted inputs/outputs and terminal state |
| `ModalityTrackManifest` | audio, image, video, depth, LiDAR, pose, typed-world or annotation track identity, format, frame/units, calibration, time span, health and artifact refs |
| `CrossModalAlignment` | source-clock to session-clock transforms, synchronization uncertainty, pose/frame bindings, gaps, drift and interpolation policy |
| `GuidanceLayerManifest` | HUD/audio/haptic guidance revision, triggering observation refs, output surface/lease, visibility interval and explicit no-measurement authority |
| `OperatorAnnotation` | voice/text/marker identity, author, capture time/range, related object/event refs, transcript derivation and command-ineligible default |
| `CapabilityRecipe` | user-authored graph connecting admitted sources, processors, guidance and sinks with bounds, leases, costs and failure policy |

Track evidence classes remain explicit:

| Track class | Authority boundary |
| --- | --- |
| `physical_measurement` | calibrated device samples within their measured uncertainty; no automatic semantic conclusion |
| `simulator_ground_truth` | exact only for the identified simulator/environment revision; no physical-sensor maturity |
| `synthetic_sensor` | emulated sensor output for testing; not simulator truth unless separately bound |
| `operator_annotation` | user-authored contextual evidence; a voice memo is not a measurement or command by default |
| `derived_inference` | recognition, transcript, segmentation, registration or reconstruction candidate with model/version/input provenance |
| `guidance_output` | HUD/audio/haptic assistance to the operator; never source or measurement authority |

A virtual environment may provide direct block, entity, depth, segmentation or
mesh facts that are unavailable to a physical camera. Those facts are valuable
oracle evidence but must remain labelled `simulator_ground_truth`. A renderer
that makes virtual video, noise, occlusion or LiDAR returns a separate
`synthetic_sensor` track so sensor algorithms can be evaluated against the
oracle without confusing the two.

#### HUD-guided capture without feedback contamination

An image-recognition or scan HUD may show coverage gaps, already-scanned areas,
range, pose quality, focus, exposure, object bounds, occlusion, alignment
targets, or where the user should stand next. It may also display a proposed
placement when reconstructing an object in Minecraft or another environment.
These are guidance layers rendered through the Surface Registry and bound to
the same session timeline.

The guidance layer must remain separate from the source track. Raw camera,
depth and LiDAR evidence is captured before the HUD overlay. A composed
operator-view recording is optional and explicitly labelled; it cannot replace
the clean source. Every guidance revision records the observation refs that
caused it, while the sensor sample records no dependency on the displayed
pixels. This prevents the system from detecting its own overlay and treating
that feedback as an object feature.

Guidance may influence where the human points or moves the sensor. That is an
attended capture action, not proof of coverage or accuracy. Coverage is measured
from admitted pose/sensor evidence and reported with uncertainty. Guidance must
clear on stale calibration, source loss, profile/epoch mismatch, manual blank,
Emergency Stop or output-lease loss without stopping preservation of already
admitted clean samples.

#### Audio, pictures, clips and voice memos

The user can compose bounded capture modes such as:

- one still photograph with pose/calibration metadata;
- a burst or bounded video segment;
- a bounded depth/LiDAR sweep with synchronized pose and optional clean video;
- a separately consented audio clip or spatial-audio track;
- a push-to-record voice memo linked to an object, scan interval, frame or
  target-placement proposal; or
- a multimodal scan recipe combining selected tracks and HUD guidance.

Microphone/system audio is not silently added to VSE-0B, whose current contract
continues to exclude audio. A future audio-capable track uses a distinct
permission and visible recording state. A transcript is `derived_inference`
linked to immutable audio; it carries language/model/confidence and redaction
metadata. Memo or transcript text re-enters Codex as an observation and is not
executed as a command unless the user makes a separate affirmative request
through the ordinary intent/tool-admission path.

Bystander speech, faces, screens, private interiors, precise location and
identifying marks require minimization and review. The session must support
per-track pause, stop, revoke, redact, retain, export and delete rather than one
all-or-nothing recording permission.

#### Capability composition keeps creativity with the user

Hardware profiles advertise capabilities rather than one fixed product
workflow. A `CapabilityRecipe` lets the user connect compatible modules:

```text
selected camera + LiDAR + IMU
        → synchronized scan processor
        → coverage estimator
        → HUD guidance surface
        → portable object package
        → profile storage
        → optional Minecraft target compiler
```

Another recipe could omit LiDAR, use exact Minecraft region data, add a voice
memo, render a placement preview, or produce only photographs. The harness
validates interfaces, identities, permissions, budgets and evidence roles; it
does not restrict creativity to a hard-coded helmet scenario.

Recipes are declarative proposed graphs, not private agent programs. Each node
names a catalogued capability, typed ports, bounds, resource/cost expectations,
required consent, failure behavior and output classification. Codex may propose
or configure a recipe under a user-issued project lease, but it cannot enable a
microphone, camera, external upload, physical output or environment mutation
outside the corresponding capability lease. The resident capture/watchdog
controller continues independently if model reasoning is delayed or offline.

#### Multimodal session UI/MCP projection

The Hardware Workspace and Surface Workspace should share a **Capture Session
Composer**:

```text
Session identity and purpose
├─ connected real/simulated hardware profile
├─ selected subject, object or region
├─ input tracks and individual permissions
├─ processors and derived tracks
├─ HUD/audio/haptic guidance outputs
├─ storage, retention, privacy and external-processing choices
├─ synchronized timeline and health
└─ stop, revoke, blank, export and delete controls
```

MCP exposes the same sanitized state and typed operations, not an alternative
recorder. A bound Codex thread can inspect capabilities, propose a recipe,
request an already-consented bounded capture, inspect manifests and compare
evidence. User UI and MCP commands use the same revisions and receipts. The
user may supervise every operation or issue a narrow time-, modality-, subject-
and-destination-bounded lease; monitoring is optional, consent is not.

### Connected reasoning and Shared Live Room sessions

A device does not need to contain the principal reasoning runtime to
participate. When it can authenticate to an authorized CasimirBot node or
deployment over the network, it may contribute selected capabilities and
receive supported products through a Shared Live Room. Managed Codex or GPT
Realtime reasoning additionally requires a usable Internet/provider path;
local capture, resident watchdogs and already-admitted reflex behavior must not
depend on that path remaining available.

```text
phone / helmet / laptop / simulated client
        │ authenticated room membership + revocable grants
        ▼
Shared Live Room
├─ selected multimodal evidence tracks
├─ participant speech, text and marked intent
├─ room-visible HUD / screen / mission projections
├─ one principal Runtime Codex lifecycle
├─ optional GPT Realtime conversational presentation
└─ one governed execution arbiter and terminal writer
        │
        ▼
host-owned connectors, profile storage and environment capabilities
```

This enables an authorized participant to continue from another location, but
"from anywhere" is a reachability goal rather than an ambient-access promise.
It still requires a reachable healthy node or approved hosted deployment,
authenticated account and room membership, current device trust, an explicit
grant for every shared source or sink, and a supported network path. A room
references owner-controlled connections; it does not acquire their credentials,
private network, filesystem, microphone, camera, environment or mutation
authority.

The canonical root should be a `ConnectedReasoningSession` binding:

- exact room, run, principal reasoning session and Ask-turn identities;
- participant/account, installed-node, device, source, connector-epoch and
  environment-subject identities;
- each published `MultimodalCaptureSession`, track, HUD/surface and voice
  projection by immutable reference rather than copied authority;
- per-participant read, publish, annotate, speak, steer, capture and action
  grants with expiry and revocation;
- session clock alignment, cursors, gaps, reconnect epochs and bounded replay;
- context-selection, compression and reasoning budgets;
- one execution arbiter, cancellation state, supported terminal product and
  presentation-certainty class; and
- visible recording/sharing state plus leave, mute, stop-sharing, revoke and
  Emergency Stop behavior.

Room members share admitted information flow, not hidden model reasoning.
Public observations, selected context, tool requests and results, evidence
references, goal/checkpoint state and the supported terminal product may be
projected to authorized participants. Private chain-of-thought, provider
credentials, pairing material, raw secrets and another participant's
ungranted tracks are never room content.

#### Information intake is a governed rate, not one token counter

It is useful to treat reasoning and perception as rate-limited flows, but the
rates must stay dimensionally distinct:

| Flow | Native rate | Governed quantity |
| --- | --- | --- |
| camera or shared screen | frames/s, pixels/s, bytes/s | selected frames, regions, deltas and visual evidence packets |
| audio or voice | samples/s and bytes/s | consented speech segments, transcripts, speaker/timing metadata and acoustic events |
| LiDAR/depth/pose | points/s or samples/s | bounded regions, keyframes, tracks, geometry deltas and uncertainty |
| typed environment state | observations or events/s | deduplicated state changes, salience and freshness |
| participant intent | utterances, turns or control events/min | ordered authorship, scope, priority, interruption and conflict state |
| model context intake | input tokens/turn and tokens/time window | admitted evidence summaries plus exact retrievable refs |
| model reasoning/output | latency and output tokens/s or turn | supported proposals, questions, explanations and terminal products |

Raw video, audio or point clouds are therefore not naively converted into and
charged as a continuous wall of language tokens. A deterministic intake plane
first preserves the bounded raw evidence, then performs sampling, change
detection, temporal segmentation, alignment, deduplication and compact typed
normalization. Codex receives the smallest current evidence set that can answer
the request, with exact references for governed follow-up inspection. Important
events may wake reasoning; low-information repetition should not.

An `InformationFlowBudget` should separately declare capture bandwidth,
processing capacity, retained bytes, evidence-event cadence, maximum context
tokens, reasoning turns, provider cost and end-to-end latency target. Pressure
may reduce preview quality, frame sampling, derived-analysis frequency or
noncritical callouts according to declared policy. It must not silently drop a
critical event, invent a summary, weaken consent, extend a recording, or make
voice certainty stronger than the supported text/evidence. Gaps and degraded
quality remain explicit evidence.

#### Intent, conversation and evidence remain different streams

Realtime voice supplies a low-latency conversation surface; it is not the room
execution authority. A finalized utterance is first bound to its speaker,
room, time range and consent state, then classified through ordinary intent
arbitration. Conversation-only speech may receive a conversational response.
An affirmative request for reasoning or a capability may open or continue the
principal Codex turn. A memo, quoted instruction, background speech, transcript
fragment or another participant's screen-visible text does not execute a tool.

Simultaneous participants require ordered, attributable intent rather than a
single merged prompt. Conflicting steering requests produce a typed conflict,
clarification or lease decision. Room ownership, moderator status or speaking
volume does not automatically grant environment mutation. The same rule
applies to screen sharing and video calls: shared pixels become consented live
source observations with provenance and freshness, never direct answers or
implicit control acts.

GPT Realtime may maintain conversational responsiveness while a Codex worker
performs grounded reasoning, but only the completed governed solver path may
author the supported result. Realtime presentation must correlate the exact
room, realtime interaction, Ask turn, selected terminal artifact and playback
receipt. It gains no workstation tools or independent terminal authority, and
it must remain able to render the same callout as text if voice is unavailable.

#### Connected-room UI and MCP parity

The Surface Workspace should expose a **Connected Session** panel with room and
run identity, participants, contributed devices/capabilities, currently shared
tracks, HUD/screen/video projections, voice state, intake/reasoning budgets,
health/gaps, leases, event timeline and stop/revoke controls. Each participant
must be able to see what that participant is publishing and who may receive it.

MCP exposes the same sanitized room graph, cursors and bounded operations. A
bound Codex task may inspect admitted room evidence, request a narrower sample,
propose a capture or reasoning configuration, and return products to allowed
surfaces. It cannot simulate panel clicks, join unseen sources, unmute devices,
expand membership, grant itself action authority or turn a relay message into
terminal evidence. The UI may be fully monitored by people, but routine
operation need not require them to manually relay every observation.

### Connected reasoning session staged program

| Phase | Build | Required evidence | Promotion boundary |
| --- | --- | --- | --- |
| CRS-0A | connected-session, room-track, participant-intent, rate-budget and projection contracts | canonical/hash fixtures, exact identity graph, independent grants, dimensioned rates, cursor/gap/reconnect behavior and poison cases | contracts only; no remote media |
| CRS-0B | one installed node with one remote authenticated observer/steerer | same run/evidence/terminal projection, revoke/leave/reconnect, device loss, network degradation and zero duplicate effects | exact tested single-node journey only |
| CRS-0C | multi-participant voice/text and shared multimodal evidence | speaker/author attribution, consent, conflict arbitration, transcript/memo separation, context selection and certainty/playback parity | no implicit action or multi-host claim |
| CRS-0D | bounded screen share/video-call and HUD surface projection | visible sharing state, clean-source/composed-view separation, source identity audit, adaptive rate behavior and stop/revoke guarantees | attended shared-source use only |
| CRS-0E | multi-host contributed capabilities through one room | independent node/profile/device credentials and grants, partition/rejoin, serialized execution, principal reasoning and terminal continuity | requires the separate multi-host acceptance program; no ambient federation |

### Multimodal sensing and guidance staged program

| Phase | Build | Required evidence | Promotion boundary |
| --- | --- | --- | --- |
| MSH-0A | multimodal session, track, alignment, annotation, guidance and capability-recipe contracts | schema/hash fixtures, real/simulated classification, independent permissions, clock/frame uncertainty, source/guidance separation and poison cases | contracts only; no live capture |
| MSH-0B | developer Capture Session Composer with hardware/environment capability discovery and UI/MCP parity | profile/source/epoch/revision identity, per-track consent, lease/revoke/sign-out, visible recording state, unavailable capabilities and no panel-click automation | configuration only |
| MSH-0C | local still/video/audio/memo tracks with profile storage | bounded duration/bytes, device selection, per-track pause/stop/delete/export, privacy/redaction, transcript provenance and VSE audio non-regression | local captured evidence only |
| MSH-0D | depth/LiDAR/pose synchronization and HUD-guided scan controller | calibration fixtures, cross-clock drift, coverage/residual metrics, clean-versus-composed separation, stale blanking and model-offline continuity | attended scan assistance only |
| MSH-0E | simulated multimodal adapters and oracle/synthetic differential harness | exact simulator identity, oracle/sensor separation, deterministic noise/occlusion/replay and cross-source comparison | simulator evidence only; no physical maturity |
| MSH-0F | portable-package and target-realization integration | exact session/package/target bindings, bounded Codex evidence re-entry, external-processing leases, postconditions and complete authority trace | exact tested journey only |

### Image-to-3D and Meshy-like adapters

A provider such as Meshy may be one target reconstruction adapter; its current
official API/MCP surface includes image and multi-image to 3D generation. It is
not a required dependency or a geometry authority. The harness supplies only a
user-approved, minimized input bundle under an explicit external-processing and
cost lease, then records provider/model version, request hash, output hashes,
formats, task receipt and deletion/retention status.

Provider output enters the package as `inferred` candidate mesh/texture data.
It must be aligned and scaled from admitted anchors, compared with source views
or point samples, checked for topology/holes/nonmanifold geometry, and kept
separate from the immutable source evidence. Provider success proves only that
an asset was returned. Blender or another CAD/mesh adapter may inspect, repair
or retopologize it through a later revision, but cannot relabel it as measured.

### Code- and CAD-defined objects moving into virtual environments

The reverse path starts with an exact code, parametric CAD or component-graph
revision. A target adapter reads its declared geometry and semantics, selects a
supported representation, and emits an environment-specific realization plan.
For Minecraft this may mean voxelization, block palette selection and build
sequencing. For a game engine it may mean a mesh/material/collider package. For
an optical simulator it may mean surfaces, indices and transforms. Each target
is allowed to produce a resemblance appropriate to its capabilities; none may
silently replace engineering dimensions or behavior with visual similarity.

This dialogue is useful to research because a theory/device concept can be
expressed at several scale bands: equations and predicted observables, code and
simulation, geometric apparatus, virtual mock-up, bench article and instrument
evidence. The Theory Badge Graph can locate and retrieve those related objects,
but traversal edges carry representation and claim ceilings rather than proof.

### Traversal UI/MCP and surface integration

The Hardware Workspace should gain an **Object Traversal** view with:

```text
Source
├─ environment/object/region identity
├─ admitted sensors and coverage
└─ privacy, retention and consent
Portable package
├─ representation layers
├─ frames, scale and semantic parts
├─ provenance/classification
└─ uncertainty and unresolved regions
Targets
├─ mesh/CAD reconstruction
├─ Minecraft realization
├─ simulator/game representation
└─ fabrication candidate
Evidence
├─ source/target comparisons
├─ loss and residual reports
└─ execution/postcondition receipts
```

The same project/package state is exposed through provider-neutral MCP tools.
Codex may request bounded source inspection, package compilation, reconstruction,
comparison or target-plan generation. External upload, costly generation and
target mutation require distinct leases. Tool results re-enter Codex as
observations; Helix owns evidence identity and terminal eligibility. The Surface
Registry can host source images, point-cloud/mesh viewers, fixed-camera renders,
voxel previews and source/target overlays. VSE can preserve bounded visual
comparisons, but neither panel pixels nor generated captions become geometry or
world-state authority.

### EOT staged program and acceptance metrics

| Phase | Build | Required evidence | Promotion boundary |
| --- | --- | --- | --- |
| EOT-0A | portable source/package/representation/target-plan/receipt schemas and canonical hashing | unit/frame/classification fixtures, profile/source/epoch isolation, immutable source layers, package supersession and poison cases | representation metadata only |
| EOT-0B | exact Minecraft bounded-region exporter and non-mutating target compiler | vanilla/modded fixtures, block/state round trip, private block-entity policy, transforms, palette/loss reports and zero unauthorized mutation | Minecraft observation and plan only |
| EOT-0C | local image/depth/point-cloud ingestion and reconstruction comparison | calibrated fixtures, coverage, registration residuals, scale-anchor failure, source/derived separation and bounded retention | local candidate reconstruction only |
| EOT-0D | user-connected external image/multi-image-to-3D adapter | consent/cost/upload lease, provider/version/input/output receipts, deletion policy, failure/timeout handling and no credential exposure | inferred external asset only |
| EOT-0E | code/CAD-to-target compilers plus Hardware Workspace UI/MCP parity | fixed revisions, target profiles, deterministic transforms, loss reports, stale conflicts, context poison and no panel-click automation | target plans only |
| EOT-0F | separately admitted realization and round-trip verification | exact action authority, checkpoints, interruption, postconditions, residual metrics, negative evidence and model-unavailable continuity | exact tested environment/configuration only |

Core metrics include source coverage, scale and transform uncertainty, point-to-
surface residual, silhouette/feature error, occupancy intersection-over-union,
topology defects, block/state equality, palette substitution count, semantic
part retention, unsupported feature count, target resource/action estimate,
realization deviation and postcondition completeness. A single similarity score
must not hide which representation properties were lost.

## Helmet CAD and optical lane

### Preferred optical stack

```text
ROAD / WORLD
     ↓
ordinary outer visor — weather and impact role unchanged
     ↓  provisional 5–12 mm gap
removable inner HUD combiner — controlled optical role
     ↓  provisional 35–55 mm eye relief
eye / instrumented headform camera

projector → optional fold mirror → inner combiner → eye
```

Direct reflection from a stock outer visor is permitted only as a P0 optical
bench experiment. A reflective band bonded to an outer visor is not part of the
first wearable geometry. The preferred P1/P2 architecture is the separate
inner combiner because its curvature, angle, reflectance, mounting, and
calibration can be controlled without making the movable weather visor the
calibrated optical surface.

### Provisional CAD envelopes

These are starting keep-out volumes, not fitted dimensions or manufacturing
requirements:

| Region | Starting envelope |
| --- | --- |
| inner combiner optical zone | 180–200 mm wide × 50–70 mm tall |
| combiner substrate | approximately 1–2 mm before optical/manufacturing review |
| outer visor to combiner | 5–12 mm |
| eye to combiner | 35–55 mm |
| brow projector cavity | 45–60 W × 20–30 H × 35–50 D mm |
| chin projector cavity | 45–60 W × 30–40 H × 50–70 D mm |
| fold-optic allowance | 15–30 mm |
| central ordinary graphic exclusion | approximately ±20–25° horizontal |

All values must be replaced or bounded by a helmet scan, multiple reference
headforms, eye locations, visor travel, nose/eyelash clearance, don/doff motion,
vent paths, and manufacturing tolerances.

### CAD configuration tree

```text
MHUD_HEADFORM_ASSEMBLY
├─ reference_headform_and_eye_box
├─ helmet_reference_surfaces_nonmodifiable
│  ├─ shell_keep_out
│  ├─ EPS_keep_out
│  ├─ comfort_liner_keep_out
│  └─ outer_visor_swept_volume
├─ combiner_module_removable
│  ├─ optical_surface
│  ├─ compliant_edge_and_retention
│  └─ datum_and_calibration_features
├─ optical_engine_option_A_chin
│  ├─ projector_keep_out
│  ├─ fold_mirror
│  └─ stray_light_baffles
├─ optical_engine_option_B_brow
├─ cable_and_breakaway_route
├─ thermal_keep_out_and_skin-contact_limits
└─ instrumentation
   ├─ eye_box_camera
   ├─ photometer_fixture
   └─ pose/calibration targets
```

Chin and brow remain alternatives through optical bench comparison. The
comparison records mass distribution, usable optical path, eye-box, brightness,
ghosting, obstruction, thermal path, serviceability, and visor interference.
It does not select a wearable location from packaging convenience alone.

### CAD stop/fail conditions

Stop the configuration if it:

- requires removing, drilling, cutting, compressing, heating, or bonding to the
  helmet shell or EPS;
- introduces an unreviewed rigid internal projection or sharp edge;
- intersects the outer visor swept volume, don/doff path, face, eyelashes, nose,
  ventilation, retention system, or emergency-removal path;
- blocks the required sight-line fixture or creates a persistent opaque region;
- cannot detach or fail safely under its defined retention concept;
- creates an unbounded hot surface, battery hazard, snag loop, or concentrated
  contact load; or
- needs calibration after every ordinary visor movement.

## Programming environment lane

### Separation of environments

The software program contains five separate runtimes rather than one large app:

| Runtime | Purpose | Inputs | Outputs | Safety authority |
| --- | --- | --- | --- | --- |
| replay/simulator | generate and replay deterministic traffic and pose cases | fixture tracks, synthetic scenarios | expected threats and cues | none |
| embedded reflex runtime | meet bounded timing and freshness policy | normalized tracks and pose | admitted `HudCue` plus receipt | display cues only |
| governed HUD surface host | compose a versioned HUD scene with an optional admitted program, tab, camera, or simulator underlay | `HudScene`, source frames, viewport mode, transform reference | developer preview, clean projector feed, and render receipts | pixels only; no source-program input authority |
| operator/calibration app | configure fixture, inspect timing, align optics, export evidence | run config and receipts | calibration and reports | no threat invention |
| CasimirBot adapter | expose governed observations and digests to Runtime Codex | compact events and evidence refs | advisory interpretation and predeclared requests | no reflex or vehicle authority |

No runtime may privately sample an LLM, execute arbitrary tools, manufacture an
answer from a receipt, or bypass Helix admission. The adapter reuses the generic
resident-controller lifecycle after its motorcycle profile is specified; it
does not copy Minecraft action vocabulary.

### Proposed repository shape

```text
shared/helix-motorcycle-awareness.ts
shared/helix-hud-surface.ts                              # reusable upper-tree contracts
connectors/environment/examples/motorcycle-awareness/
fixtures/environment-source/motorcycle-awareness/
server/services/environment-connectors/conformance/__tests__/
server/services/hud-surface-host/                        # source admission + composition receipts
client/src/components/workstation/hud-surface/           # reusable developer-only host
client/src/components/workstation/motorcycle-awareness/   # developer-only lab panel
simulators/fivem/motorcycle-awareness/                    # resource + scenario fixtures
hardware/motorcycle-hud/cad/                              # neutral CAD exports + source
hardware/motorcycle-hud/electrical/
firmware/motorcycle-hud-renderer/
docs/runbooks/motorcycle-hud-optical-bench.md
```

This is a reservation, not authorization to create every surface in one patch.
Each implementation packet chooses one phase and verifies its first-divergence
lifecycle stage.

### Reusable upper-tree capability: governed HUD surface host

Program gate: G8 — environment-harness release evaluation; parallel visual-surface design lane that cannot substitute for G8 closure
Workstream: reusable environment display and projection surfaces
Capability or component: developer-only governed HUD surface host (`HUDH-0`)
Lifecycle stage: source admission → frame normalization → HUD-scene composition → output admission → render receipt
Reaction timescale: display-rate composition; source-specific reflex and reasoning remain outside the host
Authority owner: Helix owns source identity, admission, freshness, provenance, and output eligibility; the HUD profile owns bounded scene semantics; the host owns pixels only; the operator owns source selection and blanking
Current maturity: specified
Target maturity: deterministically verified
Required evidence: contract tests, alpha-composition golden frames, source-switch and stale-frame tests, permission/identity tests, clean-feed isolation, and exact render receipts
Explicit non-goals: universal arbitrary-program embedding, program input/control, camera truth claims, optical calibration, road use, hidden reasoning display, or safety certification
Downstream gate unlocked: reusable live-source HUD profiles and a clean projector-output adapter; no environment or safety maturity is inherited

The motorcycle HUD is the first reference profile, not the owner of this
capability. The reusable host sits above individual environment adapters so the
same bounded scene and composition lifecycle can support later navigation,
maintenance, laboratory, accessibility, or mission HUDs without copying a new
renderer and source-capture stack into every panel.

```text
program/tab adapter ─┐
camera adapter ──────┼─> admitted SurfaceFrame ─┐
simulator/replay ────┘                          │
                                               ├─> HUD surface compositor
profile controller ─────> admitted HudScene ───┘          │
                                                          ├─> workstation preview
                                                          ├─> clean projector feed
                                                          └─> evidence/recording sink
```

The host supports four explicit composition modes:

| Mode | Underlay | HUD scene | Intended first use |
| --- | --- | --- | --- |
| `hud_only_alpha` | transparent | visible | optical-see-through projector or alpha-capable downstream compositor |
| `hud_on_black` | black calibration field | visible | projector-source inspection and optical bench |
| `hud_over_source` | admitted tab/program/camera/simulator frame | visible | virtual testing, video-passthrough research, and operator preview |
| `source_only` | admitted source frame | hidden | alignment, latency, crop, and source-diagnostic work only |

“Empty space” is therefore not one ambiguous behavior. For an optical-see-through
combiner it is alpha/transparent and the rider sees the world directly. For a
video-passthrough experiment it is an admitted camera or program frame. For an
optical bench it may be black. The selected mode, source binding, scene hash,
viewport, and transform reference must appear in every render receipt.

The normalized HUD plane remains independent of the final physical surface.
Profiles author cue geometry in a stable normalized viewport. A later
`ProjectionTransformRef` may describe visor curvature, lens distortion, crop,
eye-box calibration, or projector orientation without changing threat logic or
the canonical scene. An unconcluded CAD design therefore cannot leak provisional
skew into the shared renderer.

The initial contracts should distinguish at least:

- `SurfaceSourceBinding`: exact profile, run, producer epoch, source kind
  (`none`, `tab`, `program`, `camera`, `simulator`, or `replay`), opaque locator
  reference, permission state, and retention policy;
- `SurfaceFrame`: frame identity, monotonic media time, dimensions, color space,
  alpha semantics, capture age, provenance reference, and content classification;
- `HudScene`: versioned normalized primitives and cue-set hash produced by the
  profile controller;
- `ProjectionViewport`: composition mode, normalized crop, safe region,
  transform reference, and output dimensions; and
- `SurfaceRenderReceipt`: source-frame hash, HUD-scene hash, transform reference,
  output target, admission result, blank/degraded reason, and render timing.

The source path must be capability-aware rather than pretending every program
can be placed in an iframe. The implementation order is:

1. native scene providers that render directly from typed state;
2. explicitly allowed same-origin or embeddable web content;
3. permissioned pixel capture for an incompatible browser tab or external
   program; and
4. permissioned camera `MediaStream` input.

Content-Security-Policy, frame-ancestor rules, authentication boundaries, DRM,
protected surfaces, operating-system capture consent, and unavailable alpha may
make a particular source non-hostable. That must return a typed unavailable or
denied state, never a spoofed preview. Credentials, cookies, raw authorization
headers, and sensitive-field contents do not enter HUD scene state or receipts.

Observation and action authority stay separate. Seeing or hosting a program tab
does not grant clicks, keystrokes, navigation, camera control, or environment
mutation. Any such input requires the program's separate adapter contract,
operator intent, admission policy, and finite action lease. Likewise, a rendered
surface is a projection, not an observation receipt, model answer, or safety
verdict.

The first host remains developer-only. It provides a bounded source picker,
composition-mode picker, normalized viewport, source-health strip, Emergency
Blank, and a detachable clean-feed route with no workstation chrome. Public
`user` exposure, unrestricted URL entry, arbitrary window capture, and physical
projector output require later packets and explicit policy review.

Fail-closed behavior is source-aware:

- HUD cue TTL, watchdog, and manual blanking remain authoritative regardless of
  the visual underlay;
- a stale optional underlay is visibly marked or removed without extending any
  HUD cue;
- a source declared required for registration blanks the composed output when
  stale or epoch-mismatched;
- switching source or profile rotates the producer epoch and requires a fresh
  snapshot; and
- loss of the workstation preview cannot silently keep an unobserved clean-feed
  lease alive.

### Game HUDs, realtime textures, tab hosting, and fullscreen

The governed HUD surface host is display-domain infrastructure, not a helmet
simulator. An in-game HUD, a desktop application HUD, a camera-backed research
display, and the motorcycle combiner preview all use the same stacking model.
Their profile semantics, source permissions, output targets, transforms, and
acceptance claims remain separate.

The repository's existing Realtime Texture Pack is the first reusable dynamic
texture producer for this host. Its canonical packet is
`docs/work-packets/eh-g8-realtime-texture-pack-v1.md`. That lane already freezes
selected-window consent, exact source/projection identity, latest-frame-only
admission, stale fallback, immediate reveal/stop, and the rule that transformed
pixels are `non_authoritative_projection`. The HUD host must consume those
contracts through an adapter rather than creating another capture, provider,
credential, or overlay lifecycle.

The canonical layer order is:

```text
layer 0  untouched admitted source frame         optional underlay / truth copy
layer 1  Realtime Texture Pack projection frame  optional non-authoritative texture
layer 2  profile HudScene                         normalized semantic HUD graphics
layer 3  diagnostics and workstation chrome      preview only; excluded from clean feed
```

Layer 1 never replaces layer 0 in evidence storage or sensor reasoning. A model-
generated, transformed, interpolated, or stylized frame cannot become camera,
game-truth, radar, lidar, OCR, or environment evidence. HUD decisions continue
to consume their admitted observation contracts, not pixels recovered from the
texture projection. `Reveal original` removes layer 1 without altering the HUD
scene; `Emergency Blank` removes layer 2 and releases its output lease without
rewriting either source identity.

The panel host should expose three presentation targets backed by the same
composition state:

1. **Tabbed preview:** the normal developer workstation panel, including source,
   layer, freshness, timing, and receipt controls around the viewport.
2. **Panel fullscreen:** the selected workstation panel occupies the available
   application viewport, with an always-recoverable exit path and Emergency
   Blank. This is a presentation/layout state, not browser or game authority.
3. **Clean feed:** a detachable or routable output containing only admitted
   visual layers, with no tabs, controls, notifications, cursor, reasoning text,
   or workstation chrome. A later projector, game overlay, recorder, or virtual
   display adapter consumes this target.

Panel fullscreen is distinct from exclusive-fullscreen capture. The current
Realtime Texture Pack packet explicitly excludes exclusive-fullscreen support,
game injection, and anti-cheat bypass. The first implementation therefore uses
the workstation's existing fullscreen window state and only sources that the
installed capture picker can identify and capture. An unavailable exclusive-
fullscreen game returns a typed unsupported-source receipt; it does not broaden
capture privileges or trigger a different capture method.

The tab is a governed container, not merely a link to another page. It binds one
HUD profile, one source session, one layer stack, one normalized viewport, and
one output lease. Going fullscreen must retain those identities and must not
restart capture, rotate scene semantics, or silently select a different source.
Leaving fullscreen restores the same tab state. Closing the tab, changing the
source, signing out, revoking capture, or using Emergency Blank releases the
applicable clean-feed and capture leases according to policy.

Realtime texture integration must measure and expose separate ages for source
capture, texture projection, HUD scene, and final composition. A slow texture
provider may degrade or reveal the original underlay while the deterministic HUD
continues at its own admitted cadence. It cannot reduce the reflex controller to
the texture frame rate or hold a cue past TTL. Tests must cover alpha blending,
z-order, aspect-ratio contain/crop, resize, device-pixel ratio, source loss,
projection staleness, HUD staleness, fullscreen enter/exit, clean-feed isolation,
and independent stop/reveal/blank controls.

### Shared UI and MCP surface orchestration

Program gate: G8 — environment-harness release evaluation; parallel display-orchestration design lane that cannot substitute for G8 closure
Workstream: shared surface registry, operator panels, MCP capability projection, and output routing
Capability or component: Surface Orchestration MCP and developer Surface Workspace (`HUDH-0C`)
Lifecycle stage: capability discovery → desired-state proposal → source/tool admission → surface mutation → observation receipt → UI/MCP projection → verification
Reaction timescale: interactive configuration and asynchronous evidence handling; never the motorcycle reflex deadline or a replacement for a resident controller
Authority owner: Helix owns identity, source/tool admission, leases, provenance, receipts, and terminal eligibility; Codex owns generic tool choice and result re-entry; the operator owns consent, revocation, manual override, Emergency Blank, and policy ceilings
Current maturity: specified
Target maturity: deterministically verified
Required evidence: one canonical registry shared by UI and MCP, contract parity tests, exact source/profile/epoch/output binding, typed cross-panel handoff, scoped consent and lease tests, revocation and sign-out cleanup, stale-revision rejection, receipt re-entry, developer policy, and proof that UI projection is not action or answer authority
Explicit non-goals: MCP-driven UI clicking, a second private agent loop, hidden capture, ambient desktop recording, silent permission expansion, arbitrary program input, unrestricted host access, model-written reflex cues, terminal answers authored by panels or receipts, physical projector acceptance, or safety certification
Downstream gate unlocked: modular HUD profiles, selected-source composition, VSE inspection, Codex-assisted configuration, and clean-output adapters can share one governed surface lifecycle without duplicating capture or authority logic

The canonical design rule is:

> Workstation panels and MCP tools are equal clients of one versioned surface
> harness. A panel must not privately own a capability, and MCP must not automate
> panel clicks or maintain a second configuration state.

```text
                         Surface Harness
              desired state + admission + receipts
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
          Workstation UI     MCP capability    clean outputs
          human client       Codex client      projector/game/
                 │                │             recorder/display
                 └────── same registry state ─────┘
```

The surface harness is the system of record. Panels render its state and submit
typed commands. MCP exposes the same commands and observations to an exactly
bound Codex thread. A change made through MCP appears immediately in the
relevant panels; a user change appears in the next MCP read. Neither projection
may overwrite a newer registry revision, conceal the acting principal, or
manufacture a successful receipt.

#### Canonical UI homes

Capabilities may be launched or summarized from several panels, but each has
one canonical human-facing home:

| Capability | Canonical home | Responsibility |
| --- | --- | --- |
| source permission, binding, and health | existing **Situation Room Sources** | source discovery, consent state, source/producer epoch, freshness, retention, and revoke |
| generic HUD composition and output routing | new developer **HUD Surface Studio** | profile/source selection, layer stack, composition mode, normalized viewport, transform reference, output leases, blanking, and receipt inspection |
| bounded clips, captures, frames, and contact sheets | new developer **Visual Evidence** panel | VSE import/capture history, frame selection, alignment and provenance inspection, retention, deletion, and explicit promotion to a reasoning request |
| environment-specific semantics and fixtures | profile labs such as **Motorcycle HUD Lab** | motorcycle controller fixtures, threat/cue behavior, domain diagnostics, and a projection of its bound shared HUD surface |
| transformed visual producer | existing Realtime Texture Pack controls through an adapter | layer-1 producer state, reveal-original, projection freshness, and generated-pixel boundary |
| model reasoning and explanation | Helix Ask / bound Codex thread | admitted tool use, evidence re-entry, follow-up reasoning, advisory output, and terminal synthesis |
| projector, game overlay, recorder, or secondary display pixels | dedicated **Clean Feed** route/window, not a control panel | chrome-free output from one admitted surface/output lease with an always-available revoke/blank owner elsewhere |

Motorcycle HUD Lab may continue to embed compact HUD and VSE controls for local
development convenience. Those controls are projections of the shared surface
and evidence services, not motorcycle-owned implementations. Other HUD profiles
must reuse the same registry and canonical panels rather than copying the
capture, composition, routing, or Codex integration stack.

#### Typed cross-panel and output handoff

Opening a panel by identifier is insufficient when a request refers to a
particular surface or artifact. Add a versioned, non-secret `PanelLaunchContext`
or equivalent handoff containing only admitted identifiers:

```text
panel_id
surface_instance_id
surface_revision
profile_id
run_id
source_id
producer_epoch
sequence_id
output_lease_id
requested_view
focus_target
```

The receiving panel resolves those identifiers from the registry under the
current account policy. Handoff data contains no pixels, credentials, cookies,
authorization headers, pairing material, private model reasoning, or authority.
Missing, unauthorized, expired, stale, or epoch-mismatched targets fail closed.
Workstation tab focus, URL/deep-link restoration, native guidance, and MCP-
directed presentation should all use the same handoff schema.

The Clean Feed is a routable output target rather than another copy of the
control UI. It binds exactly one surface instance, registry revision, profile,
source/producer epoch, transform, and finite output lease. Fullscreen,
detachment, projector routing, game-overlay routing, and return to a tab
preserve those identities. Closing the owner panel, signing out, revoking the
source, Emergency Blank, or losing the output consumer releases or blanks the
lease according to policy.

#### Surface Orchestration MCP capability family

The first provider-neutral MCP projection should expose bounded operations
equivalent to the UI, with final names owned by the MCP capability catalog:

```text
surface.list
surface.inspect
surface.create
surface.configure
surface.bind_source
surface.bind_profile
surface.set_composition
surface.route_output
surface.blank
surface.release
surface.receipts
visual_sequence.capture_start
visual_sequence.capture_stop
visual_sequence.capture_revoke
visual_sequence.inspect
visual_sequence.select_frames
panel.open_with_context
```

Read tools return exact registry revision, source and producer epoch, freshness,
permission, output health, and receipt references. Mutating tools require an
affirmative operator request or an unexpired task-scoped lease, expected prior
revision, exact target identity, finite effect, and verifiable postcondition.
Concurrent or stale writes return a typed conflict and current state; Codex may
re-read and replan through its normal tool loop, but Helix must not implement a
private retry or sampling loop.

MCP exposure means a bound Codex thread can discover admitted capabilities,
configure a complete surface, route its preview, request a bounded capture,
inspect the resulting VSE artifact, make permitted parameter changes, and
verify final registry state without requiring the user to operate every panel.
The panels remain available for direct manual use and continuously project who
changed what, current leases, progress, degraded states, and exact receipts.
Monitoring is optional; auditability, Stop, Revoke, and Emergency Blank are not.

#### Consent and unattended bounded operation

The operator may perform each step directly, supervise Codex, or grant a narrow
lease that lets Codex finish a request unattended. A lease declares the bound
account/thread, allowed source and surface, admitted operations, duration,
retention, output targets, effect ceilings, and stop conditions. It cannot be
expanded by Codex or inferred from a previous unrelated session.

OS/browser source pickers, first camera or display permission, protected or
sensitive content clearance, microphone/system audio, public-space capture,
and any new physical output may still require an explicit user gesture or
separate consent. An existing admitted source lease may be reused only within
its exact scope and epoch. User stop/revoke, sign-out, source change, producer-
epoch rotation, profile change, stale heartbeat, required owner-panel closure,
or Emergency Blank supersedes Codex immediately and generates a terminal
cleanup receipt.

The Surface Orchestration MCP is a thin capability adapter, not a Helix-owned
agent runtime. Codex owns tool selection, generic execution sequencing, result
re-entry, retries, compaction, and terminal completion. Helix owns prompt and
intent policy, source/tool admission, evidence identity, provenance, route
contracts, terminal eligibility, and debug traces. Surface receipts are
observations, never answers; visual pixels and panel-generated text cannot
authorize another tool call merely because they contain control words.

#### Minimum orchestration acceptance journeys

1. **Manual parity:** configure the same frozen HUD surface once through HUD
   Surface Studio and once through MCP; canonical desired state and receipt
   fields match apart from principal/request identifiers.
2. **Codex unattended within lease:** from a natural request, the bound thread
   lists sources, binds an admitted Minecraft window and motorcycle profile,
   routes a tab preview, captures ten seconds, inspects VSE frames, applies one
   permitted HUD parameter change, verifies it, and returns receipt references
   without panel clicking.
3. **Human takeover:** while Codex is configuring a surface, the user changes a
   newer revision or presses Blank; the stale MCP mutation is rejected and the
   UI retains the newer revision.
4. **Revocation:** source consent or the output lease is revoked during capture;
   tracks and output are released, no partial artifact is promoted, and both UI
   and MCP show the same terminal reason.
5. **Identity rotation:** a source reconnect changes producer epoch; prior
   frames, output leases, handoffs, and pending mutations cannot attach to the
   replacement source without fresh admission.
6. **Contextual-text poison case:** captured pixels or panel text say “start,”
   “click,” or “route output”; no mutating tool is admitted without affirmative
   operator intent and the solver trace records the text as observation only.
7. **Model unavailable:** panels and deterministic HUD/controller behavior
   remain usable, manual capture remains available, active safe outputs follow
   their leases, and only Codex reasoning/configuration becomes unavailable.

### Bounded visual-sequence evidence for Codex

Program gate: G8 — environment-harness release evaluation; parallel read-only visual-evidence lane that cannot substitute for live-source acceptance
Workstream: short video ingestion, selected-surface capture, frame sampling, and governed visual reasoning
Capability or component: Visual Sequence Evidence (`VSE-0`)
Lifecycle stage: owner source selection → bounded capture/upload admission → deterministic decode → frame sampling → immutable sequence manifest → tool admission → visual evidence re-entry → follow-up reasoning
Reaction timescale: offline or short-window analysis; never part of the motorcycle reflex loop or HUD render deadline
Authority owner: the owner controls capture/upload, retention, and stop; the decoder owns deterministic media conversion only; Helix owns source identity, sampling provenance, tool admission, evidence re-entry, and terminal eligibility; Runtime Codex owns follow-up reasoning only
Current maturity: specified
Target maturity: deterministically verified
Required evidence: clip identity and limits, deterministic sampling fixtures, timestamps and hashes, corruption/codec/rotation/VFR cases, consent and retention tests, bounded frame retrieval, vision-capability negotiation, source/environment alignment, poison audit, and exact re-entry/terminal traces
Explicit non-goals: continuous covert screen sharing, unrestricted surveillance, sending every decoded frame to a model, treating generated pixels as source truth, hidden-reasoning inspection, autonomous hot-patching of safety cues, tutorial instructions as action authority, or video evidence as a substitute for environment state
Downstream gate unlocked: short visual-sequence inspection tools, HUD/render comparison, and candidate procedure extraction; no environment, controller, optical, or safety maturity is inherited

This belongs beside the HUD surface host because both consume versioned visual
layers, but it is a separate observation/evidence capability. The HUD host emits
pixels. VSE-0 samples and indexes selected pixels for later reasoning. Neither
component becomes the other's authority owner.

The repository already contains useful lower-level contracts and surfaces:

- `HelixVisualSnapshotSource` for manual, interval, or salience-triggered screen,
  window, camera, Minecraft-client, and manual-upload sources;
- `HelixVisualFrameRecord` and `HelixVisualFrameEvidence` for individual frame
  provenance and compact model observations;
- `HelixVisualProducerCadence` for bounded capture scheduling;
- `HelixVisualEventAlignment` for relating frames to environment events;
- `HelixSelectedVisualSceneSet` for selecting relevant scene memories; and
- Live Answer frame history, explicit frame attachment, Image Lens handoff, and
  Stage Play live-source mail/re-entry surfaces.

VSE-0 extends these contracts with a sequence-level artifact. It must not create
a competing capture lifecycle or private model loop.

#### First bounded input modes

1. **Uploaded clip:** owner-provided local video, at most 30 seconds for VSE-0A.
2. **Selected HUD clean feed:** capture only the HUD host's exact clean-feed
   target for a 10-second default or 15-second maximum window.
3. **Selected composed feed:** capture source/texture/HUD layers together while
   recording the matching `SurfaceRenderReceipt` timeline.
4. **Selected application or Minecraft window:** use the existing consented
   visual-source selector for a 10- or 15-second bounded capture, not an ambient
   desktop-wide recorder.

Starting limits are prototype safety and cost envelopes, not product promises:

- one active capture or decode job per developer thread;
- 10-second default and 15-second maximum selected-surface capture;
- 30-second maximum uploaded clip;
- bounded decoded dimensions and byte count negotiated before extraction;
- no more than 16 full-resolution sampled frames admitted to one model turn;
- a compact contact sheet and manifest may represent a larger candidate set; and
- raw clips and frames are ephemeral by default unless the owner explicitly
  selects debug retention or profile opt-in.

#### Sampling policy

Sampling must be timestamp-based by default because uploaded and captured media
may use variable frame rates. “Every fifth frame” is available only as an exact
diagnostic stride over a known decoded frame index; it is not the general time
sampling contract.

The first policies are:

| Policy | Selection | Use |
| --- | --- | --- |
| `uniform_time` | fixed temporal cadence such as one frame per second | simple 10-second overview and deterministic baseline |
| `uniform_count` | evenly choose a bounded count across the clip | comparison across clips of different duration |
| `exact_stride` | every Nth decoded frame with frame index and PTS retained | codec/renderer debugging only |
| `scene_change` | bounded candidates around measured visual change | menus, cuts, generation failures, and state transitions |
| `event_aligned` | frames before/at/after exact HUD, environment, or receipt events | cue timing and Minecraft action verification |
| `adaptive_review` | contact sheet first, then a bounded second retrieval around selected timestamps | vision-model investigation without flooding context |

The first 10-second fixture should produce ten one-second baseline frames plus a
contact sheet. A second fixture should place a brief HUD transition between two
uniform samples and prove that event-aligned or scene-change selection retrieves
the missed transition. This establishes why a selectable policy is necessary.

#### Sequence artifact and model tool surface

Do not create one opaque “file containing all frames” as the only interface.
Create an immutable directory or archive with addressable artifacts:

```text
visual-sequence/<sequence_id>/
├─ manifest.json
├─ contact-sheet.webp
├─ frames/
│  ├─ <frame_id>.webp
│  └─ ...
├─ alignments.jsonl
└─ receipts.jsonl
```

The proposed `VisualSequenceManifest` includes:

- sequence, thread, source, capture-session, producer-epoch, and environment IDs;
- original clip or capture-window hash, duration, dimensions, codec/container,
  nominal and measured frame rate, time base, rotation, and variable-rate flag;
- decoder name/version and exact command-free argument manifest;
- requested and applied sample policy, seed if relevant, candidate/selected/
  rejected counts, and rejection reasons;
- per-frame decoded index, presentation timestamp, duration, dimensions, hash,
  image reference, source/projection classification, and retention state;
- related environment-event, HUD-scene, render-receipt, Realtime Texture Pack,
  and player-pose references; and
- contact-sheet hash, manifest hash, expiry, redaction/crop policy, and any typed
  unavailable or degraded reason.

The environment MCP/harness surface should expose bounded, read-only tools such
as:

- `visual_sequence.inspect_manifest(sequence_id)`;
- `visual_sequence.get_contact_sheet(sequence_id)`;
- `visual_sequence.get_frames(sequence_id, frame_ids)` with a strict count and
  byte ceiling;
- `visual_sequence.resample_range(sequence_id, start_ms, end_ms, policy)` as a
  new admitted decode job rather than hidden arbitrary retrieval; and
- `visual_sequence.compare_frames(sequence_id, frame_ids, question)` only when a
  vision-capable provider is selected and the exact image inputs re-enter the
  owning Codex turn.

If “MTP harness” refers to this model-facing tool path, the implementation should
use the existing MCP/environment-harness capability catalog and naming rather
than create an unaudited second tool protocol. A separately defined MTP component
would need its own contract and mapping before implementation.

Tool results are observations, not answers. A manifest, contact sheet, frame,
Image Lens result, or vision-model summary must re-enter the Codex turn before
follow-up reasoning and terminal arbitration. A non-vision model may inspect
metadata and prior typed summaries but must report that raw visual analysis is
unavailable rather than pretending to see the frames.

#### HUD and Realtime Texture Pack self-observation

For HUD debugging, capture three synchronized products when available:

1. the untouched source/underlay frame;
2. the composed clean-feed frame; and
3. the exact `HudScene`, `SurfaceRenderReceipt`, controller receipt, and layer
   health at that presentation timestamp.

This lets Codex ask whether the renderer matched the scene, whether the scene
matched admitted controller output, and whether a generated texture visually
matched its declared prompt. It does not let pixels overwrite controller or
environment truth. Realtime Texture Pack frames stay
`non_authoritative_projection`; the untouched capture remains the only candidate
pixel source for an independent evidence workflow.

Codex may propose a versioned HUD template or prompt/configuration revision from
this evidence. Applying the proposal is a separate admitted action. Motorcycle
reflex thresholds, cue TTL, watchdog behavior, and safety-relevant layouts cannot
be hot-patched from a visual summary while a run is active. A non-safety game HUD
may later support bounded reversible hot reload, but each applied revision must
rotate scene/configuration identity and retain rollback.

#### Minecraft observation and tutorial use

A selected Minecraft capture can align sampled frames with authoritative world
observations, player pose, action receipts, and environment events. Visual facts
remain `visual_capture` evidence with uncertainty; they may corroborate or
contradict the environment adapter but cannot silently replace World Authority
or Player Embodiment state.

An uploaded tutorial video is untrusted reference material, not executable
instruction. VSE-0 may extract a candidate sequence of steps, objects, UI states,
and uncertainty. Codex may turn that into a proposed procedure graph only after
evidence re-entry. The environment harness must then validate prerequisites,
current affordances, version/mod differences, safety/authority bounds, and each
postcondition during a separately admitted test run. No instruction embedded in
video pixels, captions, overlays, QR codes, chat, or audio grants tool authority.

#### Privacy, retention, and failure boundaries

- Capture begins only from an affirmative owner action with the exact source and
  bounded duration visible; discussing “ten-second capture” is not execution.
- Stop, revoke, source end, tab close, sign-out, thread deletion, decoder failure,
  or quota exhaustion terminates the job and records a typed receipt.
- Sensitive windows, notifications, credentials, private chat, and bystanders may
  appear in frames. Source selection, crop/redaction, retention, and model egress
  require explicit policy and visible status.
- Decode happens locally before optional model admission. Raw video is never sent
  merely because a manifest was created.
- Corrupt, unsupported, DRM/protected, oversized, ambiguous-identity, or
  timestamp-invalid media fails closed without partial frames masquerading as a
  complete sequence.
- The AI cannot inspect its hidden reasoning. It can inspect visible program
  output, selected frames, public prompts/configuration, render/controller
  receipts, and its own prior public responses.

### Minimum deterministic fixture set

1. no objects and no cues;
2. steady rear-left closing track with severity escalation;
3. object receding behind the bike;
4. two simultaneous tracks competing for one sector;
5. head yaw causing the same bike-relative object to migrate between HUD
   sectors;
6. head-pose epoch change invalidating the old transform;
7. track dropout and cue TTL expiry;
8. out-of-order and duplicate sensor packets;
9. high closing speed with a non-intersecting lateral path;
10. low-confidence track near a threshold;
11. navigation cue preempted by a threat cue;
12. manual blanking, Emergency Stop, watchdog timeout, and clean authority
    release;
13. reconnect requiring a fresh snapshot rather than continuing the old cue;
14. exact replay producing the same cue and receipt hashes.

## Virtual development methodology: panel plus FiveM

### Why FiveM is the first dynamic environment

FiveM/GTA V is the preferred first moving-world laboratory because it can place
a rider-controlled motorcycle among repeatable traffic actors while exposing
game entity position, orientation, and motion to a resource script. It can also
host an in-game NUI representation of the HUD. The official Cfx resource model
supports versioned client/server scripts, while NUI supports web-based rendering
and structured messages:

- Cfx resource manifest: <https://docs.fivem.net/docs/scripting-reference/resource-manifest/>
- Cfx resources: <https://docs.fivem.net/docs/scripting-manual/introduction/introduction-to-resources/>
- Cfx NUI: <https://docs.fivem.net/docs/scripting-manual/nui-development/>
- Cfx `SendNUIMessage`:
  <https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/>

FiveM is an engineering simulator, not a validated traffic, radar, lidar,
motorcycle-dynamics, optics, perception, or human-response model. Its role is
to find software defects, tune the experiment, measure deterministic indicator
accuracy against known game truth, and create difficult repeatable scenarios
before physical sensing is purchased.

### Sensor strategy decision

Do not begin with either raw camera images or a literal lidar simulation. Begin
with three deliberately separate evidence layers:

1. **Game-truth oracle.** Read exact nearby-entity state available to the
   resource: stable run-local identity, position, velocity, heading, dimensions,
   rider-bike state, and camera/head surrogate. This is never presented to the
   controller as a real sensor; it supplies labels and expected results.
2. **Synthetic radar-like observations.** Project game truth through a frozen
   sensor model with mounting pose, field of view, range, cadence, range/range-
   rate error, angular error, detection probability, latency, dropout,
   occlusion policy, false returns, and producer epochs. Rear threat and closing
   traffic are fundamentally range/range-rate problems, so this is the most
   direct first real-sensor analogue.
3. **Optional perception studies.** Add synthetic lidar-like point/ray returns
   when geometry and occlusion questions require them. Add camera frames only
   when testing a defined vision capability such as classification or lane
   context. Those pipelines are scored independently against the same oracle.

This ordering keeps the experiment identifiable. If a warning is wrong, the
panel can show whether the error came from the sensor model, track association,
coordinate transform, threat policy, HUD admission, or rendering. Feeding
perfect game tracks directly into the controller remains an oracle-baseline
mode, not the claimed sensor implementation.

The likely first physical sensor remains motorcycle-mounted rear radar, with
the helmet IMU providing head pose. Cameras are a later complementary source
for lateral/lane context and object classification. Lidar remains an evaluation
option rather than an assumed product requirement because its value must
justify its mounting, weather, power, compute, and cost burden.

### Minecraft-derived authority split

The FiveM adapter follows the useful parts of the Minecraft dual-plane pattern
without importing Minecraft action vocabulary:

| Minecraft pattern | FiveM motorcycle laboratory | Authority |
| --- | --- | --- |
| World Authority | scenario fixture creates traffic actors, routes, weather, and perturbations | separate finite fixture lease; test server only |
| Player Embodiment | rider or scripted rider controls the selected motorcycle | separate selected-subject identity; never inherited from fixture authority |
| world observations | exact oracle entity samples | read-only, provenance-bound, not controller input unless in oracle-baseline mode |
| resident guardian | deterministic motorcycle threat controller | bounded reflex; HUD cues only |
| situation digest | compact traffic/threat/run digest | observation only; must re-enter Runtime Codex |
| Emergency Stop | stop scenario automation and blank/release HUD rendering | independent local control |

The scenario authority may spawn or direct actors only inside its admitted test
fixture. The threat controller cannot spawn, steer, brake, damage, teleport, or
otherwise mutate a game entity. A person riding manually and a scripted rider
are different run modes and must not share evidence labels.

### FiveM resource topology

```text
FiveM test server
├─ mhud_scenario_authority
│  ├─ scenario manifest and seed
│  ├─ finite actor routes and perturbations
│  ├─ world/fixture identity
│  └─ truth labels and expected event windows
├─ mhud_rider_observer
│  ├─ selected bike and rider/camera identity
│  ├─ timestamped entity samples
│  └─ no world mutation
├─ mhud_sensor_emulator
│  ├─ radar-like profile v0
│  ├─ optional lidar/camera profiles later
│  └─ latency, noise, dropout, occlusion, and epoch injection
└─ mhud_ingame_overlay
   └─ the same versioned eight-sector cue model as the workstation preview

bounded developer transport
└─ CasimirBot installed node
   ├─ canonical run/event ledger
   ├─ deterministic reflex and HUD admission
   ├─ Motorcycle HUD Lab panel
   └─ compact evidence re-entry to Runtime Codex
```

The implementation packet must select a documented FiveM transport and prove
loopback/profile binding, bounded message size/rate, schema validation,
reconnect, producer-epoch rotation, and secret exclusion. NUI is a display and
local interaction surface, not the authoritative lifecycle ledger. State bags,
if evaluated, remain bounded replication aids rather than a high-rate telemetry
dump.

### Motorcycle HUD Lab panel

Create one developer-visible workstation panel named **Motorcycle HUD Lab**.
It remains accessible to `developer` accounts by default under the repository's
account/workstation contract; it must not become a `user`-only feature. Public
`user` exposure is a later stability decision.

The panel is the primary development cockpit:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Run: FiveM / scenario / seed / mode     source age   reflex p95   watchdog │
├───────────────────────────┬──────────────────────────┬─────────────────────┤
│ GAME-TRUTH ORACLE         │ SENSOR / TRACK VIEW      │ PROJECTED HUD       │
│ top-down bike + actors    │ radar fan / returns      │ transparent mock    │
│ truth bearing, range, CPA │ accepted/rejected tracks │ eight sectors       │
│ expected event windows    │ uncertainty + freshness  │ cue/TTL/priority     │
├───────────────────────────┴──────────────────────────┴─────────────────────┤
│ Decision pipeline: sample → detection → track → transform → threat → cue  │
├───────────────────────────────────────────┬────────────────────────────────┤
│ Timeline and causal receipts              │ Scenario and fault controls    │
│ first divergence highlighted              │ play/pause/step/replay/E-stop  │
└───────────────────────────────────────────┴────────────────────────────────┘
```

Required panel views:

- **HUD preview:** transparent-background approximation plus black-background
  projector-source view; both render from the exact same `HudCue` state.
- **Oracle map:** bike, traffic actors, headings, paths, ground-truth bearings,
  range, range rate, closest approach, and expected threat label.
- **Sensor scope:** configured field of view, generated returns, misses, false
  returns, occlusion, uncertainty, age, and rejected packets.
- **Track/threat table:** source identities, revisions, confidence, TTC/CPA,
  head-relative bearing, sector, severity, and reason code.
- **Pipeline trace:** the first stage where actual output diverges from the
  oracle expectation.
- **Timeline:** synchronized game sample, sensor arrival, track update, threat
  decision, HUD admission, renderer submission, TTL renewal/expiry, and
  watchdog events.
- **Scenario controls:** select an immutable fixture, seed, oracle/sensor mode,
  weather/time presentation, playback speed, step, pause, reset, and inject only
  predeclared faults.
- **Evidence export:** sanitized run manifest, configuration hashes, metrics,
  causal receipts, and replay bundle. Raw game or camera capture is separately
  controlled.

Panel controls cannot create arbitrary game commands. Scenario actions use a
finite developer-only fixture catalog and the separate scenario-authority
lease. The panel cannot overwrite receipts, expected labels, or the canonical
run configuration after execution begins.

### Shared renderer rule

Use one small versioned HUD scene model and one renderer package for:

1. the workstation transparent HUD preview;
2. the FiveM in-game NUI overlay;
3. headless golden-frame/semantic tests; and
4. the later physical projector output adapter.

The reusable HUD surface host owns composition and output routing around this
renderer. It must not reinterpret `HudCue`, invent profile semantics, or fork a
motorcycle-specific scene. The in-game overlay may remain a thin platform
wrapper, while the workstation and clean-feed outputs share the host contracts.

Platform wrappers may differ, but sector geometry, cue priority, TTL, patterns,
brightness intent, and animation phase come from the same model. Every frame or
semantic render receipt names the scene-model version and input cue-set hash.
This prevents the attractive panel mockup from drifting away from what the
projector will actually receive.

### FiveM scenario ladder

Build scenarios as deterministic families with seeds and explicit expected
event windows:

| Family | Purpose |
| --- | --- |
| F0 static geometry | coordinate-frame, bearing, range, sector, and head/camera transform |
| F1 rear closing | severity escalation and rear-left/rear/right discrimination |
| F2 non-conflict pass | prevent low TTC or high closing rate alone from becoming a collision claim |
| F3 cut-in and adjacent occupancy | lateral motion, blind-zone occupancy, and cue priority |
| F4 curves and rider head turn | bike/world/head transforms and sector migration |
| F5 multiple vehicles | track identity, competition, persistence, and highest-risk selection |
| F6 occlusion/dropout | sensor miss, track coast, uncertainty growth, cue expiry, and degraded state |
| F7 timing faults | delay, jitter, reordering, duplicate, gap, reconnect, and producer-epoch rotation |
| F8 environment variation | day/night/rain presentation and game-physics variation without optical claims |
| F9 adversarial boundary | threshold chatter, false return, teleport/despawn, collision aftermath, and reset |

Each scenario is first run in oracle-baseline mode, then through the radar-like
model, then through any candidate perception stack. The same seed and truth log
make the comparison differential rather than anecdotal.

### Accuracy and reaction scorecard

Report metrics by scenario family and sensor profile rather than one blended
accuracy number:

- oracle coverage and label consistency;
- detection precision/recall and false-return rate;
- track continuity, identity switches, bearing/range/range-rate error, and
  uncertainty calibration;
- TTC and closest-approach error where each quantity is defined;
- threat classification precision/recall by severity and reason;
- sector correctness, including head-relative migration;
- cue onset error, escalation error, persistence, and stale-clear time;
- source-to-admission and source-to-render latency distributions;
- duplicate cue/effect count and first-divergence stage;
- watchdog, manual blank, Emergency Stop, restart, and fresh-snapshot recovery;
- disagreement between workstation preview, FiveM NUI, and headless renderer;
- deterministic replay equality for identical truth, profile, seed, and code
  hashes.

False negatives and false positives must be presented separately. A visually
convincing play session is not an accuracy result. Promotion requires a frozen
scenario suite, frozen sensor profile, preregistered thresholds, and a machine-
readable scorecard.

### Virtual-to-physical transfer

The shared northbound contract is `TrafficTrack`/`HelmetPose`, not a FiveM
entity. When physical hardware arrives, a radar driver must emit the same
normalized observation schema and pass the same freshness, transform, threat,
HUD, watchdog, and replay tests. Recorded physical runs can then be replayed
through the panel beside FiveM fixtures.

Use domain randomization only to measure robustness across explicit parameter
ranges: noise, latency, missed detections, mounting error, head-pose drift,
traffic dynamics, and environmental presentation. It cannot make FiveM
evidence representative of a real sensor by declaration. Physical truth-
instrumented tests remain required to calibrate and validate the sensor model.

## Runtime Codex orientation: Minecraft reference without maturity inheritance

### Required reading and reasoning posture

Every Codex development packet, Runtime Codex evaluation, and adapter review for
this project must begin from the following reference relationship:

> The motorcycle HUD is a new, separately classified environment profile behind
> the same generic governed resident-controller protocol demonstrated by the
> Minecraft guardian. Reuse the lifecycle and authority invariants. Do not reuse
> Minecraft domain actions, timing assumptions, strategies, embodiments,
> acceptance status, or safety claims.

The authoritative reference set is:

- `docs/helix-environment-harness-work-program-v1.md` for the active program
  gate, maturity vocabulary, evidence rules, and generic resident-controller
  protocol;
- `docs/architecture/helix-environment-agent-reasoning-v1.md` for Runtime Codex,
  resident-controller, reaction-timescale, evidence-re-entry, and terminal
  boundaries;
- `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` for the accepted
  reference pattern of separated observation/action authority, finite leases,
  local tick-sensitive execution, watchdog/interruption behavior, and causal
  receipts; and
- this packet for the motorcycle-specific translation and non-goals.

Minecraft is reference evidence that the harness pattern can work in a demanding
environment. It is not evidence that traffic perception, the threat controller,
the HUD, optics, helmet integration, or rider outcomes work.

### Proposed motorcycle profile classification

```text
package_id: com.casimirbot.motorcycle.awareness
adapter_profile_id: resident.motorcycle.threat-awareness.v1
environment_class: physical_device_safety_advisory
reaction_requirement: bounded_reflex
embodiment: rider_information_display
effect_class: hud_cue_only
vehicle_actuation: prohibited
answer_authority: false
terminal_eligible: false
maturity_inheritance: none
```

This identity is reserved until the motorcycle adapter contract receives its
own scoped implementation packet. The classification intentionally distinguishes
an advisory display from a control system. A future braking, steering, or other
vehicle-actuation capability would be a different consequence class, authority
surface, profile, work program, and acceptance case; it cannot be added by
expanding this profile.

### Exact transfer and non-transfer map

| Governed concept | Minecraft reference | Motorcycle profile | Transfer status |
| --- | --- | --- | --- |
| environment observation | player, hazard, entity, geometry revisions | radar-like tracks, bike state, helmet pose, sensor health | shared lifecycle; new schema/evidence required |
| resident controller | Fabric guardian | deterministic threat controller | shared protocol; new artifact and evaluation required |
| finite response vocabulary | admitted movement/safety proposals | admitted `HudCue` enums | structural transfer only |
| trusted execution arbiter | Fabric action/resource lanes | HUD admission and renderer authority | shared invariant; new implementation |
| watchdog | viability, lease, screen/manual input, connector health | freshness, epoch, calibration, link, deadline, renderer, cue TTL | shared invariant; new failure vocabulary |
| manual override / Emergency Stop | release player controls and lanes | blank display and release renderer authority | shared invariant; independently tested |
| causal evidence | observation → proposal → arbiter → action → postcondition | track → threat → arbiter → cue → render/expiry receipt | shared causal form; new receipts |
| situation digest | compact Minecraft state | compact traffic/threat/run state | shared re-entry role; new content |
| Runtime Codex | plan, interpret, replan, explain | diagnose, compare, research, propose next experiment, explain | same runtime ownership |
| durable goal | verified survival/progress under viability constraints | verified HUD accuracy/reliability improvement under the research envelope | shared durable lifecycle; different goal semantics |
| environment actions | look, walk, interact, inventory, world mutation | no equivalent inheritance | prohibited transfer |
| maturity/acceptance | capability-specific Minecraft evidence | starts `projected` and advances on motorcycle evidence only | no transfer |

### Generic invariants that must be reused

The motorcycle implementation must reuse or conform to the provider-neutral
resident-controller contract for:

- exact environment, subject, profile, controller artifact, source, producer
  epoch, observation revision, calibration, run, room, and lease identity;
- monotonic sequence and freshness, explicit deadlines, stale/gap/reconnect
  behavior, and fresh-snapshot recovery;
- a finite proposal/effect vocabulary with confidence and abstention;
- one trusted local arbiter between controller output and display effect;
- effect ceilings, priority, idempotency, interruption, reset, and resource
  release;
- manual override and Emergency Stop independent of Runtime Codex;
- causal receipts linking observation, proposal, arbiter outcome, effect,
  measured postcondition, expiry, interruption, or abstention;
- compact material-event escalation instead of model wake on every tick;
- evidence normalization and re-entry into the same Runtime Codex task;
- one terminal candidate and one terminal writer; and
- offline controller continuity while Codex, the internet, or model provider is
  delayed or unavailable.

If the generic shared contract cannot express a required motorcycle invariant,
the implementation packet must propose a provider-neutral contract extension
and prove that it does not weaken existing Minecraft regressions. It must not
create a private motorcycle-only sampling, tool, approval, session, or terminal
runtime.

### Motorcycle facts that require independent proof

The following never inherit from Minecraft and must remain `projected` or
`specified` until their own evidence advances them:

- sensor modality, mounting, range, cadence, synchronization, weather behavior,
  detection performance, and false/missed-return characteristics;
- track association, range/range-rate accuracy, TTC/closest-approach semantics,
  uncertainty, and non-conflict discrimination;
- bike/world/head coordinate transforms, calibration, head-pose drift, and cue
  sector correctness;
- threat thresholds, hysteresis, cue priority, TTL, stale clearing, warning
  effectiveness, false positives, and false negatives;
- display latency, renderer reliability, brightness, contrast, transmittance,
  ghosting, distortion, eye-box, focus, distraction, and human recognition;
- helmet packaging, mass, thermal, electrical, battery, EMC, ingress, retention,
  emergency removal, impact compatibility, and complete-configuration
  certification; and
- any statement about road readiness, rider safety, crash prevention, physical
  viability, live acceptance, integrated acceptance, or release readiness.

### Codex orientation packet

Do not depend on Runtime Codex rediscovering this mapping from a long prompt.
Reserve a read-only capability such as:

```text
com.casimirbot.motorcycle.controller_reference.read
```

It should return a small, versioned, hash-bound orientation artifact before a
motorcycle reasoning task uses environment tools:

```ts
type MotorcycleControllerReference = {
  schema: "casimirbot.motorcycle_controller_reference.v1";
  adapterProfileId: "resident.motorcycle.threat-awareness.v1";
  genericProtocolRef: string;
  minecraftReferenceRefs: string[];
  sharedInvariantIds: string[];
  motorcycleSpecificInvariantIds: string[];
  prohibitedInheritance: string[];
  currentCapabilityMaturity: "projected" | "specified" | "implemented" |
    "deterministically verified" | "live accepted" |
    "integrated accepted" | "release-ready";
  maturityEvidenceRefs: string[];
  maturityInheritance: "none";
  reactionRequirement: "bounded_reflex";
  effectClass: "hud_cue_only";
  vehicleActuation: false;
  runtimeCodexInReflexPath: false;
  answerAuthority: false;
  terminalEligible: false;
};
```

The provider may also place a bounded copy of this stable artifact in advisory
context at the start of the reasoning turn. The tool result or context is not
an answer, execution request, acceptance receipt, or terminal product. It
orients Codex so it can reason from the correct architecture while Helix still
independently admits tools, sources, effects, evidence, and terminal output.

The Motorcycle HUD Lab Codex region must show the active profile, reference
artifact version/hash, current capability maturity, and
`maturity inheritance: none`. If the reference artifact is absent, stale, or
does not match the active adapter profile, a hard motorcycle environment turn
fails closed as `motorcycle_controller_reference_missing_or_mismatched` rather
than allowing the panel or a remembered Minecraft fact to supply authority.

### Differential acceptance mapping

The motorcycle program should preserve the environment harness's differential
method while changing the domain evidence:

```text
A0 direct deterministic controller/replay
  → proves controller and scenario mechanics

A1 Runtime Codex through the admitted motorcycle MCP/capability surface
  → proves Codex can select tools, receive observations, reason, and replan

B keyed Helix/Codex lifecycle
  → proves identity, admission, execution, evidence re-entry,
    terminal authority, and visible projection
```

Equivalent runs bind the same scenario seed, truth log, sensor profile,
controller artifact, calibration, cue vocabulary, thresholds, observation
revision, and expected postconditions. A direct A0 success is a feasibility
oracle, not Helix acceptance. A1 success does not close B. A valid watchdog or
hard-boundary rejection proves only that negative governance case. Minecraft
acceptance proves none of these motorcycle paths.

During research, the durable goal is phrased conservatively:

> Improve and verify directional cue accuracy, latency, robustness, and failure
> behavior across the frozen simulation and physical-test ladder without
> violating the advisory-only authority and evidence envelope.

Do not phrase the development goal as “protect the rider” or “preserve rider
safety” until the applicable physical, human-factors, certification, and product
evidence permits that exact claim.

## Optional Minecraft sensing verification lane

### Purpose

Use the existing Minecraft sensing and resident-controller environment as an
early cross-environment verifier for the motorcycle contracts. This is useful
because Minecraft already supplies governed entity observations, player/camera
orientation, source identity, observation revisions, watchdog behavior,
Codex-delay continuity, manual override, evidence re-entry, and accepted
lifecycle paths.

The Minecraft lane answers:

> Does the motorcycle normalization, head-relative transform, threat-to-sector,
> HUD admission, watchdog, receipt, and Codex re-entry lifecycle behave correctly
> when driven by a second governed live environment?

It does not answer:

> Does a real motorcycle sensor detect traffic accurately, or is the resulting
> helmet HUD safe and effective for a rider?

### Test-only translation

Create an explicit test-only translator. It must label Minecraft observations
as proxy truth and must never present them as radar, lidar, camera, traffic, or
physical-device evidence.

```text
Minecraft entity observation
  entity id, world position, velocity, revision, timestamp
              +
Minecraft selected-player/camera observation
  position, yaw/pitch, world/source/epoch identity
              ↓
test-only motorcycle proxy normalizer
              ↓
TrafficTrack
  classification = vehicle_like only as a fixture label
  observation_origin = minecraft_proxy_truth
              +
HelmetPose
  observation_origin = minecraft_camera_pose_proxy
              ↓
unchanged motorcycle threat controller
              ↓
unchanged HUD admission and shared renderer
              ↓
HudCue + causal receipt + Codex evidence re-entry
```

The translator may change coordinate handedness, units, origin, and fixture
labels only through one versioned transform. It cannot add threat severity,
select a HUD sector, repair an identity mismatch, or invent missing motion. The
unchanged motorcycle controller must make those decisions after normalization.

Minimum proxy bindings include:

```text
environment_id
world_id
source_id
producer_epoch
observation_revision
fixture_id
selected_player_id
camera_pose_revision
entity_id
entity_incarnation_id when available
proxy_transform_version
motorcycle_controller_artifact_hash
hud_scene_model_version
```

### Controlled Minecraft verification arena

Use a disposable local controlled-course world or fixture, not ordinary survival
play. The scenario authority and observation authority remain separate from the
motorcycle controller. Minecraft may create or move fixture actors through its
own admitted World Authority or test-fixture path; the motorcycle threat
controller remains read-only with respect to Minecraft and can affect only the
HUD preview.

Initial scenario families are:

| Fixture | Minecraft motion | Motorcycle behavior under test |
| --- | --- | --- |
| MX0 cardinal ring | stationary entities at known bearings | coordinate conversion and eight-sector mapping |
| MX1 rear approach | entity moves toward the selected player from rear-left/rear/rear-right | closing rate, severity escalation, cue position |
| MX2 receding entity | entity moves away | no false closing threat |
| MX3 lateral pass | entity approaches but passes outside the conflict corridor | non-conflict discrimination |
| MX4 camera turn | player camera rotates while entity trajectory is unchanged | bike/world/head transform and sector migration |
| MX5 multiple entities | several actors approach with different timing | track identity, persistence, priority, and competition |
| MX6 obstruction or disappearance | actor becomes unobserved, despawns, or rotates incarnation | uncertainty, expiry, stale identity, and fresh binding |
| MX7 source faults | duplicate, reorder, gap, disconnect, reconnect, and epoch rotation | watchdog, no frozen cue, and fresh-snapshot recovery |
| MX8 Codex delay | Runtime Codex is intentionally unavailable during the sequence | local reflex continuity and later compact evidence re-entry |
| MX9 manual stop | manual override and Emergency Stop during an active cue | renderer release, causal receipt, and no duplicate effect |

Where Minecraft mechanics cannot reproduce a required trajectory or timing
without contaminating the test, inject the normalized fixture after the source
boundary and label the run `minecraft_contract_fixture`, not `minecraft_live
sensing`.

### Cross-source differential

The strongest use of this lane is a normalized cross-source differential:

```text
canonical synthetic trajectory
  ├─ Minecraft entity fixture → Minecraft proxy normalizer ─┐
  ├─ FiveM entity fixture    → FiveM sensor/oracle adapter ──┼→ TrafficTrack
  └─ direct JSON replay      → fixture reader ───────────────┘
                                                           ↓
                                         same controller + HUD admission
                                                           ↓
                                             compare HudCue/receipt hashes
```

Exact source observations will differ, but after applying the declared source
transform and tolerance policy, equivalent normalized observations must produce
the same threat state, cue state transitions, expiry behavior, and causal
receipt semantics. A difference must identify the first divergent stage:
source observation, normalization, transform, track identity, threat decision,
HUD admission, rendering, receipt, or Codex re-entry.

Do not weaken the comparison by rounding away a material difference or forcing
both environments through one source-specific shortcut. If equivalent
normalization cannot be established, report a typed non-equivalence rather than
claiming controller parity.

### Minecraft verification ladder

1. **MXV0 — Static contract fixture.** Replay bounded Minecraft-shaped records
   offline and prove strict identity, unit/frame conversion, and rejection of
   malformed or stale observations.
2. **MXV1 — Live controlled arena.** Run MX0–MX6 with current Minecraft source
   observations and a stationary or deliberately controlled selected player.
3. **MXV2 — Watchdog and delay.** Run MX7–MX9 and prove source-gap handling,
   manual release, Emergency Stop, offline reflex continuity, compact material
   wake, and current-turn Codex evidence re-entry.
4. **MXV3 — A0/A1/B differential.** Repeat one unchanged natural analysis task
   across direct controller evidence, Runtime Codex through the motorcycle tool
   surface, and keyed Helix terminal projection.
5. **MXV4 — Minecraft/FiveM/replay comparison.** Drive an equivalent normalized
   trajectory through all three sources and produce the first-divergence report
   plus cue/receipt comparison.

MXV0 through MXV4 may establish deterministic or live evidence only for the
exact motorcycle contract and harness lifecycle named by the run. They cannot
advance physical sensor, optics, helmet, human-factors, road, or product
maturity. Minecraft's existing acceptance remains a regression prerequisite,
not inherited motorcycle acceptance.

### Panel presentation

Motorcycle HUD Lab should offer `direct replay`, `Minecraft proxy`, and `FiveM`
as visibly distinct source modes. In Minecraft mode it shows:

- Minecraft environment, world, selected player, source, epoch, and observation
  freshness;
- the original entity/camera observation beside the normalized motorcycle
  proxy;
- the transform version and any tolerance applied;
- a persistent `MINECRAFT PROXY — NOT PHYSICAL SENSOR DATA` label;
- the unchanged threat, cue, renderer, watchdog, and receipt views; and
- cross-source comparison only when scenario identity and normalization
  equivalence are proven.

The panel cannot relabel a Minecraft source as FiveM, radar, lidar, camera, or
physical hardware. A source-mode change rotates the run/source epoch and clears
active cues until a fresh snapshot and calibration binding are admitted.

## Connected Runtime Codex reasoning methodology

### Decision: reflex locally, reason globally

The harness should support actual Runtime Codex reasoning, not replace it with
a library of semantic labels or hardcoded natural-language interpretations.
The deterministic controller continues to turn sensor observations into bounded
warnings. A connected Runtime Codex receives selected evidence, reasons over the
situation and development objective, calls admitted tools, and produces
grounded advice, explanations, experiment plans, or next-run configurations.

```text
FAST SAFETY-ADJACENT LOOP                    CONNECTED REASONING LOOP
sensor sample                               material event / operator request
  → normalize                                 → evidence selection
  → track                                     → Runtime Codex turn
  → threat                                    → admitted tools / internet
  → HUD admission                             → observation re-entry
  → renderer                                  → reasoning and candidate
  → causal receipt                            → Helix terminal eligibility

10–20 ms compute target                     asynchronous; no reflex deadline
works offline                               network/model may be unavailable
finite cue vocabulary                       open-ended reasoning, bounded tools
HUD-only authority                          advisory/experiment authority only
```

The word `semantic` remains useful for a compact situation digest and
material-event wake policy, but the digest is model input, not the answer. It
does not pre-decide what Codex must conclude. Routes are procedures, receipts
are observations, classifier labels are hypotheses, and the completed Runtime
Codex solver path remains the reasoning and terminal-candidate source.

### Runtime provider boundary

Use the existing provider-neutral Codex/Helix agent-runtime boundary. Do not
write a helmet-specific private model loop into the FiveM resource, panel,
sensor emulator, environment route, or HUD controller. A selected Codex runtime
owns model sampling, generic tool use, tool-result re-entry, retries, session
state, and terminal completion. Helix owns source and tool admission, evidence
identity, freshness, permissions, proof gates, route-product contracts,
terminal eligibility, and the visible/debug trace.

The implementation may use the installed Codex runtime adapter or a separately
approved OpenAI Responses API provider adapter. Official OpenAI documentation
describes the Responses API as supporting reasoning configuration, multi-turn
state, custom function tools, MCP tools, and built-in tools such as web search:

- OpenAI Responses API:
  <https://developers.openai.com/api/reference/cli/resources/responses/methods/create>
- OpenAI model and reasoning guidance:
  <https://developers.openai.com/api/docs/guides/latest-model>

Do not freeze a model name in this hardware plan. The implementation packet
selects an available, approved model and reasoning effort, records that exact
identity in evaluation evidence, and compares quality, latency, and cost on the
frozen scenario battery. A faster Realtime model or voice connection may be an
optional interaction adapter; it does not automatically become the Codex agent
runtime or inherit safety, scenario, display, or terminal authority.

### What Runtime Codex receives

Do not stream every video frame, lidar point, radar return, or controller tick
to the model. A reasoning turn receives a bounded evidence packet such as:

```ts
type MotorcycleSituationDigest = {
  runId: string;
  environmentId: string;
  sourceEpochs: string[];
  observationWindow: { fromNs: string; toNs: string };
  riderStateRef: string;
  activeThreats: ThreatState[];
  recentCueReceipts: string[];
  sensorHealth: string[];
  disagreements: string[];
  scenarioGoal?: string;
  priorExperimentRefs: string[];
  selectedImageEvidenceRefs?: string[];
  omittedHighRateDataSummary: string;
  answerAuthority: false;
  terminalEligible: false;
};
```

The digest binds exact observation revisions and evidence references. Codex may
request a bounded detail capability—for example a selected track history,
short synchronized event window, one image, configuration diff, scenario
manifest, or prior scorecard—when the summary is insufficient. The model does
not receive raw secrets, unrestricted host access, arbitrary game commands, or
an ambient feed.

### Material-event wake policy

Runtime Codex is invoked by a user request or a deduplicated material event,
not by sensor cadence. Initial event families are:

- a new threat family or severity transition persists beyond its deterministic
  dwell requirement;
- sensor disagreement or uncertainty crosses a frozen escalation boundary;
- repeated false/missed-cue evidence appears in an evaluation run;
- watchdog, stale-source, reconnect, calibration, or producer-epoch failure;
- a scenario completes, fails, or first diverges from its expected pipeline;
- the operator asks for diagnosis, comparison, explanation, or a new test; or
- an accepted next-run experiment needs model reasoning.

Events are coalesced by run, family, and revision. Wake delivery is
nonterminal. A failed or slow model call cannot hold the HUD lease, extend a
stale cue, block Emergency Stop, or prevent local logging and replay.

### Admitted Codex reasoning capabilities

The initial connected reasoning surface is read-mostly:

- read current or historical situation digests;
- read selected track, threat, cue, health, timing, and first-divergence
  evidence;
- compare two immutable runs or sensor profiles;
- inspect the frozen fixture/scenario manifest and scorecard;
- use admitted internet search for current engineering documentation, standards,
  component information, weather context, or other operator-requested research;
- explain why a cue was admitted, rejected, moved, escalated, or expired;
- propose an immutable next-run experiment manifest from the finite scenario
  and fault vocabulary; and
- recommend a threshold/profile change for later review.

Runtime Codex cannot directly:

- write pixels or cues into the active HUD;
- edit thresholds, sensor profiles, or calibration during a scored run;
- spawn or control FiveM actors without a separately admitted scenario action;
- steer, brake, accelerate, or otherwise control a real or virtual motorcycle;
- convert internet content into current traffic truth;
- declare an unlit sector safe;
- change the safety boundary, authority lease, evidence, or scorecard; or
- claim certification, physical accuracy, or crash prevention.

A proposed next-run manifest is inert until Helix validates its schema,
scenario catalog, parameter bounds, authority, and run identity. The operator
can review it in the panel before execution. This preserves genuine model
reasoning while keeping mutation explicit and reproducible.

### Internet-connected evidence lane

Internet access is a reasoning bonus, not a sensor and not a reflex dependency.
Web results enter as provenance-linked observations with retrieval time,
source, applicable jurisdiction/version, and freshness. They may inform design
research, standards review, component comparison, scenario hypotheses,
weather-aware evaluation planning, or operator explanation. They cannot
override fresh local sensor evidence or silently alter the controller.

Use two distinct evaluation modes:

| Mode | Internet | Purpose | Reproducibility rule |
| --- | --- | --- | --- |
| `reasoning_frozen_evidence` | disabled or fixed captured references | deterministic parity and regression | exact evidence bundle and hashes |
| `reasoning_live_web` | admitted current search | current research and exploratory reasoning | record queries, sources, retrieval times, outputs, and unavailable state |

The panel must label which mode produced a recommendation. A live-web result
cannot be substituted into a deterministic score without creating a new run.
Provider/API credentials remain in the installed node's protected credential
boundary and never enter FiveM files, NUI, panel state, MCP results, run exports,
or model-visible evidence.

### Connected reasoning view in the panel

Add a collapsible **Codex Reasoning** region to Motorcycle HUD Lab:

```text
┌─ CODEX REASONING ──────────────────────────────────────────────────────────┐
│ runtime/model identity   connected/offline   task/run binding   web mode   │
├───────────────────────────────┬────────────────────────────────────────────┤
│ admitted evidence             │ Codex output                              │
│ digest + selected refs        │ diagnosis / comparison / next-run plan    │
│ freshness + omitted data      │ uncertainty + supporting evidence refs    │
├───────────────────────────────┴────────────────────────────────────────────┤
│ requested tool → admission → result → re-entry → candidate → eligibility  │
│ ADVISORY — NOT IN THE REFLEX PATH — NOT A SAFETY VERDICT                  │
└────────────────────────────────────────────────────────────────────────────┘
```

The panel shows a concise reasoning summary and public tool/evidence trace, not
hidden chain-of-thought. It must distinguish:

- model unavailable versus reflex unhealthy;
- pending reasoning versus an active warning;
- admitted evidence versus panel projections or debug metadata;
- a Codex recommendation versus an approved next-run manifest; and
- Runtime Codex's candidate versus Helix terminal eligibility and visible
  presentation.

### Codex capability and parity ladder

Evaluate the connected reasoning path with the same unchanged natural task and
equivalent frozen run evidence:

1. **CR0 — Offline reflex baseline.** Prove the complete warning and receipt
   path with the model and internet disconnected.
2. **CR1 — Reference Codex reasoning proof.** Give consented reference Codex
   direct read-only access to one disposable replay bundle and the bounded
   analysis tools. Record requested tools, observations, retries, and final
   public synthesis; do not record hidden reasoning.
3. **CR2 — Governed Codex parity.** Repeat the unchanged prompt through the
   Codex/Helix provider boundary. Prove the versioned controller-reference
   artifact was admitted before motorcycle tools; source/tool admission;
   observation re-entry; supported terminal candidate; poison audit; unchanged
   visible projection; and fail-closed missing, stale, mismatched-profile, and
   false-maturity-inheritance cases.
4. **CR3 — FiveM material-event re-entry.** Deliver a deduplicated material
   event from a live developer FiveM run, allow Codex to request bounded detail,
   and prove correct run/revision binding with no duplicate game or HUD effect.
5. **CR4 — Next-run experiment.** Codex proposes a bounded immutable scenario
   manifest, the operator admits it, FiveM executes through scenario authority,
   and the resulting evidence re-enters the same reasoning task for comparison.
6. **CR5 — Internet-assisted research.** Compare frozen-evidence and live-web
   modes on a research task while proving source provenance, secret exclusion,
   current-run sensor authority, and accurate unavailable/degraded reporting.

For each stage, classify the first divergence as capability mechanics, runtime
affordance exposure, Helix admission, execution, evidence normalization,
evidence re-entry, follow-up reasoning, terminal authority, or presentation.
Do not repair a failure by inserting a private classifier answer or changing
the natural prompt to fit the adapter.

## Staged build and acceptance

| Phase | Primary lane | Build | Required evidence to close phase | Promotion boundary |
| --- | --- | --- | --- | --- |
| MHUD-0 | program | freeze scope, schemas, frames, hazards, modes, and evidence model | reviewable plan and open-decision register | no hardware purchase implied |
| MHUD-1A | panel/software | Motorcycle HUD Lab shell, shared eight-sector renderer, and deterministic local replay | golden fixtures, panel-state tests, cue TTL/hysteresis tests, first-divergence trace, and latency distribution | local software behavior only |
| HUDH-0A | reusable visual-surface host | developer-only host contracts and tabbed panel; normalized HUD scene; `hud_only_alpha`, `hud_on_black`, synthetic `hud_over_source`, and `source_only`; panel-fullscreen state; clean-feed isolation; no live arbitrary capture | schema and policy tests, alpha-composition golden frames, source/scene/transform receipt hashes, resize/crop/device-pixel-ratio tests, fullscreen enter/exit and state-retention tests, stale/epoch/manual-blank regressions, clean-feed chrome exclusion, and proof that hosted observation grants no program-input authority | shared local composition behavior only; no universal tab compatibility, exclusive-fullscreen capture, live camera claim, physical projection, optics, or safety claim |
| HUDH-0T | Realtime Texture Pack bridge | adapt the existing selected-window source and non-authoritative projection frames into layers 0 and 1 beneath the unchanged profile HUD scene; preserve independent reveal-original, texture stop, HUD blank, and clean-feed controls | unchanged source/projection identities, z-order and alpha golden frames, independent four-clock age reporting, stale-texture fallback with live HUD continuity, generated-pixel evidence rejection, prompt/credential exclusion, and exact composition receipts | reuses the Realtime Texture Pack's accepted boundary without promoting its maturity or generated pixels; no new provider, billing, capture, input, or game authority |
| HUDH-0B | admitted live underlays | separately permissioned browser-tab/program capture and camera adapters with exact source identity, health, bounded retention, and typed unavailable states | same-origin/embed and capture-mode matrices, consent/revocation, protected-source rejection, latency/freshness distributions, source switching, secret-exclusion audit, fullscreen source-support matrix, and clean-feed lease release | live source presentation only; no source-program control, exclusive-fullscreen workaround, or environment/safety maturity inheritance |
| HUDH-0C | shared UI/MCP surface orchestration | one versioned Surface Registry, HUD Surface Studio, Visual Evidence panel, typed panel-launch context, clean-output leases, and provider-neutral MCP tools over the same desired state and receipts | UI/MCP parity, exact principal/source/profile/epoch/revision binding, stale-write conflicts, scoped unattended leases, human takeover, revoke/sign-out cleanup, context poison tests, Codex result re-entry, model-unavailable continuity, and no panel-click automation | configuration and observation orchestration only; no private agent loop, silent permission expansion, program input, reflex authority, physical-output acceptance, or safety claim |
| HDH-0A | scientific hardware-definition contracts | theory-design links, hardware environment profiles, component/reference/design manifests, experiment-closure packets, and canonical project registry | provenance/classification, unit/scale, immutable identity, claim-ceiling, preregistration and circular-evidence poison fixtures | design metadata only; no CAD execution, fabrication, empirical evidence, proof promotion, or physical viability claim |
| HDH-0B–0F | Hardware Workspace through fabrication handoff | shared UI/MCP workspace, governed CAD/EDA adapters, compatibility graph, instrument evidence, and human-released fabrication package | phase-specific parity, lease, fixed-view, compatibility, uncertainty, independent-measurement and exact as-built identity evidence defined above | each phase retains its own boundary; no stage inherits theory, device-performance, product or certification authority |
| EOT-0A–0F | bidirectional environment object traversal | portable object packages, exact Minecraft region extraction, local scan/reconstruction layers, optional user-connected image-to-3D, code/CAD target compilers, and separately admitted realization | frame/unit/provenance identity, exact discrete round trips, geometry/voxel residuals, privacy/retention, external upload/cost leases, target loss reports, action/postcondition receipts and poison cases | translation and exact tested realization only; no cross-environment identity, generated-geometry measurement, automatic mutation, fabrication or safety claim |
| MSH-0A–0F | multimodal sensing, recording and guidance | shared session/track/timeline/recipe contracts, Capture Session Composer, local media/memo tracks, depth/LiDAR/pose alignment, clean HUD guidance, simulated oracle/sensor differential and EOT integration | per-track consent, exact device/profile/source/epoch/frame/clock identity, bounded storage, privacy, guidance/source separation, stale/revoke behavior, UI/MCP parity and postcondition evidence | user-composed bounded evidence and assistance only; no ambient recording, hidden modality, automatic command, physical maturity or safety authority |
| CRS-0A–0E | connected reasoning and Shared Live Room sessions | remote device contribution, permissioned multimodal evidence, participant intent, GPT Realtime voice presentation, screen/video/HUD projection and later multi-host federation | exact room/run/turn/participant/node/device/source/epoch identity, independent grants, dimensioned intake/reasoning budgets, cursor/gap/reconnect behavior, intent attribution/conflict handling, certainty/playback parity, one arbiter/terminal writer and stop/revoke evidence | exact authorized room journeys only; no ambient device access, hidden reasoning sharing, transcript-to-command shortcut, automatic permission union, continuous-cloud dependency or inherited multi-host acceptance |
| VSE-0A | offline visual-sequence artifact | ingest an explicitly supplied clip, decode locally, apply deterministic timestamp-based sampling, and emit a manifest, contact sheet, bounded frame set, alignments, and receipts | fixed 10-second and 30-second fixtures, variable-frame-rate and rotation cases, exact frame PTS/hash reproducibility, sample-cap enforcement, corrupt/protected-media failures, expiry cleanup, and proof that no model call or environment action occurs | offline visual evidence only; no live capture, visual conclusion, source authority, or execution authority |
| VSE-0B | consented bounded surface capture | capture a selected HUD clean feed, composed feed, or admitted program/Minecraft window for 10 seconds by default and 15 seconds maximum through the existing visual-source lifecycle | affirmative start/stop/revoke tests, exact source/epoch identity, bounded duration/storage, synchronized HUD and surface receipts, secret/protected-content rejection, stale/source-loss handling, and unchanged HUD/controller behavior | bounded observation only; no continuous screen sharing, hidden capture, input injection, or safety-loop dependency |
| VSE-0C | Codex visual-evidence tools | expose manifest, contact sheet, bounded frame retrieval, admitted resampling, and frame comparison through the environment MCP catalog with provider capability negotiation and exact evidence re-entry | tool-schema and admission tests, frame-count/byte limits, unsupported-vision typed result, provenance-preserving re-entry, follow-up reasoning and terminal-authority traces, poison tests, and proof that receipts are not treated as answers | advisory model interpretation only; no private model loop, automatic configuration mutation, or visual authority over typed world state |
| VSE-0M | Minecraft visual correlation | align selected Minecraft frames with World Authority observations, player pose, action receipts, and optional untrusted tutorial-video segments; propose a candidate procedure graph for separate execution admission | synchronized fixture replays, clock/epoch mismatch rejection, image-versus-world disagreement cases, tutorial prompt-injection tests, candidate-step provenance, and separate environment verification receipts | reference and diagnostic evidence only; no tutorial execution, visual replacement of World Authority, or Minecraft maturity inheritance |
| MHUD-1M | optional Minecraft verifier | test-only Minecraft proxy normalizer, controlled arena, source-mode panel projection, watchdog/delay cases, and cross-source differential harness | MXV0–MXV4 evidence; unchanged controller; exact source/profile identity; proxy labels; stale/epoch/manual-stop regressions; cue/receipt comparison; no Minecraft maturity inheritance | verifies exact shared motorcycle contract/lifecycle only; no traffic, sensor, optics, rider, or certification claim; may proceed in parallel with MHUD-1B |
| MHUD-1B | FiveM oracle | developer-only FiveM resource, selected rider/bike binding, immutable scenario fixtures, and truth exporter | F0–F5 deterministic scenario replays, exact identity/epoch binding, bounded transport, zero threat-controller world mutation | game-truth evidence only; no sensor claim |
| MHUD-1C | sensor/controller | radar-like sensor emulator, tracking/threat pipeline, fault injection, and scorecard | F0–F9 differential battery, preregistered thresholds, precision/recall and timing by family, exact replay hashes | simulated sensor/controller evidence only |
| MHUD-1D | connected reasoning | Runtime Codex provider binding, versioned motorcycle/Minecraft orientation artifact, material-event wake, bounded evidence/detail tools, reasoning panel, optional admitted web research, and next-run manifest proposal | CR0–CR5 ladder; unchanged-prompt reference/governed differential; correct reference admission; missing/stale/mismatched/false-inheritance rejection; source/tool admission; exact re-entry; terminal and poison audits; no duplicate HUD/game effect; model-offline reflex continuity | reasoning and advisory evidence only; no reflex, vehicle, maturity-inheritance, or certification authority |
| MHUD-2 | optics | projector/combiner bench with headform camera | luminance, contrast, transmittance, ghosting, distortion, focus, eye-box, stray-light and thermal measurements | no wearable claim |
| MHUD-3 | CAD | scan-derived chin and brow assemblies with removable combiner | interference, visor sweep, sight-line, mass-property, tolerance and serviceability reports | no protective-helmet modification |
| MHUD-4 | integration | renderer hardware plus pose input and replayed bike tracks | end-to-end latency, frame-transform, packet-loss, stale-clear, watchdog and manual-blanking evidence | stationary headform only |
| MHUD-5 | sensor HIL | bike-mounted sensors on a stationary/dyno or controlled fixture | synchronized truth reference, detection/track metrics, false/missed cue characterization, weather/EMI notes | no person in motion |
| MHUD-6 | human factors | reviewed stationary recognition study, then separately approved closed-course study | direction/urgency recognition, response time, workload, distraction, discomfort, failure reporting | exact study population/configuration only |
| MHUD-7 | productization | helmet-manufacturer and optical/safety engineering program | whole-configuration compliance, environmental, durability, EMC, battery, human-factors, manufacturing and jurisdiction evidence | required before any road/product claim |

No phase inherits the next phase's maturity. In particular, successful threat
classification does not prove optical legibility, optical legibility does not
prove safe human use, and a closed-course result does not certify a helmet.

## Measurements and acceptance records

### Software/control metrics

- sensor-arrival-to-cue-admission latency: median, p95, p99, and maximum;
- render submission and measured photon latency where instrumentation permits;
- observation age and time-sync uncertainty;
- sector correctness and severity-transition correctness;
- stale-cue clear time;
- duplicate cue/effect count;
- reconnect and epoch-rotation behavior;
- false cue, missed cue, and abstention counts by scenario family;
- watchdog trip, blanking, and resource-release time;
- exact evidence completeness and deterministic replay hash.

The 10–20 ms reflex figure is an initial compute budget to test, not a safety
guarantee. An end-to-end requirement must be derived from sensor cadence,
transport, processing, display scan-out, optics, and validated human response.

### Optical/CAD metrics

- luminance and contrast across ambient-light conditions;
- combiner photopic transmittance and haze;
- eye-box width, height, and depth across headforms;
- virtual-image distance/focus accommodation behavior;
- geometric distortion, double image/ghost ratio, chromatic error, and stray
  light;
- cue location error under head motion and normal fit variation;
- central and peripheral sight-line clearance;
- visor sweep, fogging, condensation, rain, vibration, and temperature behavior;
- added mass, center-of-mass shift, moment arm, retention loads, and surface
  temperatures;
- don/doff, emergency removal, cleaning, replacement, and calibration time.

Thresholds are deliberately not invented here. MHUD-0/MHUD-1 should identify
applicable standards, literature, and study protocols and freeze thresholds
before a pass/fail run.

## Failure behavior

| Failure | Required v0 behavior |
| --- | --- |
| stale or missing traffic track | expire only affected threat cue; show bounded degraded state |
| stale/mismatched helmet pose | stop head-relative migration; clear pose-dependent cues; degraded state |
| bike/helmet link loss | expire remote cues locally; record disconnect; no frozen warning |
| renderer overrun or invalid command | hardware blank, watchdog receipt, controlled restart only after fresh snapshot |
| CasimirBot unavailable | reflex remains available; semantic features marked unavailable |
| calibration invalid | threat display disabled rather than displayed in a knowingly wrong sector |
| manual blank or Emergency Stop | immediate renderer-authority release and latched receipt |
| sensor disagreement | abstain or show degraded state according to a frozen deterministic policy |
| reboot/reconnect | rotate producer epoch and require current calibration plus fresh snapshot |

The system is advisory. It must never imply that an unlit sector is verified
safe or that a cue replaces mirrors, direct observation, judgment, or normal
rider control.

## Safety, privacy, and regulatory boundary

This program starts with a sacrificial optical rig and instrumented headform,
not a modified road helmet. FMVSS No. 218's current U.S. test procedure measures
a minimum 105-degree peripheral field to each side, and the standard addresses
internal and external rigid projections. NHTSA also discourages owner helmet
modification and explains that a manufacturer is responsible for certifying the
complete helmet configuration. These are minimum U.S. boundaries, not a design
approval or a complete jurisdictional analysis:

- NHTSA FMVSS 218 laboratory procedure:
  <https://www.nhtsa.gov/document/laboratory-test-procedure-fmvss-218-motorcycle-helmet>
- NHTSA helmet selection and certification explanation:
  <https://www.nhtsa.gov/motorcycle-safety/choose-right-motorcycle-helmet>
- NHTSA interpretation discussing projections and modification:
  <https://www.nhtsa.gov/interpretations/10949>

Before MHUD-6 or MHUD-7, obtain a current jurisdiction-specific standards and
legal review covering the complete helmet, visor/eye protection, electronics,
batteries, EMC/radio, product liability, recording/privacy, and human-subject
testing. The project should engage a helmet manufacturer rather than treating a
certified retail helmet as a structural development platform.

Privacy defaults:

- process radar and normalized tracks locally;
- do not retain raw camera video by default;
- store only the minimum evidence needed for engineering evaluation;
- make recording state obvious to the operator;
- encrypt retained runs and define deletion/export controls;
- never expose faces, plates, precise routes, private endpoints, or credentials
  to Runtime Codex unless a later packet demonstrates a necessary, lawful, and
  specifically admitted use.

## Initial bench bill-of-functions

MHUD-0 freezes functions before vendors:

| Function | First implementation class |
| --- | --- |
| optical source | low-resolution high-brightness microdisplay/projector evaluation module |
| combiner | replaceable flat/low-curvature semi-transparent coupons, then formed prototype |
| fold optic | adjustable first-surface mirror on optical rail |
| eye surrogate | camera at adjustable eye points plus photometric head |
| render controller | deterministic local board with hardware blanking input |
| pose | timestamped IMU evaluation module rigidly mounted to headform |
| bike observation | recorded/synthetic packets before any purchased live sensor |
| truth reference | calibrated target geometry and synchronized measurement camera/instrument |
| power | fused bench supply with current logging and physical cutoff |
| evidence | run manifest, configuration hashes, synchronized logs, photos, and measurement report |

Vendor/SKU selection begins only after the required ranges for luminance,
resolution, FOV, eye-box, input latency, size, thermal dissipation, interface,
and cost are measured or derived.

## First executable packet: MHUD-1A

MHUD-1A should contain only:

1. strict runtime-validated schemas for `TrafficTrack`, `HelmetPose`,
   `ThreatState`, `HudCue`, `SystemHealth`, and run identity;
2. the frozen coordinate transform and wrap/sector mapping;
3. a deterministic severity profile with named fixture parameters;
4. one shared eight-sector renderer with transparent preview and black
   projector-source modes and no arbitrary text;
5. cue priority, hysteresis, TTL, freshness, manual blanking, and watchdog state
   machines;
6. the fourteen deterministic fixture families above;
7. a headless golden-frame or semantic render test;
8. a latency harness that separates source age, processing, queueing, and render
   submission;
9. an append-only causal receipt and exact replay hash; and
10. the developer-only Motorcycle HUD Lab panel with HUD, oracle fixture, sensor
    fixture, pipeline trace, timeline, play/pause/step/reset, Emergency Stop, and
    evidence export placeholders;
11. panel policy tests proving the feature remains reachable to `developer`
    accounts and is not added to the public `user` allowlist by this phase; and
12. a read-only Codex Reasoning placeholder that accurately shows `offline` and
    cannot initiate model or internet access before MHUD-1D; and
13. a persistent operator banner that states
    `SIMULATION — NOT A SAFETY DEVICE`.

MHUD-1A stop/fail criteria:

- nondeterministic cue output for the same fixture and configuration;
- an expired input leaves a threat cue active;
- duplicate or out-of-order input causes a duplicate effect;
- navigation can cover an admitted threat cue;
- head/bike epoch mismatch reaches rendering;
- manual blanking or watchdog failure does not release renderer authority;
- the workstation preview, headless renderer, and fixture semantics disagree;
- a panel control can issue arbitrary environment or host commands;
- a receipt or UI projection is mistaken for an answer or safety verdict; or
- any test requires Runtime Codex or network availability for reflex completion.

### MHUD-1A implementation evidence — 2026-09-02

Program gate: G8 — Environment Integration Acceptance
Workstream: Parallel motorcycle-awareness simulation lane
Capability or component: MHUD-1A offline reflex lab
Lifecycle stage: evaluate
Reaction timescale: deterministic replay step; reflex target remains 10–20 ms
Authority owner: local motorcycle threat controller and HUD admission controller
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: strict schema tests, frozen fixture oracle tests, renderer/panel tests, account-policy test, and visual fail-closed inspection
Explicit non-goals: Minecraft/FiveM/physical IO, projector hardware, connected Runtime Codex, internet reasoning, road use, and certification
Downstream gate unlocked: MHUD-1M Minecraft normalization verification or MHUD-1B FiveM observation bridge

The implemented MHUD-1A slice includes:

- browser-safe runtime schemas for motorcycle observations, run identity,
  threats, HUD cues, system health, and causal receipts;
- the frozen bike-to-head bearing transform and clockwise eight-sector mapping;
- deterministic TTC/confidence/closest-approach threat admission, sector
  arbitration, navigation preemption, cue TTL, freshness, duplicate/reordered
  rejection, producer-epoch recovery, manual blanking, and watchdog clearing;
- fourteen frozen replay families with explicit final-state oracles;
- one shared combiner/projector-black renderer and a developer-only Motorcycle
  HUD Lab with radar oracle, source evidence, track/threat/cue table, fixture
  verdict, causal receipt, replay controls, and Emergency Blank. The panel
  explicitly labels this as a normalized HUD coordinate plane: no visor
  curvature, optical skew, eye-box correction, combiner calibration, or
  CAD-derived projection is applied until a later optical/CAD transform is
  frozen;
- public-account fail-closed policy coverage; and
- disabled, visibly labeled placeholders for Minecraft, FiveM, physical sensor,
  and connected Runtime Codex sources. The Codex preview shows bound evidence,
  the future material-event reasoning path, and advisory-only authority without
  fabricating a model result while the runtime is offline.

Verification evidence:

- `28` focused tests passed across the shared controller, sealed output
  contracts, lab panel, and workstation account-policy suites;
- deterministic replay produced identical receipt content and fixture identity
  hashes on repeated runs;
- visual QA confirmed the rear-left `urgent_pulse` cue remains peripheral with
  the central region clear; and
- visual QA confirmed a source dropout trips the watchdog, removes all cues,
  displays `HUD BLANK · WATCHDOG`, and still produces a causal receipt.

This maturity applies only to the local offline software behavior and frozen
fixtures. It does not transfer Minecraft maturity, validate FiveM telemetry,
measure physical sensor accuracy or display latency, establish optical
performance, or provide any road-safety or certification claim.

### HUDH-0A implementation evidence — 2026-09-04

Program gate: G8 — environment-harness release evaluation; parallel visual-surface lane
Workstream: reusable environment display and projection surfaces
Capability or component: HUDH-0A developer-only normalized visual-surface host
Lifecycle stage: source admission → frame normalization → HUD-scene composition → output admission → render receipt
Reaction timescale: local display composition; no source reflex or model loop
Authority owner: Helix source and output admission plus pixels-only host authority; operator-owned source selection and blanking
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: strict contracts, deterministic composition receipts, synthetic layer tests, stale/epoch/permission/manual-stop regressions, fullscreen state retention, clean-feed isolation, account policy, and production client build
Explicit non-goals: live arbitrary window/tab/camera capture, Realtime Texture Pack bridge, source-program input, exclusive-fullscreen capture, physical projector output, optical calibration, road use, and safety certification
Downstream gate unlocked: HUDH-0T Realtime Texture Pack bridge or HUDH-0B admitted live underlays; no live-source, environment, optics, or safety maturity is inherited

The implemented HUDH-0A slice includes:

- `shared/helix-hud-surface.ts`, defining runtime-validated source binding,
  source frame, normalized primitive scene, viewport, control, and render-receipt
  contracts;
- a deterministic compositor that preserves first-divergence reason, binds
  source/scene/viewport/transform identity into an exact causal hash, records
  source-before-HUD layer order, and permanently records pixels-only authority
  with `programInputAuthority: false`;
- the four frozen composition modes: `hud_only_alpha`, `hud_on_black`,
  `hud_over_source`, and `source_only`;
- fail-closed handling for missing, stale, mismatched-epoch, denied, or revoked
  required sources; stale or mismatched HUD scenes; manual blanking; and
  Emergency Stop;
- `HudSurfaceHost.tsx`, a reusable tab-hosted composition component with a
  synthetic road underlay, normalized viewport notice, source/scene/transform
  receipt strip, device-pixel-ratio identity, and a chrome-free feed subtree;
- a clean-feed fullscreen presentation entered from the host controls and exited
  with Escape, retaining the same profile, source, scene, and composition mode;
  and
- migration of Motorcycle HUD Lab onto the reusable host without moving threat,
  watchdog, TTL, navigation priority, or Codex authority into the compositor.

Verification evidence:

- `41` focused tests passed across HUD-surface contracts, composition and
  fullscreen behavior, motorcycle fixtures/panel integration, and workstation
  account policy;
- deterministic tests cover alpha-only output, source-plus-HUD z-order,
  source-only output, exact repeated receipts, output resize/crop/device-pixel-
  ratio identity changes, source loss/staleness/epoch mismatch/revocation,
  manual blanking, Emergency Stop, clean-feed control exclusion, fullscreen
  enter/exit, and same-mode restoration;
- the production client build passed after transforming `3309` modules; and
- a fresh unsigned/headless browser session could not open the locked Motorcycle
  HUD Lab, preserving the developer-only boundary. No attempt was made to bypass
  account policy for visual inspection.

This evidence is deterministic local software evidence only. A live developer-
session visual acceptance run, live selected-window capture, Realtime Texture
Pack stacking, detachable native output, and any physical projector path remain
separate acceptance work.

### VSE-0A implementation evidence — 2026-09-04

Program gate: G8 — environment-harness release evaluation; parallel read-only visual-evidence lane
Workstream: short owner-supplied video ingestion and deterministic frame artifacts
Capability or component: VSE-0A offline visual-sequence evidence pipeline
Lifecycle stage: owner upload selection → developer admission → local probe/decode → timestamp sampling → immutable artifact projection
Reaction timescale: offline bounded job; never part of the HUD render or motorcycle reflex deadline
Authority owner: owner controls explicit upload; local decoder owns conversion only; server owns profile binding, limits, retention, and artifact addressing
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: fixed 10- and 30-second media, repeatable PTS/frame hashes, VFR and rotation handling, byte/duration/dimension/frame limits, corrupt/protected failures, expiry, developer policy, artifact inspection, no-authority receipts, focused tests, and production builds
Explicit non-goals: live surface capture, continuous screen sharing, model or Ask invocation, MCP vision tools, environment action, HUD/controller mutation, semantic conclusions, tutorial execution, and safety or optical claims
Downstream gate unlocked: VSE-0B consented 10–15-second selected-surface capture; VSE-0C model-facing tools remain separate and unimplemented

The implemented VSE-0A slice includes:

- `shared/helix-visual-sequence.ts`, defining a sequence manifest, sampled-frame
  record, offline-decode receipt, typed failures, and frozen prototype limits;
- a profile-bound server service that accepts one explicit owner-supplied clip,
  hashes it, probes its video stream and frame timestamps through local
  `ffprobe`, selects decoded frame indexes by timestamp, and extracts the exact
  selected frames through local `ffmpeg`; exact repeated ingestion is
  idempotent and reads the existing immutable owner/thread/source/policy-bound
  artifact rather than overwriting it;
- ten one-second samples for the 10-second baseline and a sample-cap adjustment
  to fifteen two-second samples for a 30-second clip, with no more than sixteen
  full-resolution frames admitted by this stage;
- lossless WebP frame normalization, a timestamped contact sheet, `manifest.json`,
  empty-but-typed `alignments.jsonl`, and `receipts.jsonl`, all addressable by
  exact sequence/frame identity and SHA-256;
- 64 MiB upload, 30-second duration, 3840×2160 source-dimension, 18,000 decoded-
  frame-metadata, 768×432 normalized-output, and one-active-job-per-thread
  bounds, with invalid media failing before pixel extraction when possible;
- ephemeral one-hour retention, refusal of expired artifacts, stale staging
  cleanup, omission of the uploaded source clip from the final artifact, path-
  traversal rejection, profile-isolated reads, no-store responses, bounded IP
  admission, and exact same-origin protection for cookie-authenticated writes;
- the developer-only `/api/visual-sequences` upload/read/artifact/cleanup API;
  and
- `VisualSequenceInspector.tsx` embedded beneath Motorcycle HUD Lab, providing
  explicit file selection, extraction state, contact-sheet preview, timestamped
  frame links, manifest/receipt/alignment links, media metadata, and the visible
  `model=false`, `live_capture=false`, `environment_action=false`, and
  `hud_mutation=false` boundary.

Verification evidence:

- `36` focused tests pass across the real decoder, route/security boundary,
  visual-sequence inspector, Motorcycle HUD Lab, reusable HUD host, and
  workstation account policy;
- real generated 10-second and 30-second fixtures prove the exact selected PTS
  sequence, repeatable frame hashes, repeatable manifest hash under a frozen
  clock, contact-sheet output, bounded sample cadence, and omitted source clip;
- real generated VFR and display-rotation fixtures prove variable timestamp and
  90-degree display-dimension handling;
- corrupt and protected media, disallowed MIME, upload bytes, duration,
  dimensions, decoded-frame metadata, cross-site submission, wrong profile,
  expiry, and invalid artifact paths fail closed with typed outcomes;
- the production client build passed after transforming `3311` modules and the
  production server bundle passed; its four duplicate-key/case warnings are in
  pre-existing unrelated modules; and
- the repository-wide `npm run check` did not complete because the TypeScript
  process exhausted its 4 GiB heap. A narrowed check reached only two unrelated
  existing errors in `account-session-store.ts` and
  `runtime-memory-governor.ts`; both production builds and every focused VSE
  test passed. This resource-limited check is recorded rather than represented
  as a clean repository-wide typecheck.

This maturity applies only to owner-selected offline clip conversion and local
developer inspection. It does not accept live capture, model vision, evidence
re-entry, Minecraft correlation, Realtime Texture Pack interpretation, or any
physical/safety behavior.

### VSE-0B implementation evidence — 2026-09-04

Program gate: G8 — environment-harness release evaluation; parallel read-only visual-evidence lane
Workstream: explicitly consented short capture from one selected visual surface
Capability or component: VSE-0B bounded HUD, Minecraft-client, and program-window capture
Lifecycle stage: operator source choice → content-clearance affirmation → consented picker or HUD binding → visible bounded recording → local VSE decode → ephemeral evidence inspection
Reaction timescale: 10 seconds by default or 15 seconds maximum; asynchronous evidence only and never part of the HUD render or motorcycle reflex deadline
Authority owner: developer owns affirmative consent, surface choice, stop, and revoke; browser picker owns external surface selection; HUD host owns render receipts; server owns profile binding, decoded limits, retention, and artifact admission
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: no prompt before affirmative consent, one exact selected surface, 10/15-second bound, no audio, stop/revoke, source-loss and producer-epoch failure, whole-screen/protected/sensitive exclusion, synchronized HUD render receipts, profile/thread isolation, resource cleanup, immutable artifact output, and unchanged controller/watchdog behavior
Explicit non-goals: continuous or hidden screen sharing, ambient desktop recording, microphone/system audio, protected-content bypass, credential or private-message capture, program input, model invocation, environment action, safety-loop dependency, physical projection, optical calibration, or road-use claims
Downstream gate unlocked: VSE-0C model-facing bounded frame-inspection tools may consume an explicitly selected VSE artifact; no model tool or autonomous capture is implemented by VSE-0B

The implemented VSE-0B slice extends the existing VSE-0A artifact path rather
than adding an ambient recorder:

- the shared capture contract binds `capture_session_id`, selected surface,
  `source_id`, `producer_epoch`, developer profile, run, thread, consent/start/end
  timestamps, requested and recorded duration, stop reason, content-clearance
  declarations, and synchronized HUD surface receipts;
- Motorcycle HUD Lab exposes developer-only controls for HUD clean feed, HUD +
  source feed, Minecraft client window, or one selected program/browser tab,
  with 10- and 15-second choices, two affirmative consent/content-clearance
  checks, visible progress, manual stop, and revoke;
- HUD capture snapshots only the chrome-free normalized feed subtree into a
  private canvas stream. It does not capture workstation controls. Composed
  capture requires `hud_over_source`; clean capture requires alpha or projector-
  black mode, and each requires matching `HudSurfaceRenderReceipt` evidence;
- Minecraft and other programs reuse the existing visual-source browser picker.
  Only a selected window or browser tab is admitted; a full-monitor choice is
  stopped and rejected, and display audio is neither requested nor retained;
- the recorder binds the selected display track identity or current HUD source
  and producer epoch, stops all tracks on every terminal path, rejects
  revocation, early track end, producer-epoch drift, recorder failure, and empty
  output, and never produces an artifact for those failed paths;
- the same profile-isolated `/api/visual-sequences` route admits the recording,
  while the server independently enforces the 15-second decoded duration,
  64 MiB byte bound, authenticated profile/thread match, capture schema,
  protected/sensitive/audio exclusions, allowed surface, and HUD receipt mode;
- emitted manifests and receipts distinguish `bounded_capture_decode` from
  offline decode, mark frames `consented_bounded_capture`, preserve the source
  binding and client-declared surface alignments, use one-hour ephemeral
  retention, omit the source recording from the final artifact, and set
  `live_capture=true` while keeping model, assistant-answer, environment-action,
  HUD/controller-mutation, and program-input authority false.

Verification evidence:

- `46` focused tests pass across the real FFmpeg decoder, capture admission and
  security route, existing visual-source lifecycle, bounded recorder, consent
  controls, VSE inspector, reusable HUD host, and Motorcycle HUD fixture;
- a real generated 10-second recording fixture becomes a timestamped live-
  capture manifest/contact sheet with synchronized surface-receipt alignment,
  while decoded-duration, cross-profile, protected/sensitive declaration,
  malformed metadata, whole-monitor choice, revocation, selected-track loss,
  and HUD producer-epoch drift cases fail closed;
- the existing motorcycle replay, watchdog blanking, HUD composition switching,
  fullscreen clean-feed behavior, and future-source lock tests remain green;
- the production client build passed after transforming `3316` modules and the
  production server bundle passed. Its four duplicate-key/case warnings remain
  in unrelated pre-existing modules; and
- a narrowed TypeScript check again exhausted the process's 4 GiB heap without
  producing a source diagnostic. The two production builds and focused runtime
  and contract tests are the positive evidence; the memory-limited typecheck is
  recorded rather than represented as a clean repository-wide result.

This maturity covers local developer capture and evidence construction only.
No live developer-session visual acceptance run was claimed, and no VSE artifact
is automatically sent to Codex, promoted into answer authority, interpreted as
an instruction, or allowed to affect the HUD/controller.

### HUDH-0C1 implementation evidence — 2026-09-04

Program gate: G8 — environment-harness release evaluation; parallel display-orchestration implementation lane that cannot substitute for G8 closure
Workstream: Shared surface hosting and governed UI/MCP parity
Capability or component: HUDH-0C1 profile-bound shared Surface Registry core
Lifecycle stage: Surface desired-state registration, inspection, revision-checked presentation control, output leasing, and cleanup
Reaction timescale: Operator/MCP configuration path; outside the deterministic reflex loop
Authority owner: Authenticated developer profile for surface creation and consent; shared registry for state/revision enforcement; Codex only inside an explicit scoped lease
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Versioned contract validation; developer route and MCP adapter tests; UI/MCP canonical-state hash parity; stale revision, cross-profile, source/profile/producer-epoch mismatch, scoped-operation, Emergency Blank, source rotation, sign-out, and panel-launch-context rejection fixtures; developer UI projection; production builds; Helix Ask discipline check; environment-harness docs audit
Explicit non-goals: Program input or capture authority, environment action, reflex control, model/answer authority, private agent loop, panel-click automation, silent source rebinding, physical output acceptance, optical calibration, or road/safety claim
Downstream gate unlocked: HUDH-0C2 may add the general Surface Workspace and cross-panel launch routing over this registry; live source admission remains HUDH-0B and Codex visual inspection remains VSE-0C

HUDH-0C1 implements the narrow shared state authority beneath the planned
workspace rather than a second panel-local controller:

- `SurfaceInstance`, desired-state, output-lease, control-lease, command,
  `PanelLaunchContext`, and non-terminal receipt schemas are versioned in one
  shared contract. Every surface and receipt explicitly denies program-input,
  reflex, and model-answer authority;
- a profile-isolated server registry owns create, list, inspect, configure,
  Emergency Blank, release, source revoke/rotation, sign-out cleanup, revision
  conflicts, deterministic state hashes, and receipt history;
- the same service is used by the authenticated, same-origin developer HTTP
  route and the `helix_surface_list`, `helix_surface_inspect`,
  `helix_surface_configure`, `helix_surface_blank`, and
  `helix_surface_release` MCP tools. The MCP adapter does not click panels or
  reproduce Codex execution/re-entry/terminal-completion behavior;
- MCP mutations require a user-issued lease bound to the authenticated account
  profile, Codex thread, exact surface, permitted operations, HUD profile,
  source identity, producer epoch, and expiry. A leased MCP client cannot use a
  configure command to migrate itself onto another source or producer;
- reconfiguration replaces the output lease, while Emergency Blank, manual
  release, source revoke/rotation, and sign-out release output and revoke
  relevant control leases; and
- Motorcycle HUD Lab now includes a thin developer status/control projection
  showing canonical revision, target, lease status, and state hash. The user can
  synchronize/register the normalized preview, apply its desired state, issue
  or revoke a five-minute Codex lease, and invoke Registry Blank.

Deterministic evidence establishes equal UI/MCP canonical hashes after the same
configure transition apart from surface, request, and principal identifiers;
rejects stale revisions, cross-profile lookup, wrong operation scope, and
profile/source/producer drift; validates cleanup and stale launch-context
failure; and exercises the real in-memory MCP transport. This is configuration
and observation orchestration only. It does not make the normalized renderer a
physical visor surface, admit arbitrary program pixels, or move any safety
decision out of the resident controller/watchdog.

Verification record:

- `18` focused tests passed across the shared registry, developer HTTP boundary,
  real in-memory MCP transport, status/consent UI, reusable HUD host, and
  Motorcycle HUD Lab;
- the production client build passed after transforming `3318` modules;
- the production server bundle passed with four duplicate-key/case warnings in
  unrelated pre-existing modules;
- `npm run helix:ask:discipline:quick` passed its static checks. Its broad dirty-
  worktree scan warned that no environment classification variable was supplied;
  this packet's declared classifications are `tool admission` and
  `presentation`, and it introduces no private Codex runtime; and
- `npm run helix:environment-harness:docs-audit` passed with zero failures.

### HUDH-0C2 implementation evidence — 2026-09-04

Program gate: G8 — environment-harness release evaluation; parallel display-orchestration implementation lane that cannot substitute for G8 closure
Workstream: Shared surface hosting and governed UI/MCP parity
Capability or component: HUDH-0C2 general Surface Workspace and typed cross-panel routing
Lifecycle stage: Canonical surface inspection/configuration → route preparation → validated panel launch context → human-visible destination focus
Reaction timescale: Operator/Codex configuration and navigation path; outside the deterministic reflex loop
Authority owner: Authenticated developer profile owns surface selection, configuration, consent, and visible panel opening; Surface Registry owns identity/revision validation and receipts; Codex may only prepare a route under an exact user-issued lease
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Developer panel registration and account-policy lock; typed route/request/receipt validation; canonical revision and source/profile/producer binding; stale-write and wrong-operation rejection; UI route publication and destination context injection; real MCP transport; focused client/server tests; production builds; Helix Ask discipline check; environment-harness docs audit
Explicit non-goals: MCP panel-click automation, program input, capture permission, environment mutation, reflex authority, model/answer authority, private agent loop, live-source acceptance, physical projector output, visor transform validation, or road/safety claim
Downstream gate unlocked: HUDH-0C3 may add detachable clean-feed/fullscreen presentation over the same surface identity; HUDH-0B still owns live source admission and VSE-0C still owns Codex visual inspection/re-entry

HUDH-0C2 adds the reusable developer Surface Workspace above the HUDH-0C1
registry without moving state authority into the React panel. The workspace:

- lists and inspects every surface owned by the signed-in developer profile,
  including revision, source kind and identity, producer epoch, output lease,
  state hash, control receipts, and route receipts;
- creates an explicitly unbound normalized surface for manual experimentation,
  changes only presentation fields through revision-checked registry commands,
  and exposes Emergency Blank as the immediate authority-reducing control;
- issues or revokes a visible five-minute Codex lease bound to one thread and
  the exact surface/profile/source/producer epoch. The `route` operation is an
  explicit lease scope alongside configuration, blank, and release rather than
  an implication of surface visibility;
- prepares typed destinations for HUD Lab, Image Lens, Live Answer, Situation
  Room, Process Graph, Workflow Timeline, Storage Map, and Task Manager. Every
  route carries the exact surface revision, profile, run, source, producer
  epoch, sequence/focus references, and current output lease in a versioned
  `PanelLaunchContext`; and
- publishes a validated route to a client-side context provider before the
  human UI opens/focuses the destination panel. Destination panels can consume
  the same route context without parsing labels, query-string fragments, or
  panel-local copies of surface state.

The developer HTTP route and `helix_surface_prepare_panel_route` MCP tool both
call the same registry method. A human UI principal may prepare and immediately
open a destination. MCP requires an active lease containing the exact `route`
operation and returns only a non-terminal preparation receipt: it does not
click, focus, open, or otherwise operate workstation UI. Route preparation does
not increment the surface revision or alter its state hash, so navigation
cannot masquerade as a presentation-state mutation. Stale revisions, wrong
profiles, expired/revoked/wrong-operation leases, and source/producer drift fail
closed.

The new `surface-workspace` panel is registered in the ordinary workstation
panel catalog and generic open capability, remains visible and usable to the
developer wildcard policy, and is explicitly locked for public/no-session
users. This is the general classification intended by the plan: motorcycle HUD
is one profile and one destination, while the shared surface identity and route
contract can support game HUDs, normalized camera/source overlays, capture
review, realtime texture work, and later hardware-production views.

Verification record:

- `23` focused tests passed across registry state/lease routing, same-origin
  developer HTTP routing, real in-memory MCP transport, client route validation
  and event delivery, Surface Workspace rendering/routing, and public account
  lock behavior;
- the production client build passed after transforming `3322` modules, and the
  production server bundle passed with four warnings in unrelated pre-existing
  duplicate-key/case sites;
- repository-wide TypeScript checking first exhausted the default 4 GiB Node
  heap without producing a diagnostic, then completed under a 6 GiB heap and
  reported the repository's broad pre-existing type-error backlog. The focused
  tests and both production builds are the positive packet evidence; no clean
  repository-wide typecheck is claimed;
- `npm run helix:ask:discipline:quick` passed with declared classifications
  `tool admission` and `presentation`; and
- `npm run helix:environment-harness:docs-audit` passed with zero failures.

## Open decision register

Resolve these in order and record evidence rather than preference:

1. flat coupon versus formed combiner for MHUD-2;
2. chin versus brow optical path after measured bench comparison;
3. monocular versus binocular placement and associated eye-box/visual-comfort
   constraints;
4. virtual-image distance and optical prescription strategy;
5. minimum useful daylight luminance without harmful night brightness;
6. wired breakaway versus authenticated wireless helmet link;
7. exact sector geometry and whether rear maps to lower center;
8. which urgency properties use size, motion, brightness, shape, haptic, or
   audio without relying on color alone;
9. sensor modality and mounting after fixture requirements are frozen;
10. data retention and consent protocol for any later person or public-space
    recording;
11. whether each first-class program should provide typed scene state, an
    embeddable web surface, or permissioned pixel capture;
12. which desktop/browser capture APIs satisfy exact tab/window identity,
    revocation, protected-content, and secret-exclusion requirements;
13. alpha-capable clean-feed transport and whether chroma/black-key fallbacks
    are acceptable for each projector pipeline;
14. underlay freshness policy for optional context versus sources required for
    geometric registration; and
15. compositor placement and measured latency across workstation preview,
    virtual environment, recording, and physical-output adapters;
16. whether a clean feed is an in-process canvas, isolated desktop surface,
    browser capture target, or encoded local stream for each downstream adapter;
17. exact behavior of panel fullscreen versus detachable clean-feed presentation
    on desktop and mobile layouts; and
18. which sources remain capturable in borderless or exclusive-fullscreen modes,
    with unsupported cases reported rather than bypassed;
19. decoder implementation, frame image format, maximum decoded dimensions, and
    whether an archival source copy is retained or only content-addressed;
20. default timestamp cadence, contact-sheet layout, adaptive-review budget, and
    maximum frame count/bytes admitted to one model turn;
21. local artifact retention, redaction, encryption, tenant isolation, and
    explicit export policy for clips that may contain people, screens, or
    credentials;
22. which Codex/vision provider capability contract supports image batches,
    including typed behavior when image reasoning is unavailable and explicit
    cost/latency budgets when it is available;
23. whether audio is excluded initially or admitted later as a separately
    consented transcript track synchronized to video timestamps; and
24. the candidate-procedure schema and verification boundary for extracting
    Minecraft tutorial steps without treating tutorial pixels, captions, or
    narration as executable instructions;
25. the minimum `TheoryDesignLink` fields needed to bind Theory Badge Graph
    scale/unit/claim context to device requirements without coupling HDH to one
    research program;
26. the hardware-project registry persistence, artifact storage and immutable
    supersession policy;
27. which CAD, EDA, simulator, DFM and instrument adapters are admitted first,
    and which operations require attended versus time-bounded leases;
28. the unit-aware component compatibility engine and allowed external
    component-catalog sources;
29. the preregistration, held-out evidence and analysis-code freeze required to
    prevent design-to-test circularity; and
30. the exact human release and as-built return packet for fabrication, vendor
    communication and later measurement re-entry;
31. the minimum canonical geometry, discrete-structure, material, semantic and
    uncertainty layers in a `PortableObjectPackage`;
32. which Minecraft region facts and block-entity fields may be exported,
    redacted or rejected under each profile and environment policy;
33. the source-to-canonical-to-target frame and scale conventions, including
    unscaled visual-only packages;
34. the first local depth/LiDAR format and registration/meshing implementation;
35. whether Meshy or another external reconstruction provider is admitted after
    local EOT fixtures, including account, cost, data-processing, retention and
    deletion terms; and
36. the target-loss thresholds and exact action authority for Minecraft,
    game-engine, simulator, CAD and fabrication-candidate realizations;
37. the common `MultimodalCaptureSession` clock, frame, health and terminal-state
    model across real hardware and simulated environments;
38. which audio, image, video, depth, LiDAR, pose and typed-world modalities are
    initially supported and how each permission is surfaced;
39. the boundary between raw clean sensor tracks, composed operator-view
    recordings, derived recognition/reconstruction and HUD guidance layers;
40. profile storage quotas, encryption, retention, redaction, export and delete
    policy for each modality and privacy class;
41. the first safe `CapabilityRecipe` vocabulary and resource/cost/lease limits
    without creating a private executable agent language; and
42. which HUD-guided coverage, placement, focus, range and occlusion cues can be
    admitted before any human-factors or physical-device acceptance;
43. the canonical `ConnectedReasoningSession` identity and how it references
    rooms, runs, Ask turns, realtime interactions and multimodal sessions;
44. which installed-node, hosted-node and remote-client topologies support the
    first genuine off-LAN continuation without implying universal reachability;
45. the independent publish/read/annotate/speak/steer/capture/action grants and
    participant-visible sharing indicators for every room surface;
46. the initial `InformationFlowBudget` units, salience rules, adaptive sampling
    priorities and critical-event non-drop policy;
47. how simultaneous participant intents are ordered, attributed, interrupted
    and resolved without merging them into an unauthored prompt; and
48. the exact GPT Realtime/Codex handoff, terminal-artifact, voice playback and
    text-certainty parity evidence required before a connected-call claim.

## Program evidence and documentation rules

- Use only the environment-harness maturity terms: `projected`, `specified`,
  `implemented`, `deterministically verified`, `live accepted`, `integrated
  accepted`, and `release-ready`.
- A rendered fixture is not an optical result. An optical bench result is not a
  human-factors result. A human-factors result is not certification.
- Every later development packet begins with the exact environment-harness
  header and names one primary lifecycle stage.
- Audits are immutable evidence snapshots. This plan may be revised by version;
  it must not replace the canonical environment-harness work program.
- Changes to canonical environment-harness maturity/status claims or acceptance
  documentation require `npm run helix:environment-harness:docs-audit`.
- Casimir verification is not required for this planning-only document. It
  becomes applicable if a later patch touches adapter contracts, training-trace
  capture/export, certificate semantics, CI/release verification, or makes a
  certified physical-viability claim.

## Governing references

- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` as a lifecycle
  and authority reference only; Minecraft domain actions do not transfer
- `docs/architecture/theory-badge-graph-contract.md` for evidence-only theory
  localization, scale bands, runtime rows, uncertainty and claim boundaries
- `docs/architecture/theory-experiment-procedure.md` for governed procedure and
  evidence-re-entry structure
- `docs/specs/casimir-tile-spec-v1.md` as a precedent for separating a physical
  lab coupon from a system-mechanism abstraction; its values and maturity do not
  transfer to the motorcycle project
- `docs/research/nhm2-spherical-boson-star-v2-work-program.md` as an example of
  research-program gate ownership and diagnostic Theory Graph limits; HDH does
  not alter or supersede it
- [Meshy image-to-3D API](https://docs.meshy.ai/en/api/image-to-3d) and
  [official AI/MCP integration](https://docs.meshy.ai/en/api/ai) as one optional
  external reconstruction-adapter reference; EOT remains provider-neutral
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`
- future motorcycle adapter contract, to be created only in the scoped MHUD-1
  implementation packet
