/**
 * Visualization Constants for WarpVisualizer.tsx
 * 
 * Centralized constants to replace magic numbers throughout the visualization code.
 * These values control visual aspects like camera settings, canvas dimensions, 
 * grid parameters, and default physics fallbacks.
 * 
 * Architecture: All VIS constants use descriptive names explaining their purpose
 * and context, making the visualization code more self-documenting.
 */

// Grid and span constants
export const spanPaddingDesktop = 1.35;  // Desktop grid span multiplier
export const spanPaddingPortrait = 1.5;  // Portrait mode grid span multiplier  
export const minSpan = 2.6;               // Minimum grid span value

// Camera FOV constants (in radians)
export const fovDesktopRad = Math.PI / 3.272;   // ~55° desktop FOV
export const fovPortraitRad = Math.PI / 2.65;   // ~68° portrait FOV

// Canvas dimensions
export const canvasWidthDefault = 512;   // Default canvas width
export const canvasHeightDefault = 256;  // Default canvas height

// Visual rendering defaults
export const vizGainDefault = 4.0;       // Default visualization gain
export const vizGainEmergency = 2.0;     // Emergency mode viz gain
export const vizGainCruise = 0.8;        // Cruise mode viz gain
export const exposureDefault = 6.0;      // Default exposure level
export const zeroStopDefault = 1e-7;     // Default zero-stop threshold

// Wall width constants
export const defaultWallWidthRho = 0.016;  // Default wall width in ρ-units (16 nm normalized)

// Physics fallback constants
export const tsRatioDefault = 4100;       // Default time-scale ratio
export const tsRatioFallback = 4102.7;    // Fallback time-scale ratio value
export const powerAvgFallback = 83.3;     // Fallback power average (MW)
export const exoticMassFallback = 1405;   // Fallback exotic mass (kg)
export const zetaDefault = 0.032;         // Default zeta parameter