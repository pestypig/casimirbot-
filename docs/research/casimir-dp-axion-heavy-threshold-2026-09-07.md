Program gate: S1 — heavy-flavor matching and PDF input audit.
Workstream: Spin-two bottom threshold and complete PDF intake.
Capability or component: Leading threshold map and compatible data requirements.
Current maturity: Matching-rule diagnostic; PDF grid archived, not yet numerically validated.
Target maturity: Consistent common-scale quark/gluon matrix elements.
Required frozen inputs: Previous rounded-source diagnostic and primary threshold formulas.
Required evidence: Dual map, amplitude/momentum checks and declared PDF conventions.
Stop/fail criteria: No hand reassignment of residual heavy momentum; no downloaded grid treated as validated interpolation.
Explicit non-goals: Complete NLO matching, full PDF uncertainty or model admission.
Downstream gate unlocked: Authenticated grid interpolation and moment extraction; S1 stays open.

# Bottom threshold exposes an input-consistency requirement

[Hill and Solon, table 6](https://arxiv.org/html/1409.8290) gives the leading spin-two heavy-to-gluon coefficient proportional to alpha_s log(muQ/mQ)/(3 pi). At muQ=mQ that term vanishes. At this stated order, without intrinsic-heavy/power corrections, the Wilson matching matrix retains light-quark and gluon coefficients and removes the heavy-quark coefficient. Matrix elements obey the transpose map. The heavy momentum fraction is therefore zero at that matching point within this approximation.

This rule differs from simply moving a leftover heavy-quark momentum fraction into the gluon component. Such a move preserves the total momentum but generally changes the matched amplitude. The script tests the actual dual map using compatible synthetic inputs, explicitly distinguished from measured or fitted PDF data.

Evolving the previous rounded Z-scale moment table down with the previous one-loop coupling reference to a selected mb=4.18 GeV gives a residual bottom momentum fraction 0.0035151. The implemented leading threshold map rejects this input. This is not a claim that the published PDF set is wrong. Its rounded numbers, perturbative order, heavy-mass definitions and boundary conventions are not reproduced by the ad hoc evolution inputs. The residual alone cannot identify which difference is responsible or establish a physical intrinsic-bottom component.

Four checks pass: rejection of the incompatible rounded input, reconstruction of a compatible test input, threshold amplitude invariance and momentum conservation. Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-heavy-threshold-2026-09-07.py`. The compatibility tolerance is an implementation test, not a statistical PDF uncertainty criterion.

## Complete PDF set acquired for the next calculation

The next step uses a complete set and its metadata rather than forcing the rounded table through a different convention. The CERN [LHAPDF archive](https://lhapdfsets.web.cern.ch/current/) supplies CT14lo, documented by the [CT14 primary analysis](https://arxiv.org/abs/1506.07443). Its central member and metadata have been downloaded into `casimir-dp-axion-pdf-intake-2026-09-07/` beside this packet, with source URLs, byte counts and SHA-256 hashes in `manifest.json`.

The archived metadata specifies OrderQCD=0, a variable-flavor set with five flavors, HOPPET evolution, MCharm=1.3 GeV, MBottom=4.75 GeV, AlphaS_MZ=0.118, QMin=1.295 GeV and tabulated running-coupling values. In particular, its bottom parameter differs from the earlier 4.18 GeV diagnostic choice. The grid's own conventions must be used together; importing another heavy-quark mass silently would defeat the purpose of the intake.

The central grid contains 1,483,308 bytes. The hashes are:

- CT14lo.info: f8158114ae9527dd086326c72049f889e0e6d65142cce4249c257a8c0068777c
- CT14lo_0000.dat: 1358d9c6da6d720006adc6d1d75371446978b56a0fa635868014b6fb1b4dbffe

This is an input snapshot, not proof that our interpolation matches LHAPDF. The next calculation must inspect the lhagrid1 layout, integrate x-weighted densities with controlled interpolation/tails, check momentum and valence sums, and respect grid thresholds. The set has one member, so it does not itself provide a PDF error ensemble. It also does not cover Q=1 GeV; no extrapolation below QMin is admitted without a separate justified prescription.

A validated grid will improve the hadronic-input side but will not by itself authenticate the axion box Wilson boundary or provide all gluon hard-matching terms. Both are still required for the shared xenon/local prediction. Physics root/leaf documentation validation passes. Frozen apparatus and prior evidence remain unchanged; the goal stays active.
