# Helix Dottie Situational Transcript Report

## Run Metadata
- Timestamp (UTC): 2026-02-24T22:09:24.369Z
- Fixture: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\test-inputs\helix-dottie-situational-2026-02-24T18-42-10Z.json`
- Head commit: `ba02cdfe`
- Scenario count: 14
- Passed: 14
- Failed: 0

## Situation -> Dot Transcript Table

| Scenario | Situation narration (event) | LLM candidate response | Dot transcript output | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|---|---|
| S01-parity-pass | voice certainty parity allowed | Reasoned action update | Reasoned action update | allowed | allowed | PASS |
| S02-parity-fail | voice certainty above text certainty must suppress | Confirmed action update | [suppressed:contract_violation] | suppressed:contract_violation | suppressed:contract_violation | PASS |
| S03-evidence-pass | repo-attributed callout with evidence allowed | Evidence cited update | Evidence cited update | allowed | allowed | PASS |
| S04-evidence-fail-missing | repo-attributed claim with missing evidence suppressed deterministically | No evidence update | [suppressed:missing_evidence] | suppressed:missing_evidence | suppressed:missing_evidence | PASS |
| S05-evidence-fail-nondeterministic | repo-attributed nondeterministic claim suppressed | Non deterministic update | [suppressed:contract_violation] | suppressed:contract_violation | suppressed:contract_violation | PASS |
| S06-context-tier0-suppress | tier0 context suppression | Tier0 quiet | [suppressed:voice_context_ineligible] | suppressed:voice_context_ineligible | suppressed:voice_context_ineligible | PASS |
| S07-session-idle-suppress | session idle suppression | Idle quiet | [suppressed:voice_context_ineligible] | suppressed:voice_context_ineligible | suppressed:voice_context_ineligible | PASS |
| S08-voice-mode-critical-only-suppress | critical_only suppresses info priority | Critical only gate | [suppressed:voice_context_ineligible] | suppressed:voice_context_ineligible | suppressed:voice_context_ineligible | PASS |
| S09-dedupe-first-pass | first dedupe key should pass | Dedupe first | Dedupe first | allowed | allowed | PASS |
| S10-dedupe-second-suppress | duplicate key should suppress with stable reason | Dedupe second | [suppressed:dedupe_cooldown] | suppressed:dedupe_cooldown | suppressed:dedupe_cooldown | PASS |
| S11-ackref-propagation-and-metric | Mission M-ACK event E-ACK-1: ackRefId propagates to debrief and closure metric is deterministic | No candidate voice text in this scenario. | No voice output requested for this scenario. | ackRefId=ACK-REF-11; trigger_to_debrief_closed_ms=15000 | ackRefId=ACK-REF-11; trigger_to_debrief_closed_ms=15000 | PASS |
| S12-ack-metric-nonnegative-past-event | Mission M-ACK2 event E-ACK-2: ack before event timestamp is clamped non-negative | No candidate voice text in this scenario. | No voice output requested for this scenario. | ackRefId=ACK-REF-12; trigger_to_debrief_closed_ms=0 | ackRefId=ACK-REF-12; trigger_to_debrief_closed_ms=0 | PASS |
| S13-replay-consistency-1 | same input run 1 yields deterministic suppression reason | Replay deterministic | [suppressed:contract_violation] | suppressed:contract_violation | suppressed:contract_violation | PASS |
| S14-replay-consistency-2 | same input run 2 yields identical suppression reason | Replay deterministic | [suppressed:contract_violation] | suppressed:contract_violation | suppressed:contract_violation | PASS |

## Policy-Trace Correlation

| missionId | objectiveId | gapId | eventId | traceId | suppressionReason | policyClock | replayMeta | ackRefId | trigger_to_debrief_closed_ms |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  | null |  |  |
|  |  |  |  |  | contract_violation |  | {"textCertainty":"hypothesis","voiceCertainty":"confirmed","deterministic":true,"evidenceRefCount":1} |  |  |
|  |  |  |  |  |  |  | null |  |  |
|  |  |  |  |  | missing_evidence |  | {"textCertainty":"hypothesis","voiceCertainty":"hypothesis","deterministic":true,"evidenceRefCount":0} |  |  |
|  |  |  |  |  | contract_violation |  | {"textCertainty":"hypothesis","voiceCertainty":"hypothesis","deterministic":false,"evidenceRefCount":1} |  |  |
|  |  |  |  |  | voice_context_ineligible |  | null |  |  |
|  |  |  |  |  | voice_context_ineligible |  | null |  |  |
|  |  |  |  |  | voice_context_ineligible |  | null |  |  |
| M-DEDUPE |  |  | E-DEDUPE-1 |  |  |  | null |  |  |
| M-DEDUPE |  |  | E-DEDUPE-1 |  | dedupe_cooldown |  | null |  |  |
| M-ACK |  |  | E-ACK-1 |  |  |  | null | ACK-REF-11 | 15000 |
| M-ACK2 |  |  | E-ACK-2 |  |  |  | null | ACK-REF-12 | 0 |
|  |  |  |  |  | contract_violation |  | {"textCertainty":"reasoned","voiceCertainty":"confirmed","deterministic":true,"evidenceRefCount":1} |  |  |
|  |  |  |  |  | contract_violation |  | {"textCertainty":"reasoned","voiceCertainty":"confirmed","deterministic":true,"evidenceRefCount":1} |  |  |

## Replay Determinism Check
- S13-replay-consistency-1 vs S14-replay-consistency-2: PASS (matched:suppressed:contract_violation)

## Verdict
- GO (scenario contract satisfied)
