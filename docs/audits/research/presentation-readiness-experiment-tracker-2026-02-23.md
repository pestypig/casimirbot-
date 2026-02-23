# Presentation Readiness Experiment Tracker (2026-02-23)

Derived from:
- `docs/audits/research/presentation-readiness-deep-research-prompt-2026-02-23.md`

## Tracking metadata

- experiment_id: `warp_presentation_readiness_20260223`
- prompt_version: `v1`
- status: `active`
- maturity_label: `diagnostic`
- certifying: `false`
- owner_lane: `warp-gr-control`
- created_utc: `2026-02-23`

## Scope lock (anti-confusion contract)

- canonical_prompt_file: `docs/audits/research/presentation-readiness-deep-research-prompt-2026-02-23.md`
- canonical_prompt_sha256: `34A2550BBCEA5F1A25B508D73D8D47075305161DBA667384998304DD84699BF2`
- canonical_baseline_report: `docs/warp-bubbles-lunar-transport-stakeholder-readiness-2026-02-23.md`
- answer_tag_required: `[exp=warp_presentation_readiness_20260223][prompt=v1][sha=34A2550B...][run=<id>]`
- comparison_rule: compare only runs with identical `canonical_prompt_sha256`

## Locked assumptions

1. This experiment evaluates stakeholder presentation readiness, not propulsion certification.
2. Strict metric-derived versus proxy fallback behavior must be explicitly separated.
3. Audience decisions are required per group: government, defense, industry, academia.
4. No near-term FTL claim is allowed without certifying evidence.

## Run protocol

1. Record every run with run_id, model/config, prompt SHA, and artifact refs.
2. If prompt text changes, create a new prompt file and new SHA before running.
3. Do not merge or average results across different prompt hashes.
4. Keep deterministic fail reasons when constraints fail (`proxy_input`, `contract_missing`, `curvature_window`, etc.).

## Run ledger

| run_id | date_utc | operator | model | prompt_sha256 | status | artifacts | notes |
|---|---|---|---|---|---|---|---|
| R00 | 2026-02-23 | dan/codex | pending | 34A2550BBCEA5F1A25B508D73D8D47075305161DBA667384998304DD84699BF2 | initialized | tracker + frozen prompt | Baseline tracking started before next deep-research rerun |

## Confusion guards checklist

- [x] Frozen prompt file exists.
- [x] Prompt hash recorded.
- [x] Experiment ID assigned.
- [x] Comparison rule constrained by prompt hash.
- [ ] First rerun report logged with required answer tag.
- [ ] Audience GO/NO-GO matrix attached to run record.

## Mutation policy

- Allowed: add new run rows, attach artifacts, append evidence links.
- Not allowed: change frozen prompt text in place.
- If mutation needed: create `presentation-readiness-deep-research-prompt-<date>-v2.md` and start a new tracker row with new SHA.

