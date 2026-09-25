Program gate: G1 — real calibrated solar baseline
Workstream: structural-observation source recovery
Capability or component: author-provided BiSON-13 sound-speed solution and averaging kernels
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; source identity and numerical format intake only
Required frozen inputs: Basu et al. (2009) Table 3, structural comparison method v1, received email and attachments
Required evidence: attachment bytes and hashes, numerical shape, Table 3 radius/error mapping, kernel normalization
Stop/fail criteria: source ambiguity, unmatched rows, malformed kernels, absent density/cross-term/reference inputs, unresolved systematic-error policy
Explicit non-goals: G1 source admission, solar-model execution, structural acceptance, G2 admission, public redistribution of author files
Downstream gate unlocked: none

# G1 author-provided BiSON-13 kernel intake — September 24, 2026

Status: **sound-speed source pair recovered and preliminarily validated; `BLOCK_SOURCE_BINDING` remains**.

Professor Sarbani Basu replied to the September 19 inquiry in Gmail message
`1a0d3c87e40fc54f` (thread `1a0baab29db8a967`) on September 24, 2026,
at 10:18 EDT. She supplied `cdif.txt` and `avker.BP04_B4752dRF` as simple
ASCII files. Her description says the first contains target radius, target
width, kernel center of gravity, three kernel quartiles, half the
interquartile width, solution and solution error; the second has one radius
column and 76 averaging-kernel columns. She expressed about 90% confidence
that the averaging-kernel file is the correct one. The raw files are retained
locally under the ignored `artifacts/research/g1-basu-author-intake-20260924/`
directory. No redistribution terms were stated, so the raw files are not
tracked in Git.

| File | Bytes | SHA-256 | Shape |
| --- | ---: | --- | --- |
| `cdif.txt` | 5,949 | `893d75b6c30729902ef169bdc08166cc600b212857e1ddcc025087cb59aff226` | 76 data rows × 9 columns |
| `avker.BP04_B4752dRF` | 2,914,379 | `027e2853299eee5aa34818149deb3a4bd51cf93c12fc5b2a525f14641fad344e` | 2,701 radial rows × 77 columns |

The [read-only validator](../../ops/mesa/g1-preparation-v1/validate-author-kernels.py)
finds a strictly descending kernel radius grid from `1.001225` to
`0.006695899`. Each of the 76 kernel columns integrates to within about
`8.9e-7` of unity over that grid. All 37 published Table 3 **sound-speed**
second-quartile radii align with alternating `cdif.txt` rows within the
table's `5e-5` rounding. The author-file solution errors divided by twice
the corresponding published relative sound-speed errors range from
`0.999949` to `1.000043`. This is strong evidence that the pair is the
BiSON-13 sound-speed `delta c^2/c^2` inversion product behind Table 3,
subject to the author's file-identity caveat. It does not establish the
matching density inversion or all response terms.
An additional numerical pair check recomputed all 76 kernel centers of gravity
and first, second and third quartiles from the kernel grid. Maximum absolute
differences from `cdif.txt` were `4.9e-5` in center of gravity and `6.0e-5`
in a quartile, consistent with the four-decimal summary columns. This makes
the association of the two emailed files substantially stronger while leaving
the missing response terms unresolved.

`Get-PSDrive C` showed `40,686,538,752` free bytes during this intake (about
40.7 GB decimal, 37.9 GiB). The Docker VHDX is on C:, so the frozen 25 GB
host-storage floor is currently met. The later launcher preflight measured
`40,649,834,496` free bytes and `2,054,361,088` available physical-memory
bytes; the frozen 4 GiB available-RAM floor was not met at that moment.
Capacity must be checked again immediately before any future execution.

## Remaining source work

The author pair does not provide a density averaging-kernel set, a
cross-term kernel or coefficient set, the exact BP04 structural reference
profile and radius mapping, or a complete systematic-error/correlation
policy. The source pair and paper must be reconciled into a versioned
comparison operator and validated against a known reference case before
structural acceptance can be frozen. The current structural-source manifest
therefore retains `comparisonOperator: null`, `launchAllowed: false` and
`admissionAllowed: false`. G1 and G2 stay open/blocked respectively.
