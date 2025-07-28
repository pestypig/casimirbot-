#!/usr/bin/env tsx
/**
 * Phase Diagram Validation Tool
 * Command-line utility to validate viability function accuracy
 */

import { runViabilityValidation } from '../tests/viability-validation';

console.log('🔬 Phase Diagram Validation Tool');
console.log('Validating that the teal sliver represents authentic physics calculations...\n');

try {
  runViabilityValidation();
} catch (error) {
  console.error('❌ Validation failed with error:', error);
  process.exit(1);
}

console.log('\n✨ Validation complete! Check results above.');