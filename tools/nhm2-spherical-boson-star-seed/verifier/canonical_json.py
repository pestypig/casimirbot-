"""Bounded canonical-JSON boundary for the independent spherical verifier.

The frozen interchange uses JSON only for structural records. Scientific real
values are strings or directed dyadic endpoints, so the admitted JSON subset is
deliberately small: null, booleans, Unicode scalar strings, safe integers,
arrays, and objects. A document is accepted only when its input bytes already
equal the unique RFC 8785 serialization of the decoded value.

The parser is source-disjoint from the producer and applies byte, token, depth,
string, array, and object caps while scanning, before constructing a container.
Successful parsing is structural evidence only. It grants no proof, seed,
replay, lamp, or physical authority.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from types import MappingProxyType
from typing import Final, TypeAlias


MAXIMUM_DEPTH: Final[int] = 32
MAXIMUM_TOKENS: Final[int] = 1_048_576
MAXIMUM_NODES: Final[int] = 32_768
MAXIMUM_ARRAY_LENGTH: Final[int] = 8_192
MAXIMUM_OBJECT_PROPERTY_COUNT: Final[int] = 256
MAXIMUM_STRING_UTF8_BYTES: Final[int] = 65_536
MAXIMUM_SAFE_INTEGER: Final[int] = (1 << 53) - 1

DOCUMENT_BYTE_CAPS: Final = MappingProxyType(
    {
        "descriptor": 1_048_576,
        "manifest": 8_388_608,
        "preseal": 8_388_608,
        "summary": 1_048_576,
        "failure_receipt": 262_144,
        "proof_record": 65_536,
    }
)


class CanonicalJsonError(ValueError):
    """Typed fail-closed boundary error with a stable machine code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenJsonArray:
    items: tuple["FrozenJsonValue", ...]

    def __len__(self) -> int:
        return len(self.items)

    def at(self, index: int) -> "FrozenJsonValue":
        if type(index) is not int or index < 0 or index >= len(self.items):
            raise CanonicalJsonError("json_array_index_invalid", repr(index))
        return self.items[index]


@dataclass(frozen=True, slots=True)
class FrozenJsonObject:
    items: tuple[tuple[str, "FrozenJsonValue"], ...]

    def keys(self) -> tuple[str, ...]:
        return tuple(key for key, _value in self.items)

    def get(self, key: str) -> "FrozenJsonValue":
        if type(key) is not str:
            raise CanonicalJsonError("json_object_key_type_invalid", type(key).__name__)
        for candidate, value in self.items:
            if candidate == key:
                return value
        raise CanonicalJsonError("json_object_key_unknown", key)


FrozenJsonScalar: TypeAlias = None | bool | int | str
FrozenJsonValue: TypeAlias = FrozenJsonScalar | FrozenJsonArray | FrozenJsonObject


@dataclass(frozen=True, slots=True)
class CanonicalJsonDocument:
    document_class: str
    raw_bytes: bytes
    plain_sha256: str
    root: FrozenJsonValue
    node_count: int
    token_count: int


def _validate_unicode_scalar_string(value: str, location: str) -> None:
    if "\x00" in value or any(0xD800 <= ord(character) <= 0xDFFF for character in value):
        raise CanonicalJsonError("json_string_scalar_invalid", location)
    encoded = value.encode("utf-8", errors="strict")
    if len(encoded) > MAXIMUM_STRING_UTF8_BYTES:
        raise CanonicalJsonError(
            "json_string_utf8_limit_exceeded",
            f"{location}:{len(encoded)}/{MAXIMUM_STRING_UTF8_BYTES}",
        )


def _utf16_sort_key(value: str) -> bytes:
    _validate_unicode_scalar_string(value, "object_key")
    return value.encode("utf-16-be", errors="strict")


def _quoted_string(value: str) -> bytes:
    _validate_unicode_scalar_string(value, "canonical_string")
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    ).encode("utf-8", errors="strict")


def _canonical_bytes(value: FrozenJsonValue) -> bytes:
    if value is None:
        return b"null"
    if type(value) is bool:
        return b"true" if value else b"false"
    if type(value) is int:
        return str(value).encode("ascii")
    if type(value) is str:
        return _quoted_string(value)
    if type(value) is FrozenJsonArray:
        return b"[" + b",".join(_canonical_bytes(item) for item in value.items) + b"]"
    if type(value) is FrozenJsonObject:
        encoded_items = (
            _quoted_string(key) + b":" + _canonical_bytes(item)
            for key, item in value.items
        )
        return b"{" + b",".join(encoded_items) + b"}"
    raise CanonicalJsonError("json_value_type_invalid", type(value).__name__)


class _BoundedParser:
    __slots__ = ("_index", "_length", "_nodes", "_text", "_tokens")

    def __init__(self, text: str) -> None:
        self._text = text
        self._length = len(text)
        self._index = 0
        self._nodes = 0
        self._tokens = 0

    @property
    def node_count(self) -> int:
        return self._nodes

    @property
    def token_count(self) -> int:
        return self._tokens

    def _token(self) -> None:
        self._tokens += 1
        if self._tokens > MAXIMUM_TOKENS:
            raise CanonicalJsonError(
                "json_token_limit_exceeded", f"{self._tokens}/{MAXIMUM_TOKENS}"
            )

    def _peek(self) -> str | None:
        return self._text[self._index] if self._index < self._length else None

    def _take(self, expected: str | None = None) -> str:
        if self._index >= self._length:
            raise CanonicalJsonError("json_syntax_invalid", "unexpected_end")
        value = self._text[self._index]
        if expected is not None and value != expected:
            raise CanonicalJsonError(
                "json_syntax_invalid", f"expected_{expected!r}_at_{self._index}"
            )
        self._index += 1
        return value

    def parse(self) -> FrozenJsonValue:
        value = self._value(0)
        if self._index != self._length:
            if self._text[self._index] in " \t\r\n":
                raise CanonicalJsonError(
                    "json_not_rfc8785_canonical", "trailing_whitespace"
                )
            raise CanonicalJsonError(
                "json_syntax_invalid", f"trailing_byte_at_{self._index}"
            )
        return value

    def _value(self, depth: int) -> FrozenJsonValue:
        self._nodes += 1
        if self._nodes > MAXIMUM_NODES:
            raise CanonicalJsonError(
                "json_node_limit_exceeded", f"{self._nodes}/{MAXIMUM_NODES}"
            )
        character = self._peek()
        if character is None:
            raise CanonicalJsonError("json_syntax_invalid", "missing_value")
        if character == '"':
            self._token()
            return self._string()
        if character == "[":
            return self._array(depth + 1)
        if character == "{":
            return self._object(depth + 1)
        if character == "t":
            return self._literal("true", True)
        if character == "f":
            return self._literal("false", False)
        if character == "n":
            return self._literal("null", None)
        if character == "-" or "0" <= character <= "9":
            self._token()
            return self._integer()
        if character in " \t\r\n":
            raise CanonicalJsonError("json_not_rfc8785_canonical", "whitespace")
        if character in "NIn":
            raise CanonicalJsonError("json_nonfinite_number_forbidden", character)
        raise CanonicalJsonError(
            "json_syntax_invalid", f"unexpected_{ord(character):04x}_at_{self._index}"
        )

    def _literal(self, spelling: str, value: FrozenJsonScalar) -> FrozenJsonScalar:
        self._token()
        end = self._index + len(spelling)
        if self._text[self._index : end] != spelling:
            raise CanonicalJsonError("json_syntax_invalid", f"literal_at_{self._index}")
        self._index = end
        return value

    def _integer(self) -> int:
        start = self._index
        if self._peek() == "-":
            self._index += 1
            if self._peek() is None:
                raise CanonicalJsonError("json_syntax_invalid", "minus_without_number")
        first = self._peek()
        if first == "0":
            self._index += 1
            if self._peek() is not None and "0" <= self._peek() <= "9":
                raise CanonicalJsonError("json_not_rfc8785_canonical", "leading_zero")
        elif first is not None and "1" <= first <= "9":
            while self._peek() is not None and "0" <= self._peek() <= "9":
                self._index += 1
        else:
            raise CanonicalJsonError("json_syntax_invalid", f"number_at_{start}")

        next_character = self._peek()
        if next_character in (".", "e", "E"):
            raise CanonicalJsonError(
                "json_noninteger_number_forbidden", self._text[start : self._index + 1]
            )
        token = self._text[start : self._index]
        if token == "-0":
            raise CanonicalJsonError("json_negative_zero_forbidden", token)
        digits = token[1:] if token.startswith("-") else token
        maximum = str(MAXIMUM_SAFE_INTEGER)
        if len(digits) > len(maximum) or (
            len(digits) == len(maximum) and digits > maximum
        ):
            raise CanonicalJsonError("json_safe_integer_range_exceeded", token[:32])
        return int(token, 10)

    def _string(self) -> str:
        self._take('"')
        characters: list[str] = []
        utf8_bytes = 0
        while True:
            character = self._take()
            if character == '"':
                result = "".join(characters)
                _validate_unicode_scalar_string(result, f"string_at_{self._index}")
                return result
            if character == "\\":
                escape = self._take()
                simple = {
                    '"': '"',
                    "\\": "\\",
                    "/": "/",
                    "b": "\b",
                    "f": "\f",
                    "n": "\n",
                    "r": "\r",
                    "t": "\t",
                }
                if escape in simple:
                    decoded = simple[escape]
                elif escape == "u":
                    decoded = self._unicode_escape()
                else:
                    raise CanonicalJsonError(
                        "json_syntax_invalid", f"escape_at_{self._index - 1}"
                    )
            else:
                codepoint = ord(character)
                if codepoint < 0x20:
                    raise CanonicalJsonError(
                        "json_syntax_invalid", f"control_at_{self._index - 1}"
                    )
                if 0xD800 <= codepoint <= 0xDFFF:
                    raise CanonicalJsonError(
                        "json_string_scalar_invalid", f"literal_surrogate_at_{self._index - 1}"
                    )
                decoded = character
            if decoded == "\x00":
                raise CanonicalJsonError("json_string_scalar_invalid", "nul")
            utf8_bytes += len(decoded.encode("utf-8", errors="strict"))
            if utf8_bytes > MAXIMUM_STRING_UTF8_BYTES:
                raise CanonicalJsonError(
                    "json_string_utf8_limit_exceeded",
                    f"{utf8_bytes}/{MAXIMUM_STRING_UTF8_BYTES}",
                )
            characters.append(decoded)

    def _unicode_escape(self) -> str:
        first = self._hex_quad()
        if 0xDC00 <= first <= 0xDFFF:
            raise CanonicalJsonError("json_string_scalar_invalid", "unpaired_low_surrogate")
        if 0xD800 <= first <= 0xDBFF:
            if self._take() != "\\" or self._take() != "u":
                raise CanonicalJsonError("json_string_scalar_invalid", "unpaired_high_surrogate")
            second = self._hex_quad()
            if not 0xDC00 <= second <= 0xDFFF:
                raise CanonicalJsonError("json_string_scalar_invalid", "unpaired_high_surrogate")
            return chr(0x10000 + ((first - 0xD800) << 10) + second - 0xDC00)
        return chr(first)

    def _hex_quad(self) -> int:
        end = self._index + 4
        if end > self._length:
            raise CanonicalJsonError("json_syntax_invalid", "short_unicode_escape")
        token = self._text[self._index : end]
        if any(character not in "0123456789abcdefABCDEF" for character in token):
            raise CanonicalJsonError("json_syntax_invalid", f"unicode_escape_{token}")
        self._index = end
        return int(token, 16)

    def _array(self, depth: int) -> FrozenJsonArray:
        if depth > MAXIMUM_DEPTH:
            raise CanonicalJsonError(
                "json_depth_limit_exceeded", f"{depth}/{MAXIMUM_DEPTH}"
            )
        self._token()
        self._take("[")
        items: list[FrozenJsonValue] = []
        if self._peek() == "]":
            self._token()
            self._take("]")
            return FrozenJsonArray(())
        while True:
            if len(items) >= MAXIMUM_ARRAY_LENGTH:
                raise CanonicalJsonError(
                    "json_array_length_limit_exceeded",
                    f"{len(items) + 1}/{MAXIMUM_ARRAY_LENGTH}",
                )
            items.append(self._value(depth))
            character = self._peek()
            if character == ",":
                self._token()
                self._take(",")
                continue
            if character == "]":
                self._token()
                self._take("]")
                return FrozenJsonArray(tuple(items))
            raise CanonicalJsonError(
                "json_syntax_invalid", f"array_separator_at_{self._index}"
            )

    def _object(self, depth: int) -> FrozenJsonObject:
        if depth > MAXIMUM_DEPTH:
            raise CanonicalJsonError(
                "json_depth_limit_exceeded", f"{depth}/{MAXIMUM_DEPTH}"
            )
        self._token()
        self._take("{")
        items: list[tuple[str, FrozenJsonValue]] = []
        keys: set[str] = set()
        if self._peek() == "}":
            self._token()
            self._take("}")
            return FrozenJsonObject(())
        while True:
            if len(items) >= MAXIMUM_OBJECT_PROPERTY_COUNT:
                raise CanonicalJsonError(
                    "json_object_property_limit_exceeded",
                    f"{len(items) + 1}/{MAXIMUM_OBJECT_PROPERTY_COUNT}",
                )
            if self._peek() != '"':
                raise CanonicalJsonError(
                    "json_syntax_invalid", f"object_key_at_{self._index}"
                )
            self._token()
            key = self._string()
            _validate_unicode_scalar_string(key, "object_key")
            if key in keys:
                raise CanonicalJsonError("json_duplicate_key", key)
            keys.add(key)
            self._token()
            self._take(":")
            item = self._value(depth)
            items.append((key, item))
            character = self._peek()
            if character == ",":
                self._token()
                self._take(",")
                continue
            if character == "}":
                self._token()
                self._take("}")
                items.sort(key=lambda pair: _utf16_sort_key(pair[0]))
                return FrozenJsonObject(tuple(items))
            raise CanonicalJsonError(
                "json_syntax_invalid", f"object_separator_at_{self._index}"
            )


def parse_canonical_json_bytes(
    raw: bytes, document_class: str
) -> CanonicalJsonDocument:
    """Parse one exact canonical JSON document under a frozen byte profile."""

    if type(raw) is not bytes:
        raise CanonicalJsonError("json_bytes_type_invalid", type(raw).__name__)
    if type(document_class) is not str or document_class not in DOCUMENT_BYTE_CAPS:
        raise CanonicalJsonError("json_document_class_invalid", repr(document_class))
    byte_cap = DOCUMENT_BYTE_CAPS[document_class]
    if len(raw) == 0 or len(raw) > byte_cap:
        raise CanonicalJsonError(
            "json_document_size_invalid", f"{document_class}:{len(raw)}/{byte_cap}"
        )
    if raw.startswith(b"\xef\xbb\xbf"):
        raise CanonicalJsonError("json_bom_forbidden", "utf8_bom")
    try:
        text = raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError as error:
        raise CanonicalJsonError("json_utf8_invalid", str(error.start)) from error

    parser = _BoundedParser(text)
    try:
        frozen = parser.parse()
        canonical = _canonical_bytes(frozen)
    except CanonicalJsonError:
        raise
    except (RecursionError, UnicodeError, ValueError) as error:
        raise CanonicalJsonError("json_parser_internal_failure", type(error).__name__) from error
    if canonical != raw:
        raise CanonicalJsonError("json_not_rfc8785_canonical", sha256(raw).hexdigest())
    return CanonicalJsonDocument(
        document_class=document_class,
        raw_bytes=bytes(raw),
        plain_sha256=sha256(raw).hexdigest(),
        root=frozen,
        node_count=parser.node_count,
        token_count=parser.token_count,
    )


_EXPECTED_AUTHORITY_LOCKS: Final = {
    "implementationClosureComplete": False,
    "runtimeClosureComplete": False,
    "executionAuthorized": False,
    "executionObserved": False,
    "proofRecordsAccepted": False,
    "seedAccepted": False,
    "replayAuthority": False,
    "independentAgreement": False,
    "semiclassicalStressNoiseLamp": False,
    "semiclassicalConstraintAlgebraLamp": False,
    "physicalViability": False,
    "propulsion": False,
    "transport": False,
}
AUTHORITY_LOCKS: Final = MappingProxyType(dict(_EXPECTED_AUTHORITY_LOCKS))


if dict(AUTHORITY_LOCKS) != _EXPECTED_AUTHORITY_LOCKS:
    raise RuntimeError("spherical_seed_verifier_canonical_json_authority_invariant")
