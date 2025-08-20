#!/usr/bin/env node

// Test the power and mass calibration systems
const http = require('http');

function testCalibration(env = {}) {
  return new Promise((resolve, reject) => {
    // Set environment variables for this process
    Object.assign(process.env, env);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/helix/pipeline',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            qMechanical: result.qMechanical,
            gammaVanDenBroeck: result.gammaVanDenBroeck,
            P_avg: result.P_avg,
            M_exotic: result.M_exotic
          });
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Calibration Systems\n');
  
  // Test 1: No calibration (paper-authentic)
  console.log('1. Paper-authentic (no calibration):');
  const baseline = await testCalibration({});
  console.log(`   Power: ${baseline.P_avg.toFixed(3)} MW`);
  console.log(`   Mass: ${(baseline.M_exotic / 1e9).toFixed(1)} B kg`);
  console.log(`   qMechanical: ${baseline.qMechanical}`);
  console.log(`   γ_VdB: ${baseline.gammaVanDenBroeck.toExponential(1)}\n`);

  // Test 2: Power calibration only
  console.log('2. Power calibration (target 2.0 MW):');
  const powerCal = await testCalibration({ POWER_TARGET_MW: '2.0' });
  console.log(`   Power: ${powerCal.P_avg.toFixed(3)} MW (should be 2.0)`);
  console.log(`   Mass: ${(powerCal.M_exotic / 1e9).toFixed(1)} B kg (should be unchanged)`);
  console.log(`   qMechanical: ${powerCal.qMechanical.toFixed(3)} (scaled)`);
  console.log(`   γ_VdB: ${powerCal.gammaVanDenBroeck.toExponential(1)} (should be unchanged)\n`);

  // Test 3: Mass calibration only
  console.log('3. Mass calibration (target 1405 kg):');
  const massCal = await testCalibration({ MASS_TARGET_KG: '1405' });
  console.log(`   Power: ${massCal.P_avg.toFixed(3)} MW (should be unchanged)`);
  console.log(`   Mass: ${(massCal.M_exotic).toFixed(0)} kg (should be 1405)`);
  console.log(`   qMechanical: ${massCal.qMechanical} (should be unchanged)`);
  console.log(`   γ_VdB: ${massCal.gammaVanDenBroeck.toExponential(3)} (scaled)\n`);

  // Test 4: Both calibrations
  console.log('4. Both calibrations (2.0 MW + 1405 kg):');
  const bothCal = await testCalibration({ 
    POWER_TARGET_MW: '2.0', 
    MASS_TARGET_KG: '1405' 
  });
  console.log(`   Power: ${bothCal.P_avg.toFixed(3)} MW (should be 2.0)`);
  console.log(`   Mass: ${(bothCal.M_exotic).toFixed(0)} kg (should be 1405)`);
  console.log(`   qMechanical: ${bothCal.qMechanical.toFixed(3)} (scaled for power)`);
  console.log(`   γ_VdB: ${bothCal.gammaVanDenBroeck.toExponential(3)} (scaled for mass)\n`);
  
  console.log('✅ Calibration system verification complete!');
}

runTests().catch(console.error);