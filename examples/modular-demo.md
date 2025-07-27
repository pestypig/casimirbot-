# Modular Casimir-Tile Platform Demo

This example demonstrates how the modular architecture enables systematic expansion of Casimir physics capabilities.

## Current Implementation: Static Module ✓

```typescript
// Static Casimir calculations using authentic SCUFF-EM physics
const staticResults = await moduleRegistry.calculate('static', {
  geometry: 'bowl',
  gap: 10,        // nm
  radius: 1000,   // µm  
  sagDepth: 50,   // nm
  temperature: 20 // K
});

console.log(`Energy: ${staticResults.totalEnergy.toExponential(3)} J`);
console.log(`PFA Correction: ${staticResults.pfaCorrection}`);
console.log(`Xi Points: ${staticResults.xiPoints}`);
```

## Future Expansion Examples

### Dynamic Casimir Module (Planned)
```typescript
// Moving boundary simulations with MEEP integration
const dynamicResults = await moduleRegistry.calculate('dynamic', {
  geometry: 'parallel_plate',
  gap: 10,
  radius: 1000,
  moduleType: 'dynamic',
  dynamicConfig: {
    frequency: 1e6,    // 1 MHz oscillation
    amplitude: 50,     // ±50 pm stroke
    phases: 100        // Time steps
  }
});

console.log(`Photon Creation Rate: ${dynamicResults.photonRate} s⁻¹`);
console.log(`DCE Energy Gain: ${dynamicResults.energyGain.toExponential(3)} J`);
```

### Array Module (Planned)
```typescript
// N×N tile array with collective effects
const arrayResults = await moduleRegistry.calculate('array', {
  geometry: 'parallel_plate',
  gap: 10,
  radius: 1000,
  moduleType: 'array',
  arrayConfig: {
    size: 5,           // 5×5 array (25 tiles)
    spacing: 2000,     // 2 mm between tile centers
    coherence: true    // Include coherent superposition
  }
});

console.log(`Total Array Energy: ${arrayResults.totalEnergy.toExponential(3)} J`);
console.log(`Collective Enhancement: ${arrayResults.enhancement}×`);
console.log(`Stress-Energy Tensor: ${arrayResults.tmunu}`);
```

## Module Integration Benefits

1. **Scientific Accuracy**: Each module uses authentic physics formulas
2. **Independent Development**: Modules can be built and tested separately  
3. **Shared Foundation**: Common physics constants and data structures
4. **Scalable Architecture**: Add new capabilities without breaking existing code
5. **Research Workflow**: Academic-grade calculations and outputs

## Computational Scaling

| Module | Complexity | Typical Runtime | Memory Usage |
|--------|------------|----------------|--------------|
| Static | O(N log N) | 2-5 minutes | ~100 MB |
| Dynamic | O(N²) | 10-30 minutes | ~500 MB |
| Array | O(N³) | 1-5 hours | ~2-10 GB |

Where N represents mesh density or array size.

## Data Flow Architecture

```
User Input → Schema Validation → Module Registry → Physics Engine → Scientific Results
     ↓              ↓                    ↓              ↓               ↓
Parameter     Type Safety      Module       Authentic      Research
Validation    & Defaults       Selection    Formulas       Outputs
```

This modular approach transforms our current tool into a comprehensive research platform while preserving the scientific accuracy we've established.