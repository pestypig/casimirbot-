"""Typed, authority-neutral verifier failures."""

from __future__ import annotations

from dataclasses import dataclass
from typing import NoReturn

from .contract import AUTHORITY_LOCKS


@dataclass(frozen=True, slots=True)
class Blocker:
    phase: str
    code: str
    detail: str

    def as_dict(self) -> dict[str, object]:
        return {
            "phase": self.phase,
            "code": self.code,
            "detail": self.detail,
            "authorityLocks": dict(AUTHORITY_LOCKS),
        }


class VerificationBlocked(RuntimeError):
    def __init__(self, blocker: Blocker) -> None:
        super().__init__(f"{blocker.phase}:{blocker.code}:{blocker.detail}")
        self.blocker = blocker


def block(phase: str, code: str, detail: str) -> NoReturn:
    raise VerificationBlocked(Blocker(phase=phase, code=code, detail=detail))
