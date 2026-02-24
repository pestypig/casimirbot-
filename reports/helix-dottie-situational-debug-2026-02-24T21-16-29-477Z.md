# Helix Dottie Situational Runtime Debug Report

## Run Metadata
- Timestamp (UTC): 2026-02-24T21:16:29.477Z
- Fixture: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\test-inputs\helix-dottie-situational-2026-02-24T18-42-10Z.json`
- Head commit: `2b3cd899`
- Raw machine artifact: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\test-results\helix-dottie-situational-run-2026-02-24T21-16-29-477Z.json`

## S01-parity-pass - PASS
- Intent: voice certainty parity allowed
- Situation narration: voice certainty parity allowed
- LLM candidate response: Reasoned action update
- Dot transcript output: Reasoned action update
- Expected: allowed
- Actual: allowed

### Reasoning Markers
```json
{}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Reasoned action update",
  "priority": "action",
  "textCertainty": "reasoned",
  "voiceCertainty": "reasoned",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "dryRun": true,
  "provider": "dry-run",
  "voiceProfile": "default",
  "metering": {
    "requestCount": 1,
    "charCount": 22,
    "durationMs": 990,
    "tenantId": "single-tenant"
  }
}
```


## S02-parity-fail - PASS
- Intent: voice certainty above text certainty must suppress
- Situation narration: voice certainty above text certainty must suppress
- LLM candidate response: Confirmed action update
- Dot transcript output: [suppressed:contract_violation]
- Expected: suppressed:contract_violation
- Actual: suppressed:contract_violation

### Reasoning Markers
```json
{
  "suppressionReason": "contract_violation",
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Confirmed action update",
  "priority": "action",
  "textCertainty": "hypothesis",
  "voiceCertainty": "confirmed",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "contract_violation",
  "suppressionReason": "contract_violation",
  "traceId": null,
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```


## S03-evidence-pass - PASS
- Intent: repo-attributed callout with evidence allowed
- Situation narration: repo-attributed callout with evidence allowed
- LLM candidate response: Evidence cited update
- Dot transcript output: Evidence cited update
- Expected: allowed
- Actual: allowed

### Reasoning Markers
```json
{}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Evidence cited update",
  "priority": "warn",
  "textCertainty": "hypothesis",
  "voiceCertainty": "hypothesis",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/architecture/voice-service-contract.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "dryRun": true,
  "provider": "dry-run",
  "voiceProfile": "default",
  "metering": {
    "requestCount": 1,
    "charCount": 21,
    "durationMs": 945,
    "tenantId": "single-tenant"
  }
}
```


## S04-evidence-fail-missing - PASS
- Intent: repo-attributed claim with missing evidence suppressed deterministically
- Situation narration: repo-attributed claim with missing evidence suppressed deterministically
- LLM candidate response: No evidence update
- Dot transcript output: [suppressed:missing_evidence]
- Expected: suppressed:missing_evidence
- Actual: suppressed:missing_evidence

### Reasoning Markers
```json
{
  "suppressionReason": "missing_evidence",
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "hypothesis",
    "deterministic": true,
    "evidenceRefCount": 0
  }
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "No evidence update",
  "priority": "warn",
  "textCertainty": "hypothesis",
  "voiceCertainty": "hypothesis",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": []
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "missing_evidence",
  "suppressionReason": "missing_evidence",
  "traceId": null,
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "hypothesis",
    "deterministic": true,
    "evidenceRefCount": 0
  }
}
```


## S05-evidence-fail-nondeterministic - PASS
- Intent: repo-attributed nondeterministic claim suppressed
- Situation narration: repo-attributed nondeterministic claim suppressed
- LLM candidate response: Non deterministic update
- Dot transcript output: [suppressed:contract_violation]
- Expected: suppressed:contract_violation
- Actual: suppressed:contract_violation

### Reasoning Markers
```json
{
  "suppressionReason": "contract_violation",
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "hypothesis",
    "deterministic": false,
    "evidenceRefCount": 1
  }
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Non deterministic update",
  "priority": "warn",
  "textCertainty": "hypothesis",
  "voiceCertainty": "hypothesis",
  "deterministic": false,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/helix-ask-agent-policy.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "contract_violation",
  "suppressionReason": "contract_violation",
  "traceId": null,
  "replayMeta": {
    "textCertainty": "hypothesis",
    "voiceCertainty": "hypothesis",
    "deterministic": false,
    "evidenceRefCount": 1
  }
}
```


## S06-context-tier0-suppress - PASS
- Intent: tier0 context suppression
- Situation narration: tier0 context suppression
- LLM candidate response: Tier0 quiet
- Dot transcript output: [suppressed:voice_context_ineligible]
- Expected: suppressed:voice_context_ineligible
- Actual: suppressed:voice_context_ineligible

### Reasoning Markers
```json
{
  "suppressionReason": "voice_context_ineligible"
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Tier0 quiet",
  "priority": "info",
  "contextTier": "tier0"
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "voice_context_ineligible",
  "traceId": null
}
```


## S07-session-idle-suppress - PASS
- Intent: session idle suppression
- Situation narration: session idle suppression
- LLM candidate response: Idle quiet
- Dot transcript output: [suppressed:voice_context_ineligible]
- Expected: suppressed:voice_context_ineligible
- Actual: suppressed:voice_context_ineligible

### Reasoning Markers
```json
{
  "suppressionReason": "voice_context_ineligible"
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Idle quiet",
  "priority": "info",
  "sessionState": "idle"
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "voice_context_ineligible",
  "traceId": null
}
```


## S08-voice-mode-critical-only-suppress - PASS
- Intent: critical_only suppresses info priority
- Situation narration: critical_only suppresses info priority
- LLM candidate response: Critical only gate
- Dot transcript output: [suppressed:voice_context_ineligible]
- Expected: suppressed:voice_context_ineligible
- Actual: suppressed:voice_context_ineligible

### Reasoning Markers
```json
{
  "suppressionReason": "voice_context_ineligible"
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Critical only gate",
  "priority": "info",
  "voiceMode": "critical_only"
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "voice_context_ineligible",
  "traceId": null
}
```


## S09-dedupe-first-pass - PASS
- Intent: first dedupe key should pass
- Situation narration: first dedupe key should pass
- LLM candidate response: Dedupe first
- Dot transcript output: Dedupe first
- Expected: allowed
- Actual: allowed

### Reasoning Markers
```json
{}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Dedupe first",
  "priority": "warn",
  "missionId": "M-DEDUPE",
  "eventId": "E-DEDUPE-1",
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "dryRun": true,
  "provider": "dry-run",
  "voiceProfile": "default",
  "metering": {
    "requestCount": 1,
    "charCount": 12,
    "durationMs": 540,
    "tenantId": "single-tenant",
    "missionId": "M-DEDUPE"
  }
}
```


## S10-dedupe-second-suppress - PASS
- Intent: duplicate key should suppress with stable reason
- Situation narration: duplicate key should suppress with stable reason
- LLM candidate response: Dedupe second
- Dot transcript output: [suppressed:dedupe_cooldown]
- Expected: suppressed:dedupe_cooldown
- Actual: suppressed:dedupe_cooldown

### Reasoning Markers
```json
{
  "suppressionReason": "dedupe_cooldown"
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Dedupe second",
  "priority": "warn",
  "missionId": "M-DEDUPE",
  "eventId": "E-DEDUPE-1",
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "dedupe_cooldown",
  "missionId": "M-DEDUPE",
  "eventId": "E-DEDUPE-1"
}
```


## S11-ackref-propagation-and-metric - PASS
- Intent: ackRefId propagates to debrief and closure metric is deterministic
- Situation narration: Mission M-ACK event E-ACK-1: ackRefId propagates to debrief and closure metric is deterministic
- LLM candidate response: No candidate voice text in this scenario.
- Dot transcript output: No voice output requested for this scenario.
- Expected: ackRefId=ACK-REF-11; trigger_to_debrief_closed_ms=15000
- Actual: ackRefId=ACK-REF-11; trigger_to_debrief_closed_ms=15000

### Reasoning Markers
```json
{
  "ackRefId": "ACK-REF-11",
  "triggerToDebriefClosedMs": 15000
}
```

### Runtime Steps
1. `POST /api/mission-board/M-ACK/context-events` -> status 200
Request:
```json
{
  "eventId": "E-ACK-1",
  "eventType": "action_required",
  "classification": "action",
  "text": "Mission M-ACK event E-ACK-1: ackRefId propagates to debrief and closure metric is deterministic",
  "ts": "2026-02-24T12:00:00.000Z",
  "tier": "tier1",
  "sessionState": "active",
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "event": {
    "eventId": "E-ACK-1",
    "missionId": "M-ACK",
    "type": "action_required",
    "classification": "action",
    "text": "[context:tier1/active] Mission M-ACK event E-ACK-1: ackRefId propagates to debrief and closure metric is deterministic",
    "ts": "2026-02-24T12:00:00.000Z",
    "evidenceRefs": [
      "docs/helix-ask-flow.md#L1"
    ],
    "contextTier": "tier1",
    "sessionState": "active"
  },
  "snapshot": {
    "missionId": "M-ACK",
    "phase": "observe",
    "status": "active",
    "updatedAt": "2026-02-24T12:00:00.000Z",
    "unresolvedCritical": 0
  },
  "traceId": null
}
```

2. `POST /api/mission-board/M-ACK/ack` -> status 200
Request:
```json
{
  "eventId": "E-ACK-1",
  "ackRefId": "ACK-REF-11",
  "actorId": "operator-generated",
  "ts": "2026-02-24T12:00:15.000Z"
}
```

Response:
```json
{
  "receipt": {
    "missionId": "M-ACK",
    "eventId": "E-ACK-1",
    "ackRefId": "ACK-REF-11",
    "actorId": "operator-generated",
    "ts": "2026-02-24T12:00:15.000Z"
  },
  "metrics": {
    "trigger_to_debrief_closed_ms": 15000
  },
  "snapshot": {
    "missionId": "M-ACK",
    "phase": "observe",
    "status": "active",
    "updatedAt": "2026-02-24T12:00:15.000Z",
    "unresolvedCritical": 0
  }
}
```

3. `GET /api/mission-board/M-ACK/events?limit=50` -> status 200
Response:
```json
{
  "missionId": "M-ACK",
  "events": [
    {
      "eventId": "E-ACK-1",
      "missionId": "M-ACK",
      "type": "action_required",
      "classification": "action",
      "text": "[context:tier1/active] Mission M-ACK event E-ACK-1: ackRefId propagates to debrief and closure metric is deterministic",
      "ts": "2026-02-24T12:00:00.000Z",
      "evidenceRefs": [
        "docs/helix-ask-flow.md#L1"
      ],
      "contextTier": "tier1",
      "sessionState": "active"
    },
    {
      "eventId": "ack:E-ACK-1:1771934415000",
      "missionId": "M-ACK",
      "type": "state_change",
      "classification": "info",
      "text": "Acknowledged E-ACK-1",
      "ts": "2026-02-24T12:00:15.000Z",
      "fromState": "pending",
      "toState": "active",
      "evidenceRefs": [
        "E-ACK-1"
      ],
      "derivedFromEventId": "E-ACK-1",
      "ackRefId": "ACK-REF-11"
    },
    {
      "eventId": "debrief:closure:E-ACK-1:1771934415000",
      "missionId": "M-ACK",
      "type": "debrief",
      "classification": "info",
      "text": "Debrief closed for E-ACK-1",
      "ts": "2026-02-24T12:00:15.000Z",
      "evidenceRefs": [
        "E-ACK-1"
      ],
      "derivedFromEventId": "E-ACK-1",
      "ackRefId": "ACK-REF-11",
      "metrics": {
        "trigger_to_debrief_closed_ms": 15000
      }
    }
  ],
  "cursor": 0,
  "nextCursor": null
}
```


## S12-ack-metric-nonnegative-past-event - PASS
- Intent: ack before event timestamp is clamped non-negative
- Situation narration: Mission M-ACK2 event E-ACK-2: ack before event timestamp is clamped non-negative
- LLM candidate response: No candidate voice text in this scenario.
- Dot transcript output: No voice output requested for this scenario.
- Expected: ackRefId=ACK-REF-12; trigger_to_debrief_closed_ms=0
- Actual: ackRefId=ACK-REF-12; trigger_to_debrief_closed_ms=0

### Reasoning Markers
```json
{
  "ackRefId": "ACK-REF-12",
  "triggerToDebriefClosedMs": 0
}
```

### Runtime Steps
1. `POST /api/mission-board/M-ACK2/context-events` -> status 200
Request:
```json
{
  "eventId": "E-ACK-2",
  "eventType": "action_required",
  "classification": "action",
  "text": "Mission M-ACK2 event E-ACK-2: ack before event timestamp is clamped non-negative",
  "ts": "2026-02-24T12:00:10.000Z",
  "tier": "tier1",
  "sessionState": "active",
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "event": {
    "eventId": "E-ACK-2",
    "missionId": "M-ACK2",
    "type": "action_required",
    "classification": "action",
    "text": "[context:tier1/active] Mission M-ACK2 event E-ACK-2: ack before event timestamp is clamped non-negative",
    "ts": "2026-02-24T12:00:10.000Z",
    "evidenceRefs": [
      "docs/helix-ask-flow.md#L1"
    ],
    "contextTier": "tier1",
    "sessionState": "active"
  },
  "snapshot": {
    "missionId": "M-ACK2",
    "phase": "observe",
    "status": "active",
    "updatedAt": "2026-02-24T12:00:10.000Z",
    "unresolvedCritical": 0
  },
  "traceId": null
}
```

2. `POST /api/mission-board/M-ACK2/ack` -> status 200
Request:
```json
{
  "eventId": "E-ACK-2",
  "ackRefId": "ACK-REF-12",
  "actorId": "operator-generated",
  "ts": "2026-02-24T12:00:05.000Z"
}
```

Response:
```json
{
  "receipt": {
    "missionId": "M-ACK2",
    "eventId": "E-ACK-2",
    "ackRefId": "ACK-REF-12",
    "actorId": "operator-generated",
    "ts": "2026-02-24T12:00:05.000Z"
  },
  "metrics": {
    "trigger_to_debrief_closed_ms": 0
  },
  "snapshot": {
    "missionId": "M-ACK2",
    "phase": "observe",
    "status": "active",
    "updatedAt": "2026-02-24T12:00:10.000Z",
    "unresolvedCritical": 0
  }
}
```

3. `GET /api/mission-board/M-ACK2/events?limit=50` -> status 200
Response:
```json
{
  "missionId": "M-ACK2",
  "events": [
    {
      "eventId": "ack:E-ACK-2:1771934405000",
      "missionId": "M-ACK2",
      "type": "state_change",
      "classification": "info",
      "text": "Acknowledged E-ACK-2",
      "ts": "2026-02-24T12:00:05.000Z",
      "fromState": "pending",
      "toState": "active",
      "evidenceRefs": [
        "E-ACK-2"
      ],
      "derivedFromEventId": "E-ACK-2",
      "ackRefId": "ACK-REF-12"
    },
    {
      "eventId": "debrief:closure:E-ACK-2:1771934405000",
      "missionId": "M-ACK2",
      "type": "debrief",
      "classification": "info",
      "text": "Debrief closed for E-ACK-2",
      "ts": "2026-02-24T12:00:05.000Z",
      "evidenceRefs": [
        "E-ACK-2"
      ],
      "derivedFromEventId": "E-ACK-2",
      "ackRefId": "ACK-REF-12",
      "metrics": {
        "trigger_to_debrief_closed_ms": 0
      }
    },
    {
      "eventId": "E-ACK-2",
      "missionId": "M-ACK2",
      "type": "action_required",
      "classification": "action",
      "text": "[context:tier1/active] Mission M-ACK2 event E-ACK-2: ack before event timestamp is clamped non-negative",
      "ts": "2026-02-24T12:00:10.000Z",
      "evidenceRefs": [
        "docs/helix-ask-flow.md#L1"
      ],
      "contextTier": "tier1",
      "sessionState": "active"
    }
  ],
  "cursor": 0,
  "nextCursor": null
}
```


## S13-replay-consistency-1 - PASS
- Intent: same input run 1 yields deterministic suppression reason
- Situation narration: same input run 1 yields deterministic suppression reason
- LLM candidate response: Replay deterministic
- Dot transcript output: [suppressed:contract_violation]
- Expected: suppressed:contract_violation
- Actual: suppressed:contract_violation

### Reasoning Markers
```json
{
  "suppressionReason": "contract_violation",
  "replayMeta": {
    "textCertainty": "reasoned",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Replay deterministic",
  "priority": "action",
  "textCertainty": "reasoned",
  "voiceCertainty": "confirmed",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "contract_violation",
  "suppressionReason": "contract_violation",
  "traceId": null,
  "replayMeta": {
    "textCertainty": "reasoned",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```


## S14-replay-consistency-2 - PASS
- Intent: same input run 2 yields identical suppression reason
- Situation narration: same input run 2 yields identical suppression reason
- LLM candidate response: Replay deterministic
- Dot transcript output: [suppressed:contract_violation]
- Expected: suppressed:contract_violation
- Actual: suppressed:contract_violation

### Reasoning Markers
```json
{
  "suppressionReason": "contract_violation",
  "replayMeta": {
    "textCertainty": "reasoned",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```

### Runtime Steps
1. `POST /api/voice/speak` -> status 200
Request:
```json
{
  "text": "Replay deterministic",
  "priority": "action",
  "textCertainty": "reasoned",
  "voiceCertainty": "confirmed",
  "deterministic": true,
  "repoAttributed": true,
  "evidenceRefs": [
    "docs/helix-ask-flow.md#L1"
  ]
}
```

Response:
```json
{
  "ok": true,
  "suppressed": true,
  "reason": "contract_violation",
  "suppressionReason": "contract_violation",
  "traceId": null,
  "replayMeta": {
    "textCertainty": "reasoned",
    "voiceCertainty": "confirmed",
    "deterministic": true,
    "evidenceRefCount": 1
  }
}
```


## Policy-Trace Correlation
```json
[
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": null,
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "contract_violation",
    "replayMeta": {
      "textCertainty": "hypothesis",
      "voiceCertainty": "confirmed",
      "deterministic": true,
      "evidenceRefCount": 1
    },
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": null,
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "missing_evidence",
    "replayMeta": {
      "textCertainty": "hypothesis",
      "voiceCertainty": "hypothesis",
      "deterministic": true,
      "evidenceRefCount": 0
    },
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "contract_violation",
    "replayMeta": {
      "textCertainty": "hypothesis",
      "voiceCertainty": "hypothesis",
      "deterministic": false,
      "evidenceRefCount": 1
    },
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "voice_context_ineligible",
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "voice_context_ineligible",
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "voice_context_ineligible",
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": "M-DEDUPE",
    "eventId": "E-DEDUPE-1",
    "traceId": null,
    "suppressionReason": null,
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": "M-DEDUPE",
    "eventId": "E-DEDUPE-1",
    "traceId": null,
    "suppressionReason": "dedupe_cooldown",
    "replayMeta": null,
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": "M-ACK",
    "eventId": "E-ACK-1",
    "traceId": null,
    "suppressionReason": null,
    "replayMeta": null,
    "ackRefId": "ACK-REF-11",
    "trigger_to_debrief_closed_ms": 15000
  },
  {
    "missionId": "M-ACK2",
    "eventId": "E-ACK-2",
    "traceId": null,
    "suppressionReason": null,
    "replayMeta": null,
    "ackRefId": "ACK-REF-12",
    "trigger_to_debrief_closed_ms": 0
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "contract_violation",
    "replayMeta": {
      "textCertainty": "reasoned",
      "voiceCertainty": "confirmed",
      "deterministic": true,
      "evidenceRefCount": 1
    },
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  },
  {
    "missionId": null,
    "eventId": null,
    "traceId": null,
    "suppressionReason": "contract_violation",
    "replayMeta": {
      "textCertainty": "reasoned",
      "voiceCertainty": "confirmed",
      "deterministic": true,
      "evidenceRefCount": 1
    },
    "ackRefId": null,
    "trigger_to_debrief_closed_ms": null
  }
]
```

## Replay Determinism
```json
{
  "scenarioA": "S13-replay-consistency-1",
  "scenarioB": "S14-replay-consistency-2",
  "pass": true,
  "details": "matched:suppressed:contract_violation"
}
```
