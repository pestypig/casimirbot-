"""Forbidden lever/tile role admission for the independent seed verifier."""

from __future__ import annotations

from dataclasses import dataclass
import re
from types import MappingProxyType
from typing import Final
import unicodedata

from canonical_json import (
    CanonicalJsonDocument,
    FrozenJsonArray,
    FrozenJsonObject,
    FrozenJsonValue,
)


FORBIDDEN_TOKENS: Final = frozenset(
    {
        "declared_lever_tensor",
        "declaredlevertensor",
        "lever",
        "lever_tensor",
        "levertensor",
        "lever_tensor_role",
        "declared_tile_tensor",
        "declaredtiletensor",
        "tile",
        "tiles",
        "tile_id",
        "tileid",
        "tile_role",
        "tilerole",
        "tile_tensor",
        "tiletensor",
        "tile_weight",
        "tileweight",
        "tile_gain",
        "tilegain",
        "tile_schedule",
        "tileschedule",
        "warp_control_tensor",
        "external_source_tensor",
    }
)

ROLE_BEARING_STRING_KEYS: Final = frozenset(
    {
        "finalRoot",
        "id",
        "name",
        "outputRoot",
        "path",
        "role",
        "roleId",
        "rolePath",
        "role_id",
        "role_path",
        "semanticRole",
        "semantic_role",
    }
)

_CAMEL_BOUNDARY: Final = re.compile(r"([a-z0-9])([A-Z])")
_NON_IDENTIFIER: Final = re.compile(r"[^a-z0-9]+")


class ForbiddenRoleError(ValueError):
    """Typed first forbidden-role rejection."""

    def __init__(self, pointer: str) -> None:
        super().__init__(f"forbidden_lever_or_tile_role:{pointer or '/'}")
        self.code = "forbidden_lever_or_tile_role"
        self.pointer = pointer or "/"


@dataclass(frozen=True, slots=True)
class ForbiddenRoleScanResult:
    visited_nodes: int
    accepted: bool = True


def _normalized_identifier_parts(value: str) -> tuple[str, tuple[str, ...]]:
    normalized_case = unicodedata.normalize("NFKC", value)
    with_boundaries = _CAMEL_BOUNDARY.sub(r"\1_\2", normalized_case)
    lowered = with_boundaries.lower()
    return (
        unicodedata.normalize("NFKC", value).lower(),
        tuple(part for part in _NON_IDENTIFIER.split(lowered) if part),
    )


def _is_forbidden_identifier(value: str) -> bool:
    normalized, segments = _normalized_identifier_parts(value)
    return (
        normalized in FORBIDDEN_TOKENS
        or "lever" in segments
        or "tile" in segments
    )


def _utf16_sort_key(value: str) -> bytes:
    return value.encode("utf-16-be", "strict")


def _scan(
    value: FrozenJsonValue,
    role_bearing: bool,
    pointer: str,
) -> int:
    if type(value) is str:
        if role_bearing and _is_forbidden_identifier(value):
            raise ForbiddenRoleError(pointer)
        return 1
    if value is None or type(value) in (bool, int):
        return 1
    if type(value) is FrozenJsonArray:
        if type(value.items) is not tuple:
            raise TypeError("frozen_json_array_inventory_invalid")
        visited = 1
        for index, item in enumerate(value.items):
            visited += _scan(item, role_bearing, f"{pointer}/{index}")
        return visited
    if type(value) is FrozenJsonObject:
        if type(value.items) is not tuple:
            raise TypeError("frozen_json_object_inventory_invalid")
        validated_items: list[tuple[str, FrozenJsonValue]] = []
        for entry in value.items:
            if type(entry) is not tuple or len(entry) != 2 or type(entry[0]) is not str:
                raise TypeError("frozen_json_object_inventory_invalid")
            validated_items.append((entry[0], entry[1]))
        keys = tuple(key for key, _item in validated_items)
        if len(set(keys)) != len(keys) or keys != tuple(sorted(keys, key=_utf16_sort_key)):
            raise TypeError("frozen_json_object_inventory_invalid")
        visited = 1
        for key, item in validated_items:
            if _is_forbidden_identifier(key):
                raise ForbiddenRoleError(f"{pointer}/{key}")
            visited += _scan(
                item,
                key in ROLE_BEARING_STRING_KEYS,
                f"{pointer}/{key}",
            )
        return visited
    raise TypeError(f"frozen_json_value_type_invalid:{type(value).__name__}")


def scan_document_for_forbidden_roles(
    document: CanonicalJsonDocument,
) -> ForbiddenRoleScanResult:
    if type(document) is not CanonicalJsonDocument:
        raise TypeError("canonical_json_document_type_invalid")
    visited = _scan(document.root, False, "")
    if visited != document.node_count:
        raise TypeError(
            f"canonical_json_document_node_count_invalid:{visited}/{document.node_count}"
        )
    return ForbiddenRoleScanResult(visited_nodes=visited)


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "numericPayloadOpened": False,
        "executionAuthorized": False,
        "candidateAccepted": False,
        "replayAuthority": False,
        "diagnosticPass": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

if any(AUTHORITY_LOCKS.values()):
    raise RuntimeError("forbidden_role_authority_lock_invalid")
