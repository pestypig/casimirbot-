Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and binding repair
Capability or component: O2/O5 pairing acceptance and revocation reconciliation
Lifecycle stage: source admission; presentation
Reaction timescale: bounded acceptance and concurrent revocation
Authority owner: authenticated human revokes; authenticated destination accepts; Helix enforces the durable grant
Current maturity: implemented
Target maturity: deterministically verified for this scoped race; integrated workflow remains unproven
Required evidence: failing encrypted-repository fixture, repaired fixture, actual MCP/HTTP handler exchange, focused regressions
Explicit non-goals: no production consent automation, private runtime loop, catalog impersonation, ET6 substitution or NAV lane dispatch
Downstream gate unlocked: none

# September 12 setup and first reproduced boundary

This supplements the September 8 snapshots; it does not close the CS5 handoff.
Canonical status remains in `docs/helix-environment-harness-work-program-v1.md`.
Source base inspected: `0ecb9650f110aa62b2293760b15380f0766a3e04`, with unrelated
research and spatial-navigation documentation changes preserved.

## Packaged setup observations

The native app was initially absent. The first authenticated Device Check
returned a tunnel HTTP 404. Launched the existing
`apps/desktop/release-onboarding-pairing-20260908/win-unpacked/CasimirBot.exe`.
Its service emitted a fresh ready receipt at `2026-09-12T14:32:48.710Z`, origin
`http://127.0.0.1:64791`, service PID 22908. These are dated observations, not
values to reuse for future recovery. The native window rendered the saved
"Continuous session recovery" chat and displayed Codex ready. No consent
checkbox was exercised, no binding was accepted and no prompt was submitted.

Authenticated MCP Device Check then succeeded without reconnect/rebind. All
ten returned Minecraft device records were stale/offline and not probe-ready;
historical credentials/admissions were expired or missing. This does not prove
current environment action permission. This exact task registered an authenticated
client presence with an empty resource selection. The task continuation remained
client-declared, not provider-host-attested; the heartbeat was finite (180 seconds)
and is not durable pairing or gameplay authority.

SHA256 values match the September 8 saved package manifest:

| Artifact | SHA256 |
| --- | --- |
| EXE | e8033cd266af87d43e116ebbcf1aca7843dfe12e78d9d9a6d40f6dc5377475e9 |
| ASAR main.cjs | 04f15d251266b65e28607990428f50c786bf1a4ed27a6eefaf66e86cb657848c |
| ASAR preload.cjs | b57f9f738b87eda3ac6f0c081ff6f86c4ae1ec42bd803076dd217c11746c3329 |
| ASAR service.mjs | 2bd8aae76ca7e8928ffb1714e52f32476fe026586efcc8e584a5322d3837e0c3 |

The ASAR service contains `helix_reasoning_destination_register`,
`helix_reasoning_pairing_accept` and `helix_reasoning_pairing_recover`; source
registers them and deterministic catalog tests pass. This task's callable
catalog lacks all three. Ready up, prompt submit, legacy claim, steering read
and acknowledgement are present. Packaged string presence is not proof of the
live upstream tools/list response or external catalog adoption. The remaining
publication/adoption boundary needs supported diagnostics; this evidence does
not identify an internal Codex defect. No repeated reconnect was attempted.

## Reproduced defect and repair

Expanded the encrypted pg-mem transition fixture to revoke during the durability
barrier on both initial acceptance and replay. Before repair, initial acceptance
resolved with `state: accepted`, revision 2, after revocation had committed;
the replay case correctly rejected. Result: 17 passed, 1 failed.

`PairingTransitionService.accept` now follows both successful first commit and
replay with a fresh row read and existing destination/expiry/revocation validation.
The deterministic race rejects `pairing_revoked` and retains revision 3. No new
grant, deadline extension, provider retry loop or consent bypass was introduced.
This check does not claim an atomic response delivery relative to all possible
later revocations; subsequent binding operations still revalidate the grant.

The actual MCP acceptance handler is also tested with encrypted persistence and
the actual authenticated browser revocation route. Fixture revocation runs while
MCP acceptance awaits durability. The MCP result is an error containing
`pairing_revoked`, excludes the invitation secret, and leaves revision 3.
Only fixture identities/keys and a controlled durability barrier are used.

## Executed verification

Commands used one fork, `--pool=forks --maxWorkers=1 --minWorkers=1`:

- Initial current-source baseline: MCP coordination and rendered real-handler
  workflow: 31 passed.
- Expanded `pairing-ledger-repository.test.ts` before repair: 17 passed, 1 failed.
- After repair: `pairing-ledger-repository.test.ts` (18),
  `pairing-runtime-binding.test.ts` (3), MCP coordination (29), rendered
  real-handler workflow (2): 52 passed, four files, exit 0.
- After adding the public-handler race: MCP coordination rerun, 29 passed,
  exit 0. This repeats existing tests; it is not 29 additional distinct tests.
- `npm run build:server`: exit 0; four existing duplicate-key/case warnings.
- `npm run helix:ask:discipline:quick`: exit 0; classifier inferred no sensitive
  files for the service/test paths. It is a static check, not authority proof.
- `npm run helix:environment-harness:docs-audit`: passed.
- `git diff --check`: passed; Windows line-ending warnings remain informational.

These are component and in-process public-handler observations. The rendered
workflow uses jsdom, not browser pointer input or native packaged acceptance.
No new identity format or continuation protocol changed. Full discipline was
not rerun for this revalidation repair. Casimir verification is outside this
non-physics application patch's scope; no adapter/certificate claim is made.

## Remaining handoff requirements

| Requirement | New evidence | Still unproven |
| --- | --- | --- |
| CS1 / O1-O2 shared readiness and durable consent | Native startup/MCP recovery; initial/replay revoke race repaired | Three shared Ready up calls preserving identities; full expiry, account, restart, subject and durable-goal matrix; durable replacement policy |
| CS2 exact ingress | Existing joined handler regressions remain green | New packaged pairing, truthful visible natural prompt, exact live pickup/ack and complete identity/replay negatives |
| CS3 continuous movement | No new movement evidence | Three useful linked successors through real compiler/broker/resident executor; fresh observation re-entry and all original timing/effect criteria |
| CS4 interruption and recovery | Scoped pairing revocation race verified | Live manual interruption, stop, action revocation, stale rejection, zero duplicate effects and ordinary packaged recovery |
| O3 provider bridge | Source/package tools present; same-task external omission confirmed | Supported host task attestation/list/send/accept and durable automatic-delivery outbox; fallback is not automatic-path acceptance |
| O4-O5 UI and deterministic matrix | Real-handler regressions and new consent race | Whole-panel pointer/keyboard/native layout, coherent legacy/durable guidance, remaining timer/identity/consent/recovery/isolation rows |
| O6 packaged workflow | Saved package launch and artifact checks | This repair is source-only; new exact package and ordinary consent/delivery/idle/restart/revoke rehearsal |
| CS5 and original ET6 | This dated supplemental reconciliation | Requirement-by-requirement complete handoff and all original ET6 acceptance measurements; no stage closure or NAV unlock |

The running September 8 EXE does not contain this repair. No new package was
built or substituted in this increment. Continue deterministic missing-boundary
work, then stage a coherent exact package and resolve supported catalog adoption
before requesting fresh human pairing consent. The persistent goal remains
incomplete; this repair does not replace its full exit criteria.
