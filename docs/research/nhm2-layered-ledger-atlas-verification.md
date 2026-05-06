# NHM2 Layered-Ledger Atlas Verification

The layered-ledger atlas renderer passed its focused render and manifest-validation gates. Broader repo validation remains partial until the reference-chain command is run with explicit artifacts, physics validation completes under bounded execution, and unrelated test-suite failures are baselined or resolved.

## Commands Run

Release verification command:

```bash
npm run nhm2:verify-layered-ledger-atlas-release
```

The release verifier runs these commands in order:

```bash
npm run nhm2:render-layered-ledger-atlas
npm run nhm2:validate-layered-ledger-atlas
npm run render:nhm2:ricci4-turntable
npm run nhm2:run-reference-validation-chain:latest
npm run physics:validate:bounded
npm run test:nhm2:atlas
```

## Output Artifact Paths

Atlas render root:

```text
artifacts/research/full-solve/rendered/layered-ledger-atlas/<date-or-run-id>/
```

Release summary:

```text
artifacts/research/full-solve/rendered/layered-ledger-atlas/<date-or-run-id>/verification-summary.json
```

Reference-chain wrapper logs:

```text
artifacts/research/full-solve/validation-chain/<runId>/logs/reference-validation-chain.stdout.log
artifacts/research/full-solve/validation-chain/<runId>/logs/reference-validation-chain.stderr.log
artifacts/research/full-solve/validation-chain/<runId>/reference-validation-chain.invocation.json
```

Bounded physics validation logs:

```text
artifacts/research/full-solve/logs/physics-validate/stdout.log
artifacts/research/full-solve/logs/physics-validate/stderr.log
artifacts/research/full-solve/logs/physics-validate/run-result.json
```

## Renderer-Specific Acceptance

Renderer-specific acceptance is limited to the layered atlas outputs, manifest, old `ricci4` renderer compatibility, and focused atlas tests. It does not promote NHM2 scientific claims.

Renderer gate inputs:

- atlas manifest
- atlas layer outputs
- cavity contract
- literature map
- frozen reference-run blocker ledger
- regional source-closure evidence
- `ricci4` / `hull_sdf` render metadata

## Reference-Chain Invocation Status

The wrapper command is:

```bash
npm run nhm2:run-reference-validation-chain:latest
```

It resolves explicit inputs and invokes the existing reference validation chain with:

```text
--reference-run
--source-closure
--full-loop-audit
--out-root
--run-id
```

It does not loosen the underlying command. If deterministic latest resolution fails, it exits nonzero with a missing or ambiguous artifact diagnostic and preserves the non-promotional claim boundary.

Manual override form:

```bash
tsx tools/nhm2/run-reference-validation-chain-latest.ts \
  --reference-run path/to/reference-run.json \
  --source-closure path/to/source-closure.json \
  --full-loop-audit path/to/full-loop-audit.json \
  --out-root artifacts/research/full-solve/validation-chain/manual \
  --run-id manual-run-id
```

## Physics Validation Status

Physics validation is bounded by:

```bash
npm run physics:validate:bounded
```

Status classification:

- `pass`: exits zero before timeout
- `fail`: exits nonzero before timeout
- `timed_out`: exceeds timeout and is killed
- `incomplete`: manually interrupted or missing result log

The bounded runner preserves stdout/stderr, including the standard energy snapshot, even if the command times out.

## Full Test-Suite Status

The full repo test suite is not accepted by this renderer-specific patch unless a main-branch baseline comparison proves failures are pre-existing.

Baseline procedure:

1. Checkout `main`.
2. Run `npm test`.
3. Record failures.
4. Checkout the feature branch.
5. Run `npm test`.
6. Compare failures.

If the same proof-surface lock, Helix, bounded-stack, voice, and doc-acquisition failures occur on `main`, record them as pre-existing. Branch-only failures must be fixed before merge.

## Known Unrelated Failures

Previously observed incomplete or unrelated broad-suite areas:

- proof-surface lock
- Helix
- bounded-stack
- voice
- doc-acquisition

These are not renderer-specific acceptance unless the atlas branch introduces new failures.

## Claim Boundary

All new summaries and invocation records preserve:

```json
{
  "validationClaimAllowed": false,
  "physicalMechanismClaimAllowed": false,
  "promotionAllowed": false
}
```

Allowed renderer language:

- solve-derived curvature shell
- diagnostic render
- regional source-closure status
- QEI placeholder
- full tensor authority gate
- certificate pass but non-promotional

Prohibited renderer language:

- validated propulsion
- working warp drive
- physical mechanism confirmed
- Casimir propulsion proven
- QEI passed, unless the ledger explicitly says pass
- certificate validates NHM2 propulsion

## Literature Map Status

The atlas literature map is claim-boundary context only. Every entry must keep `doesValidateNHM2=false` and use one of:

- `context_only`
- `claim_boundary`
- `qei_context`
- `casimir_context`

Caption terms involving QEI, quantum inequality, Casimir, NEC, WEC, warp metric, or negative energy must map to at least one literature ID.

## Re-Run Instructions

Focused renderer and manifest check:

```bash
npm run nhm2:render-layered-ledger-atlas
npm run nhm2:validate-layered-ledger-atlas
npm run test:nhm2:atlas
```

Full release verification evidence:

```bash
npm run nhm2:verify-layered-ledger-atlas-release
```
