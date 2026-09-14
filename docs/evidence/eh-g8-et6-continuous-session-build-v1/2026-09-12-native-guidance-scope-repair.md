# Native pending-guidance scope repair

Snapshot under [onboarding O4/O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation; native IPC result recovery. No consent, identity,
credential-audience or execution-authority change. No maturity promotion.

The parent plan requires native typechecking. Running
`npx tsc --noEmit -p apps/desktop/tsconfig.json` reproduced four TS2304 errors in
main.ts: the pending-guidance IPC handler referenced `startupJournal` and `secret`
outside their scope. Both unavailable-guidance and consume-guidance paths could
throw a ReferenceError before returning their result. Successful esbuild
packaging had not detected this lexical error.

Added the existing journal to the private DesktopRuntime object and referenced
`runtime.startupJournal` and `runtime.secret` in that handler. The journal's
existing redaction and bounded logging remain in use. No journal or secret was
added to the renderer snapshot. Native typecheck then exited 0 with no errors.

This does not prove native IPC interaction after rebuilding. It is newer than
the running recovery package, along with the latest guide label and steering
revision fixes. Those changes require a new artifact and ordinary verification.
The actual O3 provider list/send/accept bridge remains unproven; caller-declared
registration and fallback cannot close it. Remaining O1–O6/CS1–CS4 and CS5 scope
is unchanged. Original ET6 is unpassed and NAV1 gated.
