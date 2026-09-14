# Trust-save uncertainty and stale decisions recover without replay

Classification: source admission, evidence normalization and presentation.
This O4/O5 prerequisite repair continues the [initial status-read repair](2026-09-13-trust-status-read-recovery.md).
The previous goal turn made progress through that source change, regressions
and candidate build. This continuation adds independent source and deterministic
integration evidence while genuine Full Harness trust approval remains pending.
It does not infer approval from the elapsed human wait.

## Reproduced boundaries and repair

The trust PUT awaited both response and body indefinitely. Two component
regressions reproduced Saving device trust remaining stuck. Independently,
two concurrent decisions against the same reviewed state both updated the real
InstalledSecurityStore, advancing its policy revision twice. The three red
regressions failed in 7.18 seconds; 53 unrelated cases were filtered out.

The client now bounds the save response and body wait to ten seconds. Timeout,
unreadable response or another unknown outcome is explicitly unconfirmed and
may have completed. It clears the stale projection and offers the existing
read-only status recheck. It does not resubmit PUT or resume a pending transport
start from an uncertain result. Late response/body completion cannot overwrite
the subsequently read state. Unmount invalidates the mutation observation and
aborts its request; abort is not treated as proof of server cancellation.

Every trust PUT now requires the nonnegative safe-integer field
`expected_policy_revision`, copied from the server projection reviewed for that
decision. The store compares this revision in the atomic SQL UPDATE. A duplicate
or delayed decision against an older revision returns 409
`device_trust_revision_changed` without writing trust or another trust event.
An inactive/missing device retains its distinct 404. A missing/invalid revision
is rejected before a write. Existing authenticated developer session,
same-origin, active-device and separate environment authority checks remain.

The client maps the conflict to a status recheck before another human decision.
A read is current-state evidence, not a recovered receipt for the original
write. The implementation does not promise the original success response on a
stale retry or add a private retry loop. The renderer and service must be
deployed together: older PUT callers without the reviewed revision fail closed
with 400, rather than silently bypassing the concurrency check.

## Deterministic evidence

The complete focused battery passed 63/63 in 28.23 seconds: 49
AgentConnectionSetup cases, six existing transition-route cases, seven
InstalledSecurityStore cases and one real-router/real-store registration
sequence. The added store case submits two concurrent decisions against
revision 0; exactly one succeeds. After a separate revoke at revision 1,
the old grant rejects and state stays untrusted at revision 2. Exactly one
grant event and one revoke event exist. These are pg-mem concurrent invocations,
not PostgreSQL contention or arbitrary process-crash qualification.

Six browser cases passed in 15.0 seconds. Four preserve prior initial-read and
missing-registration recovery with pointer/keyboard input. Two new cases compose
the production component, actual HTTP trust router and actual SQL store: commit
the user's fixture click, lose only the response, read current trusted state
without another PUT, perform a separate fixture revoke, then reject the delayed
old grant. Both input paths preserve exactly two applied trust events. A foreign
fixture session is rejected. The scoped fixture uses migrations 026/070/081 and
an isolated loopback listener with a new cookie and database for each test.

The browser suite's account resolver is replaced only in its test-process
esbuild invocation, using an exact module path. No resolver option, fixture
credential, debug endpoint or consent-bypass flag was added to production
registration. Real MFA, real profile credentials and the running EXE are not
used by these tests. Production credential-isolation acceptance remains broader
than these fixture negatives and marker scans.

Commands and logs:

```text
npx vitest run server/services/helix-account/__tests__/installed-security-store.test.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx -t 'O5 rejects duplicate and delayed|O4 reconciles a hung trust save' --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/services/helix-account/__tests__/installed-security-store.test.ts server/routes/__tests__/desktop-trust-registration.test.ts server/routes/__tests__/desktop-mcp-tunnel-transition.test.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
npx playwright test --config=playwright.onboarding.config.ts trust-real-handlers.spec.ts binding-input.spec.ts -g 'O5 real trust handlers|O4 failed trust status|O4 unregistered device recovery'
```

Local logs: `.tmp/trust-save-red-20260913.log`,
`.tmp/trust-save-green-20260913.log`, `.tmp/trust-save-browser-20260913.log`.
Targeted diff checks and discipline quick passed. The quick guard scans the
larger dirty checkout; its unrelated classifications are not qualification of
this patch. No live-source identity, continuation, physics, adapter, certificate
or verification policy changed, so full discipline and Casimir verification
were not run for this scope.

## Candidate package and live boundary

Renderer build passed in 1m31s and desktop directory packaging exited 0.
[Package comparison](2026-09-13-trust-save-recovery-package.json) passed for
645 runtime files, 635 renderer files and eight host artifacts with no
mismatches/extras. [The artifact scan](2026-09-13-trust-save-renderer.json)
found the renderer request/recovery controls and service revision guard, with
no selected known fixture markers in renderer or service text. This is bounded
static exclusion evidence, not a proof of every production authentication path.

Candidate: `apps/desktop/release-trust-save-recovery-20260913/win-unpacked/CasimirBot.exe`.
EXE SHA256: `98c4a97208a3d9fefa3f2c0f3b5101b90dfa9258aca8678de75b56bd860e636d`.
Service SHA256: `218b475d950a3fdb4f1e5ba1ef4d9147c9e07c72c5021a47db4cc72298571fd3`.
Renderer manifest SHA256: `27e306b74814e5bfc36691a8dc777d6771ab5a5d6ad56ccb9f0be54e932f37af`.

The candidate has not been launched. The running trust-recovery package and
status-recovery rollback were retained. The superseded, unlaunched trust-read
candidate was recycled after resolved-parent/name, non-reparse, no-running-user
and retained-package checks. Its earlier hash evidence remains immutable. No
Recycle Bin emptying or permanent deletion occurred.

Native inspection still showed Trust this device for Full Harness unapproved;
the earlier genuine device registration remains separately evidenced. No live
consent, trust write, restart, reconnect, replacement task or binding was
automated during these regressions. The next live step is the already-presented
human trust approval, followed by supported exact-task registration/preparation.

## CS5 disposition

Retain every requirement and gap through [the full inventory chain](2026-09-13-browser-dispatch-recovered.md).
This adds O4/O5 uncertain-write, stale-revision and real-handler browser evidence,
plus candidate artifact identity under CS4.4. It does not close PostgreSQL
contention/crash, the full production isolation matrix or genuine packaged
workflow acceptance. Exact pairing/delivery/acceptance, repeated shared Ready
up, durable goal recovery, truthful scoped prompt display/pickup/ack, three
useful linked successors through compiler/broker/resident executor, fresh
observation re-entry, interruption/revocation/stale rejection, zero duplicate
live effects and ordinary packaged recovery remain required. No full CS1-CS4
or O1-O6 exit is closed; CS5 remains incomplete. ET6 is unpassed and NAV1
unqualified. The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole dependency and maturity authority.
