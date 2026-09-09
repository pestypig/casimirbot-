# O5 rendered controls joined to real handlers — partial evidence

Classification: test harness. Added
`server/routes/__tests__/pairing-rendered-workflow.test.ts` using the actual React
pairing component, browser client, Express account handlers, registration and
ledger repositories, migrations 087–089, transition service and durable runtime
access. Fetch is bridged to Supertest against the actual router; it does not
substitute canned API success responses. Identity/trust ports, pg-mem storage
and an ephemeral AES-GCM key are isolated fixtures. No production credentials,
native broker, provider session or human-only production control is used.

The joined case exercises:

- Explicit rendered task selection and consent with no active presence.
- One encrypted invitation row through the real browser issuance route.
- Wrong provider credential rejection, exact acceptance and idempotent replay
  through the transition service (not an external MCP transport in this test).
- Runtime restoration and validated callback from the rendered acceptance check.
- Component remount plus replacement service/store over the same repository;
  a changed transient binding ID with unchanged grant expiry, recovered by GET
  without another invitation POST.
- Typed prompt submission and replay through the real HTTP route, one exact
  delivery through durable access, truthful typed origin and idempotent ack.
- Rendered revocation through the real handler, clearing the pairing's controls,
  final ledger revision 3, and rejection of further recover/read/submit attempts.

Verification: `npx vitest run server/routes/__tests__/pairing-rendered-workflow.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`
passed one integrated case at approximately 21:36 local on 2026-09-08; passed
again at approximately 21:37 after adding prompt/pickup/ack and post-revoke checks.
An initial `.tsx` filename was outside the server test include pattern and ran
no tests; the final `.test.ts` file is discovered and executed.

Limits: jsdom event activation is not physical pointer/keyboard evidence. Prompt
submission is HTTP-driven and pickup/ack use the real access service, not rendered
prompt display or a running provider task. Service replacement is in-process over
the same encrypted fixture database; it is not native process/disk restart. There
is no environment action or three-successor execution in this case. Native
encryption, actual host automatic delivery, all O5 matrix negatives, Chromium with
real handlers, O6 package and original CS1–CS4 exits remain open. No duplicate
game-effect or original ET6/NAV acceptance claim is made. Final CS5 remains due.
