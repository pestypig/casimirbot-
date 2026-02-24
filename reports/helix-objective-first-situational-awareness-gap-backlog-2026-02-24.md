# Helix Objective-First Situational Awareness Gap Backlog

Date: 2026-02-24  
Scope: Helix Ask UI + Mission Overwatch + Voice parity path

Severity legend: P0 (blocker), P1 (high), P2 (medium)  
Effort legend: S (<=2 days), M (<=2 weeks), L (>2 weeks)

| ID | Gap | Severity | Effort | Primary files | Acceptance |
| --- | --- | --- | --- | --- | --- |
| OBJ-001 | No first-class objective card in Helix Ask UI | P0 | M | `client/src/components/helix/HelixAskPill.tsx` | Objective state visible on first response render |
| OBJ-002 | No gap tracker UI linked to mission events | P0 | M | `client/src/components/helix/HelixAskPill.tsx`, `client/src/lib/mission-overwatch/index.ts` | Top 1-3 open gaps shown with deterministic ordering |
| POL-001 | Eligibility logic still split across layers | P0 | M | `server/routes/voice.ts`, `server/services/mission-overwatch/salience.ts`, `client/src/lib/mission-overwatch/index.ts` | Shared evaluator used by server and client projection |
| POL-002 | Suppression reasons not fully operator-visible in UI | P1 | S | `client/src/components/helix/HelixAskPill.tsx` | Suppressed callouts show reason + cooldown metadata |
| EVT-001 | Objective-gapped context-events not guaranteed from live ask path | P1 | M | `server/routes/agi.plan.ts`, mission-overwatch integration surfaces | Runtime trace shows ask -> context-event -> board -> callout |
| AUD-001 | Transcript/debug correlation report not first-class in CI | P1 | S | `scripts/helix-dottie-situational-report.ts` | Report includes eventId/traceId/suppression parity |
| SLO-001 | No explicit UI SLO for objective/gap panel refresh | P2 | S | UI metrics instrumentation surfaces | p95 objective/gap update SLO documented and gated |
| GOV-001 | Policy clock mode not surfaced in operator debug panel | P2 | S | `server/routes/voice.ts`, UI debug projection | `policyClock` shown as `wall` or `replay` per event |

## Ordered execution

1. POL-001
2. OBJ-001
3. OBJ-002
4. POL-002
5. EVT-001
6. AUD-001
7. SLO-001
8. GOV-001

## Exit criteria

- Zero parity violations in replay suite.
- Deterministic suppression reason consistency across reruns.
- Objective and gap updates visible in Helix Ask UI without page transition.
- Casimir verify remains PASS for all batches.
