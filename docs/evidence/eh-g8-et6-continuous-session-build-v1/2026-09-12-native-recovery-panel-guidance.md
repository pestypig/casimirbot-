# Native recovery panel and guidance correction

Snapshot under [onboarding O1–O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation. No maturity or gate promotion.

In the running recovery EXE, native pointer navigation through composer disclosure,
Set up connection and Open Agent Access preserved the existing Continuous session
recovery chat and displayed Agent Access. Actual screenshot and accessibility
inspection confirmed the panel and the updated tool-activity-only explanation:
repeating the same presence refresh cannot enable steering. The panel showed no
registered destination and kept invitation creation disabled. No consent checkbox
was clicked, no claim created, and no environment permission granted.

The actual guide prefixed the client integration limitation with “Your action is
required.” Repaired this misleading presentation: the exact binding target marks
the known connected tool-activity-only limitation, and the overlay renders
“Connection limitation” for that state. Clearing it restores normal human-consent
wording. This is display metadata only, not an admission or consent change.

`npx vitest run client/src/components/workstation/__tests__/WorkstationGuidanceOverlay.spec.tsx client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`

Result: 48 tests passed across two files, exit 0. The new regression covers live
transition from limitation to consent wording and zero clicks on the target.
This small correction is newer than the running recovery package and has not yet
been packaged. Native panel navigation does not prove binding acceptance. Missing
provider registration/accept/recovery tools, integrated steering, remaining
deterministic/process-recovery matrix, O1–O6/CS1–CS4 and CS5 remain open. Original
ET6 is unpassed and NAV1 gated.
