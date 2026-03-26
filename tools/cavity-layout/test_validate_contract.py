from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import validate_contract as vc


REPO_ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = REPO_ROOT / "configs" / "needle-hull-mark2-cavity-contract.v1.json"
VALIDATOR_PATH = REPO_ROOT / "tools" / "cavity-layout" / "validate_contract.py"
PYTHON = REPO_ROOT / ".venv-layout" / "Scripts" / "python.exe"


class ValidateContractTests(unittest.TestCase):
    def test_default_contract_passes(self) -> None:
        contract = vc.read_contract(CONTRACT_PATH)
        result = vc.validate_contract_data(contract)
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["errorCount"], 0)

    def test_cli_emits_json_and_zero_exit_for_default_contract(self) -> None:
        completed = subprocess.run(
            [str(PYTHON), str(VALIDATOR_PATH), "--contract", str(CONTRACT_PATH)],
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "pass")
        self.assertTrue(payload["valid"])

    def test_fails_when_seal_ring_exceeds_tile(self) -> None:
        contract = vc.read_contract(CONTRACT_PATH)
        contract["layout"]["sealRing"]["inset_um"] = 4950
        result = vc.validate_contract_data(contract)
        self.assertFalse(result["valid"])
        self.assertTrue(any("Seal ring extends beyond tile bounds" in error for error in result["errors"]))

    def test_fails_when_witness_coupons_exceed_reserved_zone(self) -> None:
        contract = vc.read_contract(CONTRACT_PATH)
        contract["layout"]["witnessZone"]["centerOffsetFromBottom_um"] = 3500
        result = vc.validate_contract_data(contract)
        self.assertFalse(result["valid"])
        self.assertTrue(any("Witness coupons intersect the cavity pocket" in error for error in result["errors"]))

    def test_cli_returns_nonzero_for_invalid_contract_file(self) -> None:
        contract = vc.read_contract(CONTRACT_PATH)
        contract["geometry"]["pocketDiameter_um"] = 12000
        with tempfile.TemporaryDirectory() as temp_dir:
            contract_path = Path(temp_dir) / "invalid-contract.json"
            contract_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
            completed = subprocess.run(
                [str(PYTHON), str(VALIDATOR_PATH), "--contract", str(contract_path)],
                check=False,
                capture_output=True,
                text=True,
            )
        self.assertNotEqual(completed.returncode, 0)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "fail")
        self.assertFalse(payload["valid"])


if __name__ == "__main__":
    unittest.main()
