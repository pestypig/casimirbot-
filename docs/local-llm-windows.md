# Local LLM on Windows (llama.cpp spawn)

This note captures a known-good local LLM setup for Windows that powers
`/api/agi/ask` via the llama.cpp CLI spawn path.

## Prereqs
- Microsoft Visual C++ 2015-2022 Redistributable (x64)
- Model + optional LoRA files present on disk

## Working .env settings
Adjust the model/LoRA paths to your local files as needed.

```
ENABLE_LLM_LOCAL_SPAWN=1
LLM_LOCAL_CMD=./.cache/llm/llama-prebuilt/llama-cli.exe
LLM_LOCAL_ARGS_BASE=--no-mmap
LLM_LOCAL_CPU_BACKEND=sse42
LLM_LOCAL_MODEL_PATH=./models/qwen2.5-3b-instruct-q4_k_m.gguf
LLM_LOCAL_MODEL=./models/qwen2.5-3b-instruct-q4_k_m.gguf
LLM_LOCAL_LORA_PATH=./.cache/adapters/agi-answerer-qlora/agi-answerer-qlora-f16.gguf
```

## Smoke test (PowerShell)
The smoke script reads env vars from the shell, not `.env`, so set them in the
session before running it.

```powershell
$env:LLM_LOCAL_MODEL_PATH="./models/qwen2.5-3b-instruct-q4_k_m.gguf"
$env:LLM_LOCAL_MODEL="./models/qwen2.5-3b-instruct-q4_k_m.gguf"
$env:LLM_LOCAL_CMD="./.cache/llm/llama-prebuilt/llama-cli.exe"
$env:LLM_LOCAL_ARGS_BASE="--no-mmap"
$env:LLM_LOCAL_CPU_BACKEND="sse42"
$env:LLM_LOCAL_LORA_PATH="./.cache/adapters/agi-answerer-qlora/agi-answerer-qlora-f16.gguf"
$env:ENABLE_LLM_LOCAL_SPAWN="1"
$env:LLM_LOCAL_CONTEXT_TOKENS="512"
$env:LLM_LOCAL_MAX_TOKENS="8"
$env:LLM_LOCAL_SPAWN_TIMEOUT_MS="15000"
npx --yes tsx scripts/llm-local-smoke.ts
```

## Troubleshooting
- `llm spawn exit 3221225781` (0xC0000135) usually means missing runtime DLLs
  or an incompatible binary. Confirm the VC++ runtime is installed, then switch
  `LLM_LOCAL_CMD` to the `llama-prebuilt` binary shown above.
