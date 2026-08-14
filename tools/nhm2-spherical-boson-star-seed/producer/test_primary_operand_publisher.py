from __future__ import annotations

import ast
from dataclasses import dataclass, replace
from hashlib import sha256
import hmac
import inspect
import json
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
VERIFIER = HERE.parent / "verifier"
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import primary_operand_publisher as publisher

if str(VERIFIER) not in sys.path:
    sys.path.insert(0, str(VERIFIER))

import canonical_json
import primary_bundle


@dataclass(slots=True)
class _Handle:
    final_root: str
    final_name: str
    temp_name: str | None = None
    files: dict[str, bytes] | None = None
    file_modes: dict[str, int] | None = None
    directories: dict[str, int] | None = None
    temp_inode: int | None = None
    renamed: bool = False


class _DeterministicLinuxSyscallHarness:
    """In-memory event harness; it is never accepted by the public API."""

    test_only_linux_emulation = True

    def __init__(
        self,
        *,
        fail_event: str | None = None,
        replace_final_inode: bool = False,
        race_final_on_rename: bool = False,
    ) -> None:
        self.events: list[str] = []
        self.fail_event = fail_event
        self.failure_fired = False
        self.existing_roots: set[str] = set()
        self.published: dict[str, dict[str, bytes]] = {}
        self.published_file_modes: dict[str, dict[str, int]] = {}
        self.published_directory_modes: dict[str, dict[str, int]] = {}
        self.published_root_inodes: dict[str, int] = {}
        self.quarantined: dict[str, _Handle] = {}
        self._nonce_ordinal = 1
        self._inode_ordinal = 10_000
        self.replace_final_inode = replace_final_inode
        self.race_final_on_rename = race_final_on_rename

    def _hit(self, event: str) -> None:
        self.events.append(event)
        if self.fail_event == event and not self.failure_fired:
            self.failure_fired = True
            raise OSError(f"injected:{event}")

    def resource_preflight(self, total_bytes: int) -> None:
        self._hit(f"resource_preflight:{total_bytes}")
        if type(total_bytes) is not int or total_bytes <= publisher.TOTAL_PAYLOAD_BYTES:
            raise OSError("bad resource preflight")

    def require_publication_prepared_not_future(self, timestamp: str) -> None:
        self._hit(f"publication_prepared_not_future:{timestamp}")

    def open_parent(self, final_root: str) -> _Handle:
        self._hit(f"open_parent:{final_root}:O_DIRECTORY|O_NOFOLLOW")
        return _Handle(final_root=final_root, final_name=final_root.rsplit("/", 1)[1])

    def require_local_filesystem(self, handle: _Handle) -> None:
        self._hit(f"require_local_filesystem:{handle.final_root}:NO_XDEV")

    def require_final_absent(self, handle: _Handle) -> None:
        self._hit(f"require_final_absent:{handle.final_root}")
        if handle.final_root in self.existing_roots or handle.final_root in self.published:
            raise FileExistsError(handle.final_root)

    def getrandom_nonce(self) -> str:
        nonce = f"{self._nonce_ordinal:032x}"
        self._nonce_ordinal += 1
        self._hit(f"getrandom_nonce:{nonce}")
        return nonce

    def create_temp(self, handle: _Handle, nonce: str) -> None:
        handle.temp_name = f".{handle.final_name}.tmp.{nonce}"
        handle.files = {}
        handle.file_modes = {}
        handle.directories = {".": 0o700}
        handle.temp_inode = self._inode_ordinal
        self._inode_ordinal += 1
        self._hit(f"mkdirat_temp:{handle.temp_name}:0700:O_EXCL")

    def mkdir(self, handle: _Handle, relative_path: str, mode: int) -> None:
        assert handle.directories is not None
        self._hit(
            f"mkdirat:{relative_path}:{mode:04o}:openat2_RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_MAGICLINKS|RESOLVE_NO_XDEV"
        )
        if relative_path in handle.directories:
            raise FileExistsError(relative_path)
        handle.directories[relative_path] = mode

    def write_verified_file(self, handle: _Handle, relative_path: str, raw: bytes) -> None:
        assert handle.files is not None
        assert handle.file_modes is not None
        self._hit(f"open_exclusive:{relative_path}:O_CREAT|O_EXCL|O_NOFOLLOW:0600")
        if relative_path in handle.files:
            raise FileExistsError(relative_path)
        self._hit(f"write_complete:{relative_path}:{len(raw)}")
        handle.files[relative_path] = bytes(raw)
        handle.file_modes[relative_path] = 0o600
        self._hit(f"fdatasync:{relative_path}")
        self._hit(f"fsync_file:{relative_path}")
        self._hit(f"fchmod:{relative_path}:0400")
        handle.file_modes[relative_path] = 0o400
        self._hit(f"fsync_file_after_chmod:{relative_path}")
        self._hit(
            f"openat2_readback:{relative_path}:RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_MAGICLINKS|RESOLVE_NO_XDEV"
        )
        self._hit(f"fstat_pre:{relative_path}")
        self._hit(f"readback_exact:{relative_path}:{len(raw)}")
        self._hit(f"fstat_post:{relative_path}")

    def fsync_directory(self, handle: _Handle, relative_path: str) -> None:
        self._hit(f"fsync_directory:{relative_path}")

    def fsync_parent(self, handle: _Handle) -> None:
        phase = "postrename" if handle.renamed else "prerename"
        self._hit(f"fsync_parent:{handle.final_root}:{phase}")

    def rename_noreplace(self, handle: _Handle) -> None:
        self._hit(
            f"renameat2:{handle.temp_name}->{handle.final_name}:RENAME_NOREPLACE"
        )
        if self.race_final_on_rename:
            self.race_final_on_rename = False
            self.existing_roots.add(handle.final_root)
        if handle.final_root in self.existing_roots or handle.final_root in self.published:
            raise FileExistsError(handle.final_root)
        assert handle.files is not None
        assert handle.file_modes is not None
        assert handle.directories is not None
        self.published[handle.final_root] = dict(handle.files)
        self.published_file_modes[handle.final_root] = dict(handle.file_modes)
        self.published_directory_modes[handle.final_root] = dict(handle.directories)
        assert handle.temp_inode is not None
        self.published_root_inodes[handle.final_root] = (
            handle.temp_inode + 1 if self.replace_final_inode else handle.temp_inode
        )
        self.replace_final_inode = False
        handle.renamed = True

    def final_readback(
        self,
        handle: _Handle,
        files: tuple[tuple[str, bytes], ...],
        directories: tuple[str, ...],
    ) -> None:
        self._hit(
            f"openat2_final_readback:{handle.final_root}:RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_MAGICLINKS|RESOLVE_NO_XDEV"
        )
        expected = dict(files)
        if self.published.get(handle.final_root) != expected:
            raise OSError("final content mismatch")
        if self.published_root_inodes.get(handle.final_root) != handle.temp_inode:
            raise OSError("final root inode lineage mismatch")
        modes = self.published_file_modes[handle.final_root]
        directory_modes = self.published_directory_modes[handle.final_root]
        if set(modes) != set(expected) or any(mode != 0o400 for mode in modes.values()):
            raise OSError("final file mode mismatch")
        if directory_modes != {".": 0o700, **{path: 0o700 for path in directories}}:
            raise OSError("final directory mode mismatch")
        self._hit(f"final_inventory_readback_ok:{handle.final_root}")

    def quarantine(self, handle: _Handle) -> None:
        quarantine_name = handle.final_root if handle.renamed else handle.temp_name
        self._hit(f"fchmod_quarantine_root:{quarantine_name}:0000")
        if handle.directories is not None:
            handle.directories["."] = 0o000
        if handle.renamed and handle.final_root in self.published_directory_modes:
            self.published_directory_modes[handle.final_root]["."] = 0o000
        self._hit(f"fsync_quarantine:{quarantine_name}")
        self._hit(f"fsync_parent_quarantine:{handle.final_root}")
        assert quarantine_name is not None
        self.quarantined[quarantine_name] = handle

    def close(self, handle: _Handle) -> None:
        self.events.append(f"close_owned_fds:{handle.final_root}")


class _TestOnlyContextIssuer:
    """One-candidate issuer confined to this in-memory test harness."""

    __slots__ = ("_consumed", "_entry", "_issue_started")
    _SECRET = b"primary-operand-test-issuer-v1!"

    def __init__(self) -> None:
        self._consumed = False
        self._entry: tuple[
            publisher._AuthenticatedPublicationContext,
            _DeterministicLinuxSyscallHarness,
            str,
        ] | None = None
        self._issue_started = False

    def issue(
        self,
        *,
        kernel: _DeterministicLinuxSyscallHarness,
        scalar_buffers_f64le: tuple[bytes, ...],
        core_l2_u_f64le: bytes,
        core_l2_v_f64le: bytes,
        tail_h_f64le: bytes,
        tail_q_f64le: bytes,
        commit40: str,
        command_argv: tuple[str, ...],
        command_argv_sha256: str,
        dirty_tree_digest_sha256: str,
        source_manifest_binding: publisher._RawBinding,
        toolchain_manifest_binding: publisher._RawBinding,
        executable_binding: publisher._RawBinding,
        runtime_manifest_binding: publisher._RawBinding,
        preexecution_preseal_binding: publisher._RawBinding,
        freshness_observations: tuple[publisher._FreshnessObservation, ...],
        static_input_aggregate_sha256: str,
        monotonic_start_nanoseconds: str,
        monotonic_end_nanoseconds: str,
        monotonic_elapsed_nanoseconds: str,
        wall_start_utc: str,
        wall_end_utc: str,
        publication_prepared_wall_utc: str,
        final_root: str,
        failure_root: str,
    ) -> tuple[
        publisher._AuthenticatedPublicationContext,
        publisher._FrozenPrimaryOperands,
    ]:
        if self._issue_started:
            raise publisher.PrimaryOperandPublisherError(
                "publication_context_issuer_one_shot"
            )
        self._issue_started = True
        if type(kernel) is not _DeterministicLinuxSyscallHarness:
            raise publisher.PrimaryOperandPublisherError(
                "test_only_deterministic_syscall_harness_required"
            )
        operands = publisher._FrozenPrimaryOperands(
            publisher._TEST_CONSTRUCTION_SENTINEL,
            (
                scalar_buffers_f64le,
                core_l2_u_f64le,
                core_l2_v_f64le,
                tail_h_f64le,
                tail_q_f64le,
            ),
        )
        payload_bytes = publisher._snapshot_operand_payloads(operands)
        payload_bindings = publisher._payload_bindings(payload_bytes)
        raw_hashes = tuple(item.raw_sha256 for item in payload_bindings)
        values: dict[str, object] = {
            "attempt_ordinal": 1,
            "candidate_id": publisher.CANDIDATE_ID,
            "candidate_plan_sha256": publisher.CANDIDATE_PLAN_SHA256,
            "tolerance_policy_sha256": publisher.TOLERANCE_POLICY_SHA256,
            "branch_bvp_sha256": publisher.BRANCH_BVP_SHA256,
            "semantic_seed_sha256": publisher.SEMANTIC_SEED_SHA256,
            "operation_prepolicy_sha256": publisher.OPERATION_PREPOLICY_SHA256,
            "primary_numerics_policy_sha256": publisher.PRIMARY_NUMERICS_POLICY_SHA256,
            "directed_proof_architecture_sha256": (
                publisher.DIRECTED_PROOF_ARCHITECTURE_SHA256
            ),
            "directed_proof_operator_sha256": publisher.DIRECTED_PROOF_OPERATOR_SHA256,
            "interchange_policy_sha256": publisher.INTERCHANGE_POLICY_SHA256,
            "expected_raw_payload_sha256": raw_hashes,
            "expected_input_binding_sha256": "0" * 64,
            "command_argv_sha256": command_argv_sha256,
            "static_input_aggregate_sha256": static_input_aggregate_sha256,
            "commit40": commit40,
            "command_argv": command_argv,
            "dirty_tree_digest_sha256": dirty_tree_digest_sha256,
            "source_manifest_binding": source_manifest_binding,
            "toolchain_manifest_binding": toolchain_manifest_binding,
            "executable_binding": executable_binding,
            "runtime_manifest_binding": runtime_manifest_binding,
            "preexecution_preseal_binding": preexecution_preseal_binding,
            "freshness_observations": freshness_observations,
            "monotonic_start_nanoseconds": monotonic_start_nanoseconds,
            "monotonic_end_nanoseconds": monotonic_end_nanoseconds,
            "monotonic_elapsed_nanoseconds": monotonic_elapsed_nanoseconds,
            "wall_start_utc": wall_start_utc,
            "wall_end_utc": wall_end_utc,
            "publication_prepared_wall_utc": publication_prepared_wall_utc,
            "final_root": final_root,
            "failure_root": failure_root,
            "output_root_identity_sha256": publisher._output_root_identity_sha256(
                final_root
            ),
            "failure_root_identity_sha256": publisher._output_root_identity_sha256(
                failure_root
            ),
            "context_hmac_sha256": "0" * 64,
        }
        provisional = publisher._AuthenticatedPublicationContext(
            publisher._TEST_CONSTRUCTION_SENTINEL, values
        )
        publisher._validate_context(provisional)
        descriptor_raw = publisher._descriptor_bytes(provisional, payload_bindings)
        values["expected_input_binding_sha256"] = publisher._input_binding_sha256(
            publisher._descriptor_sha256(descriptor_raw), payload_bindings
        )
        provisional = publisher._AuthenticatedPublicationContext(
            publisher._TEST_CONSTRUCTION_SENTINEL, values
        )
        mac = hmac.new(
            self._SECRET,
            publisher._canonical_json(
                publisher._context_json(provisional, include_hmac=False)
            ),
            "sha256",
        ).hexdigest()
        values["context_hmac_sha256"] = mac
        context = publisher._AuthenticatedPublicationContext(
            publisher._TEST_CONSTRUCTION_SENTINEL, values
        )
        publisher._validate_context(context)
        self._entry = (context, kernel, mac)
        return context, operands

    def consume(
        self,
        context: object,
        kernel: object,
    ) -> publisher._AuthenticatedPublicationContext:
        entry = self._entry
        if (
            entry is None
            or entry[0] is not context
            or entry[1] is not kernel
            or type(kernel) is not _DeterministicLinuxSyscallHarness
        ):
            raise publisher.PrimaryOperandPublisherError(
                "publication_context_not_authenticated"
            )
        if self._consumed:
            raise publisher.PrimaryOperandPublisherError("publication_context_reused")
        try:
            publisher._validate_context(entry[0])
        except publisher.PrimaryOperandPublisherError as error:
            raise publisher.PrimaryOperandPublisherError(
                "publication_context_not_authenticated"
            ) from error
        expected_mac = hmac.new(
            self._SECRET,
            publisher._canonical_json(
                publisher._context_json(entry[0], include_hmac=False)
            ),
            "sha256",
        ).hexdigest()
        if not hmac.compare_digest(expected_mac, entry[2]) or not hmac.compare_digest(
            expected_mac, entry[0].context_hmac_sha256
        ):
            raise publisher.PrimaryOperandPublisherError(
                "publication_context_not_authenticated"
            )
        self._consumed = True
        return entry[0]


def _publish_authenticated_test_only(
    issuer: _TestOnlyContextIssuer,
    publication_context: object,
    operands: object,
    kernel: _DeterministicLinuxSyscallHarness,
) -> publisher.FrozenPrimaryOperandPublication:
    """Exercise source helpers only with the exact in-memory test adapter."""

    if (
        type(issuer) is not _TestOnlyContextIssuer
        or type(kernel) is not _DeterministicLinuxSyscallHarness
    ):
        raise publisher.PrimaryOperandPublisherError(
            "test_only_deterministic_syscall_harness_required"
        )
    context = issuer.consume(publication_context, kernel)
    publisher._validate_context(context)

    input_binding: str | None = None
    try:
        payload_bytes = publisher._snapshot_operand_payloads(operands)
        payload_bindings = publisher._payload_bindings(payload_bytes)
        if (
            tuple(item.raw_sha256 for item in payload_bindings)
            != context.expected_raw_payload_sha256
        ):
            raise publisher.PrimaryOperandPublisherError(
                "numeric_payload_hash_or_shape_mismatch", "authenticated_hashes"
            )
        publisher._classify_numeric_payloads(payload_bytes)
        descriptor_raw = publisher._descriptor_bytes(context, payload_bindings)
        descriptor_hash = publisher._descriptor_sha256(descriptor_raw)
        input_binding = publisher._input_binding_sha256(
            descriptor_hash, payload_bindings
        )
        if input_binding != context.expected_input_binding_sha256:
            raise publisher.PrimaryOperandPublisherError(
                "numeric_payload_hash_or_shape_mismatch", "input_binding"
            )
        total_bytes = (
            publisher.TOTAL_PAYLOAD_BYTES
            + len(descriptor_raw)
            + publisher.MAXIMUM_RECEIPT_BYTES
        )
        try:
            kernel.resource_preflight(total_bytes)
        except publisher.PrimaryOperandPublisherError:
            raise
        except Exception as error:
            raise publisher.PrimaryOperandPublisherError(
                "resource_preflight_failure", type(error).__name__
            ) from error
        try:
            kernel.require_publication_prepared_not_future(
                context.publication_prepared_wall_utc
            )
        except publisher.PrimaryOperandPublisherError:
            raise
        except Exception as error:
            raise publisher.PrimaryOperandPublisherError(
                "primary_publication_failure", type(error).__name__
            ) from error
        payload_map = dict(payload_bytes)
        files_without_receipt = tuple(
            (path, payload_map[path]) for path in publisher.WRITE_ORDER[:5]
        ) + (("descriptor.json", descriptor_raw),)
        receipt_raw, _nonce = publisher._atomic_publish(
            kernel,
            context.final_root,
            ("coefficients",),
            files_without_receipt,
            lambda nonce: publisher._publication_receipt_bytes(
                context,
                payload_bindings,
                descriptor_raw,
                input_binding,
                nonce,
            ),
        )
        return publisher.FrozenPrimaryOperandPublication(
            final_root=context.final_root,
            descriptor_plain_sha256=publisher._hash_bytes(descriptor_raw),
            descriptor_sha256=descriptor_hash,
            input_binding_sha256=input_binding,
            payload_bindings=payload_bindings,
            descriptor_size_bytes=len(descriptor_raw),
            receipt_plain_sha256=publisher._hash_bytes(receipt_raw),
            receipt_size_bytes=len(receipt_raw),
            publisher_version=publisher.PUBLISHER_VERSION,
            blockers=publisher.PUBLICATION_BLOCKERS,
            publication_mode="test_only_deterministic_syscall_harness",
        )
    except publisher.PrimaryOperandPublisherError as error:
        failure = publisher._publish_failure_receipt(
            context,
            kernel,
            stage=publisher._failure_stage_for(error.code),
            code=(
                error.code
                if error.code
                in {
                    "numeric_payload_hash_or_shape_mismatch",
                    "numeric_payload_nonfinite",
                    "numeric_payload_negative_zero",
                    "resource_preflight_failure",
                    "primary_publication_failure",
                }
                else "primary_publication_failure"
            ),
            input_binding_sha256=input_binding,
        )
        raise publisher.PrimaryOperandPublisherError(
            error.code,
            error.detail,
            failure_publication=failure,
        ) from error


def _binding(
    path: str, media_type: str = "application/json", *, size: int = 1
) -> publisher._RawBinding:
    return publisher._RawBinding(
        media_type=media_type,
        path=path,
        sha256=sha256(path.encode("utf-8")).hexdigest(),
        size_bytes=size,
    )


def _file_stat(binding: publisher._RawBinding) -> publisher._FileStat:
    return publisher._FileStat(
        change_time_nanoseconds="11",
        device="12",
        inode=str(13 + len(binding.path)),
        mode_octal="0400",
        modify_time_nanoseconds="14",
        sha256=binding.sha256,
        size_bytes=binding.size_bytes,
    )


def _payload_values() -> dict[str, object]:
    return {
        "scalar_buffers_f64le": tuple(
            struct.pack("<d", 0.125 + index) for index in range(9)
        ),
        "core_l2_u_f64le": struct.pack(
            "<128d", *(0.01 * (index + 1) for index in range(128))
        ),
        "core_l2_v_f64le": struct.pack(
            "<128d", *(-0.01 * (index + 1) for index in range(128))
        ),
        "tail_h_f64le": struct.pack(
            "<32d", *(0.02 * (index + 1) for index in range(32))
        ),
        "tail_q_f64le": struct.pack(
            "<32d", *(-0.02 * (index + 1) for index in range(32))
        ),
    }


def _issue(
    kernel: _DeterministicLinuxSyscallHarness,
    *,
    issuer: _TestOnlyContextIssuer | None = None,
    final_suffix: str = "primary-operands",
    failure_suffix: str = "primary-failure",
    payload_overrides: dict[str, object] | None = None,
    command_argv: tuple[str, ...] = ("/opt/nhm2/producer", "--once"),
    freshness_override: tuple[publisher._FreshnessObservation, ...] | None = None,
) -> tuple[
    _TestOnlyContextIssuer,
    publisher._AuthenticatedPublicationContext,
    publisher._FrozenPrimaryOperands,
]:
    source = _binding("manifests/source.json")
    toolchain = _binding("manifests/toolchain.json")
    executable = _binding("bin/producer", "application/octet-stream")
    runtime = _binding("manifests/runtime.json")
    preseal = _binding("provenance/preexecution-preseal.json")
    bindings = (source, toolchain, executable, runtime, preseal)
    freshness = tuple(
        publisher._FreshnessObservation(
            path=binding.path,
            preopen=_file_stat(binding),
            postread=_file_stat(binding),
        )
        for binding in sorted(bindings, key=lambda item: item.path.encode("utf-8"))
    )
    values = _payload_values()
    if payload_overrides:
        values.update(payload_overrides)
    if issuer is None:
        issuer = _TestOnlyContextIssuer()
    context, operands = issuer.issue(
        kernel=kernel,
        scalar_buffers_f64le=values["scalar_buffers_f64le"],
        core_l2_u_f64le=values["core_l2_u_f64le"],
        core_l2_v_f64le=values["core_l2_v_f64le"],
        tail_h_f64le=values["tail_h_f64le"],
        tail_q_f64le=values["tail_q_f64le"],
        commit40="1" * 40,
        command_argv=command_argv,
        command_argv_sha256="4" * 64,
        dirty_tree_digest_sha256="2" * 64,
        source_manifest_binding=source,
        toolchain_manifest_binding=toolchain,
        executable_binding=executable,
        runtime_manifest_binding=runtime,
        preexecution_preseal_binding=preseal,
        freshness_observations=(
            freshness if freshness_override is None else freshness_override
        ),
        static_input_aggregate_sha256="3" * 64,
        monotonic_start_nanoseconds="100",
        monotonic_end_nanoseconds="150",
        monotonic_elapsed_nanoseconds="50",
        wall_start_utc="2026-08-14T12:00:00.000000000Z",
        wall_end_utc="2026-08-14T12:00:01.000000000Z",
        publication_prepared_wall_utc="2026-08-14T12:00:02.000000000Z",
        final_root=f"/srv/nhm2/{final_suffix}",
        failure_root=f"/srv/nhm2/{failure_suffix}",
    )
    return issuer, context, operands


def _publish(
    kernel: _DeterministicLinuxSyscallHarness,
    *,
    final_suffix: str = "primary-operands",
    failure_suffix: str = "primary-failure",
    payload_overrides: dict[str, object] | None = None,
) -> tuple[
    publisher.FrozenPrimaryOperandPublication,
    publisher._AuthenticatedPublicationContext,
    publisher._FrozenPrimaryOperands,
    _TestOnlyContextIssuer,
]:
    issuer, context, operands = _issue(
        kernel,
        final_suffix=final_suffix,
        failure_suffix=failure_suffix,
        payload_overrides=payload_overrides,
    )
    result = _publish_authenticated_test_only(issuer, context, operands, kernel)
    return result, context, operands, issuer


class PrimaryOperandPublisherTests(unittest.TestCase):
    def test_exact_policy_payload_and_authority_locks(self) -> None:
        self.assertEqual(
            (
                publisher.SEMANTIC_SEED_SHA256,
                publisher.SEMANTIC_SEED_CANONICAL_SIZE_BYTES,
                publisher.OPERATION_PREPOLICY_SHA256,
                publisher.OPERATION_PREPOLICY_CANONICAL_SIZE_BYTES,
                publisher.PRIMARY_NUMERICS_POLICY_SHA256,
                publisher.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
                publisher.DIRECTED_PROOF_ARCHITECTURE_SHA256,
                publisher.DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES,
                publisher.DIRECTED_PROOF_OPERATOR_SHA256,
                publisher.DIRECTED_PROOF_OPERATOR_CANONICAL_SIZE_BYTES,
                publisher.INTERCHANGE_POLICY_SHA256,
                publisher.INTERCHANGE_POLICY_CANONICAL_SIZE_BYTES,
            ),
            (
                "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
                18_894,
                "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
                32_308,
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
                "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99",
                42_778,
                "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b",
                34_695,
                "827eb79c27137dd1649b35884c945c2d6809483acf25c7fd68d2a3ed80936f95",
                67_853,
            ),
        )
        self.assertEqual(
            publisher.PAYLOAD_SPECS,
            (
                ("scalars.f64le", "primary_scalar_operands", 9, 72),
                (
                    "coefficients/core_L2_u.f64le",
                    "primary_L2_scalar_Chebyshev_coefficients",
                    128,
                    1_024,
                ),
                (
                    "coefficients/core_L2_V.f64le",
                    "primary_L2_potential_Chebyshev_coefficients",
                    128,
                    1_024,
                ),
                (
                    "coefficients/tail_H.f64le",
                    "primary_tail_H_Chebyshev_coefficients",
                    32,
                    256,
                ),
                (
                    "coefficients/tail_Q.f64le",
                    "primary_tail_Q_Chebyshev_coefficients",
                    32,
                    256,
                ),
            ),
        )
        self.assertEqual(
            publisher.SCALAR_ORDER,
            (
                "nu0",
                "Vc",
                "N0",
                "C",
                "kappa",
                "sigma",
                "lambda",
                "nu_star",
                "wSeed",
            ),
        )
        self.assertEqual(
            publisher.CANONICAL_INVENTORY_ORDER,
            (
                "descriptor.json",
                "scalars.f64le",
                "coefficients/core_L2_u.f64le",
                "coefficients/core_L2_V.f64le",
                "coefficients/tail_H.f64le",
                "coefficients/tail_Q.f64le",
                "receipt.json",
            ),
        )
        self.assertEqual(
            publisher.WRITE_ORDER,
            (
                "scalars.f64le",
                "coefficients/core_L2_u.f64le",
                "coefficients/core_L2_V.f64le",
                "coefficients/tail_H.f64le",
                "coefficients/tail_Q.f64le",
                "descriptor.json",
                "receipt.json",
            ),
        )
        self.assertEqual(publisher.TOTAL_PAYLOAD_ELEMENTS, 329)
        self.assertEqual(publisher.TOTAL_PAYLOAD_BYTES, 2_632)
        self.assertFalse(publisher.SERVER_PUBLICATION_CONTEXT_ISSUER_PRESENT)
        self.assertFalse(publisher.PRODUCTION_PUBLICATION_ENABLED)
        self.assertFalse(any(publisher.AUTHORITY_LOCKS.values()))
        self.assertEqual(
            publisher.PUBLICATION_BLOCKERS,
            (
                "server_publication_context_issuer_absent",
                "fixed_native_mpfr_65536_arena_not_implemented",
                "fixed_float64_262144_arena_not_implemented",
                "fixed_uint32_257_arena_not_implemented",
                "hash_bound_runtime_closure_instance_absent",
                "authenticated_preexecution_preseal_instance_absent",
                "command_argv_hash_recipe_not_closed",
                "integrated_seed_solve_acceptance_absent",
                "directed_proof_acceptance_absent",
            ),
        )
        self.assertEqual(
            publisher.REQUIRED_SERVER_CONTEXT_HANDOFF,
            (
                "inherited_sealed_read_only_context_fd_plus_outer_controller_nonce_and_preseal_binding",
                "or_canonical_context_and_preseal_signed_by_a_pinned_server_key_with_replay_protection_and_out_of_band_directory_fds",
            ),
        )

    def test_public_boundary_does_not_traverse_hostile_arguments(self) -> None:
        class Hostile:
            reads = 0

            def __getattribute__(self, name: str) -> object:
                type(self).reads += 1
                raise AssertionError(name)

            def __eq__(self, other: object) -> bool:
                type(self).reads += 1
                raise AssertionError("equality")

            def __iter__(self):
                type(self).reads += 1
                raise AssertionError("iteration")

        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "server_publication_context_issuer_absent",
        ):
            publisher.publish_primary_operands(Hostile(), Hostile())
        self.assertEqual(Hostile.reads, 0)

        for forbidden_suffix in (
            "declaredlevertensor",
            "leverTensor",
            "tile_schedule",
            "warp_control_tensor",
            "external_source_tensor",
        ):
            with self.subTest(forbidden_suffix=forbidden_suffix):
                kernel = _DeterministicLinuxSyscallHarness()
                with self.assertRaisesRegex(
                    publisher.PrimaryOperandPublisherError,
                    "forbidden_lever_or_tile_role",
                ):
                    _issue(
                        kernel,
                        final_suffix=forbidden_suffix,
                        failure_suffix="safe-failure-root",
                    )
                self.assertEqual(kernel.events, [])

    def test_success_writes_exact_canonical_bundle_in_durable_order(self) -> None:
        kernel = _DeterministicLinuxSyscallHarness()
        result, context, _operands, _issuer = _publish(kernel)
        files = kernel.published[context.final_root]
        self.assertEqual(set(files), set(publisher.CANONICAL_INVENTORY_ORDER))
        self.assertEqual(
            files["scalars.f64le"],
            b"".join(_payload_values()["scalar_buffers_f64le"]),
        )
        self.assertEqual(
            [
                event.split(":", 1)[1].split(":O_CREAT", 1)[0]
                for event in kernel.events
                if event.startswith("open_exclusive:")
            ],
            list(publisher.WRITE_ORDER),
        )
        self.assertTrue(all(mode == 0o400 for mode in kernel.published_file_modes[context.final_root].values()))
        self.assertEqual(
            kernel.published_directory_modes[context.final_root],
            {".": 0o700, "coefficients": 0o700},
        )

        descriptor_document = canonical_json.parse_canonical_json_bytes(
            files["descriptor.json"], "descriptor"
        )
        payloads = tuple((path, files[path]) for path, _role, _count, _size in publisher.PAYLOAD_SPECS)
        replay = primary_bundle.validate_source_primary_bundle(
            descriptor_document, payloads
        )
        self.assertEqual(
            replay.descriptor.source_input_binding_sha256,
            result.input_binding_sha256,
        )
        self.assertEqual(replay.descriptor.descriptor_sha256, result.descriptor_sha256)
        self.assertEqual(
            [payload.raw_sha256 for payload in replay.operands.payloads],
            [payload.raw_sha256 for payload in result.payload_bindings],
        )
        receipt = json.loads(files["receipt.json"].decode("utf-8"))
        descriptor_plain = json.loads(files["descriptor.json"].decode("utf-8"))
        self.assertEqual(
            files["receipt.json"], publisher._canonical_json(receipt)
        )
        self.assertIs(receipt["authorityFalse"], True)
        self.assertEqual(receipt["inputBindingSha256"], result.input_binding_sha256)
        self.assertEqual(
            receipt["orderedPayloadBindings"],
            descriptor_plain["orderedPayloadBindings"],
        )
        self.assertEqual(receipt["publication"]["finalRoot"], context.final_root)
        self.assertEqual(
            receipt["publication"]["publicationMethod"],
            "renameat2_RENAME_NOREPLACE_then_parent_fsync",
        )
        self.assertEqual(result.descriptor_plain_sha256, sha256(files["descriptor.json"]).hexdigest())
        self.assertEqual(result.receipt_plain_sha256, sha256(files["receipt.json"]).hexdigest())
        self.assertFalse(result.atomic_publication_observed)
        self.assertFalse(result.production_publication_observed)
        self.assertTrue(result.structural_protocol_test_completed)
        self.assertEqual(
            result.publication_mode,
            "test_only_deterministic_syscall_harness",
        )
        self.assertFalse(result.candidate_accepted)
        self.assertFalse(result.replay_authority)
        self.assertFalse(result.semiclassical_stress_noise_lamp)
        self.assertFalse(result.semiclassical_constraint_algebra_lamp)
        self.assertFalse(result.physical_viability)
        self.assertFalse(result.propulsion)
        self.assertFalse(result.transport)
        with self.assertRaises(TypeError):
            replace(result, candidate_accepted=True)
        with self.assertRaises(TypeError):
            replace(result, atomic_publication_observed=True)

        def index(prefix: str) -> int:
            return next(i for i, event in enumerate(kernel.events) if event.startswith(prefix))

        self.assertLess(index("fdatasync:scalars.f64le"), index("open_exclusive:descriptor.json"))
        self.assertLess(index("open_exclusive:descriptor.json"), index("open_exclusive:receipt.json"))
        self.assertLess(index("fsync_directory:coefficients"), index("fsync_directory:."))
        self.assertLess(index("fsync_directory:."), index("renameat2:"))
        self.assertLess(index("renameat2:"), index("openat2_final_readback:"))

    def test_context_is_exact_issuer_bound_and_one_shot(self) -> None:
        class HostileOperands:
            reads = 0

            def __getattribute__(self, name: str) -> object:
                type(self).reads += 1
                raise AssertionError(name)

        kernel = _DeterministicLinuxSyscallHarness()
        issuer, context, operands = _issue(kernel)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "publication_context_issuer_one_shot",
        ):
            _issue(
                kernel,
                issuer=issuer,
                final_suffix="forbidden-second-issuance",
                failure_suffix="forbidden-second-issuance-failure",
            )
        self.assertEqual(kernel.events, [])
        native_kernel_without_constructor = object.__new__(publisher._LinuxKernel)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "test_only_deterministic_syscall_harness_required",
        ):
            _publish_authenticated_test_only(
                issuer, context, HostileOperands(), native_kernel_without_constructor
            )
        self.assertEqual(HostileOperands.reads, 0)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "publication_context_not_authenticated",
        ):
            _publish_authenticated_test_only(
                issuer, object(), HostileOperands(), kernel
            )
        self.assertEqual(HostileOperands.reads, 0)
        self.assertEqual(kernel.events, [])

        result = _publish_authenticated_test_only(
            issuer, context, operands, kernel
        )
        self.assertFalse(result.atomic_publication_observed)
        self.assertTrue(result.structural_protocol_test_completed)
        event_count = len(kernel.events)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError, "publication_context_reused"
        ):
            _publish_authenticated_test_only(
                issuer, context, operands, kernel
            )
        self.assertEqual(len(kernel.events), event_count)

        second_kernel = _DeterministicLinuxSyscallHarness()
        second_issuer, second_context, second_operands = _issue(
            second_kernel,
            final_suffix="mutated-context",
            failure_suffix="mutated-context-failure",
        )
        object.__setattr__(second_context, "commit40", "f" * 40)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "publication_context_not_authenticated",
        ):
            _publish_authenticated_test_only(
                second_issuer, second_context, second_operands, second_kernel
            )
        self.assertEqual(second_kernel.events, [])

    def test_bound_payload_mutation_and_numeric_specials_fail_with_receipt(self) -> None:
        kernel = _DeterministicLinuxSyscallHarness()
        issuer, context, operands = _issue(kernel)
        mutated = bytearray(operands.core_l2_u_f64le)
        mutated[0] ^= 1
        object.__setattr__(operands, "core_l2_u_f64le", bytes(mutated))
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as caught:
            _publish_authenticated_test_only(
                issuer, context, operands, kernel
            )
        self.assertEqual(caught.exception.code, "numeric_payload_hash_or_shape_mismatch")
        failure = caught.exception.failure_publication
        self.assertIsNotNone(failure)
        assert failure is not None
        self.assertEqual(failure.failure_stage, "numeric_decode")
        self.assertEqual(failure.failure_code, "numeric_payload_hash_or_shape_mismatch")
        self.assertEqual(
            failure.publication_mode,
            "test_only_deterministic_syscall_harness",
        )
        self.assertFalse(failure.atomic_publication_observed)
        self.assertFalse(failure.production_failure_publication_observed)
        self.assertNotIn(context.final_root, kernel.published)
        failure_receipt_raw = kernel.published[context.failure_root][
            "failure/receipt.json"
        ]
        canonical_json.parse_canonical_json_bytes(
            failure_receipt_raw, "failure_receipt"
        )
        failure_receipt = json.loads(failure_receipt_raw.decode("utf-8"))
        self.assertEqual(
            tuple(sorted(failure_receipt)),
            (
                "attemptOrdinal",
                "authorityFalse",
                "candidateId",
                "commandArgvSha256",
                "commit40",
                "detailSha256",
                "failureCode",
                "failureStage",
                "interchangePolicyBinding",
                "monotonicElapsedNanoseconds",
                "primaryInputBindingSha256",
                "schemaVersion",
                "wallEndUtc",
                "wallStartUtc",
            ),
        )
        self.assertIsNone(failure_receipt["primaryInputBindingSha256"])
        self.assertIs(failure_receipt["authorityFalse"], True)
        self.assertNotIn("payload", failure_receipt)
        self.assertNotIn("value", failure_receipt)
        event_count = len(kernel.events)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError, "publication_context_reused"
        ):
            _publish_authenticated_test_only(issuer, context, operands, kernel)
        self.assertEqual(len(kernel.events), event_count)

        cases = (
            (
                "nonfinite",
                {"tail_h_f64le": struct.pack("<d", float("nan")) + _payload_values()["tail_h_f64le"][8:]},
                "numeric_payload_nonfinite",
            ),
            (
                "negative-zero",
                {"tail_q_f64le": struct.pack("<d", -0.0) + _payload_values()["tail_q_f64le"][8:]},
                "numeric_payload_negative_zero",
            ),
        )
        for suffix, overrides, code in cases:
            with self.subTest(code=code):
                test_kernel = _DeterministicLinuxSyscallHarness()
                test_issuer, test_context, test_operands = _issue(
                    test_kernel,
                    final_suffix=suffix,
                    failure_suffix=f"{suffix}-failure",
                    payload_overrides=overrides,
                )
                with self.assertRaises(publisher.PrimaryOperandPublisherError) as error:
                    _publish_authenticated_test_only(
                        test_issuer, test_context, test_operands, test_kernel
                    )
                self.assertEqual(error.exception.code, code)
                self.assertNotIn(test_context.final_root, test_kernel.published)
                self.assertIn(test_context.failure_root, test_kernel.published)
                self.assertFalse(
                    any(
                        event.split(":O_DIRECTORY", 1)[0]
                        == f"open_parent:{test_context.final_root}"
                        for event in test_kernel.events
                    )
                )

    def test_no_overwrite_and_partial_failure_quarantine_fail_closed(self) -> None:
        kernel = _DeterministicLinuxSyscallHarness()
        issuer, context, operands = _issue(kernel)
        kernel.existing_roots.add(context.final_root)
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as caught:
            _publish_authenticated_test_only(
                issuer, context, operands, kernel
            )
        self.assertEqual(caught.exception.code, "primary_publication_failure")
        self.assertIn(context.failure_root, kernel.published)
        self.assertNotIn(context.final_root, kernel.published)
        self.assertFalse(any(event.startswith("mkdirat_temp:.primary-operands") for event in kernel.events))
        self.assertFalse(
            any(event.startswith("fchmod_quarantine_root:None") for event in kernel.events)
        )

        raced = _DeterministicLinuxSyscallHarness(race_final_on_rename=True)
        raced_issuer, raced_context, raced_operands = _issue(
            raced,
            final_suffix="rename-race",
            failure_suffix="rename-race-failure",
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as raced_error:
            _publish_authenticated_test_only(
                raced_issuer, raced_context, raced_operands, raced
            )
        self.assertEqual(raced_error.exception.code, "primary_publication_failure")
        self.assertNotIn(raced_context.final_root, raced.published)
        self.assertIn(raced_context.final_root, raced.existing_roots)
        self.assertEqual(len(raced.quarantined), 1)
        self.assertIn(raced_context.failure_root, raced.published)

        partial = _DeterministicLinuxSyscallHarness(
            fail_event="fdatasync:coefficients/core_L2_u.f64le"
        )
        partial_issuer, partial_context, partial_operands = _issue(
            partial,
            final_suffix="partial",
            failure_suffix="partial-failure",
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as error:
            _publish_authenticated_test_only(
                partial_issuer, partial_context, partial_operands, partial
            )
        self.assertEqual(error.exception.code, "primary_publication_failure")
        self.assertTrue(partial.failure_fired)
        self.assertNotIn(partial_context.final_root, partial.published)
        self.assertIn(partial_context.failure_root, partial.published)
        self.assertEqual(len(partial.quarantined), 1)
        partial_failure_receipt = json.loads(
            partial.published[partial_context.failure_root][
                "failure/receipt.json"
            ].decode("utf-8")
        )
        self.assertEqual(
            partial_failure_receipt["primaryInputBindingSha256"],
            partial_context.expected_input_binding_sha256,
        )
        self.assertEqual(
            partial_failure_receipt["failureCode"],
            "primary_publication_failure",
        )
        self.assertIs(partial_failure_receipt["authorityFalse"], True)
        quarantine = next(iter(partial.quarantined.values()))
        assert quarantine.directories is not None
        self.assertEqual(quarantine.directories["."], 0o000)
        quarantine_index = next(
            i
            for i, event in enumerate(partial.events)
            if event.startswith("fchmod_quarantine_root:")
        )
        failure_publish_index = next(
            i
            for i, event in enumerate(partial.events)
            if event.startswith(f"open_parent:{partial_context.failure_root}")
        )
        self.assertLess(quarantine_index, failure_publish_index)

        postrename = _DeterministicLinuxSyscallHarness(
            fail_event="fsync_parent:/srv/nhm2/postrename:postrename"
        )
        post_issuer, post_context, post_operands = _issue(
            postrename,
            final_suffix="postrename",
            failure_suffix="postrename-failure",
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as post_error:
            _publish_authenticated_test_only(
                post_issuer, post_context, post_operands, postrename
            )
        self.assertEqual(post_error.exception.code, "primary_publication_failure")
        self.assertIn(post_context.final_root, postrename.published)
        self.assertEqual(
            postrename.published_directory_modes[post_context.final_root]["."],
            0o000,
        )
        self.assertIn(post_context.final_root, postrename.quarantined)
        self.assertIn(post_context.failure_root, postrename.published)
        post_quarantine_index = next(
            i
            for i, event in enumerate(postrename.events)
            if event.startswith(
                f"fchmod_quarantine_root:{post_context.final_root}:0000"
            )
        )
        post_failure_index = next(
            i
            for i, event in enumerate(postrename.events)
            if event.startswith(f"open_parent:{post_context.failure_root}")
        )
        self.assertLess(post_quarantine_index, post_failure_index)

        replaced = _DeterministicLinuxSyscallHarness(replace_final_inode=True)
        replaced_issuer, replaced_context, replaced_operands = _issue(
            replaced,
            final_suffix="replaced-inode",
            failure_suffix="replaced-inode-failure",
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as replaced_error:
            _publish_authenticated_test_only(
                replaced_issuer, replaced_context, replaced_operands, replaced
            )
        self.assertEqual(
            replaced_error.exception.code, "primary_publication_failure"
        )
        self.assertIn(replaced_context.final_root, replaced.quarantined)
        self.assertEqual(
            replaced.published_directory_modes[replaced_context.final_root]["."],
            0o000,
        )
        self.assertIn(replaced_context.failure_root, replaced.published)

    def test_prepared_time_syscall_failure_is_typed_and_receipted(self) -> None:
        prepared_wall_utc = "2026-08-14T12:00:02.000000000Z"
        kernel = _DeterministicLinuxSyscallHarness(
            fail_event=f"publication_prepared_not_future:{prepared_wall_utc}"
        )
        issuer, context, operands = _issue(
            kernel,
            final_suffix="prepared-time-failure",
            failure_suffix="prepared-time-failure-receipt",
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as caught:
            _publish_authenticated_test_only(issuer, context, operands, kernel)
        error = caught.exception
        self.assertEqual(error.code, "primary_publication_failure")
        self.assertEqual(error.detail, "OSError")
        failure = error.failure_publication
        self.assertIsNotNone(failure)
        assert failure is not None
        self.assertEqual(failure.failure_stage, "primary_publication")
        self.assertEqual(failure.failure_code, "primary_publication_failure")
        self.assertEqual(
            failure.primary_input_binding_sha256,
            context.expected_input_binding_sha256,
        )
        self.assertTrue(failure.authority_false)
        self.assertNotIn(context.final_root, kernel.published)
        self.assertIn(context.failure_root, kernel.published)
        self.assertFalse(
            any(
                event.startswith(f"open_parent:{context.final_root}:")
                for event in kernel.events
            )
        )
        self.assertFalse(
            any(event.startswith("fchmod_quarantine_root:") for event in kernel.events)
        )
        failure_receipt = json.loads(
            kernel.published[context.failure_root]["failure/receipt.json"].decode(
                "utf-8"
            )
        )
        self.assertEqual(failure_receipt["failureStage"], "primary_publication")
        self.assertEqual(
            failure_receipt["failureCode"], "primary_publication_failure"
        )
        self.assertEqual(
            failure_receipt["primaryInputBindingSha256"],
            context.expected_input_binding_sha256,
        )
        self.assertIs(failure_receipt["authorityFalse"], True)
        event_count = len(kernel.events)
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError, "publication_context_reused"
        ):
            _publish_authenticated_test_only(issuer, context, operands, kernel)
        self.assertEqual(len(kernel.events), event_count)

    def test_resource_caps_preflight_and_failure_publication_failure(self) -> None:
        kernel = _DeterministicLinuxSyscallHarness()
        receipt_builder_called = False

        def hostile_receipt_builder(_nonce: str) -> bytes:
            nonlocal receipt_builder_called
            receipt_builder_called = True
            raise AssertionError("invalid inventory reached receipt builder")

        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError, "relative_path_invalid"
        ):
            publisher._atomic_publish(
                kernel,
                "/srv/nhm2/static-preflight",
                ("coefficients",),
                (("../escape.f64le", b"x"),),
                hostile_receipt_builder,
            )
        self.assertFalse(receipt_builder_called)
        self.assertEqual(kernel.events, [])

        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError, "command_or_timing_mismatch"
        ):
            _issue(kernel, command_argv=tuple(f"arg-{index}" for index in range(257)))
        self.assertEqual(kernel.events, [])

        class BytesSubclass(bytes):
            pass

        values = _payload_values()
        scalar_buffers = list(values["scalar_buffers_f64le"])
        scalar_buffers[0] = BytesSubclass(scalar_buffers[0])
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "numeric_payload_hash_or_shape_mismatch",
        ):
            _issue(
                kernel,
                payload_overrides={"scalar_buffers_f64le": tuple(scalar_buffers)},
            )
        self.assertEqual(kernel.events, [])

        aliased_values = _payload_values()
        same_core = aliased_values["core_l2_u_f64le"]
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "numeric_payload_hash_or_shape_mismatch",
        ):
            _issue(
                kernel,
                payload_overrides={
                    "core_l2_u_f64le": same_core,
                    "core_l2_v_f64le": same_core,
                },
            )
        self.assertEqual(kernel.events, [])

        resource_kernel = _DeterministicLinuxSyscallHarness()
        resource_issuer, resource_context, resource_operands = _issue(
            resource_kernel,
            final_suffix="resource",
            failure_suffix="resource-failure",
        )
        resource_kernel.fail_event = next(
            f"resource_preflight:{publisher.TOTAL_PAYLOAD_BYTES + size + publisher.MAXIMUM_RECEIPT_BYTES}"
            for size in [len(publisher._descriptor_bytes(resource_context, publisher._payload_bindings(publisher._snapshot_operand_payloads(resource_operands))))]
        )
        with self.assertRaises(publisher.PrimaryOperandPublisherError) as resource_error:
            _publish_authenticated_test_only(
                resource_issuer,
                resource_context,
                resource_operands,
                resource_kernel,
            )
        self.assertEqual(resource_error.exception.code, "resource_preflight_failure")
        self.assertIsNotNone(resource_error.exception.failure_publication)
        assert resource_error.exception.failure_publication is not None
        self.assertEqual(
            resource_error.exception.failure_publication.failure_stage,
            "primary_execution",
        )
        self.assertIn(resource_context.failure_root, resource_kernel.published)

        failure_kernel = _DeterministicLinuxSyscallHarness()
        failure_issuer, failure_context, failure_operands = _issue(
            failure_kernel,
            final_suffix="failure-publication-source",
            failure_suffix="failure-publication-destination",
        )
        failure_kernel.existing_roots.update(
            {failure_context.final_root, failure_context.failure_root}
        )
        with self.assertRaisesRegex(
            publisher.PrimaryOperandPublisherError,
            "failure_publication_failure",
        ):
            _publish_authenticated_test_only(
                failure_issuer,
                failure_context,
                failure_operands,
                failure_kernel,
            )

    def test_static_surface_is_seed_only_linux_guarded_and_nonpromoting(self) -> None:
        source_path = HERE / "primary_operand_publisher.py"
        test_path = HERE / "test_primary_operand_publisher.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        public = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "publish_primary_operands"
        )
        self.assertEqual([argument.arg for argument in public.args.args], ["publication_context", "operands"])
        self.assertEqual(len(public.args.defaults), 0)
        self.assertFalse(
            any("authority" in argument.arg.lower() for argument in public.args.args)
        )
        for function in (
            node
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and node.name in {
                "issue",
                "_publish_authenticated_test_only",
                "publish_primary_operands",
            }
        ):
            self.assertFalse(
                any(
                    "authority" in argument.arg.lower()
                    for argument in (
                        list(function.args.posonlyargs)
                        + list(function.args.args)
                        + list(function.args.kwonlyargs)
                    )
                ),
                function.name,
            )
        self.assertFalse(hasattr(publisher, "_publish_authenticated_test_only"))
        self.assertFalse(hasattr(publisher, "_TestOnlyContextIssuer"))
        self.assertNotIn("def _publish_authenticated_test_only", source)
        self.assertNotIn("class _TestOnlyContextIssuer", source)
        self.assertNotIn("test_only_linux_emulation", source)
        self.assertNotIn('and not getattr(handle, "renamed"', source)
        for required in (
            "openat2",
            "RESOLVE_BENEATH",
            "RESOLVE_NO_SYMLINKS",
            "RESOLVE_NO_MAGICLINKS",
            "RESOLVE_NO_XDEV",
            "O_CREAT | os.O_EXCL | os.O_NOFOLLOW",
            "fdatasync",
            "fchmod(descriptor, 0o400)",
            "renameat2_RENAME_NOREPLACE_then_parent_fsync",
            "RENAME_NOREPLACE",
            "final_readback",
            "root_stat.st_ino != handle.temp_inode",
            "observed.st_ino\n                        != handle.directory_inodes.get(directory)",
            "before.st_ino != handle.file_inodes.get(path)",
            "quarantine",
            "server_publication_context_issuer_absent",
            "exposes no positive test publisher",
            "inherited, sealed, read-only file descriptor",
            "signed by a separately pinned server key",
        ):
            self.assertIn(required, source)
        for forbidden in (
            "noise-kernel.raw",
            "noise_kernel.raw",
            "constraints/brackets",
            "[N,N,100]",
            "output_arrays",
            "materialize_output_array_diagnostic",
            "numpy",
            "subprocess",
            "socket",
        ):
            self.assertNotIn(forbidden.lower(), source.lower())
        self.assertFalse(any(publisher.AUTHORITY_LOCKS.values()))
        self.assertRegex(sha256(source_path.read_bytes()).hexdigest(), r"^[0-9a-f]{64}$")
        self.assertRegex(sha256(test_path.read_bytes()).hexdigest(), r"^[0-9a-f]{64}$")
        signature = inspect.signature(publisher.publish_primary_operands)
        self.assertTrue(
            all(parameter.default is inspect.Parameter.empty for parameter in signature.parameters.values())
        )


if __name__ == "__main__":
    unittest.main()
