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

The software program contains four separate runtimes rather than one large app:

| Runtime | Purpose | Inputs | Outputs | Safety authority |
| --- | --- | --- | --- | --- |
| replay/simulator | generate and replay deterministic traffic and pose cases | fixture tracks, synthetic scenarios | expected threats and cues | none |
| embedded reflex runtime | meet bounded timing and freshness policy | normalized tracks and pose | admitted `HudCue` plus receipt | display cues only |
| operator/calibration app | configure fixture, inspect timing, align optics, export evidence | run config and receipts | calibration and reports | no threat invention |
| CasimirBot adapter | expose governed observations and digests to Runtime Codex | compact events and evidence refs | advisory interpretation and predeclared requests | no reflex or vehicle authority |

No runtime may privately sample an LLM, execute arbitrary tools, manufacture an
answer from a receipt, or bypass Helix admission. The adapter reuses the generic
resident-controller lifecycle after its motorcycle profile is specified; it
does not copy Minecraft action vocabulary.

### Proposed repository shape

```text
shared/helix-motorcycle-awareness.ts
connectors/environment/examples/motorcycle-awareness/
fixtures/environment-source/motorcycle-awareness/
server/services/environment-connectors/conformance/__tests__/
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
    recording.

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
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`
- future motorcycle adapter contract, to be created only in the scoped MHUD-1
  implementation packet
