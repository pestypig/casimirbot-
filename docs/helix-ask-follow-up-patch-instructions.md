# Helix Ask Follow-Up Patch Instructions

## Scope
- Patch only Helix Ask routing/scaffold/fallback/output-cleaning behavior related to ambiguous deictic prompts and evidence-backed claims.
- Keep unrelated mission, UI, and warp solver surfaces out of scope unless a failing test proves coupling.

## Required Pre-Read
- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`

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
