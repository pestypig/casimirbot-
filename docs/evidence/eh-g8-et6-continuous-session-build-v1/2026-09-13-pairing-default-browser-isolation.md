# Pairing browser identity and packaged fixture isolation checkpoint

Classification: source admission; test-only authority regression and static
package inspection. Supplement to the [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md),
principally O5 identity/consent/isolation. No production implementation changed.

The current task's callable catalog still exposes Ready up, prompt submit,
binding claim and steering read/ack. A fresh authenticated presence attempt for
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d` against the current
[profile-settlement package](2026-09-13-profile-settlement-package.md) returned
`McpServerError: Session terminated`, JSON-RPC 32600 / INVALID_ARGUMENT.
No current presence or binding was inferred; no reconnect, old claim replay or
replacement task followed. Ordinary account sign-in remains pending. The error
alone does not establish its cause.

Fresh deterministic verification passed all 22 tests without skips in:

```text
npx vitest run server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=.tmp/pairing-browser-authority-20260913.json
```

These cover the existing fixture-authenticated browser routes and encrypted
destination contracts, including wrong ownership, changed scope, idle reuse,
revocation and sanitized failures. The injected browser resolver means those
tests alone cannot prove the default missing-session boundary.

The added parameterized regression in
`server/routes/__tests__/agent-connections.test.ts` constructs the real router
without replacing its browser-session resolver. Seven endpoints are exercised:
destination list, invitation reconciliation, pairing read, delivery list,
invitation issue, pairing revoke and delivery dispatch. Each receives an
asserted bearer credential, fixture profile headers and claimed approval header;
POST bodies additionally assert owner, human approval and typed/GPT Live/MCP
origin. No browser session cookie is supplied.

Every request returns 401 `session_required`, `no-store`, credential/answer/
terminal flags false, and no echoed credential. Presence, account-link,
destination and trust dependencies are never called. The default account
resolver's empty-session path returns before database access; no production
account, service, credential broker or authority store is used. This checks
rejection of asserted identity, not valid-cookie expiry or production OAuth
authentication. The GET variants repeat the same header check because origin
fields apply only to POST bodies.

```text
npx vitest run server/routes/__tests__/agent-connections.test.ts -t 'default browser identity' --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=.tmp/pairing-default-browser-isolation-20260913.json
```

All seven selected cases passed; 17 unrelated cases were filtered out. The
earlier 22-case run preceded this test-only addition; these scopes are separate.

A fixed-string search of all packaged resources found none of:
`Sign in fixture account`, `Switch fixture chat`,
`fixture_account_change_failed`, `fixture_provider_denied`,
`fixture-browser-session`, `fixture-rendered-owner`, or `onboarding-isolated`.
The inspected client source and production entry files also had no references
to `onboarding-isolated`, `real-handler-exports`, `profile-recovery-exports` or
`pairing-vault-fixture`. Client HTML selects `/src/main.tsx`; the desktop host
build selects its main/preload entries and `server/index.ts` for the service.
This is bounded source/marker inspection, not a complete transitive import
proof, binary security audit or proof that every possible fixture hook is absent.

No rebuild is required for this test-only change. The existing package identity
and native navigation evidence retain their scope. Authenticated end-to-end
pairing, actual provider list/send/accept, expiry/restart recovery and live
environment execution remain unverified. CS1–CS4/O1–O6 remain incomplete;
ET6 is unpassed and NAV1 is not qualified. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority.
