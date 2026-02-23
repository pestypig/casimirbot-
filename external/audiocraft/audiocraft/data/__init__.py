# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
"""Audio loading and writing support. Datasets for raw audio
or also including some metadata."""

from __future__ import annotations

import importlib
import typing as tp

_LAZY_SUBMODULES = {
    "audio",
    "audio_dataset",
    "audio_utils",
    "info_audio_dataset",
    "music_dataset",
    "sound_dataset",
    "jasco_dataset",
    "zip",
}
__all__ = sorted(_LAZY_SUBMODULES)


def __getattr__(name: str) -> tp.Any:
    if name in _LAZY_SUBMODULES:
        module = importlib.import_module(f"{__name__}.{name}")
        globals()[name] = module
        return module
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
