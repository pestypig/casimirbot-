# Casimir Spec Benchmark Contract

Status: design candidate; no authored case pack, restricted hidden-gold bundle,
pre-freeze calibration acceptance, frozen evaluator/rubric, external
commitment, or benchmark result exists. This document is not yet a frozen
preregistration. Numeric counts below are planning commitments awaiting case
construction, expert review, calibration acceptance, tool/model pins, and
external timestamping.

## Question

Does the pinned Casimir verified-workflow bundle through Lean improve
scientifically verified claim resolution over the same model with equivalent
retrieval while meeting the absolute preregistered false-certification safety
gate and preserving explicit uncertainty?

The causal baseline is a pinned model configuration, not the changing consumer
product label "GPT Plus." A dated consumer-surface run may be reported as an
exploratory arm, but it cannot establish the causal effect of this workflow.

## Freeze prerequisite

Before parser development or model/prompt tuning begins, a reviewed benchmark
revision must freeze all of the following:

- public/development case and source manifests plus one salted commitment to the
  complete restricted case/source/gold bundle, with its ordinary subject hashes
  withheld until evaluator reveal;
- the grouped public/development/held-out split, total case count, per-stratum
  counts, sample-size justification, and power/sensitivity analysis;
- an arm-neutral VCR rubric, evaluator implementation/version, blinded
  adjudication procedure, and false-certification denominator;
- exact task, system, and developer prompt hashes;
- base tool manifest plus the declared capability delta for every arm;
- the model/API configuration and accounting boundaries; and
- a semantic hash of the policy and an external timestamped commitment.

Held-out prompts or gold artifacts must not be inspected after this freeze until
the final run. Revisions require a new policy version and an append-only link to
the prior commitment. Freezing the design happens before tuning; executing the
untouched held-out benchmark happens only after the candidate system is ready.

## Evaluation gates

The evaluation has two distinct gates:

1. Deterministic conformance: IR shape, references, canonical hashes, source
   mapping, formatter round trip, Lean emission/replay, tamper detection, and
   fail-closed fixtures.
2. Paired model benchmark: the same initial task and frozen source packet,
   model snapshot, shared sampling policy, and supported seeds across arms,
   with every arm-specific capability delta declared and recorded.

Conformance failure blocks comparative promotion even if answer scores improve.

## Experimental arms

1. `pinned_model_only`: pinned model with no retrieval or Casimir tools.
2. `pinned_model_equivalent_retrieval`: the same model with the frozen source
   packet exposed through the retrieval interface committed by the eventual
   frozen policy.
3. `current_research_workflow_reflection`: the same model and source packet with
   `research-paper-to-proposal` v1 evidence admission and theory reflection,
   stopping after `provenance_audit` and before `proposal_handoff`. Benchmark
   execution must not submit a real postulate or mutate a production review
   queue.
4. `casimir_spec_system_definition`: the same initial source packet, with the
   Casimir Spec definition generated end to end by the candidate workflow. A
   gold/oracle specification may be used only as a separately labelled ceiling
   diagnostic and is not part of the causal comparison.
5. `casimir_spec_lean`: arm 4 plus restricted Lean emission and pinned replay
   receipts.
6. `casimir_spec_lean_lanyon_pde`: arm 5 plus independently validated
   Lanyon/numerical receipts on the eligible PDE subset only.

The Lanyon arm is not pooled into the general-language effect. It answers a
separate PDE-backend question.

The single confirmatory comparison is `casimir_spec_lean` versus
`pinned_model_equivalent_retrieval`. The system-definition arm is a mechanistic
ablation; model-only and current-workflow arms are contextual comparisons.
Selecting a different primary pair requires a new policy version before any
held-out result is opened.

This contrast estimates the total bundled effect of research-workflow
reflection, Casimir Spec, semantic admission, and Lean replay as configured. It
does not isolate which component caused an effect. Ablations are descriptive
unless separately powered and committed; the primary result must not be
reported as a component-specific Lean or language effect.

## Causal input and execution parity

All causal arms receive the same task. Every source-using arm receives the same
hash-bound initial projection, corpus, chunks, index, and base retrieval tool;
the model-only arm's lack of source access is its explicit treatment delta.
Later arms may not receive the packet directly while the retrieval baseline
must search it. Any delivery difference is a separate declared intervention.
Live paper discovery or source selection is excluded from the causal run
because it changes the evidence itself; it may be measured in a separate
ecological workflow study. Equal initial source evidence among source-using
arms does not hide the cost of generated specifications or tools: all extra
model tokens, tool calls, latency, failures, and artifacts are charged to the
arm that produces them.

The frozen run must pin the exact model ID and API/provider version, returned
system fingerprint when available, reasoning effort, temperature, top-p,
context limit, output-token limit, base tool policy, per-arm capability delta,
retrieval corpus/index, prompt hashes, and retry/timeout policy. If the provider
does not support or honor a requested seed, the run records that fact and must
not use seed-paired inference for that sample.

Formal and numerical tools remain developer-only during evaluation. The run
manifest binds the account-policy version, account mode, tenant/auth mode, and
the isolated non-production artifact/proposal sink.

## Case design

Cases are grouped by underlying scientific problem before splitting so
paraphrases, alternate notation, or source variants cannot leak between public
and held-out sets. Strata must cover:

- definition and theorem-statement fidelity;
- types, dimensions, units, frames, and validity domains;
- observable identity and missing/invalid bridges;
- open-world abstention and out-of-graph cases;
- assumption, axiom, and import smuggling;
- `noncomputable` versus unresolved or independence-not-established;
- empirical and physical overclaiming;
- numerical convergence and floating-point/refinement boundaries;
- proposition/source/toolchain tampering;
- adversarial instructions embedded in source material.

Each problem receives one primary challenge stratum and one of six subject
domains: formal mathematics/statistics, physics/astronomy,
chemistry/materials, life/health science, Earth/environment/space science, or
engineering/computational science. The resulting 66 cells define a uniform
benchmark target; they are not an estimate of how often these problems occur in
science generally.

The design-candidate allocation is:

| Split                 | Groups per cell | Independent problem groups |
| --------------------- | --------------: | -------------------------: |
| Public examples       |               1 |                         66 |
| Open development      |               2 |                        132 |
| Blinded calibration   |               2 |                        132 |
| Confirmatory held-out |              15 |                        990 |
| Total                 |              20 |                      1,320 |

Each held-out cell contains five direct, five compositional, and five
adversarial problems. Alternate prompts, notation, source variants, templates,
or equivalent gold semantics are connected in a leakage graph; the entire
transitive component must occupy one split. A frozen common-background
allowlist is the only permitted source-hash exception.

Version 1 selects exactly one evaluation task per problem group, so the case
count and independent-group count are both 1,320. Related alternatives remain
leakage identities used by the split audit, not extra pseudo-independent scored
rows. A later multi-task-per-problem design would require a new estimand and
statistics contract.

Hidden gold includes admitted definitions, exact propositions, required
assumptions and axiom dependencies where applicable, correct blockers, required
exclusions, acceptable abstention states, fixed backend eligibility, and every
false-certification opportunity. Human evaluators are metadata-blinded, not
claimed to be content-blinded: Lean- or Casimir-shaped output can reveal its
origin. They must not receive arm IDs, tool traces, arm-derived filenames, or
each other's initial ratings.

Real blinded-calibration and held-out tasks, prompts, sources, gold, salts, and
subject hashes live outside the repository with the evaluator custodian. The
tracked repository may contain only public/development content and explicitly
synthetic conformance fixtures.

## Sample-size sensitivity

There are three replicate slots per problem. Provider seeds 7, 11, and 13 are
used only if a sacrificial pre-benchmark check confirms seed support. Otherwise,
the slots are interleaved case/time-blocked calls with seed recorded as null.
The experimental unit remains the problem group, never the case-seed episode.

For problem-level paired difference

`D_i = mean_r(VCR_casimir+lean,i,r - VCR_retrieval,i,r)`,

the planning approximation for two-sided alpha 0.05, 80% power, and a
five-point effect uses the mean within-cell variance because the estimator
holds the 66 cell weights fixed:

`n = ((z_0.975 + z_0.80)^2 * mean_cell(Var(D_i | cell))) / 0.05^2`.

At 990 held-out groups, the design reaches 80% planning power at five points
only when mean within-cell problem-level variance is at most 0.315. Illustrative
variance/MDE/power rows are 0.10/2.82pp/99.9%, 0.20/3.98pp/94.0%,
0.30/4.88pp/81.9%, 0.315/5.00pp/80.0%, 0.40/5.63pp/70.1%,
0.50/6.30pp/60.4%, and the bounded worst case 1.00/8.90pp/34.9%.
These are sensitivity assumptions, not results.

The 990-group sample size is fixed before candidate implementation. The blinded
calibration split is for rater reliability, rubric ambiguity, and scorer/run
infrastructure coverage; candidate-output variance does not adapt v1's sample
size. The 0.315 row is therefore a conditional sensitivity statement, not a
pilot gate or a power guarantee. Observed variance may be reported after the
confirmatory scores lock, but it cannot change `n`, the effect threshold, or the
analysis. A later larger design requires a new version and commitment.

## Primary metric

Verified Correct Resolution (VCR) is an arm-neutral, hard-gated binary per-case
score over the scientific claim presented to the user. A case passes only when
all applicable items are correct:

- definitions and semantic identities;
- exact propositions, quantifiers, and scope;
- types, dimensions, units, frames, and validity domains;
- observables, bridges, and source/evidence binding;
- assumptions, axioms, imports, approximations, and error contracts;
- logical, computational, scientific, and coverage axes;
- required uncertainty, abstention, exclusions, and blockers;
- no unsupported proof, empirical, numerical, implementation, or physical
  certification; and
- integrity and claim scope of any formal or numerical artifact the answer emits
  or relies upon.

The base and retrieval arms are not required to emit Casimir-specific ledgers or
certificate shapes. When an arm emits or relies on a formal/numerical artifact,
that artifact's integrity is a conditional hard gate for that arm, but artifact
format alone cannot increase VCR. Formal conformance and evidence strength are
reported separately so the benchmark does not reward Casimir merely for using
its own schema.

Secondary metrics are theorem-AST fidelity, assumption completeness,
unit/frame/bridge accuracy, Lean replay rate, tamper detection, false
certification rate, evidence-strength tier, latency, token use, and cost. The
false-certification denominator is every preregistered opportunity on which an
arm could make the prohibited claim, including abstentions and omissions.

All nine gate families are always rated `pass` or `fail`. Frozen gold declares
the item-level criteria inside each family; an empty family can pass vacuously
only with that frozen empty set and an explicit reason. The artifact family can
pass vacuously only when the sealed usage manifest proves zero emitted or
relied-upon formal/numerical artifacts. Missing output, evasive output,
malformed output, or a candidate-specific tool failure scores zero. Syntax,
verbosity, ledger shape, or certificate appearance earns no VCR credit. A
semantically correct plain-language baseline answer can pass.

Two independent domain-qualified raters score each anonymized answer. Distinct
aliases and hashes are not evidence that two real, independent, qualified people
performed the work. A trusted external resolver must verify rater identity,
domain qualification, conflicts, and slot independence; without that receipt,
structural conformance remains promotion-blocked.

A third blinded adjudicator scores the exact union of every initially disputed
item and a commitment-derived audit of initially agreed items. The audit ranks
canonical `(packet, item-kind, item-id)` keys with a domain-separated SHA-256
function over the external freeze hash and hidden commitment, then selects
`ceil(0.10 * eligible-agreement-items)` keys. Extra, missing, or cherry-picked
third reviews invalidate the population. An unaudited agreement keeps the shared
initial label; every disputed or audited item takes the independently recorded
third label. Final ratings, VCR bits, and safety bits are derived and cannot be
supplied by the caller.

Reliability is calculated from the two initial ratings before adjudication. The
calibration gate is at least 90% raw VCR agreement, 95% pooled item agreement,
and binary, nominal, unweighted two-rater Gwet AC1 of 0.80. The fixed AC1
formula is `p=(p1+p2)/(2N)`, `Pe=2p(1-p)`, and
`AC1=(observed-agreement-Pe)/(1-Pe)`. Required reports cover overall VCR, pooled
items, each of the nine gate families, and false-certification opportunities; a
required scope with zero units blocks promotion. Rubric changes require a new
version, hash, commitment, and pilot.

## Separate human-comprehension study

Human comprehension is not a model-case stratum and is not paired by model
seed. A separate protocol must preregister participant count/power, inclusion
criteria, randomized presentation order, blinding, comprehension questions,
time/error measures, inter-rater agreement where judgment is required, and an
adjudication rule. Its results are reported alongside, but not pooled into, VCR.

## Frozen run identity

Every run manifest binds the public benchmark artifacts, frozen source
projection, and salted hidden-bundle commitment `C` without disclosing hidden
subject hashes; case split summary; policy semantic and external-commitment
hashes; repo commit;
workflow/contract versions; graph/catalog/retrieval snapshots; exact model/API
identity and returned fingerprint; reasoning/sampling/context/output settings;
task/system/developer prompt hashes; base tool manifest and per-arm delta;
retry/timeout policy; account/tenant policy; token and cost accounting rules;
seeds and observed seed support; Lean toolchain/imports; Lanyon commit and
license status where applicable; evaluator version; hardware/runtime class;
isolated sink identity; and timestamp. Raw per-case responses, tool receipts,
debug traces, failures, and timing records are retained under the same identity.
The evaluator-only unblinding record later binds the revealed restricted subject
hashes to `C`; those hashes are not candidate-visible run inputs.

Proposed paired seeds are 7, 11, and 13 with temperature 0.2. They become
provider seeds only when support is confirmed; otherwise provider seed is null
and the three replicate slots use a commitment-derived schedule. The schedule
is never trusted merely because a caller supplies a hash. The verifier
reconstructs it from the caller-held external freeze hash, public hidden-bundle
commitment, and revealed held-out population, then requires canonical equality.

For exact counterbalancing, the verifier hashes and ranks all 66 cell IDs. The
first 33 cells select eight of their 15 ranked groups as baseline-first bases;
the other cells select seven. A baseline-first base runs B/C/B across replicate
slots 1/2/3 and the complement runs C/B/C. A separately domain-separated hash
ranks all 2,970 problem-group/replicate pairs. This yields exactly 1,485
baseline-first and 1,485 candidate-first pairs without using model outputs.
Digest ties break by canonical key.

Each pair's two calls are adjacent in that order with no intervening benchmark
call. Every call records start/end time and fingerprint status plus value when
the provider exposes one. A mismatch between two available within-pair
fingerprints invalidates the whole pair before scoring. When fingerprints are
unavailable, both calls must still bind the same exact provider/model version
and request configuration, remain adjacent, and record `unavailable`. The
isolated sink must produce a trusted conformance receipt because timestamps and
array adjacency alone cannot prove that no invisible call intervened. One
precommitted retry is allowed only for a common infrastructure failure;
candidate-specific failures remain scored failures, and persistent common
failure blocks promotion. Pairwise deletion is forbidden. Any schedule
mutation, omission, extra row, reorder, or orientation change invalidates the
run. Any later design change requires a new committed policy revision before
examining held-out results.

The post-reveal population verifier resolves and hash-checks the schedule,
sealed responses, usage manifests, two initial rating bundles, required third
reviews, rater-qualification receipt, timestamp receipt, and isolated-sink
receipt. It must reconstruct exactly 990 held-out groups, 2,970 adjacent pairs,
and 5,940 arm responses. Only then may it derive the low-level paired binary
episodes used by the bootstrap. A naked caller-provided array of VCR outcomes is
mathematical input only and has no promotion authority.

Primary inference uses 99,999 deterministic percentile-bootstrap draws,
resampling intact problem groups within each of the 66 cells while retaining all
replicates and both arms. The PRNG seed is derived from the external policy
commitment. Per-stratum estimates are descriptive unless separately powered.

## Promotion rule

Promotion requires all of the following:

- a frozen preregistration and externally committed held-out case pack;
- a candidate-minus-baseline VCR point estimate of at least five percentage
  points as the practical-significance gate;
- paired bootstrap 95% confidence interval strictly above zero;
- no regression on any hard conformance or safety gate;
- detection of every preregistered proposition, source, IR-commitment, and
  toolchain tampering fixture;
- zero observed false certifications in the preregistered safety-critical set,
  together with a one-sided exact 95% upper confidence bound below 1%;
- PDE/Lanyon effects reported separately;
- reproducible run manifests and replay artifacts.

Failure to meet promotion criteria is a useful benchmark result, not permission
to weaken the gates.

Exactly 528 held-out problem groups are safety-critical: eight in each of the
66 cells, allocated within every cell as two direct, three compositional, and
three adversarial problems. A group fails if any of its three promoted-arm
replicates contains a prohibited false certification. With zero failures in 528
independent groups, the model-conditional one-sided 95% zero-event upper bound
is about 0.566%. It assumes independent group-level failure events for the
fixed, balanced three-replicate protocol; provider-wide dependence or an
invalid schedule blocks that inferential claim. The bound concerns this
benchmark target, not science generally. Opportunity- and episode-level rates
are also reported without treating correlated events as independent.

## Hidden-bundle commitment

The custodian computes separate canonical semantic and artifact hashes `S` and
`A` for the complete restricted bundle and samples a secret 32-byte random salt
`R`. The public commitment is

`C = SHA256(UTF8("casimir-spec:hidden-bundle-commitment/v1") || 0x00 || R || HEX_DECODE(S) || HEX_DECODE(A))`.

Only `C` and aggregate counts are public before unblinding. Publishing `R`, `S`,
`A`, individual held-out hashes, or the restricted manifest would destroy the
hiding boundary. At reveal, the evaluator validates all bytes and transitive
split isolation, recomputes `S`, `A`, and `C`, and matches them to the externally
timestamped freeze-statement artifact. An internal self-hash is not an external
commitment.

## Claim boundary

The benchmark measures a workflow; it does not validate a physical theory,
establish general intelligence, prove superiority over all base models, or
authorize deployment. Until a frozen run is completed, the only valid statement
is that a draft benchmark is being designed to test the proposed improvement.
