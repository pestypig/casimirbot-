import io
import os
from typing import Optional

import soundfile as sf
import torch
from audiocraft.models import MusicGen
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


class MusicGenServer:
    """Thin wrapper around MusicGen for TTS-style generation."""

    def __init__(self, model_name: str = "facebook/musicgen-small", device: Optional[str] = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device

        print(f"[MusicGenServer] Loading model {model_name} on {device}...")
        self.model = MusicGen.get_pretrained(model_name, device=device)
        # Default duration; per-request overrides below.
        self.model.set_generation_params(duration=30)

    @torch.no_grad()
    def generate(
        self,
        text: str,
        duration: float = 30.0,
        seed: Optional[int] = None,
        top_k: int = 250,
        top_p: float = 0.0,
        temperature: float = 1.0,
    ) -> torch.Tensor:
        """Generate audio tensor [channels, samples] on CPU in [-1, 1]."""
        if seed is not None:
            torch.manual_seed(seed)

        self.model.set_generation_params(
            duration=duration,
            use_sampling=True,
            top_k=top_k,
            top_p=top_p,
            temperature=temperature,
        )

        wav = self.model.generate([text])[0]  # [C, T] on device
        return wav.cpu()


class TTSRequest(BaseModel):
    text: str
    duration: float = 30.0
    seed: Optional[int] = None
    top_k: int = 250
    top_p: float = 0.0
    temperature: float = 1.0


app = FastAPI()
_music_server: Optional[MusicGenServer] = None


@app.on_event("startup")
def _load_model():
    global _music_server
    model_name = os.environ.get("MUSICGEN_MODEL_NAME", "facebook/musicgen-small")
    device = os.environ.get("MUSICGEN_DEVICE")
    _music_server = MusicGenServer(model_name=model_name, device=device)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/tts")
def tts(req: TTSRequest):
    if _music_server is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    audio = _music_server.generate(
        text=req.text,
        duration=req.duration,
        seed=req.seed,
        top_k=req.top_k,
        top_p=req.top_p,
        temperature=req.temperature,
    )  # [C, T]

    buf = io.BytesIO()
    sr = _music_server.model.sample_rate
    sf.write(buf, audio.T.numpy(), sr, format="WAV")
    buf.seek(0)

    return StreamingResponse(buf, media_type="audio/wav")
