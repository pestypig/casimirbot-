# CFP-1 D07 retained-population and mandatory-remedy independent review — 2026-09-21

Program gate: G8 — Environment-harness release evaluation
Workstream: **CFP-1.ACCOUNTS / CFP-1.COMMERCE / CFP-1.OFFER independent review**
Capability or component: **Ordinary/protected retained-state bounds and mandatory-remedy process**
Lifecycle stage: **Independent specification review before numeric owner freeze, qualified D11 return or CFP-3/4 dispatch**
Reaction timescale: **Record creation/expiry, account deletion/return, refund/dispute, incident, provider outage and backup restore**
Authority owner: **Independent documentation reviewers verify the audit, integration, arithmetic and stage boundary; product owner and qualified D11 reviewers retain the unresolved policy decisions**
Current maturity: **specified gaps / `missing` and `D11_dependent` D07 rows**
Target maturity: **independently reviewed source audit and exact downstream requirements without premature numeric or legal selection**
Required evidence: **Current source fingerprints, retained-population/remedy audit, D07/D11/D12 integration, CFP-3 handoff, 21-pin manifest and documentation/link/diff checks**
Explicit non-goals: **No retention period, database quota, backup policy, refund, remedy promise, qualified legal/tax/privacy conclusion, runtime change, data deletion, provider change, production change, stage promotion or D07 closure**
Downstream gate unlocked: **The audit may control the next owner/qualified-review input and later CFP-3/4 fixtures; CFP-2/3 remain blocked**

## Verdict

**PASS on the current reviewed bytes.**

Two independent read-only reviews were used. The accounts/hosted reviewer
accepted the source mapping, all eleven mutable-source fingerprints, the
ordinary/protected distinction and the integrated D07/D11/D12/CFP-3 boundary.
The personal/developer reviewer first found two omissions: the case states
looked mandatory in sequence, and the fixtures did not cover an actual provider
outage with a revoked or deleted normal session. The packet was corrected and
the reviewer then returned PASS. A second integrated reviewer found that the
local snapshot-compaction and immediate-control source claims lacked exact
fingerprints. `server/db/client.ts` and `server/mcp/helix-mcp-server.ts` were
added to the source table, the audit and manifest pins were refreshed, and the
corrected current bytes were re-reviewed.

The accepted planning result is deliberately narrow:

- validity, expiry, per-room limits, query display limits and local snapshot
  compaction do not establish a global retained row/byte/age/backup bound;
- ordinary retained state and narrowly protected denial/revocation/payment/
  uncertain-effect/deletion/security evidence need separate finite capacity,
  cash and restore rules;
- protected evidence cannot be silently evicted to admit new work;
- one durable remedy case coordinates subsystem progress, but a case need not
  visit every possible state when a typed direct closure is valid;
- provider outage or revoked/deleted-session recovery preserves local release
  and independently verified intake/status without reviving an account, term,
  room or grant;
- exhaustion pauses new admission and escalates a duty. It cannot paywall or
  abandon a required remedy or imply guaranteed hosted availability.

## Arithmetic and reserve review

The reviewers confirmed the existing planning arithmetic:

```text
incident/manual-repair reserve       = 120 minutes / $60
ordinary attended repairs allocated  =  60 minutes / $30
unallocated incident amount          =  60 minutes / $30
provider reconciliation headroom     = $100 - $75 = $25
```

Those figures are distinct reserves and do not prove mandatory-remedy capacity.
The integrated intended `$60` partial case remains:

```text
$575.40 - $390.00 - $120.00 - $25.00 = $40.40
```

The `$40.40` is unallocated exposure before open rows, not margin or launch
approval.

## Current-byte fingerprints

| Input | SHA-256 |
| --- | --- |
| [Retained-population/remedy audit](../../../work-packets/eh-g8-cfp1-d07-retained-population-and-mandatory-remedy-audit-v1.md) | `0ED3ED227DC46C4778B112FB68CB945BBFC4ADA73C52789EDDB53DABAA17FFCD` |
| [D07 conservative envelope](../../../work-packets/eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md) | `F650CAA70F68046443064E69B14DAE39C70470BB32E5498231DF7C43DAC1224E` |
| [Privacy/financial submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `868F0F80727878B6957B0C3AD12CA49F4BA84AC55F4F4FD9FBDD6384E072D21C` |
| [D11/D12 return-ready manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `D1BF1CA46E19BC3EAA7D80F5A2DB8BB7ECCB6E84B005B2454674562421CBB405` |
| [D12 integrated claim prefreeze](../../../work-packets/eh-g8-cfp1-d12-integrated-claim-prefreeze-v1.md) | `490ADA05F180649EE896BDB8DB1C5CF29D16A85B8B93D6B869DAEA568CDC6D58` |
| [CFP-3 commerce handoff](../../../work-packets/eh-g8-cfp3-software-commerce-v1.md) | `72DD5D974C7E1156F56C89547B58B28F209BC44321AF6A3366B3E595AA15D98B` |
| [Owner decision/review queue](../../../work-packets/eh-g8-cfp1-owner-decision-and-review-queue-v1.md) | `D861899014AED2E938AFEDE2073C8138C3DC5CCC6D41C3D3CDFD676AF18467D5` |

The manifest's **21 of 21** declared input fingerprints matched current bytes.
The seller boundary remains the selected New York City individual sole-
proprietor planning route, with the private forecast excluded from public
repository evidence. The review does not convert that forecast into an LLC,
registration, tax, liability or privacy exemption.

## Validation

- `npm run helix:environment-harness:docs-audit`: **PASS** (`ok: true`).
- scoped local Markdown links: **PASS**, no missing targets.
- manifest fingerprint verification: **PASS**, 21/21.
- reserve and intended-case arithmetic: **PASS**.
- `git -c core.safecrlf=false diff --check`: **PASS**.

## Stage decision

The review accepts the **source audit and downstream requirements**, not a
numeric retained-population guard or a customer remedy contract. D07 remains
open for measured row/index/backup sizes, ordinary/protected population and
cash bounds, live processor/refund/dispute inputs, provider-unit/connector cash,
qualified D11 conditions and final owner return. D11 and final D12 remain open.
CFP-1 remains active at `specified`; CFP-2 and CFP-3 remain blocked. No account,
data, provider, payment, runtime or production state changed.
