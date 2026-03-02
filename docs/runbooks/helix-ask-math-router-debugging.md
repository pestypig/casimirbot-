# Helix Ask Math Router Debugging Runbook

## Common failure cases
1. `unsupported_prompt` in symbolic lane: matrix literal not detected.
2. `non_finite_result` in numeric lane: expression evaluates to NaN/Inf.
3. `warp_delegation_required`: user asked viability/admissibility outside certificate path.

## Probe prompts
- `det([[a,b],[c,d]])`
- `determinant of 50x50 numeric matrix`
- `treat e as variable and derivative of e^x`
- `is this physically viable?`

## Inspectable fields
- `intent`, `domain`, `representation`
- `assumptions.constants.e`
- `engine`, `verifier`, `confidence`
- Helix debug: `math_solver_reason`, `math_solver_kind`, `math_solver_residual_pass`, `math_solver_residual_max`
