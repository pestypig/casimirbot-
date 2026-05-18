# Helix Ask / Codex Loop Discipline

Status: operational instruction.

This note compares the current Helix Ask backend posture against the bundled
Codex clone and sets the boundary for future work. It is intentionally a
procedure contract, not a claim that Helix Ask behavior is deterministic.

## Comparison Snapshot

- Helix Ask repo context: `pestypig/casimirbot-`, local worktree.
- Codex comparison target: `external/openai-codex` at
  `0b08d893042ba0c0d5c2f020b1c78b46af2ebe59`.
- Public `openai/codex` `main` observed during this comparison:
  `4ca60ef9fffe76fb4f86d606f7d4a2f727f6cd25`.

Codex and Helix Ask overlap in agent vocabulary, but they should not overlap in
ownership. Codex owns the generic agent runtime. Helix Ask owns the domain
evidence loop.

## Codex-Owned Responsibilities

Do not recreate these in Helix Ask unless Codex cannot expose the capability:

- Turn/session lifecycle: one active task per session, interrupt/resume, thread
  context persistence, and compaction.
- Tool execution semantics: tool registry, tool-call readiness gates,
  mutating-tool serialization, and tool result events.
- Shell/file mutation safety: sandbox policy, permission requests, approval
  events, apply-patch interception, and command process management.
- Planning UI primitives: generic checklist/update-plan state.
- Subagent orchestration: spawn/wait/send/close mechanics and shared turn config.
- Generic realtime transport: conversation start/audio/text/close plumbing.

Helix Ask may call or mirror status from these surfaces, but it should not build
a parallel general-purpose agent loop around them.

## Helix-Ask-Owned Responsibilities

Keep these first-class in Helix Ask because they are repo/domain policy, not
generic agent runtime:

- Evidence lanes: repo grep/git-tracked scan, Atlas/code lattice, Stage0/Stage05,
  concept cards, docs, artifacts, telemetry, and live source observations.
- Retrieval contracts: must-read paths, precedence paths, topic must-includes,
  missing/unreadable path checks, and precedence conflict handling.
- Objective coverage: required slots, objective-scoped retrieval recovery,
  mini-answer validation, unknown blocks, and final assembly gates.
- Proof and maturity policy: no repo-attributed claim without proof pointers;
  no proof/viability/certification language without the right gate packet.
- Live source identity: screen/audio/browser/workstation sources are observations
  with provenance, freshness, consent, and state. They are never assistant
  answers and never deterministic truth by themselves.
- Domain-specific actions: verification adapters, physics/warp policies,
  panel evidence summaries, and mission callouts.

## Equal-Identity Evidence Rule

Every input lane must enter the Helix Ask loop as an evidence candidate with the
same envelope shape:

```ts
type HelixEvidenceObservation = {
  id: string;
  lane: "repo_search" | "git_tracked" | "stage0" | "atlas" | "manual_contract";
  source_kind:
    | "repo_code"
    | "repo_doc"
    | "artifact"
    | "telemetry"
    | "live_screen"
    | "live_audio"
    | "browser"
    | "operator_text";
  source_id: string;
  observed_at: string;
  freshness_ms?: number;
  provenance: "measured" | "retrieved" | "declared" | "inferred";
  confidence: number;
  refs: string[];
  content_role: "evidence_not_assistant_answer" | "observation_not_assistant_answer";
  consent_state?: "not_required" | "requested" | "granted" | "revoked";
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  term?: string;
  query?: string;
  score?: number;
  sourceStage?: "preflight" | "fallback_repo_search" | "stage0_code_floor" | "objective_recovery";
};
```

The shared TypeScript contract lives in `shared/helix-evidence-observation.ts`.
Repo-search formatting must emit these observations alongside text snippets so
debug traces preserve source identity even when the answer composer still reads
the legacy `Repo search hits:` block.
Retrieval context attempts must merge and carry observations forward; debug
payloads are only a visibility surface, not the source of proof authority.

Final repo-grounded answers then pass through a repo-claim observation gate.
The gate is controlled by `HELIX_ASK_REPO_CLAIM_OBSERVATION_GATE` with
`off`, `shadow`, `repair`, and `fail` modes. In `shadow` mode it records
unsupported implementation claims without mutating the answer. In `repair`
mode unsupported implementation claims are downgraded into `Next evidence
needed`. In `fail` mode unsupported repo implementation claims fail closed with
`REPO_CLAIM_OBSERVATION_SUPPORT_MISSING`.

The loop can rank evidence, but it cannot promote one lane to answer authority
without passing the same proof/coverage gates. A live source is equal in
identity to repo grep or telemetry: useful evidence, not final truth.

## Non-Redundancy Test

Before adding Helix Ask backend logic, answer these questions:

1. Is this generic session, turn, tool, sandbox, approval, patch, compaction, or
   subagent orchestration?
   - If yes, use Codex-owned structure or expose a thin adapter.
2. Is this selecting, normalizing, ranking, or gating domain evidence?
   - If yes, it belongs in Helix Ask.
3. Does this produce a user-visible claim?
   - If yes, it must cite proof pointers or emit an UNKNOWN/blocked result.
4. Does this consume a live source?
   - If yes, record consent/state/freshness and mark it as observation-only.
5. Does this trigger execution or verification?
   - If yes, bind the result to a proof packet or explicit fail reason.

If a proposed change fails this test, it is probably redundant methodology.

## Procedure For Backend Patches

Use this sequence for future Helix Ask agent-loop patches:

1. Classify the patch as `runtime-adapter`, `evidence-lane`, `retrieval-gate`,
   `proof-policy`, `live-source`, or `presentation`.
2. For `runtime-adapter`, keep the implementation thin and delegate lifecycle,
   tool execution, and permissions to Codex-compatible primitives.
3. For `evidence-lane`, return proof shards only. Do not let the lane write the
   answer.
4. For `retrieval-gate`, update objective slots, selected files, and debug
   transcripts so replay can explain why a source was trusted or rejected.
5. For `proof-policy`, fail closed when required evidence is missing, stale, or
   outside the allowed source class.
6. For `live-source`, require explicit source state and preserve
   observation-only semantics.
7. For `presentation`, show maturity/gate status without hiding required proof
   packet fields.

## Instruction Delta

Future instructions to Helix Ask should use this language:

> Treat Codex as the generic agent loop owner. Helix Ask must not duplicate
> Codex session, turn, tool, sandbox, approval, patch, compaction, or subagent
> orchestration. Helix Ask owns evidence retrieval, live-source provenance,
> objective coverage, proof gates, and domain-specific answer policy. All live
> sources, repo hits, artifacts, telemetry, and operator text enter as equal
> evidence observations with provenance and freshness. No observation is an
> assistant answer. No repo/system claim is emitted without proof pointers or a
> typed UNKNOWN/fail-closed reason.

## Regression Prompts

Use these prompts when checking that the boundary holds:

```txt
What evidence source is Helix Ask using right now, and why is it allowed to answer?
```

Expected: lists evidence observations and gate status, not raw tool logs.

```txt
Read the current live source and explain whether it changes the repo-grounded answer.
```

Expected: live source is treated as observation-only and compared against repo
evidence with freshness/provenance.

```txt
Find the StarSim backend lanes and explain where the answer is grounded.
```

Expected: repo evidence lane produces paths/snippets; final answer remains
gate-validated.

```txt
Run the verification path and tell me what passed.
```

Expected: answer cites proof packet fields or fails closed with a stable reason.
