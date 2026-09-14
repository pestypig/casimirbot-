# Durable steering policy layer — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [canonical work program](../../helix-environment-harness-work-program-v1.md).
Classification: evidence re-entry policy. No maturity or gate advances.

Added an unconnected server-internal policy module for durable event records.
Event identity hashes owner, pairing and client event reference, excluding the
transient runtime binding. Request digests bind normalized text, truthful origin,
requested lifetime and exact grant chat/run. Deadline creation is capped at the
pairing deadline. Exact replay preserves the stored record and acknowledgement;
new acknowledgement after event expiry rejects. A prior acknowledgement can be
reconciled after event expiry only while the pairing remains admitted.

Schema checks detect identity/content tampering and invalid event times. Policy
requires accepted, non-revoked/non-superseded finite grants and rejects clocks
before recorded transitions. This module does not authenticate a principal,
persist anything, allocate cursors atomically, or expose a public endpoint.

```powershell
npx vitest run server/services/local-supervisor/__tests__/durable-steering-contract.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Four policy tests passed: serialized acknowledged retry preserves identity and
deadline; request conflicts and pairing separation; exact expiry boundaries;
revocation, tampering and backward-clock rejection. Serialization is not encrypted
disk recovery. The previously reproduced runtime restart gap remains present
until durable persistence and handler integration are implemented and verified.
Full O1–O6 and CS1–CS4 remain incomplete; CS5 remains incomplete, original ET6
unpassed and NAV1 gated.
