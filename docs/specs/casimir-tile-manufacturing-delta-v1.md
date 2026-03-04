# Casimir Tile Manufacturing Delta v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Convert manufacturing novelty into measurable deltas against standard foundry capability with deterministic validation and falsification rules.

## Row Schema
- `requirement_id`
- `standard_foundry_capability`
- `requested_target`
- `physical_reason`
- `validation_test`
- `acceptance_criterion`
- `falsifier`
- `risk_owner`
- `status`
- `commit_pin`

## Delta Matrix

| requirement_id | standard_foundry_capability | requested_target | physical_reason | validation_test | acceptance_criterion | falsifier | risk_owner | status | commit_pin |
|---|---|---|---|---|---|---|---|---|---|
| CT-MD-001 | Sub-200 nm films/gaps possible with process variation | 80-150 nm controlled cavity gap with lot-level uniformity bounds | Casimir force sensitivity scales strongly with gap; drift invalidates inference | Wafer map of gap mean/sigma + lot SPC | All dies remain within declared gap band and sigma threshold | Any die class outside band or unresolved drift | process integration | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
| CT-MD-002 | Wafer bow/tilt controlled for generic MEMS | Cavity parallelism/flatness at declared tilt/roughness limits for force extraction | Non-parallelism biases force-gap mapping | Optical flatness + AFM roughness + tilt metrology | Flatness/tilt/roughness all within contract limits | Any geometric metric exceeds threshold | metrology lead | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
| CT-MD-003 | Basic electrostatic control available | Patch-potential RMS control and mapped compensation workflow | Patch forces can mask Casimir signal | KPFM map + electrostatic null sweep | Patch RMS below contract limit and compensation residual within band | Residual electrostatic term exceeds allowance | device physics | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
| CT-MD-004 | Standard release processes with stiction risk | Stiction/pull-in resilient architecture for selected span and thickness | Collapse risk dominates thin membranes at small gaps | Release-yield + pull-in stress test | No collapse under qualification load cases; yield meets lot target | Pull-in/collapse in qualified operating band | mechanical lead | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
| CT-MD-005 | Wafer-level package options vary in hermetic performance | Vacuum-retention package with declared leak-rate target | Pressure drift changes damping/noise and long-term behavior | Leak test + aging soak + getter performance checks | Leak and retention metrics satisfy contract over aging window | Leak/retention drift beyond threshold | packaging lead | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
| CT-MD-006 | Release and clean steps can leave residues | Contamination-controlled release with post-release cleanliness limits | Residues alter electrostatics and mechanical behavior | Surface contamination assay + witness coupon checks | Contamination metrics under limit for all qualified lots | Out-of-spec contamination with unresolved root cause | yield engineering | planned | 83ad2276e89f6766b863d0b10ab7a09d569585da |
