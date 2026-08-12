"""Fail-closed boundary for the three frozen MPFR proof receipts.

The MPFR arithmetic primitives exist, but the adaptive trace-producing proof
algorithms are intentionally not represented as complete.  No receipt object
is returned until every frozen population, ordering, tail, and interval rule is
implemented and independently reviewed.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Sequence

from .errors import Blocker
from .manifest import RunRequest
from .mpfr_backend import Interval, MpfrBackend
from .secure_arrays import ArrayPayload


@dataclass(frozen=True, slots=True)
class ProofReplayAttempt:
    mpfr_version: str
    gmp_version: str
    directed_rounding_self_test_passed: bool
    continuous_nodeless_receipt: None
    continuous_peak_receipt: None
    numerical_origin_series_defect_receipt: None
    blockers: tuple[Blocker, ...]
    all_receipts_complete: bool = False


_PROOF_BLOCKERS: Final[tuple[Blocker, ...]] = (
    Blocker(
        phase="continuous_nodeless_proof",
        code="compact_cover_kernel_not_implemented",
        detail="frozen MPFR256 g=u/(x*cos(theta)) adaptive cover and endpoint trace are absent",
    ),
    Blocker(
        phase="continuous_nodeless_proof",
        code="coulomb_tail_selector_not_implemented",
        detail="unique C selector finite tail representative and 524288-record rounding trace are absent",
    ),
    Blocker(
        phase="continuous_peak_proof",
        code="stationary_isolation_kernel_not_implemented",
        detail="three-region cover KKT isolation Hessian and dominance trace are absent",
    ),
    Blocker(
        phase="origin_series_defect",
        code="origin_multipole_interval_trace_not_implemented",
        detail="320 coefficient extraction records and MPFR256 N/T/W/P_V defect intervals are absent",
    ),
    Blocker(
        phase="proof_receipts",
        code="canonical_proof_trace_serializers_not_implemented",
        detail="receipt trace populations cannot be hash-bound without exact stream serializers",
    ),
)


def _directed_rounding_self_test(backend: MpfrBackend) -> bool:
    left = Interval(0.1, 0.1)
    right = Interval(0.2, 0.2)
    summed = backend.add_interval(left, right)
    product = backend.multiply_interval(left, right)
    quotient = backend.divide_interval(product, right)
    square_root = backend.sqrt_interval(Interval(2.0, 2.0))
    return (
        summed.lower <= 0.3 <= summed.upper
        and product.lower <= 0.02 <= product.upper
        and quotient.lower <= 0.1 <= quotient.upper
        and square_root.lower <= 2.0**0.5 <= square_root.upper
    )


def attempt_required_proof_replays(
    backend: MpfrBackend,
    request: RunRequest,
    payloads: Sequence[ArrayPayload],
) -> ProofReplayAttempt:
    if len(payloads) != 32:
        return ProofReplayAttempt(
            mpfr_version=backend.mpfr_version,
            gmp_version=backend.gmp_version,
            directed_rounding_self_test_passed=False,
            continuous_nodeless_receipt=None,
            continuous_peak_receipt=None,
            numerical_origin_series_defect_receipt=None,
            blockers=(
                Blocker(
                    phase="proof_receipts",
                    code="exact_32_array_subject_required",
                    detail=str(len(payloads)),
                ),
            ),
        )
    _ = request.verifier_proof_kernel_binding
    _ = request.verifier_mpfr_gmp_runtime_binding
    directed_rounding_ok = _directed_rounding_self_test(backend)
    blockers = _PROOF_BLOCKERS
    if not directed_rounding_ok:
        blockers = (
            Blocker(
                phase="mpfr",
                code="directed_rounding_self_test_failed",
                detail="basic enclosure identities were not outward",
            ),
            *blockers,
        )
    return ProofReplayAttempt(
        mpfr_version=backend.mpfr_version,
        gmp_version=backend.gmp_version,
        directed_rounding_self_test_passed=directed_rounding_ok,
        continuous_nodeless_receipt=None,
        continuous_peak_receipt=None,
        numerical_origin_series_defect_receipt=None,
        blockers=blockers,
    )
