# Profile restore failure repair — source and deterministic evidence

Classification: evidence normalization and presentation/storage recovery.
Scope: O1/O5 recovery negatives and the CS4 recovery prerequisite. This is not
packaged acceptance, a new authority path, or a replacement for CS1–CS4/ET6.

## Reproduced failures

The [origin diagnostic](2026-09-13-origin-recovery-boundary.md) prompted inspection
of the existing authenticated encrypted profile backup path. Two further failures
were reproduced before repair:

1. The renderer marked restore complete in `finally`, even for HTTP 503 or a
   different profile in the response. New local chat state was then POSTed over
   the saved snapshot. A hung response body never recovered.
2. `readProfileStorageSnapshot` converted native broker/decryption failure into
   a successful empty snapshot. The real native-broker test received empty
   entries when protection was deliberately unavailable, instead of rejection.

All inputs were isolated fixtures. No production credentials, account session,
consent, provider task or environment executor was used.

## Repair

- Restore must succeed for the expected profile before new or queued backups
  can run. Attempts have an eight-second deadline including response-body wait;
  failed reads retry after twelve seconds. Unmount cancels retries, and late
  bodies cannot apply state. Recovery clears its own stale error status.
- Missing database rows still mean an empty profile. An unreadable or invalid
  existing snapshot raises the sanitized `profile_storage_restore_unavailable`
  error. Snapshot and export HTTP handlers return 503 with no profile content.
- Usage inspection reads only database byte-count/timestamp metadata. It remains
  available during a protection failure without decrypting contents or claiming
  the saved data is absent.
- Account authentication, encrypted storage keys, binding consent and finite
  environment authority are unchanged. No native origin migration or fixed-port
  workaround was introduced.

## Verification

Commands executed:

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts server/routes/__tests__/profile-storage-recovery.test.ts server/services/helix-account/__tests__/profile-storage-native-broker.test.ts server/services/helix-account/__tests__/profile-storage-store.test.ts server/__tests__/local-pg-mem-persistence.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

29 tests passed across five files (51.15 seconds). These include the actual hook
with fixture fetch/clock, actual encrypted broker/store, actual public HTTP
handlers, and isolated disk-backed account/profile restart tests. They do not
form a single integrated browser/native/live workflow.

After changing usage inspection to metadata only:

```text
npx vitest run server/services/helix-account/__tests__/profile-storage-native-broker.test.ts server/services/helix-account/__tests__/profile-storage-store.test.ts server/services/workspace-os/__tests__/workspace-storage-status.test.ts server/routes/__tests__/profile-storage-recovery.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Eight tests passed (36.26 seconds), including unchanged encrypted bytes during
failure, sanitized HTTP 503, authentication rejection, restored original content,
successful export after protection returns, and correct non-content usage counts.
These overlap the first battery; do not sum them as distinct coverage.

Server and client builds passed. The client completed in 1m49s. Existing duplicate
key/case, browser externalization, eval and chunk warnings remain. Quick discipline
static checks passed over the dirty checkout (including unrelated sensitive files);
this is not runtime or complete dirty-tree qualification. Casimir verification is
outside this non-physics/non-adapter patch scope; no certificate claim is made.

## Requirement handoff

| Requirement | Evidence added | Still required |
| --- | --- | --- |
| O1 reproduce recovery failures | Red client overwrite/hang and real native-protection fixtures | Full onboarding reproduction matrix |
| O2 durable finite pairing | No pairing changes | All remaining exact-identity/recovery acceptance in the existing inventory |
| O3 automatic provider path | None | Actual supported host list/send/accept proof |
| O4 coherent UI recovery | Recovery error status and bounded retry in source | Persisted onboarding selection and complete pointer/keyboard journey across ports |
| O5 deterministic recovery/isolation | Scoped failure, late-body, queued-backup, encrypted-store and handler evidence above | Full O5 matrix and integrated rendered-handler workflow |
| O6 packaged rehearsal / CS4 ordinary recovery | No new packaged evidence | Package these changes and prove authenticated ordinary restart with exact chat/pairing and no duplicate effects |
| CS1/CS2 readiness and exact ingress | No new acceptance | Every remaining exit in the canonical packet |
| CS3 continuous movement/re-entry | None | Real three-successor execution, observation re-entry, interruption/revocation and stale rejection |
| CS5 handoff | This scoped supplement to the existing requirement inventory | Full CS1–CS4 proof before final closure; original ET6 measurements remain unavailable |

The running `release-account-entry-20260913` EXE was left untouched with its human
sign-in panel open. This repair is not in that package. The separate origin-scoped
preference recovery defect remains open; the existing authenticated profile sync
path should be tested before adding another persistence mechanism. Complete O1–O6
and CS1–CS4 remain unproven, original ET6 remains unpassed, and NAV1 is not unlocked.
