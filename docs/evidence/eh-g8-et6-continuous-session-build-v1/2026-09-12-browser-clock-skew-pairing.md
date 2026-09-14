# Browser clock skew and authoritative pairing status

O4/O5 timer/UI evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Extended the isolated real-handler browser fixture with pointer (375x640) and keyboard (1280x640) cases. After actual rendered fixture approval and production HTTP issuance into the encrypted pg-mem ledger, only the browser clock advances 901 seconds. The server clock and invitation remain valid.

Both cases verify that local elapsed-time guidance appears, the invitation field and Copy invitation button disappear, the pairing remains server-pending, and no Review a new invitation action appears. The ledger remains byte-for-byte structurally unchanged and browser POST count remains one. Exact fixture-provider acceptance through the real transition service then appears after pointer/keyboard Check acceptance. Invitation and pairing deadlines remain unchanged and only one ledger row exists. This demonstrates local clock skew cannot manufacture server expiry or another consent mutation. It does not prove server-expired UI recovery or a real host's acceptance.

Commands:

```text
npx playwright test --config=playwright.onboarding.config.ts client/e2e/onboarding-isolated/durable-real-handlers.spec.ts --grep client-clock-ahead
npx playwright test --config=playwright.onboarding.config.ts client/e2e/onboarding-isolated/durable-real-handlers.spec.ts
```

Results: new cases 2/2 passed (14.3 seconds); complete current file 14/14 passed (49.1 seconds), including copy/lost-reply, account/chat switches, automatic delivery, lost provider reply/reconstruction and prompt pickup/ack paths. Existing import.meta/IIFE test bundle warning remains. Keys, sessions and provider acceptance are isolated fixtures; no production human control or credential was used. Production code and the running EXE were unchanged. Full O1–O6, CS1–CS4 and original ET6 remain unfinished.
