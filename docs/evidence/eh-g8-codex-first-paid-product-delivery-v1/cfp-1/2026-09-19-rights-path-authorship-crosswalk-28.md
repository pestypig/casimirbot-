# CFP-1 targeted path-authorship crosswalk — 2026-09-19

Status: read-only Git-history evidence for R-OWN-01 and R-PUBLIC-01, extending the [source-publication/provenance checkpoint](2026-09-19-source-publication-provenance-14.md). This crosswalk does **not** determine legal authorship, copyright ownership, assignment, contribution terms, imported-code rights or permission to close source. The [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) and [G8 work program](../../../helix-environment-harness-work-program-v1.md) retain authority. No source visibility, license, runtime or release setting changed.

Source: committed history reachable from Desktop HEAD `256554ca2637b2978a83616d9f9670069fdfd8c4`; uncommitted work is outside this count. For each path cohort in the [machine-readable crosswalk](2026-09-19-rights-path-authorship-crosswalk-28.csv), `git log HEAD --format=%an%x09%ae%x09%ad --date=short -- <path>` was grouped by exact Git author-name/email string. `git rev-list --count HEAD -- <path>` independently matched each row-sum. Counts are commits that touched a path, **not** file ownership, lines authored or unique commits across cohorts; one commit can count in multiple cohorts. Author dates are metadata supplied by commits, not verified contribution dates.

| Proposed product/publication cohort | Commit touches | Exact author strings | Rights-record implication |
| --- | ---: | ---: | --- |
| `client/` | 2,481 | 5 | Main UI has mixed author metadata, including two display names using the same Replit noreply address. Map identities and imported UI/assets before any private/public decision. |
| `server/` | 2,249 | 5 | Main service and hosted logic need the same identity/assignment review; volume does not establish one owner. |
| `shared/` | 660 | 3 | Wire/policy source proposed for a public generated contract and private runtime must be reviewed at file/export granularity. |
| `apps/desktop/` | 11 | 1 | One recorded author string narrows the inquiry but does not prove that all native/build inputs are first-party. |
| `connectors/environment/` | 1 | 1 | The public kit has one introduction commit in this path; its imported `shared/` dependencies and third-party terms remain separate. |
| `minecraft/` | 26 | 1 | The repository Fabric connector source has one recorded author string, while embedded dependencies, game terms and paid-room relationship still need R-MC-01 review. |
| `sdk/` and `cli/` | 5 and 8 | 2 each | Existing MIT package declarations need contribution and publication confirmation separately from the harness kit. |
| Device Check plugin and verifier scaffolder | 1 and 2 | 1 each | Decide each selected public artifact independently of the main proprietary candidate. |

Across these targeted cohorts, five exact Git author strings appear. `pestypig <41094803-pestypig@users.noreply.replit.com>` and `Danyle Bruce <41094803-pestypig@users.noreply.replit.com>` share an email but have different names. The `pestypig <you@example.com>` string is a placeholder address. Replit/GitHub noreply strings, a Gmail string and display names are **not** verified identities or assignments. The separate [publication checkpoint](2026-09-19-source-publication-provenance-14.md) observed six author strings across the broader reachable history, including a Replit Agent marker with no file changes; this targeted map neither contradicts nor replaces that broader observation.

## Specific owner and reviewer follow-up

1. Identify the real person or entity behind each string used in the selected product paths, and provide employment, commission, contractor, assignment or contributor terms covering the relevant dates/components. If strings are aliases for one person, document that with records; do not infer it merely from a shared email or display name.
2. For the proposed private main implementation (`client/`, `server/`, `shared/`, `apps/desktop/`, `minecraft/`), distinguish original work from third-party code, generated assets and imported media. Record any prior publication/version/license for the exact files. A future private implementation boundary cannot retract existing applicable grants.
3. For proposed public connector, wire, plugin, SDK/CLI and verifier artifacts, select exact file/export lists and license/notice terms. The single `connectors/environment/` path commit does not clear its `shared/` imports or prove an independently distributable kit.
4. Have a qualified reviewer return a component/file-level R-OWN-01 and R-PUBLIC-01 disposition with evidence references, unresolved exceptions and the allowed publication/private treatment. The [rights component matrix](rights-draft-2026-09-06/rights-component-matrix.md) and [public-interface boundary](../../../work-packets/eh-g8-cfp1-public-interface-and-source-boundary-v1.md) remain the working handoff; this Git crosswalk is only an index for locating records.

This inspection covers selected directory path prefixes in history reachable from one HEAD, including files later removed from those directories. It does not include untracked work, independent upstream repositories, downloaded binary contents, every root-level product file or the final signed cohort. R-OWN-01 and R-PUBLIC-01 remain open.
