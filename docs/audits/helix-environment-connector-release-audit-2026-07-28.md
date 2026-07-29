# Helix Environment Connector release audit — 2026-07-28

## Verdict

The generic read-only connector platform and its deterministic verification
surface are implemented. The keyed southbound room/source/pairing/device
lifecycle also passes against the launcher-owned server.

The combined workflow is not yet eligible for a live-release claim. The
deployment does not expose configured OAuth protected-resource metadata and no
legitimate external Agent API access token/account binding is available.
There is also no real Minecraft Paper producer connected to the acceptance
room. Consequently, the final model-backed Minecraft probe, exact live
observation re-entry, and environment-specific text/voice terminal equivalence
cannot be exercised without external deployment state.

This is a deployment block, not a reason to add cookie authentication, mint a
local principal, expose a source/device credential to Codex, or weaken account
binding.

## Requirement audit

| Requirement | Current evidence | Status |
|---|---|---|
| General connector directory boundary | `connectors/environment/` contains the v1 contract re-export, TypeScript and Java SDKs, template, synthetic fixture, real system-clock example, conformance mock, and golden report. | Proven |
| Generic server boundary | `server/services/environment-connectors/` contains profiles, catalog, installations, devices, bindings, durable probe, transport, observations, pairing, conformance, directory, and an action-only reservation. | Proven |
| Separate durable connector objects | Migration 039 creates distinct package, installation, device, binding, catalog snapshot, request, attempt, result, observation, event, pairing-session, and device-credential records. | Proven |
| Stable typed capability | `room.environment.probe` binds the server-owned capability identity `com.casimirbot.minecraft.inventory.check`; model input is limited to semantic target/freshness fields. | Proven |
| Frozen exact correlation | The broker persists tenant/owner, run/turn/provider/tool call, catalog, room/binding/source/device/installation, adapter hashes, manifest, producer epoch, capability/schema hashes, arguments, idempotency, deadline, and result hashes. | Proven |
| Lease durability and restart recovery | One-time lease values are returned only to the connector, only their hashes are stored, bounded retries expire offline connectors, and a persisted lease survives database restart. | Proven |
| Cancellation and supersession | Broker operations durably cancel or supersede pending/leased requests, close leased attempts, write typed observations/events, and keep authentic late results ineligible for the original turn. | Proven |
| Duplicate handling | Exact duplicate results replay the original evidence reference; conflicting results are rejected and audited. | Proven |
| Late-result policy | Turn closure, timeout, cancellation, and supersession produce separate late dispositions without reopening the turn. | Proven |
| Post-dispatch authority | Consent, developer account policy, membership, room/run binding, source credential, connector binding/device/installation, catalog, adapter contract, and producer epoch are rechecked. | Proven |
| Typed outcomes | Connector offline, timeout, capability unavailable/version changed, target unavailable/ambiguous, permission/binding revocation, schema failure, stale result, cancellation, supersession, producer epoch mismatch, and adapter contract change are typed and covered by focused regressions. | Proven |
| Minecraft Paper vertical slice | The Paper plugin polls the existing outbound-only room-source endpoint, executes only admitted read-only probes, wraps durable lease identity, submits results, and keeps command execution disabled. The legacy ingress is a compatibility bridge into the generic durable broker. | Deterministically proven; real server not connected |
| Cross-domain proof | Synthetic reachability and the real non-game monotonic system-clock connector run through the generic SDK/mock transport and cannot satisfy each other's or Minecraft's capabilities. | Proven |
| Pairing and device health | Ed25519 possession, short-lived code, per-key rate limit, exact owner/room/capability approval, one-time credential delivery, scoped authentication, heartbeat, rotation, expiry, and revocation are implemented. | Proven |
| Public directory privacy | Package-only immutable records expose separate package/security trust axes and conformance references without installations, devices, rooms, network routes, health history, evidence, or transcripts. | Proven |
| Publisher-text isolation | Model-visible semantics come from code-owned descriptors; prompt-like manifest/schema fields are rejected and public publisher text remains UI-only. | Proven |
| Action boundary | `actions/` contains no executor, credentials, REST/MCP tool, or registration. Command requests remain `command_execution_not_enabled`. | Proven |
| Exact Codex re-entry | Deterministic Agent API acceptance requires the leased result, `evidence_reentered`, a post-observation reasoning step, terminal-authority evaluation, and run completion before success. | Deterministically proven |
| Keyed southbound acceptance | Developer session, room, deferred source credential, Minecraft manifest, heartbeat, Ed25519 pairing/approval/claim, device health, empty exact-device poll, revocation, room close, and sign-out pass at `http://127.0.0.1:1522`. | Proven |
| Keyed authenticated Agent API Minecraft continuation | Protected-resource metadata returns HTTP 503 (`auth_not_configured`) and no legitimate acceptance token is configured. | Externally blocked |
| Real Minecraft observation | No connected real Paper producer is available for this acceptance room. | Externally blocked |
| Environment-specific text/voice equivalence | Deterministic terminal equivalence passes, but the real authenticated environment continuation cannot reach terminal projection without the two external prerequisites above. | Externally blocked |

## Current verification

- Generic bounded continuation regression: 4/4 passed, including
  tool A -> Codex follow-up -> tool B -> Codex synthesis and the
  `com.casimirbot.minecraft.inventory.check` shaped case.
- Capability-lane parser regression: 5/5 passed, including continuation
  affordance-envelope unwrapping.
- Natural keyed prompt corpus: 7/7 passed.
- Multi-turn keyed prompt corpus: 6/6 passed.
- Theory keyed prompt corpus: 7/7 passed, including the two original
  `solver_continuation_pending` and `post_tool_model_step_missing`
  reproductions.
- Environment connector focused battery: 11 files, 50 tests passed.
- Durable broker after lifecycle additions: 9/9 passed.
- Pairing service after rate/expiry additions: 4/4 passed.
- Minecraft Paper Gradle build/tests: passed under temporary JDK 21.
- Minecraft Paper 1.21.8 loopback: plugin load, manifest, heartbeat, snapshot,
  read-only probe, forbidden-probe rejection, raw-NBT exclusion, and
  no-side-effects checks passed.
- Java connector SDK standalone compilation: passed under temporary JDK 21.
- Capability plan: 75/75 passed.
- Capability lifecycle ledger: 8/8 passed.
- Terminal single writer: 73/73 passed.
- Terminal equivalence: 6/6 passed.
- API parity matrix: 31/31 passed with the memory-stable single-thread runner.
- Adversarial prompt-solving benchmark: 35/35 passed with the
  memory-stable single-thread runner.
- Helix Ask discipline quick: static checks passed; warnings reflect the large
  pre-existing dirty Helix Ask worktree and require the focused gates above.
- Helix Ask discipline full: passed the 35-case prompt benchmark, 31-case API
  matrix, 26-case live-source continuation suite, 8-case identity audit, and
  server build.
- Server bundle: passed with four unrelated existing duplicate/dead-case
  warnings.
- Casimir adapter gate: PASS, `firstFail=null`, no deltas, certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true, status GREEN. Fresh trace:
  `artifacts/training-trace-environment-connectors-20260728-current.jsonl`.
- Keyed connector acceptance: all locally exercisable checks and cleanup
  passed; authenticated Agent API checks were skipped with
  `auth_not_configured`.
- Final Minehut upload artifact:
  `minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.1.0.jar`,
  SHA-256
  `5194e1450f2070a24c5b6dd4d5f9c3d4d005f26d5d9e38ff7d50fbd45955a3c3`.
  The extracted JAR passed the credential, generated-identity, email, and
  private-route scan. The reproducible receipt is
  `minecraft/helix-paper-sensor/helix-paper-sensor-build-receipt.json`.

The keyed API parity probe also reran its older live-source fixture matrix.
Only `capability_catalog_runtime` passed; 15 live-source scenarios reported
missing situation-run identity/observations or route-policy expectations. These
are not consequences of the repaired generic post-tool continuation path and
remain a separate live-source fixture/policy baseline. They were not widened
into this patch.

The environment-rehearsal TypeScript project remains red with broad existing
client, theory, contract, and target-library errors. No connector-focused or
production server build error was introduced by this work.

The combined forked prompt/parity campaign was intentionally stopped after its
worker exceeded 2 GB while still running. The keyed server was not touched.
The same required suites then passed individually with one thread.

## External prerequisites for the final live gate

1. Configure the launcher-owned deployment with the real asymmetric OAuth
   issuer, audience, JWKS URL, provider alias, and admitted algorithms.
2. Complete the trusted provider-owned account binding for the exact issuer,
   signed tenant, provider alias, subject, and Helix profile.
3. Supply a valid scoped token to the acceptance process through
   `HELIX_ENVIRONMENT_CONNECTOR_ACCEPTANCE_ACCESS_TOKEN` (or the documented
   shared-room/MCP fallback variable). Keep it out of prompts, chat, logs,
   reports, and source files.
4. Connect a real Minecraft Paper producer to the approved room/source/world
   binding and keep it online for the leased inventory probe.
5. Rerun `npm run helix:environment-connectors:live-acceptance`, then perform
   the keyed Ask and Realtime text/voice journeys. Require the same run/turn/
   tool call, fresh observation re-entry, post-observation provider step,
   terminal eligibility, single writer, and matching text/voice certainty.

## Probability scorecard

| Subsystem | Confidence |
|---|---:|
| Contracts, migration, and separate durable identities | 98% |
| Probe dispatch, leasing, result correlation, and late policy | 97% |
| Pairing, credential scope, rotation, and revocation | 96% |
| Minecraft legacy-ingress compatibility bridge | 95% |
| TypeScript/Java SDK and cross-domain abstraction | 95% |
| Tool admission, evidence re-entry, and terminal authority | 95% deterministic |
| Secret and private-routing nonprojection | 97% |
| Live deployed OAuth/account interoperability | Unverified |
| Real Minecraft producer interoperability | Unverified |
| Environment-specific live text/voice equivalence | Unverified |

## Server status

The user-authorized launcher-owned keyed server was used only through the
opaque launcher at the sanitized local URL `http://127.0.0.1:1522`. The
account-session, Helix pipeline, and agent-provider endpoints returned 200 and
Codex was launchable. No launcher contents or credential-bearing environment
variables were inspected. The keyed server was stopped after verification.
