"""Replay-bundle emission lock for the incomplete verifier."""

from __future__ import annotations

from typing import NoReturn

from .errors import block


def emit_replay_bundle(*_args: object, **_kwargs: object) -> NoReturn:
    """Current implementation cannot emit a schema-valid replay bundle.

    Keeping the writer absent is deliberate: the exact bundle needs two broker
    runtime bindings that the frozen invocation does not deliver, a complete
    imported-schema interpreter, all discrete/global gates, and all three
    proof receipts.  A partial or guessed JSON object must never become the
    verifier's sole output file.
    """

    block(
        "replay_bundle",
        "emission_disabled_in_incomplete_verifier",
        "no_bundle_writer_is_authorized_until_every_required_gate_receipt_and_runtime_binding_exists",
    )
