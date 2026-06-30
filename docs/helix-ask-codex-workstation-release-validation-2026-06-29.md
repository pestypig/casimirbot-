# Helix Ask Codex Workstation Release Validation - 2026-06-29

Status: release-confidence checklist with current evidence.

This checklist validates Codex Workstation Mode broadly enough for release
confidence without claiming every possible tool combination works.

## Proven Baseline

- Codex runtime selection works.
- A live API and UI turn passed for:
  - `docs.search`
  - `scientific-calculator.solve_expression`
  - `theory-badge-graph.reflect_discussion_context`
  - `scientific-calculator.open_panel`
  - `scientific-calculator.focus_panel`
  - `scientific-calculator.show_gateway_solve`
- The passing compound turn produced visible tool request rows, tool observation
  rows, model re-entry, final answer, satisfied compound subgoals, calculator
  panel projection, and no accidental `internet-search.search_web`.

## Release Matrix

Run the dedicated live helper against the user-started keyed server:

```bash
npm run helix:ask:codex-workstation-release-validation
```

Default output:

```txt
artifacts/helix-ask-codex-workstation-release-validation/
```

The helper must not start or restart the keyed server. If the server is missing,
it writes a blocked summary.

## 2026-06-29 Live Evidence

Artifact directory:

```txt
artifacts/helix-ask-codex-workstation-release-validation/
```

Full keyed API matrix result after keyed server restart:

- Status: `warn`
- Scenario count: 18
- Pass count: 16
- Warn count: 2
- Fail count: 0

Passing live API coverage included:

- `workspace_os.status`
- `scientific-calculator.solve_expression`
- `docs.search`
- `repo.search`
- `theory-badge-graph.reflect_discussion_context`
- `civilization-bounds.reflect_system_bounds`
- `scholarly-research.lookup_papers`
- docs + calculator + theory
- docs + repo
- docs + scholarly
- theory + civilization
- broad docs + calculator + theory + civilization + scholarly + repo
- negated/quoted/future tool-admission guard prompts

Warnings:

- `single_internet`: `internet-search.search_web` was admitted but provider
  execution was missing.
- `compound_calculator_scholarly_internet`: `internet-search.search_web` was
  admitted but provider execution was missing.

These warnings are provider-configuration evidence gaps, not proof that
internet evidence was gathered.

Live UI smoke result:

- Runtime picker showed `Codex`.
- Latest turn displayed `Runtime selected: Codex Workstation Mode`.
- Explicit calculator gateway prompt:
  `scientific-calculator.solve_expression` with expression `8*9`.
- UI latest-turn trace reported:
  `Model re-entry: no workstation observation packet was available for this
  Codex turn.`
- UI final displayed `Observed expression: 8*9` and `Result: 72`, but the turn
  was labeled `TYPED FAILURE | PROVIDER: CODEX WORKSTATION MODE`.

Release classification:

- API-backed Codex Workstation Mode release matrix: release-confidence `WARN`.
- UI latest-turn Codex workstation trace: release-blocking mismatch until the UI
  path shows the same gateway observation/re-entry contract as the API path.

## Coverage Requirements

Single-tool coverage:

- `workspace_os.status`
- `scientific-calculator.solve_expression`
- `docs.search`
- `repo.search`
- `theory-badge-graph.reflect_discussion_context`
- `civilization-bounds.reflect_system_bounds`
- `scholarly-research.lookup_papers`
- `internet-search.search_web`

Representative compound coverage:

- docs + calculator + theory
- docs + repo
- docs + scholarly
- theory + civilization
- calculator + scholarly/internet
- broad docs + calculator + theory + civilization + scholarly + repo

Adversarial coverage:

- negated internet search
- quoted/screen-visible internet capability text
- future/conditional docs search
- calculator observation concept with no calculator execution
- generic evidence/current-document language does not admit internet search

## Pass Criteria

- All deterministic tests in the goal pass.
- Live API matrix has no unexpected tool calls.
- Every explicitly requested capability either produces an observation or fails
  closed with the expected missing/provider rail.
- Optional missing providers are represented as missing or blocked evidence, not
  as proof.
- UI smoke confirms latest-turn trace rows for at least:
  - docs + calculator + theory
  - broad compound prompt
  - negated internet prompt
- Final answers remain grounded in observed evidence and do not collapse into
  terse receipts.

## Non-Claims

This validation does not prove every permutation or every future prompt shape.
It proves a representative release-confidence matrix over the current
read/observe workstation gateway contract.
