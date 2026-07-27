# Research Documents

This folder is for research-grade documents: papers, cited memos, equation
maps, claim-boundary documents, and sidecar manifests that support research
workflows.

## Canonical NHM2 Paper

The current maintained NHM2 whitepaper is:

- `nhm2-current-status-whitepaper.md`

Its Calculator/equation sidecars are:

- `nhm2-current-status-whitepaper.equation-actions.json`
- `nhm2-current-status-whitepaper.equation-actions.source.json`

Keep those files together. Do not split sidecars away from the paper they
hydrate.

This bundle is also registered in `../doc-taxonomy.v1.json` as
`bundleKind: "equation-action-whitepaper"`. Future Calculator-ready papers
should use the same bundle kind and list their sidecars there.

## Canonical Casimir / DP Study

The separated-lane Casimir, Diósi–Penrose, and quantum-foam study is:

- `casimir-dp-quantum-foam-study.md`

Its Calculator/equation sidecars are:

- `casimir-dp-quantum-foam-study.equation-actions.json`
- `casimir-dp-quantum-foam-study.equation-actions.source.json`

Its runnable config and runner are:

- `../../configs/research/casimir-dp-quantum-foam-study.v1.json`
- `../../scripts/research/run-casimir-dp-quantum-foam-study.ts`

Its role-separated experiment-design campaign is:

- `casimir-dp-experiment-design-report.md`
- `../../configs/research/casimir-dp-experiment-design.v1.json`
- `../../scripts/research/run-casimir-dp-experiment-design.ts`
- `../../shared/contracts/casimir-dp-experiment-design.v1.ts`

The design report is diagnostic: its engineering index separates apparatus
roles and does not select a physics winner or compute a manifold-response rate.

The next five gated computation lanes are maintained in:

- `casimir-dp-next-computations-report.md`
- `../../configs/research/casimir-dp-next-computations.v1.json`
- `../../scripts/research/run-casimir-dp-next-computations.ts`
- `../../shared/casimir-lifshitz.ts`
- `../../shared/casimir-dp-inference.ts`
- `../../shared/contracts/casimir-dp-next-computations.v1.ts`

This Stage-1 campaign validates reduced-order numerics and exposes statistical
inaccessibility. It does not close measured-material, finite-geometry,
collapse-identifiability, or manifold-response gates.

The data-readiness campaign is maintained in:

- `casimir-dp-data-readiness-report.md`
- `../../configs/research/casimir-dp-data-readiness.v1.json`
- `../../scripts/research/run-casimir-dp-data-readiness.ts`
- `../../shared/casimir-optical-response.ts`
- `../../shared/casimir-dp-data-readiness.ts`
- `../../shared/contracts/casimir-dp-data-readiness.v1.ts`

It validates hash, calibration, covariance, Kramers-Kronig, blinding, and
secondary-channel power plumbing with synthetic fixtures. Measured evidence,
collapse identification, and manifold-response claims remain blocked.

The proposal-closure package is maintained in:

- `casimir-dp-experiment-proposal.md`
- `casimir-dp-proposal-closure-report.md`
- `../../configs/research/casimir-dp-proposal-closure.v1.json`
- `../../scripts/research/run-casimir-dp-proposal-closure.ts`
- `../../shared/casimir-dp-proposal-readiness.ts`
- `../../shared/contracts/casimir-dp-proposal-closure.v1.ts`

It freezes the transverse-branch, sample-and-hold architecture, twelve-family
systematics matrix, dependency-ordered commissioning ladder, powered blinded
run, and outcome language. Proposal completeness passes, but hardware entry is
conditional and physical evidence gates remain open.

The immutable Stage-3 evidence map is maintained in:

- `casimir-dp-evidence-map-stage3-report.md`
- `casimir-dp-evidence-map-stage3-verification-receipt.json`
- `../../configs/research/casimir-dp-evidence-map-stage3.v1.json`
- `../../configs/research/casimir-dp-stage3-authorities.v1.json`
- `../../scripts/research/run-casimir-dp-evidence-map-stage3.ts`
- `../../shared/contracts/casimir-dp-evidence-map-stage3.v1.ts`

Stage 3 is frozen upstream evidence. Downstream campaigns must validate its
registered hashes and may not silently revise its model, fixture, or
certificate authorities.

The Stage-4 polarization, thermal, and congruence campaign is maintained in:

- `casimir-dp-polarization-congruence-stage4-report.md`
- `casimir-dp-polarization-congruence-stage4-verification-receipt.json`
- `../../configs/research/casimir-dp-polarization-congruence-stage4.v1.json`
- `../../configs/research/casimir-dp-stage4-authorities.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-polarization.synthetic.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-thermal.synthetic.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-congruence.synthetic.v1.json`
- `../../scripts/research/run-casimir-dp-polarization-congruence-stage4.ts`
- `../../scripts/research/export-casimir-dp-stage4-verification-trace.ts`
- `../../shared/casimir-dp-polarization-qed-control.ts`
- `../../shared/casimir-dp-radiative-thermal-closure.ts`
- `../../shared/casimir-dp-tensor-dimensional-congruence.ts`
- `../../shared/casimir-dp-polarization-congruence-stage4.ts`
- `../../shared/contracts/casimir-dp-polarization-congruence-stage4.v1.ts`

Stage 4 is a synthetic prediction and falsifier playground. It expands the
ordinary-physics null with polarization-resolved macroscopic QED and
thermal/FDT controls, reuses the named DP model without mutation, and excludes
numeric bridge claims unless a separately registered transfer kernel exists.
It does not promote synthetic output to measured collapse, gravity, or
manifold evidence.

Current immutable authority: run
`casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z`, config
SHA-256
`ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7`,
campaign receipt
`185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`.
The current blinding lane is `synthetic_contract_only`: the passing contract
records that no custodian receipt, mapping, measured comparison, or unblinding
exists or is authorized. It is not an executed physical blind. The downstream
verification receipt has SHA-256
`721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440`;
it binds the fresh adapter trace and 27-file/301-test combined replay without
promoting any scientific gate.

The downstream Stage-4.1 QED scale-hierarchy calibration is maintained in:

- `casimir-dp-qed-scale-hierarchy-stage4-1-report.md`
- `casimir-dp-qed-scale-hierarchy-stage4-1-verification-receipt.json`
- `../../configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json`
- `../../configs/research/casimir-dp-stage4-1-authorities.v1.json`
- `../../configs/research/fixtures/casimir-dp-qed-scale-hierarchy.codata2022.v1.json`
- `../../scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts`
- `../../shared/casimir-dp-qed-scale-hierarchy-calibration.ts`
- `../../shared/contracts/casimir-dp-qed-scale-hierarchy-stage4-1.v1.ts`

Stage 4.1 hash-validates Stage 4 as immutable upstream authority, then checks
full/reduced Compton and cyclic/angular conventions; the
\(\alpha_{\rm fs}\), \(a_0\), \(r_e\), \(R_\infty\), Rydberg, and Hartree
hierarchy; CODATA uncertainty/covariance handling; and the leading
reduced-mass hydrogen boundary with an explicit correction ledger. Its maximum
claim is `qed_scale_identity_calibration`. It does not treat
\(\alpha_{\rm fs}\) as an emission probability or the Compton frequency as a
physical oscillator/clock, and it supplies no Casimir, DP, collapse, manifold,
resonance, or transfer-kernel evidence.

The authoritative run is
`casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z`, config
SHA-256
`e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478`,
campaign receipt
`d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`,
and downstream verification receipt
`a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db`.
The fresh adapter execution passes with certificate integrity `true`; its
32-file/328-test replay and `GREEN` certificate cover repository software
metrics only. Scientific scope is `none`, and measured, precision-spectroscopy,
transfer, collapse, manifold, and physical-viability gates remain unchanged.

The implemented Stage-4.2A electron-mass/Higgs-Yukawa diagnostic campaign is
specified in
`casimir-dp-electron-mass-higgs-anchor-stage4-2a-plan.md`. It reconstructs a
published Penning-trap/bound-electron mass result, audits overlap with CODATA,
infers the conditional tree-level electron Yukawa parameter, and keeps the
direct CERN \(H\rightarrow e^+e^-\) upper-bound lane separate. Its two
source-backed runtimes, fixtures, focused tests, campaign/report receipt path,
and live non-promotable Theory Badges are implemented. They supply no
independent electron-Yukawa observation, calculator payload, observable
bridge, Casimir/DP transfer, collapse identification, or manifold dynamics.

The implemented Stage-4.2B apparatus-coupled residual campaign is maintained
in:

- `casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md`
- `casimir-dp-apparatus-coherence-residual-stage4-2b-report.md`
- `../../configs/research/casimir-dp-stage4-2b-authorities.v1.json`
- `../../configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json`
- `../../scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
- `../../shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts`
- `../../shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts`
- `../../shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts`
- `../../shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts`
- `../../shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts`
- `../../shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
- `../../shared/casimir-dp-apparatus-identifiability-stage4-2b.ts`

Run it with:

```text
npx tsx scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts --config configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json --report-doc docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md
```

Stage 4.2B keeps registered-DP mass/separation/hold-time scaling orthogonal to
the complete-joint-system-equivalence boundary contrast, separates physical
disturbance from sensor self-noise, propagates response-corrected thermometry
and full covariance, and scores the ordinary and named-DP signatures in one
frozen raw-complex observable space. Its 216 primary cells, 30 controls, 216
pilot templates, and 216 independent-replication templates are design
contracts, not measured data.

The sole authoritative run is
`casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z`.
Campaign/content integrity passes; A–E pass; F blocks as
`signature_not_identifiable`. The physical signature matrix has rank 7,
maximum absolute whitened cosine `0.9999771044199663`, and normalized Gram
condition number `179103.91134865975`. Because the frozen controls do not yet
have source-backed numerical response vectors plus block covariance, required
windows and power are `not_estimable_until_identifiable`; no DP region is
excluded.

Immutable report JSON/Markdown, 42-record/NUL-free trace, and campaign-receipt
SHA-256 values are
`2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`,
`e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`,
`727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`,
and
`50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`.
All 19 fixtures execute and the focused Stage-4.2B suite passes 84/84 tests.
The live badge
`study.casimir_dp.apparatus_coherence_residual_stage4_2b` is diagnostic,
non-promotable, and has zero calculator payloads and zero observable-bridge
edges. Fresh adapter run `2325` returns `PASS`, first failure null,
deltas empty, and integrity `OK`; validated one-record trace SHA-256 is
`3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd`
and downstream verification-receipt SHA-256 is
`194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`.
This replaces the pending software-verification standing without reusing an
earlier trace or certificate artifact. Its scientific scope is `none`.
Measured evidence stays `not_ready`, collapse and manifold
identification stay `blocked`, and physical viability stays `not_evaluated`.
The synchronized paper layer contains 41 equation markers, 41 source actions,
and 41 generated actions; the study graph contains 27 badges and 79 edges; the
math-stage registry contains 213 entries.

The implemented Stage-4.2A runtime sources are:

- `../../shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts`
- `../../shared/casimir-dp-planck-solar-calibration-stage4-2a.ts`

Fresh run
`casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z`
produced JSON/Markdown report hashes
`a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d` and
`d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a`;
its campaign-receipt SHA-256 is
`592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3`.
Fresh adapter run `2324` passes with certificate integrity `true`; downstream
verification-receipt SHA-256
`debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a`
binds the 25-file/260-test replay. Its scientific scope is `none`. The second runtime treats
Penning \(m_e\rightarrow m_ec^2\rightarrow\) Compton/Rydberg and
Planck-spectrum \(\rightarrow\) Stefan-Boltzmann \(\rightarrow\) distinct TSIS
coarse frozen-window Wien color diagnostic and IAU bolometric/nominal
effective-temperature as calibrated branches, not one causal mechanism. The
coarse TSIS result is not a full response/covariance-aware spectral fit, so
measured spectral-fit significance remains `not_ready`. Its final
\(E_G[\Delta\rho;r_0]/\hbar\) DP target remains an independent preregistered
measurement/scaling test. Common constants and dimensional closure can validate
the software and provenance only.

The conditional evidence order is Level 1, a replicated held-out
objective-collapse candidate only after ordinary-decoherence closure,
discrimination against registered remaining unitary/environmental models, and
a frozen nonunitary dynamical signature; Level 2, preregistered DP
mass/branch/separation/hold-time scaling; and Level 3, a fixed-branch
boundary-sensitive residual matching a frozen kernel. No level has measured
authority today. Cosmology and Planck-unit implications remain a future
counterfactual architecture that must inherit laboratory-fixed parameters
without retuning; those cosmological applications supply no separate runtime,
receipt, live badge, dark-energy claim, or Planck-scale-access claim.

Reproduce the frozen Stage-4 baseline first:

```bash
npx tsx scripts/research/run-casimir-dp-polarization-congruence-stage4.ts --config configs/research/casimir-dp-polarization-congruence-stage4.v1.json --report-doc docs/research/casimir-dp-polarization-congruence-stage4-report.md
```

Then run the downstream Stage-4.1 calibration with:

```bash
npx tsx scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts --config configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json --report-doc docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md
```

Then run the implemented Stage-4.2A source-backed diagnostic campaign with:

```bash
npm run casimir:dp:stage4-2a
```

This command writes a fresh content-addressed run and refreshes the maintained
Stage-4.2A report. Its successful software/calibration gates do not close the
separate measured DP, collapse-identification, manifold-dynamics, or physical-
viability gates.

To explore Stage-4 synthetic predictions, edit copies of its three synthetic
fixtures; keep
`evidence_class=synthetic_fixture`, recompute their SHA-256 entries in a copied
campaign config, and write to a fresh output directory. The runner rejects
relabeling, stale hashes, tracking mismatches, nested subgate failures, and
pre-existing output directories.

The Stage-4.1 CODATA fixture is instead a source-backed calibration input. Do
not relabel it as a synthetic prediction or measured evidence; use a copied
config and fresh output directory for sensitivity studies, preserving the
calibration-only claim ceiling.

Use `study-full-solve-template.md` when starting another whitepaper-backed,
artifact-producing study.

## Boundary

Generated research-style notes that are useful but not canonical should move to
`../synthetic-research/` once their references and links have been checked.
Historical implementation notes should move to `../legacy-development/`, not
this folder.
