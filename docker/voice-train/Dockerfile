# syntax=docker/dockerfile:1.7
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/audiocraft-src
COPY external/audiocraft/ /opt/audiocraft-src/
RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install -e /opt/audiocraft-src

WORKDIR /workspace/casimirbot-
ENV PYTHONPATH="/workspace/casimirbot-/external/audiocraft:/opt/audiocraft-src:${PYTHONPATH}"

COPY docker/voice-train/run_voice_train.sh /usr/local/bin/run_voice_train
RUN chmod +x /usr/local/bin/run_voice_train

ENTRYPOINT ["/usr/local/bin/run_voice_train"]
