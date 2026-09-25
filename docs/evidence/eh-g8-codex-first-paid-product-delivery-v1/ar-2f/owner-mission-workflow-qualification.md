# AR-2F owner mission workflow qualification

Date: 2026-09-25. Scope: source admission and developer-owner presentation.
Maturity: `deterministically verified` for this bounded slice.
Controlling packet: [AR-2F](../../../work-packets/eh-g8-ar2f-room-mission-owner-workflow-v1.md).
The [work program](../../../helix-environment-harness-work-program-v1.md) remains
the status authority. No production deployment or live provider call was made.

## Implemented journey

The present room owner opens **Room mission task**, reviews the currently paired
chat and explicitly selects it. Existing server task/consent checks precede the
selection. Owner metadata discovery requires a current developer account,
active account link and current owner membership; revalidation rejects an owner
or mission change during the read. Missing task readiness remains separate from
storage failure. The selected mission remains visible for revocation when its
task expires. The existing owner revocation API does not depend on fresh task
consent or the new developer discovery gate.

The owner refreshes captured speech, selects an attributed utterance, reviews
its unchanged text, and explicitly sends it. The catalog contains only handoff
metadata. At most 20 browser previews exist in volatile memory and are removed
on voice-session disposal; a late receipt cannot restore them. Dispatch uses the
existing server-retained handoff, current exact mission revision and task,
captured speaker consent and admitted live session. Browser preview state never
provides authority. The UI reports queued/acknowledged/expired outcomes without
claiming a result. Existing AR-2D controls handle returned evidence separately.

The first divergence found was the browser's personal voice shortcut occurring
before server speaker attribution. It now runs only after a valid server
handoff and only for a personal thread. Room speech cannot reach that shortcut.
The existing read-only room interpretation path is unchanged; external mission
dispatch requires this additional explicit owner action. No generic reasoning
loop, new worker, automatic mutation retry or model-funded entitlement is added.

## Deterministic evidence

- `focused-tests.json`: 121/121 across seven files, including actual owner HTTP
  discovery/selection, stable selection retry and stale-revision rejection,
  exact room HTTP dispatch, real in-memory MCP pickup/acknowledgement/result,
  and the existing fake-provider explanation/publication path.
- `final-boundary-tests.json`: 34/34 final owner-discovery and UI boundary checks,
  including ten-second unknown-outcome handling without automatic retry. This
  replaces the two corresponding suites in the 121-test run and adds three
  cases, for 124 distinct passing focused cases on the final source.
- `discipline-quick.txt`: PASS; warnings cover the larger pre-existing dirty
  Helix tree and are not standalone runtime verdicts.
- `discipline-full.txt`: PASS, with 35 prompt-solving, 31 API parity,
  26 continuation-routing and nine live-source identity fixtures, plus the
  server build. The runner intentionally skips other groups inside each shard;
  the complete run covers all of its selected groups. API parity uses the
  existing deterministic test-policy runtime; the MCP explanation fixture uses
  a fake Codex provider. Neither establishes live reasoning quality.
- Server build: PASS, with four existing warnings in unrelated modules.
- `client-build.txt`: PASS, with existing dependency-age, browser-externalization,
  tree-sitter eval and bundle-size warnings. Build duration: 38.38 seconds.
- `docs-audit.txt`: PASS, with G8 still active and no failed maturity/backlink checks.
- `source-manifest.json`: hashes for 12 implementation/fixture files at dirty
  base commit `cb5bd3c89106359667ef129ee1f3245cc3924bb0`. The commit alone does
  not identify this increment.

Representative cases: the owner selects an exact paired task and receives a
nonterminal mission receipt; an invited guest receives 403 for owner discovery;
another room's metadata is rejected; consent loss prevents task pickup; changing
the captured transcript is rejected by dispatch. Contextual, negated,
historical, conditional, screen-quoted and mixed room speech cannot trigger
personal task steering. Timeouts preserve the explicit request identity, and
unmount/disconnect suppress late state changes.

The first focused run had one fixture failure: its supposed different-length
text was the same length as the original. Correcting that test input produced
the passing integrated run; no guard was removed to accommodate it.

| Evaluation | Observed result | Probability interpretation |
| --- | --- | --- |
| Focused workflow/contract cases | 124 distinct passing cases | 100% observed fixture pass rate; not a customer reliability estimate |
| Full discipline battery | 101 passing cases | 100% observed fixture pass rate within the runner's selected groups |
| Installed owner/guest and live multi-member reasoning | Not run | Success probability unmeasured |

No physics, environment adapter, certificate or release-verifier code changed;
Casimir verification was not invoked and no certificate claim is made.

## Limits and next acceptance

This browser journey is tested in jsdom, not an authenticated installed browser.
AR-2E's existing developer package does not contain AR-2F. The domain was not
deployed or requalified. No current keys, account dashboards, raw provider
credentials or user profiles were inspected or changed. Previous browser-tool
initialization failure is recorded by AR-2E; this increment does not repair it.

The UI intentionally offers the latest current paired task rather than all
Codex tasks. Choose a different task using existing pairing and refresh.
Transient speech must be recaptured after disconnect/reload. There is no new
pickup monitor: the owner checks returned evidence through the existing result
controls. A fresh, separately identified developer package plus an authenticated
keyed owner/guest walkthrough is next. Multi-member reasoning quality, capacity,
native actions, domain parity and paid assisted-room economics remain separate.
Full AR-2, G8 and CFP-1 remain open.
