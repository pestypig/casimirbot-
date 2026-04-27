# NHM2 Follow-Up Patch Runbook

## Scope
- Execute the NHM2 exploratory centerline-lapse bracket as controlled single-profile full-loop runs.
- Require fresh full-loop stage artifacts before advancing to the next alpha tag.
- Keep claim language fail-closed: literature supports context and uncertainty boundaries, not proof.

## Ordered Milestones
1. Milestone 1: Controlled exploratory ladder execution (`0p7000 -> 0p6500 -> 0p6000 -> 0p5500 -> 0p5000`).
2. Milestone 2: Freshness and stage availability checks per profile.
3. Milestone 3: Claim and uncertainty output update.
4. Milestone 4: Research/citation lock verification.
5. Milestone 5: Status memo regeneration.
6. Milestone 6: Test and citation-gate verification.

## Commands
Run the controlled exploratory ladder:

```powershell
npm run warp:full-solve:nhm2-shift-lapse:exploratory-controlled-ladder
```

Run tests and citation gate:

```powershell
npm test -- nhm2-lapse-alpha-sweep-runner.spec.ts research-citation-gate.spec.ts
npm run research:citation:gate
```

Selected-transport-only smoke mode:

```powershell
$env:NHM2_SWEEP_MODE = "selected-transport-only"
$env:NHM2_SELECTED_TRANSPORT_ONLY = "1"
$env:NHM2_PROFILE_ID = "stage1_centerline_alpha_0p7000_v1"
$env:NHM2_PROFILE_TAG = "0p7000"
$env:NHM2_CENTERLINE_ALPHA = "0.7"
$env:NHM2_CENTERLINE_DTAU_DT = "0.7"
$env:NHM2_OUTPUT_DIR = "artifacts\research\full-solve\selected-family\nhm2-shift-lapse\alpha-sweep\stage1_centerline_alpha_0p7000_v1\debug-selected-transport"
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
```

## Freshness Gate (must pass before next alpha)
- `stageDetailFreshness.allFresh == true`
- `fullLoopStateRaw != null && fullLoopStateRaw != "unavailable"`
- `fullLoopAvailability.strictSignalAvailable == true`
- `fullLoopAvailability.sourceClosureAvailable == true`
- `fullLoopAvailability.observerAuditAvailable == true`
- `fullLoopAvailability.certificateAvailable == true`

If any check fails, stop ladder execution and remediate blocker first.

## Claim Safety Rules
- `repo_measured`: only when promotion stack passes.
- `repo_plus_literature`: repository evidence plus literature context; still blocked if gates fail.
- `literature_only_nonproof`: context-only; cannot be promoted as measured evidence.
- `not_validated`: diagnostic/fail state; no reduced-order promotion claim.

Never claim experimental validation from literature citations alone.

## Citation Registry Contract
- Primary registry path: `docs/research/nhm2-alpha-sweep-citation-registry.v1.json`
- Fallback path: `configs/research/nhm2-alpha-sweep-citations.v1.json`
- Every paper entry must include:
  - `id`, `title`, `url`, `sourceStability`, `evidenceRole`
  - `year`, `publisherType`, `allowedClaimClasses`
  - `doi` when available (required for DOI-backed primary-paper claim paths)

## Research Sources (Primary Context)
- Alcubierre (1994): https://doi.org/10.1088/0264-9381/11/5/001
- Natario (2001): https://arxiv.org/abs/gr-qc/0110086
- Gourgoulhon (2007): https://arxiv.org/abs/gr-qc/0703035
- Fewster and Roman (2003): https://doi.org/10.1103/PhysRevD.67.044003
- Bobrick and Martire (2021): https://doi.org/10.1088/1361-6382/abdf6e
- Bobrick and Martire preprint (2021): https://arxiv.org/abs/2102.06824
- Lentz (2021): https://doi.org/10.1088/1361-6382/abe692
- Santiago, Schuster, Visser (2021): https://arxiv.org/abs/2105.03079
- Natario closer look (2024): https://doi.org/10.1007/s10773-024-05700-0

## Output Artifacts
- Sweep summary:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-lapse-alpha-sweep-latest.json`
- Claim promotion report:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-claim-promotion-report-latest.json`
- Controlled ladder status:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-exploratory-controlled-ladder-latest.json`
- Status memo:
  - `docs/research/nhm2-lapse-alpha-sweep-status-latest.md`
- Profile coherence:
  - `nhm2-profile-resolution-latest.json` (per profile root)
- Runtime attempts:
  - `attempts/attempt-###/` (selected transport artifact isolation)
