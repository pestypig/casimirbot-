"""One bounded no-Newton diagnosis of the immutable B4-R10 terminal state.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R10 terminal-equivalence diagnosis
Current maturity: preregistered bounded no-solve diagnostic
Target maturity: supported separate successor class or frozen-branch closure
Required frozen inputs: immutable R4/R5/R6/R7 and R9/R10 evidence
Required evidence: exact bindings, correction hash, 25 domain trials, comparison
Stop/fail criteria: mismatch, nonlinear solve, merit evaluation, update or mutation
Explicit non-goals: Newton/continuation, retry, retune, candidate/proof/lamp authority
Downstream gate unlocked: new-candidate research only if this branch closes

Importing this module reads no candidate data and writes nothing. ``execute_once``
is the sole receipt-producing entrypoint. It reconstructs one already-recorded
linear correction, but never invokes Newton, continuation, a trial residual, or
an Armijo merit evaluation.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import stat
import struct
import sys
from typing import Final, NoReturn, Sequence


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
TOOLS: Final[Path] = Path(__file__).resolve().parent
BRANCH: Final[Path] = ROOT / "tools/nhm2-spherical-boson-star-branch"
OUTPUT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r11-terminal-equivalence-diagnosis-v1"
RECEIPT: Final[Path] = OUTPUT / "receipt.json"
DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r11-terminal-equivalence/v1\n"

PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r11-terminal-equivalence-diagnosis.md"
R9_SOURCE = TOOLS / "g2b_b4_r9_formulation_proposal.py"
R4_ROOT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1"
R10_ROOT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1"
R5_RECEIPT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json"
R6_RECEIPT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1/receipt.json"
R7_RECEIPT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r7-causal-interaction-review-v1/receipt.json"

EXPECTED: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("packet", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r11-terminal-equivalence-diagnosis.md", 4156, "0efdd26ff1447b1ebb146c125445bca8a647bd3aa543fad7a991ba552eb79129"),
    ("r4_stage", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00.json", 831, "08309d40bd590996ba976839abeacbf2b492e2af03d49014ee55c7acb09bd1c2"),
    ("r4_state", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le", 1544, "972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c"),
    ("r4_terminal", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/terminal-receipt.json", 2739, "4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204"),
    ("r5_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json", 20509, "645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52"),
    ("r6_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1/receipt.json", 12503, "e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2"),
    ("r7_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r7-causal-interaction-review-v1/receipt.json", 7325, "6164f02d0fd6a91606692e9a451f8bc26d3a38fe6b8ae1afff36463606d506ea"),
    ("r9_result", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r9-result-record.md", 4878, "86bb2d06e4f73cb5bd93015d50d1eb8d68d2c125c8113c0973bf03cf98dd43ea"),
    ("r9_formulation", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r9_formulation_proposal.py", 17611, "8d6a30b6448c063b8020d0b23b4a1e8c49e32ddd704ef46daeee38c3de1507a9"),
    ("r10_stage", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/level-64/stage-00.json", 23511, "7c9bd9108d88e119fd00d6afff28c2b2a8b063ab201e64bdfe93587901f01837"),
    ("r10_state", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/level-64/stage-00-state.f64le", 1544, "e331f74f0f479297b15b960f9d8c81f81c6aa15a4844b4770357c4aca7852b4a"),
    ("r10_terminal", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/terminal-receipt.json", 2038, "947377efc9648e6fc59a73a78e65eb0eb83a7b335252bd3c87bbe02a263fbd99"),
    ("binary64_environment", "tools/nhm2-spherical-boson-star-branch/binary64_environment.py", 12642, "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"),
    ("dense_lu", "tools/nhm2-spherical-boson-star-branch/deterministic_dense_lu.py", 8033, "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2"),
    ("collocation_state", "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py", 8898, "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a"),
    ("compactified_system", "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py", 15202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    ("lobatto_grid", "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py", 6704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
)

AUTHORITY_LOCKS: Final[dict[str, bool]] = {
    "candidateAdmission": False,
    "vacuumConnection": False,
    "proofAuthority": False,
    "executionAuthority": False,
    "replayAuthority": False,
    "laneAuthority": False,
    "pairAgreementAuthority": False,
    "diagnosticLampAuthority": False,
    "theoryGraphAuthority": False,
    "jointGeometryStateAuthority": False,
    "physicalAuthority": False,
    "physicalViability": False,
    "propulsionAuthority": False,
    "transportAuthority": False,
}


class DiagnosisError(RuntimeError):
    pass


def _fail(code: str) -> NoReturn:
    raise DiagnosisError(code)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _word(value: float) -> str:
    return struct.pack(">d", float(value)).hex()


def _pack(values: Sequence[float]) -> bytes:
    return struct.pack(f"<{len(values)}d", *(float(value) for value in values))


def _hash_vector(label: bytes, values: Sequence[float]) -> str:
    return _sha(label + struct.pack("<I", len(values)) + _pack(values))


def _hash_matrix(matrix: Sequence[Sequence[float]]) -> str:
    digest = hashlib.sha256(b"nhm2-g2b-b4-r10-matrix-f64le/v1\n")
    digest.update(struct.pack("<I", len(matrix)))
    for row in matrix:
        digest.update(_pack(row))
    return digest.hexdigest()


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        _fail(f"import_spec_invalid:{name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    if Path(module.__file__).resolve() != path.resolve():
        _fail(f"import_identity_invalid:{name}")
    return module


def _ordinary_binding(role: str, relative: str, size: int, expected_sha: str) -> dict[str, object]:
    path = ROOT.joinpath(*relative.split("/"))
    metadata = path.lstat()
    raw = path.read_bytes()
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail(f"binding_not_ordinary:{role}")
    observed = _sha(raw)
    if len(raw) != size or observed != expected_sha:
        _fail(f"binding_mismatch:{role}")
    return {"role": role, "path": relative, "sizeBytes": size, "rawSha256": observed}


def _json(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text(encoding="ascii"))
    if not isinstance(value, dict):
        _fail(f"json_object_required:{path.name}")
    return value


def _verify_parent_receipts(r4: dict[str, object], r5: dict[str, object], r6: dict[str, object], r7: dict[str, object], r10: dict[str, object]) -> None:
    expected = (
        (r4, "361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28", "STOPPED_AT_FIRST_SOLVE_FAILURE"),
        (r5, "0cfb59144cf29beb0da94852ee872455a56017cbe3fc690fd6cb24cd401ea406", "NO_UNIQUE_SUCCESSOR_JUSTIFIED"),
        (r6, "0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001", "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR"),
        (r7, "c7547fb302f0e128bfce68faf7e60f87d9172715f392fcc0ca329e4f4d667ccb", "CAUSAL_INTERACTION_UNRESOLVED_STOP"),
        (r10, "e8d0268f499f6e1cba9ccf26cc34dc602b4a40f7f96478bb7e59e7acce037706", "STOPPED_AT_FIRST_SOLVE_FAILURE"),
    )
    for value, receipt_sha, decision in expected:
        actual_decision = value.get("classification", value.get("decision"))
        if value.get("receiptSha256") != receipt_sha or actual_decision != decision:
            _fail("parent_receipt_semantics_mismatch")


def _diagnose() -> dict[str, object]:
    bindings = tuple(_ordinary_binding(*item) for item in EXPECTED)
    r4_meta = _json(R4_ROOT / "level-64/stage-00.json")
    r4_terminal = _json(R4_ROOT / "terminal-receipt.json")
    r5 = _json(R5_RECEIPT)
    r6 = _json(R6_RECEIPT)
    r7 = _json(R7_RECEIPT)
    r10_meta = _json(R10_ROOT / "level-64/stage-00.json")
    r10_terminal = _json(R10_ROOT / "terminal-receipt.json")
    _verify_parent_receipts(r4_terminal, r5, r6, r7, r10_terminal)

    if (
        r4_meta.get("newtonFailureCode") != "armijo_schedule_exhausted_without_retry"
        or r10_meta.get("newtonFailureCode") != "armijo_schedule_exhausted_without_retry"
        or r4_meta.get("newtonAcceptedUpdateCount") != 29
        or r10_meta.get("newtonAcceptedUpdateCount") != 29
    ):
        _fail("terminal_chronology_mismatch")

    if str(BRANCH) not in sys.path:
        sys.path.insert(0, str(BRANCH))
    binary64 = _load("_nhm2_r11_binary64", BRANCH / "binary64_environment.py")
    dense_lu = _load("_nhm2_r11_dense_lu", BRANCH / "deterministic_dense_lu.py")
    collocation = _load("_nhm2_r11_collocation", BRANCH / "radial_collocation_interior.py")
    system = _load("_nhm2_r11_system", BRANCH / "radial_compactified_system.py")
    grid_module = _load("_nhm2_r11_grid", BRANCH / "radial_lobatto_grid.py")
    r9 = _load("_nhm2_r11_r9", R9_SOURCE)

    r4_raw = (R4_ROOT / "level-64/stage-00-state.f64le").read_bytes()
    r10_raw = (R10_ROOT / "level-64/stage-00-state.f64le").read_bytes()
    if len(r4_raw) != 1544 or len(r10_raw) != 1544:
        _fail("state_size_mismatch")
    r4_values = struct.unpack("<193d", r4_raw)
    r10_values = struct.unpack("<193d", r10_raw)

    @binary64.nearest_binary64
    def calculate() -> dict[str, object]:
        state = collocation.RadialCollocationState(
            F0=r10_values[:64], F1=r10_values[64:128],
            varphi=r10_values[128:192], w=r10_values[192],
        )
        grid = grid_module.generate_compactified_lobatto_grid(64).differentiation
        assembly = system.evaluate_spherical_radial_compactified_system(
            grid=grid, state=state, origin_amplitude=2.0**-16
        )
        raw_rhs = tuple(0.0 if value == 0.0 else -value for value in assembly.solved_residual)
        equilibrated = r9.equilibrate_linear_system(assembly.jacobian, raw_rhs)
        solved = dense_lu.solve_deterministic_dense_lu(
            matrix=equilibrated.matrix, rhs=equilibrated.rhs
        )
        direction = r9.recover_unscaled_direction(solved.solution, equilibrated.column_scales)

        observed_trace = {
            "raw_matrix_sha256": _hash_matrix(assembly.jacobian),
            "raw_rhs_sha256": _hash_vector(b"raw-rhs\n", raw_rhs),
            "row_scales_sha256": _hash_vector(b"row-scales\n", equilibrated.row_scales),
            "column_scales_sha256": _hash_vector(b"column-scales\n", equilibrated.column_scales),
            "equilibrated_matrix_sha256": _hash_matrix(equilibrated.matrix),
            "equilibrated_rhs_sha256": _hash_vector(b"equilibrated-rhs\n", equilibrated.rhs),
            "scaled_direction_sha256": _hash_vector(b"scaled-direction\n", solved.solution),
            "recovered_direction_sha256": _hash_vector(b"recovered-direction\n", direction),
        }
        recorded_traces = r10_meta.get("linearCorrectionTraces")
        if not isinstance(recorded_traces, list) or len(recorded_traces) != 30:
            _fail("recorded_trace_count_mismatch")
        recorded = dict(recorded_traces[29])
        recorded.pop("update_index", None)
        if observed_trace != recorded:
            _fail("correction_trace_reconstruction_mismatch")

        trials: list[dict[str, object]] = []
        for exponent in range(25):
            alpha = 2.0**-exponent
            trial = tuple(r10_values[index] + alpha * direction[index] for index in range(193))
            finite = all(math.isfinite(value) for value in trial)
            domain = finite and 0.0 < trial[-1] < 1.0
            trials.append({
                "exponent": exponent,
                "alphaBinary64Word": _word(alpha),
                "wBinary64Word": _word(trial[-1]),
                "finite": finite,
                "domainEligible": domain,
                "classification": "DOMAIN_ELIGIBLE_NOT_EVALUATED" if domain else "DOMAIN_REJECTED",
            })

        differences = tuple(abs(a - b) for a, b in zip(r10_values, r4_values))
        maximum = max(differences)
        ordinal = differences.index(maximum)
        r4_alphas = r4_meta.get("newtonAcceptedAlphaExponents")
        r10_alphas = r10_meta.get("newtonAcceptedAlphaExponents")
        same_chronology = r4_alphas == r10_alphas and isinstance(r10_alphas, list) and len(r10_alphas) == 29
        all_domain_rejected = all(not item["domainEligible"] for item in trials)
        prior_proposal_absent = r7.get("proposalClass") is None and r7.get("proposalPreparationSupported") is False
        sole_intervention_falsified = (
            same_chronology
            and r10_terminal.get("status") == "FAIL"
            and r10_terminal.get("nextMathematicalDutyUnlocked") is False
        )
        supported = False
        decision = (
            "SUPPORTED_SEPARATE_SUCCESSOR_CLASS"
            if supported
            else "CLOSE_FROZEN_BRANCH_NO_SUPPORTED_SUCCESSOR"
        )
        return {
            "sourceAndInputBindings": bindings,
            "parentReceipts": {
                "r4": r4_terminal["receiptSha256"], "r5": r5["receiptSha256"],
                "r6": r6["receiptSha256"], "r7": r7["receiptSha256"],
                "r10": r10_terminal["receiptSha256"],
            },
            "correctionOrdinal": 29,
            "correctionTrace": observed_trace,
            "correctionTraceMatchesRecordedR10": True,
            "linearSolveFinalResidualLinfBinary64Word": _word(solved.final_residual_linf),
            "directionWBinary64Word": _word(direction[-1]),
            "directionWPositive": direction[-1] > 0.0,
            "domainTrials": trials,
            "domainTrialCount": 25,
            "domainEligibleTrialCount": sum(bool(item["domainEligible"]) for item in trials),
            "allTrialsDomainRejected": all_domain_rejected,
            "r4R10Comparison": {
                "acceptedExponentChronologyExactlyEqual": same_chronology,
                "maximumStateAbsoluteDifferenceBinary64Word": _word(maximum),
                "maximumStateDifferenceOrdinal": ordinal,
                "frequencyAbsoluteDifferenceBinary64Word": _word(abs(r10_values[-1] - r4_values[-1])),
                "residualRatioBinary64Word": _word(
                    struct.unpack(">d", bytes.fromhex(str(r10_meta["newtonResidualLinfBinary64Word"])))[0]
                    / struct.unpack(">d", bytes.fromhex(str(r4_meta["newtonResidualLinfBinary64Word"])))[0]
                ),
                "scaledStepRatioBinary64Word": _word(
                    struct.unpack(">d", bytes.fromhex(str(r10_meta["newtonScaledStepLinfBinary64Word"])))[0]
                    / struct.unpack(">d", bytes.fromhex(str(r4_meta["newtonScaledStepLinfBinary64Word"])))[0]
                ),
                "unusedConstraintRatioBinary64Word": _word(
                    struct.unpack(">d", bytes.fromhex(str(r10_meta["unusedConstraintLinfBinary64Word"])))[0]
                    / struct.unpack(">d", bytes.fromhex(str(r4_meta["unusedConstraintLinfBinary64Word"])))[0]
                ),
            },
            "decisionPredicates": {
                "soleR8R9InterventionFalsified": sole_intervention_falsified,
                "r10ImmediateDomainObstructionReproduced": all_domain_rejected,
                "priorUniqueProposalClassAbsent": prior_proposal_absent,
                "recordedBytesIdentifyUniqueRemainingProposal": supported,
            },
            "decision": decision,
        }

    return calculate()


def execute_once() -> dict[str, object]:
    if OUTPUT.exists() or OUTPUT.is_symlink():
        _fail("exclusive_output_root_already_exists")
    result = _diagnose()
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r11_terminal_equivalence_diagnosis",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r11_terminal_equivalence/v1",
        "status": "PASS",
        **result,
        "candidateSolveInvoked": False,
        "newtonInvoked": False,
        "continuationInvoked": False,
        "trialResidualEvaluated": False,
        "armijoMeritEvaluated": False,
        "stateUpdateComputedOrPersisted": False,
        "linearCorrectionReconstructed": True,
        "b4R10Retried": False,
        "noRetune": True,
        "candidateAdmission": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }
    raw_unsigned = _canonical(unsigned)
    receipt = dict(unsigned)
    receipt["receiptSha256"] = _sha(DOMAIN + struct.pack("<Q", len(raw_unsigned)) + raw_unsigned)
    raw = _canonical(receipt)
    os.mkdir(OUTPUT)
    with RECEIPT.open("xb") as handle:
        handle.write(raw)
    return receipt


def main() -> int:
    print(json.dumps(execute_once(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
