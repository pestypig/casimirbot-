# Static Casimir Simulation Core

This module implements the foundational static Casimir effect calculations using the scientifically accurate SCUFF-EM Fluctuating Surface Current (FSC) method.

## Features

### Implemented ✓
- Exact Lifshitz formula for parallel plates: E = -π²ℏc/(240d³) × A
- Proximity Force Approximation (PFA) for curved geometries
- Matsubara formalism for finite-temperature effects
- Bowl geometry with sag depth control
- Realistic Xi (imaginary frequency) integration points

### Planned
- Real SCUFF-EM binary integration
- Multi-material support
- Parameter sweep automation
- Enhanced error analysis

## Scientific References

1. Reid et al., "Efficient Computation of Casimir Interactions between Arbitrary 3D Objects," PRL 103, 040401 (2009)
2. Emig et al., "Casimir forces between arbitrary compact objects," PRL 99, 170403 (2007)
3. Lifshitz, "The theory of molecular attractive forces between solids," Soviet Physics JETP 2, 73 (1956)

## API Integration

The module integrates with the main application through:
- `/api/simulations` REST endpoints
- WebSocket progress updates
- Shared data schemas in `shared/schema.ts`
- File generation services