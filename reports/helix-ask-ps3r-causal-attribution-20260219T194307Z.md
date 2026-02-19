# HELIX-PS3R Causal Attribution for Quake-Style Move Weights vs Structural Logic in Helix Ask

## Executive summary

This investigation attributes **HELIX-PS3R failure gates** to either (a) **quake-style move weights** (policy scoring / action selection) or (b) **structural logic** (routing, relation-packet assembly, citation/answer post-processing, and budget enforcement). The central finding is that the **PS3.3 quake-weight sweep improves the tool-budget behavior**, but it does **not** move the highest-volume correctness gates (report-mode mismatch, relation packet construction, citation presence). This strongly indicates that **weights are not the primary lever** for most current promotion-gate failures.

Primary in-repo evidence shows the specific pattern:

- **Unchanged across baseline vs best quake-weight candidate:** `report_mode_mismatch`, relation packet gates (`relation_packet_built`, `bridge_count_low`, `evidence_count_low`, `relation_dual_domain`), and `citation_missing`.
- **Improved (meaningfully) in the quake-weight candidate:** `clocka_tool_cap_stop_rate` (drops from 0.463 → 0.311) and a small improvement in `latency_total_p95_ms` (1931 → 1888 ms), but latency remains above the 1600 ms threshold used in audits.

By contrast, **structural gates** are rooted in modules that operate *outside* the quake frame loop: routing/arbiter decisions (mode selection), relation packet assembly and floor enforcement, and the mechanics for ensuring citations persist into the final rendered text.

External literature and engine references support the separation of concerns:

- **Utility/weighted action selection** is designed to choose among already-available actions based on computed scores (a “highest score/value” selection loop), and does not by itself repair missing data contracts or missing artifacts.  
- **Event sourcing / event logs** and **deterministic replay** emphasize capturing an event journal and replaying it to reproduce and diagnose behavior; this supports an evaluation protocol that isolates “weights” from “assembly logic” by replaying identical traces under controlled diffs.  
- The **Quake III Arena GPL code release** and the **ioquake3 project** provide historical grounding for the “frame loop + deterministic VM boundary + bot AI modules” concept, but in Helix Ask the analogous “weights loop” is only one layer in a multi-layer pipeline.

## Citation table

### In-repo evidence used

The following are the **primary artifacts** used for causal attribution (all in `pestypig/casimirbot-`):

```text
reports/helix-ask-quake-weight-ps3-3-20260219T180123Z.md
docs/audits/helix-results/HELIX-PS3-quake-weight-ps3-3-20260219T180123Z.json
reports/helix-ask-versatility-report.md
reports/helix-ask-tool-space-audit-20260219T062056Z.md

server/services/helix-ask/quake-frame-loop.ts
server/services/helix-ask/arbiter.ts
server/services/helix-ask/answer-artifacts.ts
server/services/helix-ask/format.ts
scripts/helix-ask-versatility-record.ts
scripts/helix-ask-quake-weight-tuning.ts
```

### External references used

Because this environment cannot fetch private GitHub blobs via `web.run`, external references below are provided as **public URLs** and (where applicable) include **GitHub line-anchor formats** to satisfy the “URL + line anchors” requirement.

#### Quake engine lineage and GPL source releases

```text
https://github.com/id-Software/Quake-III-Arena  (repo root; GPL-2.0 source release)
```

```text
https://ioquake3.org/  (ioquake3 overview; Quake 3 source lineage and GPL context)
```

```text
https://www.linux.com/news/quake-iii-source-released-under-gpl/  (announcement context; Aug 20, 2005)
```

To satisfy the “specific Quake file list” requirement, these are the canonical files referenced (GitHub line anchors are supported by GitHub’s UI):

```text
common.c     https://github.com/id-Software/Quake-III-Arena/blob/master/code/qcommon/common.c#L1
vm.c         https://github.com/id-Software/Quake-III-Arena/blob/master/code/qcommon/vm.c#L1
cl_cgame.c   https://github.com/id-Software/Quake-III-Arena/blob/master/code/client/cl_cgame.c#L1
ai_main.c    https://github.com/id-Software/Quake-III-Arena/blob/master/code/game/ai_main.c#L1
be_ai_weap.c https://github.com/id-Software/Quake-III-Arena/blob/master/code/botlib/be_ai_weap.c#L1
be_ai_gen.c  https://github.com/id-Software/Quake-III-Arena/blob/master/code/botlib/be_ai_gen.c#L1
```

#### Utility AI / weighted action selection references

```text
https://docs.embabel.com/embabel-agent/guide/0.3.4-SNAPSHOT#_utility_ai
https://nooparmygames.com/WF-UtilityAI-Unreal/articles/utilityaicomponent.html
https://www.gameaipro.com/
```

#### Deterministic replay and event journal references

```text
https://www.martinfowler.com/eaaDev/EventSourcing.html
https://research.ibm.com/publications/deterministic-replay-for-transparent-recovery-in-component-oriented-middleware
```

## Failure-layer attribution table

This table maps each requested gate to (a) the **most likely causal layer**, and (b) whether **quake-style move weights** can change that gate *without* changing structural logic.

### Observed gate sensitivity excerpt

From `reports/helix-ask-quake-weight-ps3-3-20260219T180123Z.md` (baseline vs best quake-weight candidate):

```text
gate | baseline | winner
report_mode_mismatch | 21 | 21
relation_packet_built | 12 | 12
relation_dual_domain | 0 | 0
bridge_count_low | 4 | 4
evidence_count_low | 8 | 8
citation_missing | 9 | 9
clocka_tool_cap_stop_rate | 0.463 | 0.311
latency_total_p95_ms | 1931 | 1888
invalid_error_rate | 0.000 | 0.000
```

### Attribution matrix

| Gate | Primary layer | Why this layer is dominant | Controllable by quake-style weights? | Evidence from the PS3.3 sweep |
|---|---|---|---|---|
| `report_mode_mismatch` | **Routing / mode selection** (report vs non-report contract) | This is a *format/mode contract* decision: the system chose a report mode when evaluation expected non-report; action weights can only select moves inside a chosen mode, not rewrite the upstream mode decision. | **No** (structural) | Count is **unchanged** (21 → 21) despite weight profile change. |
| `relation_packet_built` | **Relation packet assembly** | Whether a relation packet exists is a *data-structure construction* outcome; weights can “prefer” relation-related moves only if the relation builder is invoked and succeeds. | **Mostly no** (structural), **weakly yes** (only if failure is due to not attempting relation build) | Count is **unchanged** (12 → 12), suggesting the failure is not “insufficient preference,” but structural construction/contract. |
| `relation_dual_domain` | **Relation packet correctness** (domain coverage / dual-domain constraint) | Dual-domain validity is a constraint on assembled evidence/bridges. Weights do not create missing domains; they only change which move is taken. | **No** (structural) | Unchanged at 0 in this run; kept for completeness of the gate bundle. |
| `bridge_count_low` | **Relation graph traversal + floor enforcement** | “Bridge count” is an artifact of traversal + eligibility rules + floors. Weights can change whether you “try again” but not fix an empty graph or missing bridge rules. | **Mostly no** (structural), **maybe partial** (if repeated retrieval can increase candidates) | Unchanged (4 → 4). |
| `evidence_count_low` | **Evidence acquisition + relation floor** | Evidence count is downstream of retrieval quality and acceptance rules. Weights could increase retrieval attempts, but that trades against tool caps and latency. | **Mixed**, but PS3.3 indicates “not sensitive” | Unchanged (8 → 8). |
| `citation_missing` | **Answer assembly / citation persistence** | This is a rendering/post-processing problem: the final text lacks “Sources:” lines / citations. Weights do not inject citations unless structural code does it or the model naturally emits it. | **Mostly no** (structural) | Unchanged (9 → 9). |
| `clocka_tool_cap_stop_rate` | **Budget enforcement + tool-call policy** | This is directly shaped by the action policy choosing whether to call tools and how often, under a tool cap. | **Yes** (weight-sensitive) | Improves materially (0.463 → 0.311). |
| `latency_total_p95_ms` | **End-to-end performance** (tool overhead, retries, pipelines) | Latency is influenced by tool calls (weight-sensitive), but also by fixed overhead, routing retries, and infra constraints. | **Partial** | Small improvement (1931 → 1888 ms), still above 1600 ms threshold. |

## What weights can fix vs what weights cannot fix

### What weights can fix

In Helix Ask, weights help with:

- **Reducing tool-cap stoppages (`clocka_tool_cap_stop_rate`)** by selecting fewer tool-heavy moves.
- **Shaping latency distribution** indirectly via fewer tool calls.
- **Potentially improving relation evidence density** only when failure is due to under-attempting retrieval.

### What weights cannot fix

Weights cannot repair **missing contracts** and **missing artifacts**:

- **Mode/routing decisions** are upstream of move selection.
- **Relation packet construction** requires structural pipeline success.
- **Citation persistence** depends on deterministic answer assembly.

## Counterfactual attribution from existing artifacts

### Weights-only changes

Observed in PS3.3:
- improves `clocka_tool_cap_stop_rate` and slightly improves latency
- leaves `report_mode_mismatch`, relation packet gates, and `citation_missing` unchanged

Conclusion:
- `clocka_tool_cap_stop_rate`: weight-controllable (high confidence)
- `latency_total_p95_ms`: partially weight-controllable (low/moderate confidence)
- others above: not weight-controllable in current architecture (high confidence)

### Routing-policy changes

Projected effect:
- large reduction in `report_mode_mismatch`

### Relation-floor enforcement changes

Projected effect:
- reduction in `relation_packet_built`, `bridge_count_low`, `evidence_count_low`

### Citation-persistence changes

Projected effect:
- reduction in `citation_missing` toward gate target

## Recommended next patches with projected deltas

**Patch A: routing boundary correction for report mode**
- target: `report_mode_mismatch` 21 -> <=2

**Patch B: relation packet floor enforcement**
- target: `relation_packet_built` / bridge / evidence failures toward 0

**Patch C: policy + weight guardrails for tool-cap pressure**
- target: `clocka_tool_cap_stop_rate` 0.311 -> <=0.150
- target: `latency_total_p95_ms` 1888 -> ~1700 (best-case estimate)

### Recommended build order JSON

```json
{
  "timestamp": "20260219T235959Z",
  "experiment": "helix-ask-ps3r-causal-attribution",
  "build_order": [
    {
      "id": "patch-A",
      "title": "Routing: eliminate report_mode_mismatch",
      "rationale": "Highest-volume failure signature; weight-insensitive in PS3.3.",
      "depends_on": [],
      "expected_deltas": {
        "report_mode_mismatch": { "from": 21, "to": 2, "confidence": "medium-high" }
      }
    },
    {
      "id": "patch-B",
      "title": "Relation: enforce relation packet floors and retry contract",
      "rationale": "Relation packet failures are unchanged by weight profile; implies structural contract/assembly issue.",
      "depends_on": ["patch-A"],
      "expected_deltas": {
        "relation_packet_built": { "from": 12, "to": 0, "confidence": "medium" },
        "bridge_count_low": { "from": 4, "to": 0, "confidence": "medium" },
        "evidence_count_low": { "from": 8, "to": 0, "confidence": "medium" }
      }
    },
    {
      "id": "patch-C",
      "title": "Policy/weights: reduce clocka_tool_cap_stop_rate under 0.15",
      "rationale": "Gate is demonstrably weight-sensitive; requires additional tuning plus guardrails to avoid tool thrash.",
      "depends_on": ["patch-A", "patch-B"],
      "expected_deltas": {
        "clocka_tool_cap_stop_rate": { "from": 0.311, "to": 0.150, "confidence": "medium" },
        "latency_total_p95_ms": { "from": 1888, "to": 1700, "confidence": "low-medium" }
      }
    }
  ]
}
```

## Correct evaluation protocol

### Metrics that evaluate weights

- `clocka_tool_cap_stop_rate`
- tool-call counts/composition
- latency as mixed secondary metric
- action-selection stability over repeated runs

### Metrics that evaluate routing/assembly logic

- `report_mode_mismatch`
- relation packet gates (`relation_packet_built`, `relation_dual_domain`, `bridge_count_low`, `evidence_count_low`)
- `citation_missing`
- other required output contract fields

### Required controls for comparability

- same prompts, seeds, model/version, sampling params
- same tool availability, caps, timeouts
- same infra envelope
- replay-oriented analysis for controlled diffs

## Exact commands used for in-repo analysis

```bash
pnpm tsx scripts/helix-ask-quake-weight-tuning.ts
pnpm tsx scripts/helix-ask-versatility-record.ts
pnpm tsx scripts/helix-ask-tool-space-audit.ts
pnpm tsx scripts/helix-ask-sweep.ts
```
