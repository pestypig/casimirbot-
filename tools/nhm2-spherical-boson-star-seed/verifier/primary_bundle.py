"""Authority-neutral composition of the source descriptor and five raw operands."""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Final

from canonical_json import CanonicalJsonDocument
from descriptor import ValidatedSourceDescriptor, validate_source_descriptor
from f64le_inventory import (
    FrozenPrimaryOperands,
    decode_bound_primary_payloads,
)
from hash_graph import payload_binding_sha256


@dataclass(frozen=True, slots=True)
class ValidatedSourcePrimaryBundle:
    descriptor: ValidatedSourceDescriptor
    operands: FrozenPrimaryOperands
    source_candidate_id: str
    v2_candidate_binding_present: bool = False
    provenance_authoritative: bool = False
    proof_duties_replayed: bool = False


def validate_source_primary_bundle(
    descriptor_document: CanonicalJsonDocument,
    payloads: tuple[tuple[str, bytes], ...],
) -> ValidatedSourcePrimaryBundle:
    """Validate descriptor first, then hashes/shapes, nonfinites, and -0 in order."""

    descriptor = validate_source_descriptor(descriptor_document)
    expected_hashes = tuple(
        (payload.raw_sha256, payload_binding_sha256(payload))
        for payload in descriptor.payloads
    )
    operands = decode_bound_primary_payloads(payloads, expected_hashes)
    return ValidatedSourcePrimaryBundle(
        descriptor=descriptor,
        operands=operands,
        source_candidate_id=descriptor.source_candidate_id,
    )


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "v2CandidateBindingPresent": False,
        "provenanceAuthoritative": False,
        "proofDutiesReplayed": False,
        "executionAuthorized": False,
        "sourceBundleAcceptedAsSeed": False,
        "candidateAccepted": False,
        "replayAuthority": False,
        "independentAgreement": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

if any(AUTHORITY_LOCKS.values()):
    raise RuntimeError("source_primary_bundle_authority_lock_invalid")
