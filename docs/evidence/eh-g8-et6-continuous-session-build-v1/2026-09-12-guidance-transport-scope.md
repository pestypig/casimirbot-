# Distinguish ready limited transport from readiness timeout

Under [onboarding O4/O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation. No authority or automatic transport mutation.

Following the native five-second warning, source inspection found that guidance
waited identically for an unready tunnel and a ready tunnel whose scope was only
Device Check/supervisor coordination. Added a distinct response for the latter:
show that transport is ready but Full Harness scope is inactive, and identify
Start Harness as the finite-lease request. Pairing and gameplay consent remain
explicitly separate. No start method is invoked by this presentation path.

The regression supplies ready limited scope, verifies the explanation and absence
of the timeout claim, checks one state read, and confirms no native start call.
`npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`
passed all 40 tests, exit 0, 11.42 seconds overall.

The actual native state that produced the earlier warning has not yet been
captured, so this does not claim its root cause is proven. The correction is newer
than the running guidance EXE. No production consent or environment action was
performed. O1–O6/CS1–CS4 and CS5 remain incomplete; original ET6 unpassed, NAV1 gated.
