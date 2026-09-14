# Diagnostic copy failure and readable fallback

Under [onboarding O4/O5/O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation. No authority change.

Used the ordinary app's Copy diagnostics control to inspect native tunnel state.
The clipboard did not contain the expected diagnostic schema and was discarded;
unrelated clipboard contents were not used or recorded. A fresh accessibility
read confirmed “Diagnostics could not be copied on this surface.” The previous
catch combined collection and clipboard errors, so the failing stage and actual
native tunnel state remain unproven.

The UI now distinguishes collection failure from clipboard failure. If the
sanitized diagnostic was successfully built but writing it fails, a read-only
textarea exposes that same allowlisted JSON for manual selection. It is cleared
before another collection attempt and after successful copying. Private error
messages are not displayed. Collection failure does not project cached state as
a fresh diagnostic.

The existing sanitization test now covers failed clipboard write, read-only
fallback, excluded identity/private-error strings and successful-copy recovery.
`npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`
passed 40 tests, exit 0. This correction is not packaged yet and does not prove
the original native copy failure's root cause. Full O1–O6/CS1–CS4 and CS5 remain
open; original ET6 unpassed and NAV1 gated. No maturity promotion.
