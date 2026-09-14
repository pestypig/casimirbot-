# Profile recovery: preserve registered artifact ownership

Classification: source admission and evidence normalization. This O5 identity
and recovery supplement follows the
[account-write precondition repair](2026-09-13-profile-write-account-precondition.md)
and [CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md).

## Reproduced boundary

`buildProfileStoragePayload` previously mapped all eligible localStorage
artifacts to the currently observed profile, regardless of their recorded
owner. The server's expected-profile check prevented an account change during
HTTP delivery but could not detect foreign content already relabeled by the
client. Two new red cases reproduced inclusion of another profile's preference
and chat storage values in the current profile's upload payload.

`profileEligibleArtifacts` now excludes any localStorage key registered to
another profile, a profile owner with unresolved identity, or a session-only
owner. The exclusion applies after synthetic artifact construction, so a
synthetic chat registration or duplicate current-profile registration cannot
re-admit the same foreign bytes. A storage value is indivisible at this layer;
mixed ownership therefore excludes the entire key. Local values and registry
ownership remain untouched. Guest and exact-current-profile candidates retain
their existing eligibility and attach policy.

## Verification

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Twenty tests passed, including the two previously failing cases, duplicate-key
ownership conflict, unresolved/session-only exclusion and positive guest/current
owner controls. Existing restoration, write precondition and stale account
response tests remain passing. The quick discipline check passed with
`HELIX_ASK_DISCIPLINE_CLASSIFICATION=source admission, evidence normalization`.

The existing real-handler browser recovery regression also passed all three
cases in 44.4 seconds:

```text
npx playwright test --config playwright.onboarding.config.ts profile-origin-recovery.spec.ts
```

Account sign-in/sign-out event recovery and pointer/keyboard restore on a new
loopback origin remain working. Fresh-snapshot-to-verified-UI measurements were
2512 ms (pointer) and 2173 ms (keyboard), below the unchanged 5000 ms fixture
budget. This browser run checks recovery compatibility; the foreign-owner
negative is a payload component test, not a cross-account browser acceptance.

## Scope limits

This is client payload admission, not a server authentication boundary or full
cross-account browser-store partitioning. Unregistered legacy localStorage
content has no owner proof here; chat rendering, account-switch cache clearing,
restore merge behavior and stale pending payload migration are not qualified by
this patch. Do not treat this as complete account isolation or O5 closure.

The running `release-account-scope-20260913` EXE predates this repair and the
setup account-event listener. No production consent, binding, credentials,
Minecraft state or running process changed. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority. All CS1–CS4/O1–O6 exit scopes remain incomplete; ET6 is
unpassed and NAV1 is not qualified. No physics/certificate verification is
claimed for this non-physics application change.
