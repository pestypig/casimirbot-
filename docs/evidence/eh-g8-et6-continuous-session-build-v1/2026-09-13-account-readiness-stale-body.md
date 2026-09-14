# Account readiness stale body rejection

Classification: presentation/evidence normalization. O4 identity recovery.

A deterministic component fixture reproduced an older linked response body
overwriting a newer NOT LINKED projection after the old request was aborted.
The pre-body abort check was insufficient once response.json was already pending.
Before repair: one failure, 13 passes; the stale final rendered state was linked.
Source now checks abort and exact current request ownership after body parsing.

```text
npx vitest run client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

After repair: 14/14 passed at 13:41:45 America/New_York. The new fixture triggers
a fresh status GET from a completion notification, observes NOT LINKED, then
settles the older linked body. The newer projection remains and only two GETs
occur. No grant, live OAuth, profile-switch authentication or server authority
is inferred from this component test. The production authorization boundary is
unchanged. This prevents stale presentation, not unauthorized server execution.

Source-only: the running release-oauth-open-wait-20260913 lacks this check and
the latest initial request deadline repair. Those changes still need packaging.
The original CS1–CS4/O1–O6 exits and full CS5 inventory remain unchanged. ET6 is
unpassed and NAV1 unqualified.
