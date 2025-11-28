# Local Micro-LLM Orchestrator (Client)

The client orchestrator in `client/src/lib/agi/orchestrator.ts` can be extended to call a local LLM endpoint (e.g., `http://localhost:11434`) for meta-reasoning before forwarding a filtered `PromptSpec` to `/api/agi/plan`. This mirrors an offline stack where the browser drives a lightweight model without changing the server contracts.

Reference projects for a Raspberry Pi / offline setup:

- Ollama (local LLM server): https://github.com/ollama/ollama
- Whisplay AI Chatbot (PiSugar / Whisplay HAT example): https://github.com/PiSugar/whisplay-ai-chatbot
- PiSugar power manager: https://github.com/PiSugar/piSugar-power-manager
- Whisper (local ASR): https://github.com/openai/whisper
- Piper (local TTS): https://github.com/OHF-Voice/piper1-gpl

The intended flow on a Pi or other edge device is: Whisper (ASR) -> Ollama (reasoning) -> Piper (TTS). The orchestrator module can route to that local HTTP stack while still producing the same `PromptSpec` and `collapse_trace` metadata used by `/api/agi/plan`.

## New: local micro-LLM chooser (client-side)

If you want a tiny local model (e.g., Ollama on the Pi) to pick which prompt spec to send to the server, expose an HTTP endpoint and set `VITE_LOCAL_CHOOSER_URL` (or `window.__ESSENCE_LOCAL_CHOOSER__`). Control the collapse path with `HYBRID_COLLAPSE_MODE` (`deterministic_hash_v1` default, or `micro_llm_v1`, `embedding_v1`, `off`). When set to `off`, collapse is bypassed and traces are tagged with `decider: "disabled"` and `strategy: "off"`.

The browser will POST:

```json
{
  "user_question": "...",
  "persona_id": "default",
  "essence_id": null,
  "runtime_mode": "offline",
  "context_chars_remaining": 12000,
  "candidates": [
    { "id": "plan_full", "tags": ["offline"], "estimated_cost_tokens": 3200, "prompt_spec": { ... } },
    { "id": "plan_lean", ... },
    { "id": "direct_answer", ... }
  ]
}
```

Respond with `{"chosenId":"plan_lean","scores":[{"id":"plan_lean","score":0.9}]}` (optional `model` / `note` fields). The choice and scores are captured in `collapse_trace` and shown in the trace drawer.
