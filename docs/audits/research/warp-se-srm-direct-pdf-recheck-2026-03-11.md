# SEM+Ellips NIST SRM Archive Direct-PDF Recheck (2026-03-11)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Record a direct page-level recheck of the NIST SRM archive PDFs for the Si/SiO2 ellipsometry family to verify whether serial-specific certified thickness/uncertainty tables are visible in accessible scans.

## Reviewed Archive PDFs

| source_id | certificate | url |
|---|---|---|
| SRC-086 | SRM 2530-1 | https://tsapps.nist.gov/srmext/certificates/archives/2530-1.pdf |
| SRC-086 | SRM 2530-2 | https://tsapps.nist.gov/srmext/certificates/archives/2530-2.pdf |
| SRC-086 | SRM 2530-3 | https://tsapps.nist.gov/srmext/certificates/archives/2530-3.pdf |
| SRC-087 | SRM 2531 | https://tsapps.nist.gov/srmext/certificates/archives/2531.pdf |
| SRC-088 | SRM 2532 | https://tsapps.nist.gov/srmext/certificates/archives/2532.pdf |
| SRC-089 | SRM 2533 | https://tsapps.nist.gov/srmext/certificates/archives/2533.pdf |
| SRC-090 | SRM 2534 | https://tsapps.nist.gov/srmext/certificates/archives/2534.pdf |
| SRC-091 | SRM 2535 | https://tsapps.nist.gov/srmext/certificates/archives/2535.pdf |
| SRC-092 | SRM 2536 | https://tsapps.nist.gov/srmext/certificates/archives/2536.pdf |

## Findings
1. Accessible archive pages contain nominal SRM class framing, wavelength/method text, and addendum/process anchors.
2. Accessible archive pages do not show populated serial-specific certified thickness/expanded-uncertainty tables for these certificates.
3. Existing registry posture remains correct: serial-specific fields stay `UNKNOWN`/`partial` and reportable decisions remain fail-closed until serial-resolved certificate surfaces or in-house paired-run covariance evidence are available.

## Traceability Updates
- Registry anchor: `EXP-SE-042` in `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`.
- Equation trace note: `EQT-086-01` in `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`.
- Machine-readable calibration log: `docs/specs/data/srm-si-sio2-calibration-v1.json` (`revalidation_log`).

