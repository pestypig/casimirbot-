"""
Quick stability smoke test for SpectralBlock using synthetic sinusoids.
Ensures decay/gate behavior is sane before touching music.
"""
import math

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset

from audiocraft.modules.spectral_block import SpectralBlock


class SinusoidDataset(Dataset):
    def __init__(self, num_samples: int = 500, seq_len: int = 512):
        self.num_samples = num_samples
        self.seq_len = seq_len

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        T = self.seq_len
        t = torch.linspace(0, 1, T)
        num_sines = torch.randint(1, 4, (1,)).item()
        x = torch.zeros(T)
        for _ in range(num_sines):
            freq = torch.rand(1).item() * 10.0 + 1.0
            phase = torch.rand(1).item() * 2 * math.pi
            amp = torch.rand(1).item()
            x += amp * torch.sin(2 * math.pi * freq * t + phase)
        x = x.unsqueeze(-1)  # [T, 1]
        return x, x  # identity mapping


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    d_model = 32
    seq_len = 512

    dataset = SinusoidDataset(seq_len=seq_len)
    loader = DataLoader(dataset, batch_size=16, shuffle=True)

    block = SpectralBlock(d_model=d_model).to(device)
    in_proj = nn.Linear(1, d_model).to(device)
    out_proj = nn.Linear(d_model, 1).to(device)

    model = nn.Sequential(in_proj, block, out_proj).to(device)

    optim = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()

    for step, (x, y) in enumerate(loader):
        x = x.to(device)  # [B, T, 1]
        y = y.to(device)

        pred = model(x)
        loss = loss_fn(pred, y)

        optim.zero_grad()
        loss.backward()
        optim.step()

        if step % 20 == 0:
            with torch.no_grad():
                decay = torch.softplus(block.decay_raw).mean().item()
                filt_norm = block.filter_re.norm().item() + block.filter_im.norm().item()
            print(f"[step {step}] loss={loss.item():.4f} decay_mean={decay:.3f} filter_norm={filt_norm:.3f}")

        if step >= 200:
            break


if __name__ == "__main__":
    main()
