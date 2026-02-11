# Warp Geometry Sigma-to-Delta Policy (M5)

Status: draft  
Owner: dan  
Scope: Canonical sigma-to-wall thickness mapping

## Purpose
Define a canonical sigma-to-Delta mapping with explicit citation and label any alternative operational definitions.

## Canonical Mapping (Cited)
Use the Pfenning–Ford mapping as the default sigma-to-Delta relationship for Alcubierre-style profiles.

```text
Delta = ((1 + tanh^2(sigma R))^2) / (2 sigma tanh(sigma R))
```

Large sigma R limit:
```text
Delta ≈ 2 / sigma
```

## Operational Alternatives (Implementation-Defined)
- 10–90 percent thickness: Delta_p ≈ (2 / sigma) * artanh(1 - 2p) for a chosen p (for example, p = 0.1).
- FWHM of |f'(r)|: Delta_FWHM ≈ (2 * arcosh(sqrt(2))) / sigma.

These are useful for engineering defaults but must be labeled as implementation-defined rather than paper defaults.

## Kickoff Checklist
- Confirm the Pfenning–Ford equation number for the canonical mapping.
- Record the chosen canonical mapping and where it will be applied.
- Update documentation where sigma-to-Delta appears to distinguish canonical vs operational mappings.

## Artifacts
- This sigma-to-Delta policy is referenced by Phase M5 in `docs/warp-tree-dag-task.md`.
