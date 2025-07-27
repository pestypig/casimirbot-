# Casimir-Tile Calculator Quality Assurance

This directory contains the quality assurance testing suite for the Casimir-Tile Calculator, implementing the safety-net checklist to ensure calculation accuracy and prevent regression.

## Test Structure

### Core Test Files

- **`test_static.py`** - Static Casimir calculations validation
  - Tests parallel plate analytic formula: `ΔE = −π²ℏc A / (720 a³)`
  - Validates gap scaling behavior: `E₁/E₂ ≈ (a₂/a₁)³`
  - Ensures numerical accuracy within 10% tolerance

- **`test_dynamic.py`** - Dynamic Casimir effects validation
  - Period-frequency relation: `T_m × f_m ≈ 1`
  - Duty factor bounds: `0 ≤ d ≤ 1`
  - Needle Hull paper targets: 1.5 kg per tile, 83 MW total power

- **`test_convergence.py`** - Numerical quality checks
  - Xi points adequacy: ≥5000 for 1nm gaps, ≥3000 for larger gaps
  - Error tolerance: ≤5% numerical uncertainty
  - Quantum safety bounds: Ford-Roman inequality compliance

### Quality Standards

The `golden_standards.json` file contains reference values for regression testing:

```json
{
  "parallel_plate_1nm_25mm": {
    "expected_energy": -1.402e-12,
    "tolerance": 0.05
  },
  "bowl_needle_hull": {
    "expected_mass_per_tile": 1.5,
    "expected_power_total": 83e6,
    "tolerance": 0.05
  }
}
```

## Running Tests

### Quick Test
```bash
cd tests
python run_all_tests.py
```

### Individual Test Modules
```bash
python test_static.py
python test_dynamic.py
python test_convergence.py
```

## Quality Assurance Features

### 1. Real-time Validation
The UI displays live quality metrics in the Analysis Summary:
- ✓/✗ Xi Points Adequacy (≥5000 for 1nm gaps)
- ✓/✗ Error ≤ 5% threshold
- ✓/✗ Quantum Safety status

### 2. Analytic Cross-Validation
Static calculations are validated against exact analytic formulas:
- Parallel plates: Lifshitz formula implementation
- Sphere: Proximity Force Approximation
- Bowl: Curvature-corrected PFA

### 3. Regression Protection
Golden standard files prevent calculation drift:
- Frozen reference outputs for known cases
- Automatic comparison with 5% tolerance
- Fail-fast on unexpected changes

### 4. Physics Bounds Checking
- Duty factors clamped to [0,1] range
- Quantum inequality margin monitoring
- GR validity checks for dynamic effects

## Integration with Development

The test suite serves as:
- **Pre-deployment validation** - Run before any release
- **Regression detection** - Catch calculation changes
- **Parameter validation** - Ensure physics bounds
- **Educational reference** - Document expected behavior

## Error Handling

Tests include comprehensive error handling:
- Network timeouts for API calls
- Numerical precision edge cases
- Invalid parameter combinations
- Simulation failure scenarios

## Future Expansion

The testing framework is designed to accommodate:
- N×N array simulations
- Advanced materials (frequency-dependent)
- Einstein Toolkit stress-energy export
- Real SCUFF-EM binary integration

## Success Criteria

All tests must pass before deployment:
```
TEST RESULTS: 8 passed, 0 failed
🎉 ALL TESTS PASSED - Calculator is verified!
```

This ensures the Casimir-Tile Calculator maintains scientific accuracy and prevents calculation errors from propagating to users.