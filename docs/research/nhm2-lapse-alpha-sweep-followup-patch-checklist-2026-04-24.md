# NHM2 Lapse Alpha Sweep Follow-Up Patch Checklist (2026-04-24)

## Goal
Implement follow-up sweep hardening in strict milestone order, stopping after each milestone for human review before proceeding.

## Execution Rule
- Run milestones in numeric order only.
- After each milestone, stop and review changed files, generated artifacts, and gate outputs.
- Do not promote exploratory rows unless explicit override is set and all promotion gates pass.

## Milestone 1: Profile/Config Integrity
- Verify `configs/research/nhm2-lapse-alpha-sweep.json` alpha list, tags, and brackets.
- Verify `configs/research/nhm2-alpha-sweep-citations.v1.json` paper registry and claim-class paper mappings.
- Verify each profile ID resolves in adapter (`stage1_centerline_alpha_<tag>_v1`).
- Confirm centerline clocking contract: `centerlineAlpha === centerlineDtauDt`.
- Review stop criteria:
  - No profile/config mismatch errors.
  - No missing profile IDs.

## Milestone 2: Artifact Isolation
- Ensure each alpha writes to isolated output directory:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/<profileId>/`
- Ensure sweep-level outputs are written:
  - `nhm2-lapse-alpha-sweep-latest.json`
  - `nhm2-lapse-alpha-sweep-failures-latest.json`
  - `nhm2-lapse-alpha-sweep-claims-latest.json`
  - `nhm2-claim-promotion-report-latest.json`
- Review stop criteria:
  - No cross-profile overwrite.
  - Each profile folder has full-loop artifacts when full-loop run is enabled.

## Milestone 3: Citation Gate and Claim Evidence
- Run:
  - `npm run research:citation:gate`
- Confirm citation gate policy is enforced:
  - `measured`: repo clone evidence required.
  - `derived`: repo clone + literature required.
  - `hypothesis`: literature + uncertainty note + uncertainty rationale + scope boundary required.
- Review stop criteria:
  - Citation gate returns `"ok": true`.
  - No claim-class policy violations.

## Milestone 4: Full-Loop Evidence Ledger
- Ensure full-loop output includes claim evidence ledger with:
  - `sourceCatalog`
  - per-claim `literatureSourceIds`
- Confirm claim promotion report exists for full-loop run:
  - `promoted` only when both full-loop and evidence-ledger states are pass.
- Review stop criteria:
  - Evidence ledger present and complete.
  - Blocked rows include explicit blocking reasons.

## Milestone 5: Sweep Gate Stack
- Validate per-row gates include:
  - `baselineInvariance`
  - `clockingConsistency`
  - `antiSrSafety`
  - `decompositionConsistency`
  - `invariantGate`
  - `fullLoopAudit`
  - `evidenceLedger`
  - `promotionEligible`
- Review stop criteria:
  - `promotionEligible` requires all gates pass.
  - Exploratory rows stay non-promoted without explicit override.

## Milestone 6: Claim Language Guardrails
- Verify claim class mapping:
  - `measured_in_repo`
  - `literature_context`
  - `extrapolation_candidate`
  - `not_validated`
- Enforce wording restrictions for non-measured claims.
- Ensure non-measured claims include literature references.
- Review stop criteria:
  - No forbidden phrase violations.
  - No non-measured claim without literature references.

## Milestone 7: Controlled Single-Profile Progression
- Run controlled profile order:
  - `0p7000`, then `0p6500`, then `0p6000`, then `0p5500`, then `0p5000`
- Run next profile only after prior profile full-loop artifact is written and reviewed.
- Use single-profile selector:
  - `NHM2_ALPHA_SWEEP_ONLY_TAGS=<tag>`
- Keep prerequisite guard enabled:
  - `NHM2_ALPHA_SWEEP_REQUIRE_PREVIOUS_FULL_LOOP=1` (default)
- Review stop criteria (per profile):
  - Full-loop artifact exists.
  - Gate outcomes recorded.
  - Claim class and promotion decision recorded.

## Milestone 8: Research-Backed Reporting
- In every summary/memo, separate:
  - repository-measured findings
  - literature-context interpretation
  - extrapolation-only statements
- Keep literature references explicit in outputs (arXiv/DOI URLs).
- Preserve repo-clone provenance for measured and derived claims.
- Review stop criteria:
  - No statement implies physical validation beyond measured scope.
  - Every non-measured statement has literature context and uncertainty framing.

## Minimal Verification Commands
```bash
npm run research:citation:gate
npm test -- nhm2-lapse-alpha-sweep-runner.spec.ts
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
```

## Safe Claim Template
- Measured:
  - "Observed in this repository under current NHM2 full-loop promotion gates."
- Literature context:
  - "Discussed as literature/context framing; not promoted as repository-measured evidence."
- Extrapolation:
  - "Extrapolation candidate pending explicit policy override and passing promotion gates."
- Not validated:
  - "Not validated by NHM2 full-loop promotion stack; diagnostic only."
