# EH-CPE-0 Callable Physical Experiment Environment v1

Program gate: G8 — environment-harness release evaluation; nonperturbing parallel scientific-environment planning lane that cannot substitute for G8 or any research-program gate
Workstream: Callable physical experiments, cloud laboratories, self-driving laboratories, and programmable scientific hardware
Capability or component: CPE-0 provider-neutral experiment requirement, capability discovery, compatibility, cost approval, execution, measurement evidence, and theory re-entry contracts
Lifecycle stage: theory question → frozen experiment requirement → provider capability match → feasibility and cost approval → physical execution → calibrated evidence bundle → independent analysis → owning research-program review
Reaction timescale: asynchronous human-approved experiment planning and job execution; deterministic device control remains local/provider-owned and no model is placed in a hard real-time or safety loop
Authority owner: the user owns provider selection, spending, external submission, data release, and cancellation; the laboratory/provider owns apparatus operation and physical safety; local device controllers and interlocks own bounded machine protection; Helix owns identity, compatibility admission, budgets, provenance, evidence classification, and re-entry; Runtime Codex may propose and analyze experiments but cannot self-authorize cost, safety, apparatus capability, empirical truth, or theory promotion
Current maturity: specified
Target maturity: deterministically verified for provider-neutral contracts and one read-only capability catalog; each live provider requires separate attended acceptance
Required evidence: immutable provider-capability snapshots; exact account/project/provider/instrument/protocol/calibration/job identities; requirement-to-capability compatibility fixtures; units/range/sensitivity/sample/geometry/control/observable matching; quote and budget receipts; explicit approval and idempotent submission; cancellation/reconciliation; raw, derived, failed, aborted, and negative-result retention; uncertainty and deviation records; source/runtime-disjoint replay; prompt-injection, stale-capability, credential, cost, calibration, cherry-picking, and circular-evidence poison cases
Explicit non-goals: claiming universal laboratory access, silently constructing arbitrary apparatus, autonomous purchasing, hidden or unbounded experiments, exposing credentials to a model, allowing an LLM to replace device interlocks or fast control, treating provider job completion as scientific validation, treating analog quantum hardware as spacetime or Casimir evidence, or promoting NHM2, warp, device-performance, product, clinical, environmental, or safety authority
Downstream gate unlocked: CPE-0A may define a read-only provider capability registry and requirement compatibility matrix; no provider credentials, job submission, laboratory operation, or empirical claim is authorized by this packet

## Decision

Add a reusable **callable physical experiment environment** above individual
laboratory providers. The harness should be able to ask:

> Which currently documented physical platform can control the required
> variables and measure the frozen observable at the necessary sensitivity,
> with the required calibration, controls, uncertainty, budget, and evidence
> return?

That question is narrower and more useful than asking whether a provider is
"quantum" or "autonomous." A cloud laboratory describes remote access, a
self-driving laboratory describes how experiment choices are iterated, and
laboratory automation describes the instruments and controllers that execute
the work. Those classifications are orthogonal and must remain separate.

The provider-neutral layer is an environment adapter, not a second scientific
reasoner and not a second Theory Graph. It composes the existing
`TheoryExperimentProcedure`, hardware-definition digital thread, environment
capability catalog, approval/lease system, artifact storage, evidence re-entry,
and single terminal-answer lifecycle.

## Verified external motivation snapshot

This planning snapshot was checked on September 5, 2026. Provider availability,
pricing, quotas, APIs, safety policies, and terms are mutable and must be
refreshed before any implementation or purchase.

| Example | What the source establishes | What it does not establish |
| --- | --- | --- |
| [Oqtant OqtAPI documentation](https://oqtant-docs.infleqtion.com/) | A Python and REST-accessible service can submit single or batched jobs that manipulate time-varying optical potentials on a Bose–Einstein condensate and retrieve results. | Compatibility with arbitrary samples, vacuum hardware, Casimir apparatuses, gravitational observables, or unrestricted current quota/pricing. |
| [Communications Physics Oqtant experiment](https://www.nature.com/articles/s42005-026-02720-6) | Researchers used the cloud BEC platform to measure collective-mode behavior and report indirect evidence for anomalous tunneling within that apparatus. | Direct observation of arbitrary tunneling systems or transfer of the result to NHM2/Casimir claims. |
| [Amazon Braket Aquila documentation](https://docs.aws.amazon.com/braket/latest/developerguide/braket-quera-submitting-analog-program-aquila.html) | A user can specify supported atom arrangements and time-dependent Hamiltonian controls and receive measurements from a neutral-atom processor. | A universal analog simulator, arbitrary Hamiltonian, arbitrary apparatus, or evidence about spacetime merely because real atoms execute the program. |
| [OpenAI–Ginkgo cloud-lab report](https://openai.com/index/gpt-5-lowers-protein-synthesis-cost/) | A model/lab loop used strict programmatic executability validation, six experiment rounds, more than 36,000 reaction compositions, and reported a 40% cost reduction for the studied cell-free protein-synthesis process. | A human-free or domain-general laboratory, or permission for this harness to copy its private control loop. |
| [Anthropic Model Hardware Standard research preview](https://www.anthropic.com/news/model-hardware-standard-research-preview) | A research-preview device description/driver approach exposes read/write primitives through MCP, CLI, and code while allowing deterministic scripts to handle work that should not depend on online model reasoning. | A deployed universal standard, laboratory access, provider compatibility, safety certification, or authority to bypass CasimirBot's own admission and evidence contracts. |
| [Periodic Labs](https://periodic.com/) | An organization publicly describes AI scientists operating autonomous physical-science laboratories and names higher-temperature superconductors as a goal. | A public self-service experiment catalog, a price-per-run API, or compatibility with a user-specified experiment. |

These examples establish feasibility of several interface layers. They do not
establish immediate access to a suitable platform for any particular Casimir or
NHM2 measurement.

## Architectural separation

```text
Theory Graph / research work program
              │ question, claim ceiling, open empirical axis
              ▼
TheoryExperimentProcedure + ExperimentRequirementSpec
              │ frozen observable, controls, sensitivity, falsifier
              ▼
Callable Physical Experiment Registry
              │ immutable provider capability snapshot
              ▼
CompatibilityAssessment
   ├─ compatible
   ├─ compatible_with_commissioning
   ├─ incompatible
   └─ unknown
              │
              ▼
FeasibilityQuote + user cost/safety/data approval
              │ one idempotent external submission lease
              ▼
Provider adapter → provider scheduler → apparatus controller/interlocks
              │ raw status and physical run receipts
              ▼
ExperimentalEvidenceBundle
              │ raw data, calibration, deviations, failures, uncertainty
              ▼
independent analysis + evidence admission
              │
              ▼
owning research work program decides whether its claim ceiling changes
```

The slow reasoning loop may choose a scientific question, propose a batch, and
analyze returned measurements. It cannot directly drive timing-critical
actuators. A provider or local deterministic controller owns exact sequences,
hard bounds, emergency stops, and machine recovery. This is the same durable
controller/watchdog pattern used by the environment harness, classified for a
laboratory rather than inheriting Minecraft actions or maturity.

## Canonical contracts

The following are proposed under `shared/contracts/callable-experiments/`:

| Contract | Required content |
| --- | --- |
| `ExperimentRequirementSpec` | owning work program/gate, theory-design link, hypotheses, observable, intervention, sample/material/geometry, units, parameter ranges, sensitivity, precision, cadence, environment, controls, nuisance model, calibration, uncertainty, falsifiers, stop rules, budget ceiling, data policy, and frozen analysis reference |
| `LaboratoryCapabilityManifest` | provider and snapshot identity, access mode, instrument/apparatus identity, supported samples and controls, observable types, ranges, resolution/sensitivity, timing, geometry, calibration model, batch limits, evidence outputs, safety/commissioning constraints, availability confidence, documentation refs, and expiry |
| `ExperimentCompatibilityAssessment` | exact requirement and capability hashes, field-by-field matches, conversions, unmet requirements, unknowns, commissioning needs, forbidden substitutions, result class, evaluator identity, and no-execution authority |
| `ExperimentFeasibilityQuote` | provider quote/request identity, compatible protocol revision, price/currency, quotas, lead time, expiration, cancellation terms, data/retention terms, taxes/fees, uncertainty, and no automatic approval |
| `ExperimentExecutionApproval` | user/account/project, exact requirement/capability/quote/protocol hashes, cost ceiling, run/batch ceiling, validity window, cancellation authority, external-data release, approval strength, and idempotency key |
| `PhysicalExperimentRunManifest` | provider job, apparatus/instrument, controller/software, protocol, samples, calibration, operator/scheduler, timestamps, deviations, status transitions, consumed budget, abort/cancel state, and immutable artifact refs |
| `ExperimentalEvidenceBundle` | raw measurements, calibration and instrument state, exact executed protocol, failed/aborted runs, negative results, exclusions, derived data, analysis code, uncertainties, chain of custody, provider assertions, independent checks, and evidence-role labels |
| `ExperimentIterationPlan` | frozen round objective, admitted parameter space, batch size, stop conditions, total/round budget, held-out validation set, optimization policy artifact, human-approval cadence, and prior evidence refs |

`ExperimentClosurePacket` remains owned by the Hardware Definition program. It
may reference an admitted `ExperimentalEvidenceBundle`; this lane must not
create a competing closure or theory-promotion owner.

## Provider and access classification

Every registry entry declares both axes:

```text
access_mode:
  documented_public_api | web_job_service | application_required |
  customer_engagement | research_preview | private_or_unknown

execution_mode:
  fixed_platform_remote_operation | provider_executed_protocol |
  self_driving_iteration | local_programmable_instrument |
  device_interoperability_layer
```

An API does not imply current entitlement. A research preview does not imply an
installable standard. A customer engagement does not imply public booking. A
capability document does not imply the apparatus is online, calibrated, within
quota, or suitable for the requested observable. All live facts require a
fresh provider observation and exact account/project binding.

## External mutation and spending boundary

Submitting an experiment is an externally consequential mutation. The first
implementation must remain read-only. Later submission requires:

1. a current capability snapshot and compatibility result;
2. an exact provider account/project and credential held outside model context;
3. a nonexpired quote or explicit worst-case price envelope;
4. human approval of cost, sample/data release, safety class, protocol and run
   count;
5. an idempotency key and provider-side reconciliation before retry;
6. bounded polling with cancellation and terminal-state handling; and
7. returned evidence that distinguishes provider assertions, raw measurements,
   derived analysis, and independent verification.

No model may increase budget, number of rounds, sample class, instrument class,
parameter range, or data-sharing scope. A retry after an ambiguous response
must reconcile the original job rather than submit a second experiment.

## Closed-loop experimentation boundary

A self-driving loop is introduced only after one attended, single-round
provider journey is accepted. Each multi-round program freezes:

- the allowed parameter domain and constraints;
- the maximum experiments, rounds, wall time, and total cost;
- which results may be used for exploration and which are held out;
- the optimizer/model artifact and deterministic validation layer;
- stop conditions for safety, uncertainty, lack of improvement, anomaly,
  provider drift, or budget exhaustion; and
- how often a person must approve continuation.

The model proposes a round. Helix validates it against the frozen envelope. The
provider/local controller executes it. Results re-enter Codex as evidence. No
provider receipt or optimizer score is an assistant answer, and no favorable
result automatically edits the theory.

## NHM2 and Casimir relationship

This lane is nonperturbing to the active NHM2 program. It does not edit a frozen
candidate, run the source-to-experiment apparatus, or advance P8P, ET0, BMR-I,
G3, physical, propulsion, or transport authority.

An NHM2/Casimir request may enter provider matching only after its owning packet
freezes the exact apparatus state(s), observable, predicted sign/band or null,
sensitivity, calibration, control experiments, nuisance model, uncertainty,
article identity, analysis hash, and falsifiers. Matching then asks whether a
provider can execute that exact measurement. The result may be `incompatible`
or `compatible_with_commissioning`; those are useful scientific outputs.

Oqtant is a concrete demonstration that theoretical researchers can manipulate
and measure a supported BEC remotely. It may support bounded cold-atom or
bosonic-dynamics benchmarks when an exact theory packet calls for those
observables. It does not supply the complete conserved Casimir-apparatus
`delta T_munu`, vacuum-weight measurement, gravitational detector response, or
NHM2 source evidence. Aquila similarly produces physical neutral-atom results
for supported Hamiltonians, not evidence of a spacetime metric or warp effect.

## Proposed repository hierarchy

```text
shared/contracts/callable-experiments/
├─ experiment-requirement.v1.ts
├─ laboratory-capability-manifest.v1.ts
├─ compatibility-assessment.v1.ts
├─ feasibility-quote.v1.ts
├─ execution-approval.v1.ts
├─ physical-run-manifest.v1.ts
├─ experimental-evidence-bundle.v1.ts
└─ iteration-plan.v1.ts
shared/callable-experiments/                         # validation + canonical hashes
server/services/callable-experiments/
├─ capability-registry/
├─ compatibility/
├─ approval-and-budget/
├─ job-reconciliation/
└─ evidence-admission/
server/mcp/callable-experiments/                     # thin tools over service owners
client/src/components/workstation/laboratory-workspace/
connectors/laboratory-providers/
├─ oqtant/                                           # future, separately admitted
├─ amazon-braket/                                    # future, separately admitted
├─ cloud-lab/                                        # provider-specific profiles only
└─ mhs/                                              # preview/interoperability adapter
hardware/experiment-projects/                        # refs to HDH projects, not copies
artifacts/callable-experiments/                      # immutable job/evidence outputs
docs/provider-snapshots/callable-experiments/        # dated, expiring capability evidence
```

Provider directories are reservations, not installed connectors or statements
of commercial access.

## Staged program

| Phase | Build | Required evidence | Promotion boundary |
| --- | --- | --- | --- |
| CPE-0A | read-only capability registry, provider snapshots, requirement schema, and compatibility matrix | schema/hash fixtures; units/range/sensitivity/geometry/control matching; stale/unknown/incompatible outcomes; source citations; no credentials or external calls | provider documentation and compatibility planning only |
| CPE-0B | shadow feasibility and quote adapters | exact account-free request projection, provider response normalization, mutable-term expiry, cost/lead-time/data-policy comparison, and no-submission proof | feasibility evidence only; no experiment booked |
| CPE-0C | one attended single-run provider journey | exact account/project/credential boundary, approval, idempotency, cost cap, submission, bounded status, cancellation/reconciliation, and terminal job receipt | provider execution receipt only; no scientific conclusion |
| CPE-0D | calibrated evidence ingestion and independent replay | complete raw/failed/aborted/negative dataset, calibration state, executed protocol, deviations, uncertainty, chain of custody, independent analysis, and theory-program readmission | exact empirical result only; no cross-theory transfer |
| CPE-0E | bounded multi-round/self-driving experiment | frozen search envelope, held-out validation, per-round and total budgets, deterministic executability checks, model-offline continuity, stop behavior, and human continuation policy | exact optimization study only; no general autonomous-lab claim |
| CPE-0F | local/MHS-style programmable instrument profile | device description, driver identity, independent interlocks, deterministic controller, read/write scopes, manual/E-stop behavior, fault recovery, calibration, and attended physical acceptance | exact device/configuration only; no universal MHS or laboratory acceptance |

No stage inherits another provider's access, apparatus, calibration, scientific
domain, or maturity.

## First goal

The first goal is **CPE-0A: Provider Capability Registry and Experiment
Compatibility Matrix**. It is deliberately read-only. It should encode dated
capability snapshots for Oqtant and one contrasting platform, then compare
manufactured experiment requirements against them with explicit `compatible`,
`compatible_with_commissioning`, `incompatible`, and `unknown` outcomes.

It must not request credentials, create an account, obtain a quote, submit a
job, purchase laboratory time, or claim empirical evidence.

## Stop/fail criteria

Stop when any path:

- matches only on a theory name such as "quantum," "Casimir," or "bosonic"
  instead of controls and observables;
- treats an API schema, quote, queue status, or completed job as a calibrated
  measurement;
- omits failed, aborted, negative, excluded, or out-of-range runs;
- lets a provider-generated summary overwrite raw data or uncertainty;
- exposes credentials, samples, private datasets, unpublished theory, or
  provider secrets to an unapproved party or model context;
- retries an ambiguous external submission without reconciliation;
- permits model reasoning to bypass local/provider interlocks;
- uses returned data to retune a frozen prediction and scores it as independent;
- transfers evidence from BEC, quantum processor, chemistry, biology, material,
  Minecraft, simulation, or another apparatus into a different claim; or
- raises a Theory Graph/research maturity state outside the owning work program.

## Governing repository references

- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/helix-environment-adapter-registry-v1.md`
- `docs/architecture/theory-experiment-procedure.md`
- `docs/work-packets/eh-hci-0a-repository-harness-capability-crosswalk-v1.md`
- `docs/work-packets/eh-mhud-0-motorcycle-helmet-hud-build-plan-v1.md`
- `docs/research/nhm2-source-to-experiment-closure-parallel-work-packet-v1.md`
- `WARP_AGENTS.md`

