# Helix Dot Gap Backlog

## Highest-impact gaps

1. Contract enforcement is incomplete
- Impact: non-deterministic callout style, certainty drift, suppression ambiguity.
- Required: hard runtime validator for Operator Contract v1.

2. Mission loop wiring is partial
- Impact: ask outputs do not consistently become mission-state transitions.
- Required: stable event projection from ask ladder/debug stream to mission-board events.

3. Repo-api quality degradation remains
- Impact: operator sees fallback-like wording despite successful provider invocation.
- Required: strengthen repo evidence coverage and fallback/guard wording policies.

4. Suppression explainability visibility is inconsistent
- Impact: silent-failure perception and operator trust erosion.
- Required: UI surfacing for suppression reasons and cooldown context.

## Priority tasks (15-25)

1. Operator Contract v1 serializer + validator (`backend`, M)
2. Suppression ledger with stable dedupe/cooldown (`backend`, M)
3. Ask live-events -> mission-board projection (`backend`, L)
4. Suppression reason UI visibility (`frontend`, S)
5. Voice projection-only enforcement (`backend/frontend`, M)
6. Routing degradation transition detector (`backend`, M)
7. Provenance minimums per classification (`backend`, M)
8. Lane C regression harness (`eval`, L)
9. Mission snapshot reducer hardening (`backend`, M)
10. Ack/debrief linkage (`backend/frontend`, M)
11. Voice/context control panel hardening (`frontend`, S)
12. Callout contract coverage reporter (`eval/backend`, S)
13. Impact tag taxonomy enforcement (`product/backend`, S)
14. Mission-overwatch SLO gate integration (`ops/eval`, M)
15. Admission-control degradation callout mapping (`backend`, S)
16. Evidence ref format standard (`backend`, S)
17. Operator mode toggle in ask panel (`frontend`, S)
18. Narrative-drift lint for callouts (`eval`, S)
19. Context-ineligible voice suppression enforcement (`backend/frontend`, S)
20. Mission go-board spec alignment pass (`product/backend`, M)

## Done criteria (global)

- Contract conformance >= 0.98 on eval suite.
- Voice certainty parity always holds.
- Suppressed callouts always include typed reason.
- Replay determinism >= 0.99.
- Lane C regression suite has measurable quality trend improvements.
