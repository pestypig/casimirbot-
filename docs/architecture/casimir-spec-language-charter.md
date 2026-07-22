# Casimir Spec Language Charter

Status: milestone-1 draft design contract. No benchmark is preregistered or
frozen, and no parser, Lean execution, Lanyon execution, or agent tool is
admitted by this document.

## Purpose

Casimir Spec is a human-readable language for scoped scientific claims. It makes
definitions, assumptions, observables, validity domains, and exact theorem
statements easy to inspect, while mapping them deterministically to a canonical
semantic intermediate representation (IR). Admitted formal claims will compile
to Lean first. Domain adapters such as Lanyon may later generate sibling
numerical or source artifacts from the same frozen IR.

The language is meant to improve the fidelity of scientific reasoning, not to
turn fluent text into truth. Its central product is a claim bundle whose scope
and unknowns are clearer than an ordinary model response.

## Trust boundary

The canonical semantic IR is the shared contract between the readable source,
formatters, proof backends, numerical backends, and evaluation harness. A
readable rendering is for people; generated Lean is for a pinned proof checker;
generated numerical code is for a separately governed runtime. None of those
artifacts may silently widen another artifact's authority.

Milestone 1 is deliberately non-executing. A valid IR is a specification, not a
proof, empirical receipt, physical-validity result, assistant answer, or
terminal product. Later certificates must bind the source, IR, proposition,
foundation, imports, assumptions, used axioms, toolchain, and replay transcript.
Milestone-1 `display*` strings and source-map fragments are untrusted
presentation annotations: pointers must resolve against the authoritative AST,
but human-rendering equivalence is not admitted until the deterministic
parser/formatter and round-trip checks exist.
Semantic commitments intentionally exclude those presentation fields. Any
consumer that displays or navigates the human-readable bundle must also verify
the whole-artifact commitment; semantic commitment alone is insufficient.

## Language laws

1. The world model is open. Absence from a graph or catalog is never evidence
   that a claim is false or impossible.
2. Spelling is not identity. Every symbol and observable uses a stable semantic
   identity with definition and provenance. A shared name or unit cannot create
   a bridge.
3. Types, dimensions, units, frames, operational definitions, validity domains,
   and approximation errors are explicit. Unresolved bindings remain typed
   blockers.
4. Imports, axioms, assumptions, observations, and bridges are explicit and
   version-pinned before formal execution.
5. Defaults are permitted only in surface syntax. Normalization must expand
   them in the canonical IR.
6. Expressions use a closed semantic tree. V1 has no raw Lean, Racket, C,
   shell, FFI, network, or build-command escape node.
7. Proof blobs are separate untrusted artifacts. The language optimizes the
   readability of definitions and theorem statements, not proof scripts.
8. Every claim states its included scope, excluded claims, maturity ceiling,
   provenance, blockers, and four independent status axes.
9. A valid IR has no answer, execution, promotion, proof, empirical, or
   physical-mechanism authority.
10. Catalogs are versioned vocabulary packs. They are not collections of prompt
    strings and do not possess answer authority.

## Four independent axes

Casimir Spec never compresses these axes into one confidence label:

- Logical: definitions and axioms live in their own explicit ledgers. A claim
  declaration is a conjecture or theorem statement, and its resolution in the
  source IR is always `unassessed`; `proved`, `refuted`, or independence
  results belong to an external certificate.
- Computational: executable, noncomputable, partial, reference-only, or
  unassessed. Milestone-1 source IR cannot self-declare `executable`; that state
  requires an external semantic-admission result with checked operator
  signatures, types, dimensions, units, and frames.
- Scientific: model assumption, formal-model consequence, diagnostic,
  measurement definition, measured, calibrated, empirically unvalidated, or
  not applicable. `formal-model consequence`, `measured`, and `calibrated` are
  external certificate/receipt projections, never self-promotions in source
  IR.
- Coverage: represented, out of graph, unknown, bridge missing, or independence
  not established. `represented` requires an external semantic-admission
  result; a source IR cannot authenticate its own graph bindings.

These distinctions are mandatory. In particular, `noncomputable` does not mean
unprovable, unknown, or independent.

## Definitions and identity

Every symbol has a local name, semantic ID, mathematical type, unit binding,
frame binding, definition reference, and provenance. A missing definition is a
normalization failure and must be represented by a blocker outside the admitted
IR, not by a definition-free symbol. Reuse of a semantic ID across symbols
requires a catalog-backed or registered hashed binding and matching type, unit,
and frame semantics; local names cannot establish cross-symbol identity. These
bindings remain candidate identities until checked against an external catalog
or registry commitment. Duplicate local names are rejected within one
normalized specification.

Every claim ledger must contain the exact transitive definition, assumption,
and symbol closure induced by its proposition, declared observables and bridges,
and allowed-axiom type expressions. Bridge endpoints and assumptions are part
of that closure. The axiom list is an exact maximum allowlist; later replay must
report the subset actually used. A valid shape cannot omit a dependency, and
definitions cannot hide axiom references.

Every observable identifies a canonical observable, an operational definition,
response model when applicable, unit and frame bindings, validity domain, and
provenance. Cross-observable transformations must be registered graph bridges
with assumptions, domain, reversibility, and an exact, bounded, or statistical
error contract. Agent-proposed relations remain proposals until separately
registered.

## Formal and empirical claim protection

A Lean proof will establish only the exact proposition relative to its declared
foundation, imports, axioms, and assumptions. It will not by itself validate:

- the intended meaning of the formalization;
- a physical model or mechanism;
- an empirical premise, measurement, or prediction;
- a numerical solver or convergence claim;
- generated C or floating-point refinement;
- implementation correctness outside the checked proposition.

Measured and calibrated statuses require separate observation and calibration
receipts. Numerical and code-generation claims require their own refinement,
convergence, and runtime receipts. An IR, route, or receipt has
`output_role=evidence_for_synthesis`, `assistantAnswer=false`, and
`terminalEligible=false`. Codex or the agent runtime owns tool execution,
retries, and model re-entry; the completed solver/model path synthesizes the
candidate answer, and Helix route and terminal authority determine whether that
candidate is eligible for presentation.

## Gödel and noncomputability

Casimir Spec does not bypass, work around, or resolve Gödel incompleteness. It is
not a complete model of mathematics or the universe and is not a new
foundational logic. If a proposition cannot currently be resolved in a declared
formal system, the language records `unassessed` or an explicit unresolved
coverage blocker. It may use an independence result only when a separately
scoped metatheoretic certificate establishes that result. Otherwise the correct
state is independence not established.

Lean's `noncomputable` designation is also separate: it concerns executable
content, not whether a proposition is true, provable, independent, or
scientifically valid.

## Backend policy

Lean is the first formal backend because it can check generated theorem terms
against a pinned kernel and explicit environment. Lean is not a source of
empirical authority.

Lanyon/AdvectionDiffusion is a candidate PDE artifact backend, not a trust root
or proof assistant. It may be admitted only after license, API stability,
determinism, sandboxing, and reproducibility are reviewed. Its generated Racket,
C, data, or numerical outputs must be siblings of the Lean artifact, all bound
to the same IR. A Lanyon result cannot promote a Lean claim, and a Lean result
cannot certify Lanyon's floating-point implementation.

## Seven-stage end-state workflow

The additive verified-proposal lane has seven stages:

1. Scope the request and freeze admitted evidence.
2. Normalize human-readable system definitions into canonical Casimir Spec IR.
3. Admit semantic identities, types, units, frames, observables, domains, and
   registered bridges; otherwise emit typed blockers.
4. Plan the derivation, abstention, falsifiers, and evidence still required.
5. Request restricted Lean emission for admitted theorem statements; the agent
   runtime executes the pinned-kernel replay and returns evidence-only receipts.
6. On eligible PDE cases only, request generation and independent validation of
   Lanyon and numerical sibling artifacts through the same agent-owned runtime.
7. Assemble a claim-protected bundle and return all receipts to the model for
   the final explanatory answer.

This is a new additive workflow. It may import the causally bound evidence chain
after `provenance_audit` and before `proposal_handoff` in the existing
seven-step research-paper-to-proposal workflow. It does not require that v1 be
completed, because v1 completion means a proposal-submission receipt already
exists. It does not append steps to or change the semantics of that persisted
v1 workflow. A separately declared verification mode may instead accept an
already submitted proposal as a candidate, but must not silently treat that
candidate as verified.

## Non-goals for v1

- Automatically formalizing arbitrary papers without human review.
- Guaranteeing that a formal statement matches author or user intent.
- Proving theory completeness, physical truth, or a physical mechanism.
- Treating a theory graph or catalog as exhaustive.
- Replacing Codex model sampling, generic tool execution, evidence re-entry,
  retries, approvals, session lifecycle, or terminal completion.
- Executing arbitrary backend text embedded in a source document.
- Using Lanyon before its adapter and artifact contracts pass their own review.
- Exposing experimental formal or numerical execution to public/unsigned
  accounts before a separate release decision.

## Milestone order

1. Charter, threat model, draft benchmark policy, canonical claim IR, and
   fail-closed fixtures.
2. Before parser or model tuning, freeze the case-pack/source/gold commitments,
   exact arm-neutral rubric, group split, sample-size and power design, prompts,
   tool manifests, and an external benchmark-policy commitment.
3. Surface grammar, deterministic parser/formatter, source map, and canonical
   hashing CLI.
4. Semantic admission for definitions, dimensions, frames, observables, and
   bridges.
5. Restricted Lean emitter, pinned environment policy, replay certificate, and
   adversarial proof fixtures.
6. Additive verified-proposal workflow and evidence-only agent tool surface,
   protected initially by a distinct developer-only backend capability gate.
7. Complete the Lanyon licensing/API review and opt-in sandboxed PDE adapter;
   then execute the untouched frozen paired benchmark and a separately designed
   human-comprehension study before any promotion decision.
