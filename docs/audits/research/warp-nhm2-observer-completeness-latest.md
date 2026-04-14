# NHM2 Observer Completeness Decision (2026-04-12)

## Decision

Metric-required NHM2 observer completeness is not admitted for closure as of April 12, 2026.

Keep:
- `observerMetricCompletenessStatus = incomplete_missing_inputs`
- `observerMetricCoverageBlockerStatus = producer_not_emitted`
- `observerMetricFirstMissingStage = metric_tensor_emission`
- `observerNextTechnicalAction = emit_same_chart_metric_flux_and_shear_terms`
- `observerLeadReadinessWorkstream = observer_completeness_and_authority`

The NHM2 tile-`WEC` pause remains in effect. This memo does not reopen tile remediation.

## Coverage Trace

### Missing family: `metric_t0i_missing`

- Current producer file and function: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:1048` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:1093`
- Current runtime tensor reference: `warp.metricStressEnergy` with fallback `warp.stressEnergyTensor`
- Current chart/basis: same emitted metric-required chart/basis used for the current metric `T00` surface
- Data already exists upstream: no published `T0i` family was found on the current metric observer path
- First stage where it disappears: metric tensor emission
- Classification: `producer_not_emitted`
- Why: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:649` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:652` define only `T00`, `T11`, `T22`, and `T33`; `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:4820` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:4950` then marks `T0i` as missing and assumes zero flux.

### Missing family: `metric_tij_off_diagonal_missing`

- Current producer file and function: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:1048` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:1093`
- Current runtime tensor reference: `warp.metricStressEnergy` with fallback `warp.stressEnergyTensor`
- Current chart/basis: same emitted metric-required chart/basis used for the current metric `T00` surface
- Data already exists upstream: no published off-diagonal `Tij` family was found on the current metric observer path
- First stage where it disappears: metric tensor emission
- Classification: `producer_not_emitted`
- Why: the emitted metric tensor shape is diagonal-only in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:649` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:652`; `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:4838` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:4842` explicitly state that off-diagonal shear terms were unavailable.

## Cross-Checks

- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-source-closure.v1.ts:4` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-source-closure.v1.ts:9` constrain source-closure tensors to `T00`, `T11`, `T22`, and `T33`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:765` through `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts:770` only expose diagonal `metricStressEnergy` components to the pipeline state.
- No consumer-only or publication-only drop was found in the current NHM2 observer path.

## Admission Result

A truthful closure path was not admitted.

Closing the completeness gap would require new same-chart metric tensor emission semantics, not consumer wiring, publication wiring, or proxy substitution.

## Next Technical Action

Emit same-chart metric `T0i` flux terms and off-diagonal spatial `Tij` shear terms on the metric-required observer path, then rerun the NHM2 observer audit without assumed-zero stand-ins.

Do not:
- treat missing terms as zero for completion claims
- substitute tile proxy channels for metric-required tensor components
- reopen tile-`WEC` remediation in the same workstream

## Non-Goals

This patch does not:
- change production physics values
- reopen NHM2 tile-`WEC` remediation
- change source-closure policy
- implement certificate policy or certificate issuance
- widen claim tier
