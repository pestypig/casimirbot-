# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/casimirbot-
COPY requirements.txt /tmp/requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install -r /tmp/requirements.txt

COPY docker/voice-train-prod/run_voice_train_prod.sh /usr/local/bin/run_voice_train_prod
RUN chmod +x /usr/local/bin/run_voice_train_prod

ENTRYPOINT ["/usr/local/bin/run_voice_train_prod"]
