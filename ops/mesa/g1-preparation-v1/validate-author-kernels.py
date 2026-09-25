"""Read-only first-pass checks of Basu's emailed BiSON-13 ASCII files.

This checks file shape and the sound-speed Table 3 row mapping. It does not
certify a full structural comparison operator or authorize a G1 model run.
"""

import csv
import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
INTAKE = ROOT / "artifacts/research/g1-basu-author-intake-20260924"
TABLE = ROOT / "configs/research/controlled-stellar-composition-transport-g1-bison13-table3.v1.csv"


def numeric_rows(path: Path, columns: int, comments: bool = False) -> list[list[float]]:
    rows = []
    for line_number, line in enumerate(path.read_text(encoding="ascii").splitlines(), 1):
        if not line.strip() or (comments and line.lstrip().startswith("#")):
            continue
        fields = line.split()
        if len(fields) != columns:
            raise ValueError(f"{path.name}:{line_number}: expected {columns} columns; got {len(fields)}")
        row = [float(value) for value in fields]
        if not all(math.isfinite(value) for value in row):
            raise ValueError(f"{path.name}:{line_number}: nonfinite value")
        rows.append(row)
    return rows


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    solution_path = INTAKE / "cdif.txt"
    kernel_path = INTAKE / "avker.BP04_B4752dRF"
    solution = numeric_rows(solution_path, 9, comments=True)
    kernels = numeric_rows(kernel_path, 77)
    with TABLE.open(newline="", encoding="ascii") as handle:
        published = list(csv.DictReader(handle))
    if len(solution) != 76 or len(kernels) != 2701 or len(published) != 37:
        raise ValueError("unexpected solution, kernel, or published row count")
    radii = [row[0] for row in kernels]
    if not all(radii[i] > radii[i + 1] for i in range(len(radii) - 1)):
        raise ValueError("kernel radius grid is not strictly descending")
    if not all(0 < r < 1.1 for r in radii):
        raise ValueError("kernel radius outside initial physical sanity range")

    # Table 3 sound-speed rows match alternating solution rows by the paper's
    # second-quartile radius convention. The density column is a different grid.
    radius_errors = []
    uncertainty_ratios = []
    for i, row in enumerate(published):
        author = solution[2 * i]
        radius_errors.append(author[4] - float(row["r_c_over_R"]))
        sigma_delta_c2_over_c2 = 2 * float(row["sigma_c_cm_s"]) / float(row["c_cm_s"])
        uncertainty_ratios.append(author[8] / sigma_delta_c2_over_c2)

    # The first-pass normalization check integrates each supplied averaging
    # kernel over the supplied radius grid. Full operator semantics remain open.
    integrals = []
    centroid_errors = []
    quartile_errors = []
    ascending = list(reversed(kernels))
    for col in range(1, 77):
        area = sum((kernels[i][col] + kernels[i + 1][col]) *
                   (radii[i] - radii[i + 1]) / 2
                   for i in range(len(kernels) - 1))
        integrals.append(area)
        moment = sum((ascending[i][0] * ascending[i][col] +
                      ascending[i + 1][0] * ascending[i + 1][col]) *
                     (ascending[i + 1][0] - ascending[i][0]) / 2
                     for i in range(len(ascending) - 1))
        centroid_errors.append(moment / area - solution[col - 1][2])
        cumulative = 0.0
        computed_quartiles = []
        for i in range(len(ascending) - 1):
            lo, hi = ascending[i][0], ascending[i + 1][0]
            step = (ascending[i][col] + ascending[i + 1][col]) * (hi - lo) / 2
            next_cumulative = cumulative + step / area
            while (len(computed_quartiles) < 3 and cumulative <= (len(computed_quartiles) + 1) / 4
                   <= next_cumulative):
                target = (len(computed_quartiles) + 1) / 4
                fraction = (target - cumulative) / (next_cumulative - cumulative)
                computed_quartiles.append(lo + fraction * (hi - lo))
            cumulative = next_cumulative
        if len(computed_quartiles) != 3:
            raise ValueError(f"missing kernel quartile in column {col}")
        quartile_errors.extend(computed_quartiles[i] - solution[col - 1][3 + i]
                               for i in range(3))

    result = {
        "schemaVersion": "g1-basu-author-kernel-intake/1",
        "status": "SHAPE_AND_SOUND_SPEED_ALIGNMENT_CHECKED",
        "source": "Sarbani Basu email received 2026-09-24, Gmail message 1a0d3c87e40fc54f",
        "files": {
            solution_path.name: {"bytes": solution_path.stat().st_size, "sha256": sha256(solution_path),
                                 "dataRows": len(solution), "columns": 9},
            kernel_path.name: {"bytes": kernel_path.stat().st_size, "sha256": sha256(kernel_path),
                               "radialRows": len(kernels), "columns": 77},
        },
        "kernelRadiusRange": [min(radii), max(radii)],
        "table3SoundSpeedRows": len(published),
        "maxAbsSecondQuartileRadiusDifference": max(map(abs, radius_errors)),
        "uncertaintyRatioToTwicePublishedRelativeSoundSpeed": {
            "min": min(uncertainty_ratios), "max": max(uncertainty_ratios)
        },
        "kernelIntegralRange": [min(integrals), max(integrals)],
        "maxAbsKernelCentroidDifference": max(map(abs, centroid_errors)),
        "maxAbsKernelQuartileDifference": max(map(abs, quartile_errors)),
        "claimBoundary": "No density or cross-term kernel, BP04 profile, systematic-error policy, or G1 admission established",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
