#!/usr/bin/env python3
"""Deterministic non-candidate fixture for bounded failure provenance tests."""

from __future__ import annotations

import sys


def main() -> int:
    sys.stdout.buffer.write(b"S" * 96)
    sys.stdout.buffer.flush()
    sys.stderr.buffer.write(b"E" * 80)
    sys.stderr.buffer.flush()
    return 7


if __name__ == "__main__":
    raise SystemExit(main())
