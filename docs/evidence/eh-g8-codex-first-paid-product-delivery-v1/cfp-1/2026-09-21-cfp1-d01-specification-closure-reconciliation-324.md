# CFP-1 D01 specification-closure reconciliation — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.SCOPE / CFP-1.CLAIMS**
Capability or component: **D01 first-customer personal capability, compatibility and operation boundary**
Lifecycle stage: **specification reconciliation before installed qualification**
Reaction timescale: **At first-cohort selection and after a material client, OS, connector or operation change**
Authority owner: **Product owner selects the personal capability slate; CFP-2/3 execute the frozen qualification; D12 controls later public wording**
Current maturity: **specified**
Target maturity: **specified with D01's exact cohort and operation fixtures independently reviewed**
Required evidence: **Owner-selected personal slate; exact first-cohort target; version-drift rule; versioned operation and denial fixtures; current local identity recheck; prior independent specification review**
Explicit non-goals: **No customer-support, installed-compatibility, signed-artifact, rights-clearance, runtime, account, payment or stage-promotion claim**
Downstream gate unlocked: **D01 contributes a closed CFP-1 specification input to D12; CFP-2/3 remain blocked by the parent exit**

## Reconciliation question

The [post-322 completion audit](2026-09-21-cfp1-post-322-completion-audit-323.md)
initially described D01 as conditionally specified and asked CFP-1 to freeze the
exact Codex/Windows target and operation manifest. Current authoritative inputs
show that these selections were already made and independently reviewed:

| Input | Current exact SHA-256 | D01 contribution |
| --- | --- | --- |
| [First-cohort compatibility target](../../../work-packets/eh-g8-cfp1-first-cohort-compatibility-target-v1.md) | `E204CFDFC6FE3D0DB4E4D67574B7CB58F483B7F9CC001610B4660DCDE52ECE2C` | Selects Codex AppX `26.915.4065.0` x64, Windows 11 25H2/build family 26200, conditional Minecraft/Fabric/Java versions, reserved CasimirBot artifact identity, narrow hardware qualification floor and version-drift denial/rebaseline rule. |
| [Selected operation subcases](../../../work-packets/eh-g8-cfp1-selected-operation-acceptance-subcases-v1.md) | `D3E92513070DD9FACC0A850FCC00A21D6F8C86911E1A6A3EF52670E097400BA7` | Selects FP-01–FP-13: authorization/actor status, four exact probes, bounded `mine`, authority inspect/configure/revoke and workflow status/cancel/Emergency Stop, with positive and denial fixtures and evidence owners. |
| [Compatibility selection and independent review 297](2026-09-21-cfp1-first-cohort-compatibility-selection-and-review-297.md) | `AC7E824DA05A94EBB20A3E2C85642521BD3D631202E53D5D7CD5E09E333E2CDD` | Returned PASS after correcting the adapter-source description and confirmed the selected tuple, source boundary, links and CFP-1 versus CFP-2/3 evidence split. |
| [Conditional D03 action freeze](../../../work-packets/eh-g8-cfp1-conditional-minecraft-shared-action-freeze-v1.md) | `EB1E57340DC6A349A73D2CDF18CEFA6D53BA6CBDC6E5FF9C075B01A2E256B28C` | Reserves the planned no-locomotion successor player `0.4.13` / adapter `0.4.12`, keeps the directory package excluded and defines the exact hosted action separately from the personal two-effect task. |

The fresh local read at this reconciliation returned the same current
qualification lead: `OpenAI.Codex` `26.915.4065.0` x64 and Windows 11 25H2,
build `26200.9457`. This confirms no rebaseline is required before dispatch; it
does not prove that the pair works with a signed CasimirBot artifact.

## Boundary decision

**D01's CFP-1 specification dependency is closed.** The selected inputs answer
which first personal capability slate, exact client/OS/game-and-connector tuple,
planned compatibility successor, positive/denial cases and evidence owners
later stages must qualify.

This closure has three strict limits:

1. It does not advertise or accept any operation for customers. CFP-2/3 must
   build the reserved artifacts, bind exact signed EXE/JAR/manifest identities
   and execute the selected ordinary-user positive, denial, stop, restart and
   recovery cases.
2. The Minecraft personal sentence remains conditional on component and
   personal-use rights review. A negative return removes or revises the
   dependent FC-04 claim without pretending D01's technical selection passed.
3. D12's combined `OPERATION_MANIFEST` remains open for the hosted action,
   final D07 PBT/resource ceilings, accepted rights references and resolved
   customer sentences. That integrated freeze is distinct from selecting the
   D01 personal rows.

A material Codex, Windows build-family, Minecraft, Fabric, Java, connector,
artifact or operation change reopens the affected D01 selection and requires a
new independent specification review before later-stage acceptance can use it.

## Stage decision

D01 and D02 now each have a closed CFP-1 specification dependency. D03 remains
conditional on its qualified rights disposition; D07, D11 and final D12 remain
open. CFP-1 therefore remains active at `specified`, and CFP-2/3 remain blocked.
No runtime, client configuration, account, game profile, release artifact,
provider, payment or production setting changed.
