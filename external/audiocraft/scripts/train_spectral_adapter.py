"""
Minimal training harness to fine-tune SpectralBlock adapters on top of MusicGen's LM.

Currently uses a dummy dataset (random codes) just to validate the plumbing.
Replace DummyChunkDataset with your real EnCodec-tokenized dataset.
"""
import json
import os
import time
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import torch
import torch.utils._pytree as pytree  # type: ignore
from torch import nn
from torch.utils.data import DataLoader, Dataset
import torchaudio

# Compatibility: older torch builds in the vendored venv don't expose register_pytree_node
# which newer transformers expect. Provide a thin shim when needed.
if not hasattr(pytree, "register_pytree_node") and hasattr(pytree, "_register_pytree_node"):
    def register_pytree_node(  # type: ignore
        typ,
        flatten_fn,
        unflatten_fn,
        *,
        serialized_type_name: Optional[str] = None,
        serialized_fields: Optional[List[str]] = None,
        to_dumpable_context=None,
        from_dumpable_context=None,
    ):
        return pytree._register_pytree_node(
            typ,
            flatten_fn,
            unflatten_fn,
            to_dumpable_context=to_dumpable_context,
            from_dumpable_context=from_dumpable_context,
        )

    pytree.register_pytree_node = register_pytree_node  # type: ignore


from audiocraft.models import MusicGen
from audiocraft.modules.spectral_block import SpectralBlock


# ---------- Dataset stubs ----------

@dataclass
class TrackMeta:
    path: str
    prompt: str


class KnowledgeAudioDataset(Dataset):
    """
    Loads WAV/MP3 files from a directory, resamples, and yields raw audio chunks + placeholder prompts.
    Replace prompt building with your own metadata (project name, tags, etc.).
    """

    def __init__(
        self,
        root: str,
        sample_rate: int = 32000,
        chunk_seconds: int = 15,
        stride_seconds: int = 5,
    ):
        self.sample_rate = sample_rate
        self.chunk_samples = chunk_seconds * sample_rate
        self.stride_samples = stride_seconds * sample_rate

        audio_exts = {".wav", ".mp3", ".flac", ".ogg"}
        self.files: List[Path] = []
        for path in Path(root).rglob("*"):
            if path.suffix.lower() in audio_exts and path.is_file():
                self.files.append(path)

        self.items: List[tuple[Path, int, int]] = []
        for file in self.files:
            try:
                info = torchaudio.info(str(file))
            except Exception as exc:
                print(f"[dataset] Skipping {file}: {exc}")
                continue

            # Normalize frame counts to the target sample rate in case of resampling.
            source_rate = max(info.sample_rate, 1)
            total = int(info.num_frames * (self.sample_rate / source_rate))
            if total <= 0:
                continue
            pos = 0
            while pos + self.chunk_samples <= total:
                self.items.append((file, pos, pos + self.chunk_samples))
                pos += self.stride_samples

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        file, start, end = self.items[idx]
        wav, sr = torchaudio.load(file)
        if sr != self.sample_rate:
            wav = torchaudio.functional.resample(wav, sr, self.sample_rate)
        chunk = wav[..., start:end]
        if chunk.shape[-1] < self.chunk_samples:
            pad = self.chunk_samples - chunk.shape[-1]
            chunk = torch.nn.functional.pad(chunk, (0, pad))
        else:
            chunk = chunk[..., : self.chunk_samples]
        prompt = f"knowledge audio from {file.name}"
        return chunk, prompt


# ---------- Adapter attachment ----------

def attach_spectral_adapters(lm: nn.Module, num_adapters: int = 2) -> nn.Module:
    """Attach a stack of SpectralBlocks to the LM in-place and return it."""
    adapters = nn.Sequential(*[SpectralBlock(d_model=lm.dim) for _ in range(num_adapters)])
    lm.spectral_adapters = adapters
    return adapters


# ---------- Training ----------

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[train] Using device: {device}")

    status_path = os.environ.get("TRAIN_STATUS_PATH", "external/audiocraft/checkpoints/train_status.json")
    train_job_type = os.environ.get("TRAIN_JOB_TYPE", "train").strip().lower()
    status_dir = os.path.dirname(status_path)
    if status_dir:
        os.makedirs(status_dir, exist_ok=True)

    data_root = os.environ.get("KNOWLEDGE_AUDIO_DIR", "external/audiocraft/data/knowledge_audio")
    dataset = KnowledgeAudioDataset(root=data_root)
    if len(dataset) == 0:
        msg = f"[train] No audio found in {data_root}; aborting."
        print(msg, flush=True)
        with open(status_path, "w", encoding="utf-8") as f:
            json.dump(
                {"status": "error", "message": msg, "timestamp": time.time()},
                f,
            )
        sys.exit(1)

    # Load pretrained MusicGen (LM + codec)
    model = MusicGen.get_pretrained("facebook/musicgen-small", device=device)
    lm = model.lm

    # Attach adapters
    spectral_adapters = attach_spectral_adapters(lm, num_adapters=2).to(device)

    # Freeze everything except adapters
    for p in model.parameters():
        p.requires_grad = False
    for p in spectral_adapters.parameters():
        p.requires_grad = True

    loader = DataLoader(dataset, batch_size=1, shuffle=True, num_workers=0)

    optimizer = torch.optim.AdamW(spectral_adapters.parameters(), lr=1e-4, weight_decay=1e-2)
    criterion = nn.CrossEntropyLoss()

    num_epochs = 1
    lm.train()
    total_steps = num_epochs * len(loader)
    current_step = 0

    for epoch in range(num_epochs):
        for step, (codes, _prompt) in enumerate(loader):
            # In a real setup you would encode to EnCodec tokens; placeholder uses raw audio
            # Run LM on dummy codes until EnCodec integration is added
            fake_codes = torch.randint(0, lm.card, (1, lm.num_codebooks, 64), device=device)

            conditions = []  # replace with ConditioningAttributes built from prompt/metadata

            lm_out = lm.compute_predictions(codes=fake_codes, conditions=conditions)
            logits = lm_out.logits  # [B, K, T, card]
            B, K, T, card = logits.shape

            target = fake_codes.view(B * K, T)
            logits_flat = logits.view(B * K, T, card)
            logits_flat = logits_flat[:, :-1, :]
            target = target[:, 1:]

            loss = criterion(logits_flat.reshape(-1, card), target.reshape(-1))

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            if step % 10 == 0:
                print(f"[epoch {epoch} step {step}] loss={loss.item():.4f}")
                status = {
                    "epoch": epoch,
                    "step": step,
                    "loss": float(loss.item()),
                    "timestamp": time.time(),
                    "status": "running",
                }
                with open(status_path, "w", encoding="utf-8") as f:
                    json.dump(status, f)
                print(f"PROGRESS {current_step} {total_steps} LOSS {loss.item():.4f}", flush=True)

            # keep short for smoke test
            if step >= 50:
                break
            current_step += 1

    # Save adapters only
    os.makedirs("checkpoints", exist_ok=True)
    ckpt_name = "tts_voice_train_musicgen_small.pt" if train_job_type == "tts_voice_train" else "spectral_adapters_musicgen_small.pt"
    ckpt_path = os.path.join("checkpoints", ckpt_name)
    torch.save(spectral_adapters.state_dict(), ckpt_path)
    print(f"[train] Saved spectral adapters to {ckpt_path}")
    print(f"ARTIFACT {ckpt_path}", flush=True)
    final_status = {
        "epoch": num_epochs - 1,
        "step": current_step,
        "loss": float(loss.item()),
        "timestamp": time.time(),
        "status": "completed",
        "checkpoint": ckpt_path,
        "jobType": train_job_type,
        "artifactRefs": [ckpt_path],
    }
    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(final_status, f)
    print("PROGRESS {0} {1} DONE".format(current_step, total_steps), flush=True)


if __name__ == "__main__":
    main()
