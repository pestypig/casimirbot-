"""Independent read-only audit of the G2B-B4-R1 scalar-ABI successor."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from pathlib import Path
import struct
import unittest

import gmpy2


ROOT = Path(__file__).resolve().parents[2]
PARENT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1"
OLD_B4 = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-four-grid-v1/terminal-receipt.json"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r1-scalar-abi-reconciliation/v1\n"
EXPECTED_WORDS = (
    "bfe626bcc563863f", "bff577dc22559451", "4039ea32f7793312",
    "40007f765a3009fd", "3ff2d379a0d0a3e0", "3fe815d49929ae09",
    "3fa0000000000000", "bf4626bcc563863f", "3feffa75d60dd448",
)
INVENTORY = {
    "coefficients/core_L2_u.f64le": (1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    "coefficients/core_L2_V.f64le": (1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    "coefficients/tail_H.f64le": (256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    "coefficients/tail_Q.f64le": (256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    "initializer/core_L2_join_barrier.f64le": (32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
    "receipt.json": (7_212, "fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590"),
    "scalars.f64le": (72, "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"),
}


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


class G2BB4R1IndependentAuditTests(unittest.TestCase):
    def test_exact_inventory_and_raw_hashes(self) -> None:
        observed = {
            path.relative_to(OUTPUT).as_posix(): (len(path.read_bytes()), digest(path.read_bytes()))
            for path in OUTPUT.rglob("*") if path.is_file()
        }
        self.assertEqual(observed, INVENTORY)

    def test_receipt_is_canonical_self_hashed_and_authority_neutral(self) -> None:
        raw = (OUTPUT / "receipt.json").read_bytes()
        receipt = json.loads(raw)
        self.assertEqual(canonical(receipt), raw)
        observed = receipt.pop("receiptSha256")
        unsigned = canonical(receipt)
        expected = digest(DOMAIN + struct.pack("<Q", len(unsigned)) + unsigned)
        self.assertEqual(observed, "15c73b1e1ad1583dddf85f2276f661b3016704b113d02a26a995a49863d7e682")
        self.assertEqual(observed, expected)
        self.assertEqual(receipt["status"], "PASS")
        self.assertEqual(receipt["decision"], "SCALAR_ABI_ROLE_CONFLICT_RESOLVED_AND_SUCCESSOR_PERSISTED")
        self.assertTrue(receipt["noGridSolve"])
        self.assertTrue(receipt["noCandidateSolve"])
        self.assertTrue(receipt["noRetune"])
        self.assertFalse(receipt["fourGridExecutionAuthorized"])
        self.assertTrue(receipt["successorPacketPreparationUnlocked"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))

    def test_five_non_scalar_payloads_are_byte_identical(self) -> None:
        for relative in INVENTORY:
            if relative in {"scalars.f64le", "receipt.json"}:
                continue
            self.assertEqual((OUTPUT / relative).read_bytes(), (PARENT / relative).read_bytes(), relative)

    def test_independent_mpfr512_scalar_recomputation(self) -> None:
        old = struct.unpack("<9d", (PARENT / "scalars.f64le").read_bytes())
        _U, _U1, _V, V1 = struct.unpack("<4d", (PARENT / "initializer/core_L2_join_barrier.f64le").read_bytes())
        template = gmpy2.get_context().copy()
        template.precision = 512
        template.round = gmpy2.RoundToNearest
        with gmpy2.context(template):
            nu0 = gmpy2.mpfr(old[0])
            C64 = float(gmpy2.mpfr(V1) * gmpy2.mpfr(1024))
            C = gmpy2.mpfr(C64)
            kappa = gmpy2.sqrt(gmpy2.mpfr(-2) * nu0)
            sigma = C / kappa - gmpy2.mpfr(1)
            N0 = gmpy2.mpfr(4) * gmpy2.const_pi() * C
            lam = gmpy2.mpfr(1) / gmpy2.mpfr(32)
            nu_star = lam * lam * nu0
            w_seed = gmpy2.sqrt(gmpy2.mpfr(1) + gmpy2.mpfr(2) * nu_star)
            values = tuple(float(item) for item in (nu0, gmpy2.mpfr(old[1]), N0, C, kappa, sigma, lam, nu_star, w_seed))
        words = tuple(struct.pack(">d", value).hex() for value in values)
        self.assertEqual(words, EXPECTED_WORDS)
        self.assertEqual(struct.pack("<9d", *values), (OUTPUT / "scalars.f64le").read_bytes())

    def test_exact_rational_scaling_and_old_failure_immutability(self) -> None:
        V1 = struct.unpack("<4d", (PARENT / "initializer/core_L2_join_barrier.f64le").read_bytes())[3]
        C = struct.unpack("<9d", (OUTPUT / "scalars.f64le").read_bytes())[3]
        self.assertEqual(Fraction(*C.as_integer_ratio()), Fraction(*V1.as_integer_ratio()) * 1024)
        old_raw = OLD_B4.read_bytes()
        self.assertEqual((len(old_raw), digest(old_raw)), (2_222, "871dd86266e77b85ce55552e319ea39f29736ee6a4b4260bc51dc4527b95f9eb"))
        old = json.loads(old_raw)
        self.assertEqual(old["status"], "FAIL")
        self.assertEqual(old["attemptedLevelCount"], 0)
        self.assertTrue(all(value is False for value in old["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
