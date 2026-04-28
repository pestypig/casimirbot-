# Helix Ask Follow-Up Patch Instructions

## Scope
- Patch only Helix Ask turn execution, final-answer artifact precedence, note-target resolution, and two-step doc-location-to-note composition.
- Keep unrelated mission, UI styling, voice audio, and warp solver surfaces out of scope unless a failing test proves coupling.
- Preserve the current working behavior for:
  - `go to docs`
  - `what paper am I viewing?`
  - `create a note called X`
  - `where does this document mention centerline alpha?`
  - artifact-grounded job-ready links

## Required Pre-Read
- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`
- `docs/helix-ask-agentic-loop-current-overview.md`

## Codex-Clone Methodology Anchors
Use these local clone paths as the implementation contract for the next patch:

- `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs`
  - lines 189-215 assert separate lifecycle events: `item/started`, `item/completed`, `item/plan/delta`, then `turn/completed`.
  - Helix implication: a subgoal may not be marked complete until its required artifact exists.
- `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs`
  - lines 83-90 assert typed `ToolRequestUserInput` with turn/item identity.
  - lines 109-121 require `serverRequest/resolved` before `turn/completed`.
  - Helix implication: missing note target or ambiguous mutation target should be a typed pending request, not a generic final answer.
- `external/openai-codex/codex-rs/app-server/src/server_request_error.rs`
  - lines 3-11 type turn-transition pending-request failures as `reason = "turnTransition"`.
  - Helix implication: pending note/location requests must be owned by the active turn and superseded cleanly.

## Claim-Evidence Contract (Hard Rule)
Every non-trivial answer claim must be typed and backed:
1. `FACT-REPO` for repository-grounded implementation claims
2. `FACT-GH-CLONE` for cross-checks grounded in GitHub clone paths/commits
3. `FACT-WEB-PAPER` for research-backed claims from primary papers
4. `INFERENCE` for bounded reasoning that links evidence
5. `UNKNOWN` when evidence is insufficient

For each non-trivial claim:
- include citation(s)
- include confidence (`high|medium|low`)
- include contradiction flag (`yes|no`)

Do not present exploratory or diagnostic math claims as certified.

## Uncertainty Safety Policy
- If uncertainty remains and the response includes scientific/math claims, include at least one verifiable external research citation (`doi`, `arXiv`, or journal URL) unless the claim is fully repo-scoped.
- For repo/hybrid uncertainty-sensitive claims, include codex-clone or GitHub-clone support when available.
- If required evidence is missing, fail closed with explicit uncertainty and a single actionable next anchor request.

## Deictic Prompt Handling
- Deictic prompts without an anchor (for example, "what is this used for?") must produce one concise clarify question.
- Do not emit generic dictionary-style prose about the word "this."
- Clarify outputs must not include debug scaffolds, internal reasoning blocks, or open-world source marker lines.

## Immediate Patch Objective
Fix the three live UI failures found on 2026-04-27:

1. Summary terminal contract:
   - Prompt: `what is this doc about?`
   - Required behavior: summarize/explain the active document.
   - Forbidden behavior: terminal answer is only `You are currently on: <path>`.
   - Implementation rule: for summarize/explain/doc-about intents, `identify_current_doc` and `workspace_context_snapshot.activeDocPath` are context artifacts only, not terminal-success artifacts.
   - Success terminal must contain one of:
     - deterministic `doc_summary` artifact
     - reasoning `summary` artifact grounded to active doc
     - typed `summary_unavailable` failure with doc path and cause

2. Pronoun/note resolution:
   - Prompt: `copy the current document path to that note`
   - Required behavior: resolve `that note` to the last created or active note.
   - Forbidden behavior: final answer or job-ready link labels show raw pronoun text such as `OPEN NOTE: THAT`.
   - Implementation rule: note target resolution order is explicit title > last created note > active note > typed pending request.
   - The final answer and job-ready links must use resolved `note_id` and resolved note title.

3. Two-step locate-to-note composition:
   - Prompt: `put the centerline alpha location into quick NHM2 test note`
   - Required plan shape:
     1. `docs-viewer.locate_in_doc` with query `centerline alpha`
     2. `workstation-notes.append_to_note` with the located snippet/location artifact
   - Required terminal answer: mention both the found location and the updated note.
   - Forbidden behavior: generic `could not map workspace command` clarification when both source query and target note title are present.

## Output Hygiene
- Never leak internal telemetry scaffolds (for example Objective-first, suppression inspector, capsule guards, convergence snapshots).
- Never append `Sources: open-world best-effort (no repo citations required).` to forced clarify responses.

## Readiness Loop (Required Per Patch)
1. Contract battery:
   - `npx tsx scripts/helix-ask-regression.ts`
2. Variety battery:
   - `npx tsx scripts/helix-ask-versatility-record.ts`
3. Per-patch probe:
   - `npx tsx scripts/helix-ask-patch-probe.ts`
4. Report scorecard probabilities and representative pass/fail evidence.

## Casimir Verification Gate (Required)
Run and report:
- `npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export`

Completion claims require:
- `verdict = PASS`
- `certificateHash` present when emitted
- `integrityOk = true` when certificate is present

## Handoff Checklist
- Files changed
- Why each change was needed
- Claim-evidence ledger summary
- Uncertainty register summary
- Contract/variety/probe outcomes
- Casimir verify result (verdict, runId, certificate hash, integrity)

## Acceptance Tests For Next Patch
Add or update focused tests near the current Helix Ask turn/doc acquisition tests:

1. Summary identity guard:
   - Input: `what is this doc about?` with active doc snapshot.
   - Assert route/plan uses summarize or reasoning summary path.
   - Assert final answer is not equal to active doc identity.
   - Assert final answer includes summary/explanation text or typed `summary_unavailable`.

2. Pronoun note resolution:
   - Turn 1: `create a note called quick NHM2 test note`.
   - Turn 2: `copy the current document path to that note`.
   - Assert appended note target resolves to `quick NHM2 test note`.
   - Assert job-ready link label contains resolved title, not `that`.

3. Locate-to-note composition:
   - Input: `put the centerline alpha location into quick NHM2 test note`.
   - Assert plan has ordered steps `docs-viewer.locate_in_doc` then `workstation-notes.append_to_note`.
   - Assert final answer references a location artifact and note update artifact.
   - Assert no generic missing-capability clarification is emitted.

4. UI automation guard:
   - Browser tests must use `textarea[aria-label="Ask Helix"]`.
   - Do not use the first textarea after notes are open, because that can target the note editor.

## Primary Source Anchors (Use For `FACT-GH-CLONE` / `FACT-WEB-PAPER`)
Use these as the default external anchors for the workstation-agent follow-up patch:

### Papers
- ReAct (reasoning/action interleave): [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
- Toolformer (tool-call policy learning): [arXiv:2302.04761](https://arxiv.org/abs/2302.04761)
- WebGPT (browser-grounded QA with cited evidence): [arXiv:2112.09332](https://arxiv.org/abs/2112.09332)
- Mind2Web (generalist web-agent task distribution): [arXiv:2306.06070](https://arxiv.org/abs/2306.06070)
- WebCanvas / Mind2Web-Live (online evaluation realism): [arXiv:2406.12373](https://arxiv.org/abs/2406.12373)
- SWE-bench (real GitHub issue resolution benchmark): [arXiv:2310.06770](https://arxiv.org/abs/2310.06770)

### GitHub Repositories
- SWE-agent: [github.com/SWE-agent/SWE-agent](https://github.com/SWE-agent/SWE-agent)
- OpenHands: [github.com/All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands)

## Evidence Usage Rules
- Any claim about "agent can operate UI/workspace autonomously" must cite at least one benchmark paper from the list above and one concrete implementation anchor (repo or local code path).
- Any claim about job-loop parity with codex-like coding agents must cite at least one SWE-bench-family source plus one concrete open implementation (SWE-agent or OpenHands) before assigning confidence above `medium`.
- For unresolved uncertainty, downgrade to `INFERENCE` or `UNKNOWN` and attach one next-step validation probe.
