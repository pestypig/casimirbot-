# OpenAI Wiring Profile (LLM, Vision, STT)

This profile enables OpenAI for chat, vision (image→text), and speech-to-text via HTTP, behind Hull Mode allowlisting and without SDKs.

## 1) Env (bash)

```bash
# Core posture
export ENABLE_ESSENCE=1 ENABLE_AGI=1 ENABLE_LOG_TEXT=1
export HULL_MODE=1
export HULL_ALLOW_HOSTS=api.openai.com

# Text LLM (chat/completions)
export LLM_HTTP_BASE="https://api.openai.com"
export LLM_HTTP_API_KEY="<YOUR_OPENAI_KEY>"
export LLM_HTTP_MODEL="gpt-4o-mini"

# Vision (image → text) uses the multimodal chat endpoint
export VISION_HTTP_BASE="https://api.openai.com"
export VISION_HTTP_API_KEY="<YOUR_OPENAI_KEY>"
export VISION_HTTP_MODEL="gpt-4o-mini"

# Speech-to-Text (Whisper)
export WHISPER_HTTP_URL="https://api.openai.com"
export WHISPER_HTTP_API_KEY="<YOUR_OPENAI_KEY>"
export WHISPER_HTTP_MODE="openai"  # routes to /v1/audio/transcriptions

# (Optional) Console niceties
export ENABLE_TRACE_EXPORT=1
export ENABLE_POLICY_REASONS=1
export ENABLE_EVAL_REPLAY=1

pnpm dev
```

Tip: Start with a strong model (gpt-4o / gpt-4o-mini) to set a baseline, then downshift if acceptable.

## 2) Posture + registration checks

```bash
# Hull posture and policy
curl -s http://localhost:3000/api/hull/status | jq

# Registered tools (look for llm.http.generate, vision.http.describe, stt.whisper.http.transcribe)
curl -s http://localhost:3000/api/agi/tools/manifest | jq '.[].name'
```

If a tool is missing, confirm its BASE/URL env var is set and `api.openai.com` is present in `HULL_ALLOW_HOSTS`.

## 3) End‑to‑end smokes (plan → execute → trace)

### A) Text LLM

```bash
TRACE=$(curl -s -X POST http://localhost:3000/api/agi/plan \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Summarize v0.1→v1.0 milestones from the AGI roadmap"}' | jq -r .traceId)

curl -s -X POST http://localhost:3000/api/agi/execute \
  -H 'Content-Type: application/json' \
  -d "{\"traceId\":\"$TRACE\"}" | jq .result_summary
```

### B) Vision (image → text)

```bash
IMG="https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"
TRACE=$(curl -s -X POST http://localhost:3000/api/agi/plan \
  -H 'Content-Type: application/json' \
  -d "{\"goal\":\"Describe the image at ${IMG}\"}" | jq -r .traceId)

curl -s -X POST http://localhost:3000/api/agi/execute \
  -H 'Content-Type: application/json' \
  -d "{\"traceId\":\"$TRACE\"}" | jq .result_summary
```

### C) Speech‑to‑Text (Whisper)

```bash
AUDIO="https://file-examples.com/storage/fe9e9b.../file_example_MP3_700KB.mp3"   # or your file
TRACE=$(curl -s -X POST http://localhost:3000/api/agi/plan \
  -H 'Content-Type: application/json' \
  -d "{\"goal\":\"Transcribe the audio at ${AUDIO}\"}" | jq -r .traceId)

curl -s -X POST http://localhost:3000/api/agi/execute \
  -H 'Content-Type: application/json' \
  -d "{\"traceId\":\"$TRACE\"}" | jq .result_summary
```

Note: In Hull Mode, the audio file host must also be allowlisted (e.g., add `file-examples.com` to `HULL_ALLOW_HOSTS`) or use a `data:` URI.

Live observability while you run:

```bash
curl -N http://localhost:3000/api/agi/tools/logs/stream
curl -N -H "Accept: text/event-stream" http://localhost:3000/api/essence/events
curl -s http://localhost:3000/metrics | grep -E 'agi_task_|llm_|stt_'
```

## 4) Knowledge attachments (for RAG + vision inputs)

If you want to upload and cite local assets (images, docs) from the console:

```bash
export ENABLE_KNOWLEDGE_PROJECTS=1
export KNOWLEDGE_ALLOWED_MIME="text/plain,application/pdf,image/png,image/jpeg,image/webp"
```

- Add files via AGI Knowledge → mark the project Active.
- Plan calls will include the knowledgeContext; trace + export manifest will show it.
- Encourage citations like `[project:<slug>/file:<name>]`.

## 5) Diffusion note

The `luma.http.generate` adapter targets SD WebUI/ComfyUI, not OpenAI. If you want OpenAI image generation (e.g., `gpt-image-1`), add a new tool (e.g., `image.openai.generate`).

## 6) Common pitfalls

- Keys not picked up: set env before `pnpm dev` (no auto `.env` load).
- Tool not showing: BASE/URL unset or host not in `HULL_ALLOW_HOSTS`.
- Vision "no content": pass a URL or base64 and a short caption; the planner is text‑grounded.
- 429s: see `/metrics` for `llm_`/`stt_` counters; consider small retry/back‑off if you hit limits.

## 7) Next steps

- Turn on `ENABLE_TRACE_EXPORT=1` and use Export JSON in Trace.
- Use Eval Replay (`ENABLE_EVAL_REPLAY=1`) after changes.
- Start with capable models → measure → replace with smaller/cheaper where acceptable.
