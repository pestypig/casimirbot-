# Casimir-Tile Research Modules

This directory contains the modular physics components for the Casimir-Tile research platform.

## Module Structure

### Core Modules (Active)
- `sim_core/` - Static Casimir calculations (SCUFF-EM FSC method)
- `geom/` - Mesh generation and geometry tools

### Expansion Modules (Planned)
- `dynamic/` - Dynamic Casimir Effects (DCE) with moving boundaries
- `array/` - N×N tile lattice calculations
- `materials/` - Advanced material models (Nb₃Sn, frequency-dependent)
- `analysis/` - Data processing and visualization tools

### Key entry points
- `modules/core/module-registry.ts` registers module metadata and exports.
- `modules/dynamic/gates/index.ts` centralizes dynamic gate hooks.
- `modules/environment/context.ts` defines shared environment context wiring.
- `modules/gr/stress-energy-integrals.ts` hosts GR stress-energy integral helpers.
- `modules/sim_core/casimir-inference.ts` collects Casimir inference routines.
- `modules/star-client/index.ts` exposes the star client module surface.

## Integration Points

Each module integrates with the core simulation engine through:
- Shared physics constants and formulas
- Common data schemas
- Unified API endpoints
- Consistent file formats

## Development Approach

Modules are designed to be:
- **Independent**: Can be developed and tested separately
- **Compatible**: Share common interfaces and data structures
- **Scalable**: Support research-grade computations
- **Scientific**: Maintain authentic physics accuracy
