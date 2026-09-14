# Onboarding preferences through existing profile recovery

Classification: presentation. Scope: O4/O5 and the CS4 ordinary-recovery
prerequisite. This evidence does not close any full program or work-packet exit.

The new component fixture failed before the repair because
`buildProfileStoragePayload` omitted `helix.agent_connection_setup.v1` after the
operator selected Codex App. `AgentConnectionSetup` saved that key locally but
never registered it as a profile backup candidate.

The component now registers the existing three-field serialized preference
(schema, selected application and viewed step) with the workspace memory
registry. Unchanged values do not create another registry update. Existing
artifact ownership/sync policy is retained. Claims, consent, presence and
environment authority are not serialized into this preference. This reuses the
existing authenticated encrypted profile backup, including the
[restore-failure guard](2026-09-13-profile-restore-failure-repair.md).

## Deterministic evidence

```text
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

57 tests passed (26.62 seconds). The new assertion checks the exact preference
payload and absence of authentication/consent POSTs during selection. This is
component evidence with fixture fetch responses, not a real account workflow.

```text
npx playwright test --config playwright.onboarding.config.ts profile-origin-recovery.spec.ts
```

Both pointer and keyboard cases passed (36.3 seconds total; 14.8s and 11.8s test
wall times). These test times include setup and are not recovery latency metrics.
The harness bundles the real rendered component, chat store and profile sync hook;
it uses the actual account HTTP handlers, isolated pg-mem database and native
encryption broker with a fresh fixture keyring. It saves one exact chat and Codex
preference, then navigates to a second independently allocated loopback port with
the same fixture account. The exact chat and three-field preference recover;
the stored chat map contains one chat and no reasoning binding or action grant.

An initial keyboard run hit `Execution context was destroyed` while asserting
during the real restore hook's reload. The observer now retries that specific
navigation error; all other errors still fail. Both cases passed on the rerun.
No product behavior was changed to mask this test-observation race.

This is **browser integration with real profile handlers/storage**, not a native
EXE session, a full server-process restart, or live binding/gameplay acceptance.
The two HTTP origins share the test backend. The test entry points are isolated
from normal application registration. The database is in-memory with persistence
disabled; the broker and browser account are fixtures. Browser requests outside
the two fixture origins are blocked. Production credentials and consent are unused.

## Remaining acceptance

- The [origin diagnostic](2026-09-13-origin-recovery-boundary.md) still accurately
  describes signed-out browser-local storage. This repair proves recovery only
  through a successful authenticated profile snapshot.
- Existing pre-repair snapshots did not contain this preference; they cannot
  reconstruct an unrecorded selection. Opening the repaired component registers
  subsequent preferences for the existing backup path.
- Exact task/run selection, finite accepted pairing recovery, prompt pickup/ack,
  interruption/revocation and zero duplicate environment effects remain separate
  required evidence. No copied binding projection supplies authority.
- The five-second recovery budget was not measured by these cases. Ordinary
  packaged account/session recovery, provider bridge feasibility and O6 remain
  open. Source tests do not prove the current running EXE includes this repair.

Quick discipline checks passed with classification `presentation`; the full dirty
checkout includes unrelated classified files. This non-physics preference patch
does not require or claim Casimir adapter/certificate verification.

This supplements the [CS5 requirement inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md)
and [recovery handoff](2026-09-13-profile-restore-failure-repair.md). Full O1–O6,
CS1–CS4 and CS5 closure remain unproven. Original ET6 remains unpassed and NAV1
is not unlocked.
