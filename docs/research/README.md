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

The implemented Stage-4.2C identifiability-first redesign campaign is
maintained in:

- `casimir-dp-identifiability-redesign-stage4-2c-plan.md`
- `casimir-dp-identifiability-redesign-stage4-2c-report.md`
- `casimir-dp-identifiability-redesign-stage4-2c-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2c-authorities.v1.json`
- `../../configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1.ts`
- `../../shared/casimir-dp-control-response-stage4-2c.ts`
- `../../shared/casimir-dp-apparatus-redesign-stage4-2c.ts`
- `../../shared/casimir-dp-acquisition-packets-stage4-2c.ts`
- `../../scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts`

Run it only with the immutable Stage-4.2B authority tuple present:

```text
npx tsx scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts --config configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json --report-doc docs/research/casimir-dp-identifiability-redesign-stage4-2c-report.md
```

The authoritative synthetic run is
`casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z`.
It recovers the Stage-4.2B no-go, compiles numerical design-assumption response
vectors and block covariance for 30 controls, and searches a frozen bounded
candidate catalogue through the unchanged registered DP generator. The
selected silica candidate clears the preregistered design gates with maximum
whitened cosine `0.7177243227022941`, normalized Gram condition
`6.531693613125537`, forecast power `0.9978580863455258`, and 542 required
paired windows. All 16 fixtures and the initial 22 focused tests pass.

That result is not physical pilot readiness. Measured control response,
measured covariance, and an authentic state-preparation receipt remain absent;
the calibration, pilot, confirmatory, and independent-replication outputs are
packet schemas only. The Stage-4.2C badge is diagnostic, non-promotable, and
has no calculator payload or observable bridge. The synchronized paper layer
now contains 45 equation markers/actions; the study graph contains 28 badges
and 83 edges; the math-stage registry contains 216 validated entries. Fresh
adapter run `2332` is `PASS` with integrity `OK`, validated trace
`3d454ba0cf3e778dc934cae1c0ee33996bb792caa06255a9dfe984a38138bdee`,
and downstream receipt
`51c461db1fdaa29162b2c5287a31c01823e5bb23b16a25fe2914841239abba98`.
Its scientific scope is `none`. Measured evidence
and physical pilot readiness remain `not_ready`, collapse and manifold
identification remain `blocked`, and physical viability remains
`not_evaluated`.

The implemented Stage-4.2D cross-scale recovery and field-metrology campaign
is maintained in:

- `casimir-dp-cross-scale-metrology-stage4-2d-plan.md`
- `casimir-dp-cross-scale-metrology-stage4-2d-report.md`
- `casimir-dp-cross-scale-metrology-stage4-2d-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2d-authorities.v1.json`
- `../../configs/research/casimir-dp-cross-scale-metrology-stage4-2d.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2d-cross-scale.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1.ts`
- `../../shared/casimir-dp-cross-scale-metrology-stage4-2d.ts`
- `../../scripts/research/run-casimir-dp-cross-scale-metrology-stage4-2d.ts`

Run it only with the immutable Stage-4.2C authority tuple present:

```text
npm run casimir:dp:stage4-2d
```

The authoritative synthetic run is
`casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z`.
It passes 10/10 fixtures, recovers sourced Stark/Zeeman/blackbody field
responses and conventional compactness/material-yield/Jeans limits, rejects
spinor-as-mass semantics, leaves the registered DP generator unchanged, and
adds zero observable bridge edges. These are calibration and recovery
diagnostics only. Measured spectroscopic response, a witness-to-coherence
transfer, physical pilot readiness, and measured evidence remain `not_ready`;
collapse and manifold identification remain `blocked`; physical viability
remains `not_evaluated`.

Fresh adapter run `2338` is `PASS` with no first failure, no deltas, and
certificate integrity `OK`. The exclusive validated trace SHA-256 is
`bb4f53cf48f7cf0726822e53dbacd369485c638636df1e6f5078027d36f91d38`;
the downstream verification-receipt SHA-256 is
`d96430684379dd5408d8099ae49a05ca0eaf4042a0ea64b09e23d0a4156a0556`.
The certificate verifies repository convergence only and has scientific scope
`none`.

The implemented Stage-4.2E causal-cone and clock-congruence campaign is
maintained in:

- `casimir-dp-causal-cone-clock-stage4-2e-plan.md`
- `casimir-dp-causal-cone-clock-stage4-2e-report.md`
- `casimir-dp-causal-cone-clock-stage4-2e-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2e-authorities.v1.json`
- `../../configs/research/casimir-dp-causal-cone-clock-stage4-2e.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2e-causal-cone.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-causal-cone-clock-stage4-2e.v1.ts`
- `../../shared/casimir-dp-causal-cone-clock-stage4-2e.ts`
- `../../scripts/research/run-casimir-dp-causal-cone-clock-stage4-2e.ts`

Run it only with the immutable Stage-4.2D authority tuple present:

```text
npm run casimir:dp:stage4-2e
```

The authoritative synthetic run is
`casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z`.
It passes 10/10 fixtures, recovers ADM local-null and timelike-clock
kinematics, reproduces radial Schwarzschild null propagation, and separates an
ideal Casimir semiclassical-curvature screen from the QED
effective-propagation control. It leaves standard mass-density DP boundary
independent and adds zero observable bridge edges. These are causal-recovery
and scale-separation diagnostics only. Complete-apparatus metric response,
measured timing and coherence evidence, and physical pilot readiness remain
`not_ready`; collapse and manifold identification remain `blocked`; physical
viability remains `not_evaluated`.

Fresh adapter run `2346` is `PASS` with no first failure, no deltas, and
certificate integrity `OK`. The exclusive validated trace SHA-256 is
`378c915329514f13bf4111f732217f9b9bf7d710adb50510c5ed8626928d8311`;
the downstream verification-receipt SHA-256 is
`b37bdbd1612912fc5c91fd51667559dc739018d43d9f57d7f182d76d1d3bbb1b`.
The certificate verifies repository convergence only and has scientific scope
`none`.

The implemented Stage-4.2F Maxwell/macroscopic-QED and exact-DP closure is
maintained in:

- `casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-plan.md`
- `casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-report.md`
- `casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2f-authorities.v1.json`
- `../../configs/research/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2f-maxwell-closure.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.v1.ts`
- `../../shared/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.ts`
- `../../scripts/research/run-casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.ts`

Run it only with the immutable Stage-4.2E authority tuple present:

```text
npm run casimir:dp:stage4-2f
```

The authoritative synthetic run is
`casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1-20260730T023000000Z`.
It passes 12/12 fixtures, recovers the covariant Maxwell, transverse
polarization, Green/FDT, and ideal-Casimir identities, freezes the exact named
regularized DP master model, separates the Stage-4.2C reference mass from the
strongest transported cell, and discloses that the companion SNR is synthetic.
It also finds that the inherited heating signal matches neither Stage-4.2C
mass identity, so companion model identity remains `not_ready`.
The inherited NHM2 Maxwell-stress contract is method-only: all 11 apparatus
evidence checks correctly remain blocked. Finite-geometry fields, measured
material response, detector authority, state preparation, modulation,
complete stress-energy, and measured evidence remain `not_ready`; collapse
and manifold identification remain `blocked`; physical viability remains
`not_evaluated`. The campaign adds zero observable bridge edges.

Fresh explicit-endpoint adapter run `2348` is `PASS` with no first failure,
no deltas, and certificate integrity `OK`. Its certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
the exclusive validated trace SHA-256 is
`13ea52a95383b5e2f6cb80322a4321ad28dbc52bf5533a5771386fc6fbc0f0c8`;
and the downstream verification-receipt SHA-256 is
`f1b8219b7c74bc25db9cc3137aeec97b714bfc3193052a94e3929326eb858f73`.
The certificate verifies repository convergence only and has scientific scope
`none`.

The implemented Stage-4.2G empirical-feasibility handoff is maintained in:

- `casimir-dp-empirical-feasibility-pilot-stage4-2g-plan.md`
- `casimir-dp-empirical-feasibility-pilot-stage4-2g-report.md`
- `casimir-dp-empirical-feasibility-pilot-stage4-2g-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2g-authorities.v1.json`
- `../../configs/research/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2g-pilot-unacquired.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2g-pilot-synthetic-validation.v1.json`
- `../../shared/contracts/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1.ts`
- `../../shared/casimir-dp-empirical-feasibility-pilot-stage4-2g.ts`
- `../../scripts/research/run-casimir-dp-empirical-feasibility-pilot-stage4-2g.ts`

Run the canonical unacquired handoff only with the immutable Stage-4.2F
authority tuple present:

```text
npm run casimir:dp:stage4-2g
```

The authoritative run
`casimir-dp-empirical-feasibility-pilot-stage4-2g-v1-20260730T030000000Z`
freezes one silica apparatus and mass-density identity and derives from that
same identity \(\Gamma_{\rm DP}=0.02400420398374263\ {\rm s^{-1}}\),
\(V(0.25\,{\rm s})=0.9940169192982985\), and
\(\dot E_{\rm DP}=1.9297884642410306\times10^{-40}\ {\rm W}\). It specifies
13 acquisition products spanning finite-geometry Maxwell/macroscopic QED,
material response, preparation and branch metrology, modulation,
environmental response/covariance, companion detection, blinding/custody,
independent replication, and complete apparatus stress-energy. The registered
synthetic packet exercises ingestion and whitening software only. Until a
provenance-bound measured packet passes, measured evidence remains
`not_ready`, collapse and manifold identification remain `blocked`, physical
viability remains `not_evaluated`, and the campaign adds zero observable
Casimir-to-collapse bridges.

Fresh explicit-endpoint adapter run `2349` is `PASS` with no first failure,
no deltas, and certificate integrity `GREEN/true`. Its certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
the exclusive validated trace SHA-256 is
`cf4c1f72bbcd7cbac83694cd6d2d981cd0813070e461fbc9835712b1f42d3f53`;
and the downstream verification-receipt SHA-256 is
`3530465e24ef861bd84cbd258cff153e39823e4329e7461a216ef978e712821b`.
The certificate verifies repository convergence only and has scientific scope
`none`.

The implemented Stage-4.2H commissioning intake is maintained in:

- `casimir-dp-commissioning-intake-stage4-2h-plan.md`
- `casimir-dp-commissioning-intake-stage4-2h-report.md`
- `casimir-dp-commissioning-intake-stage4-2h-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2h-authorities.v1.json`
- `../../configs/research/casimir-dp-commissioning-intake-stage4-2h.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2h-commissioning-blank.v1.json`
- `../../shared/contracts/casimir-dp-commissioning-intake-stage4-2h.v1.ts`
- `../../shared/casimir-dp-commissioning-intake-stage4-2h.ts`
- `../../scripts/research/run-casimir-dp-commissioning-intake-stage4-2h.ts`

Run the canonical blank intake and synthetic dry run with:

```text
npm run casimir:dp:stage4-2h
```

The authoritative run
`casimir-dp-commissioning-intake-stage4-2h-v1-20260730T050000000Z`
freezes twelve instrument/computational roles, thirteen product slots, four
partitions, and twenty-eight raw columns. It successfully recompiles a
software-only synthetic dossier through the Stage-4.2G whitened gate, but
returns `no_go_until_provenance_bound_measured_dossier_passes`. Synthetic
calibrations, covariance, hashes, and custody have zero empirical authority.
Measured evidence remains `not_ready`, collapse/manifold remain `blocked`,
physical viability remains `not_evaluated`, and zero Casimir-to-collapse
bridges are added.

Fresh adapter run `2350` (`adapter:8c24aa23-edd5-4380-b071-24dc62613d88`)
passes with first failure `null`, empty deltas, certificate status `GREEN`, and
integrity `true`. The certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
the exclusive validated-trace SHA-256 is
`8d71d21a3f3eb4d2d386d53100bf07009ac65d29280eaf64dccbfde37ce03a13`;
and the downstream verification-receipt SHA-256 is
`acbab1f786e688fe04ad2d5cae15219166368e41b01b8df5949617ef150ce364`.
This is software/certificate verification, not empirical evidence.

The implemented Stage-4.2I boundary--branch interaction and wave-packet
custody campaign is maintained in:

- `casimir-dp-boundary-branch-interaction-stage4-2i-plan.md`
- `casimir-dp-boundary-branch-interaction-stage4-2i-report.md`
- `casimir-dp-boundary-branch-interaction-stage4-2i-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2i-authorities.v1.json`
- `../../configs/research/casimir-dp-boundary-branch-interaction-stage4-2i.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2i-factorial.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-boundary-branch-interaction-stage4-2i.v1.ts`
- `../../shared/casimir-dp-boundary-branch-interaction-stage4-2i.ts`
- `../../scripts/research/run-casimir-dp-boundary-branch-interaction-stage4-2i.ts`

Run the canonical synthetic recovery and adversarial campaign with:

```text
npm run casimir:dp:stage4-2i
```

The authoritative run
`casimir-dp-boundary-branch-interaction-stage4-2i-v1-20260805T160000000Z`
uses a frozen four-cell branch/boundary order and propagates the joint
observed/ordinary covariance into a normalized complex cross-ratio. Standard
boundary-independent DP cancels, the nominal corrected interaction is
consistent with zero, and an injected (0.002) loss plus (0.004\,\mathrm{rad})
phase interaction is recovered. Five adversarial cases fail closed as
registered. All cells and wave-packet data are synthetic: empirical packet
equivalence, ordinary response, and measured contrast remain `not_ready`; no
transfer kernel exists; collapse/manifold claims remain `blocked`; and
physical viability remains `not_evaluated`.

Fresh adapter run `2369` (`adapter:47f5ee16-a11c-4d8b-9953-dba211929f14`)
passes with first failure `null`, empty deltas, certificate status `GREEN`, and
integrity `true`. The certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
the exclusive validated-trace SHA-256 is
`97d3cfcc1be7c29946a300eba705fc245def0fc86b8e3d3c09c79a9f6f9dadaf`;
and the Stage-4.2I verification-receipt SHA-256 is
`67163dddefc4205c6c591a8a0bbd693453a8e398ba5309a8ecf8676fd6888bc9`.
This is repository/software certification with scientific scope `none`.

The implemented Stage-4.2J Schrödinger, mass-density, and environmental
screening campaign is maintained in:

- `casimir-dp-schrodinger-mass-density-stage4-2j-plan.md`
- `casimir-dp-schrodinger-mass-density-stage4-2j-report.md`
- `casimir-dp-schrodinger-mass-density-stage4-2j-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2j-authorities.v1.json`
- `../../configs/research/casimir-dp-schrodinger-mass-density-stage4-2j.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2j.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-schrodinger-mass-density-stage4-2j.v1.ts`
- `../../shared/casimir-dp-schrodinger-mass-density-stage4-2j.ts`
- `../../scripts/research/run-casimir-dp-schrodinger-mass-density-stage4-2j.ts`

Run its canonical synthetic and adversarial campaign with:

```text
npm run casimir:dp:stage4-2j
```

The authoritative run
`casimir-dp-schrodinger-mass-density-stage4-2j-v1-20260806T040000000Z`

## Stage-4.2K microscopic electromagnetic closure

- `casimir-dp-microscopic-em-closure-stage4-2k-plan.md`
- `casimir-dp-microscopic-em-closure-stage4-2k-report.md`
- `casimir-dp-microscopic-em-closure-stage4-2k-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2k-authorities.v1.json`
- `../../configs/research/casimir-dp-microscopic-em-closure-stage4-2k.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2k.synthetic.v1.json`
- `../../shared/contracts/casimir-dp-microscopic-em-closure-stage4-2k.v1.ts`
- `../../shared/casimir-dp-microscopic-em-closure-stage4-2k.ts`
- `../../scripts/research/run-casimir-dp-microscopic-em-closure-stage4-2k.ts`

Run:

```bash
npm run casimir:dp:stage4-2k
```

Authoritative synthetic run:
`casimir-dp-microscopic-em-closure-stage4-2k-v1-20260806T050000000Z`.
It recovers the ground-state/material-response chain and ideal-plane orientation
screen, but returns finite-geometry electromagnetic closure, QLBE environment,
and residual attribution as blocked. It adds zero Casimir-to-collapse bridge
edges and supplies no measured evidence.

## Stage-4.2L empirical-authority closure and redesign

- `casimir-dp-empirical-authority-stage4-2l-plan.md`
- `casimir-dp-empirical-authority-stage4-2l-report.md`
- `casimir-dp-empirical-authority-stage4-2l-verification-receipt.json`
- `../../configs/research/casimir-dp-stage4-2l-authorities.v1.json`
- `../../configs/research/casimir-dp-stage4-2l-apparatus-design-manifest.v1.json`
- `../../configs/research/casimir-dp-empirical-authority-stage4-2l.v1.json`
- `../../configs/research/fixtures/casimir-dp-stage4-2l.synthetic-authority.v1.json`
- `../../shared/contracts/casimir-dp-empirical-authority-stage4-2l.v1.ts`
- `../../shared/casimir-dp-empirical-authority-stage4-2l.ts`
- `../../scripts/research/run-casimir-dp-empirical-authority-stage4-2l.ts`

Run:

```bash
npm run casimir:dp:stage4-2l
```

Authoritative synthetic/literature-bound run:
`casimir-dp-empirical-authority-stage4-2l-v1-20260806T060000000Z`.
It freezes the engineering coordinate system, checks a finite-rectangle
electromagnetic surrogate, propagates the phase-response covariance, screens a
species-resolved isotropic QLBE proxy, compares state-preparation scales,
registers the current external Diósi bound, and evaluates four mass-density
representations. The nominal candidate returns
`redesign_required_before_empirical_pilot`; all as-built, measured-material,
measured-covariance, measured-environment, state-preparation, and exact-bound
authorities remain `not_ready`; and no Casimir-to-collapse bridge is added.
Fresh adapter run `2372` (`adapter:009256f1-e3a5-4214-a5d2-0b054f644d0f`)
is `PASS`, with first failure `null`, empty deltas, certificate status `GREEN`,
and integrity `true`. The certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and the exclusive identity-bound trace SHA-256 is
`42548212d9566413031bff64ddd73909a2a1383f62a05d3bd9dc17fb3c221957`.
The Stage-4.2L verification-receipt SHA-256 is
`7ff5ed544ec33fcd8022dd0f80cae5168a5486cc2f4414e14137806b46fdb19f`.
This is repository/software certification with scientific scope `none`.

## Stage-4.2M leading bounded commissioning design

Run `npm run casimir:dp:stage4-2m` to replay the deterministic bounded search
that consumes the Stage-4.2L verification receipt byte-for-byte. The 200-point
campaign returns three synthetic-only candidates. Candidate
`stage4_2m_candidate_002` is the current leading design represented in the
white paper and proposal. Its configuration
uses diamond density, radius 276.302 nm, mass
`3.0925052683774525e-16 kg`, 250 nm separation, 250 ms hold, 10 micrometre gap,
4 K, and `1e-15 Pa`. The registered Gaussian loss is 2.908%; the conservative
density-envelope loss is 0.434903%; it requires 1,028 paired windows, and its
transported power is 0.927386 at 1,600 paired windows.

The result is a commissioning target, not empirical feasibility. Measured
material, as-built finite geometry, phase covariance, QLBE inputs, preparation,
companion detection, and exact bound mapping remain open. The canonical report
is `docs/research/casimir-dp-apparatus-search-stage4-2m-report.md`; focused tests
run with `npm run test:casimir:dp:stage4-2m`.

The fresh leading-design publication-rebase adapter run `2374` is `PASS` with
certificate integrity `GREEN`; the
certificate SHA-256 is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and the exclusive trace SHA-256 is
`866eec434c58b84cc2fcb5df9bd6a4136fbb0c87d04532e89b9f90b3c5464998`.

## Stage-4.2N material/Green/FDT ordinary-null chain

Run `npx tsx scripts/research/run-casimir-dp-material-thermal-ordinary-null-stage4-2n.ts`
to replay the provenance-bound synthetic ordinary-response chain for leading
candidate `stage4_2m_candidate_002`. It converts the registered loss table to
imaginary-axis response, evaluates finite-geometry mean phase and two-sided
Green/FDT loss, recovers zero-coupling and infinite-distance limits, checks
Planck--Stefan--Boltzmann and detailed balance without double counting, replays
five calibration interventions, and emits the four-cell complex cross-ratio.

The software pipeline passes with phase `0.01999999999248688 rad`, echo
contraction exponent `1.3416495394050548e-6`, and a Planck--Stefan--Boltzmann
relative error of `1.3770845459661169e-14`. This is a synthetic recovery only.
Measured specimen response, as-built geometry, a full-Maxwell Green tensor,
independent solver agreement, measured calibration response, and measured
covariance remain `not_ready`; zero observable bridge edges are added. The
canonical report is
`docs/research/casimir-dp-material-thermal-ordinary-null-stage4-2n-report.md`.

## Stage-4.2O authenticated public-data component validation

Run `npm run casimir:dp:stage4-2o` to replay the compact, provenance-bound
public-data fixture. The source importer is
`scripts/research/import-casimir-dp-public-data-stage4-2o.py`; it authenticates
the external sodium-cluster, superconducting-drum, LISA Pathfinder, and Gran
Sasso source files and emits only a compact derived fixture, not the large
third-party archives.

The runtime recovers complex matter-wave fringes, paired boundary-response
features, held-out multichannel covariance/residual handling, and an external
Diósi-bound source record in four separate apparatus lanes. All component and
provenance gates pass. Cross-apparatus covariance fusion and shared-likelihood
construction are forbidden, the Stage-4.2M leading design is unchanged, and
`measured_evidence`, `joint_protocol_validation`, collapse identification, and
manifold dynamics remain closed. The canonical report is
`docs/research/casimir-dp-public-data-component-validation-stage4-2o-report.md`.

## Stage-4.2P ordinary proper-time/worldline closure

Run `npm run casimir:dp:stage4-2p` to bind the leading Stage-4.2M apparatus to
an explicit weak-field worldline and ordinary phase budget. The runtime
recovers the Minkowski, equal-worldline, coordinate-offset, symmetric-gradient,
and vertical \(mgdT/\hbar\) limits; propagates Earth gravity, gradients,
rotation, balanced local masses, kinematics, laboratory timing, control phase,
and the transported electromagnetic term; and applies a frequency-resolved
echo/path-swap screen.

For the nominal horizontal branch, the linear Earth-redshift term is zero. A
fully vertical 250 nm separation would instead accumulate
`1.7973596191631953e12 rad` over 250 ms. Under the declared synthetic
`1e-10 rad` tilt sigma and `1e-4` echo residual, the total ordinary phase sigma
is `0.01800650829491001 rad`, below the frozen `0.03464404998245921 rad`
limit. This is a narrow synthetic pass, not apparatus evidence. Measured
worldlines, local gravity and mass geometry, tilt spectra, echo transfer,
clock/control covariance, and internal-energy variance remain `not_ready`.
The frozen Diósi exponents are unchanged and zero collapse-bridge edges are
added. The canonical report is
`docs/research/casimir-dp-proper-time-worldline-closure-stage4-2p-report.md`.
Fresh adapter run `2380` (`adapter:f3cbd258-82d2-4965-8a19-329600427b6a`)
returns `PASS`, no first failure, empty deltas, certificate status `GREEN`,
integrity true, and certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
The downstream verification receipt is
`docs/research/casimir-dp-proper-time-worldline-closure-stage4-2p-verification-receipt.json`.

## Stage-4.2Q superconducting-boundary control

Run `npm run casimir:dp:stage4-2q` to replay the bounded normal-versus-
superconducting boundary-control assessment. The diagnostic recovers London
screening while enforcing nonzero finite-frequency surface impedance,
constructs the ordinary complex-coherence ratio, verifies that the unchanged
standard Diósi factor cancels to numerical precision, scores temperature,
magnetic, and matched-specimen controls, and bounds the coating condensation
energy as ordinary stress energy only.

The synthetic fixture rejects crossing (T_c) because of thermal-signature
collinearity and rejects a matched static pair because of low SNR and
fabrication degeneracy. A magnetic toggle is the only bounded synthetic
candidate (SNR `10.042454540104556`, maximum nuisance cosine
`0.3670128108497832`, condition number `1.4695651082298706`). It is not a
physical apparatus selection. Measured specimen impedance, state-conditioned
Green response, magnetic/trap transfer, vortex state, sham covariance, and
joint complex-coherence cells remain absent.

The Theory Badge documents one ordinary response edge--surface impedance to
the electromagnetic Green/phase/loss chain--and zero collapse-bridge edges.
Standard-Model Higgs, Anderson--Higgs, superconducting-condensate, and BEC
relations remain structural, calibration, or platform nonbridges to the frozen
Diósi generator. The canonical report is
`docs/research/casimir-dp-superconducting-boundary-control-stage4-2q-report.md`.

Fresh adapter run `2381`
(`adapter:6d1b7163-e47e-446c-88a5-4bba0925da9d`) is `PASS`, with no first
failure or deltas, certificate status `GREEN`, integrity true, and certificate
SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
The verification receipt is
`docs/research/casimir-dp-superconducting-boundary-control-stage4-2q-verification-receipt.json`.
This certifies repository execution only; all empirical and physical-viability
ceilings remain unchanged.

The earlier Stage-4.2J Schrödinger/mass-density campaign recovers the frozen
effective-Gaussian prediction, proves that a Hamiltonian
branch-energy difference rotates phase rather than generating DP contraction,
and inverts the synthetic contraction to a conditional DP-equivalent energy.
The same-(R_0) homogeneous sphere gives 0.249896 of the effective-Gaussian
energy. Three constituent-density representations remain unavailable. The
declared ideal-gas screen returns `no_go`, state preparation and external-bound
mapping remain `not_ready`, physical candidate selection is false, and no
observable bridge is added. Report and campaign-receipt SHA-256 values are
`02ea5911d809480df2763c2381314fd2c7637940b958a78abd0cdde6ae923ed8`
and
`54358d0294652a457d1c628147ace2acbc337b45a546ae7e2fdb443a563f74a9`.
Fresh adapter run `2370`
(`adapter:1211c4a1-9ebf-4288-a867-1240fabd8adb`) is `PASS`, with first failure
`null`, no deltas, certificate status `GREEN`, integrity `true`, and certificate
SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
The exclusive validated-trace SHA-256 is
`161cd8268093e8b7563f1b78541945c074503ffa440323667fceb178e434b6a8`.
The Stage-4.2I certificate was not reused. The generated math registry contains
218 validated entries, including the explicit Stage-4.2J diagnostic. This is
repository/software verification with scientific scope `none`.

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

## Stage-4.2R integrated feasibility-pilot readiness

Run `npm run casimir:dp:stage4-2r` to replay the content-addressed empirical-
input audit for the leading apparatus. The runtime separates the primary
mass--separation--time Diósi contraction from the four-cell boundary-
interaction cross-ratio, computes the conditional acquisition precision, and
returns an explicit pilot authorization or no-go.

The current report is
`docs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r-report.md`.
It returns `not_authorized` because all eight required same-apparatus authority
packets are absent. This is a passing fail-closed software contract, not a
failed physics result and not measured collapse evidence.

Fresh repository verification is recorded in
`docs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r-verification-receipt.json`.

## Stage-4.2S retarded-source and switching-radiation closure

Run `npm run casimir:dp:stage4-2s` to replay the causal ordinary-
electromagnetic source audit. The runtime recovers transverse retarded
radiation, Larmor energy flux, current conservation, circular-polarization
completeness, and standard limiting cases; classifies source scales by
(kL=2pi fL/c); and maps a synthetic branch Green response into ordinary
phase, contraction, recoil, heating, and complex-coherence nuisance output.

The current report is
`docs/research/casimir-dp-retarded-source-propagation-stage4-2s-report.md`.
Its software and analytic gates pass, while ordinary-null integration remains
`not_authorized` because 0/7 measured same-apparatus propagation authorities
are ready. The synthetic source rows and Green matrices are interface
recoveries, not apparatus forecasts. The frozen Diósi generator is unchanged
and no collapse bridge is registered.

Fresh repository verification is recorded in
`docs/research/casimir-dp-retarded-source-propagation-stage4-2s-verification-receipt.json`.

## Boundary

Generated research-style notes that are useful but not canonical should move to
`../synthetic-research/` once their references and links have been checked.
Historical implementation notes should move to `../legacy-development/`, not
this folder.
