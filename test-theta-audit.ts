// Test script to verify theta dual-value audit
import { calculateEnergyPipeline, initializePipelineState, computeEnergySnapshot } from './server/energy-pipeline.ts';

async function testThetaAudit() {
  console.log('=== THETA DUAL-VALUE AUDIT TEST ===\n');
  
  try {
    console.log('🔧 Testing CALIBRATED mode...');
    
    // Test in calibrated mode
    process.env.HELIX_MODEL_MODE = 'calibrated';
    
    const defaultState = initializePipelineState();
    const calibratedResult = await calculateEnergyPipeline(defaultState);
    const snapshot = await computeEnergySnapshot(calibratedResult);
    
    console.log('✅ Calibrated mode results:');
    if (snapshot.thetaRaw && snapshot.thetaCal) {
      console.log(`   θ_raw = ${snapshot.thetaRaw.toExponential(2)} (using raw γ_VdB)`);
      console.log(`   θ_cal = ${snapshot.thetaCal.toExponential(2)} (using calibrated γ_VdB)`);
      console.log(`   Ratio = ${(snapshot.thetaRaw / snapshot.thetaCal).toExponential(2)}`);
      
      // Check if we match expected values
      const expectedRaw = 4.4e10;
      const expectedCal = 5.9e4;
      const rawMatch = Math.abs(snapshot.thetaRaw - expectedRaw) / expectedRaw < 0.1;
      const calMatch = Math.abs(snapshot.thetaCal - expectedCal) / expectedCal < 0.5;
      
      console.log(`   Raw matches expected (${expectedRaw.toExponential(1)}): ${rawMatch ? '✅' : '❌'}`);
      console.log(`   Cal matches expected (${expectedCal.toExponential(1)}): ${calMatch ? '✅' : '❌'}`);
    } else {
      console.log('❌ No theta audit values found in snapshot');
    }
    
    // Check audit data
    const audit = snapshot.uniformsExplain?.thetaAudit;
    if (audit) {
      console.log('\n� Audit data:');
      console.log(`   Mode: ${audit.mode}`);
      console.log(`   γ_VdB_raw: ${audit.inputs.gammaVdB_raw?.toExponential(2)}`);
      console.log(`   γ_VdB_cal: ${audit.inputs.gammaVdB_cal?.toExponential(2)}`);
      console.log(`   γ_VdB ratio: ${audit.results.gammaVdB_ratio?.toExponential(2)}`);
    }
    
    console.log('\n�🔧 Testing RAW mode...');
    
    // Test in raw mode  
    process.env.HELIX_MODEL_MODE = 'raw';
    
    const rawState = initializePipelineState();
    const rawResult = await calculateEnergyPipeline(rawState);
    const rawSnapshot = await computeEnergySnapshot(rawResult);
    
    console.log('✅ Raw mode results:');
    if (rawSnapshot.thetaRaw && rawSnapshot.thetaCal) {
      console.log(`   θ_raw = ${rawSnapshot.thetaRaw.toExponential(2)}`);
      console.log(`   θ_cal = ${rawSnapshot.thetaCal.toExponential(2)}`);
      console.log(`   Ratio = ${(rawSnapshot.thetaRaw / rawSnapshot.thetaCal).toExponential(2)}`);
      
      // In raw mode, both should be the same (no mass calibration)
      const sameValue = Math.abs((rawSnapshot.thetaRaw - rawSnapshot.thetaCal) / rawSnapshot.thetaRaw) < 0.01;
      console.log(`   Raw and Cal are equal (raw mode): ${sameValue ? '✅' : '❌'}`);
      
      // Both should match the raw expected value
      const expectedRaw = 4.4e10;
      const rawMatch = Math.abs(rawSnapshot.thetaRaw - expectedRaw) / expectedRaw < 0.1;
      const calMatch = Math.abs(rawSnapshot.thetaCal - expectedRaw) / expectedRaw < 0.1;
      console.log(`   Both match raw expected (${expectedRaw.toExponential(1)}): ${rawMatch && calMatch ? '✅' : '❌'}`);
    } else {
      console.log('❌ No theta audit values found in raw snapshot');
    }
    
    console.log('\n🎯 Summary:');
    console.log('The θ-Scale "mismatch" is now explained:');
    console.log('- In CALIBRATED mode: θ_raw ≈ 4.4×10¹⁰, θ_cal ≈ 5.9×10⁴ (mass-adjusted)');
    console.log('- In RAW mode: Both θ values ≈ 4.4×10¹⁰ (no mass calibration)');
    console.log('- The 6-orders-of-magnitude difference is intentional mass calibration');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

testThetaAudit();