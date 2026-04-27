# NHM2 Lapse Alpha Sweep Status

- generatedAt: 2026-04-27T14:06:02.583Z
- sweepName: nhm2-centerline-lapse-efficiency-sweep-v1
- firstFailureProfileId: stage1_centerline_alpha_0p7000_v1
- strongestPassingProfileId: null
- dominantFailureGate: baselineInvariance
- summaryJson: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\selected-family\nhm2-shift-lapse\alpha-sweep\nhm2-lapse-alpha-sweep-latest.json
- failuresJson: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\selected-family\nhm2-shift-lapse\alpha-sweep\nhm2-lapse-alpha-sweep-failures-latest.json
- claimsJson: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\selected-family\nhm2-shift-lapse\alpha-sweep\nhm2-lapse-alpha-sweep-claims-latest.json
- claimPromotionReportJson: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\selected-family\nhm2-shift-lapse\alpha-sweep\nhm2-claim-promotion-report-latest.json

## Gate Table
| profileId | alpha | overallState | runHealth | progressionClass | claimClass | supportTier | uncertaintyCategory | promotionEligible | baselineInvariance | clockingConsistency | antiSrSafety | decompositionConsistency | invariantGate | fullLoopStateRaw | fullLoopStateNormalized | fullLoopAudit | evidenceLedger | evidenceLedgerReason | stageDetailFreshness |
|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stage1_centerline_alpha_0p7000_v1 | 0.7 | fail | failed_timeout | diagnostic_fail | not_validated | repo_plus_literature | runtime_blocker | fail | fail | fail | fail | fail | fail | unavailable | fail | fail | fail | full_loop_unavailable | timeout:selected_transport_timeout |

## Claim-Safety Templates
- repo_measured: `This profile is observed in this repository under the current NHM2 full-loop gates.`
- repo_plus_literature: `This profile has repository evidence plus literature context, but remains non-promoted unless all promotion gates pass.`
- literature_only_nonproof: `This profile is literature-context only and cannot be promoted as repository-measured evidence.`
- not_validated: `This profile did not pass the NHM2 full-loop promotion stack and remains diagnostic only.`

## Citations
- natario-2001: Warp Drive with Zero Expansion (https://arxiv.org/abs/gr-qc/0110086)
- gourgoulhon-2007-3plus1: 3+1 Formalism and Bases of Numerical Relativity (https://arxiv.org/abs/gr-qc/0703035)
- springer-natario-2024: A Closer Look at Natario's Zero-Expansion Warp Drive (https://link.springer.com/article/10.1007/s10773-024-05700-0)
- alcubierre-1994-cqg-doi: The warp drive: hyper-fast travel within general relativity (https://doi.org/10.1088/0264-9381/11/5/001)
- alcubierre-2000-grqc0009013: The warp drive: hyper-fast travel within general relativity (https://arxiv.org/abs/gr-qc/0009013)
- natario-2001-grqc0110086: Warp Drive With Zero Expansion (https://arxiv.org/abs/gr-qc/0110086)
- pfenning-ford-1997-grqc9702026: The unphysical nature of Warp Drive (https://arxiv.org/abs/gr-qc/9702026)
- van-den-broeck-1999-grqc9905084: A warp drive with more reasonable total energy requirements (https://arxiv.org/abs/gr-qc/9905084)
- bobrick-martire-2021-210206824: Introducing Physical Warp Drives (https://arxiv.org/abs/2102.06824)
- bobrick-martire-2021-cqg-doi: Introducing physical warp drives (https://doi.org/10.1088/1361-6382/abdf6e)
- lentz-2021-cqg-doi: Breaking the warp barrier: hyper-fast solitons in Einstein-Maxwell-plasma theory (https://doi.org/10.1088/1361-6382/abe692)
- fewster-roman-2003-prd-doi: Null energy conditions in quantum field theory (https://doi.org/10.1103/PhysRevD.67.044003)
- santiago-schuster-visser-2021-210503079: Generic warp drives violate the null energy condition (https://arxiv.org/abs/2105.03079)
- natario-closer-look-2024-springer: A Closer Look at Natario's Zero-Expansion Warp Drive (https://link.springer.com/article/10.1007/s10773-024-05700-0)
- natario-closer-look-2025-arxiv2512: A Closer Look at Natario's Zero-Expansion Warp Drive (https://arxiv.org/abs/2512.19837)

## Research Backing (Non-Proof)
- stage1_centerline_alpha_0p7000_v1: pfenning-ford-1997-grqc9702026 [constraint_context] (https://arxiv.org/abs/gr-qc/9702026), fewster-roman-2003-prd-doi [constraint_context] (https://doi.org/10.1103/PhysRevD.67.044003), natario-closer-look-2024-springer [constraint_context] (https://link.springer.com/article/10.1007/s10773-024-05700-0)

## Research Limits
- These papers provide theory and constraint context; they are not experimental validation of the NHM2 profile outputs.
- Promotion remains repository-measured and gate-passing dependent.
- Per-profile citation roles are listed above in `Research Backing (Non-Proof)`.

## Claim Language By Profile
- For stage1_centerline_alpha_0p7000_v1, the run is not validated by the full NHM2 promotion stack and remains diagnostic only. Literature refs: pfenning-ford-1997-grqc9702026, fewster-roman-2003-prd-doi, natario-closer-look-2024-springer.

## Research-Backed Boundary Statements
- stage1_centerline_alpha_0p7000_v1: allowed=This profile is a diagnostic/literature-context result bounded by current NHM2 gates and evidence policy.; unsupported=experimental validation, engineering feasibility, theorem-level proof, promoted reduced-order transport; citations=pfenning-ford-1997-grqc9702026, fewster-roman-2003-prd-doi, natario-closer-look-2024-springer

## Why Blocked Now
- stage1_centerline_alpha_0p7000_v1: health=failed_timeout, raw=unavailable, normalized=fail, evidence=full_loop_unavailable, firstBlockingGate=baselineInvariance, firstBlockingReason=runtime_blocker:selected_transport_timeout, nextAction=Increase NHM2_SELECTED_TRANSPORT_TIMEOUT_S within cap and rerun controlled single-profile loop., stageDetail=all_stage_surfaces_available, freshness=timeout(selected_transport_timeout), topReason=full_loop_state_normalized:fail

## Operator Playbook
- If runHealth is `failed_stall`: inspect heartbeat and solver logs, then adjust `NHM2_STALL_MAX_NO_PROGRESS_S` / `NHM2_STALL_MIN_HEARTBEATS` only after confirming real progress is absent.
- If runHealth is `failed_timeout`: raise `NHM2_FULL_LOOP_TIMEOUT_S` only when heartbeat `lastProgressAt` keeps advancing.
- If runHealth is `healthy_fresh` but promotion is blocked: treat as physics/gate blocker (not runtime blocker) and remediate by firstBlockingGate.

## Citation-Backed Uncertainty
- stage1_centerline_alpha_0p7000_v1: category=runtime_blocker, blockers=baselineInvariance,clockingConsistency,antiSrSafety,decompositionConsistency,invariantGate,fullLoopAudit,evidenceLedger,selected_transport_timeout, nextMeasurement=Inspect heartbeat + full-loop logs, then rerun controlled single-profile loop.. Literature references provide theoretical context only; this is not experimental validation of this profile. Note: Literature context is non-proof and cannot replace fresh repository-measured full-loop evidence. Paper refs: pfenning-ford-1997-grqc9702026 (https://arxiv.org/abs/gr-qc/9702026), fewster-roman-2003-prd-doi (https://doi.org/10.1103/PhysRevD.67.044003), natario-closer-look-2024-springer (https://link.springer.com/article/10.1007/s10773-024-05700-0).

## Uncertainty Boundary
- Literature citations are interpretive context and do not replace repository-measured full-loop evidence.
- Experimental profiles in exploratory bracket remain diagnostic unless explicit override is provided and full gate stack remains passing.

