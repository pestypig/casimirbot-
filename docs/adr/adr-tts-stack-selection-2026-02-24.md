# ADR: TTS Stack Selection and Promotion Policy (2026-02-24)

- Status: Accepted
- Date: 2026-02-24
- Scope: Helix Ask TTS production lane

## Decision

1. Production-primary stack: **NVIDIA NeMo TTS**.
2. Production-backup stack: **ESPnet2** (activated only when NeMo is blocked).
3. Existing Audiocraft/MusicGen lane remains available as **experimental only**.

## Policy lock

- Non-commercial or unclear **weights licensing** is an automatic **NO-GO** for production promotion.
- Code-license compliance and weights-license compliance are distinct gates and both must pass.
- Promotion requires deterministic manifests proving model provenance, checksum, and license terms.

## Rationale

- NeMo has strong operational fit for deterministic model packaging and deployment workflows.
- ESPnet2 offers a viable fallback with acceptable architecture overlap.
- Keeping Audiocraft experimental avoids destructive replacement while preserving research velocity.

## Consequences

- New production job surfaces should use `tts_prod_train_nemo` naming.
- Existing `/api/train/*` and `/api/voice/speak` contracts remain backward-compatible.
- Production readiness can only be claimed when both code and weight licenses are explicitly validated.
