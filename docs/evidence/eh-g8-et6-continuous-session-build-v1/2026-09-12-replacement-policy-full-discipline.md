Program gate: G8
Workstream: O2/O5 durable replacement policy
Capability or component: explicit predecessor approval and irreversible supersession
Lifecycle stage: source admission; evidence normalization
Reaction timescale: atomic acceptance policy and subsequent grant access
Authority owner: authenticated human reviews replacement; exact destination accepts; server enforces durable grant state
Current maturity: implemented
Target maturity: deterministically verified policy and later integrated replacement workflow
Required evidence: policy negatives, atomic service wiring, public handlers, persistence and native rehearsal
Explicit non-goals: no replacement activation, production consent, private loop, ET6 substitution or stage closure
Downstream gate unlocked: none

# Explicit replacement policy and executed discipline battery

The ledger approval now supports policy revision 2 only with an exact predecessor
ID and positive revision. Existing policy revision 1 remains the independent
pairing path and rejects replacement metadata. Rows can retain an irreversible
supersession record. Schema validation ties supersession to a previously accepted
grant, a different successor, an advanced revision and a valid timestamp before
the old grant deadline. Clock rollback across supersession rejects.

The new policy function validates the exact accepting destination, reviewed
predecessor ID/revision, owner, installation, chat, accepted predecessor and
pending unexpired replacement. It returns both proposed next rows without
mutating either input; callers must commit them atomically. Pending replacement
invitations reject through ordinary acceptance with `pairing_replacement_required`.
Superseded grants reject ordinary acceptance/recovery policy even after expiry;
revoking or expiring the replacement does not revive the predecessor.

No public issuance route, transition service or UI invokes this replacement
policy yet. Public projections/error mappings and full durable-access/browser
integration still need completion before replacement can be exercised. Policy
tests are not authenticated handler or native acceptance evidence.

Focused checks: replacement policy (6), existing ledger policy (16) and encrypted
repository (26): 48 passed, zero failed, exit 0, 3.16 seconds. Cases cover policy
version mismatch, ordinary-path rejection, unchanged inputs/deadlines, terminal
supersession, owner/installation/chat/revision mismatches, revoked predecessor,
expired invitation, wrong destination and clock rollback.

`npm run helix:ask:discipline:full` initially exited 0 but skipped its battery
because its path classifier inferred no sensitive files. That was not treated
as executed full verification. Ran the supported explicit override:

```powershell
npm run helix:ask:discipline:full -- --force
```

The complete serial run exited 0 and printed passed. Executed counts:

| Portion | Passed |
| --- | ---: |
| Prompt-solving prelude | 4 |
| Four adversarial shards | 8 + 8 + 8 + 7 |
| Fixed API parity contracts | 15 |
| Four API scenario shards | 4 + 4 + 4 + 4 |
| Live-source continuation routing | 26 |
| Live-source identity audit | 9 |
| Total executed tests | 101 |

Shard filtering skipped other cases during individual invocations; skips are
not additional executed tests. Final server build passed with four existing
unrelated duplicate-key/case warnings. The run used one worker at a time and
finished the original session without restarting it. A mid-run memory sample
reported 2,337,640 KiB free physical memory; this is a point observation, not
a continuously measured minimum. No source edits were made while the forced
battery ran. This remains a dirty-checkout check, not a signed artifact seal.

Documentation audit and scoped diff checks passed. Packages currently built or
running predate this policy. The full replacement matrix, PostgreSQL concurrency,
O6 and all original CS1-CS4 exits remain open. CS5 is still an incomplete handoff;
ET6 remains unpassed and no NAV lane is unlocked by this work.
