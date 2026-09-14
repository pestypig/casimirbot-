# Rendered replacement review — September 12, 2026

Evidence under [the replacement packet](../../work-packets/eh-g8-cs-durable-pairing-replacement-v1.md)
and [the canonical work program](../../helix-environment-harness-work-program-v1.md).
Classification: presentation and evidence re-entry. This snapshot does not
advance any maturity or gate status.

## Implemented behavior

An accepted pairing exposes Review replacement pairing. The control reads fresh
server status before naming the exact predecessor ID/revision. It saves the
previous review separately, starts a new request identity and clears approval.
The replacement review states when the predecessor stops working and that later
revocation or expiry of the successor does not restore it. Submission requires
the exact selected task, human checkbox and a freshly checked accepted predecessor
at the reviewed revision. Server admission remains authoritative.

The previous review is retained during pending or unknown issuance, and its
status and runtime are re-read through existing authenticated APIs. Browser
metadata is not grant authority. A lost issuance response reloads and reconciles
the same request. A user can return to the previous pairing before submission;
after submission, pending/unknown acceptance cannot be abandoned through that
control. A terminal replacement can return to the prior record for inspection,
without reviving its authority. Accepted replacement clears the predecessor's
cached runtime identity. Existing runtime callbacks are matched by pairing ID.

## Executed tests and build

`npx playwright test --config playwright.onboarding.config.ts durable-real-handlers.spec.ts`

4 passed, 18.3 seconds overall: pointer and keyboard, each with normal replies
and lost issuance replies. These existing real-handler cases now additionally
exercise the rendered replacement review and consent, pending predecessor
preservation, replacement acceptance, visible matching runtime, predecessor
recovery rejection and replacement revocation without predecessor resurrection.
Lost-reply cases drop both ordinary and replacement issuance replies after actual
HTTP commit and recover by reload. Exactly three browser POSTs occur per complete
case: original invitation, replacement invitation, successor revocation. The
secrets remain absent from browser localStorage.

The test uses real browser events at 375px/1280px widths, actual public Express
handlers, migrations, encrypted rows and the embedded two-record atomic primitive.
Only human/provider identity, device trust and encryption keys are isolated fixture
ports. Provider acceptance is the real transition service called by the test with
its fixture credential, not an external MCP call. Service-object replacement over
the retained database is still not a native process/disk restart. No production
consent or production invitation was automated.

`npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/lib/agent-access/__tests__/durablePairing.spec.ts server/routes/__tests__/pairing-rendered-workflow.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

24 passed: rendered component 13, transport 9, real rendered HTTP workflow 2.
New component cases check explicit reapproval, loss/reload preserving the exact
replacement request and old display, and return before submission with only GETs.

`npm run build:client` passed, 3334 modules transformed, 50.32 seconds. Existing
Browserslist, browser externalization, tree-sitter eval, mixed import and chunk
size warnings remain. Generated documentation metadata changed through the normal
build command. Scoped whitespace checks passed.

## Remaining requirements

These are deterministic rendered/browser and embedded integration tests. They do
not qualify the full workstation, native EXE, real PostgreSQL concurrency, native
encrypted-store/process recovery, idle host delivery, external exact-task
attestation, or any Minecraft movement/interruption loop. Additional replacement
failure and late-response/storage-boundary cases remain part of the packet's full
matrix. Final cumulative discipline validation is still needed after the recent
service/route changes. The running EXE does not contain this work.

O1-O6 and original CS1-CS4 remain incomplete. CS5 is still an incomplete handoff;
ET6 remains unpassed and no NAV gate is unlocked.
