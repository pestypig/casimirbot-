# Lanyon-Lean Execution-Closure Completion Matrix

Status date: 2026-07-30

This matrix audits the release goal against current repository evidence. A
contract or test fixture is not counted as a production registration, and a
successful inspection is not counted as Lean replay, numerical closure,
empirical validation, or physical truth.

Legend:

- `complete`: current repository evidence proves the bounded requirement;
- `implemented, production evidence missing`: the mechanism exists and fails
  closed, but the external record or runtime evidence required to use it is
  absent;
- `pending`: the required end-to-end evidence has not been produced.

| Goal requirement | Current evidence | Status | Remaining release evidence |
| --- | --- | --- | --- |
| Preserve the seven-stage scientific procedure | `shared/contracts/theory-experiment-procedure.v1.ts`, `server/services/helix-ask/workstation-tool-gateway/theory-experiment-procedure.ts`, and its policy/provider tests preserve source definition, semantic admission, graph reflection, formal closure, numerical closure, observable grounding, and bounded synthesis as distinct ordered stages. | complete | Keyed natural-language evidence still must show the real Ask and Realtime runtimes following the same order. |
| Bind exact specification, Lean, C, generator, graph, semantic, environment, source bundle, and executor lineage | `shared/contracts/casimir-formal-execution-enrollment.v2.ts` uses a closed, hash-bound enrollment and `server/services/theory/casimir-formal-verification-execution-catalog.v2.ts` cross-checks it against the sealed request. | implemented, production evidence missing | Register the actual generator artifact/revision/invocation/receipt, reviewed semantic binding, graph snapshot, pinned Lean environment/import closure, persistent source bundle, and attested executor. |
| Classify theorem strength from exact propositions rather than theorem names | `configs/research/casimir-formal-theorem-audits/lanyon-gr-maxwell-b13da44.v1.json` binds declaration and proposition-source hashes for 156 declarations. The twelve names ending in `Hyperbolicity` are classified by proposition content as real-typed expression witnesses with the ceiling `definition_well_typed`. | complete for the pinned published source | Obtain an independently observed theorem-type digest in the pinned production Lean environment before replay enrollment. |
| Audit whether the published GR-Maxwell family contains inspectable generator provenance | `configs/research/casimir-formal-generation-lineage-audits/lanyon-gr-maxwell-b13da44.v1.json` binds the complete 32-entry pinned tree and finds no generator-named artifact, invocation manifest, or receipt. | complete | Upstream or an authorized internal producer must supply the missing generator record; a README attribution is insufficient. |
| Enable pinned Lean replay only through a governed catalog | The v2 service accepts only an opaque catalog ID and exact current-turn procedure evidence. The immutable catalog rejects duplicate/substituted enrollment, source, theorem, semantic, graph, environment, bundle, and executor identities. The server-only registry bootstrap clears stale authority, validates the replacement, and preflights every distinct executor ID/hash before installation. | implemented, production evidence missing | Supply the trusted enrollment verifier, nonempty production entries, and exact executor adapters to the bootstrap. |
| Require confirmation and durable replay protection | `runtime-tool-confirmation-server-bootstrap.ts` installs one Ed25519 verifier and PostgreSQL replay ledger through `casimir-theory-execution-server-composition.ts` into the formal, independent numerical, and runtime-canary rails. Legacy approval strings are rejected. | complete as composition; deployment unconfigured | Configure the external approval host, trusted public-key registry, and shared PostgreSQL database in the release environment. |
| Execute formal jobs only through an external sandbox | `casimir-formal-verifier-job-service.v2.ts` has no shell, filesystem, local Lean runner, or host process path. It resolves an exact attested external executor and validates its returned v2 certificate. Repository inventory found no Docker/Kubernetes/Firecracker/gVisor/E2B runtime dependency and no production implementation of `CasimirFormalExternalSandboxExecutorV2`; only the provider-neutral interface, registry bootstrap, and test fixtures exist. | implemented, production evidence missing | Supply, attest, register, and exercise an external executor with OS-enforced memory, process, filesystem, network, timeout, and output ceilings. |
| Make readiness visible to the runtime agent without adding a workflow step | `theory-formal-verifier.inspect_artifact_family` now includes `casimir.theory_formal_verifier.runtime_readiness.v2` plus source/generator enrollment blockers. It distinguishes a resolver callback from a nonempty, issue-free catalog, is redacted and non-terminal, and leaves exact entry/executor resolution false. | complete | Confirm the packet survives real Ask and Realtime observation re-entry. |
| Keep formal, numerical, empirical, scientific, and physical authority separate | v2 request/certificate, enrollment, readiness, procedure, and numerical contracts have independent false-by-default authority axes. Formal replay cannot validate generated code, floating-point behavior, observables, theory truth, or physical truth. | complete at contract and unit-test level | End-to-end traces must preserve the same ceilings in text and voice output. |
| Independent numerical closure | The numerical verifier has sealed catalog, sandbox, confirmation, certificate, convergence, tolerance, and evidence-re-entry contracts. A bounded Advection-Diffusion 1D certificate exists, but the GR-Maxwell C mains are placeholders and refinement is unassessed. | implemented for the bounded Advection-Diffusion example; missing for GR-Maxwell | Register a persistent release bundle and attested independent executor; define and run a scientifically justified GR-Maxwell numerical comparison before claiming that family has numerical closure. |
| Fail closed on substitution, ambiguity, missing review, or missing runtime components | Focused contract, catalog, gateway, service, continuation, signed-receipt, replay-ledger, and composition tests pass. Typed blockers remain visible instead of becoming generic success. | complete for covered local contracts | Add regressions for every failure found in real keyed multi-turn runs. |
| Representative natural multi-turn Ask and Realtime evidence | Provider-level continuation and evidence-re-entry tests pass, including exact source inspection and execution-closure re-entry. | pending end-to-end | Run short, underspecified, follow-up, corrective, quoted/negated, cross-tool, confirmation, polling, failure, and completion journeys through the keyed Ask and Realtime APIs. Capture `ask_turn_solver_trace`, tool observations, and terminal/text/voice parity. |
| Build and Helix discipline | `npm run build:server` passes with four unrelated pre-existing warnings. `npm run helix:ask:discipline:quick` passes. Math-stage validation accepts 217 entries and root-to-leaf physics validation passes. | complete for local static gates | Rerun after external composition records are installed. |
| API parity and Casimir verification | No safe keyed server was started after credential exposure and the RAM failure. | pending | Rotate exposed credentials, start only with the opaque keyed launcher, run the applicable Ask/Realtime parity battery, then run `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl` and require PASS plus certificate integrity. |
| Sealed comparison benchmark against base GPT | Benchmark contracts and bounded fixtures exist, but the final hidden pack, model configuration, scoring policy, external timestamp commitment, and execution results are not frozen together. | pending | Freeze all benchmark inputs before execution; score verified resolution, false-certification rate, evidence coverage, and claim-ceiling compliance rather than rhetoric alone. |
| Do not promote Lanyon to solver or trust root | Lanyon is represented as a sibling artifact producer. Lean checks exact propositions; Casimir owns semantic/provenance gates; the graph owns dependencies and claim boundaries; independent numerical and empirical rails remain separate. | complete | Preserve this language in release notes and runtime synthesis. |

## Production enrollment acceptance packet

A production entry may be installed only when the trusted server composition
can verify all of the following without accepting caller-authored paths,
commands, or self-attestations:

1. pinned repository URI, commit, selected tree, specification, Lean source,
   and C source hashes;
2. generator registration ID, producer ID, generator artifact ID and revision
   hash, invocation-manifest hash, generation-receipt ID and hash, and output
   bundle hash;
3. exact theorem module/name, declaration hash, proposition-source hash, and
   independently observed theorem-type hash;
4. reviewed semantic-to-Lean binding, Casimir Spec identity, candidate badges,
   and Theory Badge Graph snapshot;
5. pinned Lean version, kernel binary, dependency lock, import closure, and
   axiom policy;
6. persistent opaque source bundle plus its formal-source and import-closure
   hashes;
7. attested external sandbox capability and resource ceilings;
8. exact seven-stage procedure and v2 request hashes; and
9. trusted enrollment-verifier acceptance.

Only after preparation resolves that exact packet may plan resolve the exact
executor. Only after an exact, signed, single-use confirmation receipt is
durably consumed may start submit the sealed job.

## Current release verdict

The architecture and local fail-closed mechanisms are substantially
implemented, but the full goal is not yet release-complete. The missing items
are not ordinary optional metadata: they are the external provenance,
environment, executor, live-runtime, benchmark, and Casimir evidence that the
architecture deliberately requires before promoting a result.

No further local implementation can supply the missing facts without
fabricating authority. Resumption requires at least one external-state change:
a reviewed generator/semantic/environment packet and attested executor must be
provided, or the release environment must be configured with rotated
credentials so keyed runtime and Casimir evidence can be collected.
