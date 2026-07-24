# Theory Formal Verifier Workstation Tool Contract

Status: developer-only experimental evidence rail.

## Purpose

The `theory-formal-verifier` family exposes pinned Lean replay to an agent
through the governed workstation gateway. It does not add a private model,
planner, retry, approval, or terminal-completion loop.

## Owner

Helix owns developer-account admission, sealed evidence identity, certificate
normalization, and claim boundaries. The selected agent runtime owns tool-call
choice, confirmation, polling, evidence re-entry, and later reasoning.

## Inputs

`plan` and `start` accept the exact formal request, replay policy, theorem source
path, and import-source path map. `start` additionally accepts the exact plan ID
and a runtime-injected approval token. `read_result` accepts the job ID.

## Capability order

```txt
theory-formal-verifier.plan
-> runtime/user confirmation
-> theory-formal-verifier.start
-> theory-formal-verifier.read_result
-> observation re-entry
-> bounded model synthesis
-> route and terminal authority
```

### `theory-formal-verifier.plan`

- developer-only, read-only preflight
- validates the exact request and replay-policy hashes
- checks the configured pinned Lean executable hash
- checks theorem and import source identities
- returns a plan ID bound to the developer profile and sealed paths
- does not execute Lean

### `theory-formal-verifier.start`

- developer-only observation action
- requires the exact plan ID
- requires a token supplied by the runtime approval lifecycle
- starts one policy-bounded replay job
- uses the existing direct-executable, no-shell Lean replay backend
- returns a non-terminal job receipt, not a certificate or answer

### `theory-formal-verifier.read_result`

- developer-only, read-only result lookup
- enforces developer-profile job ownership
- returns running status, a typed failure, or the hash-bound certificate
- always requires evidence re-entry and later model reasoning

## Observation

The three capabilities emit
`casimir.theory_formal_verifier.plan_observation.v1`,
`casimir.theory_formal_verifier.start_observation.v1`, and
`casimir.theory_formal_verifier.result_observation.v1`. A completed result may
contain `casimir_formal_verification_certificate/v1`; raw process transcripts
are represented by hashes rather than copied into the gateway observation.

## Host Projection

No panel mutation is required. A client may project plan, running, blocked,
failed, or certificate status from the structured observation, but that
projection is not answer authority.

## Visible Trace

The trace should show preflight, confirmation, replay start, result polling,
certificate observation, and post-tool model reasoning as separate events.

## Authority boundary

Every manifest, receipt, observation packet, and certificate keeps:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
promotion_allowed=false
```

A passing certificate means only that the exact proposition replayed
successfully in the declared Lean environment under the pinned policy. It does
not validate semantic intent, scientific theory, generated-code correctness,
numerical implementation, empirical truth, or physical mechanism.

The workstation account policy is the public boundary. Developer accounts
receive the capability family through their wildcard policy; user and unsigned
sessions do not receive it because the family is absent from the public
capability allowlist. The tool implementation repeats the developer check as
defense in depth.

## Configuration

The server must set:

```txt
CASIMIR_FORMAL_LEAN_EXECUTABLE=<absolute path to the pinned lean executable>
```

The executable bytes must match
`casimir_formal_lean_replay_policy/v1.kernelBinarySha256`. The agent cannot
supply or replace the executable path.

## Negative Admission

The rail must not execute for a user or unsigned session, a contextual or
quoted mention, a future or negated request, a mismatched plan ID, missing
runtime confirmation, a substituted request/policy/source/import, an
unconfigured Lean executable, or a job owned by another developer profile.

## Tests

- formal request, policy, replay, and certificate contract tests
- formal verifier job-service confirmation and profile-isolation tests
- workstation account-policy manifest and public-call denial tests
- Helix Ask prompt-solving adversarial benchmark
- Helix Ask API parity matrix
- Casimir adapter verification because certificate semantics are in scope
