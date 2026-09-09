# Native broker integration and destination registration clarification

Recorded 2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: test harness and source admission analysis. No production consent
or provider task was changed by this run.

## Actual broker integration

```text
npx vitest run server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Three cases passed. The new case uses the production repository factory, actual
desktop credential-broker HTTP handlers, full database migrations and temporary
disk snapshots. No injected repository codec is used in that case. All keys and
tokens are isolated ephemeral fixture values; no live broker credentials are used.

It verifies native v2 ciphertext, absence of the task ID from plaintext storage,
database reconstruction and broker restart with an active/retired key rotation,
exact row recovery, rejection when the retired decryption key is missing, and
rejection with an incorrect broker token. Failed reads create no additional rows.
This is component integration, not a native EXE workflow or consent test. OS key
protection and installed-package recovery still require their own acceptance.

## Clarification of the prior transition-service finding

The plan permits a **previously authenticated durable destination registration OR
fresh provider attestation**. The earlier finding that a caller-declared
continuation is not provider-attested remains correct, but provider attestation
is not an additional mandatory prerequisite for every manually paired path.

The existing MCP principal supplies authenticated issuer/profile/client identity;
the continuation is explicitly declared by that authenticated client. A durable
registration can preserve this exact tuple with truthful declaration provenance,
finite registration validity and owner/device checks. It must not claim provider
verification, synthesize current presence, or accept a bare task ID or claim code
without matching the authenticated client registration. This provides the concrete
next integration path for manual pairing while O3 automatic delivery remains open.

Inspection found the bundled Codex plugin to be an MCP integration. The existing
embedded native provider bridge launches a separate app-server process; it does
not establish connection to this running desktop task. No substitute process or
replacement task was launched. Automatic task listing/delivery must still prove
the supported existing-host boundary and cannot be inferred from registration.

O2/O3 and packaged O6 are incomplete. Original ET6 remains unpassed; NAV1 remains
gated. The running EXE was neither rebuilt nor restarted by this increment.
