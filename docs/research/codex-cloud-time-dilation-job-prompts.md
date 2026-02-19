# Codex Cloud Job Prompts: Natario Time-Dilation Congruence

- Date: 2026-02-19
- Source context: `docs/research/natario-congruent-time-dilation-audit.md`, `WARP_AGENTS.md`
- Global policy: no physical viability claim unless `HARD` constraints pass and adapter/certificate checks are valid.

## Parallelization Plan

### Wave 1: Can run in parallel now (independent tracks)

1. `CC-01` Congruence payload contract + diagnostics schema
2. `CC-02` Natario canonical checks (`div(beta)`, `K`, `theta`)
3. `CC-03` Time-dilation panel truth labels (UI only, can use temporary mock payload)

### Merge Gate A (must happen before Wave 2)

After merging Wave 1 branches:

1. Reconcile payload shape in server + client.
2. Run Casimir verify in CI lane.
3. Confirm no route/schema regressions in Helix time-dilation endpoints.

### Wave 2: Can run in parallel after Merge Gate A

1. `CC-04` Strict fail-closed gate binding for rendering and certified labels
2. `CC-05` Ship-comoving congruence v1 (hull/worldline clock rate)
3. `CC-06` Tidal indicators v1 + provenance flags
4. `CC-07` Policy-as-code tests for strict blocking paths

### Merge Gate B (must happen before Wave 3)

After merging Wave 2 branches:

1. Re-run Casimir verify.
2. Resolve cross-branch conflicts in `server/routes/helix/time-dilation.ts` and shared diagnostics payload types.
3. Freeze payload contract tags for redshift work.

### Wave 3: After Merge Gate B

1. `CC-08` Redshift reduced-order transport (`k.u` emitter/receiver)
2. `CC-09` Research-to-implementation traceability docs update

### Final Release Gate

1. Casimir verification `PASS` with certificate integrity OK.
2. Training trace export artifact present.
3. Claim discipline text updated: diagnostic vs certified boundaries.

---

## Prompt: CC-01 (Parallel, Wave 1)

```text
Task: Implement explicit congruence payload contract for Helix time-dilation diagnostics.

Goal:
- Add a first-class congruence model to diagnostics/API so every displayed field is tied to observer family semantics.

Scope:
- Files likely touched:
  - server/routes/helix/time-dilation.ts
  - shared/time-dilation-diagnostics* (types + builders)
  - shared/schema.ts (if diagnostics contract is mirrored there)

Requirements:
1. Add `congruence` block to payload:
   - kind: `eulerian_adm | grid_static | ship_comoving | geodesic_bundle`
   - requiredFieldsOk: boolean
   - missingFields: string[]
   - gaugeNote: string | null
2. Add `observables` and `provenance` blocks with per-field source labeling.
3. Preserve backward compatibility where feasible, but prefer explicit new keys over ambiguous legacy keys.
4. Do not label outputs as physically viable/certified.

Acceptance:
- Endpoint returns deterministic payload with new blocks.
- Type definitions compile.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-02 (Parallel, Wave 1)

```text
Task: Add Natario canonical diagnostics checks.

Goal:
- Compute and expose Natario consistency checks so "zero expansion" is computed, not assumed.

Scope:
- Files likely touched:
  - modules/warp/natario-warp.ts
  - diagnostics computation module(s) used by time-dilation route

Requirements:
1. Compute `divBeta` (RMS + maxAbs) in relevant regions.
2. Compute/report `K` and `theta` consistency (`theta ~ -K` in Eulerian framing).
3. Add explicit pass/fail fields for "Natario canonical" labeling.
4. If required data is missing, output fail/unknown (not pass).

Acceptance:
- Diagnostics include Natario check results with numeric values.
- "Canonical satisfied" only when checks pass.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-03 (Parallel, Wave 1)

```text
Task: Add truth-label UX in Time-Dilation panel.

Goal:
- Prevent ambiguous interpretation by making congruence/provenance visible in UI.

Scope:
- Client time-dilation panel components and related stores.

Requirements:
1. Add fixed banner showing:
   - congruence kind
   - gate state
   - certificate integrity status
2. Add per-observable labels:
   - metric-derived vs proxy
   - units
   - chart/normalization note
3. If `requiredFieldsOk=false`, block that layer and show reason.

Acceptance:
- UI renders labels with real payload fields (or temporary mock fallback if backend not merged yet).
- No certified wording when validity requirements are missing.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-04 (Parallel after Merge Gate A, Wave 2)

```text
Task: Enforce strict fail-closed gate binding in diagnostics + rendering contract.

Goal:
- Make strict mode operational: missing evidence fails closed.

Scope:
- server/routes/helix/time-dilation.ts
- server/routes/agi.adapter.ts
- any helper used to map adapter verification into diagnostics validity

Requirements:
1. If certificate is missing or `integrityOk=false`, block certified labels.
2. If constraints are unknown/fail, mark not certified and block strong physical claims.
3. Ensure deterministic fail ids in payload where possible.

Acceptance:
- Negative-path tests for missing certificate/failed integrity/unknown constraints.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-05 (Parallel after Merge Gate A, Wave 2)

```text
Task: Implement ship-comoving congruence v1.

Goal:
- Add physically meaningful "ship time" path tied to hull/worldline kinematics.

Scope:
- Hull/worldline data provider(s)
- Time-dilation diagnostics calculation path

Requirements:
1. Define required ship kinematic inputs (`dx/dt` or equivalent worldline representation).
2. Compute ship-comoving `d tau / dt` using ADM variables.
3. Reject calculation when inputs are missing; expose missingFields.

Acceptance:
- Diagnostics include ship-comoving observable path with explicit validity flags.
- No fallback to ambiguous proxy when missing.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-06 (Parallel after Merge Gate A, Wave 2)

```text
Task: Add tidal indicators v1 with provenance.

Goal:
- Surface tidal hazard as congruence-aware output, or explicitly unavailable.

Scope:
- Diagnostics math module(s)
- Time-dilation payload mapping

Requirements:
1. Add tidal indicator output (`E_ij`-derived scalar if available, else explicit unavailable status).
2. Include provenance and units metadata.
3. Add strict handling when required tensors are missing.

Acceptance:
- Payload carries tidal field + provenance or explicit unavailable block.
- Panel can render or block deterministically.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-07 (Parallel after Merge Gate A, Wave 2)

```text
Task: Add policy-as-code tests for strict blocking behavior.

Goal:
- Lock in fail-closed behavior and prevent drift from WARP_AGENTS policy.

Scope:
- tests for GR gate, viability, Natario diagnostics, and time-dilation route behavior

Requirements:
1. Tests for:
   - missing certificate -> not certified
   - integrity failure -> not certified
   - unknown constraints -> blocked in strict mode
   - missing congruence required fields -> observable blocked
2. Keep assertions deterministic and stable.

Acceptance:
- New/updated tests pass in local CI lane.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-08 (After Merge Gate B, Wave 3)

```text
Task: Implement reduced-order redshift transport.

Goal:
- Replace redshift proxy-only presentation with explicit two-observer quantity.

Scope:
- Diagnostics redshift module
- Payload + panel visualization wiring

Requirements:
1. Define emitter/receiver worldline contract.
2. Implement bounded null transport for reduced-order `1+z = (k.u)_emit / (k.u)_recv`.
3. Report numerical confidence/limitations.
4. If transport cannot be computed, mark `unavailable` or `proxy` explicitly.

Acceptance:
- Redshift output distinguishes computed vs proxy vs unavailable.
- Documentation includes assumptions.
- Casimir verify PASS reported with certificate hash + integrity.
```

## Prompt: CC-09 (After Merge Gate B, Wave 3)

```text
Task: Traceability and claim-discipline documentation sync.

Goal:
- Keep docs aligned with implementation and policy boundaries.

Scope:
- docs/research/natario-congruent-time-dilation-audit.md
- any implementation note/changelog docs tied to diagnostics payload

Requirements:
1. Map each shipped observable to:
   - equation
   - congruence
   - provenance source in code
   - validity/certification gate requirement
2. Add explicit "what we can claim" and "what we cannot claim" block.

Acceptance:
- Document references match actual payload keys and route behavior.
- Casimir verify PASS reported with certificate hash + integrity.
```

---

## Casimir Verification Command Template (for every job)

```bash
npm run casimir:verify -- --ci \
  --url http://127.0.0.1:5173/api/agi/adapter/run \
  --export-url http://127.0.0.1:5173/api/agi/training-trace/export \
  --trace-out artifacts/training-trace.jsonl
```

Report in each PR:

- `verdict`
- `firstFail`
- `deltas`
- `certificateHash`
- `certificateId`
- `integrityOk`
- trace/export artifact refs
