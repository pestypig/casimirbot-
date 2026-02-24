# TTS Prod Stack Wave 1 Closure Report (2026-02-24)

## Ordered commit table (Prompt 0..7)

| Prompt | Commit | Summary |
|---|---|---|
| 0 | `463434b` | Initialized wave ledger and deterministic reporting template. |
| 1 | `7337f42` | Added NeMo-first ADR and licensing policy lock. |
| 2 | `33e1d6d` | Added weights manifest schema/example and validator alias. |
| 3 | `1c2dfb5` | Added `tts_prod_train_nemo` scaffold with deterministic blocked fallback. |
| 4 | `140eb7e` | Wired train route integration for `tts_prod_train_nemo`. |
| 5 | `d5eaa07` | Added deterministic test coverage for lane/gate behavior. |
| 6 | `80ff65a` | Published runbooks and operator command surface. |
| 7 | `HEAD (prompt-7 commit)` | Final closure report and ledger finalization. |

## Artifact and gate status table

| Gate/Surface | Status | Evidence |
|---|---|---|
| Weights manifest schema + validator | PASS | `configs/voice/weights-manifest.schema.json`, `scripts/voice/verify_weights_manifest.py` |
| Train route (`tts_prod_train_nemo`) | PASS | `server/routes/train-status.ts` + route tests |
| Deterministic test suite for wave scope | PASS | vitest group (`train-status`, `voice-bundle`, `voice.offline-core`, `voice.weights-manifest`) |
| Casimir verification gate | PASS | runId `8`, integrity true |

## GO/NO-GO decision

- **GO with constraints** for additive production-lane scaffolding.
- **NO-GO** for production promotion if weights license is unclear/non-commercial.
- Remaining blocker: NeMo runtime/dependency availability in runtime images (`nemo_runtime_unavailable`).

## Final Casimir PASS block

```yaml
verdict: PASS
firstFail: none
certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
integrityOk: true
traceId: adapter:7fdaf246-7c50-407d-893c-7c70e32cb904
runId: 8
```

## Operator-ready commands

### Colab experimental lane

```bash
EXPECTED_HEAD=6442a579 ALLOW_CPU_SMOKE=0 bash scripts/voice/colab_run_once.sh
```

### Production lane (NeMo-first scaffold)

```bash
python scripts/voice/verify_weights_manifest.py configs/voice/weights-manifest.example.json
TRAIN_LANE=tts_prod_train_nemo bash scripts/voice/train_production_voice.sh
```
