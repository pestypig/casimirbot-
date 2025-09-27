// Debug script to test theta calculation
import { calculateEnergyPipeline } from './server/energy-pipeline.ts';

// Test with default values
const testState = {
  // Defaults from the code
  gammaGeo: 26,
  qSpoilingFactor: 1,
  gammaVanDenBroeck: 1e11, // Server default
  U_cycle: -1000, // Default target
  N_tiles: 1600, // Default
  sectorCount: 400, // Default
  currentMode: 'cruise',
  temperature_K: 300,
  tileArea_m2: 0.05 * 0.05,
  burstDuration_us: 1000,
  cycleDuration_us: 100000,
  strobing: {
    sectorStrobing: 1,
    sectorCount: 400
  }
};

console.log('=== THETA DEBUG TEST ===');
console.log('Input values:');
console.log(`  γ_geo = ${testState.gammaGeo}`);
console.log(`  γ_geo³ = ${Math.pow(testState.gammaGeo, 3)}`);
console.log(`  q = ${testState.qSpoilingFactor}`);
console.log(`  γ_VdB = ${testState.gammaVanDenBroeck}`);

// Calculate duty_FR manually
const BURST_DUTY_LOCAL = 0.01;
const S_live = 1; // cruise mode
const S_total = 400;
const dutyEffectiveFR = BURST_DUTY_LOCAL * (S_live / S_total);
console.log(`  d_eff = ${dutyEffectiveFR} (${BURST_DUTY_LOCAL} * ${S_live}/${S_total})`);

// Calculate expected theta
const expectedTheta = Math.pow(testState.gammaGeo, 3) * testState.qSpoilingFactor * testState.gammaVanDenBroeck * dutyEffectiveFR;
console.log(`\nExpected θ = ${testState.gammaGeo}³ × ${testState.qSpoilingFactor} × ${testState.gammaVanDenBroeck} × ${dutyEffectiveFR}`);
console.log(`Expected θ = ${expectedTheta} = ${expectedTheta.toExponential(2)}`);

try {
  // Run the actual pipeline calculation
  const result = await calculateEnergyPipeline(testState);
  console.log(`\nPipeline θ = ${(result as any).thetaScaleExpected}`);
  
  if ((result as any).thetaScaleExpected) {
    const ratio = expectedTheta / (result as any).thetaScaleExpected;
    console.log(`Ratio (expected/pipeline) = ${ratio.toExponential(2)}`);
    
    if (Math.abs(Math.log10(ratio)) > 0.1) {
      console.log('⚠️  MISMATCH DETECTED!');
    } else {
      console.log('✅ Values match');
    }
  }
} catch (error) {
  console.error('Error running pipeline:', error);
}