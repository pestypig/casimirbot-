# MESA Runtime Policy

- `fixture_only` is rejected by the MESA repro tool.
- `local`, `docker`, and `wsl` policies must fail clearly when outputs are unavailable.
- Import policies may parse declared MESA-like output files, but the result is
  `mesa_imported_solar_reference`, not reproduced.
- Reproduced artifacts require inlist, profile, history, and run-log hashes.
- All outputs remain proxy-only QST context.
