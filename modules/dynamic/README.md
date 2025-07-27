# Dynamic Casimir Effects Module

This module will implement time-dependent Casimir calculations for moving boundary simulations.

## Planned Features

### Moving Boundary Simulations
- Piezoelectric actuator modeling (±50 pm strokes)
- Time-domain electromagnetic calculations
- MEEP integration for FDTD methods
- Resonant cavity analysis

### Dynamic Effects
- Photon creation from moving mirrors
- Parametric amplification
- Non-equilibrium fluctuations
- Q-factor calculations

### Applications
- Superconducting resonator dynamics
- MEMS actuator optimization
- Quantum optics experiments
- Energy harvesting studies

## Technical Implementation

### MEEP Integration
- Moving boundary FDTD simulations
- Frequency-domain analysis
- Custom material models
- Parallel computing support

### Physics Models
- Non-adiabatic motion effects
- Dissipation and losses
- Temperature-dependent dynamics
- Coherent state evolution

## Scientific References

1. Moore, "Quantum theory of the electromagnetic field in a variable-length one-dimensional cavity," J. Math. Phys. 11, 2679 (1970)
2. Dodonov, "Current status of the dynamical Casimir effect," Phys. Scr. 82, 038105 (2010)
3. Wilson et al., "Observation of the dynamical Casimir effect in a superconducting circuit," Nature 479, 376 (2011)

## Integration Points

- Extends static calculations from `sim_core/`
- Uses geometries from `geom/` module
- Outputs time-series data
- Compatible with array simulations