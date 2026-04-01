# NHM2 York Debug Summary

## Final answer

The York graphs are not broken in the original sense that motivated the debug effort.

Current closed-state answer:
- authoritative lane: `lane_a_eulerian_comoving_theta_minus_trk`
- `mechanismChainReady = true`
- render verdict: `render_matches_authoritative_geometry`
- fixed-scale export integrity: `valid = true`
- visual metric source stage: `pre_png_color_buffer`
- morphology class: `Natario-like low-expansion`
- NASA Figure 1 closeness: `no`

## What was ruled out

- source/provenance failure
- timing authority drift
- brick handoff drift
- snapshot authority split
- diagnostic semantic ambiguity
- fixed-scale PNG-collapse as the explanation for the final conclusion

## What the evidence supports

- Lane A faithfully represents the closed mechanism chain
- NHM2 is much closer to the Natario-like low-expansion control than to the Alcubierre control
- NHM2 does not reproduce the Alcubierre or NASA Figure 1 fore/aft lobe class

Key numbers:
- proof-pack distance to Natario control: `0.0012469161139296696`
- proof-pack distance to Alcubierre control: `0.13559288214795065`
- corrected fixed-scale NHM2 vs Natario pixel RMS: `0.0003245026921436903`
- corrected fixed-scale NHM2 vs Alcubierre pixel RMS: `0.0007036011734714586`
- corrected NHM2 to Figure 1 class pixel RMS: `0.0008191196517368534`

## Claim boundary

Supported:
- repo-local mechanism-chain closure
- authoritative Lane A render fidelity
- Natario-like low-expansion comparison result
- non-reproduction of the Alcubierre or NASA Figure 1 class

Not supported:
- physical feasibility proof
- exact Natario identity
- exact Alcubierre or NASA reproduction

## Why the graphs looked suspicious

They looked suspicious because:
- NHM2 is not in the Alcubierre-style signed fore/aft lobe family
- the default display policy compressed some of the visible contrast
- the corrected fixed-scale exporter now shows that difference without the old PNG-collapse bug

So the final repo-local interpretation is:
- weird-looking graphs were not evidence of renderer failure
- they were evidence that NHM2's Lane A morphology differs from the Alcubierre expectation class

## Primary references

- [nhm2-final-york-debug-conclusion-2026-03-31.md](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\research\nhm2-final-york-debug-conclusion-2026-03-31.md)
- [nhm2-york-render-debug-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-york-render-debug-latest.json)
- [nhm2-york-fixed-scale-comparison-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-york-fixed-scale-comparison-latest.json)
- [nhm2-solve-authority-audit-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-solve-authority-audit-latest.json)
