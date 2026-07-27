# Theory Artifact Producer Workstation Tool Contract

Status: developer-only pinned-source admission rail.

## Purpose

`theory-artifact-producer.prepare_lanyon_request` first compiles a
`casimir_artifact_generation_request/v1` from one exact current-turn Theory
Experiment Procedure and its exact semantic-admission artifact.

`theory-artifact-producer.admit_lanyon_snapshot` then accepts only that
current-turn request artifact, admits an exact local copy of the pinned
`lanyonai/AdvectionDiffusion` scientific source snapshot, verifies the 27
selected Racket, Lean, and C source artifacts, and returns a
`casimir_artifact_generation_receipt/v1`.

The preparer reads no source bytes. The admission call reads source bytes.
Neither call clones a repository, accesses the network, runs Lanyon, compiles
or executes C, invokes Lean, validates numerical behavior, or produces an
answer.

## Owner

Helix owns developer-account and source-target admission, evidence identity,
receipt normalization, and claim boundaries. The agent runtime owns tool
selection, evidence re-entry, later formal replay, later numerical execution,
and bounded synthesis.

## Inputs

Request preparation requires:

```txt
procedure_artifact_ref           exact current-turn procedure evidence
procedure_id                     exact procedure identity
procedure_sha256                 exact procedure digest
semantic_admission_artifact_ref  exact semantic evidence bound by the procedure
case_id                          one of the nine pinned adapter-policy cases
```

`claim_id` is optional only when the admitted packet contains one claim; it is
required to disambiguate multiple claims.

Snapshot admission requires:

```txt
request_artifact_ref  exact current-turn prepare_lanyon_request artifact
case_id               the same registered pinned case
```

Callers cannot paste a request object into admission. The gateway resolves the
request by exact current-turn artifact identity, validates its integrity and
authority fields, and rejects stale, ambiguous, substituted, or tampered
request artifacts.

The source root is resolved exclusively from the server-owned
`CASIMIR_LANYON_SOURCE_ROOT` setting. It is absent from the public tool schema,
and the gateway ignores a caller-supplied `source_root` or `sourceRoot` if a
caller bypasses schema validation. The agent cannot choose a filesystem root
or change the adapter policy, upstream commit, selected source-tree hash,
expected file paths, hashes, or sizes.

The request source packet must be the exact pinned Racket specification bytes
for the selected case. This prevents the static upstream example from being
presented as if it were generated from an unrelated scientific definition.

## Observation

Preparation emits
`casimir.theory_artifact_producer.lanyon_request_observation.v1`. It contains
the hash-bound request, exact procedure and semantic evidence bindings, pinned
case and adapter-policy identities, and the next admissible admission
capability. It is a candidate next step, not execution evidence or an answer.

After the provider authenticates and normalizes that observation, it replaces
any untrusted continuation hint with one exact
`helix.provider_next_affordance.v1`. The affordance names
`theory-artifact-producer.admit_lanyon_snapshot` and carries only the
normalized current-turn `request_artifact_ref` plus the registered `case_id`.
It is agent-followable but never automatic, terminal, or answer-authoritative.

Admission emits
`casimir.theory_artifact_producer.lanyon_admission_observation.v1`.

An admitted observation contains:

- the immutable adapter-policy identity;
- the upstream commit and selected-source-tree commitment;
- a non-terminal generation receipt;
- exact local paths for the selected Racket, Lean, and C files; and
- the generated build-manifest hash and size.

Raw source and build-manifest contents are omitted from the gateway
observation.

## Host Projection

No panel mutation is required. A client may display admitted, blocked, policy,
case, source-tree, and receipt status from the structured observation. Local
paths are developer evidence references and must not be projected to a public
session.

## Visible Trace

The trace should show source-target admission, account-policy admission, pinned
snapshot inspection, receipt observation, and post-tool model re-entry as
separate events. It must not show a clone, code execution, formal replay, or
numerical run because this capability performs none of those operations.

## Authority boundary

An admitted observation means only that exact bytes matching the pinned
snapshot were found and bound to the request. It keeps:

```txt
providerOutputTrusted=false
formalPropositionChecked=false
validatesSemanticIntent=false
validatesTheory=false
validatesGeneratedCode=false
validatesNumericalImplementation=false
validatesEmpiricalClaim=false
validatesPhysicalMechanism=false
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
promotionAllowed=false
```

The Lean path may subsequently enter `theory-formal-verifier`; the C path may
subsequently enter a governed numerical plan. Neither authority is inherited
from this receipt.

## Account policy

The developer wildcard admits this experimental capability. User and unsigned
sessions remain blocked because the capability is absent from the public
allowlist. The gateway and adapter both repeat the developer check.

## Configuration

```txt
CASIMIR_LANYON_SOURCE_ROOT=<absolute path to an exact local pinned checkout>
```

Only trusted server composition or deployment configuration may set this
value; it is never derived from model-visible tool arguments. The configured
root is not trusted merely because it is server-owned. The adapter rejects
relative roots, symlinked roots or files, path aliases, missing artifacts,
size drift, hash drift, or selected-source-tree drift.

## Negative admission

The capabilities must not run for a public account, contextual or quoted tool
mention, future or negated instruction, absent source target, stale or
ambiguous procedure/semantic/request evidence, an unconfigured source root,
malformed or substituted generation request, unpinned case, competing
semantic IR, mismatched source packet, changed adapter policy, or changed
upstream bytes.

## Tests

- pinned adapter-policy and 27-artifact commitment tests
- filesystem and source-packet fail-closed tests
- generation request/receipt integrity tests
- current-turn procedure/semantic/request binding and substitution tests
- developer listing and public server-policy denial tests
- provider capability catalog tests
- Helix Ask discipline checks
- Casimir verification because receipt and certificate semantics are in scope
