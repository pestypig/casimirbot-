/**
 * Target validation API routes
 * Implements the computational recipe from research paper
 */

import { Router } from 'express';
import { computeTargetValidation, DEFAULT_TARGET_PARAMS } from '../services/target-validation.js';

const router = Router();

/**
 * POST /api/target-validation
 * Compute target validation for given parameters
 */
router.post('/target-validation', (req, res) => {
  try {
    const params = { ...DEFAULT_TARGET_PARAMS, ...req.body };
    const results = computeTargetValidation(params);
    
    res.json({
      success: true,
      params,
      results,
      targetChecks: {
        massTarget: results.massTargetCheck,
        powerTarget: results.powerTargetCheck,
        zetaTarget: results.zetaTargetCheck,
        overallStatus: results.massTargetCheck && results.powerTargetCheck && results.zetaTargetCheck
      }
    });
  } catch (error) {
    console.error('Target validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute target validation'
    });
  }
});

/**
 * GET /api/target-validation/defaults
 * Get default parameters from research paper
 */
router.get('/target-validation/defaults', (req, res) => {
  res.json({
    success: true,
    defaults: DEFAULT_TARGET_PARAMS,
    targets: {
      exoticMass: 1.4e3, // kg
      power: 83e6,       // W (83 MW)
      zetaLimit: 1.0     // quantum safety limit
    }
  });
});

export default router;