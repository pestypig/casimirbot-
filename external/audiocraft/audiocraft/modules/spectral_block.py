import torch
import torch.nn.functional as F
from torch import nn


class SpectralBlock(nn.Module):
    """
    FFT-based residual adapter block.

    Input:  x [batch, time, d_model]
    Output: y [batch, time, d_model]

    Components:
    - Wave path: rFFT over time per channel, complex spectral filter, iFFT back.
    - Learnable decay: per-channel decay that dampens the wave response over time.
    - Control path (dual stream): MLP produces gate + update tensors from the original x.
    - Residual: y = x + gate * (decayed_wave * update), then LayerNorm.
    """

    def __init__(self, d_model: int, init_n_freqs: int = 256, control_hidden_factor: int = 2):
        super().__init__()
        self.d_model = d_model
        self.init_n_freqs = init_n_freqs

        # Complex spectral filters at a base frequency resolution
        self.filter_re = nn.Parameter(torch.randn(d_model, init_n_freqs) * 0.01)
        self.filter_im = nn.Parameter(torch.randn(d_model, init_n_freqs) * 0.01)

        # Per-channel decay (>= 0 via softplus)
        self.decay_raw = nn.Parameter(torch.zeros(d_model))

        hidden = control_hidden_factor * d_model
        self.control_mlp = nn.Sequential(
            nn.Linear(d_model, hidden),
            nn.SiLU(),
            nn.Linear(hidden, 2 * d_model),
        )

        self.norm = nn.LayerNorm(d_model)

    def _resample_filter(self, filt: torch.Tensor, target_n_freqs: int) -> torch.Tensor:
        """
        filt: [C, F_init] -> [C, target_n_freqs]
        Uses 1D interpolation over frequency axis to adapt to current sequence length.
        """
        C, F_init = filt.shape
        if F_init == target_n_freqs:
            return filt
        filt = filt.unsqueeze(0)  # [1, C, F_init]
        filt = F.interpolate(filt, size=target_n_freqs, mode="linear", align_corners=False)
        return filt[0]  # [C, target_n_freqs]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: [batch, time, d_model]
        """
        B, T, C = x.shape
        assert C == self.d_model, f"d_model mismatch: expected {self.d_model}, got {C}"

        # ----- Wave path: FFT + complex filter -----
        xt = x.transpose(1, 2)  # [B, C, T]
        Xf = torch.fft.rfft(xt, dim=-1)  # [B, C, F]
        n_freqs = Xf.shape[-1]

        # Resample filters to current frequency resolution
        filter_re = self._resample_filter(self.filter_re, n_freqs)  # [C, F]
        filter_im = self._resample_filter(self.filter_im, n_freqs)  # [C, F]

        filt = torch.complex(filter_re, filter_im).unsqueeze(0)  # [1, C, F]
        Yf = Xf * filt  # [B, C, F]

        yt = torch.fft.irfft(Yf, n=T, dim=-1)  # [B, C, T]
        y_wave = yt.transpose(1, 2)  # [B, T, C]

        # ----- Learnable decay -----
        decay = F.softplus(self.decay_raw)  # [C] >= 0
        t = torch.arange(T, device=x.device, dtype=x.dtype)  # [T]
        t_norm = t / (T - 1 + 1e-8)  # [T]
        decay_factors = torch.exp(-t_norm.unsqueeze(-1) * decay.unsqueeze(0))  # [T, C]
        decay_factors = decay_factors.unsqueeze(0)  # [1, T, C]
        y_wave_decayed = y_wave * decay_factors  # [B, T, C]

        # ----- Control path -----
        ctrl = self.control_mlp(x)  # [B, T, 2*C]
        gate_logits, update_scale = ctrl.chunk(2, dim=-1)
        gate = torch.sigmoid(gate_logits)   # [B, T, C]
        update = torch.tanh(update_scale)   # [B, T, C]

        adapted = y_wave_decayed * update   # [B, T, C]
        y = x + gate * adapted              # residual

        return self.norm(y)
