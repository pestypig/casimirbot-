# Helix environment harness G2 closure audit — 2026-08-20

Status: immutable capability-specific evidence snapshot. This audit closes the
G2 A0/A1/B differential-parity gate for the exact Fabric fluid micro-course. It
does not accept G3 persistent viability, unexpected-event recovery, live-mail
wakes, durable goals, concurrent reasoning, or learned controllers.

```text
Program gate: G2
Workstream: A0 / A1 / B differential parity
Capability or component: com.casimirbot.minecraft.player.sequence.execute
Lifecycle stage: request through execution, observation re-entry, and applicable terminal presentation
Reaction timescale: short semantic replanning plus bounded Fabric execution
Authority owner: Codex strategy and synthesis; Helix identity/admission/evidence/terminal eligibility; Fabric execution
Current maturity: integrated accepted for this exact tripath fixture
Target maturity: integrated accepted
Required evidence: equivalent-state A0, authenticated A1, and keyed B traces with no first divergence
Explicit non-goals: G3 resident viability, live-mail wakes, durable goals, learned controllers, second-domain transfer
Downstream gate unlocked: G3 viability and unexpected events
```

## Result

The observer-only G2 audit passed:

```text
schema: helix.environment_action.g2_parity_audit.v1
audit_id: environment_action_g2_parity_audit:a441e2e0fda8f76eac177c5cb85d1c225bc6034a
scenario_id: minecraft:g2-fluid-micro-course-b32-exact-replay-v1
action_kind: execute_sequence
ok: true
first_divergence_stage: null
mismatches: []
```

All three lanes used the same natural prompt, starting-state contract,
capability ID, normalized sequence arguments, mutation scope, scheduler engine,
required checkpoints, and terminal reason. Volatile clocks and scheduler timing
were retained in the source captures but were not treated as semantic
divergences.

## A0 — direct Fabric reference

- Trace:
  `environment_action_differential_trace:direct_codex:31abd2974a7e94b27597db64f3a04dae2b99cfce`
- Capture: `artifacts/g2-fluid-parity/a0-b32-exact-capture.json`
- Differential trace: `artifacts/g2-fluid-parity/a0-b32-exact-trace.json`
- Outcome: succeeded; 14 nodes executed; eight condition observations
  satisfied; four inventory mutations; zero world mutations; controls released.

## A1 — authenticated Codex through MCP

The dedicated Auth0 Native/public client completed authorization-code plus PKCE
account binding without a client secret. Reference Codex then called only
`helix_minecraft_player_action` with the exact A0 normalized arguments through
the room-bound MCP resource. The current room/player lease and Fabric arbiter
admitted and executed the action.

- Action request:
  `environment_action_request:7419c554-ea33-4c62-b7f9-34d8e029cde6`
- Workflow:
  `environment_action_workflow:dca92229-0a1a-45c0-bc9f-c6c4a255ad5d`
- Evidence:
  `environment_action_evidence:0acc1c61dbeae0b18b8cd4f0768ab20853eb8a993`
- Trace:
  `environment_action_differential_trace:codex_mcp:07e9295e26a48499c1c88843a4ef7f1d0a35adb4`
- Outcome: succeeded; 14 nodes executed; eight condition observations
  satisfied; all seven required checkpoint IDs satisfied; four oak planks
  crafted; zero deviations; zero retries; zero world mutations; controls
  released.
- Scheduler measurement: 21 ticks; wall clock 1,038 ms.
- Observation properties: provenance valid, eligible for current-turn re-entry,
  and cited by the final Codex synthesis.

Two earlier reference-Codex launch attempts were canceled by Codex's local MCP
approval prompt before Helix admission and caused no environment effect. The
accepted run used an explicit per-tool approval for the already owner-approved,
lease-bounded capability; Helix and Fabric authority checks remained active.

Public artifacts and SHA-256 hashes:

- `artifacts/g2-fluid-parity/a1-public-mcp-turn.json` —
  `4E7EA5EA043A17AE986C404D1A94E41F9BA3D9E2E461A82331DE93DDAFBAD422`
- `artifacts/g2-fluid-parity/a1-mcp-capture.json` —
  `ABEF80294B3038762DBA5555C6C40FBCF21B34AFA845E7AA0C424C15FF8775BC`
- `artifacts/g2-fluid-parity/a1-mcp-trace.json` —
  `FE585FDF0D37D8441703554CB62BCE6C7675DE2A5B1221E5F8849D2B785B9606`

No OAuth token, client secret, pairing material, or hidden reasoning is present
in these artifacts.

## B — keyed Helix Ask

- Trace:
  `environment_action_differential_trace:helix_ask:9038dff2de52acdae752290f3036c1870ed2fccf`
- Ask evidence: `artifacts/g2-fluid-parity/b32-ask-debug.json`
- Capture: `artifacts/g2-fluid-parity/b32-helix-capture.json`
- Differential trace: `artifacts/g2-fluid-parity/b32-helix-trace.json`
- Outcome: authoritative final answer after verified current-turn observation
  re-entry; lifecycle audit passed; all required checkpoints and control release
  remained supported through the terminal writer.

## Tripath observer

- Artifact: `artifacts/g2-fluid-parity/g2-a0-a1-b-parity-audit.json`
- SHA-256:
  `4709D8C4A06271F3946DF61BD417D71F0B49DAEBB030C828C5030182E8F147F9`
- Verdict: `PASS`
- First divergence: none.
- The audit is observer-only and has no answer or terminal authority.

## Scope of acceptance

This evidence establishes integrated parity for one exact deterministic fluid
sequence across A0, A1, and B. It preserves Codex ownership of semantic choice
and synthesis while Helix retains identity, consent, admission, provenance, and
terminal eligibility. It does not prove that protection remains continuously
active while Codex is delayed. That is the newly active G3 gate.
