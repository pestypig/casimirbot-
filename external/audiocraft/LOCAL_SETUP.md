# AudioCraft local setup (Windows, venv)

Steps we used to get AudioCraft running locally under `external/audiocraft/.venv` (Python 3.11):

1) Create + activate venv  
```powershell
cd external/audiocraft
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1   # (use activate.bat if you’re in cmd)
```

2) Upgrade pip  
```powershell
python -m pip install --upgrade pip
```

3) Install dependencies (patched to use a wheelable `av>=12.1.0` on Windows)  
```powershell
python -m pip install -e .
```

4) Verify import  
```powershell
python - <<'PY'
import audiocraft, torch
print("audiocraft", audiocraft.__version__)
print("torch", torch.__version__)
PY
```

5) FFmpeg  
Ensure `ffmpeg` is on PATH (`ffmpeg -version`). Required for Encodec/Audio I/O.

6) Hugging Face auth (for model downloads)  
Set a token if you need gated weights:  
```powershell
$env:HUGGING_FACE_HUB_TOKEN = "<your_token>"
```

7) Wire into the app as a local TTS/music backend  
- Set `ENABLE_LOCAL_TTS=1` and `LOCAL_TTS_URL=http://127.0.0.1:8000/api/tts` in `.env`.  
- Run your AudioCraft-serving script on that port so `/tts/local` proxies to it.

Notes  
- This venv is CPU-only unless you install a CUDA-enabled torch build into it first.  
- If you want to start fresh: delete `.venv` and rerun steps 1–3.

## Docker runtime (recommended for locked-down environments)

When cloud sandboxes block outbound `pip`/package downloads, use the prebuilt
training image from this repo:

```bash
docker build -f docker/voice-train/Dockerfile -t casimir-voice-train:latest .
docker run --rm -v "$PWD:/workspace/casimirbot-" casimir-voice-train:latest
```

This runs dataset prep + training and emits a deterministic
`=== DOCKER TRAIN REPORT ===` block. See `docker/voice-train/README.md`.
