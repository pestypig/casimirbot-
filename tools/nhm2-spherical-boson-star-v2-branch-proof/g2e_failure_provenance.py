#!/usr/bin/env python3
"""Candidate-neutral bounded process provenance with exclusive receipts."""

from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import threading
from typing import BinaryIO, Final


AUTHORITY_FALSE: Final[dict[str, bool]] = {
    "candidateAdmitted": False,
    "classicalProofEstablished": False,
    "diagnosticLampAuthorized": False,
    "executionAuthorized": False,
    "jointGeometryStateAccepted": False,
    "laneAuthorized": False,
    "pairAgreementEstablished": False,
    "physicalViabilityAuthorized": False,
    "propulsionAuthorized": False,
    "quantumStateAccepted": False,
    "replayAuthorized": False,
    "transportAuthorized": False,
}


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True,
                      separators=(",", ":")).encode("ascii")


def receipt(value: dict[str, object]) -> bytes:
    payload = dict(value)
    payload["selfSha256"] = None
    payload["selfSha256"] = hashlib.sha256(canonical(payload)).hexdigest()
    return canonical(payload) + b"\n"


def write_exclusive(path: Path, raw: bytes) -> None:
    with path.open("xb") as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())


class StreamDigest:
    def __init__(self, maximum_prefix_bytes: int):
        self.maximum_prefix_bytes = maximum_prefix_bytes
        self.byte_count = 0
        self.prefix = bytearray()
        self.hasher = hashlib.sha256()

    def consume(self, stream: BinaryIO) -> None:
        while True:
            chunk = stream.read(4096)
            if not chunk:
                break
            self.byte_count += len(chunk)
            self.hasher.update(chunk)
            remaining = self.maximum_prefix_bytes - len(self.prefix)
            if remaining > 0:
                self.prefix.extend(chunk[:remaining])

    def record(self) -> dict[str, object]:
        return {
            "byteCount": self.byte_count,
            "capturedPrefixBase64": base64.b64encode(bytes(self.prefix)).decode("ascii"),
            "sha256": self.hasher.hexdigest(),
            "truncated": self.byte_count > len(self.prefix),
        }


def run_synthetic(command: list[str], output_root: Path, maximum_prefix_bytes: int = 64,
                  timeout_seconds: int = 10) -> dict[str, object]:
    if maximum_prefix_bytes < 0 or maximum_prefix_bytes > 4096:
        raise ValueError("prefix_bound_invalid")
    output_root.mkdir(parents=True, exist_ok=False)
    command_sha = hashlib.sha256(canonical(command)).hexdigest()
    write_exclusive(output_root / "preexecution-binding.json", receipt({
        "authority": AUTHORITY_FALSE,
        "candidateEvaluated": False,
        "commandSha256": command_sha,
        "firstFail": None,
        "schema": "nhm2.g2e.synthetic-preexecution-receipt.v1",
        "status": "PASS",
    }))
    process = subprocess.Popen(command, cwd=output_root, stdin=subprocess.DEVNULL,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if process.stdout is None or process.stderr is None:
        raise RuntimeError("process_pipe_creation_failed")
    stdout = StreamDigest(maximum_prefix_bytes)
    stderr = StreamDigest(maximum_prefix_bytes)
    threads = [threading.Thread(target=stdout.consume, args=(process.stdout,)),
               threading.Thread(target=stderr.consume, args=(process.stderr,))]
    for thread in threads:
        thread.start()
    timed_out = False
    try:
        return_code = process.wait(timeout=timeout_seconds)
    except subprocess.TimeoutExpired:
        timed_out = True
        process.kill()
        return_code = process.wait()
    for thread in threads:
        thread.join(timeout=timeout_seconds)
        if thread.is_alive():
            raise RuntimeError("stream_digest_thread_timeout")
    process.stdout.close()
    process.stderr.close()
    first_fail = "synthetic_process_timeout" if timed_out else (
        None if return_code == 0 else f"synthetic_process_exit:{return_code}")
    terminal = {
        "authority": AUTHORITY_FALSE,
        "candidateEvaluated": False,
        "commandSha256": command_sha,
        "firstFail": first_fail,
        "returnCode": return_code,
        "schema": "nhm2.g2e.synthetic-terminal-receipt.v1",
        "status": "PASS" if first_fail is None else "FAIL",
        "stderr": stderr.record(),
        "stdout": stdout.record(),
        "timedOut": timed_out,
    }
    write_exclusive(output_root / "terminal-receipt.json", receipt(terminal))
    return terminal
