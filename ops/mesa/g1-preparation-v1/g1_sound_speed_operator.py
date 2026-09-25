"""Primary-term BiSON-13 sound-speed averaging-kernel operator.

Input values are (candidate c^2 - BP04 c^2) / BP04 c^2 on a radius/R_sun
grid. The operator omits cross terms and therefore cannot admit a G1 model.
"""

import csv
import hashlib
import math
from bisect import bisect_left
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


ROOT = Path(__file__).resolve().parents[3]
INTAKE = ROOT / "artifacts/research/g1-basu-author-intake-20260924"
TABLE = ROOT / "configs/research/controlled-stellar-composition-transport-g1-bison13-table3.v1.csv"
EXPECTED_SHA256 = {
    "cdif.txt": "893d75b6c30729902ef169bdc08166cc600b212857e1ddcc025087cb59aff226",
    "avker.BP04_B4752dRF": "027e2853299eee5aa34818149deb3a4bd51cf93c12fc5b2a525f14641fad344e",
}
BP04_RADIUS_CM = 6.9598e10


def physical_radius_cm_to_bp04_fraction(radius_cm: Sequence[float]) -> tuple[float, ...]:
    """Express physical radii in the historical BP04 radius convention.

    Do not normalize by a candidate model's photospheric radius or the G1
    nominal calibration target. This only converts coordinates; it cannot
    supply the missing BP04 sound-speed or cross-term profiles.
    """
    if len(radius_cm) < 2 or any(isinstance(value, bool) or
                                 not isinstance(value, (int, float)) or
                                 not math.isfinite(float(value)) or value < 0
                                 for value in radius_cm):
        raise ValueError("physical radius grid must be finite nonnegative numeric values")
    if any(radius_cm[i] >= radius_cm[i + 1] for i in range(len(radius_cm) - 1)):
        raise ValueError("physical radius grid must be strictly ascending")
    return tuple(float(value) / BP04_RADIUS_CM for value in radius_cm)


def _rows(path: Path, columns: int, comments: bool = False) -> list[tuple[float, ...]]:
    parsed = []
    for number, line in enumerate(path.read_text(encoding="ascii").splitlines(), 1):
        if not line.strip() or (comments and line.lstrip().startswith("#")):
            continue
        parts = line.split()
        if len(parts) != columns:
            raise ValueError(f"{path.name}:{number}: expected {columns} columns")
        row = tuple(float(value) for value in parts)
        if not all(math.isfinite(value) for value in row):
            raise ValueError(f"{path.name}:{number}: nonfinite value")
        parsed.append(row)
    return parsed


def _validate_grid(radii: Sequence[float], values: Sequence[float]) -> None:
    if len(radii) < 2 or len(radii) != len(values):
        raise ValueError("model grid and values must have equal length >= 2")
    if any(isinstance(x, bool) or not isinstance(x, (int, float))
           for x in (*radii, *values)):
        raise ValueError("model grid and values must be numeric")
    if not all(math.isfinite(float(x)) for x in radii) or not all(
        math.isfinite(float(x)) for x in values
    ):
        raise ValueError("model grid and values must be finite")
    if not all(radii[i] < radii[i + 1] for i in range(len(radii) - 1)):
        raise ValueError("model radius grid must be strictly ascending")


def _interpolate(radii: Sequence[float], values: Sequence[float], x: float) -> float:
    i = bisect_left(radii, x)
    if i < len(radii) and radii[i] == x:
        return float(values[i])
    if i == 0 or i == len(radii):
        raise ValueError("model radius grid does not cover full kernel support")
    left, right = radii[i - 1], radii[i]
    weight = (x - left) / (right - left)
    return float(values[i - 1]) * (1 - weight) + float(values[i]) * weight


@dataclass(frozen=True)
class SoundSpeedOperator:
    radius_ascending: tuple[float, ...]
    kernel_rows_ascending: tuple[tuple[float, ...], ...]
    solution_rows: tuple[tuple[float, ...], ...]
    table3_indices: tuple[int, ...]

    @classmethod
    def from_author_files(cls) -> "SoundSpeedOperator":
        for name, expected in EXPECTED_SHA256.items():
            observed = hashlib.sha256((INTAKE / name).read_bytes()).hexdigest()
            if observed != expected:
                raise ValueError(f"{name}: source hash mismatch")
        solution = _rows(INTAKE / "cdif.txt", 9, comments=True)
        kernel = _rows(INTAKE / "avker.BP04_B4752dRF", 77)
        if len(solution) != 76 or len(kernel) != 2701:
            raise ValueError("unexpected author-file dimensions")
        original_radius = [row[0] for row in kernel]
        if not all(original_radius[i] > original_radius[i + 1]
                   for i in range(len(original_radius) - 1)):
            raise ValueError("author kernel radius is not strictly descending")
        with TABLE.open(newline="", encoding="ascii") as handle:
            published = list(csv.DictReader(handle))
        if len(published) != 37:
            raise ValueError("unexpected Table 3 row count")
        selected = tuple(2 * i for i in range(37))
        for row, index in zip(published, selected):
            author = solution[index]
            if abs(author[4] - float(row["r_c_over_R"])) > 5.1e-5:
                raise ValueError("author second quartile does not match Table 3")
            expected_sigma = 2 * float(row["sigma_c_cm_s"]) / float(row["c_cm_s"])
            if abs(author[8] / expected_sigma - 1) > 1e-4:
                raise ValueError("author solution error does not match Table 3 c^2 convention")
        ascending = tuple(reversed(kernel))
        operator = cls(tuple(row[0] for row in ascending),
                       tuple(tuple(row[1:]) for row in ascending),
                       tuple(solution), selected)
        for area in operator.integrals():
            if abs(area - 1) > 2e-6:
                raise ValueError("averaging kernel normalization changed")
        return operator

    def integrals(self) -> tuple[float, ...]:
        if len(self.radius_ascending) != len(self.kernel_rows_ascending):
            raise ValueError("kernel radius/row count mismatch")
        if not self.kernel_rows_ascending:
            raise ValueError("empty kernel")
        columns = len(self.kernel_rows_ascending[0])
        if not columns or any(len(row) != columns for row in self.kernel_rows_ascending):
            raise ValueError("inconsistent kernel width")
        totals = [0.0] * columns
        for i in range(len(self.radius_ascending) - 1):
            dr = self.radius_ascending[i + 1] - self.radius_ascending[i]
            if dr <= 0:
                raise ValueError("kernel radius must be strictly ascending")
            left, right = self.kernel_rows_ascending[i], self.kernel_rows_ascending[i + 1]
            for col in range(columns):
                totals[col] += 0.5 * (left[col] + right[col]) * dr
        return tuple(totals)

    def tail_weights(self, cutoff_radius: float) -> dict:
        """Signed and L1 kernel integrals above a radius; no truncation policy."""
        if (isinstance(cutoff_radius, bool) or
                not isinstance(cutoff_radius, (int, float)) or
                not math.isfinite(float(cutoff_radius)) or
                not self.radius_ascending[0] <= cutoff_radius <= self.radius_ascending[-1]):
            raise ValueError("cutoff radius outside finite kernel support")
        columns = len(self.kernel_rows_ascending[0])
        signed = [0.0] * columns
        absolute = [0.0] * columns
        for i in range(len(self.radius_ascending) - 1):
            left_radius, right_radius = self.radius_ascending[i:i + 2]
            if right_radius <= cutoff_radius:
                continue
            start = max(left_radius, cutoff_radius)
            width = right_radius - start
            weight = (start - left_radius) / (right_radius - left_radius)
            for col in range(columns):
                left_value = self.kernel_rows_ascending[i][col]
                right_value = self.kernel_rows_ascending[i + 1][col]
                a = left_value + weight * (right_value - left_value)
                b = right_value
                signed[col] += 0.5 * (a + b) * width
                if a * b >= 0:
                    absolute[col] += 0.5 * (abs(a) + abs(b)) * width
                else:
                    absolute[col] += width * (a * a + b * b) / (2 * (abs(a) + abs(b)))
        return {"cutoffRadius": float(cutoff_radius),
                "signedTail": tuple(signed), "absoluteTail": tuple(absolute),
                "admissionAllowed": False}

    def apply_primary_term(self, model_radius: Sequence[float],
                           candidate_minus_bp04_delta_c2_over_c2: Sequence[float],
                           table3_only: bool = True) -> dict:
        """Integrate the main c^2 kernel term, preserving the missing-term flag."""
        _validate_grid(model_radius, candidate_minus_bp04_delta_c2_over_c2)
        if (model_radius[0] > self.radius_ascending[0] or
                model_radius[-1] < self.radius_ascending[-1]):
            raise ValueError("model radius grid does not cover full kernel support")
        sampled = [_interpolate(model_radius, candidate_minus_bp04_delta_c2_over_c2, r)
                   for r in self.radius_ascending]
        selected = self.table3_indices if table3_only else tuple(range(len(self.solution_rows)))
        predictions = [0.0] * len(selected)
        for i in range(len(self.radius_ascending) - 1):
            dr = self.radius_ascending[i + 1] - self.radius_ascending[i]
            left, right = self.kernel_rows_ascending[i], self.kernel_rows_ascending[i + 1]
            for out, column in enumerate(selected):
                predictions[out] += 0.5 * (left[column] * sampled[i] +
                                            right[column] * sampled[i + 1]) * dr
        rows = []
        for column, predicted in zip(selected, predictions):
            author = self.solution_rows[column]
            rows.append({
                "authorRow": column + 1,
                "secondQuartileRadius": author[4],
                "observedSunMinusBP04DeltaC2OverC2": author[7],
                "solutionError": author[8],
                "candidateMinusBP04PrimaryKernelTerm": predicted,
                "observedMinusPrimaryTerm": author[7] - predicted,
            })
        return {
            "schemaVersion": "g1-bison13-sound-speed-primary-operator/1",
            "status": "DIAGNOSTIC_PRIMARY_TERM_ONLY",
            "admissionAllowed": False,
            "fullKernelSupport": [self.radius_ascending[0], self.radius_ascending[-1]],
            "crossTermIncluded": False,
            "referenceProfileBound": False,
            "rows": rows,
        }
