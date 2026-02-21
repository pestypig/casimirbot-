# Vanity, Reform, and Destiny Evidence Ledger (2026-02-21)

Normalized from the research brief titled:
`Vanity, Reform, and Destiny: Integrating your train of thought into casimirbot's ideology system`.

Purpose:
- track claim-level evidence for this research direction
- map each claim to concrete CasimirBot proposal structures
- preserve maturity discipline (no over-claiming)

## Claim ledger

| claim_id | assertion | status | evidence_anchor | casimirbot_surface | deterministic_follow_up |
|---|---|---|---|---|---|
| VRD-001 | Attractiveness/vanity signals systematically affect social treatment. | confirmed | research brief citations: Langlois et al. meta-analysis | ideology nodes (`values-over-images`, `voice-integrity`) | add explicit node notes clarifying "signal vs identity" distinction |
| VRD-002 | Appearance can function as market capital (earnings and sorting effects). | confirmed | research brief citations: Hamermesh & Biddle | ideology + proposal prompts | define "aesthetic-capital-to-capability" path with non-extractive constraints |
| VRD-003 | Vanity channels increase manipulation attack surface (flattery, distortion, coercion). | inferred | synthesis in research brief | external pressure taxonomy + action gates | encode flattery/urgency/secrecy bundles with deterministic fail-close hooks |
| VRD-004 | Social comparison dynamics in online channels correlate with body-image and ED-related harm markers. | confirmed | research brief citations: 2024 review/meta-analysis | pressure guidance + UI loop-breaks | route high-pressure states to "pause + verify + boundary" guidance actions |
| VRD-005 | Body-positive interventions can improve immediate outcomes, implying baseline channel pressure is material. | confirmed | research brief citations: 2025 review/meta-analysis | artifact library | ship short and long-form artifacts for pressure interruption |
| VRD-006 | Platform amplification can over-expose already vulnerable users to harmful content. | inferred | research brief cites reporting based on internal research | ideology guidance endpoint | add vulnerability-sensitive warnings without deterministic diagnosis claims |
| VRD-007 | Fraud pressure is large and rising; investment scams are a leading loss class in U.S. reporting. | confirmed | research brief citations: FTC 2024 loss reporting | action-gates + warnings | enforce financial high-risk path to stricter checks |
| VRD-008 | Relationship-investment scams use repeated pressure scripts (attraction, trust escalation, urgency). | confirmed | research brief citations: CFTC/FinCEN guidance | pressure bundles + refusal scripts | add deterministic "romance + investment + urgency" warning bundle |
| VRD-009 | "Destiny as responsibility" maps to internal-locus behavior: response ownership via verification and boundaries. | inferred | conceptual synthesis in research brief | ideology invariants | expose "system advises, user decides" contract in guidance endpoint |
| VRD-010 | Reform should be implemented as iterative verified-feedback loops rather than attention-driven reactivity. | inferred | conceptual synthesis in research brief | belief-graph loop + UI + artifacts | add top-k anchor nodes and anti-reactivity loop-break actions |
| VRD-011 | Safer generation pattern is curated ideology nodes + runtime path generation, not value authoring by LLM. | confirmed | architecture guidance in research brief | docs + resolver design | treat runtime as routing layer, not ideology source-of-truth |
| VRD-012 | Violent metaphors should be operationalized as nonviolent protocols (verification, refusal, exit, reporting). | inferred | explicit safety reinterpretation in research brief | guidance warnings + artifacts + action gates | add explicit nonviolent protocol artifacts and route-level warnings |

## Proposal-structure crosswalk

| proposal_structure | role | target paths | acceptance checks |
|---|---|---|---|
| Ideology canonical tree | root values and branch semantics | `docs/ethos/ideology.json`, `docs/knowledge/ethos/*.md` | `npm run check`, `npm run test -- tests/ideology-dag.spec.ts` |
| Pressure taxonomy (shared) | typed pressure bundles for server/client parity | `shared/ideology/external-pressures.ts` (new), `client/src/lib/ideology-types.ts` | `npm run check` |
| Guidance resolver | pressure -> belief-graph inputs -> ranked ideology guidance | `server/services/ideology/guidance.ts` (new), `modules/analysis/belief-graph-loop.ts`, `server/routes/ethos.ts` | `npm run test -- tests/ideology-dag.spec.ts tests/ideology-telemetry.spec.ts` |
| Action gates under pressure | stricter guardrails for high-risk patterns | `server/services/ideology/action-gates.ts`, `server/routes/ethos.ts` | `npm run test -- tests/ideology-dag.spec.ts` |
| Artifact/whisper teaching layer | portable protocol cards + contextual reminders | `shared/ideology/ideology-artifacts.ts`, `server/services/ideology/artifacts.ts`, `client/src/lib/luma-ideology-whispers.ts` | `npm run test -- tests/helix-ask-answer-artifacts.spec.ts` |
| Ideology panel UX | pressure toggles + anchor recommendations + action delays | `client/src/components/IdeologyPanel.tsx`, `client/src/hooks/use-ideology-belief-graph.ts`, `client/src/hooks/use-ideology-artifacts.ts` | `npm run check` |
| Proposal system integration | turn research into repeatable proposal presets/workflows | `shared/proposals.ts`, `server/services/proposals/prompt-presets.ts`, `server/routes/proposals.ts`, `client/src/lib/agi/proposals.ts` | `npm run test -- tests/proposal-job-runner.spec.ts tests/nightly-proposals.spec.ts` |
| Vanity-facing generation surfaces | prevent "attention-only" optimization and inject integrity reminders | `server/routes/fashion.ts` | scoped route tests if introduced + `npm run check` |

## Unknown queue (must resolve before any higher-maturity claims)

1. Replace placeholder citation handles from the research draft with canonical source links and publication dates.
2. Validate whether additional tenant/auth constraints are required for a new ideology guidance endpoint.
3. Decide if pressure guidance output should be persisted as telemetry events or remain ephemeral.
4. Define policy for false-positive pressure detection and user override behavior.

## Maturity statement

- Current recommendation tier: `diagnostic` for architecture and behavior design.
- This ledger is evidence-to-implementation planning only and is not a certification artifact.
