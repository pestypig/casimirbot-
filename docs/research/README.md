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

## Boundary

Generated research-style notes that are useful but not canonical should move to
`../synthetic-research/` once their references and links have been checked.
Historical implementation notes should move to `../legacy-development/`, not
this folder.
