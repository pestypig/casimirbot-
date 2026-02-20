# Helix Step 3 Narrow Proving Campaign

- run_id: versatility-1771552128885
- prompt_mix: 15 relation + 15 repo_technical + 15 ambiguous_general (45 prompts total)
- seeds: 7, 11, 13
- temperature: 0.2
- total_runs: 135

## 1) Gate metrics

- relation_packet_built_rate: 0.8667
- relation_dual_domain_ok_rate: 0.9333
- report_mode_correct_rate: 0.9333
- citation_presence_rate: 1.0000
- stub_text_detected_rate: 0.0000

## 2) Top failure signatures (count)

- report_mode_mismatch: 9
- relation_packet_built: 6
- intent_mismatch: 3
- relation_dual_domain: 3
- bridge_count_low: 3
- evidence_count_low: 3

## 3) Representative excerpts (9 total)

### Relation (3)
- `relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented` (seed=13, failures=intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0)
  - prompt: Could warp bubble progress violate mission ethos? How is that prevented?
  - excerpt: "In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos…"
- `relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented` (seed=11, failures=intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0)
  - prompt: Could warp bubble progress violate mission ethos? How is that prevented?
  - excerpt: "In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos…"
- `relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented` (seed=7, failures=intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0)
  - prompt: Could warp bubble progress violate mission ethos? How is that prevented?
  - excerpt: "In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos…"

### Repo technical (3)
- `repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask` (seed=13, failures=report_mode_mismatch:true)
  - prompt: Show pipeline stages captured in debug live events for Helix Ask.
  - excerpt: "A pipeline is an ordered sequence of stages where the output of one stage becomes the input to the next, often with checkpoints or gates between stages. [docs/knowledge/pipeline.md] 1. A pipeline is an ordered sequence o…"
- `repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask` (seed=11, failures=report_mode_mismatch:true)
  - prompt: Show pipeline stages captured in debug live events for Helix Ask.
  - excerpt: "A pipeline is an ordered sequence of stages where the output of one stage becomes the input to the next, often with checkpoints or gates between stages. [docs/knowledge/pipeline.md] 1. A pipeline is an ordered sequence o…"
- `repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask` (seed=7, failures=report_mode_mismatch:true)
  - prompt: Show pipeline stages captured in debug live events for Helix Ask.
  - excerpt: "A pipeline is an ordered sequence of stages where the output of one stage becomes the input to the next, often with checkpoints or gates between stages. [docs/knowledge/pipeline.md] 1. A pipeline is an ordered sequence o…"

### Ambiguous general (3)
- `ambiguous_16_how-can-ambiguity-be-reduced-in-prompts` (seed=13, failures=none)
  - prompt: How can ambiguity be reduced in prompts?
  - excerpt: "Mechanism: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time…"
- `ambiguous_16_how-can-ambiguity-be-reduced-in-prompts` (seed=7, failures=none)
  - prompt: How can ambiguity be reduced in prompts?
  - excerpt: "Mechanism: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time…"
- `ambiguous_16_how-can-ambiguity-be-reduced-in-prompts` (seed=11, failures=none)
  - prompt: How can ambiguity be reduced in prompts?
  - excerpt: "Mechanism: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time…"

## 4) Recommendation

- proceed_to_heavy = false
- why: False because relation_packet_built_rate=0.867, relation_dual_domain_ok_rate=0.933, and report_mode_correct_rate=0.933 are below heavy-run readiness thresholds.

## Artifact paths

- output_root: artifacts/experiments/helix-step3-narrow-proving
- output_run_dir: artifacts/experiments/helix-step3-narrow-proving/versatility-1771552128885
- report: reports/helix-step3-narrow-proving.md
