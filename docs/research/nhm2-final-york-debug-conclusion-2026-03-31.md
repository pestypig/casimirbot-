# NHM2 Final York Debug Conclusion (2026-03-31)

## Original problem

The original concern was that NHM2's York-time graphs looked wrong or unstable when compared against the Alcubierre-style fore/aft lobe expectations that often anchor warp-bubble intuition.

The suspected failure modes were:
- renderer mismatch
- geometry conversion mismatch
- solve mismatch
- viewer or convention mismatch
- hull-coupled Casimir mechanism handoff drift

What was investigated:
- source-to-timing-to-brick-to-snapshot-to-diagnostic authority closure
- Lane A render parity against the authoritative `theta=-trK` field
- primary-source paper comparison after observer, foliation, and sign alignment
- corrected fixed-scale and NASA Figure 1-style exports after the PNG-collapse bug was removed

The debugging question was not "is NHM2 physically feasible?" The question was "are the York graphs broken, or are they showing the real Lane A morphology of the current closed repo state?"

## Closed state

The final interpretation below is made only after the mechanism chain closed in [nhm2-solve-authority-audit-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-solve-authority-audit-latest.json):

- `sourceAuthorityClosed = true`
- `timingAuthorityClosed = true`
- `brickAuthorityClosed = true`
- `snapshotAuthorityClosed = true`
- `diagnosticAuthorityClosed = true`
- `mechanismChainReady = true`
- `mechanismClaimBlockReasons = []`

That matters because the later render and paper conclusions are not being drawn over an open provenance question. The repo is no longer asking whether the graph came from the wrong mechanism path. It is asking what the now-closed authoritative path actually implies.

## Render-debug conclusion

Under the authoritative Lane A diagnostic contract:
- Lane A is the only authoritative interpretation lane
- the current render verdict is `render_matches_authoritative_geometry`
- images are not primary evidence
- corrected fixed-scale export integrity is `valid = true`
- corrected visual metrics are computed from `pre_png_color_buffer`

Evidence anchors:
- [nhm2-york-render-debug-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-york-render-debug-latest.json)
- [nhm2-york-fixed-scale-comparison-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-york-fixed-scale-comparison-latest.json)

Answer to the renderer question:
- scoped answer: no, the renderer is not broken in the sense originally feared
- scoped meaning: the strange-looking York graphs are not explained by an open solve/provenance/render mismatch

The fixed-scale export bug did matter, but it was an export-integrity problem at the final PNG quantization stage, not a geometry/provenance failure. That bug is now corrected, and the corrected fixed-scale artifact still preserves the same morphological conclusion.

## Paper-comparison conclusion

The paper-comparison result is now stable across:
- convention alignment
- authoritative Lane A parity
- corrected fixed-scale export

Evidence anchors:
- [nhm2-york-paper-comparison-memo-2026-03-31.md](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\research\nhm2-york-paper-comparison-memo-2026-03-31.md)
- [nhm2-nasa-figure1-overlay-memo-2026-03-31.md](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\research\nhm2-nasa-figure1-overlay-memo-2026-03-31.md)
- [nhm2-york-fixed-scale-comparison-latest.json](c:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-york-fixed-scale-comparison-latest.json)

Key numeric evidence:
- NHM2 to Natario control distance: `0.0012469161139296696`
- NHM2 to Alcubierre control distance: `0.13559288214795065`
- corrected fixed-scale NHM2 vs Natario visual distance: `0.0003245026921436903`
- corrected fixed-scale NHM2 vs Alcubierre visual distance: `0.0007036011734714586`
- corrected NHM2 to Figure 1 class pixel RMS: `0.0008191196517368534`
- `is_nhm2_close_to_nasa_fig1 = no`

Final scientific comparison statement:
- NHM2 is closer to a Natario-like low-expansion comparison class
- NHM2 is not close to the Alcubierre or NASA Figure 1 morphology class
- this result holds after observer, foliation, and sign alignment
- this result also holds after the corrected fixed-scale export replaced the earlier collapsed PNG path

## Final conclusion

Under the repo's authoritative Lane A diagnostic contract, NHM2's York-time renders are faithful to the closed mechanism chain and do not reproduce the Alcubierre or NASA Figure 1 fore/aft lobe class. After observer, foliation, and sign alignment, NHM2 compares instead as a Natario-like low-expansion morphology. This is a repo-local diagnostic conclusion, not a proof of physical feasibility or exact metric identity.

## Supported now

- repo-local mechanism-chain closure
- authoritative Lane A render fidelity
- corrected fixed-scale export integrity
- NHM2 compares as Natario-like low-expansion under aligned conventions
- NHM2 does not reproduce the Alcubierre or NASA Figure 1 class

## Not supported now

- physical feasibility proof
- exact Natario identity
- exact Alcubierre or NASA reproduction
- full external benchmark closure

## Why the graphs looked wrong

The graphs looked unfamiliar because NHM2 does not land in the Alcubierre signed fore/aft lobe class that many readers implicitly expect.

More directly:
- the early graphs did not look like Alcubierre because the underlying NHM2 Lane A morphology is not Alcubierre-like
- the default proof-pack display policy compressed part of the visible contrast
- the corrected fixed-scale comparison shows that contrast more honestly
- the remaining mismatch is a real morphology difference, not renderer noise

So the right answer to the human debugging question is:
- the strange graphs were not random output
- they were the real Lane A morphology, seen through a display policy that initially hid part of the contrast

## Next steps

### 1. Publication hardening

- tighten wording around Lane A only
- turn the current result into a short methods/results summary
- remove any lingering language that implies Alcubierre-style reproduction

Recommendation:
- publication hardening first

### 2. Parameter sweep or redesign

- search whether any admissible NHM2 regime can produce Alcubierre-like signed lobes
- treat that as a new model-design job, not as viewer debugging

That branch should start from the now-frozen conclusion above rather than reopening the render/provenance investigation.
