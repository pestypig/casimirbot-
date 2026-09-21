# CFP-1 C13 solar-data disposition review — 2026-09-19

The [C13 decision packet](../../../work-packets/eh-g8-cfp1-c13-solar-data-release-disposition-v1.md)
turns the conditional StarSim data row into two reviewable first-customer
branches: retain and repair both solar JSON files with provenance and real
citations, or exclude them while explicitly disabling the dependent
solar-observed customer behavior. Neither branch is owner-selected or
implemented.

Read-only source review at HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`
confirmed that the desktop builder copies and hashes the two files, the stager
requires their exact keys and source/package hashes, and the builder includes
`dist/**`. StarSim mounts outside `fastBoot`; solar loaders resolve and read
the files lazily on relevant calls. A current JSON parse found 22 registry
product keys and fourteen reference documents, all fourteen URLs under
`https://example.com/starsim/`. Omission of only the packaged files would not
be a coherent exclusion. The source call graph is not an installed failure
measurement or a qualified scientific/content review.

An independent read-only reviewer returned **PASS** on the source-backed
claims, both branch handoffs, two planning backlinks and CFP-1 stage boundary.
`npm run helix:environment-harness:docs-audit` passed with `ok: true`, local
links resolved, and `git diff --check` passed for touched tracked packets.

The owner still must choose the customer treatment and any StarSim-facing
claim; a qualified reviewer must dispose retained data/content and notices.
CFP-3 later verifies the exact signed artifact and selected route behavior.
CFP-1 remains active (`specified`); CFP-2/3 remain blocked under the
[work program](../../../helix-environment-harness-work-program-v1.md).
