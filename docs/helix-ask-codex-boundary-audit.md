# Helix Ask Codex Boundary Audit

Status: active audit notes for workstation tool planning and compound capability planning.

## Boundary Rule

Codex owns step sequencing after observations re-enter the model. Helix Ask owns capability admission, provenance, observation normalization, typed affordances, proof gates, and terminal authority.

The practical rule for planner code is:

```txt
admit one requested capability or source observation
-> return observation plus next_affordances
-> Codex chooses the next call
```

Helix may block invalid calls, but it should not walk a reasoning chain on Codex's behalf.

## Current Findings

| Area | Risk | Current Status |
| --- | --- | --- |
| Formula-bound research chain | `lookup -> fetch_full_text -> extract_numeric_parameters -> calculator` could be auto-executed as a hidden dependent chain. | Patched: research-chain dependent requests are exposed as `next_affordances` and are not auto-executed by the gateway runner. |
| Calculator admission | Formula text plus `calculator binding` could become an immediate solve. | Patched: source-bound numeric evidence prompts suppress calculator solve and route to scholarly evidence. |
| Compound planner request construction | `buildResearchQuantifyReflectRequests` can still emit multiple first-turn requests when one prompt blends research, reflection, internet, and civilization cues. | Needs further simplification: prefer primary admitted evidence request plus typed alternate affordances unless the user gives direct multi-tool commands. |
| Workstation tool planner | Several branches build multi-step `tool_plan.steps` with open panel, ingest, solve, reflection, and evaluation. | Needs branch-by-branch audit. Direct affirmative tool commands are acceptable; inferred reasoning itineraries should be reduced. |
| Dependent voice/read-aloud path | A surface observation may still auto-drive narrator output. | Left unchanged in this patch because it is a separate side-effect policy path; should be audited for confirmation and terminal authority. |
| Terminal failure override | Gateway failures can still suppress Codex explanations when the failure is a recoverable observation. | Partially addressed by earlier terminal pass-through patches; needs a broader audit across tool families. |

## Patch Policy

Allowed Helix behavior:

- Parse prompt intent into source/tool admission candidates.
- Reject contextual, negated, future, historical, quoted, or screen-visible tool mentions.
- Execute a directly admitted capability.
- Normalize result into an observation packet with provenance.
- Attach `next_affordances` for likely follow-up tools.
- Block calculator execution until a numeric substituted expression exists.
- Fail closed for unsafe, mutating, missing-input, or contract-invalid calls.

Disallowed Helix behavior:

- Automatically execute a follow-up reasoning chain because prior evidence made it possible.
- Treat a successful receipt as goal satisfaction.
- Treat formula templates as solved calculator expressions.
- Override Codex's post-tool explanation for recoverable evidence mismatch.
- Encode domain-specific retrieval retries as mandatory hidden calls.

## Remaining Audit Checklist

1. Review `buildResearchQuantifyReflectRequests` so mixed formula-research prompts produce one primary request and alternate `next_affordances`, not parallel reasoning-stage calls.
2. Review `buildPlannerDerivedWorkstationGatewayCallRequests` and `planWorkstationToolUse` for multi-step plans that should be UI affordances rather than executed gateway calls.
3. Review `buildSummarizeAndCalculateRequests` for document-plus-calculator coupling; keep only explicit multi-command behavior.
4. Review read-aloud/narrator dependent execution separately because it is a side-effecting output lane.
5. Add adversarial tests for contextual, future, quoted, and evidence-collection prompts across calculator, theory reflection, scholarly research, repo search, and voice.
6. Keep live UI validation on the user-started keyed server only.

