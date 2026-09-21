Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS D01/D03 acceptance handoff review
Capability or component: Personal Fabric bootstrap, public directory exclusion and conditional non-game fallback
Lifecycle stage: planned operation/context acceptance
Reaction timescale: CFP-1 claim freeze before CFP-2/3 fixtures
Authority owner: Product owner selects claims; independent agent checks plan alignment; qualified rights reviewer retains commercial disposition
Current maturity: specified
Target maturity: specified with final rights-reconciled operation and claim rows
Required evidence: [directory matrix](../../../work-packets/eh-g8-cfp1-public-directory-first-cohort-scope-v1.md), [operation overlay](../../../work-packets/eh-g8-cfp1-first-customer-operation-target-overlay-v1.md), [subcases](../../../work-packets/eh-g8-cfp1-selected-operation-acceptance-subcases-v1.md), [identity contract](../../../work-packets/eh-g8-cfp1-fabric-package-runtime-identity-contract-v1.md)
Explicit non-goals: no installed operation, signed-JAR claim, fallback customer-value proof, commercial clearance or stage promotion
Downstream gate unlocked: none automatically; D01/D03/D07/D11/D12 and CFP-2/3 remain controlling

# Independent operation/directory/fallback alignment review — 2026-09-20

Reviewer `/root/cfp1_closure_review` initially found two wording defects while reviewing the operation overlay, selected subcases and Fabric identity contract. The overlay had described the non-game fallback as already useful and rights-cleared, though the first-party canvas marker is only a development target. The subcases had referred to a “signed/installed JAR,” though the separate companion JARs are proposed as hash-bound assets in an authenticated release tuple, not individually signed artifacts. Both passages were corrected and the reviewer returned **PASS** on recheck.

The reviewer also checked that ID-02 tests the provisional Fabric-player `0.4.0` public-directory exclusion while DIR-01–06 own all five generic-directory rows and old-device cutover, without changing the separate local Fabric bootstrap path. This is a plan/test-handoff review, not execution or a qualified D11 return. CFP-1 remains active (`specified`); CFP-2/3 remain blocked.
