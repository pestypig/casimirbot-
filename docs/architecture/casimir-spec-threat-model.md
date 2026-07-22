# Casimir Spec Threat Model

Status: milestone-2 design candidate. Claim-IR and synthetic benchmark-contract
controls exist; restricted benchmark custody, external timestamping, formal and
numerical backends, and agent-tool gates remain unimplemented. Described
later-stage controls are not claims that those gates already exist.

## Protected properties

Casimir Spec must preserve the exact requested claim, semantic identity,
declared foundation, explicit assumptions, observable meaning, open-world
unknowns, artifact provenance, and the separation between formal, numerical,
empirical, and answer authority.

The primary adversaries are not limited to malicious users. They include model
hallucination, ambiguous notation, corrupted extraction, stale catalogs,
misconfigured tools, accidental artifact drift, and fluent overstatement.

## Threats and required controls

| Threat                                                             | Fail-closed control                                                                                                                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification laundering: a backend proves a different proposition | Canonical expression tree; source-map pointers must resolve; presentation remains non-authoritative until deterministic round-trip formatting; later certificate binds source, IR, foundation, and proposition |
| Lexical symbol collision                                           | Stable semantic IDs and explicit definitions; duplicate local names rejected; spelling and shared units never establish identity                                                                               |
| Forged identity or graph relation                                  | Matching hashes and type/unit/frame signatures are structural prerequisites, never authority; later admission verifies them against server-owned catalog/graph commitments                                     |
| Unit, dimension, type, frame, or domain confusion                  | Typed bindings and validity domains; milestone-1 source IR cannot self-declare executable; later semantic admission checks signatures and equations                                                            |
| Approximation laundering                                           | Calibrated, coarse-graining, and approximate bridges require bounded/statistical error contracts and domain conditions                                                                                         |
| Hidden assumption or axiom smuggling                               | Exact transitive definition/assumption/symbol closure, definition-level axiom prohibition, exact claim axiom allowlist, and later replay ledgers                                                               |
| OCR, transcription, or source corruption                           | Hash-bound source fragment/page/crop evidence; extraction confidence remains evidence metadata, never claim authority                                                                                          |
| Prompt injection in papers or comments                             | Imported text has evidence authority only and cannot admit tools, change policy, or become an assistant answer                                                                                                 |
| Raw backend escape or build-script abuse                           | Closed IR expression nodes; no raw Lean/Racket/C/shell nodes; pinned import allowlist; fixed commands; sandbox, network denial, and resource caps                                                              |
| Certificate replay against changed input                           | One request identity binds source, IR, graph/catalog snapshots, proposition, foundation, toolchain, artifacts, and transcripts                                                                                 |
| Human rendering differs from checked claim                         | Milestone-1 human-rendering authority is false; milestone 3 requires deterministic formatting, exact source mapping, round-trip equality, and side-by-side normalized theorem display                          |
| Open-world graph treated as complete                               | `open_world` and `exhaustive=false` are immutable; retain out-of-graph, unknown, bridge-missing, and independence-not-established blockers                                                                     |
| Proof promoted into scientific truth                               | Formal resolution and scientific status remain separate axes; empirical promotion requires observation/calibration receipts                                                                                    |
| Real-number proof presented as implementation correctness          | Separate numerical convergence, floating-point refinement, generated-code, and runtime receipts                                                                                                                |
| Lanyon/Lean sibling artifact drift                                 | All outputs bind to the same semantic IR; each backend is independently checked and cannot confer authority on another                                                                                         |
| Receipt or route becomes the final answer                          | IRs and receipts have `assistantAnswer=false` and `terminalEligible=false`; completed model re-entry is required                                                                                               |
| Helix recreates a private execution or completion loop             | Helix owns semantic/tool admission, evidence identity, route authority, and terminal eligibility; Codex or the agent runtime owns execution, retries, re-entry, and completion                                 |
| Experimental backend becomes publicly reachable too early          | A distinct server-enforced developer-only capability gates formal/numerical execution; a runtime ID or hidden panel is not an access boundary                                                                  |
| Denial of service from generated artifacts                         | Bounded source/AST size and depth, import allowlists, time/memory caps, asynchronous fixed-command jobs                                                                                                        |
| Benchmark leakage or baseline mismatch                             | Grouped hidden splits, frozen source packets, exact prompt/tool manifests, declared arm deltas, arm-neutral scoring, and raw run manifests                                                                     |
| Tracked hash is mistaken for hidden gold                           | Real calibration/held-out prompts, sources, gold, salts, and subject hashes remain off-repo with a custodian; the repo exposes only a salted aggregate commitment and counts                                   |
| Source arms receive different evidence delivery                    | Every source arm binds the same initial projection, corpus, chunks, index, and retrieval tool; direct packet injection or a different delivery path is a separately declared intervention                      |
| Direct duplicates pass while transitive variants leak              | Split the connected components induced by problem, paraphrase, notation, source-variant, template, gold-semantic, and discriminating-source identities; audit near-duplicates separately                       |
| Evaluator metadata reveals the producing arm                       | Seal responses before scoring; pass only opaque aliases to raters; join arm labels after scores lock; report the honest boundary as metadata-blinded, not content-blinded                                      |
| Opaque aliases impersonate independent qualified raters            | Require a trusted external identity, domain-qualification, conflict, and slot-independence receipt; aliases, signatures, and self-attestation alone never establish human independence                         |
| Caller grinds or edits the paired schedule                         | Recompute the complete schedule from the caller-held external freeze hash, public hidden commitment, and revealed population; require exact canonical equality and fixed counterbalance counts                 |
| Hidden calls violate claimed pair adjacency                        | Require a trusted isolated-sink conformance receipt in addition to ordered timestamps; array position by itself is not evidence that no unlogged provider call intervened                                      |
| Adjudicator reviews only favorable disagreements                   | Derive the exact third-review set as every initial item disagreement plus a commitment-ranked 10% audit of agreed items; reject every omission or extra item                                                   |
| False-certification denominator excludes silence or tool failures  | Freeze every opportunity in gold; retain omissions, abstentions, malformed responses, and candidate-specific tool failures in the denominator; aggregate safety at the independent problem-group level         |
| Opaque gold IDs receive mutable out-of-band meanings               | Bind a restricted semantic catalog or canonical claim IR into the hidden bundle; require exact referential closure for every definition, proposition, unit, status, blocker, exclusion, and source-support ID  |
| Caller supplies favorable VCR or safety bits                       | Derive outcomes only from sealed responses, exact gold, two initial ratings, required adjudication/audit records, and per-opportunity judgments; naked binary rows have low-level statistical authority only   |
| Self-hashed freeze masquerades as external preregistration         | Match the recomputed public-freeze hash to a caller-held, independently timestamped receipt; an internally regenerated hash or receipt cannot establish temporal priority                                      |
| Hidden pack hash is exposed for dictionary confirmation            | Publish only the salted aggregate hidden-bundle commitment; withhold the salt and ordinary restricted subject hashes until evaluator reveal                                                                    |
| Repeated seeds are treated as independent cases                    | Pair by problem group and replicate slot; bootstrap intact problem groups within frozen cells; record provider seed support and forbid valid-row filtering or pairwise deletion                                |
| Unsupported or ignored sampling seed invalidates pairing           | Record provider seed support and returned model/system fingerprint; seed-paired inference fails closed when the provider cannot honor the seed                                                                 |

## Trust roots

Milestone 1 trusts only repository review plus deterministic structural and hash
validation. It does not trust source prose, model output, a self-declared hash,
or a proof/numerical artifact merely because it has the correct shape.

Later formal trust must be restricted to a pinned Lean kernel/toolchain,
allowlisted imports, independently recomputed hashes, and a replay transcript.
Later empirical trust must come from governed observation/calibration receipts.
Lanyon is never a trust root. Developer account status is authorization to use
an experimental lane, not evidence that an artifact or claim is correct.

## Mandatory adversarial fixture families

- Unknown root or nested fields.
- Same spelling with different semantic identities.
- Reused semantic ID without a catalog or registered binding.
- Missing or forged bridge registration and provenance.
- Missing approximation error or validity domain.
- Unresolved unit/frame on a claim marked executable.
- Hidden axiom admission or unresolved reference.
- Omitted transitive definition, assumption, symbol, or axiom dependency.
- Source-map pointer that does not resolve against the authoritative AST.
- `formal_model_consequence`, `measured`, `calibrated`, `represented`, or
  `executable` self-promotion in source IR.
- Expression, proposition, or whole-IR hash tampering.
- Recomputed self-hash checked against an older external commitment.
- Open-world artifact marked exhaustive.
- Out-of-graph/unknown claim promoted to execution.
- Any attempt to place `proved`, `refuted`, or `independent` resolution in the
  source IR.
- Any answer, terminal, proof, empirical, physical, implementation, or promotion
  boundary set true.
- A formal-runtime call attempted by a public, unsigned, or otherwise
  unentitled account.
- A runtime identifier that bypasses the distinct formal-tool capability gate.
- Contextual, quoted, negated, historical, or future-tense backend words that
  incorrectly admit execution.

## Residual risks after milestone 1

The structural contract cannot determine whether a supplied definition matches
a paper, whether a claimed catalog/registry hash is authentic, whether an
operator catalog is scientifically correct, or whether presentation text
captures the authoritative AST and human intent. Source-map strings therefore
have no rendering authority in milestone 1. Those questions require
source-grounded review, server-owned commitment checks, deterministic
parse/format round trips, semantic admission, backend replay, and human
evaluation in later milestones.
Milestone 1 also validates declared unit/frame shapes and references but does
not yet infer operator arity or equation dimensions; those remain milestone-4
semantic-admission gates.
Separate semantic and whole-artifact hashes detect accidental mutation while
letting timestamps and filesystem locations vary without changing semantic
identity. Neither stops an attacker who changes the payload and recomputes both;
external commitments and certificate binding are therefore mandatory
later-stage controls. Human-readable consumers must verify both commitments;
semantic-only verification deliberately does not authenticate display text.
