# CFP-1 source publication and provenance checkpoint — 2026-09-19

Status: read-only evidence for R-OWN-01 and R-PUBLIC-01. This is not an
ownership determination, legal clearance, repository migration, license change,
or updated stage ledger. The [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md)
and [work program](../../../helix-environment-harness-work-program-v1.md)
retain authority.

Inspected Desktop source HEAD: `256554ca2637b2978a83616d9f9670069fdfd8c4`;
the shared worktree has uncommitted changes. On 2026-09-19 the
connected GitHub repository metadata for
[`pestypig/casimirbot-`](https://github.com/pestypig/casimirbot-)
(repository ID `1036243681`) reported `visibility: public`, default branch
`main`, and `archived: false`. The 16:39:05 UTC metadata read returned those
same fields. The local `origin` URL names that repository.
This records the observed source-access state, not every historic publication,
fork, download, package release, or license grant. No GitHub setting was changed.

## Local history and manifest observations

| Check | Observed result | Limit |
| --- | --- | --- |
| Root package license | Current `package.json` declares `MIT`; `git show 515bc564d:package.json` shows the same declaration at the earliest inspected root-manifest commit, `515bc564dd0b7fb4e8ab8c0030eff81c39bd0c9d` on 2025-07-27. An independent GitHub-upload root, `d4d99ae98d6a858d9b1c62c665d2fa3c81547b50`, also declared MIT on 2025-08-11. | Package metadata records an MIT license declaration; current public status does not prove when each historical revision became public. It does not identify the holder of every included file or prove that all later contributions share one license. |
| Root license files | `git log --all -- LICENSE COPYING NOTICE` returned no root-file history; the HEAD tracked-tree scan found component license files but no root `LICENSE`, `COPYING`, or `NOTICE`. | Absence of root text needs reviewer treatment; it does not erase an earlier grant or create permission to relicense. |
| Recorded authors | `git shortlog -sne --all` produced six Git author strings across 7,920 reachable commits. Two author names share one Replit noreply address; other strings include placeholder and GitHub noreply addresses. | Author strings are neither verified people nor copyright assignments. Do not count them as six independent contributors or rights holders. |
| Replit deployment marker | The one commit authored as `Replit Agent`, `42c5b19b4be2a95d2d2de937ef9f550df8b6f2b4`, says “Published your App” and carries deployment metadata; `git show --stat` and the path listing show no changed files. | This marker alone is not evidence that the agent contributed code or owns code. It also does not establish rights in other AI-assisted or commissioned work. |
| Component packages | `sdk/package.json` and `cli/package.json` declare MIT; `apps/desktop/package.json` is `private: true` with no license field. `packages/create-casimir-verifier/LICENSE` exists separately. | Each component needs its own source, publication and notice review. `private: true` is package-manager metadata, not a copyright or distribution decision. |

The [MIT text](https://opensource.org/license/mit) permits redistribution of
covered copies subject to preserving its notice. [GitHub's visibility
guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
states that public forks remain public when a repository becomes private.
Neither source resolves which CasimirBot files were covered by which prior
publication or who can license future versions. Changing repository visibility
would affect future access, not retract copies already obtained under applicable
terms.

## Exact evidence needed to close R-OWN-01 and R-PUBLIC-01

The product owner should give the qualified rights reviewer a dated,
component-level record that identifies the actual person or entity claiming
rights; maps the Git identities to verified contributors where possible;
identifies employment, contractor, commission, assignment or contributor terms
for each material contribution; lists imported code and assets separately;
and records the versions, channels and terms under which source or packages
were previously made available. The reviewer should identify exceptions and
permitted treatment per selected file or generated artifact, including the
public connector kit and protocol, verifier packages, Device Check plugin,
main server/client, native companion, and third-party dependencies.

The owner then selects a file-level public artifact list and a future private
implementation boundary using the [public-interface/source-boundary
packet](../../../work-packets/eh-g8-cfp1-public-interface-and-source-boundary-v1.md).
If source visibility is to change, the [distribution handoff](../../../work-packets/eh-g8-cfp3-distribution-migration-v1.md)
must first prove customer download and updates independent of source-repository
membership. R-OWN-01 and R-PUBLIC-01 remain open; this checkpoint narrows the
review request and makes no commercial or release decision.
