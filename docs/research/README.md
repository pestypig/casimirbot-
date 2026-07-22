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

Use `study-full-solve-template.md` when starting another whitepaper-backed,
artifact-producing study.

## Boundary

Generated research-style notes that are useful but not canonical should move to
`../synthetic-research/` once their references and links have been checked.
Historical implementation notes should move to `../legacy-development/`, not
this folder.
