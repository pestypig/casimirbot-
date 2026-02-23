# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
"""
AudioCraft is a general framework for training audio generative models.
At the moment we provide the training code for:

- [MusicGen](https://arxiv.org/abs/2306.05284), a state-of-the-art
    text-to-music and melody+text autoregressive generative model.
    For the solver, see `audiocraft.solvers.musicgen.MusicGenSolver`, and for the model,
    `audiocraft.models.musicgen.MusicGen`.
- [AudioGen](https://arxiv.org/abs/2209.15352), a state-of-the-art
    text-to-general-audio generative model.
- [EnCodec](https://arxiv.org/abs/2210.13438), efficient and high fidelity
    neural audio codec which provides an excellent tokenizer for autoregressive language models.
    See `audiocraft.solvers.compression.CompressionSolver`, and `audiocraft.models.encodec.EncodecModel`.
- [MultiBandDiffusion](TODO), alternative diffusion-based decoder compatible with EnCodec that
    improves the perceived quality and reduces the artifacts coming from adversarial decoders.
- [JASCO](https://arxiv.org/abs/2406.10970) Joint Audio and Symbolic Conditioning for Temporally Controlled
    Text-to-Music Generation.
"""
import importlib
import typing as tp

# flake8: noqa
__version__ = '1.4.0a2'
_LAZY_SUBMODULES = {"data", "modules", "models"}
__all__ = ["data", "modules", "models", "__version__"]


def __getattr__(name: str) -> tp.Any:
    if name in _LAZY_SUBMODULES:
        module = importlib.import_module(f"{__name__}.{name}")
        globals()[name] = module
        return module
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
